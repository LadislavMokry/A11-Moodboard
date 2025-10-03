# Manual Testing Guide - Phase 5.1: Board Page & Image Grid

This guide provides step-by-step instructions for manually testing the Phase 5.1 implementation in the development build.

## Prerequisites

1. **Start the development server:**
   ```bash
   npm run dev
   ```
   The app should be running at http://localhost:5173

2. **Ensure you have test data:**
   - At least one board with multiple images (5-10 images recommended)
   - At least one empty board (no images)
   - Images of different aspect ratios (portrait, landscape, square)
   - At least one GIF image (if possible)

## Test Scenarios

### 1. Board Page Navigation

**Test:** Accessing a board page

1. Sign in to the application
2. Navigate to the home page (`/`) - you should see "Your boards"
3. Click on any board card
4. **Expected Results:**
   - ✅ URL changes to `/boards/{boardId}`
   - ✅ Board page loads without errors
   - ✅ Header is visible at the top
   - ✅ Board name is displayed prominently
   - ✅ Board description is shown (if it exists)

---

### 2. Board Header Display

**Test:** Board header information

1. Navigate to a board with a name and description
2. Check the header section
3. **Expected Results:**
   - ✅ Board name is displayed in large text (3xl)
   - ✅ Description is shown below the name (if exists)
   - ✅ Image count shows "X images" or "1 image" (singular)
   - ✅ "Updated {date}" shows the last update date
   - ✅ "Back to boards" link is visible and clickable
   - ✅ Three action buttons are visible: "Upload", "Share", and "⋮" (menu)

**Test:** Back button functionality

1. Click "Back to boards" link
2. **Expected Results:**
   - ✅ Navigates back to `/` (home page)
   - ✅ Board list is displayed

---

### 3. Image Grid Layout

**Test:** Masonry grid layout (desktop)

1. Navigate to a board with 6+ images
2. Expand browser to desktop width (>1024px)
3. **Expected Results:**
   - ✅ Images display in 3 columns
   - ✅ Images maintain their aspect ratios
   - ✅ No weird gaps or overlapping
   - ✅ Images are in correct order (position 1, 2, 3, etc.)
   - ✅ Each image has a 1rem gap between them

**Test:** Masonry grid layout (tablet)

1. Resize browser to tablet width (640px - 1024px)
2. **Expected Results:**
   - ✅ Images display in 2 columns
   - ✅ Layout reflows smoothly

**Test:** Masonry grid layout (mobile)

1. Resize browser to mobile width (<640px)
2. **Expected Results:**
   - ✅ Images display in 1 column
   - ✅ Images span full width

---

### 4. Image Display & Quality

**Test:** Image loading and quality

1. Navigate to a board with images
2. Observe image loading
3. Open browser DevTools > Network tab
4. Reload the page
5. **Expected Results:**
   - ✅ Images use lazy loading (only visible images load initially)
   - ✅ Different sizes are loaded based on viewport (360w, 720w, 1080w)
   - ✅ Images have `srcset` attribute (check in DevTools > Elements)
   - ✅ Images maintain aspect ratio (no distortion)
   - ✅ Images are sharp and clear (not blurry)

**Test:** GIF handling

1. Navigate to a board with a GIF image
2. Inspect the GIF in DevTools
3. **Expected Results:**
   - ✅ GIF loads without srcset (full URL)
   - ✅ GIF animates (not static)

**Test:** Images without dimensions

1. Check if any images don't have width/height metadata
2. **Expected Results:**
   - ✅ Images still display correctly (no crashes)
   - ✅ Layout doesn't break

---

### 5. Hover Interactions

**Test:** Image hover state (desktop only)

1. Navigate to a board with images
2. Hover over an image (do not click)
3. **Expected Results:**
   - ✅ 2px white outline appears around the image
   - ✅ Outline appears smoothly (transition)
   - ✅ Outline disappears when mouse leaves

**Test:** Caption overlay on hover

1. Hover over an image that has a caption
2. **Expected Results:**
   - ✅ Dark gradient overlay appears at bottom of image
   - ✅ Caption text is visible in white
   - ✅ Caption fades in smoothly
   - ✅ Caption fades out when mouse leaves

**Test:** Marquee animation for long captions

1. Find or add an image with a very long caption (>100 characters)
2. Hover over the image
3. **Expected Results:**
   - ✅ If caption overflows, it scrolls/animates (marquee effect)
   - ✅ Animation is smooth and readable
   - ✅ Animation loops continuously

**Test:** Three-dot menu button on hover

1. Hover over any image
2. **Expected Results:**
   - ✅ Three-dot menu button (⋮) appears in top-right corner
   - ✅ Button has dark semi-transparent background
   - ✅ Button is visible on top of the image
   - ✅ Button fades in/out smoothly

---

### 6. Click Interactions

**Test:** Image click (lightbox placeholder)

1. Click on any image in the grid
2. Open browser console (F12)
3. **Expected Results:**
   - ✅ Console shows: "Image clicked: {imageId}"
   - ✅ No errors in console
   - ✅ (Lightbox will be implemented in Phase 6)

**Test:** Image menu button click

1. Hover over an image
2. Click the three-dot menu button (⋮)
3. Open browser console
4. **Expected Results:**
   - ✅ Console shows: "Image menu clicked: {imageId}"
   - ✅ Click does NOT trigger image click (event propagation stopped)
   - ✅ No errors in console

**Test:** Header action buttons

1. Click "Upload" button
2. Click "Share" button
3. Click "⋮" menu button
4. Open browser console
5. **Expected Results:**
   - ✅ Console shows: "Upload clicked"
   - ✅ Console shows: "Share clicked"
   - ✅ Console shows: "Board menu clicked"
   - ✅ No errors in console
   - ✅ (Full functionality will be implemented in later phases)

---

### 7. Loading States

**Test:** Board loading state

1. Open browser DevTools > Network tab
2. Set network throttling to "Slow 3G"
3. Navigate to a board page
4. **Expected Results:**
   - ✅ Loading spinner is visible immediately
   - ✅ Spinner is centered on the page
   - ✅ No content flashing before spinner
   - ✅ Spinner disappears when content loads

---

### 8. Error States

**Test:** Board not found error

1. Navigate to a non-existent board: `/boards/00000000-0000-0000-0000-000000000000`
2. **Expected Results:**
   - ✅ Error message appears
   - ✅ Message says "Something went wrong"
   - ✅ Shows "Board not found" error text
   - ✅ Red error styling is applied
   - ✅ Alert icon is visible

**Test:** Network error

1. Open DevTools > Network tab
2. Set to "Offline"
3. Navigate to a board page
4. **Expected Results:**
   - ✅ Error message appears
   - ✅ Error text indicates network/fetch failure
   - ✅ No app crash

---

### 9. Empty State

**Test:** Board with no images

1. Navigate to a board that has zero images
2. **Expected Results:**
   - ✅ "No images yet" message is displayed
   - ✅ "Upload images to get started" helper text is shown
   - ✅ Message is centered on the page
   - ✅ No empty grid or broken layout
   - ✅ Upload button is still available in header

---

### 10. Responsive Design

**Test:** Mobile layout (<640px)

1. Resize browser to 375px width (iPhone size)
2. Navigate to a board with images
3. **Expected Results:**
   - ✅ Single column layout
   - ✅ Images span full width (with padding)
   - ✅ Header buttons stack or shrink appropriately
   - ✅ Board name and description are readable
   - ✅ No horizontal scrolling

**Test:** Tablet layout (768px)

1. Resize browser to 768px width (iPad size)
2. **Expected Results:**
   - ✅ Two column layout
   - ✅ Images are well-proportioned
   - ✅ No excessive white space

**Test:** Desktop layout (1280px+)

1. Resize browser to 1280px width or larger
2. **Expected Results:**
   - ✅ Three column layout
   - ✅ Content is centered (max-width container)
   - ✅ Images are not stretched too wide

---

### 11. Accessibility

**Test:** Keyboard navigation

1. Use Tab key to navigate through the page
2. **Expected Results:**
   - ✅ Can tab to "Back to boards" link
   - ✅ Can tab to action buttons (Upload, Share, menu)
   - ✅ Focus indicator is visible on each element
   - ✅ Tab order is logical (top to bottom, left to right)

**Test:** Screen reader (optional)

1. Enable screen reader (VoiceOver on Mac, NVDA on Windows)
2. Navigate through the page
3. **Expected Results:**
   - ✅ Board name is announced
   - ✅ Image count and update date are announced
   - ✅ Images have alt text (from captions)
   - ✅ Loading spinner has "status" role
   - ✅ Error message has "alert" role

**Test:** Alt text for images

1. Inspect image elements in DevTools
2. **Expected Results:**
   - ✅ Images with captions have `alt="{caption}"`
   - ✅ Images without captions have `alt=""`
   - ✅ No `alt` attribute is missing

---

### 12. Image Ordering

**Test:** Images display in correct order

1. Check image positions in database (via Supabase dashboard or API)
2. Compare with visual order on the page
3. **Expected Results:**
   - ✅ Image with position=1 appears first
   - ✅ Image with position=2 appears second
   - ✅ Order is consistent across all breakpoints
   - ✅ Order matches top-to-bottom, left-to-right reading

---

### 13. Performance

**Test:** Large board (50+ images)

1. Navigate to a board with 50+ images (create one if needed)
2. **Expected Results:**
   - ✅ Page loads within reasonable time (<3 seconds)
   - ✅ Lazy loading works (only visible images load)
   - ✅ Smooth scrolling (no janky animations)
   - ✅ Browser doesn't freeze

**Test:** Scroll performance

1. Navigate to a board with 20+ images
2. Scroll rapidly up and down
3. **Expected Results:**
   - ✅ Smooth scrolling (60fps)
   - ✅ Images lazy-load as you scroll
   - ✅ No layout shift as images load

---

### 14. Browser Compatibility

**Test:** Multiple browsers

Test on at least two of the following:
- Chrome/Edge (Chromium)
- Firefox
- Safari (if on Mac)

**Expected Results:**
- ✅ Layout looks identical across browsers
- ✅ Hover effects work
- ✅ Images load correctly
- ✅ No console errors

---

### 15. Theme Support

**Test:** Dark mode

1. Toggle to dark mode (via theme switcher)
2. Navigate to a board
3. **Expected Results:**
   - ✅ Background is dark
   - ✅ Text is light/readable
   - ✅ Image backgrounds are dark (if visible)
   - ✅ Buttons have appropriate dark styling

**Test:** Light mode

1. Toggle to light mode
2. **Expected Results:**
   - ✅ Background is light
   - ✅ Text is dark/readable
   - ✅ Proper contrast throughout

---

## Quick Checklist

Use this checklist for a rapid smoke test:

- [ ] Board page loads without errors
- [ ] Board name and description display
- [ ] Image count and date are correct
- [ ] Back button navigates to home page (/)
- [ ] Images display in masonry grid (1/2/3 columns based on screen size)
- [ ] Images maintain aspect ratios
- [ ] Hover shows white outline on images
- [ ] Hover shows caption overlay (if caption exists)
- [ ] Three-dot menu button appears on hover
- [ ] Clicking image logs to console
- [ ] Clicking menu button logs to console (without triggering image click)
- [ ] Action buttons (Upload, Share, menu) log to console
- [ ] Empty board shows "No images yet" message
- [ ] Loading state shows spinner
- [ ] Error state shows error message
- [ ] Responsive layout works on mobile/tablet/desktop
- [ ] Images lazy-load as you scroll
- [ ] No console errors or warnings

---

## Bug Reporting Template

If you find an issue, report it with this format:

```
**Issue:** [Brief description]

**Steps to Reproduce:**
1.
2.
3.

**Expected Behavior:**


**Actual Behavior:**


**Environment:**
- Browser:
- Screen size:
- Board ID:
- Number of images:

**Screenshots:** (if applicable)

**Console Errors:** (if any)
```

---

## Common Issues & Solutions

### Issue: Images not loading
- **Check:** Network tab in DevTools for failed requests
- **Check:** Supabase storage bucket permissions
- **Check:** `VITE_SUPABASE_URL` environment variable is set

### Issue: Layout breaks on resize
- **Check:** Browser zoom is at 100%
- **Check:** Tailwind CSS is loaded correctly
- **Check:** No browser extensions interfering

### Issue: Hover effects not working on mobile
- **Expected:** Hover effects are desktop-only
- **Note:** Mobile uses tap interactions instead

### Issue: "No QueryClient set" error
- **Cause:** Component is not wrapped with QueryClientProvider
- **Check:** App.tsx has proper provider setup

### Issue: Images out of order
- **Check:** Database positions (should be 1, 2, 3, not 0-indexed)
- **Check:** ImageGrid component sorts by position

---

## Testing with Real Data

### Create Test Boards

**Empty Board:**
1. Create a new board via home page (use "Create Board" button if available, or via staging)
2. Don't upload any images
3. Test empty state

**Small Board (3-5 images):**
1. Create a board
2. Upload 3-5 images of different sizes
3. Test basic layout

**Large Board (20+ images):**
1. Create a board
2. Upload 20+ images
3. Test performance and lazy loading

**Mixed Content Board:**
1. Create a board
2. Upload a mix of:
   - Landscape photos
   - Portrait photos
   - Square images
   - At least one GIF
   - Images with long captions
   - Images without captions
3. Test all display scenarios

---

## Automated Test Verification

Before manual testing, ensure all automated tests pass:

```bash
# Run all tests
npm test -- --run

# Run Phase 5.1 specific tests
npm test -- BoardPage.test.tsx ImageGrid.test.tsx ImageGridItem.test.tsx --run

# Expected output:
# ✓ BoardPage.test.tsx (10 tests)
# ✓ ImageGrid.test.tsx (8 tests)
# ✓ ImageGridItem.test.tsx (14 tests)
# Test Files: 3 passed (3)
# Tests: 32 passed (32)
```

If tests fail, fix them before manual testing.

---

## Sign-off Criteria

Phase 5.1 is ready for production when:

- ✅ All automated tests pass (32/32)
- ✅ Manual test scenarios pass (15/15)
- ✅ No console errors or warnings
- ✅ Works on Chrome, Firefox, and Safari
- ✅ Works on mobile, tablet, and desktop screen sizes
- ✅ Accessible via keyboard navigation
- ✅ Loading and error states work correctly
- ✅ Performance is acceptable (page load <3s, smooth scrolling)

---

## Next Steps (Phase 5.2 and beyond)

After Phase 5.1 is validated:
- Phase 5.2: Upload functionality
- Phase 5.3: Drag-and-drop reordering
- Phase 6: Lightbox implementation
- Phase 7: Sharing functionality

Each phase will build upon the stable foundation of 5.1.
