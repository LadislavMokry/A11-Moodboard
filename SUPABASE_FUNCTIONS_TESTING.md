# Supabase Edge Functions Testing Guide

This guide provides step-by-step instructions to test all 4 Edge Functions deployed to Supabase.

## Prerequisites

1. **Make sure you're logged in to the app** at http://localhost:5173
2. **Open Browser DevTools** (F12 or right-click → Inspect)
3. **Go to Console tab** to see logs and responses
4. **Have at least one board with images** created for testing

## Testing Overview

You have 4 Edge Functions to test:
1. ✅ `delete_images` - Delete one or multiple images
2. ✅ `delete_board` - Delete an entire board with all its images
3. ✅ `import_from_url` - Import image from a URL
4. ✅ `transfer_images` - Copy or move images between boards

---

## 1. Test `delete_images` Function

### What it does
Deletes one or multiple images from a board and removes their files from storage.

### Steps to Test

#### Option A: Via UI (Recommended - Easiest)
1. **Navigate to any board** with at least one image
2. **Click on an image** to open the lightbox
3. **Click the trash icon** in the lightbox toolbar
4. **Confirm deletion** in the dialog
5. **Expected Result**:
   - Image should disappear from the board
   - Success toast: "Image deleted"
   - No CORS errors in console

#### Option B: Via UI Bulk Delete
1. **Navigate to any board** with multiple images
2. **Long-press (mobile) or right-click (desktop)** on an image to enter selection mode
3. **Select 2-3 images** by clicking on them
4. **Click the trash icon** in the top toolbar
5. **Confirm deletion**
6. **Expected Result**:
   - All selected images disappear
   - Success toast: "X images deleted"

#### Option C: Via Browser Console (Advanced)
```javascript
// Get your auth token first
const { data: { session } } = await supabase.auth.getSession();
const token = session.access_token;

// Delete single image (replace with real image ID)
const response = await fetch('https://jqjkdfbgrtdlkkfwavyq.supabase.co/functions/v1/delete_images', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    imageIds: ['your-image-id-here'] // Get from database or network tab
  })
});

const result = await response.json();
console.log('Delete result:', result);
```

### Expected Response
```json
{
  "deleted": 1,
  "errors": null,
  "notFound": null
}
```

### Common Issues
- **401 Unauthorized**: You're not logged in
- **403 Forbidden**: You don't own the image
- **404 Not found**: Image ID doesn't exist
- **CORS error**: Edge Function needs redeployment with CORS headers

---

## 2. Test `delete_board` Function

### What it does
Deletes an entire board including all its images, cover images, and storage files.

### Steps to Test

#### Option A: Via UI (Recommended - Easiest)
1. **Go to Home page** (shows all your boards)
2. **Find a test board** you can delete (create a new one if needed)
3. **Click the ⋮ menu** on the board card
4. **Click "Delete"**
5. **Type the board name** to confirm
6. **Click "Delete board"**
7. **Expected Result**:
   - Board disappears from home page
   - Success toast: "Board deleted"
   - Redirected to home page

#### Option B: Via Board Page Menu
1. **Open any board** by clicking it
2. **Click the ⋮ menu** in the top right
3. **Click "Delete board"**
4. **Type the board name** to confirm
5. **Click "Delete board"**

#### Option C: Via Browser Console (Advanced)
```javascript
// Get your auth token
const { data: { session } } = await supabase.auth.getSession();
const token = session.access_token;

// Delete board (replace with real board ID)
const response = await fetch('https://jqjkdfbgrtdlkkfwavyq.supabase.co/functions/v1/delete_board', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    boardId: 'your-board-id-here'
  })
});

const result = await response.json();
console.log('Delete board result:', result);
```

### Expected Response
```json
{
  "message": "Board deleted successfully",
  "deletedImages": 5,
  "deletedCoverImages": 4,
  "storageErrors": null
}
```

### Common Issues
- **401 Unauthorized**: You're not logged in
- **403 Forbidden**: You don't own the board
- **404 Not found**: Board ID doesn't exist

---

## 3. Test `import_from_url` Function

### What it does
Fetches an image from a URL and uploads it to your board's storage.

### Steps to Test

#### Option A: Via UI (Recommended - Easiest)
1. **Navigate to any board**
2. **Click the "+" button** or paste area
3. **Paste an image URL** (e.g., `https://picsum.photos/800/600`)
4. **Press Enter or click "Import"**
5. **Expected Result**:
   - Upload progress shown
   - Image appears in the board
   - Success toast

#### Good Test URLs
```
https://picsum.photos/800/600
https://picsum.photos/1200/800
https://images.unsplash.com/photo-1506905925346-21bda4d32df4
```

#### Option B: Via Browser Console (Advanced)
```javascript
// Get your auth token
const { data: { session } } = await supabase.auth.getSession();
const token = session.access_token;

// Import from URL (replace with real board ID)
const response = await fetch('https://jqjkdfbgrtdlkkfwavyq.supabase.co/functions/v1/import_from_url', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    boardId: 'your-board-id-here',
    imageUrl: 'https://picsum.photos/800/600',
    caption: 'Test import from URL'
  })
});

const result = await response.json();
console.log('Import result:', result);
```

### Expected Response
```json
{
  "id": "image-uuid",
  "board_id": "board-uuid",
  "storage_path": "boards/board-id/uuid.jpg",
  "mime_type": "image/jpeg",
  "width": 800,
  "height": 600,
  "size_bytes": 123456,
  "source_url": "https://picsum.photos/800/600",
  "caption": "Test import from URL",
  "position": 1,
  "created_at": "2025-10-05T12:00:00Z",
  "updated_at": "2025-10-05T12:00:00Z"
}
```

### Common Issues
- **400 Bad Request**: Invalid URL or missing parameters
- **401 Unauthorized**: You're not logged in
- **403 Forbidden**: You don't own the board
- **413 Payload Too Large**: Image exceeds 10 MB limit
- **Timeout**: Image took too long to download

---

## 4. Test `transfer_images` Function

### What it does
Copies or moves images from one board to another (with storage file duplication or relocation).

### Steps to Test

#### Option A: Via UI (Recommended - Easiest)

**Setup:**
1. **Create 2 boards** (Source and Destination)
2. **Add 2-3 images** to the source board

**Test Copy Operation:**
1. **Open the source board**
2. **Enter selection mode** (long-press or right-click on an image)
3. **Select 2 images**
4. **Click the "Transfer" button** (arrow icon) in toolbar
5. **Select "Copy"** in the dialog
6. **Select the destination board**
7. **Click "Copy images"**
8. **Expected Result**:
   - Images appear in destination board
   - Original images remain in source board
   - Success toast: "Images copied"

**Test Move Operation:**
1. **Open the source board**
2. **Enter selection mode**
3. **Select 2 images**
4. **Click the "Transfer" button**
5. **Select "Move"** in the dialog
6. **Select the destination board**
7. **Click "Move images"**
8. **Expected Result**:
   - Images appear in destination board
   - Images removed from source board
   - Success toast: "Images moved"
   - Redirected to destination board

**Test Create & Transfer:**
1. **Open source board**
2. **Select images**
3. **Click "Transfer"**
4. **Click "Create new board"**
5. **Enter board name**: "Test Transfer Board"
6. **Click "Create & Transfer"**
7. **Expected Result**:
   - New board created
   - Images transferred to new board

#### Option B: Via Browser Console (Advanced)
```javascript
// Get your auth token
const { data: { session } } = await supabase.auth.getSession();
const token = session.access_token;

// Copy images between boards
const response = await fetch('https://jqjkdfbgrtdlkkfwavyq.supabase.co/functions/v1/transfer_images', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    operation: 'copy', // or 'move'
    sourceBoardId: 'source-board-id',
    destBoardId: 'destination-board-id',
    imageIds: ['image-id-1', 'image-id-2']
  })
});

const result = await response.json();
console.log('Transfer result:', result);
```

### Expected Response (Copy)
```json
{
  "operation": "copy",
  "transferred": 2,
  "sourceBoard": "source-board-id",
  "destBoard": "dest-board-id",
  "newImageIds": ["new-uuid-1", "new-uuid-2"],
  "storageErrors": null
}
```

### Expected Response (Move)
```json
{
  "operation": "move",
  "transferred": 2,
  "sourceBoard": "source-board-id",
  "destBoard": "dest-board-id",
  "imageIds": ["moved-id-1", "moved-id-2"],
  "storageErrors": null
}
```

### Common Issues
- **400 Bad Request**: Invalid operation or missing parameters
- **401 Unauthorized**: You're not logged in
- **403 Forbidden**: You don't own source or destination board
- **404 Not found**: Board or image IDs don't exist
- **Limit exceeded**: Trying to transfer more than 20 images at once

---

## Quick Test Checklist

Use this checklist to verify all functions work:

### Delete Images
- [ ] Delete single image via lightbox
- [ ] Delete multiple images via bulk selection
- [ ] Verify CORS headers work (no console errors)

### Delete Board
- [ ] Delete board from home page
- [ ] Delete board from board page menu
- [ ] Verify all images and storage files deleted

### Import from URL
- [ ] Import image via paste in board
- [ ] Import multiple URLs
- [ ] Verify images appear correctly

### Transfer Images
- [ ] Copy images between existing boards
- [ ] Move images between existing boards
- [ ] Create new board and transfer to it
- [ ] Verify source/dest boards show correct images

---

## Monitoring & Debugging

### Check Edge Function Logs
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/jqjkdfbgrtdlkkfwavyq/functions)
2. Click on a function name
3. View **Logs** tab to see invocations and errors

### Check Network Tab
1. Open DevTools → Network tab
2. Filter by "delete_images", "delete_board", etc.
3. Click on a request to see:
   - Request headers (auth token)
   - Request payload (body)
   - Response status (200, 400, 401, etc.)
   - Response body (success/error message)

### Common Error Codes
- `200 OK` - Success
- `400 Bad Request` - Invalid parameters
- `401 Unauthorized` - Missing or invalid auth token
- `403 Forbidden` - Not authorized to access resource
- `404 Not Found` - Resource doesn't exist
- `413 Payload Too Large` - File/data exceeds limits
- `500 Internal Server Error` - Server-side error (check function logs)

---

## Testing Complete! ✅

If all tests pass, your Supabase Edge Functions are working correctly. You can now:
- Deploy to production
- Build the Cloudflare Pages Functions for OG image generation
- Continue with Phase 11+ features

Need help? Check the function logs in the Supabase Dashboard or the browser console for detailed error messages.
