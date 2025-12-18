
import React, { useState } from 'react';
import { Users, Database, ShieldAlert, Edit2, Trash2, Plus } from 'lucide-react';

interface AdminPanelProps {
  onUpdateStats: (newStats: any) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onUpdateStats }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'content'>('users');

  const users = [
    { id: '1', email: 'player@example.com', level: 12, rank: '白银' },
    { id: '2', email: 'warrior@duel.net', level: 45, rank: '最强王者' },
    { id: '3', email: 'newbie@school.cn', level: 1, rank: '青铜' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <ShieldAlert className="text-red-500" /> 管理员控制中心
        </h2>
        <div className="flex bg-slate-800 rounded-lg p-1 text-sm">
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-4 py-1.5 rounded-md transition-all ${activeTab === 'users' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            用户管理
          </button>
          <button 
            onClick={() => setActiveTab('content')}
            className={`px-4 py-1.5 rounded-md transition-all ${activeTab === 'content' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            内容管理 (CMS)
          </button>
        </div>
      </div>

      <div className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden">
        {activeTab === 'users' ? (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900/50 text-xs font-mono text-slate-500 uppercase">
                <th className="px-6 py-4">用户</th>
                <th className="px-6 py-4">等级</th>
                <th className="px-6 py-4">段位</th>
                <th className="px-6 py-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {users.map(u => (
                <tr key={u.id} className="text-sm hover:bg-slate-700/20 transition-colors">
                  <td className="px-6 py-4 flex flex-col">
                    <span className="font-semibold">{u.email}</span>
                    <span className="text-[10px] text-slate-500">ID: {u.id}</span>
                  </td>
                  <td className="px-6 py-4">{u.level}</td>
                  <td className="px-6 py-4">{u.rank}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => onUpdateStats({ level: 99, atk: 999 })}
                      className="text-indigo-400 hover:text-indigo-300 p-2"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button className="text-red-400 hover:text-red-300 p-2">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center space-y-4">
            <Database size={48} className="text-slate-600 mx-auto" />
            <h3 className="text-xl font-bold">内容管理</h3>
            <p className="text-slate-400 text-sm max-w-sm mx-auto">管理特定考试（如 TOEFL, IELTS 等）的词汇库和语法题库。</p>
            <button className="bg-indigo-600 hover:bg-indigo-500 px-6 py-2 rounded-lg font-bold flex items-center gap-2 mx-auto">
              <Plus size={18} /> 添加题目集
            </button>
          </div>
        )}
      </div>
      
      <div className="bg-amber-500/10 border border-amber-500/50 p-4 rounded-xl">
        <h4 className="text-amber-500 font-bold text-sm mb-1 uppercase tracking-wider">上帝模式 快捷键</h4>
        <p className="text-xs text-amber-400">在此演示中，点击任何用户的“编辑”按钮都将当前的玩家属性提升到最大，以进行功能演示。</p>
      </div>
    </div>
  );
};

export default AdminPanel;
