
import React, { useState } from 'react';
import { Bookmark, Tag } from '../types';
import { IconExternalLink, IconTrash, IconEdit, IconCheck, IconArchive, IconUndo } from './Icons';
import { motion } from 'framer-motion';
import { Badge } from './ui';
import { cn } from '../lib/utils';
import { AlignLeft, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';

interface BookmarkCardProps {
  bookmark: Bookmark;
  allTags: Tag[];
  onDelete: (id: string) => void;
  onEdit: (bookmark: Bookmark) => void;
  onArchive: (id: string) => void;
  viewMode: 'GRID' | 'LIST';
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
}

const Favicon = ({ url, title, className }: { url: string, title: string, className?: string }) => {
  const [error, setError] = useState(false);
  
  const getFaviconUrl = (urlStr: string) => {
    try {
      if (!urlStr) return '';
      const domain = new URL(urlStr).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch {
      return '';
    }
  };

  const faviconSrc = getFaviconUrl(url);

  if (error || !faviconSrc) {
    return (
       <div className={cn("flex items-center justify-center bg-secondary/50 text-muted-foreground font-display font-medium border border-border/50 rounded-lg", className)}>
         {title.substring(0, 1).toUpperCase()}
       </div>
    );
  }

  return (
    <img 
      src={faviconSrc} 
      alt="" 
      className={cn("object-contain rounded-lg border border-border/10 bg-white p-0.5", className)} 
      onError={() => setError(true)}
    />
  );
};

// Custom Checkbox Component
const Checkbox = ({ checked, onChange }: { checked: boolean; onChange: (e: React.MouseEvent) => void }) => {
  return (
    <div 
      onClick={(e) => { e.stopPropagation(); onChange(e); }}
      className={cn(
        "w-5 h-5 rounded-[6px] border flex items-center justify-center cursor-pointer transition-all duration-200 bg-background",
        checked 
          ? "bg-primary border-primary text-primary-foreground" 
          : "border-muted-foreground/30 hover:border-muted-foreground/60"
      )}
    >
      {checked && <IconCheck className="w-3.5 h-3.5" />}
    </div>
  );
};

const BookmarkCard: React.FC<BookmarkCardProps> = ({ 
  bookmark, 
  allTags, 
  onDelete, 
  onEdit,
  onArchive,
  viewMode,
  isSelected,
  onToggleSelect 
}) => {
  const bookmarkTags = bookmark.tags.map(tagId => allTags.find(t => t.id === tagId)).filter(Boolean) as Tag[];

  // Helper to extract domain for display
  const getDomain = (url: string) => {
    try {
      if (!url) return '';
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return '';
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  // Helper for delete action
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(bookmark.id);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit(bookmark);
  };

  const handleArchiveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onArchive(bookmark.id);
  };

  // Helper to render tags consistently
  const renderTags = (max = 3) => (
    <>
      {bookmarkTags.slice(0, max).map(tag => (
        <span key={tag.id} className="inline-flex items-center text-[10px] text-muted-foreground font-medium font-sans bg-secondary/50 px-1.5 py-0.5 rounded-[4px] border border-border/20 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full mr-1.5 shrink-0" style={{ backgroundColor: tag.color }}></span>
          {tag.name}
        </span>
      ))}
      {bookmarkTags.length > max && (
        <span className="inline-flex items-center text-[10px] text-muted-foreground/70 px-1.5 py-0.5 bg-secondary/30 rounded-[4px]">
          +{bookmarkTags.length - max}
        </span>
      )}
    </>
  );

  // --- List View (Refined) ---
  if (viewMode === 'LIST') {
    return (
      <motion.div 
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        layout
        className={cn(
          "group flex items-center gap-4 px-4 py-2.5 bg-background/50 hover:bg-secondary/40 border-b border-border/40 transition-colors text-sm last:border-0",
          isSelected && "bg-secondary/60"
        )}
      >
        {/* Checkbox */}
        <div className="shrink-0 flex items-center justify-center w-5 h-5">
            <Checkbox checked={isSelected} onChange={() => onToggleSelect(bookmark.id)} />
        </div>

        {/* Icon / Type */}
        <div className="shrink-0 w-6 h-6 flex items-center justify-center">
            {bookmark.type === 'IMAGE' && bookmark.imageUrl ? (
                <img src={bookmark.imageUrl} className="w-6 h-6 rounded object-cover border border-border/50 bg-secondary/50" alt="" />
            ) : bookmark.type === 'NOTE' ? (
                <div className="w-6 h-6 rounded bg-secondary text-foreground/70 flex items-center justify-center">
                    <AlignLeft className="w-3.5 h-3.5" />
                </div>
            ) : (
                <Favicon url={bookmark.url} title={bookmark.title} className="w-6 h-6 rounded" />
            )}
        </div>
        
        {/* Title & Info */}
        <div className="flex flex-col flex-1 min-w-0 mr-4">
             <div className="flex items-center gap-2">
                <span 
                    className={cn(
                        "font-medium text-foreground truncate cursor-pointer hover:text-primary transition-colors font-sans text-[13px]",
                        bookmark.isArchived && "line-through text-muted-foreground"
                    )}
                    onClick={handleEditClick}
                >
                    {bookmark.title}
                </span>
                {bookmark.isArchived && <Badge variant="secondary" className="text-[9px] h-3.5 px-1 rounded-[4px]">Archived</Badge>}
             </div>
             <span className="text-[11px] text-muted-foreground/60 truncate font-sans">
                {bookmark.type === 'LINK' 
                    ? getDomain(bookmark.url) 
                    : (bookmark.description ? bookmark.description.substring(0, 60) : (bookmark.type === 'IMAGE' ? 'Image Asset' : 'Note'))}
             </span>
        </div>

        {/* Tags */}
        <div className="hidden md:flex items-center justify-end gap-1.5 shrink-0 w-48 overflow-hidden">
            {renderTags(3)}
        </div>

        {/* Date */}
        <div className="hidden lg:block shrink-0 w-20 text-right">
             <span className="text-[11px] text-muted-foreground/40 font-mono">
                {new Date(bookmark.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
             </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-1 w-20 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
                onClick={handleArchiveClick} 
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-background border border-transparent hover:border-border/50 rounded shadow-sm transition-all cursor-pointer"
                title={bookmark.isArchived ? "Restore" : "Archive"}
            >
                {bookmark.isArchived ? <IconUndo className="w-3 h-3" /> : <IconArchive className="w-3 h-3" />}
            </button>
            <button 
                onClick={handleEditClick} 
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-background border border-transparent hover:border-border/50 rounded shadow-sm transition-all cursor-pointer"
            >
                <IconEdit className="w-3 h-3" />
            </button>
             {bookmark.url && !bookmark.isArchived && (
                <a 
                    href={bookmark.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-background border border-transparent hover:border-border/50 rounded shadow-sm transition-all"
                    onClick={(e) => e.stopPropagation()}
                >
                    <IconExternalLink className="w-3 h-3" />
                </a>
             )}
            <button 
                onClick={handleDeleteClick} 
                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-red-50 hover:border-red-100 border border-transparent rounded shadow-sm transition-all cursor-pointer"
            >
                <IconTrash className="w-3 h-3" />
            </button>
        </div>

      </motion.div>
    );
  }

  // Common Action Bar for Grid View
  const GridActionBar = () => (
    <div 
        onClick={(e) => e.stopPropagation()}
        className={cn(
            "flex items-center gap-1 p-1.5 rounded-full bg-background/80 backdrop-blur-md border border-border/50 shadow-sm transition-all duration-200 z-40",
            isSelected ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0"
        )}
    >
       <button 
           onClick={handleArchiveClick} 
           className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary/80 rounded-full transition-colors cursor-pointer"
           title={bookmark.isArchived ? "Restore" : "Archive"}
       >
           {bookmark.isArchived ? <IconUndo className="w-3.5 h-3.5" /> : <IconArchive className="w-3.5 h-3.5" />}
       </button>
       <button 
           onClick={handleEditClick} 
           className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary/80 rounded-full transition-colors cursor-pointer"
       >
           <IconEdit className="w-3.5 h-3.5" />
       </button>
       <button 
           onClick={handleDeleteClick} 
           className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-red-50 hover:border-red-100 rounded-full transition-colors cursor-pointer"
           title="Delete"
       >
           <IconTrash className="w-3.5 h-3.5" />
       </button>
       
       <div className="w-px h-3.5 bg-border/60 mx-0.5" />
       
       <Checkbox checked={isSelected} onChange={() => onToggleSelect(bookmark.id)} />
    </div>
  );

  // --- Grid View: Image Type ---
  if (bookmark.type === 'IMAGE' && bookmark.imageUrl) {
    return (
        <motion.div 
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            layout
            className={cn(
              "group relative bg-card rounded-lg border transition-all duration-200 flex flex-col h-[220px] overflow-hidden",
              isSelected ? "border-primary ring-1 ring-primary" : "border-border hover:border-zinc-300",
              bookmark.isArchived && "opacity-75 grayscale"
            )}
        >
            <div className="relative w-full h-full overflow-hidden bg-secondary/10">
                <img 
                    src={bookmark.imageUrl} 
                    alt={bookmark.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                />
                
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />

                {/* Actions & Checkbox Top Right */}
                <div className="absolute top-3 right-3 flex items-center justify-end">
                     <GridActionBar />
                </div>

                <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/60 to-transparent pt-10 pointer-events-none">
                     {bookmark.url ? (
                        <a 
                            href={bookmark.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-white hover:underline decoration-white/50 underline-offset-2 pointer-events-auto inline-block"
                            onClick={(e) => e.stopPropagation()}
                        >
                             <h3 className="font-display font-medium text-sm line-clamp-1">{bookmark.title || 'Untitled Image'}</h3>
                        </a>
                     ) : (
                        <h3 className="font-display font-medium text-sm text-white line-clamp-1">{bookmark.title || 'Untitled Image'}</h3>
                     )}
                     {bookmark.description && <p className="text-white/80 text-[10px] line-clamp-1 mt-0.5">{bookmark.description}</p>}
                </div>
            </div>
        </motion.div>
    );
  }

  // --- Grid View: Note Type ---
  if (bookmark.type === 'NOTE') {
    return (
        <motion.div 
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            layout
            className={cn(
              "group relative bg-card rounded-lg border transition-all duration-200 flex flex-col h-[220px] overflow-hidden",
              isSelected ? "border-primary ring-1 ring-primary" : "border-border hover:border-zinc-300",
              bookmark.isArchived && "opacity-75"
            )}
        >
            <div className="p-5 flex-grow flex flex-col relative">
                <div className="flex items-center justify-between mb-3">
                    {/* Icon Left */}
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-secondary text-muted-foreground rounded-md">
                            <AlignLeft className="w-3.5 h-3.5" />
                        </div>
                    </div>

                     {/* Actions & Checkbox Right */}
                    <div className="absolute top-3 right-3">
                        <GridActionBar />
                    </div>
                </div>
                <h3 className="font-display font-semibold text-foreground text-sm mb-2 line-clamp-1 pr-12">{bookmark.title}</h3>
                <div className="relative flex-1 overflow-hidden">
                    <p className="text-xs text-muted-foreground/90 line-clamp-5 leading-relaxed font-sans whitespace-pre-wrap">
                        {bookmark.description}
                    </p>
                    <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-card to-transparent pointer-events-none" />
                </div>
            </div>
             <div className="px-5 pb-4 pt-0 flex items-center justify-between">
                 <div className="flex flex-wrap gap-1.5 overflow-hidden h-5 items-center">
                   {renderTags(3)}
                 </div>
                 <span className="text-[10px] text-muted-foreground/60 font-mono">
                    {new Date(bookmark.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                 </span>
            </div>
        </motion.div>
    );
  }

  // --- Grid View: Default Link Type ---
  return (
    <motion.div 
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      layout
      className={cn(
        "group relative bg-card rounded-lg border transition-all duration-200 flex flex-col h-[220px] overflow-hidden",
        isSelected ? "border-primary ring-1 ring-primary" : "border-border hover:border-zinc-300",
        bookmark.isArchived && "opacity-75"
      )}
    >
      <div className="p-5 flex-grow flex flex-col relative z-10">
        <div className="flex justify-between items-start mb-3">
           {/* Favicon strictly on the Left */}
           <Favicon 
              url={bookmark.url} 
              title={bookmark.title} 
              className="w-9 h-9 text-sm" 
           />
          
          {/* Actions & Checkbox Top Right */}
          <div className="absolute top-3 right-3">
             <GridActionBar />
          </div>
        </div>

        <a 
            href={bookmark.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="block group-hover:text-primary transition-colors cursor-pointer"
            onClick={(e) => e.stopPropagation()}
        >
            <h3 className={cn("font-display font-semibold text-foreground text-sm leading-snug mb-1.5 line-clamp-2 pr-10", bookmark.isArchived && "line-through")}>{bookmark.title}</h3>
        </a>
        
        <p className="text-xs text-muted-foreground mb-2 truncate font-mono opacity-80">{getDomain(bookmark.url)}</p>
        
        <p className="text-xs text-muted-foreground/80 line-clamp-2 leading-relaxed mt-auto font-sans">
          {bookmark.description}
        </p>
      </div>

      <div className="px-5 pb-4 pt-0 flex items-center justify-between bg-card group-hover:bg-secondary/10 transition-colors">
        <div className="flex flex-wrap gap-1.5 overflow-hidden h-5 items-center">
           {renderTags(3)}
        </div>
        
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
             {bookmark.url && !bookmark.isArchived && (
                <a 
                    href={bookmark.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                >
                  <IconExternalLink className="w-3.5 h-3.5" />
                </a>
             )}
        </div>
      </div>
    </motion.div>
  );
};

export default BookmarkCard;
