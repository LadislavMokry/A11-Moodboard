# Accessibility (A11y) Documentation

This document outlines the accessibility features and best practices implemented in the Moodeight application.

## Overview

Moodeight has been designed and built with accessibility as a core requirement, following WCAG 2.1 Level AA guidelines. All users, regardless of ability, can effectively use the application.

## Table of Contents

- [Keyboard Navigation](#keyboard-navigation)
- [Screen Reader Support](#screen-reader-support)
- [Focus Management](#focus-management)
- [Color Contrast](#color-contrast)
- [Motion and Animations](#motion-and-animations)
- [Form Accessibility](#form-accessibility)
- [Testing](#testing)
- [Resources](#resources)

## Keyboard Navigation

### Skip Links

A "Skip to main content" link is available at the top of every page. This link:

- Is visually hidden by default
- Becomes visible when focused with keyboard
- Allows users to bypass navigation and jump directly to main content
- Activated with Enter or Space key

**Implementation**: `src/components/SkipLink.tsx`

### Tab Order

All interactive elements follow a logical tab order:

- Navigation elements
- Primary actions
- Secondary actions
- Form inputs
- Links

### Focus Indicators

All focusable elements have visible focus indicators:

- 2px violet outline with 2px offset
- Meets WCAG 2.4.7 (Focus Visible) Level AA
- Enhanced visibility in both light and dark modes
- Applied consistently across all interactive elements

**Implementation**: `src/index.css` (@layer base)

### Keyboard Shortcuts

The application supports standard keyboard navigation:

- **Tab**: Move focus forward
- **Shift + Tab**: Move focus backward
- **Enter/Space**: Activate buttons and links
- **Escape**: Close modals and dialogs
- **Arrow keys**: Navigate through image grids (via drag-and-drop library)
- **Cmd/Ctrl + E**: Edit board name (when on board page)

## Screen Reader Support

### ARIA Labels

All icon-only buttons and complex interactive elements have proper ARIA labels:

```tsx
<button aria-label="Close lightbox">
  <X className="w-6 h-6" />
</button>

<button aria-label="Toggle theme">
  <Sun className="w-4 h-4" />
</button>
```

### ARIA Roles

Appropriate ARIA roles are used throughout:

- `role="status"` for loading indicators
- `role="alert"` for error messages
- `role="button"` for custom interactive elements
- `navigation` landmark for nav elements
- `main` landmark for main content area

### ARIA Live Regions

Dynamic content updates are announced to screen readers:

- Image upload progress
- Error messages (`aria-live="assertive"`)
- Status updates (`aria-live="polite"`)
- Drag-and-drop feedback

**Implementation**: `src/lib/accessibility.ts` - `announceToScreenReader()`

### Semantic HTML

The application uses semantic HTML elements:

- `<header>` for page headers
- `<nav>` for navigation
- `<main>` for main content (with `id="main-content"`)
- `<button>` for interactive actions
- `<article>` for board cards
- `<section>` for content sections

### Image Alt Text

All images have descriptive alt text:

- Board cover images use board name
- Uploaded images use caption as alt text
- Decorative images use empty alt (`alt=""`)

## Focus Management

### Modal Focus Trapping

When modals or dialogs open:

1. Focus moves to first focusable element
2. Focus is trapped within the modal
3. Tab/Shift+Tab cycles through modal elements only
4. Escape key closes modal
5. Focus returns to triggering element on close

**Implementation**: `src/lib/accessibility.ts` - `trapFocus()` and `restoreFocus()`

### Focus Restoration

After closing dialogs, focus is restored to the element that opened them:

```tsx
const previousFocus = document.activeElement;
// ... modal interaction
restoreFocus(previousFocus);
```

### Radix UI Integration

The application uses Radix UI components which provide:

- Automatic focus management
- Keyboard event handling
- ARIA attribute management
- Focus trapping for modals

## Color Contrast

### WCAG AA Compliance

All text and interactive elements meet WCAG AA contrast requirements:

- Normal text: 4.5:1 minimum
- Large text (18pt+): 3:1 minimum
- Interactive elements: 3:1 minimum

### Color Schemes

**Light Mode:**

- Text on background: 21:1 ratio
- Buttons: Violet 600 on white
- Links: Violet 600 with hover states

**Dark Mode:**

- Text on background: 16:1 ratio
- Enhanced contrast for readability
- Carefully selected violet shades

### No Color-Only Information

Information is never conveyed by color alone:

- Icons supplement colors
- Text labels accompany status indicators
- Patterns used in addition to colors

## Motion and Animations

### Prefers Reduced Motion

The application respects user preferences for reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

**Implementation**: `src/index.css` (@layer utilities)

### JavaScript Check

Use the utility function to check motion preferences:

```tsx
import { prefersReducedMotion } from "@/lib/accessibility";

if (!prefersReducedMotion()) {
  // Apply animation
}
```

### Animation Best Practices

- Animations are subtle and purposeful
- No auto-playing videos or GIFs
- Loading spinners use reduced motion variants
- Transitions are optional enhancements

## Form Accessibility

### Labels

All form inputs have associated labels:

```tsx
<input
  aria-label="Board name"
  aria-describedby="name-error"
  aria-invalid={hasError}
  aria-required={true}
/>
```

### Error Handling

Form errors are accessible:

- Error messages use `role="alert"`
- Errors are associated with inputs via `aria-describedby`
- `aria-invalid` indicates error state
- Error messages are clear and actionable

**Example**:

```tsx
<input
  aria-invalid="true"
  aria-describedby="field-error"
/>
<p id="field-error" role="alert">
  This field is required.
</p>
```

### Required Fields

Required fields are indicated:

- `aria-required="true"` attribute
- Visual indicator (asterisk)
- Clear error messages

### Form Submission

- Enter key submits forms
- Buttons have `type="submit"` or `type="button"`
- Loading states announced to screen readers

## Testing

### Automated Testing

The application includes comprehensive accessibility tests using jest-axe:

```bash
npm test -- src/__tests__/accessibility.test.tsx
npm test -- src/__tests__/accessibility-focus.test.tsx
```

**Test Coverage:**

- WCAG 2.1 Level AA violations
- Keyboard navigation
- Focus management
- ARIA attributes
- Screen reader announcements
- Color contrast
- Motion preferences

### Manual Testing

**Keyboard Testing:**

1. Unplug mouse
2. Navigate entire application using only keyboard
3. Verify all functionality is accessible
4. Check focus indicators are visible

**Screen Reader Testing:**

- **Windows**: NVDA (free) or JAWS
- **macOS**: VoiceOver (built-in)
- **Linux**: Orca

**Browser DevTools:**

- Chrome: Lighthouse Accessibility Audit
- Firefox: Accessibility Inspector
- axe DevTools browser extension

### Testing Checklist

- [ ] All interactive elements keyboard accessible
- [ ] Focus indicators visible on all elements
- [ ] Skip link functional
- [ ] Screen reader announces all content
- [ ] Forms fully accessible
- [ ] No color-only information
- [ ] Motion respects user preferences
- [ ] No axe violations
- [ ] Lighthouse score > 95

## Accessibility Utilities

The application provides utility functions for accessibility features:

### `trapFocus(container: HTMLElement)`

Traps focus within a container element (e.g., modal).

### `announceToScreenReader(message: string, priority?: 'polite' | 'assertive')`

Announces a message to screen readers using ARIA live regions.

### `restoreFocus(element: HTMLElement | null)`

Restores focus to a previously focused element.

### `getFocusableElements(container: HTMLElement)`

Returns all focusable elements within a container.

### `prefersReducedMotion()`

Checks if user prefers reduced motion.

**Implementation**: `src/lib/accessibility.ts`

## Component-Specific Guidelines

### Buttons

```tsx
// ✅ Good
<button aria-label="Delete image" onClick={handleDelete}>
  <Trash2 className="w-4 h-4" />
</button>

// ❌ Bad
<div onClick={handleDelete}>
  <Trash2 className="w-4 h-4" />
</div>
```

### Images

```tsx
// ✅ Good
<img src={url} alt={caption || 'Uploaded image'} />

// ❌ Bad
<img src={url} /> // Missing alt
```

### Links

```tsx
// ✅ Good
<Link to="/boards/123" aria-label="Open My Board">
  <span>My Board</span>
</Link>

// ❌ Bad
<a href="/boards/123">Click here</a>
```

### Modals/Dialogs

- Use Radix UI Dialog component
- Focus management automatic
- Escape key handling built-in
- ARIA attributes applied

### Custom Components

When building custom interactive components:

1. Use semantic HTML when possible
2. Add appropriate ARIA attributes
3. Support keyboard navigation
4. Implement focus management
5. Test with screen readers

## Known Issues and Future Improvements

### Current Limitations

1. **Image Drag-and-Drop**: While keyboard accessible via library support, the visual feedback could be enhanced for screen reader users.

2. **Live Showcase Board**: The animated showcase board on the home page is decorative and marked as such, but could benefit from a static alternative.

3. **Image Lightbox**: Touch gestures are not accessible to all users; keyboard alternatives are provided but could be more discoverable.

### Future Enhancements

- [ ] Add keyboard shortcut reference modal
- [ ] Implement custom focus indicators for drag-and-drop
- [ ] Add more detailed image descriptions option
- [ ] Implement high contrast mode
- [ ] Add font size controls
- [ ] Enhance mobile screen reader experience

## Resources

### Standards and Guidelines

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Resources](https://webaim.org/resources/)

### Tools

- [axe DevTools](https://www.deque.com/axe/devtools/) - Browser extension
- [WAVE](https://wave.webaim.org/) - Web accessibility evaluation tool
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Chrome DevTools audit
- [Color Contrast Checker](https://webaim.org/resources/contrastchecker/)

### Testing

- [jest-axe](https://github.com/nickcolley/jest-axe) - Automated testing
- [Testing Library](https://testing-library.com/docs/queries/about/#priority) - Accessibility-first testing
- [Pa11y](https://pa11y.org/) - Automated accessibility testing

### Screen Readers

- [NVDA](https://www.nvaccess.org/) - Free Windows screen reader
- [VoiceOver](https://www.apple.com/accessibility/voiceover/) - macOS/iOS built-in
- [Orca](https://help.gnome.org/users/orca/stable/) - Linux screen reader

## Contributing

When contributing to Moodeight, ensure all changes maintain accessibility standards:

1. Run accessibility tests: `npm test`
2. Test with keyboard only
3. Verify focus indicators are visible
4. Check with screen reader if possible
5. Run Lighthouse accessibility audit
6. Ensure no new axe violations

### Code Review Checklist

- [ ] Proper ARIA labels on icon-only buttons
- [ ] Form inputs have labels
- [ ] Error messages use `role="alert"`
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG AA
- [ ] No motion issues
- [ ] Tests pass

## Support

If you encounter accessibility issues:

1. Report via GitHub Issues with "accessibility" label
2. Include:
   - Description of the issue
   - Steps to reproduce
   - Assistive technology used (if any)
   - Browser and OS
   - Screenshots/videos if applicable

We take accessibility seriously and will prioritize fixing reported issues.

---

**Last Updated**: October 2025  
**WCAG Level**: AA  
**Testing Framework**: jest-axe, React Testing Library, Vitest
