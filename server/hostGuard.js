export function isLocalHost(hostHeader, port) {
  const host = String(hostHeader || '').toLowerCase();
  return [`127.0.0.1:${port}`, `localhost:${port}`, `[::1]:${port}`].includes(host);
}
