import { NextResponse } from "next/server"
import { ZodError } from "zod"

/**
 * Standard error response format
 */
export interface ErrorResponse {
  error: string
  details?: string[]
  code?: string
  timestamp: string
}

/**
 * Error codes for client-side handling
 */
export enum ErrorCode {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR",
  AUTHORIZATION_ERROR = "AUTHORIZATION_ERROR",
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
  DATABASE_ERROR = "DATABASE_ERROR",
  INTERNAL_ERROR = "INTERNAL_ERROR",
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  message: string,
  status: number,
  code?: ErrorCode,
  details?: string[]
): NextResponse<ErrorResponse> {
  const errorResponse: ErrorResponse = {
    error: message,
    timestamp: new Date().toISOString(),
  }

  if (code) {
    errorResponse.code = code
  }

  if (details && details.length > 0) {
    errorResponse.details = details
  }

  return NextResponse.json(errorResponse, { status })
}

/**
 * Handle Zod validation errors
 */
export function handleValidationError(error: ZodError): NextResponse<ErrorResponse> {
  const details = error.issues.map((err) => {
    const path = err.path.join(".")
    return `${path}: ${err.message}`
  })

  return createErrorResponse(
    "Validation failed",
    400,
    ErrorCode.VALIDATION_ERROR,
    details
  )
}

/**
 * Handle database errors
 */
export function handleDatabaseError(error: unknown): NextResponse<ErrorResponse> {
  console.error("Database error:", error)

  // Check for specific PostgreSQL error codes
  if (error && typeof error === "object" && "code" in error) {
    const pgError = error as { code: string; detail?: string; constraint?: string }

    // Unique constraint violation
    if (pgError.code === "23505") {
      return createErrorResponse(
        "A record with this value already exists",
        409,
        ErrorCode.CONFLICT,
        pgError.detail ? [pgError.detail] : undefined
      )
    }

    // Foreign key constraint violation
    if (pgError.code === "23503") {
      return createErrorResponse(
        "Cannot delete this record because it is referenced by other records",
        400,
        ErrorCode.CONFLICT,
        pgError.detail ? [pgError.detail] : undefined
      )
    }

    // Not null constraint violation
    if (pgError.code === "23502") {
      return createErrorResponse(
        "Required field is missing",
        400,
        ErrorCode.VALIDATION_ERROR,
        pgError.detail ? [pgError.detail] : undefined
      )
    }
  }

  // Generic database error
  return createErrorResponse(
    "Database operation failed. Please try again.",
    500,
    ErrorCode.DATABASE_ERROR
  )
}

/**
 * Handle authentication errors
 */
export function handleAuthenticationError(
  message: string = "Authentication required"
): NextResponse<ErrorResponse> {
  return createErrorResponse(message, 401, ErrorCode.AUTHENTICATION_ERROR)
}

/**
 * Handle authorization errors
 */
export function handleAuthorizationError(
  message: string = "You don't have permission to perform this action"
): NextResponse<ErrorResponse> {
  return createErrorResponse(message, 403, ErrorCode.AUTHORIZATION_ERROR)
}

/**
 * Handle not found errors
 */
export function handleNotFoundError(
  resource: string = "Resource"
): NextResponse<ErrorResponse> {
  return createErrorResponse(`${resource} not found`, 404, ErrorCode.NOT_FOUND)
}

/**
 * Handle generic errors
 */
export function handleGenericError(error: unknown): NextResponse<ErrorResponse> {
  console.error("Unexpected error:", error)

  // If it's a known error type, handle it specifically
  if (error instanceof ZodError) {
    return handleValidationError(error)
  }

  // Check if it's a database error
  if (error && typeof error === "object" && "code" in error) {
    return handleDatabaseError(error)
  }

  // Generic error
  const message =
    error instanceof Error ? error.message : "An unexpected error occurred"

  return createErrorResponse(
    message,
    500,
    ErrorCode.INTERNAL_ERROR
  )
}

/**
 * Log error with context
 */
export function logError(
  error: unknown,
  context: {
    endpoint?: string
    userId?: string
    method?: string
    params?: Record<string, unknown>
  }
) {
  const errorLog = {
    timestamp: new Date().toISOString(),
    error: error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name,
    } : error,
    context,
  }

  console.error("Error log:", JSON.stringify(errorLog, null, 2))

  // In production, send to error logging service
  if (process.env.NODE_ENV === "production") {
    // TODO: Send to error logging service (e.g., Sentry, LogRocket)
  }
}

/**
 * Wrapper for API route handlers with error handling
 */
export function withErrorHandling<T>(
  handler: () => Promise<T>
): Promise<T | NextResponse<ErrorResponse>> {
  return handler().catch((error) => {
    return handleGenericError(error)
  })
}
