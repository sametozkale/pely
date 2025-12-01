import React, { useEffect, useRef } from 'react';
import { Folder } from '../types';
import { IconEdit, IconTrash, IconFolder, IconMoreHorizontal } from './Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

interface FolderContextMenuProps {
  folder: Folder;
  position: { x: number; y: number };
  onClose: () => void;
  onEdit: (folder: Folder) => void;
  onDelete: (folderId: string) => void;
  onCreateSubfolder: (parentId: string) => void;
  onMove?: (folderId: string) => void;
}

const FolderContextMenu: React.FC<FolderContextMenuProps> = ({
  folder,
  position,
  onClose,
  onEdit,
  onDelete,
  onCreateSubfolder,
  onMove,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  useEffect(() => {
    // Adjust position if menu goes off-screen
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = position.x;
      let adjustedY = position.y;

      if (rect.right > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 10;
      }
      if (rect.bottom > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 10;
      }
      if (adjustedX < 0) adjustedX = 10;
      if (adjustedY < 0) adjustedY = 10;

      if (adjustedX !== position.x || adjustedY !== position.y) {
        menuRef.current.style.left = `${adjustedX}px`;
        menuRef.current.style.top = `${adjustedY}px`;
      }
    }
  }, [position]);

  const menuItems = [
    {
      label: 'Edit',
      icon: IconEdit,
      onClick: () => {
        onEdit(folder);
        onClose();
      },
    },
    {
      label: 'Create Subfolder',
      icon: IconFolder,
      onClick: () => {
        onCreateSubfolder(folder.id);
        onClose();
      },
    },
    ...(onMove
      ? [
          {
            label: 'Move',
            icon: IconMoreHorizontal,
            onClick: () => {
              onMove(folder.id);
              onClose();
            },
          },
        ]
      : []),
    {
      label: 'Delete',
      icon: IconTrash,
      onClick: () => {
        onDelete(folder.id);
        onClose();
      },
      className: 'text-destructive hover:text-destructive hover:bg-red-50',
    },
  ];

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="fixed z-[100] min-w-[180px] rounded-lg border border-border bg-card shadow-lg py-1"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={index}
              onClick={item.onClick}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors',
                item.className
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </motion.div>
    </AnimatePresence>
  );
};

export default FolderContextMenu;

