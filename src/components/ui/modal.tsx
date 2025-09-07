/**
 * MODAL COMPONENT WITH REACT PORTAL
 *
 * REACT PORTAL PATTERN:
 * - createPortal renders component outside normal component tree
 * - Useful for modals, tooltips, dropdowns that need to escape parent containers
 * - Prevents z-index and overflow issues with complex layouts
 *
 * REACT HOOKS EXPLAINED:
 * - useEffect for side effects (ESC key listener, body scroll lock)
 * - useState for local component state (isOpen)
 * - useCallback for memoized event handlers (prevents unnecessary re-renders)
 *
 * TAILWINDCSS OVERLAY TECHNIQUE:
 * - fixed inset-0: Covers entire viewport (top:0, right:0, bottom:0, left:0)
 * - bg-black/50: Black background with 50% opacity (backdrop)
 * - backdrop-blur-sm: CSS backdrop-filter for modern glass effect
 */

'use client';

import { ReactNode, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  // Size variants using TailwindCSS responsive classes
  const sizeClasses = {
    sm: 'max-w-md', // 448px max width
    md: 'max-w-lg', // 512px max width
    lg: 'max-w-2xl', // 672px max width
    xl: 'max-w-4xl', // 896px max width
  };

  // REACT HOOK: useCallback memoizes function to prevent unnecessary re-renders
  const handleEscapeKey = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose(); // Close modal when ESC key is pressed
      }
    },
    [onClose]
  );

  // REACT HOOK: useEffect for side effects and cleanup
  useEffect(() => {
    if (isOpen) {
      // Add keyboard listener when modal opens
      document.addEventListener('keydown', handleEscapeKey);

      // Prevent body scrolling when modal is open (UX best practice)
      document.body.style.overflow = 'hidden';

      // Cleanup function runs when effect dependencies change or component unmounts
      return () => {
        document.removeEventListener('keydown', handleEscapeKey);
        document.body.style.overflow = 'unset'; // Restore scrolling
      };
    }
  }, [isOpen, handleEscapeKey]); // Dependencies: re-run when these values change

  // Early return pattern - don't render anything if modal is closed
  if (!isOpen) return null;

  // REACT PORTAL: Render modal outside normal component tree
  return createPortal(
    <>
      {/* Backdrop overlay with click-to-close functionality */}
      <button
        type="button"
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        // TailwindCSS: fixed positioning covers entire viewport
        // bg-black/50: Black with 50% opacity (Tailwind opacity modifier)
        // backdrop-blur-sm: CSS backdrop-filter for glass morphism effect
        // z-40: High z-index ensures overlay appears above other content
        onClick={onClose} // Close modal when clicking backdrop
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            onClose();
          }
        }}
      />

      {/* Modal content container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* TailwindCSS layout breakdown:
            - fixed inset-0: Cover entire viewport
            - z-50: Higher z-index than backdrop (appears on top)
            - flex items-center justify-center: Perfect centering with Flexbox
            - p-4: 16px padding on all sides (responsive spacing) */}

        <div
          className={`
            relative w-full ${sizeClasses[size]} 
            bg-card border border-border rounded-lg shadow-xl
            transform transition-all duration-200 ease-out
          `}
          role="dialog"
          onClick={(e) => e.stopPropagation()} // Prevent click from bubbling to backdrop
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              onClose();
            }
          }}
          // TailwindCSS modal styling:
          // - relative: Positioning context for absolute children
          // - w-full + max-w-*: Responsive width (full width up to max)
          // - shadow-xl: Large drop shadow for depth perception
          // - transform transition-all: Smooth animations for modal appearance
        >
          {/* Modal header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            {/* TailwindCSS header layout:
                - flex items-center justify-between: Space between title and close button
                - p-6: 24px padding for generous touch target
                - border-b: Bottom border to separate header from content */}

            <h2 className="text-lg font-semibold text-foreground">
              {/* TailwindCSS typography:
                  - text-lg: 18px font size (slightly larger than body)
                  - font-semibold: font-weight: 600 (between normal and bold) */}
              {title}
            </h2>

            {/* Close button with accessibility considerations */}
            <button
              type="button"
              onClick={onClose}
              className="
                text-muted-foreground hover:text-foreground 
                p-2 rounded-md hover:bg-secondary 
                transition-colors focus:outline-none focus:ring-2 focus:ring-primary
              "
              // TailwindCSS interactive button styling:
              // - hover:text-foreground: Color change on hover (visual feedback)
              // - p-2: 8px padding for adequate touch target (minimum 44px recommended)
              // - rounded-md: Subtle border radius for modern appearance
              // - transition-colors: Smooth color transitions
              // - focus:ring-2: Accessibility focus indicator
              aria-label="Close modal" // Screen reader accessibility
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <title>Close</title>
                {/* SVG icon using currentColor (inherits text color) */}
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          {/* Modal content area */}
          <div className="p-6">
            {/* TailwindCSS: p-6 provides consistent padding matching header */}
            {children} {/* React children pattern for content injection */}
          </div>
        </div>
      </div>
    </>,
    document.body // Portal target: render at end of document body
  );
}
