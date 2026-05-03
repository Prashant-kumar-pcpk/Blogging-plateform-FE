const STORAGE_KEY = "bloggingPlatformSession";

const decodeJwtPayload = (token = "") => {
  try {
    const [, payload] = token.split(".");
    if (!payload) {
      return null;
    }

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return JSON.parse(window.atob(padded));
  } catch (error) {
    return null;
  }
};

export const isTokenExpired = (token = "") => {
  const payload = decodeJwtPayload(token);

  if (!payload?.exp) {
    return true;
  }

  return payload.exp * 1000 <= Date.now();
};

export const parseStoredSession = () => {
  try {
    const parsed =
      JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
        token: "",
        user: null,
      };

    if (!parsed.token || isTokenExpired(parsed.token)) {
      localStorage.removeItem(STORAGE_KEY);
      return { token: "", user: null };
    }

    return parsed;
  } catch (error) {
    localStorage.removeItem(STORAGE_KEY);
    return { token: "", user: null };
  }
};

export const saveStoredSession = (session) => {
  if (!session?.token || isTokenExpired(session.token)) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
};
