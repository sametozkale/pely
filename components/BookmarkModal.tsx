
import React, { useState, useEffect } from 'react';
import { Bookmark, BookmarkType, Folder, Tag } from '../types';
import { IconSparkles, IconFolder, IconHash, IconX, IconTrash, IconCheck } from './Icons';
import { analyzeUrlWithGemini } from '../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Input, Label, Textarea } from './ui';
import { cn } from '../lib/utils';
import { Link, Image, AlignLeft } from 'lucide-react';

interface BookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bookmark: Omit<Bookmark, 'id' | 'createdAt'>, tagsToCreate?: Omit<Tag, 'id'>[]) => void;
  onDelete?: (id: string) => void;
  initialData?: Bookmark;
  folders: Folder[];
  tags: Tag[];
}

const BookmarkModal: React.FC<BookmarkModalProps> = ({ isOpen, onClose, onSave, onDelete, initialData, folders, tags }) => {
  const [type, setType] = useState<BookmarkType>('LINK');
  const [url, setUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [folderId, setFolderId] = useState<string>('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setUrl(initialData.url);
      setImageUrl(initialData.imageUrl || '');
      setTitle(initialData.title);
      setDescription(initialData.description);
      setFolderId(initialData.folderId || '');
      setSelectedTagIds(initialData.tags);
    } else {
      resetForm();
    }
    setShowDeleteConfirm(false);
  }, [initialData, isOpen]);

  const resetForm = () => {
    setType('LINK');
    setUrl('');
    setImageUrl('');
    setTitle('');
    setDescription('');
    setFolderId('');
    setSelectedTagIds([]);
  };

  const handleSmartAnalyze = async () => {
    if (!url) return;
    setIsAnalyzing(true);
    const result = await analyzeUrlWithGemini(url);
    if (result) {
      setTitle(result.title);
      setDescription(result.description);
      // Auto-tagging: select matching existing tags
      const matchingTags = tags.filter(t =>
        result.suggestedTags.some(suggested => suggested.toLowerCase() === t.name.toLowerCase())
      );
      setSelectedTagIds(prev =>
        [...Array.from(new Set([...prev, ...matchingTags.map(t => t.id)]))]
      );
    }
    setIsAnalyzing(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Prepare tags to create from any new tag name that isn't empty and doesn't already exist
    const trimmedNewTag = newTagName.trim();
    const tagsToCreate: Omit<Tag, 'id'>[] = [];
    let updatedSelectedTagIds = [...selectedTagIds];

    if (trimmedNewTag) {
      const existing = tags.find(t => t.name.toLowerCase() === trimmedNewTag.toLowerCase());
      if (existing) {
        if (!updatedSelectedTagIds.includes(existing.id)) {
          updatedSelectedTagIds.push(existing.id);
        }
      } else {
        // Color heuristic: reuse first tag color or default
        const fallbackColor = tags[0]?.color || '#3B82F6';
        tagsToCreate.push({
          name: trimmedNewTag,
          color: fallbackColor,
        });
      }
    }

    onSave({
      url,
      imageUrl: imageUrl || undefined,
      title,
      description,
      folderId: folderId || null,
      tags: updatedSelectedTagIds,
      type
    }, tagsToCreate.length ? tagsToCreate : undefined);
    onClose();
  };

  const toggleTag = (id: string) => {
    setSelectedTagIds(prev => 
      prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
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
            transition={{ type: "spring", duration: 0.4, bounce: 0.3 }}
            className="z-50 w-full max-w-[520px] rounded-2xl border border-border bg-card shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/50 px-6 py-4 bg-background/50 backdrop-blur shrink-0">
              <h2 className="text-lg font-semibold tracking-tight font-display text-foreground">
                {initialData ? 'Edit bookmark' : 'Add bookmark'}
              </h2>
              <button 
                onClick={onClose} 
                className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-secondary"
              >
                <IconX className="w-4 h-4" />
              </button>
            </div>

            <form id="bookmark-form" onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
                <div className="overflow-y-auto custom-scrollbar p-6 space-y-6">
                    
                    {/* Type Switcher */}
                    <div className="grid grid-cols-3 gap-1 p-1 bg-secondary/50 rounded-xl border border-border/50">
                        {(['LINK', 'IMAGE', 'NOTE'] as const).map((t) => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setType(t)}
                                className={cn(
                                    "flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-[10px] transition-all duration-200 select-none",
                                    type === t
                                    ? "bg-background text-foreground shadow-sm border border-border/10"
                                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                                )}
                            >
                                {t === 'LINK' && <Link className="w-3.5 h-3.5" />}
                                {t === 'IMAGE' && <Image className="w-3.5 h-3.5" />}
                                {t === 'NOTE' && <AlignLeft className="w-3.5 h-3.5" />}
                                {t.charAt(0) + t.slice(1).toLowerCase()}
                            </button>
                        ))}
                    </div>

                    {/* Main Inputs */}
                    <div className="space-y-4">
                        {/* URL Fields */}
                        {(type === 'LINK' || type === 'IMAGE') && (
                            <div className="space-y-1.5">
                                <Label className="flex justify-between">
                                    {type === 'IMAGE' ? 'Target Link (Optional)' : 'Page URL'}
                                    {type === 'LINK' && !initialData && (
                                        <span className="text-[10px] text-muted-foreground font-normal">
                                            AI-powered analysis available
                                        </span>
                                    )}
                                </Label>
                                <div className="relative group">
                                    <Input
                                        type="url"
                                        required={type === 'LINK'}
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        placeholder="https://example.com"
                                        className={cn("pr-24 font-sans transition-all", type === 'LINK' && !initialData && "pr-[90px]")}
                                        autoFocus={!initialData && type === 'LINK'}
                                    />
                                    {type === 'LINK' && !initialData && (
                                        <div className="absolute right-1 top-1 bottom-1">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="secondary"
                                                onClick={handleSmartAnalyze}
                                                disabled={!url || isAnalyzing}
                                                className="h-full px-3 text-xs gap-1.5 font-medium border-l border-border/50 rounded-r-md rounded-l-none bg-secondary/30 hover:bg-secondary"
                                            >
                                                {isAnalyzing ? (
                                                    <span className="animate-spin text-primary">⟳</span>
                                                ) : (
                                                    <>
                                                        <IconSparkles className="w-3 h-3 text-violet-500" />
                                                        <span>Fill</span>
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {type === 'IMAGE' && (
                            <div className="space-y-1.5">
                                <Label>Image Source URL</Label>
                                <Input
                                    type="url"
                                    required
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                    placeholder="https://example.com/image.png"
                                    className="font-sans"
                                    autoFocus={!initialData}
                                />
                                {imageUrl && (
                                    <div className="mt-2 h-32 w-full rounded-lg border border-border bg-secondary/10 flex items-center justify-center overflow-hidden relative">
                                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                                        <img src={imageUrl} alt="Preview" className="h-full w-full object-contain relative z-10" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Title & Description */}
                        <div className="space-y-1.5">
                            <Label>{type === 'NOTE' ? 'Title' : 'Title'}</Label>
                            <Input
                                type="text"
                                required={type === 'NOTE'}
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder={type === 'NOTE' ? "e.g., Project Ideas" : "e.g., My Awesome Bookmark"}
                                className="font-sans font-medium"
                                autoFocus={!initialData && type === 'NOTE'}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label>{type === 'NOTE' ? 'Content' : 'Description'}</Label>
                            <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={type === 'NOTE' ? 8 : 3}
                                placeholder={type === 'NOTE' ? "Type your note here..." : "Add a short description..."}
                                className="font-sans leading-relaxed"
                            />
                        </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 gap-5 pt-2">
                        {/* Folder Select */}
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2 mb-1">
                                <IconFolder className="w-3.5 h-3.5 text-muted-foreground" />
                                <Label className="mb-0 text-foreground">Folder</Label>
                            </div>
                            <div className="relative">
                                <select
                                    value={folderId}
                                    onChange={(e) => setFolderId(e.target.value)}
                                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:border-foreground disabled:cursor-not-allowed disabled:opacity-50 appearance-none font-sans cursor-pointer hover:border-zinc-300"
                                >
                                    <option value="">No Folder</option>
                                    {folders.map(f => (
                                        <option key={f.id} value={f.id}>
                                            {f.level > 0 ? '\u00A0\u00A0'.repeat(f.level) + '↳ ' : ''}{f.name}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Tags */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    <IconHash className="w-3.5 h-3.5 text-muted-foreground" />
                                    <Label className="mb-0 text-foreground">Tags</Label>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex flex-wrap gap-2 p-3 border border-input rounded-xl bg-background/50 max-h-[120px] overflow-y-auto custom-scrollbar">
                                    {tags.map(tag => {
                                        const isSelected = selectedTagIds.includes(tag.id);
                                        return (
                                            <button
                                                key={tag.id}
                                                type="button"
                                                onClick={() => toggleTag(tag.id)}
                                                className={cn(
                                                    "group flex items-center justify-center gap-1.5 px-2.5 py-2.5 rounded-full text-xs font-medium transition-all duration-200 border",
                                                    isSelected 
                                                        ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                                                        : "bg-background text-muted-foreground border-border hover:border-zinc-300 hover:text-foreground"
                                                )}
                                            >
                                                <span 
                                                    className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", isSelected ? "bg-white/80" : "bg-zinc-400 group-hover:bg-zinc-500")}
                                                    style={!isSelected ? { backgroundColor: tag.color } : {}}
                                                />
                                                <span className="flex items-center leading-none">{tag.name}</span>
                                                {isSelected && <IconCheck className="w-3 h-3 ml-0.5 flex-shrink-0" strokeWidth={3} />}
                                            </button>
                                        );
                                    })}
                                    {tags.length === 0 && (
                                        <span className="text-[11px] text-muted-foreground">
                                            Henüz tag yok, aşağıdan yeni bir tane ekleyebilirsin.
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="text"
                                        value={newTagName}
                                        onChange={(e) => setNewTagName(e.target.value)}
                                        placeholder="Create a new tag (ex. Research)"
                                        className="h-8 text-xs font-sans"
                                    />
                                </div>
                            </div>
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
                                            onClick={(e) => { e.stopPropagation(); onDelete(initialData.id); onClose(); }}
                                            className="h-7 px-3 text-xs bg-red-500 hover:bg-red-600"
                                        >
                                            Confirm
                                        </Button>
                                        <button 
                                            type="button" 
                                            onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }}
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
                                            onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
                                            title="Delete Bookmark"
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
                        <Button type="submit" form="bookmark-form" className="px-6">
                            {initialData ? 'Update' : 'Save'}
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

export default BookmarkModal;
