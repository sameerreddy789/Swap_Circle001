'use client';
import { useLoading } from '@/hooks/use-loading';
import BoxLoader from './box-loader';
import { AnimatePresence, motion } from 'framer-motion';

export default function LoadingOverlay() {
  const { isLoading } = useLoading();

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <BoxLoader />
          <p className="mt-20 text-lg font-medium text-primary">Loading...</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
