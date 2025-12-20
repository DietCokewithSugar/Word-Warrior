import React from 'react';
import { ReadingMaterial } from '../../types';
import { BookOpen, Brain, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface ReadingListProps {
    materials: ReadingMaterial[];
    onSelect: (material: ReadingMaterial) => void;
}

const ReadingList: React.FC<ReadingListProps> = ({ materials, onSelect }) => {
    if (materials.length === 0) {
        return (
            <div className="text-center p-8 text-gray-500">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No reading materials found.</p>
            </div>
        );
    }

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case '小学': return 'text-green-500 bg-green-500/10 border-green-500/20';
            case '初中': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
            case '高中': return 'text-red-500 bg-red-500/10 border-red-500/20';
            default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {materials.map((material, index) => (
                <motion.div
                    key={material.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => onSelect(material)}
                    className="group relative overflow-hidden bg-gray-800/50 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-violet-500/50 hover:bg-gray-800/80 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-violet-500/10"
                >
                    {/* Hover Effect Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/0 via-violet-500/0 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                    <div className="flex justify-between items-start mb-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getDifficultyColor(material.difficulty)}`}>
                            {material.difficulty}
                        </span>
                        {material.category && (
                            <span className="text-xs text-gray-400 font-medium px-2 py-1 bg-white/5 rounded-md">
                                {material.category}
                            </span>
                        )}
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-violet-400 transition-colors">
                        {material.title}
                    </h3>

                    <p className="text-gray-400 text-sm line-clamp-3 mb-6">
                        {material.content}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-gray-500 border-t border-white/5 pt-4 mt-auto">
                        <div className="flex items-center gap-1.5">
                            <Brain className="w-4 h-4 text-violet-400" />
                            <span>5 Questions</span>
                        </div>
                        {/* You could ensure word count or other stats here if available */}
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

export default ReadingList;
