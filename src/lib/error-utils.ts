export function sanitizeErrorMessage(error: unknown, passcode?: string): string {
  let message = "";

  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === "string") {
    message = error;
  } else {
    return "An unknown error occurred.";
  }

  message = message.split("\n")[0].trim();

  if (passcode) {
    message = message.replaceAll(passcode, "[REDACTED]");
  }

  message = message.replace(/at .+:\d+:\d+/g, "");
  message = message.replace(/\.tsx?/g, "");

  if (message.includes("kanban_transport_error:ConnectError")) {
    return "Cannot connect to Kanban. Verify the base URL and that Kanban is running.";
  }

  if (message.includes("kanban_transport_error:TimeoutException")) {
    return "Kanban request timed out. The server may be overloaded or unreachable.";
  }

  if (message.includes("Failed to fetch") || message.includes("NetworkError")) {
    return "Unable to connect to the server. Check your network connection.";
  }

  if (message.includes("timeout") || message.includes("timed out")) {
    return "Request timed out. The server may be slow or unavailable.";
  }

  if (message.includes("kanban_passcode_rejected")) {
    return "Kanban passcode was rejected. Check your passcode and try again.";
  }

  if (message.includes("Authentication required")) {
    return "Kanban requires authentication. Provide a passcode in settings.";
  }

  if (message.includes("kanban_base_url_missing")) {
    return "Kanban base URL is required.";
  }

  if (message.length > 0 && message.length < 150) {
    return message;
  }

  return "An error occurred. Check the console for details.";
}
