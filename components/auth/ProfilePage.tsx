import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button, Input, Label } from '../ui';
import { signOut, deleteAccount } from '../../services/authService';
import { getCurrentUser, getAuthInstance, initFirebase } from '../../firebaseClient';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getDb } from '../../firebaseClient';
import ConfirmModal from '../ConfirmModal';
import { User } from 'firebase/auth';
import { updateProfile } from 'firebase/auth';

interface ProfilePageProps {
  onClose?: () => void;
}

interface UserProfile {
  email: string;
  displayName: string;
  photoURL?: string;
  provider: string;
  createdAt?: string;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ onClose }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Initialize Firebase when component mounts
  useEffect(() => {
    initFirebase();
  }, []);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    
    if (currentUser) {
      setDisplayName(currentUser.displayName || '');
      loadUserProfile(currentUser.uid);
    }
  }, []);

  const loadUserProfile = async (uid: string) => {
    try {
      const db = getDb();
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        setProfile(userDoc.data() as UserProfile);
      }
    } catch (err) {
      console.error('Failed to load user profile', err);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      // Update Firebase Auth display name
      await updateProfile(user, { displayName });
      
      // Update Firestore profile
      const db = getDb();
      await updateDoc(doc(db, 'users', user.uid), {
        displayName,
        updatedAt: new Date().toISOString(),
      });

      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut();
      window.location.href = '/signin';
    } catch (err: any) {
      setError(err.message || 'Failed to sign out.');
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      await deleteAccount(user);
      window.location.href = '/signin';
    } catch (err: any) {
      setError(err.message || 'Failed to delete account.');
      setIsLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 font-sans">
        <p className="text-muted-foreground">Not signed in</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <div className="bg-card border border-border rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-semibold mb-6 font-display">Profile Settings</h2>

          {/* User Info */}
          <div className="flex items-center gap-4 mb-8 pb-8 border-b border-border">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="w-16 h-16 rounded-full"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xl font-semibold">
                {(user.displayName || user.email || 'U')[0].toUpperCase()}
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold">{user.displayName || 'User'}</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              {profile && (
                <p className="text-xs text-muted-foreground mt-1">
                  Signed in with {profile.provider === 'google' ? 'Google' : profile.provider === 'github' ? 'GitHub' : 'Email'}
                </p>
              )}
            </div>
          </div>

          {/* Display Name */}
          <div className="space-y-4 mb-6">
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            {success && (
              <p className="text-sm text-green-600">{success}</p>
            )}
            <Button onClick={handleSaveProfile} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>

          {/* Account Actions */}
          <div className="space-y-4 pt-6 border-t border-border">
            <div>
              <h3 className="text-sm font-semibold mb-2">Account Actions</h3>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  onClick={handleSignOut}
                  disabled={isLoading}
                  className="w-full"
                >
                  Sign Out
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isLoading}
                  className="w-full"
                >
                  Delete Account
                </Button>
              </div>
            </div>
          </div>

          {onClose && (
            <div className="mt-6">
              <Button variant="ghost" onClick={onClose} className="w-full">
                Close
              </Button>
            </div>
          )}
        </div>
      </motion.div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        message="Are you sure you want to delete your account? This will permanently delete all your bookmarks, folders, and tags. This action cannot be undone."
        variant="destructive"
        confirmText="Delete Account"
        cancelText="Cancel"
      />
    </div>
  );
};

export default ProfilePage;

