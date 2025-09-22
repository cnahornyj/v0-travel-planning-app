"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"

interface ApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export function useApi<T>(endpoint: string, initialData: T) {
  const { data: session, status } = useSession()
  const [state, setState] = useState<ApiState<T>>({
    data: initialData,
    loading: status === "loading",
    error: null,
  })

  const fetchData = useCallback(async () => {
    if (status !== "authenticated") return

    setState((prev) => ({ ...prev, loading: true, error: null }))

    try {
      const response = await fetch(endpoint)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setState({ data, loading: false, error: null })
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "An error occurred",
      }))
    }
  }, [endpoint, status])

  useEffect(() => {
    if (status === "authenticated") {
      fetchData()
    } else if (status === "unauthenticated") {
      setState({ data: initialData, loading: false, error: null })
    }
  }, [status, fetchData, initialData])

  const mutate = useCallback((newData: T) => {
    setState((prev) => ({ ...prev, data: newData }))
  }, [])

  const refetch = useCallback(() => {
    fetchData()
  }, [fetchData])

  return {
    ...state,
    mutate,
    refetch,
    isAuthenticated: status === "authenticated",
  }
}

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(endpoint, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }))
    throw new Error(error.error || `HTTP error! status: ${response.status}`)
  }

  return response.json()
}
