import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { Bookmark, Folder, Tag } from "../types";
import { getDb, getCurrentUser } from "../firebaseClient";

const userCollectionPath = (uid: string, sub: "folders" | "tags" | "bookmarks") =>
  `users/${uid}/${sub}`;

export const loadUserLibrary = async (): Promise<{
  bookmarks: Bookmark[];
  folders: Folder[];
  tags: Tag[];
}> => {
  const user = getCurrentUser();
  if (!user) {
    throw new Error("User not authenticated");
  }
  const db = getDb();

  const [foldersSnap, tagsSnap, bookmarksSnap] = await Promise.all([
    getDocs(collection(db, userCollectionPath(user.uid, "folders"))),
    getDocs(collection(db, userCollectionPath(user.uid, "tags"))),
    getDocs(collection(db, userCollectionPath(user.uid, "bookmarks"))),
  ]);

  const folders: Folder[] = foldersSnap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Folder, "id">),
  }));

  const tags: Tag[] = tagsSnap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Tag, "id">),
  }));

  const bookmarks: Bookmark[] = bookmarksSnap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Bookmark, "id">),
  }));

  return { bookmarks, folders, tags };
};

export const saveBookmark = async (bookmark: Bookmark) => {
  const user = getCurrentUser();
  if (!user) throw new Error("User not authenticated");
  const db = getDb();
  const ref = doc(db, userCollectionPath(user.uid, "bookmarks"), bookmark.id);
  await setDoc(ref, {
    ...bookmark,
    updatedAt: serverTimestamp(),
  });
};

export const deleteBookmark = async (id: string) => {
  const user = getCurrentUser();
  if (!user) throw new Error("User not authenticated");
  const db = getDb();
  const ref = doc(db, userCollectionPath(user.uid, "bookmarks"), id);
  await deleteDoc(ref);
};

export const updateBookmarkPartial = async (
  id: string,
  patch: Partial<Bookmark>
) => {
  const user = getCurrentUser();
  if (!user) throw new Error("User not authenticated");
  const db = getDb();
  const ref = doc(db, userCollectionPath(user.uid, "bookmarks"), id);
  await updateDoc(ref, {
    ...patch,
    updatedAt: serverTimestamp(),
  });
};

export const saveTagsIfMissing = async (tagsToCreate: Tag[]) => {
  if (!tagsToCreate.length) return;
  const user = getCurrentUser();
  if (!user) throw new Error("User not authenticated");
  const db = getDb();

  await Promise.all(
    tagsToCreate.map((tag) => {
      const ref = doc(db, userCollectionPath(user.uid, "tags"), tag.id);
      return setDoc(ref, tag);
    })
  );
};

export const saveFolder = async (folder: Folder) => {
  const user = getCurrentUser();
  if (!user) throw new Error("User not authenticated");
  const db = getDb();
  const ref = doc(db, userCollectionPath(user.uid, "folders"), folder.id);
  await setDoc(ref, {
    ...folder,
    updatedAt: serverTimestamp(),
  });
};

export const deleteFolder = async (id: string) => {
  const user = getCurrentUser();
  if (!user) throw new Error("User not authenticated");
  const db = getDb();
  const ref = doc(db, userCollectionPath(user.uid, "folders"), id);
  await deleteDoc(ref);
};

export const updateFolderPartial = async (
  id: string,
  patch: Partial<Folder>
) => {
  const user = getCurrentUser();
  if (!user) throw new Error("User not authenticated");
  const db = getDb();
  const ref = doc(db, userCollectionPath(user.uid, "folders"), id);
  await updateDoc(ref, {
    ...patch,
    updatedAt: serverTimestamp(),
  });
};

export const moveFolder = async (id: string, newParentId: string | null) => {
  const user = getCurrentUser();
  if (!user) throw new Error("User not authenticated");
  const db = getDb();
  const ref = doc(db, userCollectionPath(user.uid, "folders"), id);
  
  // Update parentId - level will be recalculated on client side
  await updateDoc(ref, {
    parentId: newParentId,
    updatedAt: serverTimestamp(),
  });
};

export const updateTag = async (id: string, patch: Partial<Tag>) => {
  const user = getCurrentUser();
  if (!user) throw new Error("User not authenticated");
  const db = getDb();
  const ref = doc(db, userCollectionPath(user.uid, "tags"), id);
  await updateDoc(ref, {
    ...patch,
    updatedAt: serverTimestamp(),
  });
};

export const deleteTag = async (id: string) => {
  const user = getCurrentUser();
  if (!user) throw new Error("User not authenticated");
  const db = getDb();
  const ref = doc(db, userCollectionPath(user.uid, "tags"), id);
  await deleteDoc(ref);
};

export const mergeTags = async (sourceTagId: string, targetTagId: string) => {
  const user = getCurrentUser();
  if (!user) throw new Error("User not authenticated");
  const db = getDb();
  
  // Get all bookmarks that use the source tag
  const bookmarksSnap = await getDocs(collection(db, userCollectionPath(user.uid, "bookmarks")));
  const bookmarksToUpdate = bookmarksSnap.docs
    .map(d => ({ id: d.id, ...d.data() } as Bookmark))
    .filter(b => b.tags.includes(sourceTagId));
  
  // Update all bookmarks: replace sourceTagId with targetTagId (avoid duplicates)
  await Promise.all(
    bookmarksToUpdate.map(async (bookmark) => {
      const hasTarget = bookmark.tags.includes(targetTagId);
      // If bookmark already has target tag, just remove source tag
      // Otherwise, replace source tag with target tag
      const updatedTags = hasTarget
        ? bookmark.tags.filter(tid => tid !== sourceTagId)
        : bookmark.tags.map(tid => tid === sourceTagId ? targetTagId : tid);
      
      const ref = doc(db, userCollectionPath(user.uid, "bookmarks"), bookmark.id);
      await updateDoc(ref, {
        tags: updatedTags,
        updatedAt: serverTimestamp(),
      });
    })
  );
  
  // Delete the source tag
  const sourceTagRef = doc(db, userCollectionPath(user.uid, "tags"), sourceTagId);
  await deleteDoc(sourceTagRef);
};

export const removeTagFromAllBookmarks = async (tagId: string) => {
  const user = getCurrentUser();
  if (!user) throw new Error("User not authenticated");
  const db = getDb();
  
  // Get all bookmarks that use this tag
  const bookmarksSnap = await getDocs(collection(db, userCollectionPath(user.uid, "bookmarks")));
  const bookmarksToUpdate = bookmarksSnap.docs
    .map(d => ({ id: d.id, ...d.data() } as Bookmark))
    .filter(b => b.tags.includes(tagId));
  
  // Remove tag from all bookmarks
  await Promise.all(
    bookmarksToUpdate.map(async (bookmark) => {
      const updatedTags = bookmark.tags.filter(tid => tid !== tagId);
      const ref = doc(db, userCollectionPath(user.uid, "bookmarks"), bookmark.id);
      await updateDoc(ref, {
        tags: updatedTags,
        updatedAt: serverTimestamp(),
      });
    })
  );
};


