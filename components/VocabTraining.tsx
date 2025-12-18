
import React, { useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { BookOpen, RotateCcw } from 'lucide-react';
import { MOCK_VOCAB_CARDS } from '../constants.tsx';

interface VocabTrainingProps {
  onMastered: (word: string) => void;
}

const VocabTraining: React.FC<VocabTrainingProps> = ({ onMastered }) => {
  const [index, setIndex] = useState(0);
  const [showDefinition, setShowDefinition] = useState(false);
  const [completed, setCompleted] = useState(false);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
  const color = useTransform(x, [-100, 100], ["#ef4444", "#22c55e"]);

  const card = MOCK_VOCAB_CARDS[index];

  const handleDragEnd = (event: any, info: any) => {
    if (info.offset.x > 100) {
      // Swiped Right - Mastered
      onMastered(card.word);
      nextCard();
    } else if (info.offset.x < -100) {
      // Swiped Left - Forgot
      nextCard();
    }
  };

  const nextCard = () => {
    if (index < MOCK_VOCAB_CARDS.length - 1) {
      setIndex(prev => prev + 1);
      setShowDefinition(false);
    } else {
      setCompleted(true);
    }
  };

  const reset = () => {
    setIndex(0);
    setCompleted(false);
    setShowDefinition(false);
  };

  if (completed) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center h-[400px] text-center space-y-6"
      >
        <div className="bg-indigo-500/10 p-6 rounded-full">
          <BookOpen size={64} className="text-indigo-400" />
        </div>
        <div className="space-y-2">
          <h3 className="text-3xl font-black rpg-font uppercase tracking-tighter">本轮学习结束</h3>
          <p className="text-slate-500 max-w-xs">对语言的掌握是你最强大的武器。</p>
        </div>
        <button 
          onClick={reset}
          className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-slate-200 transition-all"
        >
          <RotateCcw size={18} /> 重新开始本轮
        </button>
      </motion.div>
    );
  }

  return (
    <div className="relative w-full max-w-sm mx-auto h-[500px] flex items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          style={{ x, rotate, opacity }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={handleDragEnd}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ x: x.get() > 0 ? 500 : -500, opacity: 0, transition: { duration: 0.3 } }}
          className="absolute w-full aspect-[3/4] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col items-center justify-center p-8 cursor-grab active:cursor-grabbing group overflow-hidden"
        >
          {/* Visual Feedback Overlay */}
          <motion.div 
            style={{ backgroundColor: color, opacity: useTransform(x, [-100, 0, 100], [0.1, 0, 0.1]) }}
            className="absolute inset-0 pointer-events-none"
          />

          <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-1">
            {MOCK_VOCAB_CARDS.map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === index ? 'bg-indigo-500' : 'bg-slate-700'}`} />
            ))}
          </div>

          <div className="text-center space-y-6">
            <h2 className="text-5xl font-black rpg-font tracking-tight text-white group-hover:scale-105 transition-transform">
              {card.word}
            </h2>
            
            <AnimatePresence>
              {showDefinition ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <p className="text-2xl text-indigo-400 font-bold">{card.chinese}</p>
                  <p className="text-slate-500 text-sm italic px-4 leading-relaxed">{card.definition}</p>
                </motion.div>
              ) : (
                <button 
                  onClick={() => setShowDefinition(true)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 border border-slate-800 rounded-full hover:bg-slate-800 transition-all"
                >
                  点击显示释义
                </button>
              )}
            </AnimatePresence>
          </div>

          <div className="absolute bottom-10 inset-x-0 px-8 flex justify-between items-center text-[10px] font-black tracking-widest text-slate-600 uppercase">
            <span>← 左滑 (不认识)</span>
            <span>右滑 (已掌握) →</span>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default VocabTraining;
