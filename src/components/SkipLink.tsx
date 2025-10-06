// ABOUTME: Skip link component for keyboard navigation accessibility
// ABOUTME: Allows keyboard users to skip directly to main content

export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-violet-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:focus:bg-violet-500"
    >
      Skip to main content
    </a>
  );
}
