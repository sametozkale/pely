
export interface Tag {
  id: string;
  name: string;
  color: string; // Hex code
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  level: number; // For indentation
  icon?: string; // Optional icon identifier
  color?: string; // Optional hex color code
  order?: number; // Optional order for sorting
}

export type BookmarkType = 'LINK' | 'IMAGE' | 'NOTE';

export interface Bookmark {
  id: string;
  title: string;
  url: string; // For NOTE type, this might be empty or a placeholder
  imageUrl?: string; // Optional cover image or main image
  description: string;
  folderId: string | null;
  tags: string[]; // Array of Tag IDs
  createdAt: number;
  type: BookmarkType;
  isArchived?: boolean;
  archivedAt?: number;
  snapshotHtml?: string; // Placeholder for HTML snapshot
}

export interface UserSession {
  id: string;
  email: string;
  name: string;
}

export enum ViewMode {
  GRID = 'GRID',
  LIST = 'LIST'
}
