const USER_ID_KEY = "bhrigu.profile.user_id";
const PROFILE_ID_KEY = "bhrigu.profile.id";
const SESSION_KEY = "bhrigu.profile.session";

function safeStorage() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function randomId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Math.random().toString(16).slice(2)}`;
}

export function getProfileIdentifiers() {
  const storage = safeStorage();
  const userId = storage?.getItem(USER_ID_KEY) || randomId("seeker");
  const profileIdRaw = storage?.getItem(PROFILE_ID_KEY);
  const session = storage?.getItem(SESSION_KEY) || randomId("session");
  return { userId, profileId: profileIdRaw ? Number(profileIdRaw) : undefined, sessionKey: session };
}

export function persistProfileIdentifiers({ userId, profileId, sessionKey }: {
  userId?: string;
  profileId?: number;
  sessionKey?: string;
}) {
  const storage = safeStorage();
  if (!storage) return;
  if (userId) storage.setItem(USER_ID_KEY, userId);
  if (profileId) storage.setItem(PROFILE_ID_KEY, String(profileId));
  if (sessionKey) storage.setItem(SESSION_KEY, sessionKey);
}
