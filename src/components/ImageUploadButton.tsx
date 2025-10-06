import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Upload } from "lucide-react";
import { useRef } from "react";

interface ImageUploadButtonProps {
  onSelectFiles: (files: FileList | null) => void;
  uploading: boolean;
  accept: string;
  inProgressCount: number;
  className?: string;
}

export function ImageUploadButton({ onSelectFiles, uploading, accept, inProgressCount, className }: ImageUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const { files } = event.target;
    onSelectFiles(files);
    event.target.value = "";
  };

  return (
    <div className={cn("relative", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        onChange={handleChange}
      />

      <Button
        type="button"
        onClick={handleClick}
        disabled={uploading}
        size="sm"
        className="gap-2"
      >
        <Upload className="h-4 w-4" />
        Upload
        {uploading && inProgressCount > 0 ? <span className="rounded-full bg-pink-100 px-2 py-0.5 text-xs font-semibold text-pink-700 dark:bg-pink-500/20 dark:text-pink-200">{inProgressCount}</span> : null}
      </Button>
    </div>
  );
}
