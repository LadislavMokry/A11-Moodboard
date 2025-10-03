import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Layout } from '@/components/Layout';
import { useClipboardPaste } from '@/hooks/useClipboardPaste';

interface PastedImage {
  id: string;
  url: string;
  name: string;
  size: number;
}

export default function Staging() {
  const [pastedImages, setPastedImages] = useState<PastedImage[]>([]);
  const objectUrlsRef = useRef<string[]>([]);

  const handlePastedImages = useCallback((files: File[]) => {
    if (files.length === 0) {
      return;
    }

    setPastedImages((current) => {
      const timestamp = Date.now();
      const nextImages = files.map((file, index) => {
        const url = URL.createObjectURL(file);
        objectUrlsRef.current.push(url);
        return {
          id: `staging-${timestamp}-${index}`,
          url,
          name: file.name || `Pasted image ${current.length + index + 1}`,
          size: file.size,
        } satisfies PastedImage;
      });
      return [...current, ...nextImages];
    });
  }, []);

  useClipboardPaste({
    enabled: true,
    onPaste: handlePastedImages,
  });

  useEffect(() => () => {
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const hasImages = pastedImages.length > 0;
  const totalSize = useMemo(
    () =>
      pastedImages.reduce((accumulator, image) => accumulator + image.size, 0) /
      (1024 * 1024),
    [pastedImages],
  );

  return (
    <Layout>
      <section className="flex min-h-[calc(100vh-4rem)] flex-col space-y-8">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Work in progress</p>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">Staging Area</h1>
          <p className="text-neutral-600 dark:text-neutral-300">
            Paste images with <span className="font-medium">Ctrl/Cmd + V</span> to try out the upcoming clipboard workflow.
          </p>
        </div>

        {hasImages ? (
          <div className="space-y-6 rounded-xl border border-dashed border-neutral-200/80 bg-neutral-50/70 p-6 shadow-sm dark:border-neutral-800/70 dark:bg-neutral-900/40">
            <div className="flex items-center justify-between text-sm text-neutral-600 dark:text-neutral-300">
              <span>{pastedImages.length} pasted image{pastedImages.length === 1 ? '' : 's'}</span>
              <span>{totalSize.toFixed(2)} MB total</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {pastedImages.map((image) => (
                <figure
                  key={image.id}
                  className="overflow-hidden rounded-lg border border-neutral-200/70 bg-white shadow-sm transition hover:shadow-md dark:border-neutral-800/70 dark:bg-neutral-900"
                >
                  <img
                    src={image.url}
                    alt={image.name}
                    className="aspect-video w-full object-cover"
                  />
                  <figcaption className="p-3 text-sm text-neutral-700 dark:text-neutral-200">
                    <div className="font-medium truncate" title={image.name}>
                      {image.name}
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                      {(image.size / 1024).toFixed(0)} KB
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200/80 bg-neutral-50/70 p-12 text-center dark:border-neutral-800/70 dark:bg-neutral-900/40">
            <p className="text-lg font-medium text-neutral-800 dark:text-neutral-200">Nothing staged yet</p>
            <p className="mt-2 max-w-lg text-neutral-600 dark:text-neutral-400">
              Copy an image and paste it here to preview how clipboard uploads will feel. We&apos;ll keep them local for now.
            </p>
          </div>
        )}
      </section>
    </Layout>
  );
}
