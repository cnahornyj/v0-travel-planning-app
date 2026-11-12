import { addDays } from "./time"
import type { DayWeather, WeatherIcon } from "./types"

const FORECAST_HORIZON_DAYS = 15

function describeWeatherCode(code: number): { label: string; icon: WeatherIcon } {
  if (code === 0) return { label: "Ensoleillé", icon: "sun" }
  if (code <= 2) return { label: "Éclaircies", icon: "cloud-sun" }
  if (code === 3) return { label: "Couvert", icon: "cloud" }
  if (code === 45 || code === 48) return { label: "Brouillard", icon: "fog" }
  if (code >= 51 && code <= 57) return { label: "Bruine", icon: "drizzle" }
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return { label: "Pluie", icon: "rain" }
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { label: "Neige", icon: "snow" }
  if (code >= 95) return { label: "Orages", icon: "storm" }
  return { label: "Variable", icon: "cloud-sun" }
}

function trendDescription(precipProbability: number, tempMax: number): { label: string; icon: WeatherIcon } {
  if (precipProbability >= 60) return { label: "Souvent pluvieux", icon: "rain" }
  if (precipProbability >= 35) return { label: "Averses possibles", icon: "drizzle" }
  if (tempMax >= 30) return { label: "Généralement chaud", icon: "sun" }
  return { label: "Généralement sec", icon: "cloud-sun" }
}

interface DailyResponse {
  daily?: {
    time: string[]
    weather_code?: number[]
    temperature_2m_max?: number[]
    temperature_2m_min?: number[]
    precipitation_probability_max?: (number | null)[]
    precipitation_sum?: number[]
    wind_speed_10m_max?: number[]
  }
  hourly?: {
    time: string[]
    precipitation_probability?: (number | null)[]
  }
}

async function fetchJson(url: string): Promise<DailyResponse | null> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(10_000) })
    if (!response.ok) return null
    return (await response.json()) as DailyResponse
  } catch {
    return null
  }
}

function maxOf(values: (number | null | undefined)[]): number {
  return values.reduce<number>((max, value) => (typeof value === "number" && value > max ? value : max), 0)
}

async function fetchForecast(lat: number, lng: number, dates: string[]): Promise<DayWeather[]> {
  if (dates.length === 0) return []
  const params = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lng.toFixed(4),
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max",
    hourly: "precipitation_probability",
    timezone: "auto",
    start_date: dates[0],
    end_date: dates[dates.length - 1],
  })
  const data = await fetchJson(`https://api.open-meteo.com/v1/forecast?${params}`)
  const daily = data?.daily
  if (!daily) return []

  const hourly = data?.hourly
  return daily.time
    .map((date, index): DayWeather => {
      const { label, icon } = describeWeatherCode(daily.weather_code?.[index] ?? 2)
      const hoursForDay = (hourly?.time ?? [])
        .map((time, i) => ({ hour: Number(time.slice(11, 13)), date: time.slice(0, 10), p: hourly?.precipitation_probability?.[i] }))
        .filter((entry) => entry.date === date)
      const periodMax = (from: number, to: number) =>
        maxOf(hoursForDay.filter((entry) => entry.hour >= from && entry.hour < to).map((entry) => entry.p))

      return {
        date,
        kind: "forecast",
        label,
        icon,
        tempMax: Math.round(daily.temperature_2m_max?.[index] ?? 0),
        tempMin: Math.round(daily.temperature_2m_min?.[index] ?? 0),
        precipitationProbability: Math.round(daily.precipitation_probability_max?.[index] ?? 0),
        precipitationSum: Math.round((daily.precipitation_sum?.[index] ?? 0) * 10) / 10,
        windMax: Math.round(daily.wind_speed_10m_max?.[index] ?? 0),
        periods: hoursForDay.length
          ? { morning: periodMax(8, 12), afternoon: periodMax(12, 18), evening: periodMax(18, 23) }
          : undefined,
      }
    })
    .filter((day) => dates.includes(day.date))
}

/** Averages of the same calendar dates over the three previous years */
async function fetchTrends(lat: number, lng: number, dates: string[]): Promise<DayWeather[]> {
  if (dates.length === 0) return []
  const years = [1, 2, 3]
  const shift = (date: string, yearsBack: number) => `${Number(date.slice(0, 4)) - yearsBack}${date.slice(4)}`

  const responses = await Promise.all(
    years.map((yearsBack) => {
      const params = new URLSearchParams({
        latitude: lat.toFixed(4),
        longitude: lng.toFixed(4),
        daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max",
        timezone: "auto",
        start_date: shift(dates[0], yearsBack).replace(/-02-29$/, "-02-28"),
        end_date: shift(dates[dates.length - 1], yearsBack).replace(/-02-29$/, "-02-28"),
      })
      return fetchJson(`https://archive-api.open-meteo.com/v1/archive?${params}`)
    }),
  )

  return dates
    .map((date): DayWeather | null => {
      const samples = responses
        .map((response, i) => {
          const daily = response?.daily
          if (!daily) return null
          const index = daily.time.indexOf(shift(date, years[i]))
          if (index < 0) return null
          return {
            tempMax: daily.temperature_2m_max?.[index] ?? 0,
            tempMin: daily.temperature_2m_min?.[index] ?? 0,
            precip: daily.precipitation_sum?.[index] ?? 0,
            wind: daily.wind_speed_10m_max?.[index] ?? 0,
          }
        })
        .filter((sample): sample is NonNullable<typeof sample> => sample !== null)

      if (samples.length === 0) return null
      const avg = (pick: (s: (typeof samples)[number]) => number) =>
        samples.reduce((sum, sample) => sum + pick(sample), 0) / samples.length
      const rainyShare = samples.filter((sample) => sample.precip >= 1).length / samples.length
      const precipitationProbability = Math.round(rainyShare * 100)
      const tempMax = Math.round(avg((s) => s.tempMax))
      const { label, icon } = trendDescription(precipitationProbability, tempMax)

      return {
        date,
        kind: "trend",
        label,
        icon,
        tempMax,
        tempMin: Math.round(avg((s) => s.tempMin)),
        precipitationProbability,
        precipitationSum: Math.round(avg((s) => s.precip) * 10) / 10,
        windMax: Math.round(avg((s) => s.wind)),
      }
    })
    .filter((day): day is DayWeather => day !== null)
}

export async function getWeatherForDates(
  lat: number,
  lng: number,
  dates: string[],
  today: string,
): Promise<Map<string, DayWeather>> {
  const horizon = addDays(today, FORECAST_HORIZON_DAYS)
  const forecastDates = dates.filter((date) => date >= today && date <= horizon)
  const trendDates = dates.filter((date) => !forecastDates.includes(date))

  const [forecast, trends] = await Promise.all([fetchForecast(lat, lng, forecastDates), fetchTrends(lat, lng, trendDates)])
  return new Map([...forecast, ...trends].map((day) => [day.date, day]))
}

/** 1 = ideal for outdoor visits, 0 = poor */
export function outdoorWeatherScore(weather: DayWeather | null | undefined): number {
  if (!weather) return 0.5
  let score = 1 - weather.precipitationProbability / 100
  if (weather.precipitationSum >= 5) score -= 0.2
  if (weather.tempMax >= 33 || weather.tempMax <= 3) score -= 0.25
  if (weather.windMax >= 45) score -= 0.15
  if (weather.icon === "storm" || weather.icon === "snow") score -= 0.2
  return Math.max(0, Math.min(1, score))
}
