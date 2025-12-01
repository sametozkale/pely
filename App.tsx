
import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Bookmark, Folder, Tag, ViewMode } from './types';
import { MOCK_BOOKMARKS, MOCK_FOLDERS, MOCK_TAGS } from './constants';
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
  IconSidebar,
  IconArchive,
  IconSparkles,
  IconCopy
} from './components/Icons';
import BookmarkCard from './components/BookmarkCard';
import BookmarkModal from './components/BookmarkModal';
import { Button, Input } from './components/ui';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from './lib/utils';

// --- Pely AI Logo Component ---
const LogoIcon = ({ className = "w-6 h-6", rounded = "rounded-lg" }: { className?: string, rounded?: string }) => (
  <div className={cn("bg-brand-blue flex items-center justify-center shrink-0 text-white font-display font-bold", rounded, className)}>
    {/* Simple 'P' logo representation */}
    <span className="text-[60%]">P</span>
  </div>
);

const FOLDER_ID_ARCHIVE = 'ARCHIVE';

// --- Dashboard Component ---
const Dashboard: React.FC = () => {
  // --- State ---
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(MOCK_BOOKMARKS);
  const [folders, setFolders] = useState<Folder[]>(MOCK_FOLDERS);
  const [tags, setTags] = useState<Tag[]>(MOCK_TAGS);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.GRID);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Default open on desktop
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | undefined>(undefined);
  
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
    if (window.confirm('Are you sure you want to delete this bookmark?')) {
      setBookmarks(prev => prev.filter(b => b.id !== id));
      setSelectedBookmarkIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
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
    setSelectedBookmarkIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setIsModalOpen(false);
  }

  const handleSaveBookmark = (data: Omit<Bookmark, 'id' | 'createdAt'>) => {
    if (editingBookmark) {
      // Update
      setBookmarks(prev => prev.map(b => b.id === editingBookmark.id ? { ...b, ...data } : b));
    } else {
      // Create
      const newBookmark: Bookmark = {
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        ...data
      };
      setBookmarks(prev => [newBookmark, ...prev]);
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
    if (window.confirm(`Are you sure you want to delete ${selectedBookmarkIds.size} items?`)) {
      setBookmarks(prev => prev.filter(b => !selectedBookmarkIds.has(b.id)));
      setSelectedBookmarkIds(new Set());
    }
  };

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
        className="bg-sidebar border-r border-border flex flex-col overflow-hidden whitespace-nowrap h-full z-20"
      >
        {/* User / App Title */}
        <div className="h-14 min-h-[56px] flex items-center px-4 border-b border-border/50">
           <div className="flex items-center gap-3">
             <LogoIcon className="w-6 h-6" />
             <span className="font-bold text-foreground text-lg tracking-tight font-display">Pely AI</span>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-3 custom-scrollbar space-y-8">
          
          {/* Folders Section */}
          <div className="space-y-1">
            <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-3 font-display">Library</h3>
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
              All Items
            </button>
            {folders.map(folder => (
              <button
                key={folder.id}
                onClick={() => setSelectedFolderId(folder.id === selectedFolderId ? null : folder.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 group font-sans",
                  selectedFolderId === folder.id 
                     ? "bg-secondary text-foreground font-medium" 
                     : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                )}
                style={{ paddingLeft: `${(folder.level * 12) + 12}px` }}
              >
                <IconFolder className="w-4 h-4 opacity-80" />
                {folder.name}
              </button>
            ))}
             
             {/* Archive Section */}
             <div className="pt-2 mt-2 border-t border-border/50">
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
          </div>

          {/* Tags Section */}
          <div className="space-y-1">
            <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-3 font-display">Tags</h3>
            {tags.map(tag => (
              <button
                key={tag.id}
                onClick={() => setSelectedTagId(tag.id === selectedTagId ? null : tag.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 font-sans",
                  selectedTagId === tag.id 
                    ? "bg-secondary text-foreground font-medium" 
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                )}
              >
                <IconHash className="w-4 h-4 opacity-70" />
                {tag.name}
                <span className="w-2 h-2 rounded-full ml-auto opacity-80" style={{ backgroundColor: tag.color }} />
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-border/50 bg-sidebar/50 backdrop-blur-sm">
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
        <header className="h-14 min-h-[56px] border-b border-border flex items-center justify-between px-6 bg-background/80 backdrop-blur sticky top-0 z-10 transition-all">
          <div className="flex items-center gap-3 overflow-hidden">
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="h-8 w-8 text-muted-foreground">
              <IconSidebar className="w-4 h-4" />
            </Button>
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
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-background custom-scrollbar pb-32">
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
    <HashRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/link-gpt" element={<LinkAccountPage />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
