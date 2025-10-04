import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Upload, ImagePlus } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { SignInPromptModal } from '@/components/SignInPromptModal';
import { SaveStagedImagesModal } from '@/components/SaveStagedImagesModal';
import { useClipboardPaste } from '@/hooks/useClipboardPaste';
import { saveStagedImages, getStagedImages, clearStagedImages } from '@/lib/stagingStorage';
import { toast } from 'sonner';

const MAX_STAGING_IMAGES = 5;

interface StagedImage {
  id: string;
  url: string;
  file: File;
}

export default function Staging() {
  const { user } = useAuth();
  const [stagedImages, setStagedImages] = useState<StagedImage[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);
  const objectUrlsRef = useRef<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasShownPromptRef = useRef(false);

  // Load staged images from IndexedDB on mount (for after OAuth redirect)
  useEffect(() => {
    const loadStagedImages = async () => {
      try {
        const files = await getStagedImages();
        if (files.length > 0) {
          const images = files.map((file, index) => {
            const url = URL.createObjectURL(file);
            objectUrlsRef.current.push(url);
            return {
              id: `staged-${Date.now()}-${index}`,
              url,
              file,
            } satisfies StagedImage;
          });
          setStagedImages(images);

          // Show save modal if user is authenticated
          if (user) {
            setShowSaveModal(true);
          }
        }
      } catch (error) {
        console.error('Failed to load staged images:', error);
      }
    };

    loadStagedImages();
  }, [user]);

  const addImages = useCallback((files: File[]) => {
    if (files.length === 0) {
      return;
    }

    setStagedImages((current) => {
      const remaining = MAX_STAGING_IMAGES - current.length;
      if (remaining <= 0) {
        toast.error(`Maximum ${MAX_STAGING_IMAGES} images allowed in staging area`);
        return current;
      }

      const filesToAdd = files.slice(0, remaining);
      const exceededCount = files.length - filesToAdd.length;

      if (exceededCount > 0) {
        toast.error(`Only ${remaining} more image${remaining === 1 ? '' : 's'} can be added (limit: ${MAX_STAGING_IMAGES})`);
      }

      const timestamp = Date.now();
      const nextImages = filesToAdd.map((file, index) => {
        const url = URL.createObjectURL(file);
        objectUrlsRef.current.push(url);
        return {
          id: `staging-${timestamp}-${index}`,
          url,
          file,
        } satisfies StagedImage;
      });

      const newImages = [...current, ...nextImages];

      // Show sign-in prompt for anonymous users after first image is added
      if (!user && newImages.length > 0 && !hasShownPromptRef.current) {
        hasShownPromptRef.current = true;
        // Delay to let the image appear first
        setTimeout(() => setShowSignInPrompt(true), 500);
      }

      return newImages;
    });
  }, [user]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith('image/')
      );
      addImages(files);
    },
    [addImages]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []).filter((file) =>
        file.type.startsWith('image/')
      );
      addImages(files);
      // Reset input so same files can be selected again
      e.target.value = '';
    },
    [addImages]
  );

  useClipboardPaste({
    enabled: true,
    onPaste: addImages,
  });

  const handleSignIn = async () => {
    if (stagedImages.length > 0) {
      try {
        await saveStagedImages(stagedImages.map(img => img.file));
        toast.success('Images saved for after sign-in');
      } catch (error) {
        console.error('Failed to save images:', error);
        toast.error('Failed to save images');
      }
    }
  };

  const handleSaveSuccess = async () => {
    await clearStagedImages();
    setStagedImages([]);
    setShowSaveModal(false);
  };

  useEffect(() => () => {
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const hasImages = stagedImages.length > 0;
  const totalSize = useMemo(
    () =>
      stagedImages.reduce((accumulator, image) => accumulator + image.file.size, 0) /
      (1024 * 1024),
    [stagedImages],
  );

  return (
    <Layout>
      <section className="flex min-h-[calc(100vh-4rem)] flex-col space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            Staging Area
          </h1>
          <p className="text-neutral-600 dark:text-neutral-300">
            Drop, paste, or upload up to {MAX_STAGING_IMAGES} images to get started
          </p>
        </div>

        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className={`flex-1 rounded-xl border-2 border-dashed transition-colors ${
            hasImages
              ? 'border-neutral-200/80 bg-neutral-50/70 dark:border-neutral-800/70 dark:bg-neutral-900/40'
              : 'border-neutral-300 bg-neutral-100/50 hover:border-violet-400 hover:bg-violet-50/50 dark:border-neutral-700 dark:bg-neutral-900/20 dark:hover:border-violet-600 dark:hover:bg-violet-950/20'
          }`}
        >
          {hasImages ? (
            <div className="space-y-6 p-6">
              <div className="flex items-center justify-between text-sm text-neutral-600 dark:text-neutral-300">
                <span>
                  {stagedImages.length}/{MAX_STAGING_IMAGES} image{stagedImages.length === 1 ? '' : 's'}
                </span>
                <span>{totalSize.toFixed(2)} MB total</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {stagedImages.map((image) => (
                  <figure
                    key={image.id}
                    className="overflow-hidden rounded-lg border border-neutral-200/70 bg-white shadow-sm transition hover:shadow-md dark:border-neutral-800/70 dark:bg-neutral-900"
                  >
                    <img
                      src={image.url}
                      alt={image.file.name}
                      className="aspect-square w-full object-cover"
                    />
                    <figcaption className="p-3 text-sm text-neutral-700 dark:text-neutral-200">
                      <div className="truncate font-medium" title={image.file.name}>
                        {image.file.name}
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">
                        {(image.file.size / 1024).toFixed(0)} KB
                      </div>
                    </figcaption>
                  </figure>
                ))}
                {stagedImages.length < MAX_STAGING_IMAGES && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex aspect-square flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50 text-neutral-500 transition hover:border-violet-400 hover:bg-violet-50 hover:text-violet-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:border-violet-600 dark:hover:bg-violet-950/20 dark:hover:text-violet-400"
                  >
                    <ImagePlus className="h-8 w-8" />
                    <span className="mt-2 text-sm font-medium">Add more</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="rounded-full bg-neutral-200/80 p-4 dark:bg-neutral-800">
                <Upload className="h-8 w-8 text-neutral-600 dark:text-neutral-400" />
              </div>
              <p className="mt-4 text-lg font-medium text-neutral-800 dark:text-neutral-200">
                Drop images here
              </p>
              <p className="mt-2 max-w-lg text-sm text-neutral-600 dark:text-neutral-400">
                Or paste with <span className="font-medium">Ctrl/Cmd + V</span>, or{' '}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="font-medium text-violet-600 hover:underline dark:text-violet-400"
                >
                  browse files
                </button>
              </p>
              <p className="mt-4 text-xs text-neutral-500 dark:text-neutral-500">
                Maximum {MAX_STAGING_IMAGES} images
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        {hasImages && user && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowSaveModal(true)}
              className="rounded-md bg-violet-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-700"
            >
              Save to board
            </button>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Sign-in prompt modal for anonymous users */}
        {!user && (
          <SignInPromptModal
            open={showSignInPrompt}
            onOpenChange={setShowSignInPrompt}
            imageCount={stagedImages.length}
            onSignIn={handleSignIn}
          />
        )}

        {/* Save modal for authenticated users */}
        <SaveStagedImagesModal
          open={showSaveModal}
          onOpenChange={setShowSaveModal}
          files={stagedImages.map(img => img.file)}
          onSuccess={handleSaveSuccess}
        />
      </section>
    </Layout>
  );
}
