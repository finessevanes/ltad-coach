// Map error codes from backend to user-friendly messages
export const errorMessages: Record<string, string> = {
  VALIDATION_ERROR: 'Please check your input and try again.',
  NOT_FOUND: 'The requested resource was not found.',
  UNAUTHORIZED: 'Please log in to continue.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  RATE_LIMITED: 'Too many requests. Please try again later.',
  SERVER_ERROR: 'An unexpected error occurred. Please try again.',
  CONSENT_REQUIRED: 'Parent consent is required before proceeding.',
  PROCESSING_FAILED: 'Processing failed. Please try again.',
};

export function getErrorMessage(code: string): string {
  return errorMessages[code] || errorMessages.SERVER_ERROR;
}
