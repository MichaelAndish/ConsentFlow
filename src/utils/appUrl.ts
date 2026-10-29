/**
 * Deploy-safe app URL helpers.
 * Prefer ENV_URL from .env (APP_URL as alias), both injected via Vite define.
 * Fall back to the current origin when unset.
 */

export type AppRoute =
  | { section: 'dashboard' }
  | { section: 'studies' }
  | { section: 'translation' }
  | { section: 'template_library' }
  | { section: 'consistency_center' }
  | { section: 'update_migration' }
  | { section: 'traceability_ledger' }
  | { section: 'settings' }
  | { section: 'create_wizard' }
  | { section: 'study'; studyId: string; tab?: string };

function readConfiguredBaseUrl(): string {
  if (typeof process === 'undefined') return '';
  const envUrl = process.env?.ENV_URL ? String(process.env.ENV_URL).trim() : '';
  const appUrl = process.env?.APP_URL ? String(process.env.APP_URL).trim() : '';
  return (envUrl || appUrl).replace(/\/$/, '');
}

export function getAppBaseUrl(): string {
  const envUrl = readConfiguredBaseUrl();

  if (typeof window !== 'undefined' && window.location?.origin) {
    // Production / staging: trust ENV_URL / APP_URL when set.
    // Local only: if env points at a different localhost port than the running
    // server, use the live origin so tour deep-links still open correctly.
    if (envUrl) {
      try {
        const configured = new URL(envUrl);
        const live = new URL(window.location.origin);
        const isLocal = (host: string) => host === 'localhost' || host === '127.0.0.1';
        if (isLocal(configured.hostname) && isLocal(live.hostname) && configured.port !== live.port) {
          return window.location.origin;
        }
      } catch {
        /* keep envUrl */
      }
      return envUrl;
    }
    return window.location.origin;
  }

  return envUrl || 'http://localhost:1110';
}

/** Build a full shareable URL: {ENV_URL}/#/path */
export function buildAppUrl(path: string): string {
  const base = getAppBaseUrl();
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${base}/#${clean}`;
}

export function routeToPath(route: AppRoute): string {
  switch (route.section) {
    case 'dashboard':
      return '/dashboard';
    case 'studies':
      return '/studies';
    case 'translation':
      return '/translation';
    case 'template_library':
      return '/templates';
    case 'consistency_center':
      return '/consistency';
    case 'update_migration':
      return '/template-updates';
    case 'traceability_ledger':
      return '/audit-trail';
    case 'settings':
      return '/settings';
    case 'create_wizard':
      return '/new-study';
    case 'study': {
      const tab = route.tab && route.tab !== 'matrix' ? `/${route.tab}` : '';
      return `/studies/${route.studyId}${tab}`;
    }
    default:
      return '/dashboard';
  }
}

export function buildRouteUrl(route: AppRoute): string {
  return buildAppUrl(routeToPath(route));
}

/** Parse location.hash into an app route (e.g. #/studies/study-leuk-01/issues) */
export function parseHashRoute(hash: string = typeof window !== 'undefined' ? window.location.hash : ''): AppRoute {
  const raw = hash.replace(/^#/, '').trim() || '/dashboard';
  const path = raw.startsWith('/') ? raw : `/${raw}`;
  const parts = path.split('/').filter(Boolean);

  if (parts.length === 0 || parts[0] === 'dashboard') {
    return { section: 'dashboard' };
  }

  if (parts[0] === 'new-study') {
    return { section: 'create_wizard' };
  }

  if (parts[0] === 'studies') {
    if (parts[1]) {
      const tab = parts[2] || 'matrix';
      return { section: 'study', studyId: parts[1], tab };
    }
    return { section: 'studies' };
  }

  const sectionMap: Record<string, AppRoute['section']> = {
    translation: 'translation',
    templates: 'template_library',
    consistency: 'consistency_center',
    'template-updates': 'update_migration',
    'audit-trail': 'traceability_ledger',
    settings: 'settings',
  };

  const mapped = sectionMap[parts[0]];
  if (mapped) {
    return { section: mapped } as AppRoute;
  }

  return { section: 'dashboard' };
}

export function setHashRoute(route: AppRoute): void {
  if (typeof window === 'undefined') return;
  const next = `#${routeToPath(route)}`;
  if (window.location.hash !== next) {
    window.history.replaceState(null, '', next);
  }
}
