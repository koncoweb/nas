"use client"

import { toast } from "@/components/ui/use-toast"

export interface ApiError {
  error: string
  details?: string[]
  code?: string
  timestamp: string
}

/**
 * Handle API call with automatic error handling and toast notifications
 */
export async function handleApiCall<T>(
  apiCall: () => Promise<Response>,
  options?: {
    successMessage?: string
    errorMessage?: string
    showSuccessToast?: boolean
    showErrorToast?: boolean
  }
): Promise<T> {
  const {
    successMessage,
    errorMessage,
    showSuccessToast = false,
    showErrorToast = true,
  } = options || {}

  try {
    const response = await apiCall()

    if (!response.ok) {
      const error: ApiError = await response.json()

      // Show error toast
      if (showErrorToast) {
        toast({
          title: "Error",
          description: errorMessage || error.error,
          variant: "destructive",
        })
      }

      // Handle specific error codes
      if (response.status === 401) {
        // Redirect to login
        window.location.href = "/login"
      }

      throw new Error(error.error)
    }

    const data = await response.json()

    // Show success toast
    if (showSuccessToast && successMessage) {
      toast({
        title: "Success",
        description: successMessage,
      })
    }

    return data
  } catch (error) {
    // Network errors or other exceptions
    if (error instanceof TypeError && error.message.includes("fetch")) {
      if (showErrorToast) {
        toast({
          title: "Network Error",
          description: "Unable to connect to server. Please check your connection.",
          variant: "destructive",
        })
      }
    }

    throw error
  }
}

/**
 * Fetch with automatic error handling
 */
export async function fetchApi<T>(
  url: string,
  options?: RequestInit & {
    successMessage?: string
    errorMessage?: string
    showSuccessToast?: boolean
    showErrorToast?: boolean
  }
): Promise<T> {
  const {
    successMessage,
    errorMessage,
    showSuccessToast,
    showErrorToast,
    ...fetchOptions
  } = options || {}

  return handleApiCall<T>(
    () => fetch(url, fetchOptions),
    {
      successMessage,
      errorMessage,
      showSuccessToast,
      showErrorToast,
    }
  )
}

/**
 * Helper functions for common HTTP methods
 */
export const api = {
  get: <T>(url: string, options?: Omit<RequestInit, "method">) =>
    fetchApi<T>(url, { ...options, method: "GET" }),

  post: <T>(url: string, data?: unknown, options?: Omit<RequestInit, "method" | "body">) =>
    fetchApi<T>(url, {
      ...options,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T>(url: string, data?: unknown, options?: Omit<RequestInit, "method" | "body">) =>
    fetchApi<T>(url, {
      ...options,
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(url: string, options?: Omit<RequestInit, "method">) =>
    fetchApi<T>(url, { ...options, method: "DELETE" }),
}
