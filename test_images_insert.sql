-- Insert test images for board: ef1457a6-da88-4728-923f-ef4836d38693
-- Make sure you've uploaded test1.png through test5.png to Supabase Storage first:
-- Path: boards/ef1457a6-da88-4728-923f-ef4836d38693/test1.png (and test2-test5.png)

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
) VALUES
-- Test 1: Landscape image with caption
(
  'ef1457a6-da88-4728-923f-ef4836d38693',
  'boards/ef1457a6-da88-4728-923f-ef4836d38693/test1.png',
  1,
  'image/png',
  1920,
  1080,
  500000,
  'test1.png',
  'Landscape Test Image'
),
-- Test 2: Portrait image with caption
(
  'ef1457a6-da88-4728-923f-ef4836d38693',
  'boards/ef1457a6-da88-4728-923f-ef4836d38693/test2.png',
  2,
  'image/png',
  1080,
  1920,
  500000,
  'test2.png',
  'Portrait Test Image'
),
-- Test 3: Square image with caption
(
  'ef1457a6-da88-4728-923f-ef4836d38693',
  'boards/ef1457a6-da88-4728-923f-ef4836d38693/test3.png',
  3,
  'image/png',
  1080,
  1080,
  500000,
  'test3.png',
  'Square Test Image'
),
-- Test 4: Image without caption (NULL)
(
  'ef1457a6-da88-4728-923f-ef4836d38693',
  'boards/ef1457a6-da88-4728-923f-ef4836d38693/test4.png',
  4,
  'image/png',
  1920,
  1080,
  500000,
  'test4.png',
  NULL
),
-- Test 5: Image with very long caption (for marquee test)
(
  'ef1457a6-da88-4728-923f-ef4836d38693',
  'boards/ef1457a6-da88-4728-923f-ef4836d38693/test5.png',
  5,
  'image/png',
  1920,
  1080,
  500000,
  'test5.png',
  'This is a very long caption to test the marquee scrolling animation effect when you hover over the image in the masonry grid layout'
);

-- Query to verify the inserts
SELECT
  id,
  position,
  original_filename,
  caption,
  created_at
FROM images
WHERE board_id = 'ef1457a6-da88-4728-923f-ef4836d38693'
ORDER BY position;
