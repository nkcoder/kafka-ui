/**
 * TABLE COMPONENT WITH TAILWINDCSS
 *
 * COMPONENT COMPOSITION PATTERN:
 * - Separate components for different table parts (Table, TableHeader, TableRow, etc.)
 * - This allows flexible composition and reusability across different table use cases
 * - Similar to Radix UI or Shadcn/ui component patterns
 *
 * TAILWINDCSS TABLE STYLING:
 * - w-full: Full width tables for responsive design
 * - border-collapse via border-separate and border-spacing-0
 * - Consistent spacing with p-3 (12px) padding
 * - Hover states for better user interaction
 * - Responsive design considerations
 */

'use client';

import { forwardRef, ReactNode } from 'react';

// BASE TABLE COMPONENT
interface TableProps {
  children: ReactNode;
  className?: string;
}

export const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ children, className = '', ...props }, ref) => (
    <div className="w-full overflow-auto">
      {/* TailwindCSS responsive table wrapper:
          - w-full: Full width within container
          - overflow-auto: Horizontal scroll on narrow screens
          - This prevents table from breaking layout on mobile */}
      <table
        ref={ref}
        className={`
          w-full caption-bottom text-sm border-separate border-spacing-0
          ${className}
        `}
        {...props}
      >
        {/* TailwindCSS table styling:
            - w-full: Table takes full available width
            - caption-bottom: Screen reader accessibility
            - text-sm: 14px font size for readability
            - border-separate + border-spacing-0: Clean border rendering */}
        {children}
      </table>
    </div>
  )
);
Table.displayName = 'Table';

// TABLE HEADER COMPONENT
interface TableHeaderProps {
  children: ReactNode;
  className?: string;
}

export const TableHeader = forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ children, className = '', ...props }, ref) => (
    <thead
      ref={ref}
      className={`
        bg-muted/50 border-b border-border
        ${className}
      `}
      {...props}
    >
      {/* TailwindCSS header styling:
          - bg-muted/50: Subtle background with 50% opacity
          - border-b: Bottom border to separate header from content */}
      {children}
    </thead>
  )
);
TableHeader.displayName = 'TableHeader';

// TABLE BODY COMPONENT
interface TableBodyProps {
  children: ReactNode;
  className?: string;
}

export const TableBody = forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ children, className = '', ...props }, ref) => (
    <tbody
      ref={ref}
      className={`
        [&_tr:last-child]:border-0
        ${className}
      `}
      {...props}
    >
      {/* TailwindCSS advanced selector:
          - [&_tr:last-child]:border-0: Remove border from last row
          - This creates cleaner visual separation */}
      {children}
    </tbody>
  )
);
TableBody.displayName = 'TableBody';

// TABLE ROW COMPONENT
interface TableRowProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ children, className = '', onClick, ...props }, ref) => (
    <tr
      ref={ref}
      className={`
        border-b border-border transition-colors
        hover:bg-muted/30 
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
      {...props}
    >
      {/* TailwindCSS interactive row styling:
          - border-b: Bottom border for row separation
          - transition-colors: Smooth color transitions
          - hover:bg-muted/30: Subtle hover effect
          - cursor-pointer: Only when onClick is provided */}
      {children}
    </tr>
  )
);
TableRow.displayName = 'TableRow';

// TABLE HEADER CELL COMPONENT
interface TableHeadProps {
  children: ReactNode;
  className?: string;
}

export const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ children, className = '', ...props }, ref) => (
    <th
      ref={ref}
      className={`
        h-12 px-4 text-left align-middle font-medium text-muted-foreground
        [&:has([role=checkbox])]:pr-0
        ${className}
      `}
      {...props}
    >
      {/* TailwindCSS header cell styling:
          - h-12: Fixed height (48px) for consistent header row height
          - px-4: Horizontal padding (16px) for breathing room
          - text-left: Left-aligned text (standard for data tables)
          - align-middle: Vertical center alignment
          - font-medium: Semi-bold weight for headers
          - text-muted-foreground: Subdued color for headers
          - [&:has([role=checkbox])]:pr-0: Remove right padding if contains checkbox */}
      {children}
    </th>
  )
);
TableHead.displayName = 'TableHead';

// TABLE DATA CELL COMPONENT
interface TableCellProps {
  children: ReactNode;
  className?: string;
  colSpan?: number;
}

export const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ children, className = '', ...props }, ref) => (
    <td
      ref={ref}
      className={`
        p-4 align-middle [&:has([role=checkbox])]:pr-0
        ${className}
      `}
      {...props}
    >
      {/* TailwindCSS data cell styling:
          - p-4: Padding (16px) on all sides for content spacing
          - align-middle: Vertical center alignment
          - [&:has([role=checkbox])]:pr-0: Special handling for checkbox columns */}
      {children}
    </td>
  )
);
TableCell.displayName = 'TableCell';

// EMPTY STATE COMPONENT for tables with no data
interface TableEmptyProps {
  children: ReactNode;
  colSpan?: number;
  className?: string;
}

export const TableEmpty = forwardRef<HTMLTableCellElement, TableEmptyProps>(
  ({ children, colSpan = 1, className = '', ...props }, ref) => (
    <TableRow>
      <TableCell
        ref={ref}
        colSpan={colSpan}
        className={`
          text-center py-12 text-muted-foreground
          ${className}
        `}
        {...props}
      >
        {/* TailwindCSS empty state styling:
            - text-center: Centered empty state message
            - py-12: Large vertical padding (48px) for visual separation
            - text-muted-foreground: Subdued color for empty state
            - colSpan: Spans across all table columns */}
        {children}
      </TableCell>
    </TableRow>
  )
);
TableEmpty.displayName = 'TableEmpty';
