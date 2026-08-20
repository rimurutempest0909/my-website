import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  BookOpen,
  Filter,
  Search,
  CheckCircle2,
  Award,
  Flame,
  Clock,
  ArrowRight,
  TrendingUp,
  Bookmark,
  Layers,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { Article, CEFRLevel, ReaderSettings, SavedWord, UserProfile, QuizSubmission } from './types';
import { StorageService } from './services/storageService';
import { Header } from './components/Header';
import { ArticleCard } from './components/ArticleCard';
import { ReaderView } from './components/ReaderView';
import { ComprehensionQuiz } from './components/ComprehensionQuiz';
import { VocabularyBank } from './components/VocabularyBank';
import { ProgressDashboard } from './components/ProgressDashboard';
import { GenerateArticleModal } from './components/GenerateArticleModal';
import { LevelAssessmentModal } from './components/LevelAssessmentModal';
import { CEFR_LEVELS_MAP, CEFR_LEVELS_ARRAY } from './data/cefrLevels';

export default function App() {
  // Navigation & View States
  const [currentTab, setCurrentTab] = useState<'articles' | 'vocab' | 'analytics' | 'assessment'>('articles');
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);
  const [isQuizActive, setIsQuizActive] = useState<boolean>(false);

  // Modals
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);

  // Persistent User State
  const [userProfile, setUserProfile] = useState<UserProfile>(() => StorageService.getUserProfile());
  const [savedWords, setSavedWords] = useState<SavedWord[]>(() => StorageService.getSavedWords());
  const [articles, setArticles] = useState<Article[]>(() => StorageService.getAllArticles());
  const [readerSettings, setReaderSettings] = useState<ReaderSettings>(() => StorageService.getReaderSettings());

  // Filter States for Daily Articles
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('recommended'); // 'recommended', 'all', or specific CEFR level
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Handle Tab Switch
  const handleTabChange = (tab: 'articles' | 'vocab' | 'analytics' | 'assessment') => {
    setActiveArticle(null);
    setIsQuizActive(false);
    if (tab === 'assessment') {
      setIsAssessmentModalOpen(true);
    } else {
      setCurrentTab(tab);
    }
  };

  // Change Target CEFR Level
  const handleLevelChange = (level: CEFRLevel) => {
    const updated = StorageService.updateTargetLevel(level);
    setUserProfile({ ...updated });
  };

  // Save Word to Vocab Bank
  const handleSaveWord = (wordData: Omit<SavedWord, 'id' | 'dateAdded' | 'srsStage' | 'nextReviewDate' | 'timesReviewed' | 'correctCount'>) => {
    const saved = StorageService.addWordToBank(wordData);
    setSavedWords([...StorageService.getSavedWords()]);
    setUserProfile(StorageService.getUserProfile());
  };

  // Remove Word from Vocab Bank
  const handleRemoveWord = (wordId: string) => {
    StorageService.removeWordFromBank(wordId);
    setSavedWords([...StorageService.getSavedWords()]);
  };

  // Update SRS stage
  const handleUpdateSRS = (wordId: string, performance: 'again' | 'hard' | 'good' | 'easy') => {
    StorageService.updateWordSRS(wordId, performance);
    setSavedWords([...StorageService.getSavedWords()]);
    setUserProfile(StorageService.getUserProfile());
  };

  // Article Completed
  const handleArticleCompleted = (articleId: string, readingSeconds: number) => {
    const updated = StorageService.recordArticleCompleted(articleId, readingSeconds);
    setUserProfile({ ...updated });
  };

  // Quiz Completed
  const handleQuizComplete = (submission: QuizSubmission) => {
    const updated = StorageService.recordQuizSubmission(submission);
    setUserProfile({ ...updated });
  };

  // New Article Generated
  const handleArticleGenerated = (newArticle: Article) => {
    StorageService.saveCustomArticle(newArticle);
    setArticles(StorageService.getAllArticles());
    setActiveArticle(newArticle);
    setIsQuizActive(false);
  };

  // Update Reader Settings
  const handleUpdateReaderSettings = (settings: ReaderSettings) => {
    setReaderSettings(settings);
    StorageService.saveReaderSettings(settings);
  };

  // Filter Articles
  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || article.category === categoryFilter;

    let matchesLevel = true;
    if (levelFilter === 'recommended') {
      matchesLevel = article.level === userProfile.targetLevel;
    } else if (levelFilter !== 'all') {
      matchesLevel = article.level === levelFilter;
    }

    return matchesSearch && matchesCategory && matchesLevel;
  });

  // Daily Featured Article (picks best match for target level)
  const featuredArticle =
    articles.find((a) => a.level === userProfile.targetLevel && !userProfile.completedArticleIds.includes(a.id)) ||
    articles.find((a) => a.level === userProfile.targetLevel) ||
    articles[0];

  const targetLevelInfo = CEFR_LEVELS_MAP[userProfile.targetLevel] || CEFR_LEVELS_MAP.B1;

  // Render Reader or Quiz Views if an article is active
  if (activeArticle) {
    if (isQuizActive) {
      return (
        <div className="min-h-screen bg-[#0A0A0A] text-[#E5E5E5]">
          <ComprehensionQuiz
            article={activeArticle}
            onBackToArticle={() => {
              setIsQuizActive(false);
              setActiveArticle(null);
            }}
            onQuizComplete={handleQuizComplete}
            onSaveWord={handleSaveWord}
          />
        </div>
      );
    }

    return (
      <ReaderView
        article={activeArticle}
        onBack={() => setActiveArticle(null)}
        onStartQuiz={() => setIsQuizActive(true)}
        onSaveWord={handleSaveWord}
        savedWords={savedWords}
        onArticleCompleted={handleArticleCompleted}
        isCompleted={userProfile.completedArticleIds.includes(activeArticle.id)}
        readerSettings={readerSettings}
        onUpdateReaderSettings={handleUpdateReaderSettings}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#E5E5E5] flex flex-col font-sans selection:bg-[#C5A059]/30">
      {/* Navigation Header */}
      <Header
        currentTab={currentTab}
        onTabChange={handleTabChange}
        userProfile={userProfile}
        onLevelChange={handleLevelChange}
        savedWordsCount={savedWords.length}
        onOpenGenerateModal={() => setIsGenerateModalOpen(true)}
        onOpenAssessmentModal={() => setIsAssessmentModalOpen(true)}
      />

      {/* Main Content Areas */}
      <div className="flex-1">
        {currentTab === 'articles' && (
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Daily Recommended Hero Banner */}
            {featuredArticle && (
              <section className="mb-10">
                <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#1C170E] via-[#141414] to-[#0F0F0F] text-[#E5E5E5] p-6 sm:p-10 border border-[#332714] shadow-2xl shadow-black/80">
                  {/* Decorative Subtle Gold Glow */}
                  <div className="absolute top-0 right-0 -mt-12 -mr-12 w-80 h-80 rounded-full bg-[#C5A059]/10 blur-3xl pointer-events-none" />

                  <div className="relative z-10 max-w-3xl">
                    <div className="flex items-center gap-2 flex-wrap mb-3.5">
                      <span className="px-2.5 py-1 rounded-md text-xs font-black bg-[#C5A059] text-[#0A0A0A] tracking-wider uppercase">
                        Today's Featured Reading
                      </span>
                      <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-[#241A0B] text-[#E5C378] border border-[#5E4417]">
                        CEFR {featuredArticle.level} · {targetLevelInfo.name}
                      </span>
                      <span className="text-xs text-[#999999] font-medium">
                        {featuredArticle.category} · {featuredArticle.estimatedReadTimeMinutes} min read
                      </span>
                    </div>

                    <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#EDEDED] leading-tight font-display">
                      {featuredArticle.title}
                    </h2>
                    <p className="text-[#A3A3A3] text-xs sm:text-base mt-2.5 line-clamp-2 leading-relaxed font-light">
                      {featuredArticle.subtitle || featuredArticle.summary}
                    </p>

                    {/* Target Vocab Preview */}
                    {featuredArticle.targetVocabulary && featuredArticle.targetVocabulary.length > 0 && (
                      <div className="mt-4 flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-[#737373] font-semibold">Key vocabulary:</span>
                        {featuredArticle.targetVocabulary.slice(0, 3).map((v, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-0.5 rounded bg-[#1F190E] border border-[#3D2F15] text-[#E5C378] text-xs font-mono"
                          >
                            {v.word}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-7 flex items-center gap-3">
                      <button
                        onClick={() => setActiveArticle(featuredArticle)}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#C5A059] hover:bg-[#D4AF37] text-[#0A0A0A] font-extrabold text-xs sm:text-sm transition-all shadow-md shadow-[#C5A059]/20 hover:scale-105 active:scale-95 cursor-pointer"
                      >
                        <BookOpen className="w-4 h-4 text-[#0A0A0A]" />
                        <span>Start Reading Article</span>
                      </button>

                      <button
                        onClick={() => setIsGenerateModalOpen(true)}
                        className="hidden sm:flex items-center gap-1.5 px-4 py-3 rounded-xl bg-[#1A1A1A] hover:bg-[#262626] text-[#D4AF37] border border-[#383838] font-semibold text-xs transition-colors"
                      >
                        <Sparkles className="w-4 h-4 text-[#C5A059]" />
                        <span>Generate Different Topic</span>
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Articles Feed Controls & Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-bold tracking-tight text-[#EDEDED] font-display">
                  Curated Articles Library
                </h3>
                <p className="text-xs text-[#8A8A8A] mt-0.5">
                  Showing {filteredArticles.length} graded articles available for your practice
                </p>
              </div>

              {/* Filter controls */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search topics..."
                    className="pl-8 pr-3 py-2 rounded-xl bg-[#121212] border border-[#262626] text-[#E5E5E5] placeholder-[#666666] text-xs focus:ring-1 focus:ring-[#C5A059] focus:border-[#C5A059] focus:outline-none w-40 sm:w-52 transition-colors"
                  />
                </div>

                {/* Level Filter Dropdown */}
                <select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-[#121212] border border-[#262626] text-[#CCCCCC] text-xs font-semibold focus:ring-1 focus:ring-[#C5A059] focus:border-[#C5A059] focus:outline-none cursor-pointer"
                >
                  <option value="recommended">My Level (CEFR {userProfile.targetLevel})</option>
                  <option value="all">All Levels (A1 - C2)</option>
                  <option value="A1">A1 Beginner</option>
                  <option value="A2">A2 Elementary</option>
                  <option value="B1">B1 Intermediate</option>
                  <option value="B2">B2 Upper Intermediate</option>
                  <option value="C1">C1 Advanced</option>
                  <option value="C2">C2 Mastery</option>
                </select>

                {/* Category Filter Dropdown */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-[#121212] border border-[#262626] text-[#CCCCCC] text-xs font-semibold focus:ring-1 focus:ring-[#C5A059] focus:border-[#C5A059] focus:outline-none cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  <option value="Science & Brain">Science & Brain</option>
                  <option value="Nature & Animals">Nature & Animals</option>
                  <option value="Technology & Psychology">Technology & Psychology</option>
                  <option value="Philosophy & Linguistics">Philosophy & Linguistics</option>
                  <option value="Lifestyle & Health">Lifestyle & Health</option>
                  <option value="Philosophy, Art & AI">Philosophy, Art & AI</option>
                </select>
              </div>
            </div>

            {/* Articles Grid */}
            {filteredArticles.length === 0 ? (
              <div className="text-center py-16 bg-[#121212] rounded-3xl border border-[#222222]">
                <BookOpen className="w-12 h-12 text-[#555555] mx-auto mb-2" />
                <h4 className="text-base font-bold text-[#EDEDED]">
                  No articles found
                </h4>
                <p className="text-xs text-[#8A8A8A] mt-1 mb-4">
                  No articles match the current filter. Try generating one tailored to this topic!
                </p>
                <button
                  onClick={() => setIsGenerateModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-[#C5A059] hover:bg-[#D4AF37] text-[#0A0A0A] text-xs font-bold transition-all shadow-sm"
                >
                  Generate Custom Article with AI
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredArticles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    isCompleted={userProfile.completedArticleIds.includes(article.id)}
                    isUserLevelMatch={article.level === userProfile.targetLevel}
                    onSelect={(selected) => {
                      setActiveArticle(selected);
                      setIsQuizActive(false);
                    }}
                  />
                ))}
              </div>
            )}
          </main>
        )}

        {currentTab === 'vocab' && (
          <VocabularyBank
            savedWords={savedWords}
            onUpdateSRS={handleUpdateSRS}
            onRemoveWord={handleRemoveWord}
          />
        )}

        {currentTab === 'analytics' && (
          <ProgressDashboard
            userProfile={userProfile}
            savedWords={savedWords}
            articles={articles}
            onOpenAssessment={() => setIsAssessmentModalOpen(true)}
          />
        )}
      </div>

      {/* Modals */}
      <GenerateArticleModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        defaultLevel={userProfile.targetLevel}
        onArticleGenerated={handleArticleGenerated}
      />

      <LevelAssessmentModal
        isOpen={isAssessmentModalOpen}
        onClose={() => setIsAssessmentModalOpen(false)}
        currentLevel={userProfile.targetLevel}
        onSelectRecommendedLevel={handleLevelChange}
      />
    </div>
  );
}
