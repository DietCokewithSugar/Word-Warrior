
import React from 'react';
import { Swords, Shield, Zap, Heart, Star, Trophy } from 'lucide-react';
import { UserStats, Rank } from '../types';

interface StatsPanelProps {
  stats: UserStats;
}

const StatsPanel: React.FC<StatsPanelProps> = ({ stats }) => {
  const StatItem = ({ icon: Icon, label, value, max, color }: any) => (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
          <Icon size={12} className={color} /> {label}
        </span>
        <span className="text-xs font-bold">{value}{max ? ` / ${max}` : ''}</span>
      </div>
      <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-700 ease-out ${color.replace('text-', 'bg-')}`} 
          style={{ width: `${Math.min((value / (max || 100)) * 100, 100)}%` }} 
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-10">
      <div className="flex items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-white flex flex-col items-center justify-center text-black shadow-2xl">
          <span className="text-[10px] font-black tracking-tighter -mb-1 uppercase">等级</span>
          <span className="text-3xl font-black rpg-font leading-none">{stats.level}</span>
        </div>
        <div>
          <h2 className="text-2xl font-black rpg-font uppercase tracking-tighter">战士档案</h2>
          <p className="text-xs font-black tracking-[0.2em] text-indigo-400 uppercase">{stats.rank} 阶位</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <StatItem icon={Star} label="成长进度" value={stats.exp} max={stats.level * 100} color="text-white" />
        <StatItem icon={Heart} label="阅读生命 (HP)" value={stats.hp} max={stats.maxHp} color="text-red-500" />
        <StatItem icon={Swords} label="词汇攻击 (ATK)" value={stats.atk} max={stats.level * 20} color="text-blue-500" />
        <StatItem icon={Shield} label="语法防御 (DEF)" value={stats.def} max={stats.level * 20} color="text-green-500" />
        <StatItem icon={Zap} label="口语暴击" value={Math.round(stats.crit * 100)} max={100} color="text-yellow-500" />
      </div>

      <div className="flex justify-around items-center py-6 border-t border-slate-800 pt-8">
        <div className="text-center">
          <Trophy size={20} className="mx-auto text-yellow-500 mb-2" />
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">排位分</p>
          <p className="text-lg font-black rpg-font">{stats.rankPoints}</p>
        </div>
        <div className="w-px h-10 bg-slate-800" />
        <div className="text-center">
          <Zap size={20} className="mx-auto text-indigo-400 mb-2" />
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">连胜数</p>
          <p className="text-lg font-black rpg-font">{stats.winStreak}</p>
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;
