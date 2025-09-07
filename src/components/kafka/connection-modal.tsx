/**
 * CONNECTION MODAL COMPONENT
 *
 * COMPONENT COMPOSITION PATTERN:
 * - Combines Modal UI + ConnectionForm + State management
 * - Demonstrates how smaller components compose into larger features
 * - Each component has single responsibility (Modal=UI, Form=logic, etc.)
 *
 * REACT HOOKS INTEGRATION:
 * - Custom hook (useClusterConnection) for shared state
 * - Modal state managed locally with useState
 * - Form submission handled with async/await pattern
 *
 * PROPS INTERFACE DESIGN:
 * - Minimal props interface keeps component flexible
 * - Parent controls when modal is shown/hidden
 * - State management is handled internally
 */

'use client';

import { Modal } from '@/components/ui/modal';
import { useClusterConnection } from '@/hooks/use-cluster-connection';
import { ConnectionForm as ConnectionFormData } from '@/types/schemas';
import { ConnectionForm } from './connection-form';

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConnectionModal({ isOpen, onClose }: ConnectionModalProps) {
  // CUSTOM HOOK: Access shared cluster connection state
  const { connect, connectionError, clearError } = useClusterConnection();

  // FORM SUBMISSION HANDLER with error handling
  const handleSubmit = async (formData: ConnectionFormData) => {
    try {
      await connect(formData); // Attempt connection via context
      onClose(); // Close modal on successful connection
    } catch (error) {
      // Error is handled by the context, displayed in form
      console.error('Connection submission error:', error);
    }
  };

  // MODAL CLOSE HANDLER with cleanup
  const handleClose = () => {
    clearError(); // Clear any existing errors when modal closes
    onClose(); // Call parent's close handler
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Connect to Kafka Cluster"
      size="md" // Medium size appropriate for form content
    >
      {/* CONDITIONAL ERROR DISPLAY */}
      {connectionError && (
        <div className="mb-4 p-4 bg-error/10 border border-error/20 rounded-md">
          {/* TailwindCSS error styling:
              - bg-error/10: Error color with 10% opacity background
              - border-error/20: Error color with 20% opacity border
              - rounded-md: Medium border radius for consistency */}
          <div className="flex items-start gap-3">
            {/* Error icon with proper sizing */}
            <svg
              className="w-5 h-5 text-error flex-shrink-0 mt-0.5"
              // flex-shrink-0: Prevents icon from shrinking
              // mt-0.5: Small top margin to align with text
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <title>Error Icon</title>
              <path
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>

            <div className="flex-1">
              <h4 className="text-sm font-medium text-error mb-1">Connection Failed</h4>
              <p className="text-sm text-error/80">
                {/* Slightly muted error text for details */}
                {connectionError}
              </p>
            </div>

            {/* Dismiss error button */}
            <button
              type="button"
              onClick={clearError}
              className="text-error/60 hover:text-error p-1 rounded transition-colors"
              // TailwindCSS interactive states:
              // - text-error/60: Muted error color
              // - hover:text-error: Full error color on hover
              // - p-1: Small padding for touch target
              // - rounded: Subtle border radius
              // - transition-colors: Smooth color transitions
              aria-label="Dismiss error"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <title>Dismiss error</title>
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* CONNECTION FORM COMPONENT */}
      <ConnectionForm
        onSubmit={handleSubmit} // Pass form submission handler
        onCancel={handleClose} // Pass cancel handler
        // Component composition: Modal handles UI, Form handles logic
      />
    </Modal>
  );
}
