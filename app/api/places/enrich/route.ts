import { NextResponse } from "next/server"
import { APICallError, generateText, Output, RetryError } from "ai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { z } from "zod"

export const maxDuration = 60

const geminiApiKey = process.env.API ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY
const google = createGoogleGenerativeAI({ apiKey: geminiApiKey })

const requestSchema = z.object({
  place: z.object({
    id: z.string().max(300),
    name: z.string().min(1).max(300),
    address: z.string().max(500).optional(),
    type: z.string().max(100).optional(),
    tags: z.array(z.string().max(100)).max(30).optional(),
  }),
  missing: z
    .array(z.enum(["editorialSummary", "openingHours", "estimatedDuration", "price", "website", "photos"]))
    .min(1),
})

type Source = "google" | "ai"

interface Suggestion<T> {
  value: T
  source: Source
}

interface EnrichmentSuggestions {
  editorialSummary?: Suggestion<string>
  openingHours?: Suggestion<string[]>
  estimatedDuration?: Suggestion<number>
  price?: Suggestion<string>
  website?: Suggestion<string>
  photos?: Suggestion<string[]>
}

const DAYS_FR = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]

async function fetchGoogleDetails(placeId: string) {
  const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!apiKey || !/^[A-Za-z0-9_-]{10,}$/.test(placeId)) return null

  try {
    const response = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=fr`,
      {
        headers: {
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "regularOpeningHours,websiteUri,editorialSummary,photos",
        },
      },
    )
    if (!response.ok) return null
    const data = await response.json()
    return {
      weekdayText: (data.regularOpeningHours?.weekdayDescriptions as string[] | undefined) ?? [],
      website: data.websiteUri as string | undefined,
      editorialSummary: data.editorialSummary?.text as string | undefined,
      photos: ((data.photos as Array<{ name: string }> | undefined) ?? [])
        .slice(0, 5)
        .map((photo) => `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=800&key=${apiKey}`),
    }
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 })
  }

  const { place, missing } = parsed.data
  const wants = new Set(missing)
  const suggestions: EnrichmentSuggestions = {}

  const details = await fetchGoogleDetails(place.id)
  if (details) {
    if (wants.has("openingHours") && details.weekdayText.length > 0) {
      suggestions.openingHours = { value: details.weekdayText, source: "google" }
    }
    if (wants.has("website") && details.website) {
      suggestions.website = { value: details.website, source: "google" }
    }
    if (wants.has("editorialSummary") && details.editorialSummary) {
      suggestions.editorialSummary = { value: details.editorialSummary, source: "google" }
    }
    if (wants.has("photos") && details.photos.length > 0) {
      suggestions.photos = { value: details.photos, source: "google" }
    }
  }

  const needsAi = {
    editorialSummary: wants.has("editorialSummary") && !suggestions.editorialSummary,
    openingHours: wants.has("openingHours") && !suggestions.openingHours,
    estimatedDuration: wants.has("estimatedDuration"),
    price: wants.has("price"),
  }

  if (Object.values(needsAi).some(Boolean)) {
    try {
      const { output } = await generateText({
        model: google("gemini-3.5-flash"),
        tools: {
          google_search: google.tools.googleSearch({}),
        },
        output: Output.object({
          schema: z.object({
            editorialSummary: z
              .string()
              .nullable()
              .describe("Description factuelle du lieu en français, 1 à 2 phrases, ou null si le lieu est inconnu"),
            openingHours: z
              .array(z.string())
              .nullable()
              .describe(
                `Horaires habituels, exactement 7 lignes au format "Lundi: 09:00 – 18:00" ou "Lundi: Fermé", de ${DAYS_FR[0]} à ${DAYS_FR[6]}. null si tu n'es pas raisonnablement sûr`,
              ),
            estimatedDuration: z
              .number()
              .int()
              .nullable()
              .describe("Durée de visite typique en minutes (par ex. 90)"),
            price: z
              .string()
              .nullable()
              .describe('Prix d\'entrée adulte typique, par ex. "15€", "Gratuit", "10-20€". null si inconnu'),
          }),
        }),
        system:
          "Tu es un assistant de planification de voyage. Tu complètes la fiche d'un lieu touristique avec des informations fiables. " +
          "Utilise la recherche Google pour vérifier les informations actuelles (horaires, tarifs). " +
          "N'invente jamais : si tu ne trouves pas le lieu ou si une information est incertaine, renvoie null pour ce champ.",
        prompt: [
          `Lieu : ${place.name}`,
          place.address ? `Adresse : ${place.address}` : null,
          place.type ? `Type : ${place.type}` : null,
          place.tags?.length ? `Tags : ${place.tags.join(", ")}` : null,
          "",
          `Champs à compléter : ${Object.entries(needsAi)
            .filter(([, needed]) => needed)
            .map(([key]) => key)
            .join(", ")}. Renvoie null pour les autres champs.`,
        ]
          .filter((line) => line !== null)
          .join("\n"),
      })

      if (needsAi.editorialSummary && output.editorialSummary) {
        suggestions.editorialSummary = { value: output.editorialSummary, source: "ai" }
      }
      if (needsAi.openingHours && output.openingHours?.length === 7) {
        suggestions.openingHours = { value: output.openingHours, source: "ai" }
      }
      if (needsAi.estimatedDuration && output.estimatedDuration && output.estimatedDuration > 0) {
        suggestions.estimatedDuration = { value: Math.min(output.estimatedDuration, 24 * 60), source: "ai" }
      }
      if (needsAi.price && output.price) {
        suggestions.price = { value: output.price, source: "ai" }
      }
    } catch (error) {
      console.error("[v0] Place enrichment AI error:", error)
      if (Object.keys(suggestions).length === 0) {
        const cause = RetryError.isInstance(error) ? error.lastError : error
        const status = APICallError.isInstance(cause) ? cause.statusCode : undefined
        const message = !geminiApiKey
          ? "L'IA n'est pas configurée : ajoutez la clé Gemini dans la variable API."
          : status === 402
            ? "Crédits Gemini épuisés : rechargez votre projet sur Google AI Studio."
            : status === 429
              ? "Quota Gemini atteint, réessayez dans quelques instants."
              : status === 401 || status === 403
                ? "Clé Gemini refusée : vérifiez la variable API."
                : "L'IA n'a pas pu compléter ce lieu"
        return NextResponse.json({ error: message }, { status: 502 })
      }
    }
  }

  return NextResponse.json({ suggestions })
}
