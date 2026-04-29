// Runtime URL resolution for the API and AI service.
//
// Priority order (highest first):
//   1. Runtime override set via setApiUrl / setAiUrl. Useful for dev tools
//      and PowerShell smoke tests that need to point the app at a local
//      backend without rebuilding.
//   2. Values from `app.json -> extra` (apiUrl, aiUrl). This is the
//      production source of truth. Editing app.json + reload is enough to
//      retarget a build.
//   3. Hard-coded production fallbacks below — last-resort only.
//
// We export both:
//   - new lowercase API: getApiBaseUrl(), setApiUrl(), ... — preferred.
//   - legacy `config.API_URL / config.AI_URL` getters — kept for the few
//     existing axios instances that read them at module load time.
//
// AI service is deployed under its own DigitalOcean App URL; do NOT prepend
// the API base URL to it.

// eslint-disable-next-line @typescript-eslint/no-var-requires
const appJson = require('../../app.json');

const FALLBACK_API_URL = 'https://aqyldy-sauda-sebeti-iw5jq.ondigitalocean.app';
const FALLBACK_AI_URL = 'https://aqyldy-ai-service-iw5jq.ondigitalocean.app';

function readExtra(key: 'apiUrl' | 'aiUrl'): string {
  const fromRoot = appJson?.extra?.[key];
  const fromExpo = appJson?.expo?.extra?.[key];
  return (fromRoot || fromExpo || '').toString().trim();
}

function stripTrailingSlash(s: string): string {
  if (!s) return s;
  return s.replace(/\/+$/, '');
}

let runtimeApiUrl = '';
let runtimeAiUrl = '';

export function setApiUrl(url: string) {
  runtimeApiUrl = stripTrailingSlash((url || '').trim());
}

export function setAiUrl(url: string) {
  runtimeAiUrl = stripTrailingSlash((url || '').trim());
}

export function getApiBaseUrl(): string {
  if (runtimeApiUrl) return runtimeApiUrl;
  const fromExtra = readExtra('apiUrl');
  return stripTrailingSlash(fromExtra || FALLBACK_API_URL);
}

export function getAiBaseUrl(): string {
  if (runtimeAiUrl) return runtimeAiUrl;
  const fromExtra = readExtra('aiUrl');
  return stripTrailingSlash(fromExtra || FALLBACK_AI_URL);
}

// Legacy compatibility shim — reads happen lazily through getters so that
// runtime overrides in tests / dev menus take effect without re-importing.
export const config: { API_URL: string; AI_URL: string } = Object.freeze({
  get API_URL() {
    return getApiBaseUrl();
  },
  get AI_URL() {
    return getAiBaseUrl();
  },
}) as any;

// Legacy uppercase aliases — kept so any older call sites keep compiling.
export const setAPIUrl = setApiUrl;
export const setAIUrl = setAiUrl;
