# Custom DragOverlay Implementation

This is a custom implementation of the DragOverlay component from the `@dnd-kit/core` library. It provides the same functionality but with more control over the appearance and behavior of the dragged item.

## Components

### CustomDragOverlay

A component that renders a draggable overlay that follows the cursor during drag operations.

```tsx
import { CustomDragOverlay } from './components/custom-drag-overlay';

// Inside your DndContext:
<CustomDragOverlay>
  {activeDragItem && (
    <div className="opacity-90">
      <YourComponent item={activeDragItem} />
    </div>
  )}
</CustomDragOverlay>
```

#### Props

- `children`: React nodes to render inside the overlay (typically your draggable component)
- `adjustScale`: Whether to scale the overlay slightly (default: false)
- `className`: Additional CSS classes to apply to the overlay
- `zIndex`: Z-index for the overlay (default: 999)
- `transition`: CSS transition string for smooth animations (default: 'transform 120ms ease')

### useDragOverlay Hook

A custom hook that manages drag overlay state and provides handler functions.

```tsx
import { useDragOverlay } from '../hooks/useDragOverlay';

// Inside your component:
const {
  activeDragItem,
  activeDropTarget,
  handleDragStart,
  handleDragEnd,
  setActiveDropTarget
} = useDragOverlay({
  findItemById: yourFindItemFunction
});

// Then in your DndContext:
<DndContext
  onDragStart={handleDragStart}
  onDragOver={handleDragOver}
  onDragEnd={handleDragEnd}
  // ...other props
>
  {/* Your draggable content */}
</DndContext>
```

#### Parameters

- `options`: Configuration object
  - `findItemById`: Optional function to retrieve an item by its ID

#### Returns

- `activeDragItem`: The currently dragged item
- `activeDropTarget`: ID of the current drop target
- `handleDragStart`: Function to handle drag start events
- `handleDragEnd`: Function to handle drag end events
- `setActiveDropTarget`: Function to update the active drop target

## Example Usage

Replace the standard DragOverlay with the custom implementation:

```tsx
// Before
import { DragOverlay } from '@dnd-kit/core';

// After
import { CustomDragOverlay } from './components/custom-drag-overlay';
import { useDragOverlay } from '../hooks/useDragOverlay';
```

Then update your component:

```tsx
// Before
const [activeDragItem, setActiveDragItem] = useState(null);
const [activeDropTarget, setActiveDropTarget] = useState(null);

const handleDragStart = (event) => {
  const { active } = event;
  // Find the item being dragged
  const item = findItemById(active.id);
  setActiveDragItem(item);
};

const handleDragEnd = (event) => {
  setActiveDragItem(null);
  setActiveDropTarget(null);
  // Other logic...
};

// After
const {
  activeDragItem,
  activeDropTarget,
  handleDragStart,
  handleDragEnd: onDragEnd,
  setActiveDropTarget
} = useDragOverlay({
  findItemById: findItemById
});

const handleDragEnd = (event) => {
  // First call the base handler
  onDragEnd(event);
  
  // Then your custom logic...
};
```

Finally, replace the DragOverlay component:

```tsx
// Before
<DragOverlay>
  {activeDragItem && (
    <YourComponent item={activeDragItem} />
  )}
</DragOverlay>

// After
<CustomDragOverlay>
  {activeDragItem && (
    <YourComponent item={activeDragItem} />
  )}
</CustomDragOverlay>
```

## Benefits

1. Better control over positioning and appearance
2. Smoother transitions with customizable animation effects
3. Visual feedback when hovering over drop targets
4. Improved touch device support
5. Automatic centering of the dragged element under the cursor 