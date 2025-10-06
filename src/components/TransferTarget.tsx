import { useDroppable } from "@dnd-kit/core";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useState } from "react";

interface TransferTargetProps {
  show: boolean;
  onDrop: () => void;
}

export function TransferTarget({ show, onDrop }: TransferTargetProps) {
  const [isHovering, setIsHovering] = useState(false);

  const { setNodeRef, isOver } = useDroppable({
    id: "transfer-target"
  });

  const _handleDrop = () => {
    if (isOver) {
      onDrop();
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-6 right-6 z-40"
        >
          <div
            ref={setNodeRef}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            className={`flex items-center gap-3 px-5 py-4 rounded-xl border-2 border-dashed transition-all ${isOver ? "bg-pink-100 border-pink-500 dark:bg-pink-950/40 dark:border-pink-500 scale-105" : isHovering ? "bg-pink-50 border-pink-400 dark:bg-pink-950/20 dark:border-pink-600" : "bg-white border-neutral-300 dark:bg-neutral-900 dark:border-neutral-700"}`}
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${isOver ? "bg-pink-500 text-white" : "bg-pink-100 text-pink-600 dark:bg-pink-950/40 dark:text-pink-500"}`}>
              <ArrowRight className="h-5 w-5" />
            </div>
            <div>
              <p className={`text-sm font-medium transition-colors ${isOver ? "text-pink-700 dark:text-pink-400" : "text-neutral-700 dark:text-neutral-300"}`}>Transfer to...</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Drop to choose board</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
