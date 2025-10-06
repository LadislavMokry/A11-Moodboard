import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, type KeyboardEvent, type RefObject } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const REQUIRED_ERROR_MESSAGE = 'This field is required.';

export interface EditableTextHandle {
  startEditing: () => void;
  isEditing: () => boolean;
}

export interface EditableTextProps {
  value?: string | null;
  onSave: (value: string) => Promise<void> | void;
  maxLength: number;
  multiline?: boolean;
  placeholder?: string;
  allowEmpty?: boolean;
  label?: string;
  className?: string;
  editClassName?: string;
}

export const EditableText = forwardRef<EditableTextHandle, EditableTextProps>(
  (
    {
      value,
      onSave,
      maxLength,
      multiline = false,
      placeholder,
      allowEmpty = false,
      label,
      className,
      editClassName,
    },
    ref,
  ) => {
    const initialValue = value ?? '';
    const [isEditing, setIsEditing] = useState(false);
    const [draftValue, setDraftValue] = useState(initialValue);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
    const isSavingRef = useRef(false);

    useEffect(() => {
      if (!isEditing) {
        setDraftValue(initialValue);
      }
    }, [initialValue, isEditing]);

    useEffect(() => {
      if (isEditing) {
        const input = inputRef.current;
        if (input) {
          input.focus();
          const length = input.value.length;
          input.setSelectionRange(length, length);
        }
      }
    }, [isEditing]);

    useEffect(() => {
      isSavingRef.current = isSaving;
    }, [isSaving]);

    const trimmedInitialValue = useMemo(() => initialValue.trim(), [initialValue]);

    const finishEditing = () => {
      setIsEditing(false);
    };

    const revertValue = () => {
      setDraftValue(initialValue);
    };

    const saveValue = useCallback(async () => {
      const trimmed = draftValue.trim();
      const normalizedValue = allowEmpty && trimmed.length === 0 ? '' : trimmed;

      if (!allowEmpty && normalizedValue.length === 0) {
        setError(REQUIRED_ERROR_MESSAGE);
        return;
      }

      if (normalizedValue.length > maxLength) {
        setError(`Must be ${maxLength} characters or fewer.`);
        return;
      }

      if (normalizedValue === trimmedInitialValue) {
        finishEditing();
        setError(null);
        return;
      }

      try {
        setIsSaving(true);
        isSavingRef.current = true;
        setError(null);
        await onSave(normalizedValue);
        setDraftValue(normalizedValue);
        finishEditing();
      } catch (saveError) {
        const message = saveError instanceof Error ? saveError.message : 'Failed to save changes.';
        setError(message);
        revertValue();
        finishEditing();
      } finally {
        setIsSaving(false);
        isSavingRef.current = false;
      }
    }, [allowEmpty, draftValue, maxLength, onSave, trimmedInitialValue]);

    const handleBlur = () => {
      if (!isSavingRef.current) {
        void saveValue();
      }
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setError(null);
        revertValue();
        finishEditing();
        return;
      }

      if (!multiline && event.key === 'Enter') {
        event.preventDefault();
        void saveValue();
      }
    };

    const startEditing = useCallback(() => {
      if (isSavingRef.current) {
        return;
      }
      setDraftValue(initialValue);
      setIsEditing(true);
      setError(null);
    }, [initialValue]);

    useImperativeHandle(
      ref,
      () => ({
        startEditing,
        isEditing: () => isEditing,
      }),
      [isEditing, startEditing],
    );

    const displayText = initialValue.trim().length > 0 ? initialValue : placeholder ?? '';
    const showPlaceholder = initialValue.trim().length === 0 && placeholder;

    return (
      <div className="space-y-1">
        {!isEditing ? (
          <button
            type="button"
            onClick={startEditing}
            className={cn(
              'w-full text-left font-medium text-neutral-900 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 dark:text-neutral-100',
              showPlaceholder && 'font-normal text-neutral-400 dark:text-neutral-500',
              className,
            )}
            aria-label={label ?? placeholder ?? 'Editable text'}
          >
            {displayText}
          </button>
        ) : (
          <div className="relative">
            {multiline ? (
              <textarea
                ref={inputRef as RefObject<HTMLTextAreaElement>}
                value={draftValue}
                onChange={(event) => setDraftValue(event.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                maxLength={maxLength}
                placeholder={placeholder}
                aria-label={label ?? placeholder ?? 'Editable text'}
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={error ? 'editable-text-error' : undefined}
                aria-required={!allowEmpty}
                className={cn(
                  'w-full resize-none rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-900 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100',
                  editClassName,
                )}
                rows={3}
                disabled={isSaving}
              />
            ) : (
              <input
                ref={inputRef as RefObject<HTMLInputElement>}
                type="text"
                value={draftValue}
                onChange={(event) => setDraftValue(event.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                maxLength={maxLength}
                placeholder={placeholder}
                aria-label={label ?? placeholder ?? 'Editable text'}
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={error ? 'editable-text-error' : undefined}
                aria-required={!allowEmpty}
                className={cn(
                  'w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-3xl font-semibold text-neutral-900 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100',
                  editClassName,
                )}
                disabled={isSaving}
              />
            )}

            {isSaving ? (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" role="status" aria-live="polite">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : null}
          </div>
        )}

        {isEditing ? (
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <span>{draftValue.length} / {maxLength}</span>
            {error ? (
              <span className="text-red-500" role="alert" aria-live="assertive">
                {error}
              </span>
            ) : null}
          </div>
        ) : error ? (
          <span className="block text-xs text-red-500" role="alert" aria-live="assertive">
            {error}
          </span>
        ) : null}
      </div>
    );
  },
);

EditableText.displayName = 'EditableText';