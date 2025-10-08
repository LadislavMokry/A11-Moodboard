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
        className="gap-1 px-2 md:gap-2 md:px-3"
      >
        <Upload className="h-4 w-4" />
        <span className="hidden md:inline">Upload</span>
        {uploading && inProgressCount > 0 ? <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary dark:bg-primary/20 dark:text-primary/80">{inProgressCount}</span> : null}
      </Button>
    </div>
  );
}
