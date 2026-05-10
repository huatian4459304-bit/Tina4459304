import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Headphones, 
  Video, 
  LayoutDashboard, 
  Search, 
  Plus, 
  TrendingUp, 
  Settings,
  X,
  CheckCircle2,
  ChevronRight,
  PlusCircle,
  Hash
} from 'lucide-react';
import { cn } from './lib/utils';
import { ImmersionLog, UserProfile, VocabularyItem, MediaType, ContentRecommendation } from './types';
import { persistence } from './services/persistence';
import { getRecommendations, defineWord } from './services/ai';
import { format, startOfDay, subDays, isWithinInterval, endOfDay } from 'date-fns';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'logs' | 'discovery' | 'vocabulary'>('dashboard');
  const [profile, setProfile] = useState<UserProfile>(persistence.getProfile());
  const [logs, setLogs] = useState<ImmersionLog[]>(persistence.getLogs());
  const [vocab, setVocab] = useState<VocabularyItem[]>(persistence.getVocab());
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    // Initial data load
    setProfile(persistence.getProfile());
    setLogs(persistence.getLogs());
    setVocab(persistence.getVocab());
  }, []);

  const handleAddLog = (newLog: Omit<ImmersionLog, 'id'>) => {
    const saved = persistence.addLog(newLog);
    setLogs([saved, ...logs]);
    setShowAddModal(false);
  };

  const handleAddVocab = (newItem: Omit<VocabularyItem, 'id'>) => {
    const saved = persistence.addVocab(newItem);
    setVocab([saved, ...vocab]);
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] text-[#e2e8f0] font-sans selection:bg-amber-500/30">
      {/* Navigation Rail - Desktop */}
      <nav className="fixed left-0 top-0 h-full w-20 border-r border-white/5 bg-[#11141b] hidden md:flex flex-col items-center py-8 gap-8 z-50">
        <div className="w-10 h-10 bg-amber-500 text-black flex items-center justify-center rounded-xl font-serif font-bold text-xl mb-4">
          L
        </div>
        <NavIcon icon={LayoutDashboard} active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
        <NavIcon icon={PlusCircle} active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} />
        <NavIcon icon={Search} active={activeTab === 'discovery'} onClick={() => setActiveTab('discovery')} />
        <NavIcon icon={Hash} active={activeTab === 'vocabulary'} onClick={() => setActiveTab('vocabulary')} />
        <div className="mt-auto">
          <NavIcon icon={Settings} active={false} onClick={() => {}} />
        </div>
      </nav>

      {/* Main Content */}
      <main className="md:pl-20 min-h-screen pb-20 md:pb-0">
        <header className="px-6 py-8 md:px-12 md:py-12 border-b border-white/5 flex justify-between items-end max-w-7xl mx-auto bg-[#0a0c10]/80 backdrop-blur-md sticky top-0 z-40">
          <div>
            <h1 className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-500 mb-2">
              {format(new Date(), 'EEEE, MMMM do')}
            </h1>
            <h2 className="text-3xl md:text-5xl font-serif italic text-white">
              Good morning, {profile.name}
            </h2>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="w-12 h-12 md:w-16 md:h-16 bg-amber-500 text-black rounded-full flex items-center justify-center hover:scale-105 transition-all active:scale-95 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
          >
            <Plus size={32} />
          </button>
        </header>

        <div className="px-6 md:px-12 max-w-7xl mx-auto mt-12">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              >
                {/* Daily Goal Card */}
                <div className="bg-[#11141b] border border-white/5 p-8 rounded-[32px] lg:col-span-1">
                  <div className="flex justify-between items-start mb-8">
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500">Daily Goal</h3>
                    <TrendingUp className="text-amber-500" size={20} />
                  </div>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-6xl font-serif italic text-white">
                      {logs.filter(l => isWithinInterval(l.timestamp, { start: startOfDay(new Date()), end: endOfDay(new Date()) }))
                        .reduce((acc, l) => acc + l.duration, 0)}
                    </span>
                    <span className="text-slate-400">/ {profile.dailyGoalMinutes} min</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <motion.div 
                      className="bg-amber-500 h-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (logs.filter(l => isWithinInterval(l.timestamp, { start: startOfDay(new Date()), end: endOfDay(new Date()) }))
                        .reduce((acc, l) => acc + l.duration, 0) / profile.dailyGoalMinutes) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Progress Chart */}
                <div className="bg-[#11141b] border border-white/5 p-8 rounded-[32px] lg:col-span-2 min-h-[300px]">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-8">7-Day Progress</h3>
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getLast7DaysData(logs)}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                        <YAxis hide />
                        <Tooltip 
                          cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                          contentStyle={{ backgroundColor: '#1a1f28', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
                          itemStyle={{ color: '#f59e0b' }}
                        />
                        <Bar dataKey="minutes" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Recent History */}
                <div className="lg:col-span-3">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-serif text-slate-200">Recent Immersion</h3>
                    <button className="text-xs uppercase tracking-widest text-slate-500 hover:text-amber-500 flex items-center gap-1 group transition-colors">
                      View all <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {logs.slice(0, 3).map((log) => (
                      <LogCard key={log.id} log={log} />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'discovery' && (
              <DiscoveryTab profile={profile} />
            )}

            {activeTab === 'vocabulary' && (
              <VocabularyTab vocab={vocab} onAddVocab={handleAddVocab} />
            )}

            {activeTab === 'logs' && (
              <motion.div
                key="logs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12"
              >
                {logs.map((log) => (
                  <LogCard key={log.id} log={log} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Nav */}
      <nav className="fixed bottom-0 left-0 w-full bg-[#11141b] border-t border-white/5 px-6 py-4 flex justify-between md:hidden z-50 backdrop-blur-lg bg-opacity-90">
        <NavIcon icon={LayoutDashboard} active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
        <NavIcon icon={Search} active={activeTab === 'discovery'} onClick={() => setActiveTab('discovery')} />
        <NavIcon icon={Hash} active={activeTab === 'vocabulary'} onClick={() => setActiveTab('vocabulary')} />
        <NavIcon icon={PlusCircle} active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} />
      </nav>

      {/* Add Log Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)}>
        <AddLogForm onAdd={handleAddLog} />
      </Modal>
    </div>
  );
}

function NavIcon({ icon: Icon, active, onClick }: { icon: any, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "p-3 rounded-2xl transition-all duration-300",
        active ? "bg-amber-500/20 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.1)]" : "text-slate-500 hover:bg-white/5 hover:text-white"
      )}
    >
      <Icon size={24} />
    </button>
  );
}

interface LogCardProps {
  log: ImmersionLog;
  key?: React.Key;
}

function LogCard({ log }: LogCardProps) {
  const icons = {
    read: BookOpen,
    listen: Headphones,
    watch: Video
  };
  const Icon = icons[log.type];

  return (
    <div className="bg-[#11141b] border border-white/5 p-6 rounded-3xl hover:border-amber-500/30 transition-all group cursor-pointer hover:bg-[#1a1f28]">
      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-black transition-all">
          <Icon size={24} />
        </div>
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{format(log.timestamp, 'MMM dd')}</span>
      </div>
      <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">{log.type}</p>
      <h4 className="text-xl font-serif text-white mb-2 line-clamp-1 group-hover:text-amber-500 transition-colors">{log.title}</h4>
      <div className="flex items-center gap-4 text-[10px] text-slate-400 font-medium uppercase tracking-widest">
        <span className="italic font-serif text-white text-sm">{log.duration} MIN</span>
        <span className="w-1 h-1 bg-white/10 rounded-full" />
        <span className="text-amber-500/80">LVL {log.difficulty}</span>
      </div>
      {log.notes && (
        <p className="mt-4 text-sm text-slate-500 line-clamp-2 italic border-l border-white/10 pl-4 capitalize leading-relaxed">
          {log.notes}
        </p>
      )}
    </div>
  );
}

function Modal({ isOpen, onClose, children }: { isOpen: boolean, onClose: () => void, children: React.ReactNode }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-[#11141b] border border-white/10 w-full max-w-lg rounded-[40px] p-8 shadow-2xl relative z-10 overflow-hidden"
          >
            <button onClick={onClose} className="absolute right-8 top-8 text-slate-500 hover:text-white transition-colors">
              <X size={24} />
            </button>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function AddLogForm({ onAdd }: { onAdd: (log: Omit<ImmersionLog, 'id'>) => void }) {
  const [type, setType] = useState<MediaType>('read');
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('');
  const [difficulty, setDifficulty] = useState(3);
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !duration) return;
    onAdd({
      userId: 'user_123',
      type,
      title,
      duration: parseInt(duration),
      difficulty,
      notes,
      timestamp: new Date()
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h3 className="text-3xl font-serif italic text-white mb-8">Add Entry</h3>
      
      <div className="flex gap-4">
        {(['read', 'listen', 'watch'] as MediaType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={cn(
              "flex-1 py-3 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all",
              type === t ? "bg-amber-500 border-amber-500 text-black" : "border-white/5 text-slate-500 hover:border-white/20"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="space-y-5">
        <div>
          <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2 block">Content Title</label>
          <input 
            type="text" 
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="What was the title?"
            className="w-full bg-white/5 border border-white/5 text-white rounded-xl px-6 py-4 focus:outline-none focus:border-amber-500/50 transition-all placeholder:text-slate-700"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2 block">Duration (min)</label>
            <input 
              type="number" 
              value={duration}
              onChange={e => setDuration(e.target.value)}
              placeholder="30"
              className="w-full bg-white/5 border border-white/5 text-white rounded-xl px-6 py-4 focus:outline-none focus:border-amber-500/50 transition-all"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2 block">Difficulty (1-5)</label>
            <select 
              value={difficulty}
              onChange={e => setDifficulty(parseInt(e.target.value))}
              className="w-full bg-white/5 border border-white/5 text-white rounded-xl px-6 py-4 focus:outline-none focus:border-amber-500/50 transition-all appearance-none"
            >
              {[1,2,3,4,5].map(v => <option key={v} value={v} className="bg-[#11141b]">{v}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2 block">Reflections</label>
          <textarea 
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Add context or interesting words..."
            rows={3}
            className="w-full bg-white/5 border border-white/5 text-white rounded-xl px-6 py-4 focus:outline-none focus:border-amber-500/50 transition-all resize-none placeholder:text-slate-700"
          />
        </div>
      </div>

      <button className="w-full bg-amber-500 text-black py-4 rounded-xl font-bold uppercase tracking-tighter hover:bg-amber-400 transition-all flex items-center justify-center gap-2">
        Create Entry
      </button>
    </form>
  );
}

function DiscoveryTab({ profile }: { profile: UserProfile }) {
  const [recommendations, setRecommendations] = useState<ContentRecommendation[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRecommendations = async () => {
    setLoading(true);
    const results = await getRecommendations(profile.interests, profile.currentLevel);
    setRecommendations(results);
    setLoading(false);
  };

  useEffect(() => {
    fetchRecommendations();
  }, [profile]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-12 pb-20"
    >
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-3xl font-serif italic text-white mb-2">Curated Discovery</h3>
          <p className="text-slate-500 uppercase tracking-widest text-[10px] font-bold">Tailored for your {profile.currentLevel} level</p>
        </div>
        <button 
          onClick={fetchRecommendations}
          disabled={loading}
          className="px-6 py-2 border border-white/5 rounded text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-all disabled:opacity-50"
        >
          {loading ? 'Discovering...' : 'Refresh'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 bg-white/5 rounded-[32px] animate-pulse border border-white/5" />
          ))
        ) : (
          recommendations.map((rec, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-[#11141b] border border-white/5 p-8 rounded-[32px] flex flex-col hover:border-amber-500/30 transition-all group"
            >
              <div className="w-full aspect-video bg-slate-800/50 rounded-lg mb-6 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-700/20 to-slate-900/50 flex items-center justify-center italic text-slate-500 font-serif text-sm">
                  {rec.type.toUpperCase()}
                </div>
              </div>
              <p className="text-[10px] text-amber-500 uppercase tracking-widest mb-1 font-bold">{rec.type}</p>
              <h4 className="text-lg font-medium text-white mb-4 group-hover:text-amber-500 transition-colors leading-snug">{rec.title}</h4>
              <p className="text-sm text-slate-400 flex-grow mb-6 leading-relaxed">
                {rec.description}
              </p>
              <div className="p-4 bg-white/5 border border-white/5 rounded-2xl mb-6 relative overflow-hidden">
                 <div className="absolute -right-4 -top-4 w-12 h-12 bg-amber-500/5 rounded-full blur-xl"></div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Why this fits:</p>
                <p className="text-xs italic text-slate-300 leading-relaxed">{rec.reason}</p>
              </div>
              {rec.url && (
                <a 
                  href={rec.url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="mt-auto py-2 bg-white/5 border border-white/10 rounded text-[10px] uppercase font-bold tracking-widest hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                >
                  Explore <ChevronRight size={12} />
                </a>
              )}
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}

function VocabularyTab({ vocab, onAddVocab }: { vocab: VocabularyItem[], onAddVocab: (v: Omit<VocabularyItem, 'id'>) => void }) {
  const [wordInput, setWordInput] = useState('');
  const [defining, setDefining] = useState(false);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wordInput) return;
    setDefining(true);
    const { definition, example } = await defineWord(wordInput);
    onAddVocab({
      userId: 'user_123',
      word: wordInput,
      definition,
      exampleSentence: example,
      timestamp: new Date()
    });
    setWordInput('');
    setDefining(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-12 pb-20"
    >
      <div className="max-w-xl">
        <h3 className="text-3xl font-serif italic text-white mb-4">Vocabulary Bank</h3>
        <p className="text-slate-400 mb-8 leading-relaxed">Collect expressions and idioms. Let AI bridge the gap between discovery and mastery.</p>
        <form onSubmit={handleLookup} className="relative">
          <input 
            type="text" 
            value={wordInput}
            onChange={e => setWordInput(e.target.value)}
            placeholder="Encounter something new? Type it here..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-5 focus:outline-none focus:border-amber-500/50 text-white transition-all pr-32 placeholder:text-slate-700"
          />
          <button 
            type="submit"
            disabled={defining}
            className="absolute right-2 top-2 bottom-2 px-8 bg-amber-500 text-black rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-amber-400 transition-all disabled:opacity-50"
          >
            {defining ? '...' : 'Add'}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {vocab.map((v) => (
          <motion.div 
            key={v.id}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-6 border border-white/5 rounded-3xl bg-[#11141b] hover:border-white/10 transition-colors"
          >
            <h4 className="text-sm font-bold mb-3 uppercase tracking-widest text-[#e2e8f0]">{v.word}</h4>
            <p className="text-sm text-slate-400 mb-4 leading-relaxed line-clamp-3">{v.definition}</p>
            {v.exampleSentence && (
              <p className="text-xs italic text-amber-500/80 p-3 bg-white/5 rounded-xl border border-white/5">"{v.exampleSentence}"</p>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function getLast7DaysData(logs: ImmersionLog[]) {
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = subDays(new Date(), 6 - i);
    return {
      name: format(d, 'eee'),
      date: d,
      minutes: logs
        .filter(l => isWithinInterval(l.timestamp, { start: startOfDay(d), end: endOfDay(d) }))
        .reduce((acc, l) => acc + l.duration, 0)
    };
  });
  return days;
}
