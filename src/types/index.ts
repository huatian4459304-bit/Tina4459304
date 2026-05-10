export type MediaType = 'read' | 'listen' | 'watch';

export interface ImmersionLog {
  id: string;
  userId: string;
  type: MediaType;
  title: string;
  duration: number; // minutes
  contentUrl?: string;
  notes?: string;
  difficulty: number; // 1-5
  timestamp: Date;
}

export interface UserProfile {
  uid: string;
  name: string;
  dailyGoalMinutes: number;
  currentLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  interests: string[];
  createdAt: Date;
}

export interface VocabularyItem {
  id: string;
  userId: string;
  logId?: string;
  word: string;
  definition: string;
  exampleSentence?: string;
  context?: string;
  timestamp: Date;
}

export interface ContentRecommendation {
  title: string;
  type: MediaType;
  description: string;
  url?: string;
  reason: string;
}
