/**
 * INPUT COMPONENT WITH FORM VALIDATION
 *
 * REACT FORWARDREF PATTERN:
 * - forwardRef allows parent components to access the input DOM element
 * - Essential for form libraries (react-hook-form) and focus management
 * - Maintains ref chain through component hierarchy
 *
 * TAILWINDCSS FORM STYLING:
 * - focus:ring-2: Creates outline ring on focus (accessibility requirement)
 * - disabled:opacity-50: Visual feedback for disabled state
 * - placeholder:text-muted-foreground: Semantic color for placeholder text
 */

import { forwardRef, InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="space-y-2">
        {' '}
        {/* TailwindCSS: Vertical spacing between form elements */}
        {/* Conditional label rendering - React pattern for optional elements */}
        {label && (
          <label
            htmlFor={props.id}
            className="block text-sm font-medium text-foreground"
            // TailwindCSS: block = display: block, text-sm = 14px font size
          >
            {label}
          </label>
        )}
        <input
          ref={ref} // Forward the ref to the actual input element
          className={`
            flex h-10 w-full rounded-md border border-border 
            bg-background px-3 py-2 text-sm 
            placeholder:text-muted-foreground 
            focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
            disabled:cursor-not-allowed disabled:opacity-50
            ${error ? 'border-error focus:ring-error' : ''} 
            ${className}
          `}
          // TailwindCSS breakdown:
          // - flex h-10 w-full: Flexbox with fixed height (40px) and full width
          // - rounded-md: border-radius: 6px (medium rounding)
          // - px-3 py-2: Horizontal padding 12px, vertical padding 8px
          // - focus:ring-offset-2: Creates space between element and focus ring
          // - disabled:cursor-not-allowed: Changes cursor when disabled
          {...props} // Spread remaining HTML input attributes
        />
        {/* Error and helper text with conditional rendering */}
        {(error || helperText) && (
          <div className="min-h-[1.25rem]">
            {' '}
            {/* Fixed height prevents layout shift */}
            {error && (
              <p className="text-sm text-error">
                {' '}
                {/* Semantic error color */}
                {error}
              </p>
            )}
            {!error && helperText && <p className="text-sm text-muted-foreground">{helperText}</p>}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input'; // Required for forwardRef components in React DevTools
