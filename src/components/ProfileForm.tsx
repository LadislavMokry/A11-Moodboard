import { type ChangeEvent, type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/ui/button';
import { ErrorMessage } from '@/components/ErrorMessage';
import { Skeleton } from '@/components/Skeleton';
import { useProfile } from '@/hooks/useProfile';
import { useUpdateProfile } from '@/hooks/useUpdateProfile';
import { useAvatarUpload } from '@/hooks/useAvatarUpload';
import { AVATAR_ALLOWED_MIME_TYPES, AVATAR_MAX_FILE_SIZE_BYTES } from '@/services/avatars';

const MAX_NAME_LENGTH = 50;
const AVATAR_ACCEPT = AVATAR_ALLOWED_MIME_TYPES.join(',');

export function ProfileForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: profile, isLoading, isError, error, refetch } = useProfile();
  const { mutateAsync: updateProfile, isPending: isUpdatingProfile } = useUpdateProfile();
  const { mutateAsync: uploadAvatar, isPending: isUploadingAvatar } = useAvatarUpload();

  const [displayName, setDisplayName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? '');
    }
  }, [profile?.display_name]);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }

    const nextUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(nextUrl);

    return () => {
      URL.revokeObjectURL(nextUrl);
    };
  }, [selectedFile]);

  const initialDisplayName = useMemo(() => (profile?.display_name ?? '').trim(), [profile?.display_name]);
  const trimmedDisplayName = displayName.trim();
  const isNameDirty = trimmedDisplayName !== initialDisplayName;

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setDisplayName(event.target.value);
    if (nameError) {
      setNameError(null);
    }
  };

  const handleNameSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!trimmedDisplayName) {
      const message = 'Display name is required';
      setNameError(message);
      toast.error(message);
      return;
    }

    if (trimmedDisplayName.length > MAX_NAME_LENGTH) {
      const message = `Display name must be ${MAX_NAME_LENGTH} characters or fewer`;
      setNameError(message);
      toast.error(message);
      return;
    }

    if (!isNameDirty) {
      return;
    }

    try {
      await updateProfile({ display_name: trimmedDisplayName });
      toast.success('Name updated');
      setNameError(null);
    } catch (mutationError) {
      const message = mutationError instanceof Error ? mutationError.message : 'Failed to update name';
      toast.error(message);
    }
  };

  const handleUploadButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type || !AVATAR_ALLOWED_MIME_TYPES.includes(file.type as (typeof AVATAR_ALLOWED_MIME_TYPES)[number])) {
      toast.error('Unsupported file type. Allowed types: JPG, PNG, WebP');
      event.target.value = '';
      return;
    }

    if (file.size > AVATAR_MAX_FILE_SIZE_BYTES) {
      toast.error('File is too large. Maximum size is 2MB');
      event.target.value = '';
      return;
    }

    setSelectedFile(file);
    event.target.value = '';
  };

  const handleAvatarCancel = () => {
    setSelectedFile(null);
  };

  const handleAvatarSave = async () => {
    if (!selectedFile || isUploadingAvatar) {
      return;
    }

    try {
      await uploadAvatar(selectedFile);
      setSelectedFile(null);
    } catch (mutationError) {
      // Error toast handled inside the hook; keep file selected for retry.
      console.error('Failed to upload avatar:', mutationError);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="space-y-3">
          <Skeleton width="60%" height={24} />
          <Skeleton width="80%" height={18} />
          <Skeleton width="40%" height={18} />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton width={80} height={80} variant="circle" />
          <div className="flex-1 space-y-2">
            <Skeleton width="100%" height={16} />
            <Skeleton width="70%" height={16} />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <ErrorMessage
        error={error ?? new Error('Profile not found')}
        onRetry={() => {
          void refetch();
        }}
        retryLabel="Try again"
      />
    );
  }

  const currentAvatarSrc = previewUrl ?? profile.avatar_url ?? undefined;
  const isAvatarDirty = Boolean(previewUrl);

  return (
    <div className="space-y-10 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <section aria-labelledby="display-name-heading" className="space-y-4">
        <div>
          <h2 id="display-name-heading" className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Display name
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            This name appears on your boards and share pages.
          </p>
        </div>
        <form className="space-y-3" onSubmit={handleNameSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-800 dark:text-neutral-200" htmlFor="display-name">
              Display name
            </label>
            <input
              id="display-name"
              type="text"
              value={displayName}
              onChange={handleNameChange}
              maxLength={MAX_NAME_LENGTH}
              disabled={isUpdatingProfile}
              className="block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm transition focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/40 disabled:cursor-not-allowed disabled:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-pink-400"
              aria-invalid={nameError ? 'true' : 'false'}
              aria-describedby={nameError ? 'display-name-error' : undefined}
            />
            <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
              <span>{displayName.length}/{MAX_NAME_LENGTH} characters</span>
              {nameError ? (
                <span id="display-name-error" className="text-xs font-medium text-red-500">
                  {nameError}
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={!isNameDirty || isUpdatingProfile}>
              {isUpdatingProfile ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              Save changes
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={!isNameDirty || isUpdatingProfile}
              onClick={() => {
                setDisplayName(profile.display_name ?? '');
                setNameError(null);
              }}
            >
              Reset
            </Button>
          </div>
        </form>
      </section>

      <section aria-labelledby="avatar-heading" className="space-y-4">
        <div>
          <h2 id="avatar-heading" className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Avatar
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            Upload a square image. Supported types: JPG, PNG, WebP. Max size 2MB.
          </p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Avatar src={currentAvatarSrc} fallbackText={profile.display_name ?? profile.id} size="lg" />
          <div className="flex flex-1 flex-col gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept={AVATAR_ACCEPT}
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" variant="outline" onClick={handleUploadButtonClick} disabled={isUploadingAvatar}>
                <Upload className="h-4 w-4" aria-hidden="true" />
                Upload new picture
              </Button>
              {isAvatarDirty ? (
                <>
                  <Button type="button" onClick={handleAvatarSave} disabled={isUploadingAvatar}>
                    {isUploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                    Save avatar
                  </Button>
                  <Button type="button" variant="ghost" onClick={handleAvatarCancel} disabled={isUploadingAvatar}>
                    <X className="h-4 w-4" aria-hidden="true" />
                    Cancel
                  </Button>
                </>
              ) : null}
            </div>
            {selectedFile ? (
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Selected file: {selectedFile.name} - {(selectedFile.size / 1024).toFixed(0)} KB
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
