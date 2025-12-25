import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Coffee,
    Plane,
    Briefcase,
    BookOpen,
    Rocket,
    Mic,
    Square,
    Loader,
    Award,
    Clock,
    History,
    ArrowLeft,
    CheckCircle,
    XCircle,
    Trophy,
    Zap,
} from 'lucide-react';
import XPNotification from '../ui/XPNotification';
import {
    fetchSpeakingQuestions,
    AudioRecorder,
    audioBlobToBase64,
    assessSpeakingWithAI,
    saveAssessment,
    fetchUserAssessments,
} from '../../services/speakingAssessmentService';
import { type SpeakingAssessment, SpeakingQuestion, AssessmentScore } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';

interface SpeakingAssessmentProps {
    userId: string;
    onSuccess: (exp: number, gold?: number) => void;
    onClose?: () => void;
    onToggleStatusBar?: (hidden: boolean) => void;
}

type ViewState = 'selection' | 'recording' | 'evaluating' | 'result' | 'history';

const CATEGORY_ICONS: Record<string, React.ReactElement> = {
    'Daily Chat': <Coffee size={24} />,
    Travel: <Plane size={24} />,
    Business: <Briefcase size={24} />,
    Academic: <BookOpen size={24} />,
    Tech: <Rocket size={24} />,
};

const CATEGORY_COLORS: Record<string, string> = {
    'Daily Chat': 'from-amber-400 to-orange-500',
    Travel: 'from-sky-400 to-blue-500',
    Business: 'from-slate-500 to-gray-600',
    Academic: 'from-indigo-400 to-purple-500',
    Tech: 'from-violet-400 to-fuchsia-500',
};

const SpeakingAssessment: React.FC<SpeakingAssessmentProps> = ({
    userId,
    onSuccess,
    onClose,
    onToggleStatusBar,
}) => {
    const { getColorClass, primaryColor } = useTheme();

    // State
    const [viewState, setViewState] = useState<ViewState>('selection');
    const [selectedDifficulty, setSelectedDifficulty] = useState<'初级' | '中级' | '高级' | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [questions, setQuestions] = useState<SpeakingQuestion[]>([]);
    const [selectedQuestion, setSelectedQuestion] = useState<SpeakingQuestion | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [assessmentResult, setAssessmentResult] = useState<AssessmentScore | null>(null);
    const [expAwarded, setExpAwarded] = useState(0);
    const [assessmentHistory, setAssessmentHistory] = useState<SpeakingAssessment[]>([]);
    const [selectedHistoryItem, setSelectedHistoryItem] = useState<SpeakingAssessment | null>(null);
    const [showXPNotification, setShowXPNotification] = useState(false);
    const [goldAwarded, setGoldAwarded] = useState(0);

    // Refs
    const audioRecorderRef = useRef<AudioRecorder | null>(null);
    const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Load questions on mount
    useEffect(() => {
        loadQuestions();
    }, [selectedDifficulty, selectedCategory]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current);
            }
        };
    }, []);

    const loadQuestions = async () => {
        const data = await fetchSpeakingQuestions(
            selectedDifficulty || undefined,
            selectedCategory as any
        );
        setQuestions(data);
    };

    const loadHistory = async () => {
        const history = await fetchUserAssessments(userId);
        setAssessmentHistory(history);
    };

    const startRecording = async () => {
        try {
            if (!audioRecorderRef.current) {
                audioRecorderRef.current = new AudioRecorder();
            }

            await audioRecorderRef.current.startRecording();
            setIsRecording(true);
            setRecordingDuration(0);

            // Start timer
            recordingTimerRef.current = setInterval(() => {
                setRecordingDuration((prev) => prev + 1);
            }, 1000);
        } catch (error: any) {
            alert(error.message || '无法开始录音');
        }
    };

    const stopRecording = async () => {
        try {
            if (!audioRecorderRef.current || !selectedQuestion) return;

            // Stop timer
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current);
                recordingTimerRef.current = null;
            }

            setIsRecording(false);
            setViewState('evaluating');

            const audioBlob = await audioRecorderRef.current.stopRecording();
            const audioBase64 = await audioBlobToBase64(audioBlob);

            // Call AI assessment
            const result = await assessSpeakingWithAI(audioBase64, selectedQuestion);
            setAssessmentResult(result);

            // Save to database
            const { expAwarded: exp, goldAwarded: gold } = await saveAssessment(
                userId,
                selectedQuestion.id,
                result
            );
            
            // Set state first
            setExpAwarded(exp);
            setGoldAwarded(gold);

            // Call parent success handler and show notification if there are rewards
            if (exp > 0 || gold > 0) {
                setShowXPNotification(true);
                onSuccess(exp, gold);
            }

            setViewState('result');
        } catch (error: any) {
            alert(error.message || '评估失败，请重试');
            setViewState('recording');
        }
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const resetToSelection = () => {
        setViewState('selection');
        setSelectedQuestion(null);
        setRecordingDuration(0);
        setAssessmentResult(null);
        setExpAwarded(0);
        onToggleStatusBar?.(false);
    };

    // ===== RENDER FUNCTIONS =====

    const renderSelection = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 pb-20 custom-scrollbar overflow-y-auto"
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-black ww-ink uppercase tracking-wider">AI 口语评估</h2>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={async () => {
                        await loadHistory();
                        setViewState('history');
                    }}
                    className="flex items-center gap-2 px-4 py-2 ww-btn ww-btn--accent rounded-xl text-[10px]"
                >
                    <History size={16} />
                    <span>历史记录</span>
                </motion.button>
            </div>

            {/* Difficulty Filter */}
            <div className="space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] ww-muted ml-1">
                    难度级别
                </h3>
                <div className="grid grid-cols-3 gap-3">
                    {['初级', '中级', '高级'].map((difficulty) => (
                        <motion.button
                            key={difficulty}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() =>
                                setSelectedDifficulty(
                                    selectedDifficulty === difficulty ? null : (difficulty as any)
                                )
                            }
                            className={`py-3 rounded-[18px] font-black text-[11px] uppercase tracking-widest transition-all ww-choice ${selectedDifficulty === difficulty
                                ? 'border-[color:var(--ww-accent)] bg-[rgba(252,203,89,0.15)] ring-2 ring-[var(--ww-accent)] ring-inset'
                                : 'opacity-80'
                                }`}
                        >
                            {difficulty}
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Category Filter */}
            <div className="space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] ww-muted ml-1">
                    修行领域
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    {Object.keys(CATEGORY_ICONS).map((category) => (
                        <motion.button
                            key={category}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() =>
                                setSelectedCategory(selectedCategory === category ? null : category)
                            }
                            className={`p-4 rounded-[18px] transition-all ww-choice flex flex-col items-center gap-2 ${selectedCategory === category
                                ? 'border-[color:var(--ww-accent)] bg-[rgba(252,203,89,0.15)] ring-2 ring-[var(--ww-accent)] ring-inset'
                                : 'opacity-80'
                                }`}
                        >
                            <div className={`p-2 rounded-xl ${selectedCategory === category ? 'bg-[var(--ww-accent)] text-black' : 'bg-[var(--ww-stroke-soft)] text-[var(--ww-muted)]'}`}>
                                {CATEGORY_ICONS[category]}
                            </div>
                            <span className="text-xs font-black uppercase tracking-wider">{category}</span>
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Question List */}
            <div className="space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] ww-muted ml-1">
                    当前可选挑战 ({questions.length})
                </h3>
                {questions.length === 0 ? (
                    <div className="text-center py-12 ww-surface ww-surface--soft rounded-[22px] border-dashed border-4 border-[var(--ww-stroke-soft)] bg-transparent">
                        <div className="inline-flex items-center gap-2 px-4 py-2">
                            <Mic size={24} className="ww-muted opacity-40" />
                            <p className="text-[11px] font-black uppercase tracking-widest ww-muted">在当前筛选下没有找到挑战</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {questions.map((question) => (
                            <motion.button
                                key={question.id}
                                whileHover={{ scale: 1.01, x: 4 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => {
                                    setSelectedQuestion(question);
                                    setViewState('recording');
                                    onToggleStatusBar?.(true);
                                }}
                                className="w-full p-5 rounded-[22px] text-left transition-all ww-surface ww-surface--soft hover:border-[var(--ww-accent)] group"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase bg-[var(--ww-stroke-soft)] ww-muted border border-[var(--ww-stroke-soft)]">
                                                {question.difficulty}
                                            </span>
                                            <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase bg-[var(--ww-stroke-soft)] ww-muted border border-[var(--ww-stroke-soft)]">
                                                {question.category}
                                            </span>
                                        </div>
                                        <p className="text-sm font-black ww-ink leading-snug group-hover:text-[var(--ww-bg-1)] transition-colors">
                                            {question.question_text}
                                        </p>
                                        <div className="flex items-center gap-3 mt-3 text-[10px] ww-muted font-black">
                                            <div className="flex items-center gap-1">
                                                <Clock size={12} />
                                                <span>建议 {question.expected_duration}s</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Zap size={12} className="text-amber-500" />
                                                <span>难度系数 {question.difficulty === '高级' ? '★★★' : question.difficulty === '中级' ? '★★' : '★'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-[var(--ww-stroke-soft)] flex items-center justify-center text-[var(--ww-stroke)] group-hover:bg-[var(--ww-accent)] group-hover:text-black transition-all">
                                        <Mic size={18} />
                                    </div>
                                </div>
                            </motion.button>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );

    const renderRecording = () => (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full flex flex-col"
        >
            {/* Back Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={resetToSelection}
                className="self-start flex items-center gap-2 ww-btn ww-btn--ink px-4 py-2 rounded-xl text-[10px] mb-6"
            >
                <ArrowLeft size={16} />
                <span className="font-black uppercase tracking-widest">返回列表</span>
            </motion.button>

            {/* Question Display */}
            <div className="ww-surface ww-surface--soft p-6 rounded-[24px] mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <BookOpen size={80} />
                </div>
                <div className="flex items-center gap-2 mb-4">
                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-[var(--ww-accent)] text-black border-2 border-[var(--ww-stroke)]">
                        {selectedQuestion?.difficulty}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-[var(--ww-stroke-soft)] ww-muted border border-[var(--ww-stroke-soft)]">
                        {selectedQuestion?.category}
                    </span>
                </div>
                <p className="text-lg font-black ww-ink leading-relaxed">
                    {selectedQuestion?.question_text}
                </p>
            </div>

            {/* Recording Interface */}
            <div className="flex-1 flex flex-col items-center justify-center space-y-8">
                <div className="relative">
                    <motion.div
                        animate={{
                            scale: isRecording ? [1, 1.2, 1] : 1,
                            opacity: isRecording ? [0.3, 0.6, 0.3] : 0,
                        }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="absolute inset-0 rounded-full bg-red-500 blur-2xl"
                    />
                    <motion.div
                        animate={{
                            scale: isRecording ? [1, 1.05, 1] : 1,
                        }}
                        transition={{ duration: 0.5, repeat: isRecording ? Infinity : 0 }}
                        className={`w-36 h-36 rounded-full border-4 border-[var(--ww-stroke)] flex items-center justify-center shadow-2xl relative z-10 transition-colors duration-300 ${isRecording
                            ? 'bg-red-500 text-white'
                            : 'bg-[var(--ww-surface)] text-[var(--ww-stroke)]'
                            }`}
                        style={{
                            boxShadow: isRecording ? '0 0 40px rgba(239,68,68,0.4)' : '0 10px 0 rgba(0,0,0,0.15)'
                        }}
                    >
                        <Mic size={56} />
                    </motion.div>
                </div>

                <div className="text-center space-y-2">
                    {isRecording ? (
                        <div className="text-4xl font-black ww-ink tabular-nums tracking-tighter">
                            {formatTime(recordingDuration)}
                        </div>
                    ) : (
                        <div className="text-sm font-black ww-muted uppercase tracking-widest">
                            准备好了吗？
                        </div>
                    )}
                </div>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`px-10 py-5 rounded-[20px] font-black text-base uppercase tracking-[0.2em] transition-all ww-btn ${isRecording ? 'bg-red-500 text-white' : 'ww-btn--accent'}`}
                    style={isRecording ? { boxShadow: '0 6px 0 rgba(153,27,27,0.4)' } : undefined}
                >
                    {isRecording ? (
                        <div className="flex items-center gap-3">
                            <Square size={20} fill="currentColor" />
                            <span>停止录音</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Mic size={20} />
                            <span>开始录音</span>
                        </div>
                    )}
                </motion.button>

                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--ww-stroke-soft)]">
                    <Clock size={14} className="ww-muted" />
                    <p className="text-[10px] ww-muted font-black uppercase tracking-widest">
                        建议挑战时长：{selectedQuestion?.expected_duration} 秒
                    </p>
                </div>
            </div>
        </motion.div>
    );

    const renderEvaluating = () => (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full flex flex-col items-center justify-center p-6"
        >
            <div className="ww-surface ww-surface--soft rounded-[32px] p-12 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-[var(--ww-accent)] to-transparent opacity-5" />
                <motion.div
                    animate={{ 
                        rotate: 360,
                        scale: [1, 1.1, 1]
                    }}
                    transition={{ 
                        rotate: { duration: 3, repeat: Infinity, ease: 'linear' },
                        scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
                    }}
                    className="relative z-10"
                >
                    <div className="w-24 h-24 rounded-full border-4 border-dashed border-[var(--ww-accent)] flex items-center justify-center mx-auto">
                        <Loader size={40} className="text-[var(--ww-accent)]" />
                    </div>
                </motion.div>
                <div className="relative z-10 mt-8 space-y-3">
                    <p className="text-xl font-black ww-ink uppercase tracking-widest">AI 大师正在评估...</p>
                    <div className="flex justify-center gap-1">
                        {[0, 1, 2].map(i => (
                            <motion.div
                                key={i}
                                animate={{ opacity: [0, 1, 0] }}
                                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                                className="w-2 h-2 rounded-full bg-[var(--ww-accent)]"
                            />
                        ))}
                    </div>
                    <p className="text-[10px] ww-muted font-black uppercase tracking-[0.2em] mt-4">正在分析发音与流利度</p>
                </div>
            </div>
        </motion.div>
    );

    const renderResult = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 pb-20 custom-scrollbar overflow-y-auto"
        >
            {/* Header */}
            <div className="text-center mb-4 relative">
                <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', damping: 12 }}
                >
                    <Award size={80} className="mx-auto mb-2 text-[var(--ww-accent)]" />
                </motion.div>
                <h2 className="text-2xl font-black ww-ink uppercase tracking-tighter">评估挑战完成!</h2>
                <p className="text-[10px] font-black ww-muted uppercase tracking-[0.3em]">AI 导师已经完成了评分</p>
            </div>

            {/* Total Score & Rewards */}
            <div className="ww-surface ww-surface--soft p-8 rounded-[32px] text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--ww-accent)] to-transparent" />
                
                <p className="text-[10px] font-black ww-muted uppercase tracking-[0.2em] mb-2">最终修行评价</p>
                <div className="relative inline-block mb-6">
                    <p className="text-7xl font-black ww-ink tracking-tighter">
                        {assessmentResult?.total_score}
                    </p>
                    <div className="absolute -right-6 bottom-2 bg-[var(--ww-stroke)] text-white text-[10px] font-black px-2 py-0.5 rounded-md border border-white/20">
                        PTS
                    </div>
                </div>

                {expAwarded > 0 && (
                    <div className="space-y-3 pt-6 border-t-2 border-[var(--ww-stroke-soft)]">
                        <div className="flex justify-center gap-4">
                            <motion.div
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-50 border-2 border-emerald-500/20 text-emerald-600"
                            >
                                <Zap size={18} fill="currentColor" />
                                <span className="text-sm font-black">+{expAwarded} EXP</span>
                            </motion.div>
                            <motion.div
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-50 border-2 border-amber-500/20 text-amber-600"
                            >
                                <Trophy size={18} fill="currentColor" />
                                <span className="text-sm font-black">+{expAwarded / 2} GOLD</span>
                            </motion.div>
                        </div>
                        <p className="text-[9px] ww-muted font-black uppercase tracking-widest italic">
                            基于 {assessmentResult?.sentence_count || 0} 个有效语句的深度分析
                        </p>
                    </div>
                )}
            </div>

            {/* Detailed Scores */}
            <div className="space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] ww-muted ml-1">
                    维度拆解
                </h3>
                <div className="grid grid-cols-1 gap-3">
                    {[
                        { label: '发音准确度', score: assessmentResult?.pronunciation_score },
                        { label: '口语流畅度', score: assessmentResult?.fluency_score },
                        { label: '词汇丰富度', score: assessmentResult?.vocabulary_score },
                        { label: '内容完整性', score: assessmentResult?.content_score },
                        { label: '挑战契合度', score: assessmentResult?.on_topic_score },
                    ].map((item, index) => (
                        <div key={index} className="ww-surface ww-surface--soft p-4 rounded-[22px] flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-[var(--ww-stroke-soft)] flex items-center justify-center shrink-0">
                                <span className="text-xs font-black ww-ink">{index + 1}</span>
                            </div>
                            <div className="flex-1 space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black ww-ink uppercase tracking-wider">
                                        {item.label}
                                    </span>
                                    <span className="text-xs font-black ww-ink">
                                        {item.score}%
                                    </span>
                                </div>
                                <div className="w-full h-2 rounded-full bg-[var(--ww-stroke-soft)] overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${item.score}%` }}
                                        transition={{ duration: 1, delay: 0.2 + index * 0.1 }}
                                        className="h-full bg-[var(--ww-accent)]"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Feedback */}
            <div className="ww-surface ww-surface--soft p-6 rounded-[28px] relative overflow-hidden bg-white/40">
                <div className="absolute -right-4 -bottom-4 opacity-5 rotate-12">
                    <History size={100} />
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] ww-muted mb-3 flex items-center gap-2">
                    <CheckCircle size={14} className="text-emerald-500" />
                    导师改进建议
                </h3>
                <p className="text-sm ww-ink leading-relaxed font-medium relative z-10">
                    {assessmentResult?.feedback_text}
                </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={resetToSelection}
                    className="py-4 rounded-2xl ww-btn ww-btn--ink text-[11px]"
                >
                    再来一题
                </motion.button>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                        resetToSelection();
                        onClose?.();
                    }}
                    className="py-4 rounded-2xl ww-btn ww-btn--accent text-[11px]"
                >
                    完成
                </motion.button>
            </div>
        </motion.div>
    );

    const renderHistory = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 pb-20 custom-scrollbar overflow-y-auto"
        >
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black ww-ink uppercase tracking-wider">做题记录</h2>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                        setViewState('selection');
                        setSelectedHistoryItem(null);
                    }}
                    className="ww-btn ww-btn--ink px-4 py-2 rounded-xl text-[10px] flex items-center gap-2"
                >
                    <ArrowLeft size={16} />
                    <span>返回</span>
                </motion.button>
            </div>

            {assessmentHistory.length === 0 ? (
                <div className="text-center py-20 ww-surface ww-surface--soft rounded-[22px] border-dashed border-4 border-[var(--ww-stroke-soft)] bg-transparent">
                    <History size={48} className="mx-auto mb-4 opacity-20 ww-ink" />
                    <p className="text-sm font-black ww-muted uppercase tracking-widest">还没有任何记录</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {assessmentHistory.map((assessment) => (
                        <motion.button
                            key={assessment.id}
                            whileHover={{ scale: 1.01, x: 4 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => setSelectedHistoryItem(assessment)}
                            className="w-full p-5 rounded-[22px] text-left transition-all ww-surface ww-surface--soft hover:border-[var(--ww-accent)] group"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase bg-[var(--ww-stroke-soft)] ww-muted">
                                            {assessment.question?.difficulty || '未知难度'}
                                        </span>
                                        <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase bg-[var(--ww-stroke-soft)] ww-muted">
                                            {new Date(assessment.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-sm font-black ww-ink truncate group-hover:text-[var(--ww-bg-1)] transition-colors">
                                        {assessment.question?.question_text || '题目内容已失效'}
                                    </p>
                                </div>
                                <div className="text-right shrink-0">
                                    <div className="text-2xl font-black ww-ink leading-none">
                                        {assessment.total_score}
                                    </div>
                                    <div className="text-[10px] font-black ww-muted uppercase mt-1">得分</div>
                                </div>
                            </div>
                        </motion.button>
                    ))}
                </div>
            )}

            {/* History Detail Modal */}
            <AnimatePresence>
                {selectedHistoryItem && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={() => setSelectedHistoryItem(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="ww-surface ww-surface--soft rounded-[32px] p-8 max-w-md w-full max-h-[85vh] overflow-y-auto relative"
                        >
                            <div className="text-center mb-8">
                                <div className="inline-block px-4 py-1 rounded-full bg-[var(--ww-stroke-soft)] text-[10px] font-black ww-muted uppercase tracking-widest mb-4">
                                    {new Date(selectedHistoryItem.created_at).toLocaleString()}
                                </div>
                                <div className="relative inline-block">
                                    <Trophy size={48} className="text-[var(--ww-accent)] absolute -top-8 -right-8 rotate-12 opacity-20" />
                                    <p className="text-6xl font-black ww-ink tracking-tighter">
                                        {selectedHistoryItem.total_score}
                                    </p>
                                    <p className="text-[10px] font-black ww-muted uppercase tracking-[0.3em] mt-1">综合评分</p>
                                </div>
                            </div>

                            <div className="space-y-4 mb-8">
                                {[
                                    { label: '发音准确度', score: selectedHistoryItem.pronunciation_score },
                                    { label: '口语流畅度', score: selectedHistoryItem.fluency_score },
                                    { label: '词汇运用', score: selectedHistoryItem.vocabulary_score },
                                    { label: '内容完整性', score: selectedHistoryItem.content_score },
                                    { label: '切题程度', score: selectedHistoryItem.on_topic_score },
                                ].map((item, index) => (
                                    <div key={index} className="space-y-1.5">
                                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider">
                                            <span className="ww-muted">{item.label}</span>
                                            <span className="ww-ink">{item.score}</span>
                                        </div>
                                        <div className="h-2 rounded-full bg-[var(--ww-stroke-soft)] overflow-hidden border border-[var(--ww-stroke-soft)]">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${item.score}%` }}
                                                className="h-full bg-[var(--ww-accent)]"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-5 rounded-[22px] mb-8 bg-[rgba(255,255,255,0.4)] border-2 border-[var(--ww-stroke-soft)] relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-2 opacity-5">
                                    <Award size={40} />
                                </div>
                                <h4 className="text-[10px] font-black ww-muted uppercase tracking-widest mb-3">导师点评</h4>
                                <p className="text-sm ww-ink leading-relaxed font-medium">
                                    {selectedHistoryItem.feedback_text}
                                </p>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setSelectedHistoryItem(null)}
                                className="w-full py-4 rounded-2xl ww-btn ww-btn--accent text-[12px]"
                            >
                                确认并关闭
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );

    return (
        <div className="h-full flex flex-col">
            <AnimatePresence mode="wait">
                {viewState === 'selection' && <div key="selection">{renderSelection()}</div>}
                {viewState === 'recording' && <div key="recording">{renderRecording()}</div>}
                {viewState === 'evaluating' && <div key="evaluating">{renderEvaluating()}</div>}
                {viewState === 'result' && <div key="result">{renderResult()}</div>}
                {viewState === 'history' && <div key="history">{renderHistory()}</div>}
            </AnimatePresence>

            <XPNotification
                amount={expAwarded}
                gold={goldAwarded}
                isVisible={showXPNotification}
                onClose={() => setShowXPNotification(false)}
                title="挑战修行奖励"
            />
        </div>
    );
};

export default SpeakingAssessment;
