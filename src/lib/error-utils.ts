/**
 * Sanitize error messages for display to users.
 * Strips stack traces, internal paths, and sensitive details.
 */
export function sanitizeErrorMessage(error: unknown): string {
  if (!error) {
    return "An unknown error occurred.";
  }

  if (error instanceof Error) {
    const message = error.message;

    // Extract user-friendly portion before stack trace or internal details
    const cleanMessage = message
      .split("\n")[0] // Take first line only
      .replace(/at\s+\S+:\d+:\d+/g, "") // Remove "at file:line:col"
      .replace(/\s+in\s+\S+\.tsx?/g, "") // Remove "in Component.tsx"
      .replace(/Error:\s*/i, "") // Remove "Error: " prefix
      .trim();

    // Map common error patterns to user-friendly messages
    if (cleanMessage.includes("Failed to fetch") || cleanMessage.includes("NetworkError")) {
      return "Unable to connect to the server. Check your network connection.";
    }

    if (cleanMessage.includes("timeout") || cleanMessage.includes("timed out")) {
      return "Request timed out. The server may be slow or unavailable.";
    }

    if (cleanMessage.includes("kanban_transport_error:ConnectError")) {
      return "Cannot connect to Kanban. Check the base URL and ensure Kanban is running.";
    }

    if (cleanMessage.includes("kanban_transport_error:TimeoutException")) {
      return "Kanban request timed out. The server may be overloaded or unreachable.";
    }

    if (cleanMessage.includes("kanban_passcode_rejected")) {
      return "Kanban passcode was rejected. Check your passcode and try again.";
    }

    if (cleanMessage.includes("Authentication required")) {
      return "Kanban requires authentication. Provide a passcode in settings.";
    }

    if (cleanMessage.includes("kanban_base_url_missing")) {
      return "Kanban base URL is required.";
    }

    // Return cleaned message if it's short and readable
    if (cleanMessage.length > 0 && cleanMessage.length < 150) {
      return cleanMessage;
    }

    // Fallback for long/complex messages
    return "An error occurred. Check the console for details.";
  }

  // Non-Error objects
  if (typeof error === "string") {
    return error.split("\n")[0].trim();
  }

  return "An unexpected error occurred.";
}
