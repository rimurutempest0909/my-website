import React, { useState } from 'react';
import { BookOpen, Flame, Sparkles, Bookmark, BarChart2, Award, ChevronDown, Sliders, CheckCircle2 } from 'lucide-react';
import { CEFRLevel, UserProfile } from '../types';
import { CEFR_LEVELS_MAP, CEFR_LEVELS_ARRAY } from '../data/cefrLevels';

interface HeaderProps {
  currentTab: 'articles' | 'vocab' | 'analytics' | 'assessment';
  onTabChange: (tab: 'articles' | 'vocab' | 'analytics' | 'assessment') => void;
  userProfile: UserProfile;
  onLevelChange: (level: CEFRLevel) => void;
  savedWordsCount: number;
  onOpenGenerateModal: () => void;
  onOpenAssessmentModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  userProfile,
  onLevelChange,
  savedWordsCount,
  onOpenGenerateModal,
  onOpenAssessmentModal,
}) => {
  const [isLevelDropdownOpen, setIsLevelDropdownOpen] = useState(false);
  const activeLevelInfo = CEFR_LEVELS_MAP[userProfile.targetLevel] || CEFR_LEVELS_MAP.B1;

  return (
    <header className="sticky top-0 z-40 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#262626] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onTabChange('articles')}
              className="flex items-center gap-2.5 text-left group focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] via-[#C5A059] to-[#8C6B2D] flex items-center justify-center text-[#0A0A0A] shadow-md shadow-[#C5A059]/10 group-hover:scale-105 transition-transform font-bold">
                <BookOpen className="w-5 h-5 text-[#0A0A0A]" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-[#EDEDED] flex items-center gap-2">
                  Read&amp;Learn
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#241A0B] text-[#E5C378] border border-[#5E4417]">
                    CEFR {userProfile.targetLevel}
                  </span>
                </span>
                <p className="text-xs text-[#8A8A8A] hidden sm:block">
                  Daily English Reading & Vocabulary Mastery
                </p>
              </div>
            </button>
          </div>

          {/* Level Switcher & Stats */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Level Selector Dropdown */}
            <div className="relative">
              <button
                id="cefr-level-selector-btn"
                onClick={() => setIsLevelDropdownOpen(!isLevelDropdownOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all shadow-xs ${activeLevelInfo.badgeColor}`}
                title="Change your target CEFR reading level"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Level:</span> {userProfile.targetLevel} ({activeLevelInfo.name})
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isLevelDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isLevelDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-[#121212] rounded-2xl shadow-2xl border border-[#2A2A2A] p-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 border-b border-[#222222] mb-1 flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#8A8A8A] uppercase tracking-wider">
                      Select Proficiency Level
                    </span>
                    <button
                      onClick={() => {
                        setIsLevelDropdownOpen(false);
                        onOpenAssessmentModal();
                      }}
                      className="text-xs text-[#E5C378] hover:text-[#D4AF37] font-medium flex items-center gap-1 transition-colors"
                    >
                      <Award className="w-3 h-3" /> Diagnostic Test
                    </button>
                  </div>
                  <div className="space-y-1">
                    {CEFR_LEVELS_ARRAY.map((lvl) => {
                      const info = CEFR_LEVELS_MAP[lvl];
                      const isSelected = userProfile.targetLevel === lvl;
                      return (
                        <button
                          key={lvl}
                          onClick={() => {
                            onLevelChange(lvl);
                            setIsLevelDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm flex items-start justify-between transition-colors ${
                            isSelected
                              ? 'bg-[#241A0B] text-[#E5C378] border border-[#5E4417]/70 font-medium'
                              : 'hover:bg-[#1A1A1A] text-[#CCCCCC]'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-[#EDEDED]">{lvl}</span>
                              <span className="text-[#999999]">· {info.name}</span>
                            </div>
                            <p className="text-[11px] text-[#737373] line-clamp-1 mt-0.5">
                              {info.tagline}
                            </p>
                          </div>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-[#C5A059] shrink-0 mt-0.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Streak Counter */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#241307] text-[#FB923C] border border-[#7C2D12]/70 text-xs sm:text-sm font-semibold"
              title={`${userProfile.currentStreak} day streak! Read daily to keep your flame alive.`}
            >
              <Flame className="w-4 h-4 text-[#F97316] animate-pulse" />
              <span>{userProfile.currentStreak}d</span>
            </div>

            {/* XP Points */}
            <div
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#1E122E] text-[#C084FC] border border-[#581C87]/70 text-xs sm:text-sm font-semibold"
              title="Experience points earned from reading and quizzes"
            >
              <Sparkles className="w-4 h-4 text-[#A855F7]" />
              <span>{userProfile.xp} XP</span>
            </div>

            {/* AI Generate Article Button */}
            <button
              id="header-generate-article-btn"
              onClick={onOpenGenerateModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#C5A059] hover:bg-[#D4AF37] text-[#0A0A0A] text-xs sm:text-sm font-bold transition-all shadow-sm active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#0A0A0A]" />
              <span className="hidden sm:inline">New Custom Article</span>
              <span className="sm:hidden">Generate</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 sm:space-x-3 border-t border-[#1C1C1C] py-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => onTabChange('articles')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
              currentTab === 'articles'
                ? 'bg-[#1C1C1C] text-[#EDEDED] border border-[#333333] shadow-xs'
                : 'text-[#8A8A8A] hover:text-[#EDEDED] hover:bg-[#141414]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Daily Articles</span>
          </button>

          <button
            onClick={() => onTabChange('vocab')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
              currentTab === 'vocab'
                ? 'bg-[#1C1C1C] text-[#EDEDED] border border-[#333333] shadow-xs'
                : 'text-[#8A8A8A] hover:text-[#EDEDED] hover:bg-[#141414]'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Vocabulary Bank</span>
            {savedWordsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#241A0B] text-[#E5C378] border border-[#5E4417]">
                {savedWordsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onTabChange('analytics')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
              currentTab === 'analytics'
                ? 'bg-[#1C1C1C] text-[#EDEDED] border border-[#333333] shadow-xs'
                : 'text-[#8A8A8A] hover:text-[#EDEDED] hover:bg-[#141414]'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>Progress & Metrics</span>
          </button>

          <button
            onClick={() => onTabChange('assessment')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
              currentTab === 'assessment'
                ? 'bg-[#1C1C1C] text-[#EDEDED] border border-[#333333] shadow-xs'
                : 'text-[#8A8A8A] hover:text-[#EDEDED] hover:bg-[#141414]'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Level Diagnostic</span>
          </button>
        </div>
      </div>
    </header>
  );
};
