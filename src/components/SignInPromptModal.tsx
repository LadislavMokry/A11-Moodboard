import * as Dialog from "@radix-ui/react-dialog";
import { Sparkles } from "lucide-react";
import { SignInButton } from "./SignInButton";

interface SignInPromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageCount: number;
  onSignIn: () => void;
}

export function SignInPromptModal({ open, onOpenChange, imageCount, onSignIn }: SignInPromptModalProps) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={onOpenChange}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-lg border border-neutral-200 bg-white p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] dark:border-neutral-800 dark:bg-neutral-900">
          {/* Icon */}
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-pink-100 dark:bg-pink-950">
            <Sparkles className="h-6 w-6 text-pink-600 dark:text-pink-400" />
          </div>

          {/* Title */}
          <Dialog.Title className="text-center text-xl font-semibold text-neutral-900 dark:text-neutral-50">Ready to save your moodboard?</Dialog.Title>

          {/* Description */}
          <Dialog.Description className="mt-3 text-center text-sm text-neutral-600 dark:text-neutral-400">
            You've added {imageCount} image{imageCount === 1 ? "" : "s"}. Sign in to save {imageCount === 1 ? "it" : "them"} to a board and access your moodboard from anywhere.
          </Dialog.Description>

          {/* Actions */}
          <div className="mt-6 flex flex-col gap-3">
            <div onClick={onSignIn}>
              <SignInButton className="w-full justify-center" />
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-md px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                Continue adding images
              </button>
            </Dialog.Close>
          </div>

          {/* Small print */}
          <p className="mt-4 text-center text-xs text-neutral-500 dark:text-neutral-500">Your images will be saved and ready after sign-in</p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
