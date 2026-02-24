const readCookie = (name: string) => {
  if (typeof document === 'undefined') return null;
  const prefix = `${name}=`;
  const entries = document.cookie.split(';');
  for (const entry of entries) {
    const value = entry.trim();
    if (value.startsWith(prefix)) {
      return decodeURIComponent(value.slice(prefix.length));
    }
  }
  return null;
};

export const getCsrfToken = () => readCookie('csrf_token');

export const withCsrfHeader = (headers: HeadersInit = {}) => {
  const nextHeaders = new Headers(headers);
  const token = getCsrfToken();
  if (token) {
    nextHeaders.set('x-csrf-token', token);
  }
  return nextHeaders;
};
