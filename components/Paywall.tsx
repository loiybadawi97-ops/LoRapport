import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Star, Zap, Shield, X, Sparkles } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import confetti from 'canvas-confetti';
import { useStore } from '../store/useStore';
import { getCurrentOffering, purchasePackage, restorePurchases } from '../services/purchasesService';
import type { PurchasesPackage } from '@revenuecat/purchases-capacitor';

interface PaywallProps {
    onClose: () => void;
}

export const Paywall: React.FC<PaywallProps> = ({ onClose }) => {
    const { isPro, setIsPro, addToast } = useStore();
    const [isLoading, setIsLoading] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [monthlyPackage, setMonthlyPackage] = useState<PurchasesPackage | null>(null);

    useEffect(() => {
        getCurrentOffering()
            .then(offering => setMonthlyPackage(offering?.availablePackages?.[0] ?? null))
            .catch(err => console.error('Failed to load RevenueCat offerings', err));
    }, []);

    const priceLabel = monthlyPackage?.product?.priceString ?? '$9.99';

    const handleUpgrade = async () => {
        if (!Capacitor.isNativePlatform()) {
            addToast('Subscriptions are only available in the iOS/Android app right now.', 'info');
            return;
        }
        if (!monthlyPackage) {
            addToast('Plans are still loading — try again in a moment.', 'error');
            return;
        }
        setIsLoading(true);
        try {
            // The purchase itself just grants the RevenueCat entitlement. Our server
            // webhook (RevenueCat -> /webhooks/revenuecat) is what actually flips
            // isPro on this user's Firestore doc via the Admin SDK — the client is
            // never allowed to set that field directly (see firestore.rules).
            const granted = await purchasePackage(monthlyPackage);
            if (granted) {
                setIsPro(true);
                confetti({
                    particleCount: 150,
                    spread: 100,
                    origin: { y: 0.6 },
                    colors: ['#FFD700', '#FFA500', '#FF4500']
                });
                setTimeout(() => onClose(), 1500);
            } else {
                addToast('Purchase went through, but Pro access is still syncing — check back in a few seconds.', 'info');
            }
        } catch (error: any) {
            if (!error?.userCancelled) {
                console.error('Error upgrading:', error);
                addToast('Purchase failed. Please try again.', 'error');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleRestore = async () => {
        if (!Capacitor.isNativePlatform()) {
            addToast('Restoring purchases is only available in the iOS/Android app.', 'info');
            return;
        }
        setIsRestoring(true);
        try {
            const restored = await restorePurchases();
            if (restored) {
                setIsPro(true);
                addToast('Pro access restored!', 'success');
                onClose();
            } else {
                addToast('No previous Pro purchase found for this account.', 'info');
            }
        } catch (error) {
            console.error('Restore failed:', error);
            addToast('Failed to restore purchases. Please try again.', 'error');
        } finally {
            setIsRestoring(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-surface-variant relative overflow-y-auto w-full max-w-full">
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-surface rounded-full text-on-surface hover:bg-surface-variant transition-colors z-10 shadow-sm"
            >
                <X className="w-6 h-6" />
            </button>
            <div className="flex-1 px-4 md:px-8 pt-12 pb-12 flex flex-col items-center w-full">
                
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-orange-500/20"
                >
                    <Star className="w-10 h-10 text-white fill-white" />
                </motion.div>
                <motion.h1 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-4xl md:text-5xl font-headline font-extrabold text-primary text-center leading-tight mb-2"
                >
                    Level Up Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-500">Charisma</span>
                </motion.h1>
                
                <motion.p 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-on-background/70 text-center mb-10 max-w-md text-lg"
                >
                    Choose the plan that fits your goals and start mastering social interactions.
                </motion.p>

                <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch"
                >
                    {/* Free Plan */}
                    <div className={`bg-surface p-8 rounded-[2rem] border-2 relative flex flex-col ${!isPro ? 'border-outline-variant' : 'border-transparent opacity-80'}`}>
                        {!isPro && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-outline-variant text-surface px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                Current Plan
                            </div>
                        )}
                        <h3 className="text-2xl font-headline font-bold text-on-surface mb-2">Basic Gym</h3>
                        <div className="flex items-baseline gap-1 mb-6">
                            <span className="text-4xl font-extrabold text-on-surface">$0</span>
                            <span className="text-on-surface/60 font-medium">/ forever</span>
                        </div>
                        <p className="text-on-surface-variant text-sm mb-8">Essential tools for warming up your social skills.</p>
                        
                        <ul className="space-y-4 mb-8 flex-1">
                            <li className="flex items-start gap-3">
                                <Check className="w-5 h-5 text-secondary shrink-0" />
                                <span className="text-on-surface text-sm">Powered by Gemini 3.1 Flash (Fast & Capable)</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <Check className="w-5 h-5 text-secondary shrink-0" />
                                <span className="text-on-surface text-sm">Access to 5 Basic Scenarios</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <Check className="w-5 h-5 text-secondary shrink-0" />
                                <span className="text-on-surface text-sm">Standard AI personas (Friendly & Neutral)</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <Check className="w-5 h-5 text-secondary shrink-0" />
                                <span className="text-on-surface text-sm">Basic feedback on messages</span>
                            </li>
                            <li className="flex items-start gap-3 opacity-50">
                                <X className="w-5 h-5 text-outline shrink-0" />
                                <span className="text-on-surface text-sm line-through">Advanced Voice Analytics</span>
                            </li>
                            <li className="flex items-start gap-3 opacity-50">
                                <X className="w-5 h-5 text-outline shrink-0" />
                                <span className="text-on-surface text-sm line-through">Hostile & Complex Personas</span>
                            </li>
                        </ul>
                        
                        {!isPro ? (
                            <button className="w-full py-4 bg-surface-variant text-on-surface-variant rounded-2xl font-bold border border-outline-variant/50 cursor-default">
                                Active Plan
                            </button>
                        ) : (
                            <button className="w-full py-4 bg-surface-variant text-on-surface-variant rounded-2xl font-bold border border-outline-variant hover:bg-surface-container transition-colors">
                                Downgrade
                            </button>
                        )}
                    </div>

                    {/* Pro Plan */}
                    <div className={`bg-primary p-8 rounded-[2rem] border-2 relative flex flex-col shadow-2xl ${isPro ? 'border-tertiary shadow-tertiary/20' : 'border-transparent shadow-primary/20'}`}>
                        {isPro && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-tertiary text-on-tertiary px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                                <Star className="w-3 h-3 fill-on-tertiary" /> Active Plan
                            </div>
                        )}
                        {!isPro && (
                            <div className="absolute -top-3 right-6 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-md shadow-orange-500/30">
                                <Sparkles className="w-3 h-3" /> Most Popular
                            </div>
                        )}
                        <h3 className="text-2xl font-headline font-bold text-white mb-2">Pro Gym</h3>
                        <div className="flex items-baseline gap-1 mb-6">
                            <span className="text-4xl font-extrabold text-white">{priceLabel}</span>
                            <span className="text-white/70 font-medium">/ month</span>
                        </div>
                        <p className="text-primary-fixed text-sm mb-8">Master any situation with advanced AI intelligence.</p>
                        
                        <ul className="space-y-4 mb-8 flex-1">
                            <li className="flex items-start gap-3">
                                <Star className="w-5 h-5 text-tertiary-fixed shrink-0 fill-tertiary-fixed" />
                                <span className="text-white text-sm font-medium">Powered by Gemini 3.1 Pro (Elite Emotional Intelligence)</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <Check className="w-5 h-5 text-tertiary-fixed shrink-0" />
                                <span className="text-white text-sm">Unlimited Access to All Scenarios</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <Check className="w-5 h-5 text-tertiary-fixed shrink-0" />
                                <span className="text-white text-sm">Tough AI personas (Hostile, Distracted, Defensive)</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <Check className="w-5 h-5 text-tertiary-fixed shrink-0" />
                                <span className="text-white text-sm">Deep psychological analysis & reframing</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <Check className="w-5 h-5 text-tertiary-fixed shrink-0" />
                                <span className="text-white text-sm">Advanced voice tonality & pacing analysis</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <Check className="w-5 h-5 text-tertiary-fixed shrink-0" />
                                <span className="text-white text-sm">Priority customer support</span>
                            </li>
                        </ul>
                        
                        {!isPro ? (
                            <button 
                                onClick={handleUpgrade}
                                disabled={isLoading}
                                className="w-full py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-orange-500/40 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    "Upgrade to Pro"
                                )}
                            </button>
                        ) : (
                            <button className="w-full py-4 bg-white/10 text-white rounded-2xl font-bold border border-white/20 cursor-default">
                                Active Subscription
                            </button>
                        )}
                    </div>
                </motion.div>
                
                <p className="text-center text-on-surface-variant/60 text-xs mt-8">
                    Subscriptions are managed securely via your App Store or Play Store account. Cancel anytime.
                </p>
                {!isPro && (
                    <button
                        onClick={handleRestore}
                        disabled={isRestoring}
                        className="text-center text-primary/80 hover:text-primary text-xs font-medium mt-3 underline underline-offset-2"
                    >
                        {isRestoring ? 'Restoring…' : 'Already purchased? Restore purchases'}
                    </button>
                )}
            </div>
        </div>
    );
};
