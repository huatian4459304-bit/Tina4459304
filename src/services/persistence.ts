import { ImmersionLog, UserProfile, VocabularyItem } from "../types";

const KEYS = {
  PROFILE: 'lingologs_profile',
  LOGS: 'lingologs_logs',
  VOCAB: 'lingologs_vocab'
};

const DEFAULT_PROFILE: UserProfile = {
  uid: 'user_123',
  name: 'Learner',
  dailyGoalMinutes: 30,
  currentLevel: 'Intermediate',
  interests: ['Technology', 'Nature', 'Cooking'],
  createdAt: new Date()
};

export const persistence = {
  getProfile: (): UserProfile => {
    const data = localStorage.getItem(KEYS.PROFILE);
    if (!data) return DEFAULT_PROFILE;
    return JSON.parse(data);
  },
  
  saveProfile: (profile: UserProfile) => {
    localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
  },
  
  getLogs: (): ImmersionLog[] => {
    const data = localStorage.getItem(KEYS.LOGS);
    if (!data) return [];
    const logs = JSON.parse(data);
    return logs.map((l: any) => ({ ...l, timestamp: new Date(l.timestamp) }));
  },
  
  addLog: (log: Omit<ImmersionLog, 'id'>): ImmersionLog => {
    const logs = persistence.getLogs();
    const newLog = { ...log, id: Math.random().toString(36).substring(7) };
    localStorage.setItem(KEYS.LOGS, JSON.stringify([newLog, ...logs]));
    return newLog;
  },
  
  getVocab: (): VocabularyItem[] => {
    const data = localStorage.getItem(KEYS.VOCAB);
    if (!data) return [];
    const vocab = JSON.parse(data);
    return vocab.map((v: any) => ({ ...v, timestamp: new Date(v.timestamp) }));
  },
  
  addVocab: (item: Omit<VocabularyItem, 'id'>): VocabularyItem => {
    const vocab = persistence.getVocab();
    const newItem = { ...item, id: Math.random().toString(36).substring(7) };
    localStorage.setItem(KEYS.VOCAB, JSON.stringify([newItem, ...vocab]));
    return newItem;
  }
};
