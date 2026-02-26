'use client';

import { useEffect, useState } from 'react';

type SwaggerBundleFn = ((config: {
  url: string;
  dom_id: string;
  deepLinking: boolean;
  displayRequestDuration: boolean;
  persistAuthorization: boolean;
  presets: unknown[];
  layout: string;
}) => unknown) & {
  presets: {
    apis: unknown;
  };
};

type SwaggerBundleGlobal = SwaggerBundleFn | { default: SwaggerBundleFn };

declare global {
  interface Window {
    SwaggerUIBundle?: SwaggerBundleGlobal;
    SwaggerUIStandalonePreset?: unknown;
    ui?: unknown;
  }
}

const BUNDLE_SRC = 'https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js';
const PRESET_SRC = 'https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js';
const CSS_SRC = 'https://unpkg.com/swagger-ui-dist@5/swagger-ui.css';

const loadScript = (src: string) =>
  new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === 'true') {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error(`Ne mogu da učitam ${src}`)), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = () => reject(new Error(`Ne mogu da učitam ${src}`));
    document.body.appendChild(script);
  });

export default function ApiDocsPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const initSwagger = async () => {
      try {
        setError(null);
        await Promise.all([loadScript(BUNDLE_SRC), loadScript(PRESET_SRC)]);

        const bundleSource = window.SwaggerUIBundle;
        const bundle = typeof bundleSource === 'function' ? bundleSource : bundleSource?.default;
        if (typeof bundle !== 'function') {
          throw new Error('SwaggerUIBundle nije pravilno učitan.');
        }

        if (!active) return;
        window.ui = bundle({
          url: '/api/openapi',
          dom_id: '#swagger-ui',
          deepLinking: true,
          displayRequestDuration: true,
          persistAuthorization: true,
          presets: [bundle.presets.apis, window.SwaggerUIStandalonePreset],
          layout: 'BaseLayout'
        });
      } catch (e) {
        if (!active) return;
        setError(e instanceof Error ? e.message : 'Greška pri učitavanju Swagger UI.');
      }
    };

    initSwagger();

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-slate-100">
      <link rel="stylesheet" href={CSS_SRC} />
      <div className="mx-auto max-w-7xl p-4">
        <h1 className="mb-4 text-2xl font-bold text-slate-900">API dokumentacija</h1>
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}
        <div id="swagger-ui" className="rounded-lg border border-slate-200 bg-white" />
      </div>
    </main>
  );
}
