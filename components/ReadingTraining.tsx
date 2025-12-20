import React, { useState, useEffect } from 'react';
import { ReadingMaterial } from '../types';
import { readingService } from '../services/readingService';
import ReadingList from './reading/ReadingList';
import ReadingReader from './reading/ReadingReader';

import { BookOpen, Loader } from 'lucide-react';

interface ReadingTrainingProps {
  onSuccess: (exp: number) => void;
}

const ReadingTraining: React.FC<ReadingTrainingProps> = ({ onSuccess }) => {
  const [materials, setMaterials] = useState<ReadingMaterial[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<ReadingMaterial | null>(null);
  const [mode, setMode] = useState<'list' | 'read'>('list');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const data = await readingService.getReadingMaterials();
      setMaterials(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load reading materials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMaterial = (material: ReadingMaterial) => {
    setSelectedMaterial(material);
    setMode('read');
  };



  const handleBackToList = () => {
    setSelectedMaterial(null);
    setMode('list');
  };

  const handleQuizComplete = (score: number) => {
    // Award EXP based on score, e.g., 20 EXP per correct answer
    const expGained = score * 20;
    if (expGained > 0) {
      onSuccess(expGained);
    }
    // Could add a delay or button to go back to list
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-gray-500">
        <Loader className="w-10 h-10 animate-spin mb-4 text-violet-500" />
        <p>Loading library...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-12 text-red-400">
        <p>{error}</p>
        <button
          onClick={fetchMaterials}
          className="mt-4 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {mode === 'list' && (
        <>
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-violet-500/10 rounded-xl">
                <BookOpen className="w-6 h-6 text-violet-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Reading Library</h2>
                <p className="text-gray-400 text-sm">Read articles and answer questions to improve your HP</p>
              </div>
            </div>
          </div>
          <ReadingList materials={materials} onSelect={handleSelectMaterial} />
        </>
      )}

      {mode === 'read' && selectedMaterial && (
        <ReadingReader
          material={selectedMaterial}
          onBack={handleBackToList}
          onComplete={handleQuizComplete}
        />
      )}
    </div>
  );
};

export default ReadingTraining;
