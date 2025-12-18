
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, LogOut, Bell, Coins, User, LayoutDashboard, Swords, PenTool, Zap, Settings } from 'lucide-react';
import { INITIAL_STATS, NAVIGATION } from './constants.tsx';
import { UserStats, Rank } from './types';

// Components
import StatsPanel from './components/StatsPanel';
import VocabTraining from './components/VocabTraining';
import SkillsTraining from './components/SkillsTraining';
import BattleArena from './components/BattleArena';
import AdminPanel from './components/AdminPanel';

const App: React.FC = () => {
  const [stats, setStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem('ww_stats');
    return saved ? JSON.parse(saved) : INITIAL_STATS;
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('ww_stats', JSON.stringify(stats));
  }, [stats]);

  const handleGainExp = (exp: number, statType?: 'atk' | 'def' | 'crit' | 'hp') => {
    setStats(prev => {
      let newStats = { ...prev, exp: prev.exp + exp };
      if (newStats.exp >= prev.level * 100) {
        newStats.exp -= prev.level * 100;
        newStats.level += 1;
        newStats.maxHp += 10;
        newStats.hp = newStats.maxHp;
      }
      if (statType) {
        if (statType === 'crit') newStats.crit += 0.001;
        else (newStats as any)[statType] += 1;
      }
      return newStats;
    });
  };

  const handleBattleWin = () => {
    handleGainExp(50);
    setStats(prev => ({
      ...prev,
      rankPoints: prev.rankPoints + 1,
      winStreak: prev.winStreak + 1,
    }));
    setActiveTab('dashboard');
  };

  const handleBattleLoss = () => {
    setStats(prev => ({
      ...prev,
      winStreak: 0,
      rankPoints: Math.max(0, prev.rankPoints - (prev.rank === Rank.BRONZE ? 0 : 1)),
    }));
    setActiveTab('dashboard');
  };

  const renderContent = () => {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="h-full"
        >
          {(() => {
            switch (activeTab) {
              case 'dashboard':
                return (
                  <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 pt-8">
                    <div className="lg:col-span-7 space-y-12">
                      <header className="space-y-2">
                        <h1 className="text-5xl font-black rpg-font tracking-tight uppercase">单词战士</h1>
                        <p className="text-slate-500 font-medium">日为书生，夜为角斗士。字典即是你的利刃。</p>
                      </header>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-1">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">词汇量</span>
                          <p className="text-3xl font-black rpg-font">1,248 <span className="text-xs text-slate-600">单词</span></p>
                        </div>
                        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-1">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">胜率</span>
                          <p className="text-3xl font-black rpg-font">72 <span className="text-xs text-slate-600">%</span></p>
                        </div>
                      </div>

                      <div className="bg-indigo-600 p-8 rounded-[2rem] text-white flex justify-between items-center group cursor-pointer hover:bg-indigo-500 transition-all" onClick={() => setActiveTab('pvp')}>
                        <div className="space-y-1">
                          <h3 className="text-2xl font-black rpg-font uppercase">进入竞技场</h3>
                          <p className="text-indigo-200 text-sm">挑战 AI，进行实时口语对决。</p>
                        </div>
                        <Zap size={32} className="group-hover:scale-125 transition-transform" />
                      </div>
                    </div>
                    
                    <div className="lg:col-span-5">
                      <div className="bg-slate-900/50 p-8 rounded-[2rem] border border-slate-800/50 backdrop-blur-sm">
                        <StatsPanel stats={stats} />
                      </div>
                    </div>
                  </div>
                );
              case 'vocab':
                return <VocabTraining onMastered={(word) => handleGainExp(5, 'atk')} />;
              case 'skills':
                return <SkillsTraining onSuccess={(exp, type) => handleGainExp(exp, type as any)} />;
              case 'pvp':
                return <BattleArena playerStats={stats} onVictory={handleBattleWin} onDefeat={handleBattleLoss} />;
              case 'admin':
                return <AdminPanel onUpdateStats={(s) => setStats(prev => ({ ...prev, ...s }))} />;
              default:
                return null;
            }
          })()}
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div className="h-screen flex flex-col lg:flex-row bg-[#020617] text-slate-200">
      {/* Sidebar Mobile Navigation */}
      <div className="lg:hidden flex items-center justify-between p-6 border-b border-slate-900">
        <div className="rpg-font font-black text-xl tracking-widest">WW</div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Desktop Sidebar */}
      <aside className={`fixed inset-0 z-50 lg:relative lg:z-auto w-72 bg-[#020617] border-r border-slate-900 p-8 flex flex-col transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-16 flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded flex items-center justify-center font-black text-black">W</div>
          <span className="rpg-font font-black tracking-widest text-lg">战士之路</span>
        </div>

        <nav className="flex-1 space-y-1">
          {NAVIGATION.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-xs font-black tracking-widest uppercase transition-all ${activeTab === item.id ? 'bg-white text-black' : 'text-slate-500 hover:text-slate-200'}`}
            >
              {item.icon}
              {item.name}
            </button>
          ))}
        </nav>

        <div className="pt-8 border-t border-slate-900">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
              <User size={18} className="text-slate-500" />
            </div>
            <div>
              <p className="text-[10px] font-black tracking-widest text-slate-500 uppercase">学者</p>
              <p className="text-xs font-bold truncate max-w-[120px]">player@exam.edu</p>
            </div>
          </div>
          <button className="flex items-center gap-3 text-[10px] font-black tracking-widest text-slate-700 hover:text-red-400 uppercase transition-colors">
            <LogOut size={14} /> 结束会话
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative flex flex-col">
        <header className="hidden lg:flex items-center justify-between px-12 py-8">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <Coins size={14} className="text-amber-500" />
              <span className="text-[10px] font-black tracking-widest">1,450 XP</span>
            </div>
            <div className="text-[10px] font-black tracking-widest text-slate-700">当前区域: 亚洲-北部</div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-black tracking-[0.2em] text-slate-600 uppercase mb-1">专注度</span>
              <div className="w-32 h-1 bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 w-[85%]" />
              </div>
            </div>
            <button className="text-slate-500 hover:text-white transition-colors">
              <Bell size={18} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 lg:px-12 pb-12 custom-scrollbar">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
