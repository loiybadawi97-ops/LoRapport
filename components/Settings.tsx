import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Trash2, ShieldAlert, X } from 'lucide-react';
import { deleteUser, signOut } from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useStore } from '../store/useStore';
import { logoutPurchasesUser } from '../services/purchasesService';

export const Settings: React.FC = () => {
    const { user, addToast } = useStore();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSignOut = async () => {
        try {
            await logoutPurchasesUser();
            await signOut(auth);
            addToast('Signed out successfully.', 'success');
        } catch (error) {
            console.error("Sign out error", error);
            addToast('Failed to sign out. Please try again.', 'error');
        }
    };

    const handleAccountDeletion = async () => {
        if (!auth.currentUser) return;
        setIsDeleting(true);
        try {
            // Delete user data from Firestore first
            const userRef = doc(db, 'users', auth.currentUser.uid);
            await deleteDoc(userRef);

            // Delete authentication record
            await deleteUser(auth.currentUser);
            
            addToast('Your account and all data have been deleted.', 'success');
        } catch (error: any) {
            console.error('Account deletion failed:', error);
            if (error.code === 'auth/requires-recent-login') {
                addToast('For security reasons, please log out and log back in before deleting your account.', 'error');
            } else {
                addToast('Failed to delete account. Please try again or contact support.', 'error');
            }
        } finally {
            setIsDeleting(false);
            setShowDeleteModal(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-surface-variant overflow-y-auto">
            <div className="p-6 md:p-8 space-y-6">
                <div>
                    <h2 className="font-headline font-extrabold text-2xl text-primary">Settings</h2>
                    <p className="text-on-surface-variant text-sm mt-1">Manage your account and preferences.</p>
                </div>

                <div className="bg-surface rounded-2xl p-6 shadow-sm border border-outline-variant/20 space-y-6">
                    <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60">Account</span>
                        <span className="font-medium text-on-surface">{user?.email}</span>
                    </div>

                    <div className="pt-4 border-t border-outline-variant/20 flex flex-col gap-4">
                        <button 
                            onClick={handleSignOut}
                            className="flex items-center gap-3 w-full py-3 px-4 rounded-xl font-bold bg-surface-container-highest text-on-surface hover:bg-surface-dim transition-colors active:scale-95"
                        >
                            <LogOut className="w-5 h-5 text-on-surface-variant" />
                            Sign Out
                        </button>

                        <button 
                            onClick={() => setShowDeleteModal(true)}
                            className="flex items-center gap-3 w-full py-3 px-4 rounded-xl font-bold bg-error/10 text-error hover:bg-error/20 transition-colors active:scale-95"
                        >
                            <Trash2 className="w-5 h-5" />
                            Delete Account
                        </button>
                    </div>
                </div>
            </div>

            {/* Account Deletion Confirmation Modal */}
            <AnimatePresence>
                {showDeleteModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-surface w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col"
                        >
                            <div className="p-6 pb-0 flex items-start justify-between">
                                <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center text-error mb-4">
                                    <ShieldAlert className="w-6 h-6" />
                                </div>
                                <button 
                                    onClick={() => !isDeleting && setShowDeleteModal(false)}
                                    className="p-2 -mr-2 -mt-2 text-on-surface-variant hover:text-on-surface transition-colors"
                                    disabled={isDeleting}
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            
                            <div className="p-6 pt-2 space-y-4">
                                <h3 className="font-headline font-bold text-xl text-on-surface">Delete Account?</h3>
                                <p className="text-sm text-on-surface-variant leading-relaxed">
                                    This action is permanent and cannot be undone. All your progress, statistics, and personal data will be completely wiped from our servers immediately.
                                </p>
                            </div>
                            
                            <div className="p-4 bg-surface-container-lowest border-t border-outline-variant/20 flex gap-3">
                                <button 
                                    onClick={() => setShowDeleteModal(false)}
                                    disabled={isDeleting}
                                    className="flex-1 py-3 rounded-xl font-bold bg-surface-container-highest text-on-surface hover:bg-surface-dim transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleAccountDeletion}
                                    disabled={isDeleting}
                                    className="flex-1 py-3 rounded-xl font-bold bg-error text-white hover:bg-error/90 transition-colors flex items-center justify-center gap-2"
                                >
                                    {isDeleting ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        "Delete Everything"
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
