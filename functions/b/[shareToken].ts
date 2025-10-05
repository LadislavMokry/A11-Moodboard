/**
 * Cloudflare Pages Function for SSR of OG meta tags on public board URLs
 * Handles requests to /b/:shareToken
 */

import { createClient } from '@supabase/supabase-js';

interface Env {
  VITE_SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  ASSETS: {
    fetch: (request: Request | URL) => Promise<Response>;
  };
}

interface PublicBoardData {
  board: {
    id: string;
    owner_id: string;
    name: string;
    description: string | null;
    cover_rotation_enabled: boolean;
    is_showcase: boolean;
    og_image_id: string | null;
    created_at: string;
    updated_at: string;
  };
  owner: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  images: Array<{
    id: string;
    board_id: string;
    storage_path: string;
    caption: string | null;
    position: number;
    mime_type: string | null;
    width: number | null;
    height: number | null;
    size_bytes: number | null;
    original_filename: string | null;
    source_url: string | null;
    created_at: string;
  }>;
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text: string | null | undefined): string {
  if (!text) return '';
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (char) => htmlEscapes[char]);
}

/**
 * Generate HTML with OG meta tags for a public board
 * Note: Asset paths will be injected at runtime by reading the manifest
 */
function generateHtml(
  data: PublicBoardData,
  shareToken: string,
  baseUrl: string,
  assetManifest?: { js: string; css: string }
): string {
  const title = escapeHtml(data.board.name);
  const defaultDescription = `${data.owner.display_name || 'A user'}'s moodboard on Moodeight`;
  const description = escapeHtml(data.board.description || defaultDescription);
  // TEMPORARY: Test with a known-good image URL
  const ogImageUrl = 'https://picsum.photos/1200/630';
  // const ogImageUrl = `${baseUrl}/api/og/${shareToken}.png`;
  const boardUrl = `${baseUrl}/b/${shareToken}`;

  // Use provided asset paths or fallback to development paths
  const jsPath = assetManifest?.js || '/src/main.tsx';
  const cssPath = assetManifest?.css || '';

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <!-- Primary Meta Tags -->
    <title>${title} - Moodeight</title>
    <meta name="title" content="${title} - Moodeight" />
    <meta name="description" content="${description}" />

    <!-- Robots: noindex for unlisted boards -->
    <meta name="robots" content="noindex, nofollow" />

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${boardUrl}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${ogImageUrl}" />
    <meta property="og:image:secure_url" content="${ogImageUrl}" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:alt" content="${title}" />
    <meta property="og:site_name" content="Moodeight" />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${boardUrl}" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${ogImageUrl}" />

    <!-- Theme Script -->
    <script>
      // Prevent flash of wrong theme on page load
      (function() {
        try {
          const stored = localStorage.getItem('theme');
          const theme = stored === 'system' || stored === 'light' || stored === 'dark' ? stored : 'system';

          let effectiveTheme;
          if (theme === 'system') {
            effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
          } else {
            effectiveTheme = theme;
          }

          document.documentElement.classList.add(effectiveTheme);
        } catch (e) {}
      })();
    </script>${cssPath ? `\n    <link rel="stylesheet" crossorigin href="${cssPath}">` : ''}
    <script type="module" crossorigin src="${jsPath}"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;
}

/**
 * Generate ETag from board updated_at timestamp
 */
function generateETag(updatedAt: string): string {
  // Use updated_at timestamp as ETag (hash it for brevity)
  const timestamp = new Date(updatedAt).getTime();
  return `"${timestamp}"`;
}

/**
 * Cloudflare Pages Function handler
 * Only handles HTML requests - lets static assets pass through
 */
export async function onRequest(context: {
  request: Request;
  params: { shareToken: string };
  env: Env;
  next: () => Promise<Response>;
}): Promise<Response> {
  const { request, params, env, next } = context;
  const { shareToken } = params;

  // Let non-HTML requests (assets, API calls, etc.) pass through to static files
  const url = new URL(request.url);

  // Only handle /b/:shareToken paths (strip query params for comparison)
  const pathname = url.pathname;
  if (pathname !== `/b/${shareToken}`) {
    return next();
  }

  // Always handle /b/ routes with SSR (don't check Accept header)
  // Facebook's bot might not send the right Accept header

  // Validate shareToken is a valid UUID
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(shareToken)) {
    return new Response('Invalid share token', { status: 400 });
  }

  // Initialize Supabase client with service role key (server-side only)
  const supabase = createClient(
    env.VITE_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  try {
    // Fetch board data via get_public_board RPC
    const { data, error } = await supabase.rpc('get_public_board', {
      p_share_token: shareToken,
    });

    if (error) {
      console.error('Supabase RPC error:', error);
      return new Response('Failed to fetch board', { status: 500 });
    }

    if (!data) {
      return new Response('Board not found', { status: 404 });
    }

    const publicBoardData = data as PublicBoardData;

    // Generate ETag from board's updated_at timestamp
    const etag = generateETag(publicBoardData.board.updated_at);

    // Check If-None-Match header for cache validation
    const ifNoneMatch = request.headers.get('If-None-Match');
    if (ifNoneMatch === etag) {
      return new Response(null, { status: 304 }); // Not Modified
    }

    // Read the built index.html to extract asset paths
    // In production, Cloudflare Pages serves from dist/
    // We'll try to read the manifest or parse index.html for asset paths
    let assetManifest: { js: string; css: string } | undefined;

    try {
      // Try to fetch the static index.html to extract asset paths
      const indexResponse = await env.ASSETS.fetch(new URL('/index.html', request.url));
      if (indexResponse.ok) {
        const indexHtml = await indexResponse.text();

        // Extract JS and CSS paths from the built index.html
        const jsMatch = indexHtml.match(/<script[^>]+src="([^"]+)"/);
        const cssMatch = indexHtml.match(/<link[^>]+href="([^"]+\.css)"/);

        if (jsMatch || cssMatch) {
          assetManifest = {
            js: jsMatch ? jsMatch[1] : '/src/main.tsx',
            css: cssMatch ? cssMatch[1] : '',
          };
        }
      }
    } catch (e) {
      // In local dev or if ASSETS is not available, we'll use fallback paths
      console.warn('Could not read asset manifest, using fallback paths');
    }

    // Get base URL from request
    const baseUrl = new URL(request.url).origin;

    // Generate HTML with OG meta tags
    const html = generateHtml(publicBoardData, shareToken, baseUrl, assetManifest);

    // Return HTML with caching headers
    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=86400', // 24 hours
        ETag: etag,
      },
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response('Internal server error', { status: 500 });
  }
}
