import React, { useState, useEffect } from 'react';
import { Tag } from '../types';
import { IconHash, IconX, IconTrash } from './Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Input, Label } from './ui';
import { cn } from '../lib/utils';

interface TagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tag: Omit<Tag, 'id'>) => void;
  onDelete?: (id: string) => void;
  initialData: Tag;
  usageCount: number;
  allTags: Tag[];
}

const TagModal: React.FC<TagModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
  usageCount,
  allTags,
}) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setColor(initialData.color);
    } else {
      resetForm();
    }
    setShowDeleteConfirm(false);
    setError('');
  }, [initialData, isOpen]);

  const resetForm = () => {
    setName('');
    setColor('#3B82F6');
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Tag name is required');
      return;
    }

    // Validate name uniqueness (excluding current tag)
    const nameExists = allTags.some(
      t => t.name.toLowerCase() === trimmedName.toLowerCase() && t.id !== initialData.id
    );
    if (nameExists) {
      setError('A tag with this name already exists');
      return;
    }

    onSave({
      name: trimmedName,
      color: color || '#3B82F6',
    });

    onClose();
  };

  const handleDelete = () => {
    if (initialData && onDelete) {
      onDelete(initialData.id);
      onClose();
    }
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
            className="z-50 w-full max-w-[420px] rounded-2xl border border-border bg-card shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/50 px-6 py-4 bg-background/50 backdrop-blur shrink-0">
              <h2 className="text-lg font-semibold tracking-tight font-display text-foreground">
                Edit tag
              </h2>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-secondary"
              >
                <IconX className="w-4 h-4" />
              </button>
            </div>

            <form id="tag-form" onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
              <div className="overflow-y-auto custom-scrollbar p-6 space-y-6">
                {/* Usage Info */}
                {usageCount > 0 && (
                  <div className="bg-secondary/50 rounded-lg p-3 border border-border/50">
                    <p className="text-xs text-muted-foreground">
                      This tag is used by <span className="font-semibold text-foreground">{usageCount}</span> bookmark{usageCount > 1 ? 's' : ''}
                    </p>
                  </div>
                )}

                {/* Name */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 mb-1">
                    <IconHash className="w-3.5 h-3.5 text-muted-foreground" />
                    <Label className="mb-0 text-foreground">Tag Name</Label>
                  </div>
                  <Input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setError('');
                    }}
                    placeholder="e.g., Research"
                    className="font-sans font-medium"
                    autoFocus
                  />
                  {error && (
                    <p className="text-xs text-destructive mt-1">{error}</p>
                  )}
                </div>

                {/* Color */}
                <div className="space-y-1.5">
                  <Label>Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={color || '#3B82F6'}
                      onChange={(e) => setColor(e.target.value)}
                      className="h-10 w-20 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      placeholder="#3B82F6"
                      className="font-mono text-xs"
                      pattern="^#[0-9A-Fa-f]{6}$"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-border px-6 py-4 bg-secondary/20 shrink-0">
                <div className="h-9">
                  {initialData && onDelete && (
                    <AnimatePresence mode="wait">
                      {showDeleteConfirm ? (
                        <motion.div
                          key="confirm"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          className="flex items-center gap-2 bg-red-50 p-1 pr-2 rounded-lg border border-red-100"
                        >
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={handleDelete}
                            className="h-7 px-3 text-xs bg-red-500 hover:bg-red-600"
                          >
                            Confirm
                          </Button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDeleteConfirm(false);
                            }}
                            className="text-xs text-red-600 hover:underline px-1 font-medium"
                          >
                            Cancel
                          </button>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="trash"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDeleteConfirm(true);
                            }}
                            title="Delete Tag"
                          >
                            <IconTrash className="w-4 h-4" />
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button variant="ghost" onClick={onClose} type="button">
                    Cancel
                  </Button>
                  <Button type="submit" form="tag-form" className="px-6">
                    Update
                  </Button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TagModal;

