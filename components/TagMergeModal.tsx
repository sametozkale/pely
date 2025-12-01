import React, { useState, useEffect } from 'react';
import { Tag } from '../types';
import { IconHash, IconX, IconArrowRight } from './Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Label } from './ui';
import { cn } from '../lib/utils';

interface TagMergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMerge: (sourceTagId: string, targetTagId: string) => void;
  sourceTag: Tag;
  allTags: Tag[];
  bookmarks: Array<{ id: string; tags: string[] }>;
}

const TagMergeModal: React.FC<TagMergeModalProps> = ({
  isOpen,
  onClose,
  onMerge,
  sourceTag,
  allTags,
  bookmarks,
}) => {
  const [targetTagId, setTargetTagId] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      // Exclude source tag from options
      const availableTags = allTags.filter(t => t.id !== sourceTag.id);
      if (availableTags.length > 0) {
        setTargetTagId(availableTags[0].id);
      } else {
        setTargetTagId('');
      }
    }
  }, [isOpen, sourceTag.id, allTags]);

  const targetTag = allTags.find(t => t.id === targetTagId);
  const sourceBookmarkCount = bookmarks.filter(b => b.tags.includes(sourceTag.id)).length;
  const targetBookmarkCount = bookmarks.filter(b => b.tags.includes(targetTagId)).length;
  const affectedBookmarks = bookmarks.filter(
    b => b.tags.includes(sourceTag.id) && !b.tags.includes(targetTagId)
  ).length;

  const handleMerge = () => {
    if (targetTagId && targetTagId !== sourceTag.id) {
      onMerge(sourceTag.id, targetTagId);
      onClose();
    }
  };

  const availableTags = allTags.filter(t => t.id !== sourceTag.id);

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
          className="z-50 w-full max-w-[480px] rounded-2xl border border-border bg-card shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/50 px-6 py-4 bg-background/50 backdrop-blur shrink-0">
            <h2 className="text-lg font-semibold tracking-tight font-display text-foreground">
              Merge Tags
            </h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-secondary"
            >
              <IconX className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-y-auto custom-scrollbar p-6 space-y-6">
            {/* Info */}
            <div className="bg-secondary/50 rounded-lg p-4 border border-border/50 space-y-2">
              <p className="text-sm text-foreground font-medium">What happens when you merge tags?</p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>All bookmarks using the source tag will be updated to use the target tag</li>
                <li>The source tag will be deleted</li>
                <li>If a bookmark already has both tags, only the target tag will remain</li>
              </ul>
            </div>

            {/* Source Tag */}
            <div className="space-y-2">
              <Label>Source Tag (will be deleted)</Label>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-secondary/30">
                <span 
                  className="w-2 h-2 rounded-full shrink-0" 
                  style={{ backgroundColor: sourceTag.color }}
                />
                <span className="font-medium text-foreground">{sourceTag.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {sourceBookmarkCount} bookmark{sourceBookmarkCount !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <IconArrowRight className="w-5 h-5 text-muted-foreground" />
            </div>

            {/* Target Tag */}
            <div className="space-y-2">
              <Label>Target Tag (will keep)</Label>
              {availableTags.length === 0 ? (
                <p className="text-sm text-muted-foreground">No other tags available to merge with.</p>
              ) : (
                <div className="space-y-2">
                  <select
                    value={targetTagId}
                    onChange={(e) => setTargetTagId(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:border-foreground disabled:cursor-not-allowed disabled:opacity-50 appearance-none font-sans cursor-pointer hover:border-zinc-300"
                  >
                    {availableTags.map(tag => (
                      <option key={tag.id} value={tag.id}>
                        {tag.name}
                      </option>
                    ))}
                  </select>
                  {targetTag && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-secondary/30">
                      <span 
                        className="w-2 h-2 rounded-full shrink-0" 
                        style={{ backgroundColor: targetTag.color }}
                      />
                      <span className="font-medium text-foreground">{targetTag.name}</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {targetBookmarkCount} bookmark{targetBookmarkCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Preview */}
            {targetTagId && (
              <div className="bg-blue-50/50 border border-blue-200/50 rounded-lg p-3">
                <p className="text-xs text-blue-900/80">
                  <span className="font-semibold">{affectedBookmarks}</span> bookmark{affectedBookmarks !== 1 ? 's' : ''} will be updated
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end border-t border-border px-6 py-4 bg-secondary/20 shrink-0 gap-3">
            <Button variant="ghost" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button 
              onClick={handleMerge} 
              disabled={!targetTagId || availableTags.length === 0}
              className="px-6"
            >
              Merge Tags
            </Button>
          </div>
        </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TagMergeModal;

