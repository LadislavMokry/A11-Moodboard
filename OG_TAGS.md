# Open Graph Tags Debugging Notes

This document tracks our findings while implementing OG meta tags and dynamic OG images for social media sharing (Facebook, WhatsApp, Messenger).

## Current Status

✅ **Working:**
- OG meta tags render server-side via Cloudflare Pages Function
- Facebook Sharing Debugger shows all meta tags correctly
- OG image endpoint serves optimized WebP images (29-38KB)
- Image dimensions: 1200x630 (Facebook recommended 1.91:1 aspect ratio)
- Image format: WebP with quality=35
- All required meta tags present (og:title, og:description, og:image, og:url, og:type)

❌ **Not Working:**
- **WhatsApp does not show image preview** (shows title/description but no image)
- **Facebook Messenger does not show image preview** (shows title/description but no image)

## Implementation Details

### Files
- `functions/b/[shareToken].ts` - SSR function for public board pages
- `functions/api/og/[shareToken].webp.ts` - OG image endpoint (serves optimized WebP)
- `functions/api/og/[shareToken].png.ts` - Legacy endpoint (still exists)

### Current OG Image URL
```
https://a11-moodboard.pages.dev/api/og/{shareToken}.webp
```

### How OG Image Works
1. Board page SSR function sets `og:image` to `/api/og/{shareToken}.webp`
2. OG image endpoint:
   - Calls `get_public_board(share_token)` RPC to get board data
   - Finds OG image (user-designated via `og_image_id` or falls back to first image)
   - Fetches from Supabase: `/storage/v1/render/image/public/board-images/{storagePath}?width=1200&height=630&resize=cover&quality=35`
   - Sends `Accept: image/webp` header to force WebP conversion
   - Proxies the WebP image back (not a redirect)
   - Returns with `Content-Type: image/webp`

### Meta Tags Generated
```html
<meta property="og:type" content="website" />
<meta property="og:url" content="https://a11-moodboard.pages.dev/b/{shareToken}" />
<meta property="og:title" content="{Board Name}" />
<meta property="og:description" content="{Board Description}" />
<meta property="og:image" content="https://a11-moodboard.pages.dev/api/og/{shareToken}.webp" />
<meta property="og:image:secure_url" content="https://a11-moodboard.pages.dev/api/og/{shareToken}.webp" />
<meta property="og:image:type" content="image/webp" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="1200" />
<meta property="og:image:alt" content="{Board Name}" />
<meta property="og:site_name" content="Moodeight" />
```

## Official Requirements Research

### Facebook Requirements
- **Image dimensions:** Min 200x200, recommended 1200x630 (1.91:1 aspect ratio)
- **Max file size:** 8MB
- **Formats:** JPG, PNG, GIF
- **Required tags:** og:url, og:title, og:description, og:image
- **Recommended:** Specify og:image:width and og:image:height
- Source: https://developers.facebook.com/docs/sharing/webmasters

### WhatsApp Requirements (from community research)
- **File size:** MUST be under 300KB
- **Format:** Conflicting information:
  - Some sources say WebP is required
  - Some sources say JPG/PNG only (no WebP)
  - Medium article claimed WebP is required: https://medium.com/@eduardojs999/how-to-use-whatsapp-open-graph-preview-with-next-js-avoiding-common-pitfalls-88fea4b7c949
- **Dimensions:** 1200x630 recommended
- **Note:** No official WhatsApp documentation found

### Supabase Image Transformation
- **Endpoint:** `/storage/v1/render/image/public/{bucket}/{path}`
- **Parameters:**
  - `width` (1-2500)
  - `height` (1-2500)
  - `quality` (20-100, default 80)
  - `resize` (cover/contain/fill)
  - `format=origin` to bypass conversion
- **Auto WebP conversion:** Supabase automatically converts to WebP when client sends `Accept: image/webp` header
- **Quality threshold:** Higher quality values may result in original format being served; quality=35 reliably produces WebP
- Docs: https://supabase.com/docs/guides/storage/serving/image-transformations

## Debugging Steps Taken

### 1. Initial Implementation
- ✅ Created SSR function with OG meta tags
- ✅ Created OG image endpoint
- ✅ Added user-selectable OG image (database column `boards.og_image_id`)

### 2. Image Format Issues
- ❌ Initially tried JPEG - didn't work in WhatsApp
- ❌ Tried explicit `format=webp` parameter - Supabase rejected (400 error)
- ✅ Discovered Supabase auto-converts to WebP based on Accept header
- ✅ Added `Accept: image/webp` header to fetch call

### 3. Image Size Issues
- ❌ quality=60 resulted in 1.3MB PNG (no transformation applied)
- ❌ quality=50 still too large
- ✅ quality=35 produces 29-38KB WebP files

### 4. File Extension Mismatch
- ❌ URL was `.png` but serving WebP
- ✅ Created `.webp` endpoint
- ✅ Updated meta tags to use `.webp` URL
- ❌ **Still doesn't work in WhatsApp**

### 5. Other Attempted Fixes
- ✅ Added robots.txt to allow social media crawlers
- ✅ Removed Accept header check that was blocking Facebook
- ✅ Changed from relative to absolute URLs
- ✅ Added og:image:width and og:image:height tags
- ✅ Proxy image instead of redirecting (Facebook doesn't follow redirects)
- ✅ File extension matches content type

## Testing URLs

### Working Test URLs
- Board 1: https://a11-moodboard.pages.dev/b/4d730d0b-ac24-4fd8-930f-ab4ae76b63ec
- Board 2: https://a11-moodboard.pages.dev/b/4f8b2aa0-24e6-4871-9c2b-68719bbbb7cf

### OG Image URLs
- Board 1: https://a11-moodboard.pages.dev/api/og/4d730d0b-ac24-4fd8-930f-ab4ae76b63ec.webp
- Board 2: https://a11-moodboard.pages.dev/api/og/4f8b2aa0-24e6-4871-9c2b-68719bbbb7cf.webp

### Testing Tools
- Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/
- OpenGraph.xyz: https://www.opengraph.xyz/

## Current Behavior

### Facebook Sharing Debugger
- ✅ Shows all meta tags correctly
- ✅ Displays image preview
- ✅ Shows correct title and description
- ✅ No errors or warnings

### WhatsApp
- ✅ Shows title
- ✅ Shows description
- ❌ **Does NOT show image** (blank/missing)

### Facebook Messenger
- ✅ Shows title
- ✅ Shows description
- ❌ **Does NOT show image** (blank/missing)

## Potential Remaining Issues

1. **WebP Support Uncertainty**
   - Conflicting information about whether WhatsApp requires or rejects WebP
   - Need to test with JPG/PNG to rule out WebP as the issue
   - Could try serving JPG with aggressive compression (quality=20-30)

2. **Content-Type Header Mismatch**
   - URL ends in `.webp`
   - Serving `Content-Type: image/webp`
   - But could test if WhatsApp needs exact match

3. **Image Validation**
   - WhatsApp might be performing additional validation we're not aware of
   - Could be checking image content, not just headers
   - Might need specific WebP encoding settings

4. **Caching Issues**
   - WhatsApp might have cached the old broken version
   - May need to wait longer for cache to expire
   - Try with completely new board/share token

5. **Missing Meta Tags**
   - Some sources mention `fb:app_id` (but this is optional)
   - Could try adding more meta tags to see if it helps

6. **Network/Firewall Issues**
   - WhatsApp servers might not be able to reach Cloudflare Pages
   - Though unlikely since Debugger works

## Recommended Solution: Pre-generate OG Images

**Instead of transforming on-demand, generate the OG preview when:**
- User creates a board (use first image)
- User changes the designated OG image

**Implementation:**
1. When `og_image_id` is set/changed, trigger an Edge Function or client-side upload
2. Fetch the source image from storage
3. Transform to WebP 1200x630 quality=35 using Sharp/Canvas
4. Upload to new storage bucket: `og-images/{boardId}.webp`
5. Store the storage path in `boards.og_image_path`
6. Serve directly from Supabase storage (no proxy needed)

**Benefits:**
- ✅ No Accept header dependency
- ✅ Guaranteed file size (can validate < 300KB)
- ✅ Faster serving (direct from CDN)
- ✅ Consistent format across all clients
- ✅ Can test/inspect the actual file in storage
- ✅ Reduces transformation API costs

**Storage structure:**
```
og-images/
  {boardId}.webp
```

**Meta tag:**
```html
<meta property="og:image" content="https://{project}.supabase.co/storage/v1/object/public/og-images/{boardId}.webp" />
```

## Next Steps to Try

1. **Implement pre-generated OG images (RECOMMENDED)**
   - See above for implementation details
   - This is likely the most reliable solution

2. **Test with JPG instead of WebP**
   - Change quality parameter to produce JPG
   - Update Content-Type to image/jpeg
   - Update og:image:type to image/jpeg
   - See if WhatsApp shows the image

2. **Test with different image**
   - Try a different source image (not PNG)
   - Try a much smaller image (100KB original)
   - See if specific image characteristics matter

3. **Test direct Supabase URL**
   - Temporarily set og:image directly to Supabase storage URL
   - Bypass our proxy endpoint completely
   - See if the issue is with our endpoint

4. **Add more meta tags**
   - Try adding fb:app_id
   - Try adding article:published_time
   - See if WhatsApp needs additional signals

5. **Test on actual device**
   - Current tests might be using WhatsApp Web
   - Try on actual Android/iOS WhatsApp app
   - Behavior might differ between platforms

6. **Check Cloudflare settings**
   - Verify no Cloudflare caching/optimization interfering
   - Check if Browser Cache TTL affects social crawlers
   - Review WAF rules that might block WhatsApp's user agent

7. **Monitor network requests**
   - Set up logging to see if WhatsApp is even fetching the image
   - Check Cloudflare Analytics for requests from WhatsApp
   - See what user agent WhatsApp uses

## Related Code Changes

### Database Migration
```sql
ALTER TABLE public.boards
ADD COLUMN og_image_id uuid REFERENCES public.images(id) ON DELETE SET NULL;
```

### UI Component
`src/components/SetOgImageDialog.tsx` - Allows users to select which image to use for OG preview

### Service Updates
`src/services/boards.ts` - Added foreign key hints for PostgREST embedding

## Known Working Examples

Other websites that successfully show images in WhatsApp:
- Need to find examples and inspect their implementation
- Check their image format, size, meta tags
- Compare with our implementation

## References

- Facebook Sharing Best Practices: https://developers.facebook.com/docs/sharing/webmasters
- Facebook Image Requirements: https://developers.facebook.com/docs/sharing/webmasters/images
- Supabase Image Transformations: https://supabase.com/docs/guides/storage/serving/image-transformations
- Medium article on WhatsApp OG: https://medium.com/@eduardojs999/how-to-use-whatsapp-open-graph-preview-with-next-js-avoiding-common-pitfalls-88fea4b7c949

---

*Last updated: 2025-10-05*
*Status: Image shows in Facebook Debugger but NOT in WhatsApp or Messenger*
