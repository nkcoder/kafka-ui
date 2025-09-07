/**
 * CREATE TOPIC MODAL WITH REACT HOOK FORM
 *
 * REACT HOOK FORM PATTERNS:
 * - useForm hook manages form state, validation, and submission
 * - register() connects input fields to form state management
 * - handleSubmit() provides form validation and error handling
 * - formState provides real-time validation feedback
 *
 * ZOD VALIDATION INTEGRATION:
 * - zodResolver bridges Zod schemas with React Hook Form
 * - Client-side validation with server-side schema consistency
 * - Type-safe form data with automatic TypeScript inference
 *
 * MODAL UX PATTERNS:
 * - Loading states prevent double submission
 * - Keyboard accessibility (ESC to close, Enter to submit)
 * - Form reset on successful submission
 * - Clear error messaging and field-level validation
 */

'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { type CreateTopicForm, createTopicFormSchema } from '@/types/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useId, useState } from 'react';
import { useForm } from 'react-hook-form';

interface CreateTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTopicForm) => Promise<void>;
}

/**
 * KAFKA TOPIC CONFIGURATION PRESETS
 *
 * Common configurations for different use cases
 * Helps users understand appropriate settings for their needs
 */
const TOPIC_PRESETS = {
  development: {
    partitions: 1,
    replicationFactor: 1,
    description: 'Single partition, single replica - good for development',
  },
  production: {
    partitions: 3,
    replicationFactor: 2,
    description: 'Multiple partitions with replication - production ready',
  },
  highThroughput: {
    partitions: 6,
    replicationFactor: 3,
    description: 'High partition count for maximum parallelism',
  },
} as const;

export function CreateTopicModal({ isOpen, onClose, onSubmit }: CreateTopicModalProps) {
  // LOCAL STATE: Form submission loading state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // UNIQUE IDS for form accessibility
  const nameId = useId();
  const partitionsId = useId();
  const replicationId = useId();

  // REACT HOOK FORM SETUP with Zod validation
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateTopicForm>({
    resolver: zodResolver(createTopicFormSchema),
    defaultValues: {
      name: '',
      partitions: 3,
      replicationFactor: 1,
      config: {},
    },
  });

  // WATCH form values for preset handling
  const watchedPartitions = watch('partitions');
  const watchedReplication = watch('replicationFactor');

  // SAFEGUARDS for preview rendering to avoid NaN children
  const toSafeNumber = (value: unknown): number =>
    typeof value === 'number' && Number.isFinite(value) ? (value as number) : 0;
  const displayPartitions = toSafeNumber(watchedPartitions);
  const displayReplication = toSafeNumber(watchedReplication);
  const displayTotalReplicas = displayPartitions * displayReplication;

  // FORM SUBMISSION HANDLER
  const handleFormSubmit = async (data: CreateTopicForm) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);

      // SUCCESS: Reset form and close modal
      reset();
      onClose();
    } catch (error) {
      console.error('Topic creation failed:', error);
      // Error handling is managed by parent component
      // Keep modal open so user can see the error and retry
    } finally {
      setIsSubmitting(false);
    }
  };

  // PRESET APPLICATION HANDLER
  const applyPreset = (preset: keyof typeof TOPIC_PRESETS) => {
    const config = TOPIC_PRESETS[preset];
    setValue('partitions', config.partitions);
    setValue('replicationFactor', config.replicationFactor);
  };

  // MODAL CLOSE HANDLER with form reset
  const handleClose = () => {
    if (!isSubmitting) {
      reset(); // Clear form when closing
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Topic" size="lg">
      {/* TOPIC CREATION FORM */}
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* TailwindCSS: space-y-6 adds 24px vertical spacing between form sections */}

        {/* FORM INTRODUCTION */}
        <div className="text-sm text-muted-foreground">
          <p className="mb-3">
            Create a new Kafka topic with custom partition and replication settings. Choose
            appropriate values based on your throughput and durability requirements.
          </p>

          {/* PRESET BUTTONS */}
          <div className="space-y-2">
            <p className="font-medium text-foreground">Quick presets:</p>
            <div className="flex flex-wrap gap-2">
              {/* TailwindCSS: flex-wrap allows buttons to wrap on small screens */}
              {Object.entries(TOPIC_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => applyPreset(key as keyof typeof TOPIC_PRESETS)}
                  className="text-xs px-3 py-1 bg-secondary hover:bg-secondary/80 rounded-md transition-colors"
                  disabled={isSubmitting}
                  title={preset.description}
                >
                  {/* TailwindCSS: 
                      - text-xs: Small text for preset buttons
                      - px-3 py-1: Compact padding
                      - bg-secondary: Theme-aware background
                      - hover:bg-secondary/80: Hover state with opacity
                      - transition-colors: Smooth color transitions */}
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* TOPIC NAME FIELD */}
        <Input
          {...register('name')}
          id={nameId}
          label="Topic Name"
          placeholder="e.g., user-events, order-processing, logs"
          error={errors.name?.message}
          helperText="Must contain only letters, numbers, dots, hyphens, and underscores"
          required
          disabled={isSubmitting}
        />

        {/* CONFIGURATION GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* TailwindCSS responsive grid:
              - grid-cols-1: Single column on mobile
              - md:grid-cols-2: Two columns on medium screens and up
              - gap-4: 16px spacing between grid items */}

          {/* PARTITIONS FIELD */}
          <Input
            {...register('partitions', {
              valueAsNumber: true, // Convert string input to number
            })}
            id={partitionsId}
            type="number"
            label="Partitions"
            min="1"
            max="1000"
            placeholder="3"
            error={errors.partitions?.message}
            helperText="Higher partition count increases parallelism"
            required
            disabled={isSubmitting}
          />

          {/* REPLICATION FACTOR FIELD */}
          <Input
            {...register('replicationFactor', {
              valueAsNumber: true,
            })}
            id={replicationId}
            type="number"
            label="Replication Factor"
            min="1"
            max="10"
            placeholder="1"
            error={errors.replicationFactor?.message}
            helperText="Number of replica copies for fault tolerance"
            required
            disabled={isSubmitting}
          />
        </div>

        {/* CONFIGURATION PREVIEW */}
        <div className="p-4 bg-muted/30 rounded-lg border border-border">
          {/* TailwindCSS: 
              - p-4: 16px padding
              - bg-muted/30: Light background with 30% opacity
              - rounded-lg: 8px border radius
              - border-border: Theme-aware border */}
          <h4 className="font-medium text-foreground mb-2">Configuration Preview</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Partitions:</span>
              <span className="ml-2 font-mono text-foreground">{displayPartitions}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Replication:</span>
              <span className="ml-2 font-mono text-foreground">{displayReplication}</span>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">Total Replicas:</span>
              <span className="ml-2 font-mono text-foreground">{displayTotalReplicas}</span>
            </div>
          </div>
        </div>

        {/* ADVANCED CONFIGURATION SECTION (expandable) */}
        <details className="border border-border rounded-lg">
          {/* HTML5 details/summary for progressive disclosure */}
          <summary className="cursor-pointer p-4 hover:bg-muted/30 transition-colors">
            {/* TailwindCSS: cursor-pointer, hover state for interactivity */}
            <span className="font-medium text-foreground">Advanced Configuration</span>
            <span className="text-sm text-muted-foreground ml-2">(Optional)</span>
          </summary>

          <div className="px-4 pb-4 pt-2 border-t border-border">
            <p className="text-sm text-muted-foreground mb-3">
              Advanced topic configuration will be supported in future versions. Common settings
              include retention policies, compression, and cleanup policies.
            </p>

            {/* Placeholder for future advanced config fields */}
            <div className="text-xs text-muted-foreground bg-secondary/50 p-3 rounded">
              {/* TailwindCSS: text-xs for small placeholder text */}
              Future: retention.ms, cleanup.policy, compression.type, segment.ms, etc.
            </div>
          </div>
        </details>

        {/* FORM ACTIONS */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          {/* TailwindCSS:
              - flex justify-end: Right-aligned button layout
              - gap-3: 12px spacing between buttons
              - pt-4: 16px top padding
              - border-t: Top border to separate actions */}

          <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>

          <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
            {isSubmitting ? 'Creating Topic...' : 'Create Topic'}
          </Button>
        </div>

        {/* FORM SUBMISSION WARNING */}
        <div className="text-xs text-muted-foreground bg-secondary/30 p-3 rounded-lg">
          {/* TailwindCSS: text-xs for fine print, subtle background */}
          <strong>Note:</strong> Topic creation is permanent. Partition count can be increased later
          but never decreased. Choose your initial configuration carefully.
        </div>
      </form>
    </Modal>
  );
}
