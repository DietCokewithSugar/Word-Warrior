import React, { useState } from 'react';
import { ReadingMaterial } from '../../types';
import { ArrowLeft, BookOpen, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import ReadingQuestionItem from './ReadingQuestionItem';
import confetti from 'canvas-confetti';

interface ReadingReaderProps {
    material: ReadingMaterial;
    onBack: () => void;
    onComplete: (score: number) => void;
}

const ReadingReader: React.FC<ReadingReaderProps> = ({ material, onBack, onComplete }) => {
    const [score, setScore] = useState(0);
    const [answeredCount, setAnsweredCount] = useState(0);

    const handleQuestionAnswer = (isCorrect: boolean) => {
        if (isCorrect) {
            setScore(prev => prev + 1);
            confetti({
                particleCount: 30,
                spread: 40,
                origin: { y: 0.8 },
                colors: ['#8b5cf6', '#6366f1', '#10b981']
            });
        }
        setAnsweredCount(prev => prev + 1);
    };

    const handleFinish = () => {
        onComplete(score);
    };

    const allAnswered = answeredCount === material.questions.length;

    return (
        <div className="max-w-4xl mx-auto">
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 group"
            >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                Back to Library
            </button>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-800/50 backdrop-blur-md border border-white/10 rounded-2xl p-8 md:p-12 shadow-2xl relative overflow-hidden mb-12"
            >
                <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                    <BookOpen className="w-64 h-64" />
                </div>

                <div className="relative z-10">
                    <header className="mb-8 border-b border-white/10 pb-8">
                        <div className="flex items-center gap-3 mb-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30`}>
                                {material.category || 'General'}
                            </span>
                            <span className="text-gray-400 text-sm">•</span>
                            <span className="text-gray-400 text-sm">{material.difficulty}</span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
                            {material.title}
                        </h1>
                    </header>

                    <div className="prose prose-invert prose-lg max-w-none mb-16">
                        {material.content.split('\n').map((paragraph, index) => (
                            <p key={index} className="mb-6 text-gray-300 leading-relaxed text-lg">
                                {paragraph}
                            </p>
                        ))}
                    </div>

                    <div className="mt-12 pt-12 border-t border-white/10">
                        <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center text-violet-400 text-sm">?</span>
                            Comprehension Questions
                        </h2>

                        <div className="space-y-2">
                            {material.questions.map((question, index) => (
                                <ReadingQuestionItem
                                    key={question.id}
                                    index={index}
                                    question={question}
                                    onAnswer={handleQuestionAnswer}
                                />
                            ))}
                        </div>

                        {allAnswered && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-12 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-violet-500/10 to-indigo-500/10 rounded-2xl border border-violet-500/20"
                            >
                                <div className="mb-4">
                                    <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-2" />
                                    <p className="text-2xl font-bold text-white text-center">Reading Completed!</p>
                                </div>
                                <p className="text-gray-400 mb-6">
                                    You got <span className="text-white font-bold">{score}</span> out of <span className="text-white font-bold">{material.questions.length}</span> correct.
                                </p>
                                <button
                                    onClick={handleFinish}
                                    className="px-8 py-3 bg-white text-gray-900 rounded-xl font-bold hover:bg-gray-100 transform hover:scale-105 transition-all shadow-lg"
                                >
                                    Finish & Collect Data
                                </button>
                            </motion.div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ReadingReader;
