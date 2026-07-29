export function isTokenExpired(token: string): boolean {
  try {
    const payloadBase64 = token.split(".")[1];
    if (!payloadBase64) return true;

    const payload = JSON.parse(atob(payloadBase64)) as { exp?: number };
    if (!payload.exp) return false;

    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}
