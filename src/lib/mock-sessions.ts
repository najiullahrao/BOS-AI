export interface ActiveSession {
  id: string;
  device: string;
  ip: string;
  lastActive: string;
  current: boolean;
}

export const mockActiveSessions: ActiveSession[] = [
  { id: "sess_1", device: "Chrome on macOS", ip: "203.0.113.42", lastActive: "2026-07-11T09:14:00Z", current: true },
  { id: "sess_2", device: "Safari on iPhone", ip: "198.51.100.7", lastActive: "2026-07-09T18:02:00Z", current: false },
  { id: "sess_3", device: "Firefox on Windows", ip: "192.0.2.113", lastActive: "2026-07-05T11:47:00Z", current: false },
];

export interface LinkedOAuthAccount {
  provider: "Google" | "GitHub";
  connected: boolean;
  email?: string;
}

export const mockLinkedAccounts: LinkedOAuthAccount[] = [
  { provider: "Google", connected: true, email: "amara@northlightagency.com" },
  { provider: "GitHub", connected: false },
];

// Cosmetic-only mock: derives a plausible-looking city/country label from an
// IP address deterministically. Not a real geolocation lookup.
const MOCK_LOCATIONS = [
  "San Francisco, US",
  "London, UK",
  "Toronto, CA",
  "Berlin, DE",
  "Singapore, SG",
  "Sydney, AU",
];

export function mockLocationFromIp(ip: string): string {
  const sum = ip.split(/[.:]/).reduce((total, part) => total + (parseInt(part, 10) || 0), 0);
  return MOCK_LOCATIONS[sum % MOCK_LOCATIONS.length];
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}
