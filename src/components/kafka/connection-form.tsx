/**
 * KAFKA CONNECTION FORM COMPONENT
 *
 * REACT HOOK FORM INTEGRATION:
 * - useForm hook manages form state, validation, and submission
 * - register() connects input fields to form state
 * - handleSubmit() provides validated data and handles errors
 * - formState provides loading states and error information
 *
 * ZOD + REACT HOOK FORM PATTERN:
 * - zodResolver bridges Zod schemas with React Hook Form
 * - Runtime validation with TypeScript type safety
 * - Single source of truth for validation rules
 *
 * FORM UX BEST PRACTICES:
 * - Loading states prevent double submission
 * - Error messages provide clear feedback
 * - Disabled states show processing status
 */

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  type ConnectionForm as ConnectionFormData,
  connectionFormSchema,
} from "@/types/schemas";

interface ConnectionFormProps {
  onSubmit: (data: ConnectionFormData) => Promise<void>;
  onCancel: () => void;
}

export function ConnectionForm({ onSubmit, onCancel }: ConnectionFormProps) {
  // LOCAL STATE: Loading state for async operations (separate from form state)
  const [isSubmitting, setIsSubmitting] = useState(false);

  // UNIQUE ID GENERATION for accessibility
  const nameId = useId();
  const serversId = useId();

  // REACT HOOK FORM SETUP with Zod validation
  const {
    register, // Function to register input fields
    handleSubmit, // Wrapper for form submission with validation
    formState: { errors }, // Form state including validation errors
  } = useForm<ConnectionFormData>({
    resolver: zodResolver(connectionFormSchema), // Zod schema validation
    defaultValues: {
      // Default values prevent uncontrolled -> controlled component warnings
      name: "Local Cluster",
      bootstrapServers: "localhost:29092,localhost:39092",
    },
  });

  // ASYNC FORM SUBMISSION HANDLER
  const handleFormSubmit = async (data: ConnectionFormData) => {
    try {
      setIsSubmitting(true); // Set loading state before async operation
      await onSubmit(data); // Call parent's submit handler
    } catch (error) {
      console.error("Connection failed:", error);
      // In a real app, you'd show a toast notification or error message
    } finally {
      setIsSubmitting(false); // Reset loading state regardless of outcome
    }
  };

  return (
    <div className="space-y-6">
      {/* TailwindCSS: space-y-6 adds 24px vertical spacing between form elements */}

      {/* Form introduction with semantic HTML */}
      <div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          {/* TailwindCSS typography hierarchy: text-lg (18px) for section headers */}
          Connect to Kafka Cluster
        </h3>
        <p className="text-sm text-muted-foreground">
          {/* Muted text for supporting information */}
          Enter your Kafka cluster connection details. The connection will be
          tested before saving.
        </p>
      </div>

      {/* FORM ELEMENT with React Hook Form handleSubmit wrapper */}
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* TailwindCSS: space-y-4 creates 16px vertical rhythm between form fields */}

        {/* Cluster name input field */}
        <Input
          {...register("name")} // React Hook Form registration spreads props
          // register() returns: { name, onChange, onBlur, ref }
          id={nameId}
          label="Cluster Name"
          placeholder="e.g., Production Kafka"
          error={errors.name?.message} // Display validation error if present
          helperText="A friendly name to identify this cluster"
          // Conditional error prop demonstrates React's dynamic prop passing
        />

        {/* Bootstrap servers input with more complex validation */}
        <Input
          {...register("bootstrapServers")}
          id={serversId}
          label="Bootstrap Servers"
          placeholder="localhost:9092 or host1:9092,host2:9092"
          error={errors.bootstrapServers?.message}
          helperText="Comma-separated list of broker addresses (host:port)"
          // Multiple validation rules handled by Zod schema
        />

        {/* Form action buttons with loading states */}
        <div className="flex justify-end gap-3 pt-4">
          {/* TailwindCSS layout:
              - flex: Create flexbox container
              - justify-end: Push buttons to right side
              - gap-3: 12px spacing between buttons
              - pt-4: 16px top padding to separate from form fields */}

          <Button
            type="button" // Prevent form submission
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting} // Disable during form submission
            // TailwindCSS: disabled state handled by Button component
          >
            Cancel
          </Button>

          <Button
            type="submit" // Triggers form submission
            loading={isSubmitting} // Built-in loading state from our Button component
            disabled={isSubmitting}
            // React pattern: disabled during async operations prevents double-submission
          >
            {isSubmitting ? "Testing Connection..." : "Connect"}
            {/* Conditional text provides user feedback during async operations */}
          </Button>
        </div>
      </form>

      {/* Additional connection info (expandable in future) */}
      <div className="border-t border-border pt-4">
        {/* TailwindCSS: border-t creates top border, pt-4 adds padding above */}
        <details className="text-sm text-muted-foreground">
          {/* HTML5 details/summary for progressive disclosure */}
          <summary className="cursor-pointer hover:text-foreground transition-colors">
            {/* TailwindCSS: cursor-pointer changes cursor, hover state for interactivity */}
            Connection Requirements
          </summary>
          <div className="mt-2 space-y-1 pl-4">
            {/* TailwindCSS: mt-2 (top margin), pl-4 (left padding for indentation) */}
            <p>• Kafka cluster must be accessible from this application</p>
            <p>• At least one broker must be online</p>
            <p>• Network connectivity to bootstrap servers required</p>
          </div>
        </details>
      </div>
    </div>
  );
}
