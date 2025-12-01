import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  deleteUser,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  linkWithPopup,
  linkWithCredential,
  EmailAuthProvider,
  reauthenticateWithCredential,
  User,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import { getAuthInstance, getDb } from "../firebaseClient";
import { doc, setDoc, deleteDoc, writeBatch, getDocs, collection } from "firebase/firestore";

export interface SignUpData {
  email: string;
  password: string;
  displayName?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

// Email/Password Authentication
export const signUpWithEmail = async (data: SignUpData) => {
  const auth = getAuthInstance();
  const currentUser = auth.currentUser;
  const isAnonymous = currentUser?.isAnonymous;
  const anonymousUserId = isAnonymous ? currentUser.uid : null;

  let userCredential;

  // If user is anonymous, link the account
  if (isAnonymous && currentUser) {
    const emailCredential = EmailAuthProvider.credential(data.email, data.password);
    const linkResult = await linkWithCredential(currentUser, emailCredential);
    userCredential = { user: linkResult.user };
    
    // Migrate data if linking was successful
    if (anonymousUserId) {
      await migrateUserData(anonymousUserId, linkResult.user.uid);
    }
  } else {
    userCredential = await createUserWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );
  }

  // Update display name if provided
  if (data.displayName && userCredential.user) {
    await updateProfile(userCredential.user, {
      displayName: data.displayName,
    });
  }

  // Create user profile document
  const db = getDb();
  await setDoc(doc(db, "users", userCredential.user.uid), {
    email: userCredential.user.email,
    displayName: data.displayName || userCredential.user.displayName || "",
    createdAt: new Date().toISOString(),
    provider: "email",
  }, { merge: true });

  return userCredential.user;
};

export const signInWithEmail = async (data: SignInData) => {
  const auth = getAuthInstance();
  const currentUser = auth.currentUser;
  const isAnonymous = currentUser?.isAnonymous;
  const anonymousUserId = isAnonymous ? currentUser.uid : null;

  let userCredential;

  // If user is anonymous, link the account
  if (isAnonymous && currentUser) {
    const emailCredential = EmailAuthProvider.credential(data.email, data.password);
    const linkResult = await linkWithCredential(currentUser, emailCredential);
    userCredential = { user: linkResult.user };
    
    // Migrate data if linking was successful
    if (anonymousUserId) {
      await migrateUserData(anonymousUserId, linkResult.user.uid);
    }
  } else {
    userCredential = await signInWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );
  }

  return userCredential.user;
};

export const resetPassword = async (email: string) => {
  const auth = getAuthInstance();
  await sendPasswordResetEmail(auth, email);
};

// OAuth Authentication
export const signInWithGoogle = async () => {
  const auth = getAuthInstance();
  const currentUser = auth.currentUser;
  const isAnonymous = currentUser?.isAnonymous;
  const anonymousUserId = isAnonymous ? currentUser.uid : null;

  const provider = new GoogleAuthProvider();
  let userCredential;

  // If user is anonymous, link the account using linkWithPopup
  if (isAnonymous && currentUser) {
    try {
      const linkResult = await linkWithPopup(currentUser, provider);
      userCredential = { user: linkResult.user };
      
      // Migrate data if linking was successful
      if (anonymousUserId) {
        await migrateUserData(anonymousUserId, linkResult.user.uid);
      }
    } catch (error: any) {
      // If linking fails (e.g., account already exists), sign out anonymous and sign in normally
      if (error.code === 'auth/credential-already-in-use' || error.code === 'auth/email-already-in-use') {
        await firebaseSignOut(auth);
        userCredential = await signInWithPopup(auth, provider);
      } else {
        throw error;
      }
    }
  } else {
    userCredential = await signInWithPopup(auth, provider);
  }

  // Create or update user profile
  const db = getDb();
  const userRef = doc(db, "users", userCredential.user.uid);
  const userData = {
    email: userCredential.user.email,
    displayName: userCredential.user.displayName || "",
    photoURL: userCredential.user.photoURL || "",
    provider: "google",
    updatedAt: new Date().toISOString(),
  };

  await setDoc(userRef, userData, { merge: true });

  return userCredential.user;
};

export const signInWithGitHub = async () => {
  const auth = getAuthInstance();
  const currentUser = auth.currentUser;
  const isAnonymous = currentUser?.isAnonymous;
  const anonymousUserId = isAnonymous ? currentUser.uid : null;

  const provider = new GithubAuthProvider();
  let userCredential;

  // If user is anonymous, link the account using linkWithPopup
  if (isAnonymous && currentUser) {
    try {
      const linkResult = await linkWithPopup(currentUser, provider);
      userCredential = { user: linkResult.user };
      
      // Migrate data if linking was successful
      if (anonymousUserId) {
        await migrateUserData(anonymousUserId, linkResult.user.uid);
      }
    } catch (error: any) {
      // If linking fails (e.g., account already exists), sign out anonymous and sign in normally
      if (error.code === 'auth/credential-already-in-use' || error.code === 'auth/email-already-in-use') {
        await firebaseSignOut(auth);
        userCredential = await signInWithPopup(auth, provider);
      } else {
        throw error;
      }
    }
  } else {
    userCredential = await signInWithPopup(auth, provider);
  }

  // Create or update user profile
  const db = getDb();
  const userRef = doc(db, "users", userCredential.user.uid);
  const userData = {
    email: userCredential.user.email,
    displayName: userCredential.user.displayName || "",
    photoURL: userCredential.user.photoURL || "",
    provider: "github",
    updatedAt: new Date().toISOString(),
  };

  await setDoc(userRef, userData, { merge: true });

  return userCredential.user;
};

// Helper function to migrate user data
const migrateUserData = async (fromUserId: string, toUserId: string) => {
  const db = getDb();

  // Get all collections from source account
  const [foldersSnap, tagsSnap, bookmarksSnap] = await Promise.all([
    getDocs(collection(db, `users/${fromUserId}/folders`)),
    getDocs(collection(db, `users/${fromUserId}/tags`)),
    getDocs(collection(db, `users/${fromUserId}/bookmarks`)),
  ]);

  // Batch write to new account
  const batch = writeBatch(db);

  foldersSnap.docs.forEach((docSnap) => {
    batch.set(
      doc(db, `users/${toUserId}/folders`, docSnap.id),
      docSnap.data()
    );
  });

  tagsSnap.docs.forEach((docSnap) => {
    batch.set(doc(db, `users/${toUserId}/tags`, docSnap.id), docSnap.data());
  });

  bookmarksSnap.docs.forEach((docSnap) => {
    batch.set(
      doc(db, `users/${toUserId}/bookmarks`, docSnap.id),
      docSnap.data()
    );
  });

  await batch.commit();

  // Delete source account data
  const deleteBatch = writeBatch(db);
  foldersSnap.docs.forEach((docSnap) => {
    deleteBatch.delete(doc(db, `users/${fromUserId}/folders`, docSnap.id));
  });
  tagsSnap.docs.forEach((docSnap) => {
    deleteBatch.delete(doc(db, `users/${fromUserId}/tags`, docSnap.id));
  });
  bookmarksSnap.docs.forEach((docSnap) => {
    deleteBatch.delete(doc(db, `users/${fromUserId}/bookmarks`, docSnap.id));
  });
  await deleteBatch.commit();
};

// Sign Out
export const signOut = async () => {
  const auth = getAuthInstance();
  await firebaseSignOut(auth);
};

// Delete Account
export const deleteAccount = async (user: User) => {
  const auth = getAuthInstance();
  const db = getDb();
  const userId = user.uid;

  // Delete all user data
  const [foldersSnap, tagsSnap, bookmarksSnap] = await Promise.all([
    getDocs(collection(db, `users/${userId}/folders`)),
    getDocs(collection(db, `users/${userId}/tags`)),
    getDocs(collection(db, `users/${userId}/bookmarks`)),
  ]);

  const batch = writeBatch(db);

  // Delete folders
  foldersSnap.docs.forEach((docSnap) => {
    batch.delete(doc(db, `users/${userId}/folders`, docSnap.id));
  });

  // Delete tags
  tagsSnap.docs.forEach((docSnap) => {
    batch.delete(doc(db, `users/${userId}/tags`, docSnap.id));
  });

  // Delete bookmarks
  bookmarksSnap.docs.forEach((docSnap) => {
    batch.delete(doc(db, `users/${userId}/bookmarks`, docSnap.id));
  });

  // Delete user profile
  batch.delete(doc(db, "users", userId));

  await batch.commit();

  // Delete Firebase Auth account
  await deleteUser(user);
};

