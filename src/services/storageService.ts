import { Article, CEFRLevel, ReaderSettings, SavedWord, SRSStage, UserProfile, QuizSubmission } from '../types';
import { CURATED_ARTICLES } from '../data/curatedArticles';

const STORAGE_KEYS = {
  USER_PROFILE: 'lexipulse_user_profile_v1',
  SAVED_WORDS: 'lexipulse_saved_words_v1',
  CUSTOM_ARTICLES: 'lexipulse_custom_articles_v1',
  READER_SETTINGS: 'lexipulse_reader_settings_v1',
  READING_LOG: 'lexipulse_reading_log_v1',
};

const DEFAULT_PROFILE: UserProfile = {
  targetLevel: 'B1',
  dailyGoalArticles: 1,
  dailyGoalMinutes: 10,
  currentStreak: 1,
  bestStreak: 1,
  totalWordsLearned: 0,
  totalArticlesRead: 0,
  totalReadingSeconds: 0,
  xp: 120,
  lastActiveDate: new Date().toISOString().split('T')[0],
  completedArticleIds: [],
  quizHistory: [],
};

const DEFAULT_READER_SETTINGS: ReaderSettings = {
  fontSize: 'base',
  fontFamily: 'sans',
  theme: 'light',
  speechSpeed: 1.0,
  highlightVocab: true,
};

export const StorageService = {
  // --- Profile & Streaks ---
  getUserProfile(): UserProfile {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      if (!stored) {
        this.saveUserProfile(DEFAULT_PROFILE);
        return DEFAULT_PROFILE;
      }
      const parsed: UserProfile = JSON.parse(stored);
      // Check streak validity based on today's date
      const today = new Date().toISOString().split('T')[0];
      if (parsed.lastActiveDate !== today) {
        const lastDate = new Date(parsed.lastActiveDate);
        const currentDate = new Date(today);
        const diffDays = Math.round((currentDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
        if (diffDays === 1) {
          // Continuous day, keep streak
        } else if (diffDays > 1) {
          // Broken streak
          parsed.currentStreak = 1;
        }
      }
      return parsed;
    } catch {
      return DEFAULT_PROFILE;
    }
  },

  saveUserProfile(profile: UserProfile): void {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.error('Failed to save user profile:', e);
    }
  },

  updateTargetLevel(level: CEFRLevel): UserProfile {
    const profile = this.getUserProfile();
    profile.targetLevel = level;
    this.saveUserProfile(profile);
    return profile;
  },

  recordArticleCompleted(articleId: string, readingSeconds: number): UserProfile {
    const profile = this.getUserProfile();
    const today = new Date().toISOString().split('T')[0];

    if (!profile.completedArticleIds.includes(articleId)) {
      profile.completedArticleIds.push(articleId);
      profile.totalArticlesRead += 1;
      profile.xp += 50; // XP for reading completion
    }

    profile.totalReadingSeconds += readingSeconds;

    if (profile.lastActiveDate !== today) {
      const lastDate = new Date(profile.lastActiveDate);
      const currentDate = new Date(today);
      const diffDays = Math.round((currentDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
      if (diffDays === 1) {
        profile.currentStreak += 1;
      } else {
        profile.currentStreak = 1;
      }
      if (profile.currentStreak > profile.bestStreak) {
        profile.bestStreak = profile.currentStreak;
      }
      profile.lastActiveDate = today;
    }

    this.saveUserProfile(profile);
    return profile;
  },

  recordQuizSubmission(submission: QuizSubmission): UserProfile {
    const profile = this.getUserProfile();
    profile.quizHistory.push(submission);
    // XP awarded based on score percentage
    const xpGained = Math.round((submission.score / submission.totalQuestions) * 100);
    profile.xp += xpGained;
    this.saveUserProfile(profile);
    return profile;
  },

  // --- Vocabulary Bank & Spaced Repetition (SRS) ---
  getSavedWords(): SavedWord[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SAVED_WORDS);
      if (!stored) {
        // Seed with a few initial words from B1/B2
        const initialSeed: SavedWord[] = [
          {
            id: 'word-1',
            word: 'resilience',
            phonetic: '/rɪˈzɪl.jəns/',
            partOfSpeech: 'noun',
            definition: 'The capacity to recover quickly from difficulties; toughness.',
            cefrLevel: 'B1',
            exampleUsage: 'Mental resilience helps learners thrive during setbacks.',
            dateAdded: new Date().toISOString(),
            srsStage: 'learning',
            nextReviewDate: new Date().toISOString(),
            timesReviewed: 1,
            correctCount: 1,
          },
          {
            id: 'word-2',
            word: 'conundrum',
            phonetic: '/kəˈnʌn.drəm/',
            partOfSpeech: 'noun',
            definition: 'A confusing and difficult problem or question.',
            cefrLevel: 'C1',
            exampleUsage: 'The ethical conundrum required thoughtful deliberation.',
            dateAdded: new Date().toISOString(),
            srsStage: 'new',
            nextReviewDate: new Date().toISOString(),
            timesReviewed: 0,
            correctCount: 0,
          },
        ];
        this.saveWords(initialSeed);
        return initialSeed;
      }
      return JSON.parse(stored);
    } catch {
      return [];
    }
  },

  saveWords(words: SavedWord[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SAVED_WORDS, JSON.stringify(words));
      const profile = this.getUserProfile();
      profile.totalWordsLearned = words.filter(w => w.srsStage === 'mastered').length;
      this.saveUserProfile(profile);
    } catch (e) {
      console.error('Failed to save vocabulary words:', e);
    }
  },

  addWordToBank(wordData: Omit<SavedWord, 'id' | 'dateAdded' | 'srsStage' | 'nextReviewDate' | 'timesReviewed' | 'correctCount'>): SavedWord {
    const words = this.getSavedWords();
    const existing = words.find(w => w.word.toLowerCase() === wordData.word.toLowerCase());
    if (existing) {
      return existing;
    }

    const now = new Date();
    const newWord: SavedWord = {
      ...wordData,
      id: `vocab-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      dateAdded: now.toISOString(),
      srsStage: 'new',
      nextReviewDate: now.toISOString(),
      timesReviewed: 0,
      correctCount: 0,
    };

    words.unshift(newWord);
    this.saveWords(words);

    // XP boost for collecting vocabulary
    const profile = this.getUserProfile();
    profile.xp += 15;
    this.saveUserProfile(profile);

    return newWord;
  },

  removeWordFromBank(wordId: string): void {
    const words = this.getSavedWords();
    const filtered = words.filter(w => w.id !== wordId);
    this.saveWords(filtered);
  },

  updateWordSRS(wordId: string, performance: 'again' | 'hard' | 'good' | 'easy'): SavedWord | null {
    const words = this.getSavedWords();
    const idx = words.findIndex(w => w.id === wordId);
    if (idx === -1) return null;

    const word = words[idx];
    word.timesReviewed += 1;

    const now = new Date();
    let daysToAdd = 1;
    let nextStage: SRSStage = word.srsStage;

    switch (performance) {
      case 'again':
        nextStage = 'learning';
        daysToAdd = 0.5; // review in 12 hours
        break;
      case 'hard':
        if (word.srsStage === 'new') nextStage = 'learning';
        daysToAdd = 1;
        word.correctCount += 1;
        break;
      case 'good':
        if (word.srsStage === 'new') nextStage = 'learning';
        else if (word.srsStage === 'learning') nextStage = 'review';
        else if (word.srsStage === 'review' && word.correctCount >= 3) nextStage = 'mastered';
        word.correctCount += 1;
        daysToAdd = word.srsStage === 'new' ? 1 : word.srsStage === 'learning' ? 3 : 7;
        break;
      case 'easy':
        if (word.srsStage === 'new' || word.srsStage === 'learning') nextStage = 'review';
        else nextStage = 'mastered';
        word.correctCount += 2;
        daysToAdd = nextStage === 'mastered' ? 14 : 5;
        break;
    }

    word.srsStage = nextStage;
    const nextDate = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    word.nextReviewDate = nextDate.toISOString();

    words[idx] = word;
    this.saveWords(words);

    // Give XP for SRS flashcard review
    const profile = this.getUserProfile();
    profile.xp += performance === 'again' ? 5 : 15;
    this.saveUserProfile(profile);

    return word;
  },

  // --- Articles Library ---
  getAllArticles(): Article[] {
    const custom = this.getCustomArticles();
    return [...custom, ...CURATED_ARTICLES];
  },

  getCustomArticles(): Article[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CUSTOM_ARTICLES);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  saveCustomArticle(article: Article): void {
    try {
      const custom = this.getCustomArticles();
      const updated = [article, ...custom.filter(a => a.id !== article.id)];
      localStorage.setItem(STORAGE_KEYS.CUSTOM_ARTICLES, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save custom article:', e);
    }
  },

  getArticleById(id: string): Article | undefined {
    const all = this.getAllArticles();
    return all.find(a => a.id === id);
  },

  // --- Reader Settings ---
  getReaderSettings(): ReaderSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.READER_SETTINGS);
      return stored ? JSON.parse(stored) : DEFAULT_READER_SETTINGS;
    } catch {
      return DEFAULT_READER_SETTINGS;
    }
  },

  saveReaderSettings(settings: ReaderSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.READER_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save reader settings:', e);
    }
  },
};
