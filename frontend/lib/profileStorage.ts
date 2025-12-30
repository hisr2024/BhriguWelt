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
  const storedUserId = storage?.getItem(USER_ID_KEY);
  const storedSession = storage?.getItem(SESSION_KEY);
  const userId = storedUserId || randomId("seeker");
  const session = storedSession || randomId("session");
  const profileIdRaw = storage?.getItem(PROFILE_ID_KEY);

  if (storage) {
    if (!storedUserId) storage.setItem(USER_ID_KEY, userId);
    if (!storedSession) storage.setItem(SESSION_KEY, session);
  }

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
