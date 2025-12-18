
import React from 'react';
import { Swords, Shield, Zap, Heart, Star, BookOpen, Mic2, PenTool, LayoutDashboard, Settings } from 'lucide-react';

export const INITIAL_STATS = {
  level: 1,
  exp: 0,
  atk: 10,
  def: 10,
  crit: 0.05,
  hp: 100,
  maxHp: 100,
  rank: '青铜',
  rankPoints: 0,
  winStreak: 0,
};

export const NAVIGATION = [
  { name: '主页', icon: <LayoutDashboard size={20} />, id: 'dashboard' },
  { name: '词汇突袭', icon: <Swords size={20} />, id: 'vocab' },
  { name: '技能训练', icon: <PenTool size={20} />, id: 'skills' },
  { name: '对决竞技场', icon: <Zap size={20} />, id: 'pvp' },
  { name: '管理后台', icon: <Settings size={20} />, id: 'admin' },
];

export const MOCK_VOCAB_CARDS = [
  { word: 'Abundant', definition: 'Existing or available in large quantities; plentiful.', chinese: '大量的，丰富的' },
  { word: 'Benevolent', definition: 'Well meaning and kindly.', chinese: '仁慈的，好意的' },
  { word: 'Capricious', definition: 'Given to sudden and unaccountable changes of mood or behavior.', chinese: '反复无常的，多变的' },
  { word: 'Diligence', definition: 'Careful and persistent work or effort.', chinese: '勤奋，用功' },
];

export const MOCK_QUESTIONS = [
  {
    id: '1',
    type: 'grammar',
    prompt: '下列哪一个句子在语法上是正确的？',
    options: [
      'He don\'t know the answer.',
      'She has went to the store.',
      'If I were you, I would go.',
      'They was playing football.'
    ],
    correctAnswer: 'If I were you, I would go.',
    difficulty: 2
  },
  {
    id: '2',
    type: 'reading',
    prompt: '阅读这段文字：“工业革命标志着历史的一个重大转折点……” 其主要原因是什么？',
    options: [
      '技术创新',
      '人口增长',
      '战争',
      '饥荒'
    ],
    correctAnswer: '技术创新',
    difficulty: 3
  }
];
