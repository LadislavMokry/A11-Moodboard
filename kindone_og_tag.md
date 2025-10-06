# Kindone.ai Open Graph (OG) Tags Implementation

## Overview

Kindone.ai implements Open Graph (OG) meta tags using a static HTML approach. All OG tags are defined in the main `index.html` file at the root of the project.

## Implementation Location

**File:** [index.html](index.html)

All OG tags are statically defined in the `<head>` section (lines 38-61).

## OG Tags Implemented

### Standard Meta Description
```html
<meta name="description" content="Kindone - A thoughtful AI companion for meaningful conversations. Talk through your thoughts and feelings in a safe, private space." />
```

### Open Graph / Facebook Tags

| Property | Value | Purpose |
|----------|-------|---------|
| `og:type` | `website` | Defines the content type |
| `og:url` | `https://kindone.ai/` | Canonical URL for the site |
| `og:title` | `Kindone - Your Thoughtful AI Companion` | Title shown when shared |
| `og:description` | `A humble and thoughtful conversation companion. Talk through your thoughts and feelings in a safe, private space.` | Description shown when shared |
| `og:image` | `https://kindone.ai/favicon/web-app-manifest-512x512.png` | Preview image (512x512 PNG) |
| `og:image:width` | `512` | Image width in pixels |
| `og:image:height` | `512` | Image height in pixels |
| `og:image:alt` | `Kindone Logo` | Alt text for the image |
| `og:site_name` | `Kindone` | Name of the site |
| `og:locale` | `en_US` | Primary locale |

### Twitter Card Tags

| Property | Value | Purpose |
|----------|-------|---------|
| `twitter:card` | `summary` | Card type (summary with small image) |
| `twitter:url` | `https://kindone.ai/` | URL for Twitter sharing |
| `twitter:title` | `Kindone - Your Thoughtful AI Companion` | Title for Twitter card |
| `twitter:description` | `A humble and thoughtful conversation companion. Talk through your thoughts and feelings in a safe, private space.` | Description for Twitter card |
| `twitter:image` | `https://kindone.ai/favicon/web-app-manifest-512x512.png` | Image for Twitter card |
| `twitter:image:alt` | `Kindone Logo` | Alt text for Twitter image |

### Additional SEO Meta Tags

```html
<meta name="author" content="Kindone" />
<meta name="robots" content="index, follow" />
<meta name="theme-color" content="#1E90FF" />
```

## Image Assets

The OG image used is located at:
- **Path:** `public/favicon/web-app-manifest-512x512.png`
- **URL:** `https://kindone.ai/favicon/web-app-manifest-512x512.png`
- **Dimensions:** 512×512 pixels
- **Format:** PNG

Additional favicon assets in the same directory:
- `apple-touch-icon.png` (180×180)
- `favicon-96x96.png` (96×96)
- `web-app-manifest-192x192.png` (192×192)

## Implementation Approach

### Static vs Dynamic

The project uses **static OG tags** defined directly in the HTML file. This approach has the following characteristics:

**Advantages:**
- Simple implementation
- No server-side rendering required
- Works immediately on all platforms
- Perfect for single-page applications (SPAs)
- No additional dependencies needed

**Limitations:**
- Same OG tags for all pages/routes
- Cannot customize tags based on conversation or user context
- Client-side routing doesn't change OG tags

### Why Static Works for Kindone.ai

This implementation is appropriate because:
1. **Single-page application (SPA)** - Built with React + Vite
2. **Single main use case** - Chat application with consistent branding
3. **No content-specific sharing** - Users don't share individual conversations
4. **Privacy-first design** - Conversations are private and not meant to be shared publicly
5. **Cloudflare Pages deployment** - Static hosting without SSR

## Deployment Architecture

- **Frontend:** Cloudflare Pages
- **Build tool:** Vite
- **Framework:** React 18 with React Router

The `index.html` is processed by Vite during build (`npm run build`) and deployed to Cloudflare Pages. All OG tags remain unchanged in the final build.

## Testing OG Tags

To test how the OG tags appear when shared:

1. **Facebook Sharing Debugger:** https://developers.facebook.com/tools/debug/
2. **Twitter Card Validator:** https://cards-dev.twitter.com/validator
3. **LinkedIn Post Inspector:** https://www.linkedin.com/post-inspector/
4. **Generic OG Validator:** https://www.opengraph.xyz/

## Future Enhancements

If dynamic OG tags are needed in the future (e.g., for sharing specific conversations or pages):

1. **Option 1: Cloudflare Workers**
   - Add edge middleware to inject dynamic OG tags
   - Use Cloudflare Workers to intercept requests and modify HTML

2. **Option 2: Pre-rendering**
   - Generate static pages for common routes
   - Use a plugin like `vite-plugin-ssr` or similar

3. **Option 3: Server-Side Rendering (SSR)**
   - Migrate to a framework like Next.js or Remix
   - Generate OG tags dynamically per route

## Maintenance Notes

When updating OG tags:

1. Edit [index.html](index.html) (lines 38-61)
2. Update both Facebook and Twitter tags to maintain consistency
3. If changing the image, update the path in both `og:image` and `twitter:image`
4. Test with the validators listed above
5. Rebuild and deploy: `npm run build`

## Related Files

- [index.html](index.html) - Contains all OG tag definitions
- [vite.config.ts](vite.config.ts) - Build configuration
- [public/favicon/](public/favicon/) - Directory containing OG images
