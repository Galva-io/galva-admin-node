/**
 * Error response structure from Galva API.
 */
export interface GalvaErrorResponse {
  code: string;
  message: string;
}

/**
 * Custom error class for Galva SDK errors.
 * Extends Error with additional properties from API error responses.
 */
export class GalvaError extends Error {
  /** Error code from the API (e.g., 'BAD_REQUEST', 'UNAUTHORIZED') */
  readonly code: string;

  constructor(response: GalvaErrorResponse) {
    super(response.message);
    this.name = "GalvaError";
    this.code = response.code;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, GalvaError);
    }
  }

  /**
   * Creates a GalvaError from an unknown error.
   * If the error is already a GalvaError, returns it as-is.
   * Otherwise, wraps it in a GalvaError with UNKNOWN_ERROR code.
   */
  static from(error: unknown): GalvaError {
    if (error instanceof GalvaError) {
      return error;
    }

    const message =
      error instanceof Error ? error.message : "An unknown error occurred";

    return new GalvaError({
      code: "UNKNOWN_ERROR",
      message,
    });
  }
}
