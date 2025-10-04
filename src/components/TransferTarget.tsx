import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TransferTargetProps {
  show: boolean;
  onDrop: () => void;
}

export function TransferTarget({ show, onDrop }: TransferTargetProps) {
  const [isHovering, setIsHovering] = useState(false);

  const { setNodeRef, isOver } = useDroppable({
    id: 'transfer-target',
  });

  const handleDrop = () => {
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
            className={`flex items-center gap-3 px-5 py-4 rounded-xl border-2 border-dashed transition-all ${
              isOver
                ? 'bg-violet-100 border-violet-500 dark:bg-violet-950/40 dark:border-violet-500 scale-105'
                : isHovering
                  ? 'bg-violet-50 border-violet-400 dark:bg-violet-950/20 dark:border-violet-600'
                  : 'bg-white border-neutral-300 dark:bg-neutral-900 dark:border-neutral-700'
            }`}
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
              isOver
                ? 'bg-violet-500 text-white'
                : 'bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-500'
            }`}>
              <ArrowRight className="h-5 w-5" />
            </div>
            <div>
              <p className={`text-sm font-medium transition-colors ${
                isOver
                  ? 'text-violet-700 dark:text-violet-400'
                  : 'text-neutral-700 dark:text-neutral-300'
              }`}>
                Transfer to...
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Drop to choose board
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
