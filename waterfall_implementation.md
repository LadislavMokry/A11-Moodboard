# Waterfall Layout Investigation

## Summary
- Anonymous homepage should display a waterfall/"Pinterest" grid sourced from the showcase board.
- The grid rendered as a flat, top-aligned masonry layout with no alternating column heights.
- Data fetching (`get_showcase_board` RPC) worked; the failure was inside the front-end layout code, not authentication.

## What We Observed
- `src/components/MasonryGrid.tsx` relied on CSS Grid (`grid-auto-flow: row dense`). That approach keeps every column anchored to the top, so the staggered "waterfall" silhouette never appears.
- Because `ImageGridItem` keeps images at `opacity: 0` until the full asset resolves, cached images briefly reported zero height. CSS Grid then collapsed rows and reflowed them to the top, reinforcing the flat layout.
- Console errors about `Invalid Refresh Token` were unrelated; they stem from stale local storage during Supabase auto-refresh and do not block the anonymous showcase request.

## Fix Applied
1. **Rebuilt the layout algorithm in `src/components/MasonryGrid.tsx`:**
   - Use a `ResizeObserver` to compute a responsive column count (capped at six) from the container width.
   - Distribute the sorted image list round-robin into that many columns.
   - Render columns as flex stacks, alternating `flex-direction: column`/`column-reverse` and reversing the rendered order for odd columns. This produces the required waterfall offset while preserving chronological ordering.
   - Constrain the container with `maxHeight` and `overflow: hidden` to match the hero design.
2. **Stabilised image height reporting in `src/components/ImageGridItem.tsx`:**
   - Immediately mark GIFs and cached images as loaded.
   - Add a two-second safety timeout to flip images visible even if the load event never fires, preventing zero-height placeholders.

## Validation
- Unit coverage lives in `src/__tests__/MasonryGrid.test.tsx` and `src/__tests__/ImageGrid.test.tsx`. Run `npm test -- MasonryGrid.test.tsx ImageGrid.test.tsx` before deploying.
- Manual check: visit the signed-out homepage at desktop widths. Columns alternate direction and maintain the waterfall silhouette while data continues to stream from Supabase.

## Follow-ups / Notes
- Keep Supabase RPC `get_showcase_board` public (`security definer` already handles this); no dashboard changes were required.
- If we adjust hero height, update the `maxHeight` prop passed from `src/components/ShowcaseBoard.tsx` so the container still clamps correctly.
