
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Bookmark, Folder, Tag, ViewMode } from './types';
import { MOCK_BOOKMARKS, MOCK_FOLDERS, MOCK_TAGS } from './constants';
import { initFirebase, getCurrentUser, getAuthInstance } from "./firebaseClient";
import { onAuthStateChanged, User } from "firebase/auth";
import { loadUserLibrary, saveBookmark, deleteBookmark as deleteBookmarkRemote, updateBookmarkPartial, saveTagsIfMissing, saveFolder, deleteFolder, updateFolderPartial, moveFolder, updateTag, deleteTag, mergeTags, removeTagFromAllBookmarks } from "./services/firestoreService";
import { calculateFolderLevels, validateFolderMove, isFolderNameUnique, getAllChildFolderIds } from "./lib/folderUtils";
import { 
  IconFolder, 
  IconHash, 
  IconPlus, 
  IconSearch, 
  IconGrid, 
  IconList, 
  IconMenu, 
  IconChevronRight, 
  IconCheck,
  IconX,
  IconTrash,
  IconEdit,
  IconSidebar,
  IconArchive,
  IconSparkles,
  IconCopy
} from './components/Icons';
import { signOut } from './services/authService';
import BookmarkCard from './components/BookmarkCard';
import BookmarkModal from './components/BookmarkModal';
import FolderModal from './components/FolderModal';
import FolderContextMenu from './components/FolderContextMenu';
import TagModal from './components/TagModal';
import TagContextMenu from './components/TagContextMenu';
import TagMergeModal from './components/TagMergeModal';
import ConfirmModal from './components/ConfirmModal';
import SignInPage from './components/auth/SignInPage';
import SignUpPage from './components/auth/SignUpPage';
import ProfilePage from './components/auth/ProfilePage';
import { Button, Input } from './components/ui';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from './lib/utils';

// --- Pely AI Logo Component ---
const LogoIcon = ({ className = "w-6 h-6", rounded = "rounded-lg" }: { className?: string, rounded?: string }) => (
  <div className={cn("bg-brand-blue flex items-center justify-center shrink-0", rounded, className)}>
    <div className="w-2/3 h-2/3 rounded-full bg-white" />
  </div>
);

const FOLDER_ID_ARCHIVE = 'ARCHIVE';

// --- Dashboard Component ---
const Dashboard: React.FC = () => {
  // --- State ---
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(MOCK_BOOKMARKS);
  const [folders, setFolders] = useState<Folder[]>(MOCK_FOLDERS);
  const [tags, setTags] = useState<Tag[]>(MOCK_TAGS);
  const [isUsingBackend, setIsUsingBackend] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.GRID);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Default open on desktop
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | undefined>(undefined);
  
  // Folder Management State
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | undefined>(undefined);
  const [contextMenuFolder, setContextMenuFolder] = useState<Folder | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);
  
  // Tag Management State
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | undefined>(undefined);
  const [contextMenuTag, setContextMenuTag] = useState<Tag | null>(null);
  const [tagContextMenuPosition, setTagContextMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [isTagMergeModalOpen, setIsTagMergeModalOpen] = useState(false);
  const [mergeSourceTag, setMergeSourceTag] = useState<Tag | null>(null);
  
  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'default' | 'destructive';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'default',
  });
  
  // Bulk Selection State
  const [selectedBookmarkIds, setSelectedBookmarkIds] = useState<Set<string>>(new Set());

  // --- Filtering Logic ---
  const filteredBookmarks = useMemo(() => {
    return bookmarks.filter(b => {
      // Filter by Archive Status
      if (selectedFolderId === FOLDER_ID_ARCHIVE) {
        if (!b.isArchived) return false;
      } else {
        if (b.isArchived) return false;
        
        // Normal folder filtering only applies if not in archive view
        if (selectedFolderId && b.folderId !== selectedFolderId) return false;
      }

      // Filter by Tag
      if (selectedTagId && !b.tags.includes(selectedTagId)) return false;

      // Filter by Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          b.title.toLowerCase().includes(q) || 
          b.description.toLowerCase().includes(q) ||
          b.url.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [bookmarks, searchQuery, selectedFolderId, selectedTagId]);

  // --- Handlers ---
  const handleDeleteBookmark = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Bookmark',
      message: 'Are you sure you want to delete this bookmark? This action cannot be undone.',
      onConfirm: () => {
      setBookmarks(prev => prev.filter(b => b.id !== id));
        if (isUsingBackend) {
          deleteBookmarkRemote(id).catch(err => {
            console.error("Failed to delete bookmark remotely", err);
          });
        }
      setSelectedBookmarkIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      },
      variant: 'destructive',
    });
  };

  const handleArchiveBookmark = (id: string) => {
    setBookmarks(prev => prev.map(b => {
      if (b.id === id) {
        return {
            ...b,
            isArchived: !b.isArchived, // Toggle archive status
            archivedAt: !b.isArchived ? Date.now() : undefined,
            snapshotHtml: !b.isArchived ? '<!-- Snapshot Placeholder -->' : undefined
        };
      }
      return b;
    }));
    if (isUsingBackend) {
      const bookmark = bookmarks.find(b => b.id === id);
      if (bookmark) {
        updateBookmarkPartial(id, {
          isArchived: !bookmark.isArchived,
          archivedAt: !bookmark.isArchived ? Date.now() : undefined,
          snapshotHtml: !bookmark.isArchived ? "<!-- Snapshot Placeholder -->" : undefined,
        }).catch(err => console.error("Failed to update archive status remotely", err));
      }
    }
    // Clear selection if the item disappears from view
    if (selectedBookmarkIds.has(id)) {
        setSelectedBookmarkIds(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        })
    }
  };

  const handleModalDelete = (id: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== id));
    if (isUsingBackend) {
      deleteBookmarkRemote(id).catch(err => console.error("Failed to delete bookmark remotely", err));
    }
    setSelectedBookmarkIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setIsModalOpen(false);
  }

  const handleSaveBookmark = (data: Omit<Bookmark, 'id' | 'createdAt'>, tagsToCreate: Omit<Tag, 'id'>[] = []) => {
    if (editingBookmark) {
      // Update
      setBookmarks(prev => prev.map(b => b.id === editingBookmark.id ? { ...b, ...data } : b));
      if (isUsingBackend) {
        const updated: Bookmark = {
          ...editingBookmark,
          ...data,
        };
        saveBookmark(updated).catch(err => console.error("Failed to save bookmark remotely", err));
      }
    } else {
      // Create
      const newBookmark: Bookmark = {
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        ...data
      };
      setBookmarks(prev => [newBookmark, ...prev]);
      if (isUsingBackend) {
        saveBookmark(newBookmark).catch(err => console.error("Failed to save bookmark remotely", err));
      }
    }
    // Handle newly created tags
    if (tagsToCreate.length > 0) {
      setTags(prev => {
        const existingNames = new Set(prev.map(t => t.name.toLowerCase()));
        const newTags: Tag[] = tagsToCreate
          .filter(t => !existingNames.has(t.name.toLowerCase()))
          .map(t => ({
            id: crypto.randomUUID(),
            name: t.name,
            color: t.color,
          }));
        if (isUsingBackend && newTags.length) {
          saveTagsIfMissing(newTags).catch(err => console.error("Failed to save tags remotely", err));
        }
        return [...prev, ...newTags];
      });
    }
    setEditingBookmark(undefined);
  };

  const openCreateModal = () => {
    setEditingBookmark(undefined);
    setIsModalOpen(true);
  };

  const openEditModal = (b: Bookmark) => {
    setEditingBookmark(b);
    setIsModalOpen(true);
  };

  // Bulk Selection Handlers
  const handleToggleSelect = (id: string) => {
    setSelectedBookmarkIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedBookmarkIds.size === filteredBookmarks.length) {
      setSelectedBookmarkIds(new Set());
    } else {
      setSelectedBookmarkIds(new Set(filteredBookmarks.map(b => b.id)));
    }
  };

  const handleBulkDelete = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Bookmarks',
      message: `Are you sure you want to delete ${selectedBookmarkIds.size} item${selectedBookmarkIds.size > 1 ? 's' : ''}? This action cannot be undone.`,
      onConfirm: () => {
        const idsToDelete = Array.from(selectedBookmarkIds);
      setBookmarks(prev => prev.filter(b => !selectedBookmarkIds.has(b.id)));
        if (isUsingBackend && idsToDelete.length) {
          idsToDelete.forEach(id => {
            deleteBookmarkRemote(id).catch(err => console.error("Failed to delete bookmark remotely", err));
          });
        }
      setSelectedBookmarkIds(new Set());
      },
      variant: 'destructive',
    });
  };

  // --- Folder Management Handlers ---
  const getFolderBookmarkCount = (folderId: string | null) => {
    return bookmarks.filter(b => b.folderId === folderId && !b.isArchived).length;
  };

  const handleCreateFolder = () => {
    setEditingFolder(undefined);
    setIsFolderModalOpen(true);
  };

  const handleEditFolder = (folder: Folder) => {
    setEditingFolder(folder);
    setIsFolderModalOpen(true);
  };

  const handleSaveFolder = (data: Omit<Folder, 'id' | 'level'>) => {
    if (editingFolder) {
      // Update
      const updatedFolder: Folder = {
        ...editingFolder,
        ...data,
      };
      // Recalculate level
      const parentFolder = data.parentId ? folders.find(f => f.id === data.parentId) : null;
      updatedFolder.level = parentFolder ? parentFolder.level + 1 : 0;
      
      setFolders(prev => {
        const updated = prev.map(f => f.id === editingFolder.id ? updatedFolder : f);
        return calculateFolderLevels(updated);
      });
      
      if (isUsingBackend) {
        saveFolder(updatedFolder).catch(err => console.error("Failed to save folder remotely", err));
      }
    } else {
      // Create
      const parentFolder = data.parentId ? folders.find(f => f.id === data.parentId) : null;
      const level = parentFolder ? parentFolder.level + 1 : 0;
      
      const newFolder: Folder = {
        id: crypto.randomUUID(),
        ...data,
        level,
      };
      
      setFolders(prev => {
        const updated = [...prev, newFolder];
        return calculateFolderLevels(updated);
      });
      
      if (isUsingBackend) {
        saveFolder(newFolder).catch(err => console.error("Failed to save folder remotely", err));
      }
    }
    setEditingFolder(undefined);
  };

  const handleDeleteFolder = (folderId: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    const bookmarkCount = getFolderBookmarkCount(folderId);
    const childFolders = folders.filter(f => f.parentId === folderId);
    
    let message = `Are you sure you want to delete "${folder.name}"?`;
    if (bookmarkCount > 0) {
      message += `\n\nThis folder contains ${bookmarkCount} bookmark${bookmarkCount > 1 ? 's' : ''}. They will be moved to the parent folder.`;
    }
    if (childFolders.length > 0) {
      message += `\n\nThis folder contains ${childFolders.length} subfolder${childFolders.length > 1 ? 's' : ''}. They will be moved to the parent folder.`;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Delete Folder',
      message: message,
      onConfirm: () => {
        // Move bookmarks to parent folder
        setBookmarks(prev => prev.map(b => 
          b.folderId === folderId ? { ...b, folderId: folder.parentId } : b
        ));
        
        // Move child folders to parent
        setFolders(prev => {
          const updated = prev.map(f => 
            f.parentId === folderId ? { ...f, parentId: folder.parentId } : f
          ).filter(f => f.id !== folderId);
          return calculateFolderLevels(updated);
        });
        
        if (isUsingBackend) {
          // Update bookmarks in Firestore
          bookmarks.filter(b => b.folderId === folderId).forEach(b => {
            updateBookmarkPartial(b.id, { folderId: folder.parentId }).catch(err => 
              console.error("Failed to update bookmark folder", err)
            );
          });
          // Update child folders in Firestore
          folders.filter(f => f.parentId === folderId).forEach(f => {
            updateFolderPartial(f.id, { parentId: folder.parentId }).catch(err => 
              console.error("Failed to update folder parent", err)
            );
          });
          // Delete folder
          deleteFolder(folderId).catch(err => console.error("Failed to delete folder remotely", err));
        }
      },
      variant: 'destructive',
    });
  };

  const handleFolderContextMenu = (e: React.MouseEvent, folder: Folder) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuFolder(folder);
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
  };

  const [subfolderParentId, setSubfolderParentId] = useState<string | null>(null);

  const handleCreateSubfolder = (parentId: string) => {
    setEditingFolder(undefined);
    setSubfolderParentId(parentId);
    setIsFolderModalOpen(true);
  };

  // --- Tag Management Handlers ---
  const getTagUsageCount = (tagId: string) => {
    return bookmarks.filter(b => b.tags.includes(tagId) && !b.isArchived).length;
  };

  const handleEditTag = (tag: Tag) => {
    setEditingTag(tag);
    setIsTagModalOpen(true);
  };

  const handleSaveTag = (data: Omit<Tag, 'id'>) => {
    if (!editingTag) return;

    const updatedTag: Tag = {
      ...editingTag,
      ...data,
    };

    setTags(prev => prev.map(t => t.id === editingTag.id ? updatedTag : t));

    if (isUsingBackend) {
      updateTag(editingTag.id, data).catch(err => console.error("Failed to update tag remotely", err));
    }

    setEditingTag(undefined);
  };

  const handleDeleteTag = (tagId: string) => {
    const tag = tags.find(t => t.id === tagId);
    if (!tag) return;

    const usageCount = getTagUsageCount(tagId);
    let message = `Are you sure you want to delete "${tag.name}"?`;
    if (usageCount > 0) {
      message += `\n\nThis tag is used by ${usageCount} bookmark${usageCount > 1 ? 's' : ''}. It will be removed from all bookmarks.`;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Delete Tag',
      message: message,
      onConfirm: () => {
        // Remove tag from all bookmarks
        setBookmarks(prev => prev.map(b => ({
          ...b,
          tags: b.tags.filter(tid => tid !== tagId)
        })));

        // Remove tag from tags list
        setTags(prev => prev.filter(t => t.id !== tagId));

        if (isUsingBackend) {
          removeTagFromAllBookmarks(tagId).catch(err => 
            console.error("Failed to remove tag from bookmarks", err)
          );
          deleteTag(tagId).catch(err => console.error("Failed to delete tag remotely", err));
        }
      },
      variant: 'destructive',
    });
  };

  const handleMergeTags = (sourceTagId: string, targetTagId: string) => {
    const sourceTag = tags.find(t => t.id === sourceTagId);
    const targetTag = tags.find(t => t.id === targetTagId);
    if (!sourceTag || !targetTag) return;

    // Update all bookmarks: replace sourceTagId with targetTagId (avoid duplicates)
    setBookmarks(prev => prev.map(b => {
      if (!b.tags.includes(sourceTagId)) return b;
      
      const hasTarget = b.tags.includes(targetTagId);
      // If bookmark already has target tag, just remove source tag
      // Otherwise, replace source tag with target tag
      const updatedTags = hasTarget
        ? b.tags.filter(tid => tid !== sourceTagId)
        : b.tags.map(tid => tid === sourceTagId ? targetTagId : tid);
      
      return { ...b, tags: updatedTags };
    }));

    // Remove source tag
    setTags(prev => prev.filter(t => t.id !== sourceTagId));

    if (isUsingBackend) {
      mergeTags(sourceTagId, targetTagId).catch(err => 
        console.error("Failed to merge tags remotely", err)
      );
    }
  };

  const handleTagContextMenu = (e: React.MouseEvent, tag: Tag) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuTag(tag);
    setTagContextMenuPosition({ x: e.clientX, y: e.clientY });
  };

  const handleMergeTag = (tagId: string) => {
    const tag = tags.find(t => t.id === tagId);
    if (tag) {
      setMergeSourceTag(tag);
      setIsTagMergeModalOpen(true);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = '/signin';
    } catch (err: any) {
      console.error('Failed to sign out', err);
    }
  };

  // Close user menu when clicking outside
  const userMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  // Close profile menu when clicking outside
  const profileMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  // Initialize Firebase and load library once on mount
  useEffect(() => {
    const app = initFirebase();
    if (!app) {
      // Firebase not configured, keep using mock data
      return;
    }

    // Listen to auth state changes
    const auth = getAuthInstance();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setIsAnonymous(user?.isAnonymous || false);
      
      if (user) {
        try {
          const { bookmarks, folders, tags } = await loadUserLibrary();
          setBookmarks(bookmarks.length ? bookmarks : MOCK_BOOKMARKS);
          // Recalculate folder levels after loading
          const foldersWithLevels = calculateFolderLevels(folders.length ? folders : MOCK_FOLDERS);
          setFolders(foldersWithLevels);
          setTags(tags.length ? tags : MOCK_TAGS);
          setIsUsingBackend(true);
        } catch (err) {
          console.error("Failed to load library from Firestore, using mock data.", err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
      
      {/* --- Sidebar --- */}
      <motion.aside 
        initial={false}
        animate={{ 
          width: isSidebarOpen ? 260 : 0, 
          opacity: isSidebarOpen ? 1 : 0 
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-white border-r border-border/50 flex flex-col overflow-hidden whitespace-nowrap h-full z-20"
      >
        {/* User / App Title */}
        <div className="h-14 min-h-[56px] flex items-center justify-between px-4 border-b border-border/50">
           <div className="flex items-center gap-3">
             <LogoIcon className="w-6 h-6" />
             <span className="font-bold text-foreground text-lg tracking-tight font-display">Pely AI</span>
           </div>
           <Button 
             variant="ghost" 
             size="icon" 
             onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
             className="h-8 w-8 text-muted-foreground hover:text-foreground"
           >
             <IconSidebar className="w-4 h-4" />
           </Button>
        </div>

        <div className="flex-1 overflow-y-auto pt-4 pb-6 px-3 custom-scrollbar space-y-8">
          
          {/* Folders Section */}
          <div className="space-y-1">
            <div className="flex items-center justify-between mb-3 pl-4 pr-1">
              <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-display">Library</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCreateFolder}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                title="Create folder"
              >
                <IconPlus className="w-4 h-4" />
              </Button>
            </div>
            <button 
              onClick={() => setSelectedFolderId(null)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 group font-sans",
                selectedFolderId === null 
                  ? "bg-secondary text-foreground font-medium" 
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              )}
            >
              <IconFolder className="w-4 h-4" />
              <span className="flex-1 text-left">All Items</span>
              <span className="text-[10px] text-muted-foreground/60 group-hover:opacity-0 transition-opacity">{getFolderBookmarkCount(null)}</span>
            </button>
            {folders.map(folder => {
              const bookmarkCount = getFolderBookmarkCount(folder.id);
              const hasSubfolders = folders.some(f => f.parentId === folder.id);
              return (
                <div
                key={folder.id}
                  className="group relative"
                  onContextMenu={(e) => handleFolderContextMenu(e, folder)}
                >
                  <button
                onClick={() => setSelectedFolderId(folder.id === selectedFolderId ? null : folder.id)}
                className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 font-sans group/button",
                  selectedFolderId === folder.id 
                     ? "bg-secondary text-foreground font-medium" 
                     : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                )}
                style={{ paddingLeft: `${(folder.level * 12) + 12}px` }}
              >
                    <div className="flex items-center gap-2 shrink-0">
                      {folder.color && (
                        <div 
                          className="w-1.5 h-1.5 rounded-full shrink-0" 
                          style={{ backgroundColor: folder.color }}
                        />
                      )}
                <IconFolder className="w-4 h-4 opacity-80" />
                    </div>
                    <span className="flex-1 text-left truncate">{folder.name}</span>
                    <div className="flex items-center gap-1.5 shrink-0 group-hover/button:opacity-0 transition-opacity">
                      <span className="text-[10px] text-muted-foreground/60">{bookmarkCount}</span>
                    </div>
                    <div className="absolute right-2 opacity-0 group-hover/button:opacity-100 transition-opacity flex items-center gap-0.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditFolder(folder);
                        }}
                        className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background rounded transition-colors"
                        title="Edit folder"
                      >
                        <IconEdit className="w-4 h-4" />
              </button>
                <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFolder(folder.id);
                        }}
                        className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-red-50 rounded transition-colors"
                        title="Delete folder"
                      >
                        <IconTrash className="w-4 h-4" />
                </button>
             </div>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Tags Section */}
          <div className="space-y-1">
            <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-3 font-display">Tags</h3>
            {tags.map(tag => {
              return (
                <div
                key={tag.id}
                  className="group relative"
                  onContextMenu={(e) => handleTagContextMenu(e, tag)}
                >
                  <button
                onClick={() => setSelectedTagId(tag.id === selectedTagId ? null : tag.id)}
                className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 font-sans group/button",
                  selectedTagId === tag.id 
                    ? "bg-secondary text-foreground font-medium" 
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                )}
              >
                    <IconHash className="w-4 h-4 opacity-70 shrink-0" />
                    <span className="flex-1 text-left truncate">{tag.name}</span>
                    <span className="w-2 h-2 rounded-full opacity-80 shrink-0 group-hover/button:opacity-0 transition-opacity" style={{ backgroundColor: tag.color }} />
                    <div className="absolute right-2 opacity-0 group-hover/button:opacity-100 transition-opacity flex items-center gap-0.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditTag(tag);
                        }}
                        className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background rounded transition-colors"
                        title="Edit tag"
                      >
                        <IconEdit className="w-4 h-4" />
              </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTag(tag.id);
                        }}
                        className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-red-50 rounded transition-colors"
                        title="Delete tag"
                      >
                        <IconTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
             
             {/* Archive Section */}
        <div className="px-3">
                <button
                    onClick={() => setSelectedFolderId(FOLDER_ID_ARCHIVE)}
                    className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 group font-sans",
                    selectedFolderId === FOLDER_ID_ARCHIVE 
                        ? "bg-secondary text-foreground font-medium" 
                        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                    )}
                >
                    <IconArchive className="w-4 h-4 opacity-80" />
                    Archive
                </button>
          </div>

        {/* Profile Section */}
        <div className="px-3 pb-3 relative" ref={profileMenuRef}>
              <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 font-sans text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
          >
            {currentUser && !isAnonymous ? (
              <>
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    className="w-4 h-4 rounded-full"
                  />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-[10px] font-semibold">
                    {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <span className="flex-1 text-left truncate">{currentUser.displayName || currentUser.email || 'Profile'}</span>
              </>
            ) : (
              <>
                <div className="w-4 h-4 rounded-full bg-secondary flex items-center justify-center text-muted-foreground text-[10px] font-semibold">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <span className="flex-1 text-left truncate">Profile</span>
              </>
            )}
            <svg className="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showProfileMenu && (
            <div className="absolute left-3 right-3 bottom-full mb-1 bg-card border border-border rounded-lg shadow-lg py-1 z-50">
              {currentUser && !isAnonymous ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile
                  </Link>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      handleSignOut();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
              </button>
                </>
              ) : (
                <Link
                  to="/signin"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Sign In
                </Link>
              )}
          </div>
          )}
        </div>

        <div className="p-4 border-t border-border/50 bg-white backdrop-blur-sm space-y-2">
           {isAnonymous && (
             <Link to="/signin">
               <Button variant="outline" className="w-full text-xs h-9 font-sans gap-2">
                 Sign In
               </Button>
             </Link>
           )}
           <Link to="/link-gpt">
             <Button variant="outline" className="w-full text-xs h-9 bg-gradient-to-br from-indigo-50/50 to-blue-50/50 hover:from-indigo-100 hover:to-blue-100 border-indigo-200/50 hover:border-indigo-300 text-indigo-700 font-sans gap-2 transition-all">
               <IconSparkles className="w-3.5 h-3.5 text-indigo-500" />
               Connect ChatGPT
             </Button>
           </Link>
        </div>
      </motion.aside>

      {/* --- Main Content --- */}
      <main className="flex-1 flex flex-col h-full min-w-0 bg-background relative">
        
        {/* Header */}
        <header className="h-14 min-h-[56px] border-b border-border/50 flex items-center justify-between px-6 bg-background/80 backdrop-blur sticky top-0 z-10 transition-all">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-sans">
               <span>Library</span>
               <IconChevronRight className="w-3.5 h-3.5 opacity-50" />
               <span className="font-medium text-foreground truncate font-display">
                {selectedFolderId === FOLDER_ID_ARCHIVE 
                    ? 'Archive' 
                    : (selectedFolderId ? folders.find(f => f.id === selectedFolderId)?.name : 'All Items')}
               </span>
               {selectedBookmarkIds.size > 0 && (
                 <>
                   <span className="text-muted-foreground/50 mx-1">•</span>
                   <button 
                      onClick={handleSelectAll}
                      className="text-xs font-medium text-brand-blue hover:underline"
                   >
                      {selectedBookmarkIds.size === filteredBookmarks.length ? 'Deselect All' : 'Select All'}
                   </button>
                 </>
               )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-56 pl-9 pr-3 py-1.5 bg-secondary/50 border border-transparent hover:border-border focus:bg-background focus:border-zinc-300 rounded-lg text-sm outline-none transition-all placeholder:text-muted-foreground font-sans"
              />
            </div>

            <div className="h-5 w-px bg-border mx-1"></div>

            <div className="flex items-center bg-secondary/50 rounded-lg p-0.5 border border-border/50">
              <button 
                onClick={() => setViewMode(ViewMode.GRID)} 
                className={cn(
                  "p-1.5 rounded-md transition-all",
                  viewMode === ViewMode.GRID ? "bg-background text-foreground shadow-none border border-border/50" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <IconGrid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode(ViewMode.LIST)} 
                className={cn(
                  "p-1.5 rounded-md transition-all",
                  viewMode === ViewMode.LIST ? "bg-background text-foreground shadow-none border border-border/50" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <IconList className="w-4 h-4" />
              </button>
            </div>

            <Button 
              onClick={openCreateModal}
              className="ml-2 gap-2 h-8 font-sans"
            >
              <IconPlus className="w-4 h-4" />
              <span className="hidden sm:inline">New</span>
            </Button>

            {/* User Menu */}
            {currentUser && !isAnonymous && (
              <div className="relative ml-2" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'User'}
                      className="w-7 h-7 rounded-full"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold">
                      {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-lg shadow-lg py-1 z-50">
                    <Link
                      to="/profile"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Profile
                    </Link>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        handleSignOut();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-background custom-scrollbar pb-32">
          {filteredBookmarks.length === 0 ? (
              <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center h-[60vh] text-center"
              >
              <div className="w-20 h-20 bg-secondary rounded-2xl flex items-center justify-center mb-6 text-muted-foreground border border-border">
                  {selectedFolderId === FOLDER_ID_ARCHIVE ? (
                      <IconArchive className="w-10 h-10 opacity-50" />
                  ) : (
                      <IconFolder className="w-10 h-10 opacity-50" />
                  )}
              </div>
              <h3 className="text-lg font-semibold text-foreground font-display">
                {selectedFolderId === FOLDER_ID_ARCHIVE ? "Archive is empty" : "No items found"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs mt-2 mb-6 font-sans">
                  {selectedFolderId === FOLDER_ID_ARCHIVE ? "Archived items will appear here." : "Adjust filters or create a new item to get started."}
              </p>
              {selectedFolderId !== FOLDER_ID_ARCHIVE && (
                  <Button onClick={openCreateModal} variant="outline" className="font-sans">
                      Create Item
                  </Button>
              )}
              </motion.div>
          ) : (
              <motion.div 
                layout
                className={cn(
                  "w-full",
                  viewMode === ViewMode.GRID 
                      ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" 
                      : "flex flex-col border border-border rounded-xl overflow-hidden bg-card"
                )}
              >
              {filteredBookmarks.map(bookmark => (
                  <BookmarkCard 
                    key={bookmark.id} 
                    bookmark={bookmark} 
                    allTags={tags}
                    onDelete={handleDeleteBookmark}
                    onEdit={openEditModal}
                    onArchive={handleArchiveBookmark}
                    viewMode={viewMode}
                    isSelected={selectedBookmarkIds.has(bookmark.id)}
                    onToggleSelect={handleToggleSelect}
                  />
              ))}
              </motion.div>
          )}
        </div>

        {/* Bulk Action Bar */}
        <AnimatePresence>
          {selectedBookmarkIds.size > 0 && (
            <motion.div 
              initial={{ y: 100, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
              className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50"
            >
              <div className="flex items-center p-1.5 pl-2 gap-1 bg-[#1A1A1A] text-white rounded-full shadow-2xl border border-white/10 ring-1 ring-black/5">
                 
                 {/* Counter */}
                 <div className="flex items-center gap-2 pl-2 pr-3 border-r border-white/10">
                   <div className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-white text-black text-[10px] font-bold rounded-full font-mono">
                      {selectedBookmarkIds.size}
                   </div>
                   <span className="text-xs font-medium text-zinc-400">Selected</span>
                 </div>

                 {/* Actions */}
                 <div className="flex items-center gap-1 pl-1">
                   <button 
                      onClick={() => setSelectedBookmarkIds(new Set())}
                      className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                   >
                     Cancel
                   </button>
                   
                   <button
                      onClick={handleBulkDelete}
                      className="group flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-full transition-all text-xs font-medium border border-red-500/20 hover:border-red-500"
                   >
                      <IconTrash className="w-3.5 h-3.5 group-hover:text-white transition-colors" />
                      Delete
                   </button>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      <BookmarkModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveBookmark}
        onDelete={handleModalDelete}
        initialData={editingBookmark}
        folders={folders}
        tags={tags}
      />

      <FolderModal
        isOpen={isFolderModalOpen}
        onClose={() => {
          setIsFolderModalOpen(false);
          setEditingFolder(undefined);
          setSubfolderParentId(null);
        }}
        onSave={handleSaveFolder}
        onDelete={handleDeleteFolder}
        initialData={editingFolder}
        initialParentId={subfolderParentId}
        folders={folders}
      />

      {contextMenuFolder && contextMenuPosition && (
        <FolderContextMenu
          folder={contextMenuFolder}
          position={contextMenuPosition}
          onClose={() => {
            setContextMenuFolder(null);
            setContextMenuPosition(null);
          }}
          onEdit={handleEditFolder}
          onDelete={handleDeleteFolder}
          onCreateSubfolder={handleCreateSubfolder}
        />
      )}

      {editingTag && (
        <TagModal
          isOpen={isTagModalOpen}
          onClose={() => {
            setIsTagModalOpen(false);
            setEditingTag(undefined);
          }}
          onSave={handleSaveTag}
          onDelete={handleDeleteTag}
          initialData={editingTag}
          usageCount={getTagUsageCount(editingTag.id)}
          allTags={tags}
        />
      )}

      {contextMenuTag && tagContextMenuPosition && (
        <TagContextMenu
          tag={contextMenuTag}
          position={tagContextMenuPosition}
          onClose={() => {
            setContextMenuTag(null);
            setTagContextMenuPosition(null);
          }}
          onEdit={handleEditTag}
          onDelete={handleDeleteTag}
          onMerge={handleMergeTag}
        />
      )}

      {isTagMergeModalOpen && mergeSourceTag && (
        <TagMergeModal
          isOpen={isTagMergeModalOpen}
          onClose={() => {
            setIsTagMergeModalOpen(false);
            setMergeSourceTag(null);
          }}
          onMerge={handleMergeTags}
          sourceTag={mergeSourceTag}
          allTags={tags}
          bookmarks={bookmarks}
        />
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};

// --- Link Account Page ---
const LinkAccountPage: React.FC = () => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next
    if (value && index < 5) {
      document.getElementById(`code-${index + 1}`)?.focus();
    }
  };

  const handleVerify = () => {
    setStatus('LOADING');
    // Simulate API Call
    setTimeout(() => {
      setStatus('SUCCESS');
    }, 1500);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText("sk_live_51M3v8_fake_key_for_demo");
    // Could add toast notification here
  };

  // Auto-submit when code is full
  useEffect(() => {
    if (code.every(d => d !== '') && status === 'IDLE') {
        handleVerify();
    }
  }, [code, status]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
        {/* Abstract Background Element */}
        <div className="absolute inset-0 bg-grid-slate-50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
        
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-[420px] w-full bg-card p-8 rounded-3xl border border-border shadow-2xl shadow-black/5"
        >
        <div className="text-center mb-8">
          <LogoIcon className="w-14 h-14 mb-5 mx-auto rounded-2xl shadow-sm" />
          <h1 className="text-2xl font-bold text-foreground tracking-tight font-display mb-2">Connect Pely GPT</h1>
          <p className="text-muted-foreground text-sm font-sans px-4 leading-relaxed">
            Sync your ChatGPT conversations with your Pely AI knowledge base.
          </p>
        </div>

        {status === 'SUCCESS' ? (
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <div className="w-12 h-12 bg-green-100 text-green-700 rounded-full mx-auto flex items-center justify-center mb-4">
              <IconCheck className="w-6 h-6" strokeWidth={3} />
            </div>
            <h3 className="text-lg font-semibold text-foreground font-display mb-1">Account Connected</h3>
            <p className="text-muted-foreground text-xs mb-6 font-sans">
              Your API key has been generated. Use this key to authenticate the Pely GPT.
            </p>
            
            <div className="bg-secondary/40 p-3 rounded-xl border border-border/50 mb-6 flex items-center gap-2 group hover:bg-secondary/60 transition-colors">
              <code className="flex-1 font-mono text-xs text-foreground truncate text-left ml-1">
                sk_live_51M3v8_fake_key...
              </code>
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" 
                onClick={handleCopy}
                title="Copy to clipboard"
              >
                <IconCopy className="w-3.5 h-3.5" />
              </Button>
            </div>

            <div className="space-y-3">
                <Link to="/">
                    <Button className="w-full h-10 font-medium" size="lg">Return to Library</Button>
                </Link>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-8">
            <div className="space-y-4">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-center mb-4">
                    Enter 6-digit code
                </div>
                <div className="flex justify-center gap-2.5">
                {code.map((digit, idx) => (
                    <input
                    key={idx}
                    id={`code-${idx}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(idx, e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !digit && idx > 0) {
                            document.getElementById(`code-${idx - 1}`)?.focus();
                        }
                    }}
                    disabled={status === 'LOADING'}
                    className="w-11 h-14 border border-input rounded-xl text-center text-xl font-semibold focus:border-brand-blue/50 focus:ring-4 focus:ring-brand-blue/10 outline-none transition-all bg-background text-foreground font-mono disabled:opacity-50"
                    placeholder="•"
                    />
                ))}
                </div>
            </div>
            
            <div className="bg-secondary/30 rounded-xl p-4 border border-border/40 space-y-3">
                <h4 className="text-xs font-semibold text-foreground font-display">How to get a code:</h4>
                <ol className="text-xs text-muted-foreground space-y-2 list-decimal list-inside font-sans">
                    <li>Open <strong>ChatGPT</strong> and select Pely GPT.</li>
                    <li>Type <span className="font-mono bg-secondary px-1 py-0.5 rounded text-foreground">/connect</span> or ask for a code.</li>
                    <li>Enter the 6-digit code displayed above.</li>
                </ol>
            </div>

            <div className="text-center">
                 <Link to="/" className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors">
                    Cancel and return
                 </Link>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

// --- Main App Component ---
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Toaster position="top-center" richColors />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/link-gpt" element={<LinkAccountPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
