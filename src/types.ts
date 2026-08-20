export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface CEFRLevelInfo {
  level: CEFRLevel;
  name: string;
  badgeColor: string;
  tagline: string;
  description: string;
  estimatedVocab: string;
  readingSpeedWPM: string;
  targetDescriptors: string[];
}

export interface TargetVocabularyItem {
  word: string;
  phonetic: string;
  partOfSpeech: string;
  definition: string;
  cefrLevel: CEFRLevel | string;
  exampleInArticle?: string;
  exampleUsage: string;
  synonyms?: string[];
  collocations?: string[];
}

export type QuestionType = 'multiple_choice' | 'true_false' | 'vocab_context' | 'open_ended';

export interface ComprehensionQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  hint?: string;
}

export interface Article {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  level: CEFRLevel;
  estimatedReadTimeMinutes: number;
  wordCount: number;
  summary: string;
  paragraphs: string[];
  targetVocabulary: TargetVocabularyItem[];
  comprehensionQuestions: ComprehensionQuestion[];
  funFact?: string;
  createdAt: string;
  isAiGenerated?: boolean;
  coverImageTheme?: string;
}

export type SRSStage = 'new' | 'learning' | 'review' | 'mastered';

export interface SavedWord {
  id: string;
  word: string;
  phonetic: string;
  partOfSpeech: string;
  definition: string;
  cefrLevel: string;
  exampleUsage: string;
  articleTitle?: string;
  articleId?: string;
  dateAdded: string;
  srsStage: SRSStage;
  nextReviewDate: string;
  timesReviewed: number;
  correctCount: number;
  notes?: string;
}

export interface QuizSubmission {
  articleId: string;
  timestamp: string;
  score: number;
  totalQuestions: number;
  answers: Record<string, string>;
  openResponseFeedback?: SummaryEvaluationResponse;
}

export interface SummaryEvaluationResponse {
  score: number;
  comprehensionAccuracy: string;
  feedbackSummary: string;
  strengths: string[];
  areasForImprovement: string[];
  grammarSuggestions: Array<{
    originalPart: string;
    improvedPart: string;
    reason: string;
  }>;
  recommendedVocabulary?: Array<{
    word: string;
    howToUse: string;
  }>;
}

export interface UserProfile {
  targetLevel: CEFRLevel;
  dailyGoalArticles: number;
  dailyGoalMinutes: number;
  currentStreak: number;
  bestStreak: number;
  totalWordsLearned: number;
  totalArticlesRead: number;
  totalReadingSeconds: number;
  xp: number;
  lastActiveDate: string;
  completedArticleIds: string[];
  quizHistory: QuizSubmission[];
}

export interface ReaderSettings {
  fontSize: 'sm' | 'base' | 'lg' | 'xl';
  fontFamily: 'sans' | 'serif' | 'mono';
  theme: 'light' | 'sepia' | 'slate' | 'midnight';
  speechSpeed: number;
  highlightVocab: boolean;
}

export interface PlacementQuestion {
  id: string;
  level: CEFRLevel;
  passageOrPrompt: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}
