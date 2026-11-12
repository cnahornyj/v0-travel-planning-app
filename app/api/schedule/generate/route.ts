import { APICallError, generateText, Output, RetryError } from "ai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { z } from "zod"
import {
  assignPlacesToDays,
  buildDayContexts,
  placeRemaining,
  rejectionReason,
  validateDay,
  type DayContext,
  type PlanningPlace,
} from "@/lib/ai-schedule/planner"
import { getOpenIntervals, hasKnownHours, inferSetting, minutesToTime, travelMinutes } from "@/lib/ai-schedule/time"
import { getWeatherForDates } from "@/lib/ai-schedule/weather"
import type {
  DayWeather,
  GeneratedPlan,
  PlaceUpdate,
  PlannedDay,
  StreamMessage,
  UnplacedPlace,
} from "@/lib/ai-schedule/types"

export const maxDuration = 300

const geminiApiKey = process.env.API ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY
const google = createGoogleGenerativeAI({ apiKey: geminiApiKey })
const MODEL = "gemini-3.5-flash"

const timeString = z.string().regex(/^\d{2}:\d{2}$/)
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

const requestSchema = z.object({
  places: z
    .array(
      z.object({
        id: z.string().max(300),
        name: z.string().min(1).max(300),
        address: z.string().max(500).optional(),
        lat: z.number(),
        lng: z.number(),
        type: z.string().max(100).optional(),
        tags: z.array(z.string().max(100)).max(30).optional(),
        estimatedDuration: z.number().int().positive().max(1440).optional(),
        visitPreference: z.enum(["morning", "afternoon", "evening", "night", "anytime"]).optional(),
        setting: z.enum(["indoor", "outdoor", "mixed"]).optional(),
        openingHours: z
          .object({
            periods: z
              .array(
                z.object({
                  open: z.object({ day: z.number(), time: z.string() }),
                  close: z.object({ day: z.number(), time: z.string() }).optional(),
                }),
              )
              .max(50),
            weekdayText: z.array(z.string().max(200)).max(14),
          })
          .optional(),
      }),
    )
    .min(1)
    .max(80),
  events: z
    .array(z.object({ placeId: z.string(), date: dateString, startTime: timeString, duration: z.number().int().min(0).max(1440) }))
    .max(500),
  dates: z.array(dateString).min(1).max(31),
  today: dateString,
  options: z.object({
    pace: z.enum(["relaxed", "balanced", "intense"]),
    dayStart: timeString,
    dayEnd: timeString,
    travelMode: z.enum(["walking", "transit", "driving"]),
    lunchBreak: z.boolean(),
    instructions: z.string().max(1000).optional(),
    arrival: z.object({ date: dateString, time: timeString }).optional(),
    departure: z.object({ date: dateString, time: timeString }).optional(),
  }),
})

function describeWindow(day: DayContext, options: RequestBody["options"]): string {
  const notes = [
    options.arrival?.date === day.date ? `arrivée à ${options.arrival.time}` : null,
    options.departure?.date === day.date ? `départ à ${options.departure.time}` : null,
  ].filter(Boolean)
  const suffix = notes.length ? ` (${notes.join(", ")})` : ""
  if (day.window.end <= day.window.start) return `aucune visite possible${suffix}`
  return `${minutesToTime(day.window.start)}–${minutesToTime(day.window.end)}${suffix}`
}

type RequestBody = z.infer<typeof requestSchema>
type RequestPlace = RequestBody["places"][number]

const DAY_LABELS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"]
const PACE_LABELS = { relaxed: "détendu (peu d'étapes, pauses)", balanced: "équilibré", intense: "intense (journées remplies)" }
const MODE_LABELS = { walking: "à pied", transit: "transports en commun", driving: "voiture" }
const SETTING_LABELS = { indoor: "intérieur", outdoor: "extérieur", mixed: "mixte" }

function aiErrorMessage(error: unknown): string {
  const cause = RetryError.isInstance(error) ? error.lastError : error
  const status = APICallError.isInstance(cause) ? cause.statusCode : undefined
  if (!geminiApiKey) return "L'IA n'est pas configurée : ajoutez la clé Gemini dans la variable API."
  if (status === 402) return "Crédits Gemini épuisés : rechargez votre projet sur Google AI Studio."
  if (status === 429) return "Quota Gemini atteint, réessayez dans quelques instants."
  if (status === 401 || status === 403) return "Clé Gemini refusée : vérifiez la variable API."
  return "L'IA n'a pas pu répondre."
}

async function enrichPlaces(places: RequestPlace[], warnings: string[]): Promise<Record<string, PlaceUpdate>> {
  const updates: Record<string, PlaceUpdate> = {}
  const needsAi: Array<{ place: RequestPlace; fields: string[] }> = []

  for (const place of places) {
    const update: PlaceUpdate = {}
    if (!place.setting) {
      const inferred = inferSetting(place)
      if (inferred) update.setting = inferred
    }
    const fields: string[] = []
    if (!place.setting && !update.setting) fields.push("setting")
    if (!hasKnownHours(place)) fields.push("openingHours")
    if (!place.estimatedDuration) fields.push("estimatedDuration")
    if (fields.length) needsAi.push({ place, fields })
    if (Object.keys(update).length) updates[place.id] = update
  }

  if (needsAi.length === 0) return updates

  const batch = needsAi.slice(0, 25)
  try {
    const { output } = await generateText({
      model: google(MODEL),
      tools: { google_search: google.tools.googleSearch({}) },
      output: Output.object({
        schema: z.object({
          places: z.array(
            z.object({
              ref: z.string().describe("Référence du lieu, par ex. L1"),
              setting: z.enum(["indoor", "outdoor", "mixed"]).nullable(),
              openingHours: z
                .array(z.string())
                .nullable()
                .describe('Exactement 7 lignes de "Lundi: 09:00 – 18:00" (ou "Lundi: Fermé") à "Dimanche: ...", ou null si incertain'),
              estimatedDuration: z.number().int().nullable().describe("Durée de visite typique en minutes"),
            }),
          ),
        }),
      }),
      system:
        "Tu complètes des fiches de lieux touristiques pour un planificateur de voyage. " +
        "Utilise la recherche Google pour vérifier les horaires actuels. " +
        "setting : indoor (musée, restaurant...), outdoor (parc, plage, randonnée...), mixed (château avec jardins, marché...). " +
        "N'invente jamais d'horaires : renvoie null si tu n'es pas raisonnablement sûr.",
      prompt: batch
        .map(
          ({ place, fields }, index) =>
            `L${index + 1} — ${place.name}${place.address ? `, ${place.address}` : ""}${place.type ? ` (type : ${place.type})` : ""} → à compléter : ${fields.join(", ")}`,
        )
        .join("\n"),
    })

    for (const result of output.places) {
      const entry = batch[Number(result.ref.replace(/\D/g, "")) - 1]
      if (!entry) continue
      const update: PlaceUpdate = updates[entry.place.id] ?? {}
      if (entry.fields.includes("setting") && result.setting) update.setting = result.setting
      if (entry.fields.includes("openingHours") && result.openingHours?.length === 7) {
        update.openingHours = { periods: [], weekdayText: result.openingHours }
      }
      if (entry.fields.includes("estimatedDuration") && result.estimatedDuration && result.estimatedDuration > 0) {
        update.estimatedDuration = Math.min(Math.round(result.estimatedDuration / 5) * 5, 12 * 60)
      }
      if (Object.keys(update).length) updates[entry.place.id] = update
    }
  } catch (error) {
    console.error("[v0] Schedule enrichment error:", error)
    warnings.push(`Infos manquantes non complétées. ${aiErrorMessage(error)}`)
  }

  return updates
}

function describeWeather(weather: DayWeather | null): string {
  if (!weather) return "météo inconnue"
  const base = `${weather.kind === "forecast" ? "prévision" : "tendance saisonnière"} : ${weather.label}, ${weather.tempMin}–${weather.tempMax}°C, risque de pluie ${weather.precipitationProbability}%, vent ${weather.windMax} km/h`
  if (!weather.periods) return base
  return `${base} (pluie matin ${weather.periods.morning}%, après-midi ${weather.periods.afternoon}%, soir ${weather.periods.evening}%)`
}

function describeHours(place: PlanningPlace, date: string): string {
  const open = getOpenIntervals(place, date)
  if (open === null) return "horaires inconnus"
  if (open.length === 0) return "FERMÉ"
  return open.map((interval) => `${minutesToTime(interval.start)}–${minutesToTime(interval.end)}`).join(", ")
}

const planSchema = z.object({
  days: z.array(
    z.object({
      date: z.string(),
      summary: z.string().describe("Une phrase résumant la journée (quartier, ambiance, météo)"),
      steps: z.array(
        z.object({
          ref: z.string().describe("Référence du lieu, par ex. P3"),
          startTime: z.string().describe("HH:MM"),
          duration: z.number().int().describe("Durée en minutes"),
          reason: z.string().describe("Justification courte (moins de 15 mots)"),
        }),
      ),
    }),
  ),
  unplaced: z.array(z.object({ ref: z.string(), reason: z.string() })),
})

async function planWithAi(
  days: DayContext[],
  assignment: Map<string, PlanningPlace[]>,
  places: PlanningPlace[],
  options: RequestBody["options"],
) {
  const refs = new Map(places.map((place, index) => [`P${index + 1}`, place]))
  const refOf = new Map(places.map((place, index) => [place.id, `P${index + 1}`]))

  const placeLines = places.map((place) => {
    const hours = days.map((day) => `${day.date.slice(5)} ${describeHours(place, day.date)}`).join(" | ")
    return `${refOf.get(place.id)} ${place.name} — ${place.duration} min, ${place.setting ? SETTING_LABELS[place.setting] : "intérieur/extérieur inconnu"}, moment préféré : ${place.visitPreference ?? "indifférent"}, horaires : ${hours}`
  })

  const dayBlocks = days.map((day) => {
    const suggested = assignment.get(day.date) ?? []
    const travel = suggested
      .flatMap((a, i) => suggested.slice(i + 1).map((b) => `${refOf.get(a.id)}↔${refOf.get(b.id)} ${travelMinutes(a, b, options.travelMode)} min`))
      .slice(0, 40)
    return [
      `## ${day.date} (${DAY_LABELS[new Date(`${day.date}T12:00:00Z`).getUTCDay()]})`,
      `Plage disponible : ${describeWindow(day, options)}`,
      `Météo : ${describeWeather(day.weather)}`,
      `Créneaux déjà pris : ${day.busy.length ? day.busy.map((b) => `${minutesToTime(b.start)}–${minutesToTime(b.end)}`).join(", ") : "aucun"}`,
      `Lieux suggérés (groupés par proximité) : ${suggested.map((p) => refOf.get(p.id)).join(", ") || "aucun"}`,
      travel.length ? `Trajets estimés : ${travel.join(", ")}` : null,
    ]
      .filter(Boolean)
      .join("\n")
  })

  const { output } = await generateText({
    model: google(MODEL),
    output: Output.object({ schema: planSchema }),
    system: [
      "Tu es un planificateur de voyage expert. Tu construis un planning jour par jour à partir UNIQUEMENT des lieux fournis (n'en ajoute jamais).",
      "Priorités, dans cet ordre :",
      "1. Horaires d'ouverture : une visite doit commencer et finir pendant l'ouverture. Ne place jamais un lieu un jour où il est FERMÉ.",
      "2. Proximité : garde les regroupements suggérés et enchaîne les lieux proches pour limiter les trajets. Laisse le temps de trajet entre deux étapes.",
      "3. Météo : extérieur les jours/moments secs, intérieur quand il pleut ; en forte chaleur (>30°C) l'extérieur le matin. Tu peux déplacer un lieu vers un autre jour pour ces raisons, en l'expliquant.",
      "4. Préférences de l'utilisateur (moment préféré du lieu, rythme, consigne).",
      "Chaque visite doit tenir entièrement dans la plage disponible du jour (réduite les jours d'arrivée et de départ). Ne planifie rien un jour sans plage disponible. Ne chevauche jamais les créneaux déjà pris.",
      "Le jour d'arrivée, privilégie une visite courte et proche ; le jour de départ, rien de lointain.",
      options.lunchBreak ? "Laisse libre la pause déjeuner de 12:30 à 14:00 (sauf pour un restaurant)." : null,
      "Chaque lieu apparaît au plus une fois. Si un lieu ne peut pas être placé, mets-le dans unplaced avec la raison.",
      "Rédige les justifications et résumés en français, de façon concise.",
    ]
      .filter(Boolean)
      .join("\n"),
    prompt: [
      `Rythme : ${PACE_LABELS[options.pace]}. Déplacements : ${MODE_LABELS[options.travelMode]}.`,
      options.instructions ? `Consigne de l'utilisateur : ${options.instructions}` : null,
      "",
      "# Lieux",
      ...placeLines,
      "",
      "# Jours",
      ...dayBlocks,
    ]
      .filter((line) => line !== null)
      .join("\n"),
  })

  return {
    days: output.days.map((day) => ({
      date: day.date,
      summary: day.summary,
      steps: day.steps
        .map((step) => ({ placeId: refs.get(step.ref.trim())?.id ?? "", startTime: step.startTime, duration: step.duration, reason: step.reason }))
        .filter((step) => step.placeId),
    })),
    unplaced: output.unplaced
      .map((entry) => ({ placeId: refs.get(entry.ref.trim())?.id ?? "", reason: entry.reason }))
      .filter((entry) => entry.placeId),
  }
}

async function generatePlan(body: RequestBody, send: (message: StreamMessage) => void): Promise<GeneratedPlan> {
  const warnings: string[] = []

  send({ type: "step", step: "places" })
  const placeUpdates = await enrichPlaces(body.places, warnings)
  const planningPlaces: PlanningPlace[] = body.places.map((place) => {
    const update = placeUpdates[place.id] ?? {}
    return {
      ...place,
      setting: place.setting ?? update.setting,
      openingHours: hasKnownHours(place) ? place.openingHours : (update.openingHours ?? place.openingHours),
      duration: place.estimatedDuration ?? update.estimatedDuration ?? 90,
    }
  })
  const placesById = new Map(planningPlaces.map((place) => [place.id, place]))

  send({ type: "step", step: "weather" })
  const center = {
    lat: planningPlaces.reduce((sum, p) => sum + p.lat, 0) / planningPlaces.length,
    lng: planningPlaces.reduce((sum, p) => sum + p.lng, 0) / planningPlaces.length,
  }
  const weather = await getWeatherForDates(center.lat, center.lng, body.dates, body.today)
  if (weather.size === 0) warnings.push("Météo indisponible : le planning ne tient pas compte du temps.")

  send({ type: "step", step: "planning" })
  const days = buildDayContexts(body.dates, body.events, body.options, weather)
  const assignment = assignPlacesToDays(planningPlaces, days)

  let aiPlan: Awaited<ReturnType<typeof planWithAi>> | null = null
  try {
    aiPlan = await planWithAi(days, assignment, planningPlaces, body.options)
  } catch (error) {
    console.error("[v0] Schedule planning AI error:", error)
    warnings.push(`${aiErrorMessage(error)} Planning calculé automatiquement (proximité et horaires uniquement).`)
  }

  const planned = new Set<string>()
  const unplaced: UnplacedPlace[] = []
  const resultDays: PlannedDay[] = days.map((day) => {
    const proposal = aiPlan?.days.find((d) => d.date === day.date)
    const { steps, rejected } = validateDay(day, proposal?.steps ?? [], placesById, body.options.travelMode, planned)
    unplaced.push(...rejected)
    return { date: day.date, weather: day.weather, summary: proposal?.summary ?? "", steps }
  })

  const aiUnplaced = new Map((aiPlan?.unplaced ?? []).map((entry) => [entry.placeId, entry.reason]))
  const rejectedIds = new Set(unplaced.map((entry) => entry.placeId))
  const leftovers = planningPlaces.filter((place) => !planned.has(place.id) && !aiUnplaced.has(place.id))
  const fallbackReason = aiPlan ? "Ajouté automatiquement près des autres étapes" : "Placé selon la proximité et les horaires"

  for (const place of leftovers) {
    const preferred = [...assignment.entries()].find(([, list]) => list.some((p) => p.id === place.id))?.[0]
    const order = [...days].sort((a, b) => (a.date === preferred ? -1 : b.date === preferred ? 1 : 0))
    let placedSomewhere = false
    for (const day of order) {
      const resultDay = resultDays.find((d) => d.date === day.date)!
      const { steps, rejected } = placeRemaining(day, resultDay.steps, [place], placesById, body.options.travelMode, fallbackReason)
      if (rejected.length === 0) {
        resultDay.steps = steps
        planned.add(place.id)
        placedSomewhere = true
        break
      }
    }
    if (placedSomewhere) {
      const index = unplaced.findIndex((entry) => entry.placeId === place.id)
      if (index >= 0) unplaced.splice(index, 1)
    } else if (!rejectedIds.has(place.id)) {
      const widestDay = days.reduce((best, day) =>
        day.window.end - day.window.start > best.window.end - best.window.start ? day : best,
      )
      unplaced.push({ placeId: place.id, reason: rejectionReason(place, widestDay) })
    }
  }

  for (const [placeId, reason] of aiUnplaced) {
    if (!planned.has(placeId) && !unplaced.some((entry) => entry.placeId === placeId)) unplaced.push({ placeId, reason })
  }

  return {
    days: resultDays,
    unplaced: unplaced.filter((entry) => !planned.has(entry.placeId)),
    placeUpdates,
    warnings,
  }
}

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Requête invalide" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (message: StreamMessage) => controller.enqueue(encoder.encode(`${JSON.stringify(message)}\n`))
      try {
        const plan = await generatePlan(parsed.data, send)
        send({ type: "result", plan })
      } catch (error) {
        console.error("[v0] Schedule generation error:", error)
        send({ type: "error", message: "La génération du planning a échoué. Réessayez." })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
  })
}
