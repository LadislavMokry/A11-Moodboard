# MasonryGrid Component

A responsive Pinterest-style masonry grid component built with CSS Grid.

## Features

- **Masonry Layout**: Variable height cards that fill available space efficiently
- **Wide Image Support**: Images with high aspect ratios (>= 1.6) automatically span multiple columns on larger screens
- **Responsive**: Adapts to different screen sizes with appropriate column counts
- **Performance**: Lazy loading, aspect ratio preservation to avoid CLS
- **Accessible**: Maintains keyboard navigation and screen reader support
- **Configurable**: Customizable card sizes, gaps, and wide image thresholds

## Props

```typescript
interface MasonryGridProps {
  images: Image[];
  onImageClick?: (image: Image) => void;
  onImageMenuClick?: (image: Image, event: React.MouseEvent) => void;

  // Layout configuration
  minCardWidth?: number; // Minimum width for each card in pixels (default: 220)
  gap?: number; // Gap between items in pixels (default: 12)
  rowUnit?: number; // Row unit height for grid calculation (default: 8)

  // Wide image configuration
  wideAspectRatio?: number; // Aspect ratio threshold for wide images (default: 1.6)
  wideSpan?: number; // How many columns wide images should span (default: 2)

  // Selection props
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelection?: (imageId: string) => void;

  // Drag and drop props (for sortable grids)
  setItemRef?: (imageId: string, node: HTMLDivElement | null) => void;
  dragAttributes?: DraggableAttributes;
  dragListeners?: SyntheticListenerMap;
  dragStyle?: CSSProperties;
  isDragging?: boolean;

  dataTestId?: string;
}
```

## Configuration

### Card Size

- `minCardWidth`: Controls minimum card width. Smaller values (200-240px) create Savee-like tight layouts
- Default: 220px (can be reduced to 200px for tighter spacing)

### Spacing

- `gap`: Controls space between cards. Smaller values (8-12px) create tighter grids
- Default: 12px (can be reduced to 8px for even tighter spacing)

### Wide Images

- `wideAspectRatio`: Images with aspect ratio >= this value span multiple columns
- Default: 1.6 (images that are 60% wider than tall)
- `wideSpan`: Number of columns wide images should span
- Default: 2 (spans 2 columns on screens with 3+ columns)

## Usage Examples

### Basic Usage

```tsx
import { MasonryGrid } from "@/components/MasonryGrid";

<MasonryGrid
  images={boardImages}
  onImageClick={(image) => openLightbox(image)}
  onImageMenuClick={(image, event) => showContextMenu(image, event)}
/>;
```

### Savee-like Configuration

```tsx
<MasonryGrid
  images={boardImages}
  minCardWidth={200} // Smaller cards
  gap={12} // Tight gutters
  wideAspectRatio={1.6} // Wide images span 2 columns
  wideSpan={2}
/>
```

### With Selection Mode

```tsx
<MasonryGrid
  images={boardImages}
  selectionMode={true}
  selectedIds={selectedIds}
  onToggleSelection={(imageId) => toggleSelection(imageId)}
/>
```

## Technical Details

### CSS Grid Implementation

- Uses `display: grid` with `grid-auto-flow: row dense`
- `grid-template-columns: repeat(auto-fill, minmax(${minCardWidth}px, 1fr))`
- `grid-auto-rows: ${rowUnit}px`
- Items positioned using `grid-row-end: span ${calculatedRows}`

### Responsive Behavior

- Automatically adjusts column count based on `minCardWidth` and container width
- Wide images only span multiple columns when there are 3+ columns available
- Maintains consistent gaps across all screen sizes

### Performance Optimizations

- Aspect ratios preserved to prevent layout shift
- Lazy loading maintained from ImageGridItem
- Efficient re-rendering with memoized calculations

## Feature Flag

The masonry layout can be toggled via the `VITE_ENABLE_MASONRY` environment variable:

```bash
# Enable masonry layout
VITE_ENABLE_MASONRY=true

# Disable masonry layout (fallback to CSS columns)
VITE_ENABLE_MASONRY=false
```

This allows for easy rollback and A/B testing.

## Browser Support

Requires CSS Grid support (IE 11+ with partial support, modern browsers fully supported).

## Integration Notes

- Works with existing `ImageGridItem` component for consistent behavior
- Preserves all existing functionality (selection, drag-and-drop, lightbox, etc.)
- Can be used as drop-in replacement for `ImageGrid` component
