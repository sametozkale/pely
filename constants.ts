
import { Bookmark, Folder, Tag } from "./types";

export const MOCK_TAGS: Tag[] = [
  { id: 't1', name: 'AI', color: '#EF4444' }, // Red
  { id: 't2', name: 'Dev', color: '#3B82F6' }, // Blue
  { id: 't3', name: 'Design', color: '#8B5CF6' }, // Purple
  { id: 't4', name: 'Reading', color: '#10B981' }, // Green
  { id: 't5', name: 'Productivity', color: '#F59E0B' }, // Amber
  { id: 't6', name: 'Inspiration', color: '#EC4899' }, // Pink
];

export const MOCK_FOLDERS: Folder[] = [
  { id: 'f1', name: 'Research', parentId: null, level: 0 },
  { id: 'f2', name: 'LLM Papers', parentId: 'f1', level: 1 },
  { id: 'f3', name: 'Tools', parentId: null, level: 0 },
  { id: 'f4', name: 'Frontend', parentId: 'f3', level: 1 },
  { id: 'f5', name: 'Assets', parentId: null, level: 0 },
];

export const MOCK_BOOKMARKS: Bookmark[] = [
  {
    id: 'b1',
    title: 'Attention Is All You Need',
    url: 'https://arxiv.org/abs/1706.03762',
    description: 'The seminal paper introducing the Transformer architecture.',
    folderId: 'f2',
    tags: ['t1', 't4'],
    createdAt: Date.now() - 10000000,
    type: 'LINK'
  },
  {
    id: 'b2',
    title: 'Tailwind CSS Documentation',
    url: 'https://tailwindcss.com/docs',
    description: 'Utility-first CSS framework for rapid UI development.',
    folderId: 'f4',
    tags: ['t2', 't3'],
    createdAt: Date.now() - 5000000,
    type: 'LINK'
  },
  {
    id: 'b3',
    title: 'Meeting Notes: Q1 Roadmap',
    url: '',
    description: 'Discuss integration of Gemini 2.5.\n- Priority: High\n- Deadline: End of month\n- Team: Frontend + AI',
    folderId: 'f1',
    tags: ['t5'],
    createdAt: Date.now() - 2000000,
    type: 'NOTE'
  },
  {
    id: 'b4',
    title: 'Minimalist Workspace Setup',
    url: 'https://unsplash.com/photos/minimalist-setup',
    imageUrl: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2940&q=80',
    description: 'Inspiration for the new office layout. Clean lines and natural light.',
    folderId: 'f5',
    tags: ['t3', 't6'],
    createdAt: Date.now(),
    type: 'IMAGE'
  },
  {
    id: 'b5',
    title: 'Pure CSS Shapes',
    url: '',
    imageUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    description: 'Geometric patterns for the landing page background.',
    folderId: 'f5',
    tags: ['t3'],
    createdAt: Date.now() - 100000,
    type: 'IMAGE'
  }
];

export const TAG_COLORS = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#8B5CF6', // Violet
  '#EC4899', // Pink
];
