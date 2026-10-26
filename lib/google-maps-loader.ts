"use client"

let loadPromise: Promise<any> | null = null

function injectScript(scriptUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const callbackName = "__googleMapsReady"
    ;(window as any)[callbackName] = () => resolve()

    const url = new URL(scriptUrl)
    url.searchParams.set("loading", "async")
    url.searchParams.set("v", "weekly")
    url.searchParams.set("callback", callbackName)

    const script = document.createElement("script")
    script.src = url.toString()
    script.async = true
    script.onerror = () => reject(new Error("Failed to load Google Maps script"))
    document.head.appendChild(script)
  })
}

// Single shared loader so the map and place search never race each other or inject the script twice.
export function loadGoogleMaps(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("Google Maps requires a browser"))
  if (loadPromise) return loadPromise

  loadPromise = (async () => {
    if (!window.google?.maps?.importLibrary) {
      const res = await fetch("/api/maps-config")
      if (!res.ok) throw new Error("Failed to fetch maps configuration")
      const { scriptUrl } = await res.json()
      await injectScript(scriptUrl)
    }
    await Promise.all([
      window.google.maps.importLibrary("maps"),
      window.google.maps.importLibrary("marker"),
      window.google.maps.importLibrary("places"),
    ])
    return window.google.maps
  })()

  loadPromise.catch(() => {
    loadPromise = null
  })

  return loadPromise
}

export async function getPlacesLibrary(): Promise<any | null> {
  try {
    await loadGoogleMaps()
    const placesLib = await window.google.maps.importLibrary("places")
    return placesLib?.Place?.searchByText ? placesLib.Place : null
  } catch (error) {
    console.error("Google Maps failed to load:", error)
    return null
  }
}
