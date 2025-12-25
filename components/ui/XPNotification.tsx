import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Sparkles } from 'lucide-react';

interface XPNotificationProps {
    amount: number;
    gold?: number;
    isVisible: boolean;
    onClose: () => void;
    title?: string;
}

const XPNotification: React.FC<XPNotificationProps> = ({ amount, gold, isVisible, onClose, title = "挑战奖励" }) => {
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isVisible) {
            timer = setTimeout(() => {
                onClose();
            }, 3500); // Slightly longer to allow for animations
        }
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [isVisible, onClose]);

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 flex items-center justify-center z-[999] pointer-events-none">
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0, y: 50 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.5, opacity: 0, y: -50 }}
                        className="bg-slate-900/95 backdrop-blur-2xl border-2 border-[var(--ww-accent)] p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col items-center gap-6 min-w-[320px] pointer-events-auto relative overflow-hidden"
                    >
                        {/* Decorative background glow */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[var(--ww-accent)] to-transparent opacity-10 pointer-events-none" />
                        
                        <div className="relative">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0 blur-2xl bg-[var(--ww-accent)]/30 rounded-full"
                            />
                            <div className="relative w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-600 rounded-3xl flex items-center justify-center shadow-lg transform rotate-3 border-2 border-white/20">
                                <Trophy className="w-12 h-12 text-white" fill="currentColor" />
                            </div>
                            <div className="absolute -top-3 -right-3">
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    <Sparkles className="w-10 h-10 text-yellow-300" fill="currentColor" />
                                </motion.div>
                            </div>
                        </div>

                        <div className="text-center space-y-2 relative z-10">
                            <motion.h3
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-3xl font-black text-white uppercase tracking-[0.2em] italic"
                                style={{ textShadow: '0 4px 10px rgba(0,0,0,0.3)' }}
                            >
                                {title}
                            </motion.h3>
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="text-amber-200/80 font-black uppercase tracking-widest text-[10px]"
                            >
                                修行成果已存入囊中
                            </motion.p>
                        </div>

                        <div className="flex flex-col gap-3 w-full relative z-10">
                            <motion.div
                                initial={{ scale: 0, x: -20 }}
                                animate={{ scale: 1, x: 0 }}
                                transition={{ delay: 0.4, type: "spring" }}
                                className="bg-white/5 rounded-2xl px-6 py-3 border border-white/10 flex items-center justify-between"
                            >
                                <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">经验值</span>
                                <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                                    +{amount} EXP
                                </span>
                            </motion.div>

                            {gold !== undefined && gold > 0 && (
                                <motion.div
                                    initial={{ scale: 0, x: 20 }}
                                    animate={{ scale: 1, x: 0 }}
                                    transition={{ delay: 0.5, type: "spring" }}
                                    className="bg-white/5 rounded-2xl px-6 py-3 border border-white/10 flex items-center justify-between"
                                >
                                    <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">金币</span>
                                    <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-500">
                                        +{gold} GOLD
                                    </span>
                                </motion.div>
                            )}
                        </div>

                        {/* Manual Close Hint */}
                        <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.4 }}
                            transition={{ delay: 1 }}
                            className="text-[9px] text-white font-medium uppercase tracking-[0.3em] mt-2"
                        >
                            点击任意处或等待自动关闭
                        </motion.p>
                    </motion.div>
                    
                    {/* Full screen invisible overlay to catch clicks and close */}
                    <div 
                        className="absolute inset-0 z-[-1] pointer-events-auto cursor-pointer" 
                        onClick={onClose}
                    />
                </div>
            )}
        </AnimatePresence>
    );
};

export default XPNotification;
