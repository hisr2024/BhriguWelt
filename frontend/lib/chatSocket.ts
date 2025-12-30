export function resolveChatSocketUrl() {
  const explicit = process.env.NEXT_PUBLIC_CHAT_WS_URL?.trim();
  if (explicit) return explicit;

  const backend =
    process.env.NEXT_PUBLIC_BACKEND_URL?.trim() || process.env.NEXT_PUBLIC_BACKEND_FALLBACK_URL?.trim();
  if (backend) {
    return `${backend.replace(/^http/, "ws").replace(/\/$/, "")}/ws/chat`;
  }

  if (typeof window === "undefined") return "";
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  return `${protocol}://${window.location.host}/ws/chat`;
}
