import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui';
import { IconX } from './Icons';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 font-sans">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', duration: 0.4, bounce: 0.3 }}
            className="z-50 w-full max-w-[420px] rounded-2xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/50 px-6 py-4 bg-background/50 backdrop-blur shrink-0">
              <h2 className="text-lg font-semibold tracking-tight font-display text-foreground">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-secondary"
              >
                <IconX className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                {message}
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end border-t border-border px-6 py-4 bg-secondary/20 shrink-0 gap-3">
              <Button variant="ghost" onClick={onClose} type="button">
                {cancelText}
              </Button>
              <Button
                onClick={handleConfirm}
                variant={variant === 'destructive' ? 'destructive' : 'default'}
                className={variant === 'destructive' ? 'px-6' : 'px-6'}
              >
                {confirmText}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;

