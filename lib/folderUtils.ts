import { Folder } from "../types";

/**
 * Calculate folder levels based on parentId relationships
 */
export const calculateFolderLevels = (folders: Folder[]): Folder[] => {
  const folderMap = new Map<string, Folder>();
  folders.forEach(f => folderMap.set(f.id, { ...f }));

  const calculateLevel = (folderId: string, visited: Set<string> = new Set()): number => {
    if (visited.has(folderId)) {
      // Circular reference detected, break it
      return 0;
    }
    visited.add(folderId);
    
    const folder = folderMap.get(folderId);
    if (!folder || !folder.parentId) {
      return 0;
    }
    
    return 1 + calculateLevel(folder.parentId, visited);
  };

  return folders.map(folder => ({
    ...folder,
    level: calculateLevel(folder.id)
  }));
};

/**
 * Build folder tree structure
 */
export interface FolderTreeNode extends Folder {
  children: FolderTreeNode[];
}

export const buildFolderTree = (folders: Folder[]): FolderTreeNode[] => {
  const folderMap = new Map<string, FolderTreeNode>();
  const rootFolders: FolderTreeNode[] = [];

  // Initialize all folders as tree nodes
  folders.forEach(folder => {
    folderMap.set(folder.id, { ...folder, children: [] });
  });

  // Build tree structure
  folders.forEach(folder => {
    const node = folderMap.get(folder.id)!;
    if (folder.parentId && folderMap.has(folder.parentId)) {
      const parent = folderMap.get(folder.parentId)!;
      parent.children.push(node);
    } else {
      rootFolders.push(node);
    }
  });

  // Sort by order if available, otherwise by name
  const sortFolders = (nodes: FolderTreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      return a.name.localeCompare(b.name);
    });
    nodes.forEach(node => {
      if (node.children.length > 0) {
        sortFolders(node.children);
      }
    });
  };

  sortFolders(rootFolders);
  return rootFolders;
};

/**
 * Flatten folder tree back to array
 */
export const flattenFolderTree = (tree: FolderTreeNode[]): Folder[] => {
  const result: Folder[] = [];
  
  const traverse = (nodes: FolderTreeNode[]) => {
    nodes.forEach(node => {
      const { children, ...folder } = node;
      result.push(folder);
      if (children.length > 0) {
        traverse(children);
      }
    });
  };
  
  traverse(tree);
  return result;
};

/**
 * Get all child folder IDs recursively
 */
export const getAllChildFolderIds = (
  folderId: string,
  folders: Folder[]
): string[] => {
  const children = folders.filter(f => f.parentId === folderId);
  const result: string[] = [];
  
  children.forEach(child => {
    result.push(child.id);
    result.push(...getAllChildFolderIds(child.id, folders));
  });
  
  return result;
};

/**
 * Validate folder operation - prevent circular references
 */
export const validateFolderMove = (
  folderId: string,
  newParentId: string | null,
  folders: Folder[]
): { valid: boolean; error?: string } => {
  // Can't move folder to itself
  if (newParentId === folderId) {
    return { valid: false, error: "Cannot move folder into itself" };
  }

  // If moving to root, it's always valid
  if (newParentId === null) {
    return { valid: true };
  }

  // Check if newParentId is a descendant of folderId (would create circular reference)
  const allChildren = getAllChildFolderIds(folderId, folders);
  if (allChildren.includes(newParentId)) {
    return { valid: false, error: "Cannot move folder into its own descendant" };
  }

  return { valid: true };
};

/**
 * Check if folder name is unique within same parent
 */
export const isFolderNameUnique = (
  name: string,
  parentId: string | null,
  folders: Folder[],
  excludeId?: string
): boolean => {
  return !folders.some(
    f =>
      f.name.toLowerCase() === name.toLowerCase() &&
      f.parentId === parentId &&
      f.id !== excludeId
  );
};

/**
 * Get folder path as array of folder names
 */
export const getFolderPath = (
  folderId: string,
  folders: Folder[]
): string[] => {
  const path: string[] = [];
  const folderMap = new Map(folders.map(f => [f.id, f]));
  
  let currentId: string | null = folderId;
  const visited = new Set<string>();
  
  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    const folder = folderMap.get(currentId);
    if (!folder) break;
    
    path.unshift(folder.name);
    currentId = folder.parentId;
  }
  
  return path;
};

