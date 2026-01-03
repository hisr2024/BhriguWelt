export function init(options) {
  console.info("Sentry stub: init called", options);
}

export function captureException(error, context) {
  console.error("Sentry stub: captureException", { error, context });
}

export function captureMessage(message, context) {
  console.warn("Sentry stub: captureMessage", { message, context });
}
