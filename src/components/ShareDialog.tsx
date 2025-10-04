import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Link2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { copyToClipboard } from '@/lib/clipboard';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  title: string;
}

export function ShareDialog({ open, onOpenChange, url, title }: ShareDialogProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await copyToClipboard(url);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy link');
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              Share "{title}"
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-lg p-1 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          <Dialog.Description className="text-sm text-neutral-600 dark:text-neutral-400">
            Anyone with this link can view this board
          </Dialog.Description>

          <div className="space-y-4">
            {/* URL Display and Copy */}
            <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-800/50">
              <Link2 className="h-4 w-4 flex-shrink-0 text-neutral-500 dark:text-neutral-400" />
              <input
                type="text"
                value={url}
                readOnly
                className="flex-1 bg-transparent text-sm text-neutral-700 outline-none dark:text-neutral-300"
                onClick={(e) => e.currentTarget.select()}
              />
              <Button
                onClick={handleCopy}
                variant="outline"
                size="sm"
                className="flex-shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied
                  </>
                ) : (
                  'Copy'
                )}
              </Button>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Dialog.Close asChild>
                <Button variant="outline">Close</Button>
              </Dialog.Close>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
