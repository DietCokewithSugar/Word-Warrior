import React, { useState } from 'react';
import { ReadingQuestion } from '../../types';
import { CheckCircle, XCircle, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReadingQuestionItemProps {
    question: ReadingQuestion;
    index: number;
    onAnswer: (isCorrect: boolean) => void;
}

const ReadingQuestionItem: React.FC<ReadingQuestionItemProps> = ({ question, index, onAnswer }) => {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);

    const handleOptionSelect = (option: string) => {
        if (isAnswered) return;
        setSelectedOption(option);
    };

    const handleCheckAnswer = () => {
        if (!selectedOption || isAnswered) return;

        const isCorrect = selectedOption.trim() === (question.answer || '').trim();
        setIsAnswered(true);
        onAnswer(isCorrect);
    };

    return (
        <div className="bg-gray-800/30 border border-white/5 rounded-2xl p-6 md:p-8 mb-8">
            <h3 className="text-xl font-bold text-white mb-6 flex gap-3">
                <span className="text-violet-400">Q{index + 1}.</span>
                {question.question}
            </h3>

            <div className="space-y-3">
                {question.options.map((option, idx) => {
                    let optionClass = "w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between group ";

                    if (isAnswered) {
                        if (option.trim() === (question.answer || '').trim()) {
                            optionClass += "border-green-500/50 bg-green-500/10 text-green-100";
                        } else if (option === selectedOption) {
                            optionClass += "border-red-500/50 bg-red-500/10 text-red-100";
                        } else {
                            optionClass += "border-white/5 bg-white/5 text-gray-400 opacity-50";
                        }
                    } else {
                        if (selectedOption === option) {
                            optionClass += "border-violet-500 bg-violet-500/20 text-white";
                        } else {
                            optionClass += "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:border-white/20";
                        }
                    }

                    return (
                        <button
                            key={idx}
                            onClick={() => handleOptionSelect(option)}
                            disabled={isAnswered}
                            className={optionClass}
                        >
                            <span>{option}</span>
                            {isAnswered && option.trim() === (question.answer || '').trim() && (
                                <CheckCircle className="w-5 h-5 text-green-400" />
                            )}
                            {isAnswered && option === selectedOption && option.trim() !== (question.answer || '').trim() && (
                                <XCircle className="w-5 h-5 text-red-400" />
                            )}
                        </button>
                    );
                })}
            </div>

            <AnimatePresence>
                {isAnswered && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-6 overflow-hidden"
                    >
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-blue-200">
                            <p className="font-semibold mb-1 flex items-center gap-2">
                                <Brain className="w-4 h-4" />
                                Explanation:
                            </p>
                            <p>{question.explanation}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {!isAnswered && (
                <div className="flex justify-end mt-6">
                    <button
                        onClick={handleCheckAnswer}
                        disabled={!selectedOption}
                        className={`px-6 py-2 rounded-lg font-bold shadow-lg transition-all ${selectedOption
                            ? 'bg-violet-600 text-white hover:bg-violet-500 hover:-translate-y-0.5'
                            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            }`}
                    >
                        Check Answer
                    </button>
                </div>
            )}
        </div>
    );
};

export default ReadingQuestionItem;
