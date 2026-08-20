import React from 'react';
import {
  Flame,
  Clock,
  BookOpen,
  Award,
  Sparkles,
  Bookmark,
  CheckCircle2,
  TrendingUp,
  Target,
  Zap,
} from 'lucide-react';
import { UserProfile, SavedWord, Article } from '../types';
import { CEFR_LEVELS_MAP, CEFR_LEVELS_ARRAY } from '../data/cefrLevels';

interface ProgressDashboardProps {
  userProfile: UserProfile;
  savedWords: SavedWord[];
  articles: Article[];
  onOpenAssessment: () => void;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  userProfile,
  savedWords,
  articles,
  onOpenAssessment,
}) => {
  const currentLevelInfo = CEFR_LEVELS_MAP[userProfile.targetLevel] || CEFR_LEVELS_MAP.B1;
  const currentLevelIdx = CEFR_LEVELS_ARRAY.indexOf(userProfile.targetLevel);

  // Total words read estimation
  const completedArticlesList = articles.filter((a) =>
    userProfile.completedArticleIds.includes(a.id)
  );
  const totalWordsRead = completedArticlesList.reduce((acc, a) => acc + (a.wordCount || 300), 0);
  const readingMinutesTotal = Math.round(userProfile.totalReadingSeconds / 60);

  // Average quiz score
  const quizScores = userProfile.quizHistory || [];
  const averageQuizScorePct =
    quizScores.length > 0
      ? Math.round(
          quizScores.reduce((acc, q) => acc + (q.score / q.totalQuestions) * 100, 0) /
            quizScores.length
        )
      : 85;

  // Daily goal progress (articles read today)
  const dailyArticlesRead = Math.min(completedArticlesList.length, userProfile.dailyGoalArticles);
  const dailyGoalPct = Math.min(100, Math.round((dailyArticlesRead / userProfile.dailyGoalArticles) * 100));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#EDEDED] font-display">
            Learning Analytics & Progress
          </h1>
          <p className="text-xs sm:text-sm text-[#888888] mt-1 font-light">
            Track reading volume, vocabulary retention, and CEFR proficiency growth over time.
          </p>
        </div>

        <button
          onClick={onOpenAssessment}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C5A059] hover:bg-[#D4AF37] text-[#0A0A0A] text-xs sm:text-sm font-bold shadow-xs transition-all self-start sm:self-auto active:scale-95"
        >
          <Award className="w-4 h-4" />
          <span>Retake Diagnostic Test</span>
        </button>
      </div>

      {/* Main Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Streak */}
        <div className="p-5 rounded-3xl bg-[#121212] border border-[#242424] shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#737373]">
              Daily Streak
            </span>
            <div className="p-2 rounded-xl bg-[#291708] border border-[#6B3B0F]/50 text-orange-400">
              <Flame className="w-5 h-5 animate-pulse text-orange-400" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl sm:text-4xl font-black text-[#EDEDED] font-display">
              {userProfile.currentStreak}
            </span>
            <span className="text-xs text-[#888888] ml-1.5 font-sans">days</span>
            <p className="text-[11px] text-[#737373] mt-0.5 font-light">Best record: {userProfile.bestStreak} days</p>
          </div>
        </div>

        {/* Total Words Read */}
        <div className="p-5 rounded-3xl bg-[#121212] border border-[#242424] shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#737373]">
              Words Read
            </span>
            <div className="p-2 rounded-xl bg-[#0F2236] border border-[#1E40AF]/50 text-blue-400">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl sm:text-4xl font-black text-[#EDEDED] font-display">
              {totalWordsRead.toLocaleString()}
            </span>
            <span className="text-xs text-[#888888] ml-1.5 font-sans">words</span>
            <p className="text-[11px] text-[#737373] mt-0.5 font-light">{completedArticlesList.length} articles completed</p>
          </div>
        </div>

        {/* Reading Time */}
        <div className="p-5 rounded-3xl bg-[#121212] border border-[#242424] shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#737373]">
              Reading Time
            </span>
            <div className="p-2 rounded-xl bg-[#0F291E] border border-[#166534]/50 text-emerald-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl sm:text-4xl font-black text-[#EDEDED] font-display">
              {readingMinutesTotal}
            </span>
            <span className="text-xs text-[#888888] ml-1.5 font-sans">minutes</span>
            <p className="text-[11px] text-[#737373] mt-0.5 font-light">Active focused reading</p>
          </div>
        </div>

        {/* Experience Points */}
        <div className="p-5 rounded-3xl bg-[#121212] border border-[#242424] shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#737373]">
              Total Experience
            </span>
            <div className="p-2 rounded-xl bg-[#241A0B] border border-[#5E4417] text-[#E5C378]">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl sm:text-4xl font-black text-[#E5C378] font-display">
              {userProfile.xp}
            </span>
            <span className="text-xs text-[#888888] ml-1.5 font-sans">XP</span>
            <p className="text-[11px] text-[#737373] mt-0.5 font-light">Avg quiz accuracy: {averageQuizScorePct}%</p>
          </div>
        </div>
      </div>

      {/* CEFR Proficiency Roadmap */}
      <div className="bg-[#121212] rounded-3xl p-6 sm:p-8 border border-[#242424] shadow-xl mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-[#EDEDED] font-display">
              CEFR Mastery Progression
            </h2>
            <p className="text-xs text-[#888888] mt-0.5 font-light">
              Target Level: <strong className="text-[#E5C378] font-semibold">{userProfile.targetLevel} ({currentLevelInfo.name})</strong>
            </p>
          </div>
          <span className="text-xs px-3.5 py-1 rounded-full bg-[#241A0B] text-[#E5C378] font-bold border border-[#5E4417]">
            {currentLevelInfo.readingSpeedWPM}
          </span>
        </div>

        {/* Progression Steps */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mt-6">
          {CEFR_LEVELS_ARRAY.map((lvl, idx) => {
            const info = CEFR_LEVELS_MAP[lvl];
            const isCompleted = idx < currentLevelIdx;
            const isCurrent = idx === currentLevelIdx;

            return (
              <div
                key={lvl}
                className={`p-4 rounded-2xl border transition-all text-left ${
                  isCurrent
                    ? 'border-[#C5A059] bg-[#241A0B]/60 ring-1 ring-[#C5A059] shadow-lg'
                    : isCompleted
                    ? 'border-[#166534] bg-[#0C1A14]'
                    : 'border-[#242424] bg-[#161616] opacity-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-extrabold text-sm text-[#EDEDED] font-display">
                    {lvl}
                  </span>
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : isCurrent ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-[#C5A059] animate-ping" />
                  ) : null}
                </div>
                <h4 className="text-xs font-bold text-[#CCCCCC]">{info.name}</h4>
                <p className="text-[10px] text-[#737373] mt-1 line-clamp-2 leading-relaxed">
                  {info.tagline}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Vocabulary Mastery Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SRS Status */}
        <div className="bg-[#121212] rounded-3xl p-6 sm:p-8 border border-[#242424] shadow-xl">
          <h3 className="text-base font-bold mb-1 flex items-center gap-2 text-[#EDEDED] font-display">
            <Bookmark className="w-4 h-4 text-[#C5A059]" /> Vocabulary Bank Retention
          </h3>
          <p className="text-xs text-[#888888] mb-6 font-light">
            Spaced repetition stages of your {savedWords.length} saved words.
          </p>

          <div className="space-y-4">
            {[
              { stage: 'Mastered', count: savedWords.filter((w) => w.srsStage === 'mastered').length, color: 'bg-emerald-500' },
              { stage: 'Review Phase', count: savedWords.filter((w) => w.srsStage === 'review').length, color: 'bg-purple-500' },
              { stage: 'In Learning', count: savedWords.filter((w) => w.srsStage === 'learning').length, color: 'bg-[#C5A059]' },
              { stage: 'New Words', count: savedWords.filter((w) => w.srsStage === 'new').length, color: 'bg-blue-500' },
            ].map((item, i) => {
              const pct = savedWords.length > 0 ? Math.round((item.count / savedWords.length) * 100) : 0;
              return (
                <div key={i}>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-[#CCCCCC]">{item.stage}</span>
                    <span className="text-[#888888]">
                      {item.count} words ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-[#1C1C1C] rounded-full overflow-hidden border border-[#2A2A2A]">
                    <div
                      className={`h-full ${item.color} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Daily Reading Goal Card */}
        <div className="bg-[#121212] rounded-3xl p-6 sm:p-8 border border-[#242424] shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold mb-1 flex items-center gap-2 text-[#EDEDED] font-display">
              <Target className="w-4 h-4 text-[#C5A059]" /> Daily Learning Goal
            </h3>
            <p className="text-xs text-[#888888] mb-6 font-light">
              Complete {userProfile.dailyGoalArticles} article per day to cultivate habitual fluency.
            </p>

            <div className="p-4 rounded-2xl bg-[#1A160F] border border-[#3E2E16] mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#E5C378]">
                  Today's Reading Progress
                </span>
                <span className="text-xs font-bold text-[#D4AF37]">
                  {dailyArticlesRead} / {userProfile.dailyGoalArticles} Article
                </span>
              </div>
              <div className="h-2.5 w-full bg-[#2A2012] rounded-full overflow-hidden border border-[#423015]">
                <div
                  className="h-full bg-[#C5A059] transition-all duration-500"
                  style={{ width: `${dailyGoalPct}%` }}
                />
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#181818] border border-[#242424] text-xs text-[#A0A0A0] leading-relaxed font-light">
            💡 <strong className="text-[#E5C378]">Fluency Tip:</strong> Reading 15 minutes every single day exposes you to over 1,000,000 words per year, dramatically accelerating subconscious grammar acquisition!
          </div>
        </div>
      </div>
    </div>
  );
};
