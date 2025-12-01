import React, { useState, useEffect } from 'react';
import { Folder } from '../types';
import { IconFolder, IconX, IconTrash } from './Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Input, Label } from './ui';
import { cn } from '../lib/utils';
import { validateFolderMove, isFolderNameUnique, buildFolderTree, flattenFolderTree } from '../lib/folderUtils';

interface FolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (folder: Omit<Folder, 'id' | 'level'>) => void;
  onDelete?: (id: string) => void;
  initialData?: Folder;
  initialParentId?: string | null;
  folders: Folder[];
}

const FolderModal: React.FC<FolderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
  initialParentId,
  folders,
}) => {
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<string | null>(null);
  const [color, setColor] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setParentId(initialData.parentId);
      setColor(initialData.color || '');
    } else {
      resetForm();
      if (initialParentId !== undefined) {
        setParentId(initialParentId);
      }
    }
    setShowDeleteConfirm(false);
    setError('');
  }, [initialData, initialParentId, isOpen]);

  const resetForm = () => {
    setName('');
    setParentId(null);
    setColor('');
    setError('');
  };

  const getAvailableParents = (): Folder[] => {
    if (!initialData) return folders;
    // Exclude current folder and its descendants from parent options
    const excludeIds = [initialData.id];
    const getChildren = (folderId: string) => {
      folders.forEach(f => {
        if (f.parentId === folderId && !excludeIds.includes(f.id)) {
          excludeIds.push(f.id);
          getChildren(f.id);
        }
      });
    };
    getChildren(initialData.id);
    return folders.filter(f => !excludeIds.includes(f.id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Folder name is required');
      return;
    }

    // Validate name uniqueness
    if (!isFolderNameUnique(trimmedName, parentId, folders, initialData?.id)) {
      setError('A folder with this name already exists in the selected parent');
      return;
    }

    // Validate move operation if editing
    if (initialData && initialData.parentId !== parentId) {
      const validation = validateFolderMove(initialData.id, parentId, folders);
      if (!validation.valid) {
        setError(validation.error || 'Invalid folder move');
        return;
      }
    }

    // Calculate level (will be recalculated properly on save)
    const parentFolder = parentId ? folders.find(f => f.id === parentId) : null;
    const level = parentFolder ? parentFolder.level + 1 : 0;

    onSave({
      name: trimmedName,
      parentId,
      level,
      ...(color && { color }),
    });

    onClose();
  };

  const handleDelete = () => {
    if (initialData && onDelete) {
      onDelete(initialData.id);
      onClose();
    }
  };

  const folderTree = buildFolderTree(getAvailableParents());
  const flatFolders = flattenFolderTree(folderTree);

  const renderFolderOption = (folder: Folder, depth: number = 0) => {
    const children = folders.filter(f => f.parentId === folder.id);
    return (
      <React.Fragment key={folder.id}>
        <option value={folder.id}>
          {'\u00A0\u00A0'.repeat(depth) + (depth > 0 ? '↳ ' : '') + folder.name}
        </option>
        {children.map(child => renderFolderOption(child, depth + 1))}
      </React.Fragment>
    );
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
                {initialData ? 'Edit folder' : 'Create folder'}
              </h2>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-secondary"
              >
                <IconX className="w-4 h-4" />
              </button>
            </div>

            <form id="folder-form" onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
              <div className="overflow-y-auto custom-scrollbar p-6 space-y-6">
                {/* Name */}
                <div className="space-y-1.5">
                  <Label>Folder Name</Label>
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

                {/* Parent Folder */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 mb-1">
                    <IconFolder className="w-3.5 h-3.5 text-muted-foreground" />
                    <Label className="mb-0 text-foreground">Parent Folder</Label>
                  </div>
                  <div className="relative">
                    <select
                      value={parentId || ''}
                      onChange={(e) => setParentId(e.target.value || null)}
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:border-foreground disabled:cursor-not-allowed disabled:opacity-50 appearance-none font-sans cursor-pointer hover:border-zinc-300"
                    >
                      <option value="">No Parent (Root Level)</option>
                      {flatFolders.map(folder => (
                        <option key={folder.id} value={folder.id}>
                          {'\u00A0\u00A0'.repeat(folder.level) + (folder.level > 0 ? '↳ ' : '') + folder.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                      <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Color (Optional) */}
                <div className="space-y-1.5">
                  <Label>Color (Optional)</Label>
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
                            title="Delete Folder"
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
                  <Button type="submit" form="folder-form" className="px-6">
                    {initialData ? 'Update' : 'Create'}
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

export default FolderModal;

