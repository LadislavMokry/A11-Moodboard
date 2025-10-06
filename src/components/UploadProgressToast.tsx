import { Button } from "@/components/ui/button";
import type { UploadStatus } from "@/hooks/useImageUpload";
import { cn } from "@/lib/utils";

export interface UploadToastItem {
  id: string;
  fileName: string;
  progress: number;
  status: UploadStatus;
  error?: string;
}

interface UploadProgressToastProps {
  uploads: UploadToastItem[];
  onCancel: (id: string) => void;
}

export function UploadProgressToast({ uploads, onCancel }: UploadProgressToastProps) {
  return (
    <div className="w-[320px] max-w-full rounded-2xl border border-neutral-200/70 bg-white/95 p-4 shadow-xl backdrop-blur dark:border-neutral-800/70 dark:bg-neutral-900/95">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">Image uploads</span>
        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
          {uploads.filter((item) => item.status === "success").length}/{uploads.length} done
        </span>
      </div>

      <div className="space-y-3">
        {uploads.map((upload) => {
          const statusLabel = getStatusLabel(upload.status, upload.error);
          const isCancelable = ["pending", "uploading", "processing"].includes(upload.status);

          return (
            <div
              key={upload.id}
              className="rounded-xl border border-neutral-200/60 bg-white/70 p-3 shadow-sm dark:border-neutral-800/60 dark:bg-neutral-900/70"
            >
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="truncate font-medium text-neutral-800 dark:text-neutral-200">{upload.fileName}</span>
                <span className={cn("whitespace-nowrap text-neutral-500 dark:text-neutral-400", upload.status === "error" && "text-red-500")}>{statusLabel}</span>
              </div>

              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                <div
                  className="h-full rounded-full bg-pink-500 transition-[width] duration-300 ease-out"
                  style={{ width: `${Math.min(100, Math.max(0, upload.progress))}%` }}
                />
              </div>

              {upload.error ? <p className="mt-2 text-xs text-red-500">{upload.error}</p> : null}

              {isCancelable ? (
                <div className="mt-2 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-50"
                    onClick={() => onCancel(upload.id)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getStatusLabel(status: UploadStatus, error?: string): string {
  if (status === "error") {
    return error ?? "Error";
  }

  switch (status) {
    case "pending":
    case "uploading":
      return "Uploading�";
    case "processing":
      return "Processing�";
    case "success":
      return "Complete";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}
