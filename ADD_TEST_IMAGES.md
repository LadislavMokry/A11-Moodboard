# Adding Test Images to Boards (Manual Workaround for Phase 5.1)

Since Phase 5.2 (Upload functionality) isn't implemented yet, here's how to manually add test images to your boards for testing Phase 5.1.

## Option 1: Using Supabase SQL Editor (Recommended)

### Step 1: Get Your Board ID
1. Navigate to http://localhost:5173 and sign in
2. Click on a board to view it
3. Copy the board ID from the URL: `/boards/{boardId}`

### Step 2: Upload Images to Supabase Storage
1. Go to your Supabase Dashboard (https://supabase.com/dashboard)
2. Select your project
3. Go to **Storage** in the left sidebar
4. Click on the **board-images** bucket
5. Create a folder with your board ID: `boards/{boardId}/`
6. Upload 5-10 test images (JPG, PNG, or GIF) into that folder
7. Note the filenames (e.g., `image1.jpg`, `image2.jpg`, etc.)

### Step 3: Insert Image Records via SQL
1. In Supabase Dashboard, go to **SQL Editor** in the left sidebar
2. Click **New Query**
3. Paste this SQL template (replace placeholders):

```sql
-- Replace these values:
-- {BOARD_ID} = your board ID from the URL
-- {IMAGE_FILENAME} = the filename you uploaded (e.g., image1.jpg)

-- Insert first image
INSERT INTO images (
  board_id,
  storage_path,
  position,
  mime_type,
  width,
  height,
  size_bytes,
  original_filename,
  caption
) VALUES (
  '{BOARD_ID}',
  'boards/{BOARD_ID}/{IMAGE_FILENAME}',
  1,
  'image/jpeg',
  1920,
  1080,
  500000,
  '{IMAGE_FILENAME}',
  'Test Image 1'
);

-- Insert second image
INSERT INTO images (
  board_id,
  storage_path,
  position,
  mime_type,
  width,
  height,
  size_bytes,
  original_filename,
  caption
) VALUES (
  '{BOARD_ID}',
  'boards/{BOARD_ID}/{IMAGE_FILENAME_2}',
  2,
  'image/jpeg',
  1920,
  1080,
  500000,
  '{IMAGE_FILENAME_2}',
  'Test Image 2'
);

-- Add more images as needed (increment position: 3, 4, 5, etc.)
```

4. Click **Run** to execute the query
5. Refresh your board page to see the images

### Step 4: Verify Images Display
1. Go back to http://localhost:5173/boards/{boardId}
2. The images should now display in the masonry grid

---

## Option 2: Use RPC Function (Simpler but requires Edge Function)

If the `add_image_at_top` RPC function is working:

```sql
-- Call this for each image you uploaded
SELECT add_image_at_top(
  '{BOARD_ID}'::uuid,
  'boards/{BOARD_ID}/{IMAGE_FILENAME}',
  'image/jpeg',
  1920,
  1080,
  500000,
  '{IMAGE_FILENAME}',
  'Test Caption',
  NULL -- source_url
);
```

This will automatically insert the image at position 1 and shift others down.

---

## Option 3: Quick Batch Insert (10 Images at Once)

If you uploaded 10 images named `test1.jpg` through `test10.jpg`:

```sql
-- Replace {BOARD_ID} with your actual board ID
DO $$
DECLARE
  board_uuid uuid := '{BOARD_ID}';
  i integer;
BEGIN
  FOR i IN 1..10 LOOP
    INSERT INTO images (
      board_id,
      storage_path,
      position,
      mime_type,
      width,
      height,
      size_bytes,
      original_filename,
      caption
    ) VALUES (
      board_uuid,
      'boards/' || board_uuid || '/test' || i || '.jpg',
      i,
      'image/jpeg',
      1920,
      1080,
      500000,
      'test' || i || '.jpg',
      'Test Image ' || i
    );
  END LOOP;
END $$;
```

---

## Using Sample Images from the Internet

### Free Stock Photo Sources:
- **Unsplash** - https://unsplash.com (high quality, free to use)
- **Pexels** - https://pexels.com (curated free photos)
- **Picsum Photos** - https://picsum.photos (placeholder images)

### Quick Download Script:
```bash
# Download 10 sample images from Picsum
cd ~/Downloads
for i in {1..10}; do
  curl -o test$i.jpg "https://picsum.photos/1920/1080?random=$i"
done
```

Then upload these to Supabase Storage as described in Option 1.

---

## Testing Different Image Types

### Portrait Images:
- Width: 1080, Height: 1920 (9:16)

### Landscape Images:
- Width: 1920, Height: 1080 (16:9)

### Square Images:
- Width: 1080, Height: 1080 (1:1)

### GIF Image:
- Upload a GIF file
- Set mime_type to `'image/gif'`

Example SQL for different types:

```sql
-- Portrait
INSERT INTO images (board_id, storage_path, position, mime_type, width, height, size_bytes, original_filename, caption)
VALUES ('{BOARD_ID}', 'boards/{BOARD_ID}/portrait.jpg', 1, 'image/jpeg', 1080, 1920, 500000, 'portrait.jpg', 'Portrait Test');

-- Landscape
INSERT INTO images (board_id, storage_path, position, mime_type, width, height, size_bytes, original_filename, caption)
VALUES ('{BOARD_ID}', 'boards/{BOARD_ID}/landscape.jpg', 2, 'image/jpeg', 1920, 1080, 500000, 'landscape.jpg', 'Landscape Test');

-- Square
INSERT INTO images (board_id, storage_path, position, mime_type, width, height, size_bytes, original_filename, caption)
VALUES ('{BOARD_ID}', 'boards/{BOARD_ID}/square.jpg', 3, 'image/jpeg', 1080, 1080, 500000, 'square.jpg', 'Square Test');

-- GIF
INSERT INTO images (board_id, storage_path, position, mime_type, width, height, size_bytes, original_filename, caption)
VALUES ('{BOARD_ID}', 'boards/{BOARD_ID}/animation.gif', 4, 'image/gif', 500, 500, 800000, 'animation.gif', 'Animated GIF');
```

---

## Testing Long Captions (Marquee Effect)

Insert an image with a very long caption to test the marquee animation:

```sql
INSERT INTO images (
  board_id,
  storage_path,
  position,
  mime_type,
  width,
  height,
  size_bytes,
  original_filename,
  caption
) VALUES (
  '{BOARD_ID}',
  'boards/{BOARD_ID}/long-caption.jpg',
  5,
  'image/jpeg',
  1920,
  1080,
  500000,
  'long-caption.jpg',
  'This is a very long caption that will definitely overflow the container and should trigger the marquee scrolling animation when you hover over the image in the grid'
);
```

---

## Troubleshooting

### Images not displaying?

1. **Check Storage Bucket Policies:**
   - Go to Supabase Dashboard > Storage > board-images
   - Click **Policies** tab
   - Ensure there's a policy allowing public READ access:
     ```sql
     CREATE POLICY "Public read access"
     ON storage.objects FOR SELECT
     USING ( bucket_id = 'board-images' );
     ```

2. **Check Storage Path:**
   - Storage path should be: `boards/{boardId}/{filename}`
   - NOT: `board-images/boards/{boardId}/{filename}`

3. **Check Image URLs:**
   - Open browser DevTools > Network tab
   - Look for failed image requests (red)
   - Check if the URL is correct

4. **Verify Image Record in Database:**
   ```sql
   SELECT * FROM images WHERE board_id = '{BOARD_ID}';
   ```

5. **Check RLS Policies:**
   ```sql
   -- Ensure you can SELECT images for your board
   SELECT * FROM images
   WHERE board_id = '{BOARD_ID}'
   AND board_id IN (SELECT id FROM boards WHERE owner_id = auth.uid());
   ```

### Images out of order?

Check positions are correct (1, 2, 3, not 0-indexed):
```sql
SELECT id, position, original_filename
FROM images
WHERE board_id = '{BOARD_ID}'
ORDER BY position;
```

### Update positions if needed:
```sql
UPDATE images
SET position = position + 1
WHERE board_id = '{BOARD_ID}';
```

---

## Quick Test Data Setup (Complete Example)

Here's a complete script to set up a board with 6 test images:

```sql
-- 1. Get your board ID
-- Navigate to /boards/{boardId} and copy the ID from the URL

-- 2. Upload 6 images to Supabase Storage:
--    boards/{BOARD_ID}/test1.jpg
--    boards/{BOARD_ID}/test2.jpg
--    boards/{BOARD_ID}/test3.jpg
--    boards/{BOARD_ID}/test4.jpg
--    boards/{BOARD_ID}/test5.jpg
--    boards/{BOARD_ID}/test6.jpg

-- 3. Run this SQL (replace {BOARD_ID}):
INSERT INTO images (board_id, storage_path, position, mime_type, width, height, size_bytes, original_filename, caption) VALUES
('{BOARD_ID}', 'boards/{BOARD_ID}/test1.jpg', 1, 'image/jpeg', 1920, 1080, 500000, 'test1.jpg', 'Landscape Photo'),
('{BOARD_ID}', 'boards/{BOARD_ID}/test2.jpg', 2, 'image/jpeg', 1080, 1920, 500000, 'test2.jpg', 'Portrait Photo'),
('{BOARD_ID}', 'boards/{BOARD_ID}/test3.jpg', 3, 'image/jpeg', 1080, 1080, 500000, 'test3.jpg', 'Square Photo'),
('{BOARD_ID}', 'boards/{BOARD_ID}/test4.jpg', 4, 'image/jpeg', 1920, 1080, 500000, 'test4.jpg', NULL),
('{BOARD_ID}', 'boards/{BOARD_ID}/test5.jpg', 5, 'image/jpeg', 1920, 1080, 500000, 'test5.jpg', 'This is a very long caption to test the marquee scrolling animation effect when hovering'),
('{BOARD_ID}', 'boards/{BOARD_ID}/test6.jpg', 6, 'image/jpeg', 1920, 1080, 500000, 'test6.jpg', 'Final Test Image');

-- 4. Refresh your board page - images should appear!
```

---

## Clean Up Test Data

To remove all test images from a board:

```sql
-- Delete all images for a board
DELETE FROM images WHERE board_id = '{BOARD_ID}';

-- Or delete specific images
DELETE FROM images WHERE board_id = '{BOARD_ID}' AND position > 3;
```

Note: This only deletes the database records. To delete the actual files from Storage:
1. Go to Supabase Dashboard > Storage > board-images
2. Navigate to `boards/{boardId}/`
3. Select and delete the files

---

## Automated Test Data Script (Future Enhancement)

In a future phase, you can create a seed script:

```typescript
// scripts/seedTestImages.ts
import { supabase } from './lib/supabase';

async function seedTestImages(boardId: string) {
  const images = [
    { filename: 'test1.jpg', width: 1920, height: 1080, caption: 'Test 1' },
    { filename: 'test2.jpg', width: 1080, height: 1920, caption: 'Test 2' },
    // ... more images
  ];

  for (let i = 0; i < images.length; i++) {
    await supabase.from('images').insert({
      board_id: boardId,
      storage_path: `boards/${boardId}/${images[i].filename}`,
      position: i + 1,
      mime_type: 'image/jpeg',
      width: images[i].width,
      height: images[i].height,
      size_bytes: 500000,
      original_filename: images[i].filename,
      caption: images[i].caption,
    });
  }
}
```

---

## Summary

For Phase 5.1 testing:
1. **Upload images** to Supabase Storage (`boards/{boardId}/`)
2. **Insert records** via SQL Editor with the queries above
3. **Refresh the board page** to see the images
4. **Test all scenarios**: different aspect ratios, captions, hover effects, etc.

Once Phase 5.2 (Upload) is implemented, you'll be able to add images through the UI!
