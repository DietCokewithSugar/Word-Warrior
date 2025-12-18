
import React, { useState } from 'react';
import { PenTool, Mic2, Search, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { gradeWriting, getExplanation } from '../services/geminiService';
import { MOCK_QUESTIONS } from '../constants.tsx';

interface SkillsTrainingProps {
  onSuccess: (exp: number, statType: 'def' | 'hp' | 'crit') => void;
}

const SkillsTraining: React.FC<SkillsTrainingProps> = ({ onSuccess }) => {
  const [mode, setMode] = useState<'mcq' | 'writing'>('mcq');
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [writingContent, setWritingContent] = useState('');
  const [isGrading, setIsGrading] = useState(false);

  const currentQ = MOCK_QUESTIONS[currentQIndex];

  const handleMcqSubmit = async () => {
    if (!selectedOption) return;
    if (selectedOption === currentQ.correctAnswer) {
      setFeedback('回答正确! +10 经验值, +1 语法防御');
      onSuccess(10, 'def');
    } else {
      const explanation = await getExplanation(currentQ.prompt, selectedOption, currentQ.correctAnswer!);
      setFeedback(`回答错误。解析: ${explanation}`);
    }
  };

  const handleWritingSubmit = async () => {
    if (!writingContent) return;
    setIsGrading(true);
    const result = await gradeWriting("My goals for the next year.", writingContent);
    setIsGrading(false);
    if (result.score >= 60) {
      setFeedback(`评分: ${result.score}/100。${result.feedback}`);
      onSuccess(Math.floor(result.score / 2), 'hp');
    } else {
      setFeedback(`评分: ${result.score}。再接再厉! ${result.feedback}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex p-1 bg-slate-800 rounded-lg max-w-xs mx-auto">
        <button 
          onClick={() => { setMode('mcq'); setFeedback(null); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-semibold transition-all ${mode === 'mcq' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}
        >
          <Search size={16} /> 综合练习
        </button>
        <button 
          onClick={() => { setMode('writing'); setFeedback(null); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-semibold transition-all ${mode === 'writing' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}
        >
          <PenTool size={16} /> 写作挑战
        </button>
      </div>

      <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 min-h-[400px]">
        {mode === 'mcq' ? (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-indigo-400">技能测试: {currentQ.type === 'grammar' ? '语法' : '阅读'}</h3>
            <p className="text-xl leading-relaxed">{currentQ.prompt}</p>
            <div className="grid grid-cols-1 gap-3">
              {currentQ.options?.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setSelectedOption(opt)}
                  className={`p-4 text-left rounded-xl border-2 transition-all ${selectedOption === opt ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-slate-900 border-slate-700 hover:border-slate-600'}`}
                >
                  {opt}
                </button>
              ))}
            </div>
            <button 
              disabled={!selectedOption}
              onClick={handleMcqSubmit}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 rounded-xl font-bold transition-colors shadow-lg shadow-indigo-500/20"
            >
              提交答案
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-indigo-400">写作任务: 我的未来目标</h3>
            <textarea
              value={writingContent}
              onChange={(e) => setWritingContent(e.target.value)}
              placeholder="请就你的未来目标写至少 50 个单词..."
              className="w-full h-48 bg-slate-900 border-2 border-slate-700 rounded-xl p-4 focus:border-indigo-500 outline-none transition-all resize-none"
            />
            <button 
              disabled={isGrading || !writingContent}
              onClick={handleWritingSubmit}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
            >
              {isGrading ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> : <Send size={20} />}
              {isGrading ? '评分中...' : '提交作文'}
            </button>
          </div>
        )}

        {feedback && (
          <div className={`mt-6 p-4 rounded-xl flex gap-3 border ${feedback.includes('正确') || feedback.includes('评分:') ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-red-500/10 border-red-500/50 text-red-400'}`}>
            {feedback.includes('正确') || feedback.includes('评分:') ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <p className="text-sm">{feedback}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SkillsTraining;
