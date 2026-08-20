import React from 'react';
import { Clock, BookMarked, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { Article } from '../types';
import { CEFR_LEVELS_MAP } from '../data/cefrLevels';

interface ArticleCardProps {
  article: Article;
  isCompleted: boolean;
  onSelect: (article: Article) => void;
  isUserLevelMatch: boolean;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  isCompleted,
  onSelect,
  isUserLevelMatch,
}) => {
  const levelInfo = CEFR_LEVELS_MAP[article.level] || CEFR_LEVELS_MAP.B1;

  return (
    <div
      id={`article-card-${article.id}`}
      onClick={() => onSelect(article)}
      className={`group relative bg-[#121212] rounded-2xl p-5 sm:p-6 border transition-all duration-200 cursor-pointer flex flex-col justify-between hover:shadow-xl hover:shadow-black/60 hover:-translate-y-0.5 ${
        isCompleted
          ? 'border-[#14532D]/70 bg-[#0C1712]'
          : isUserLevelMatch
          ? 'border-[#5E4417]/90 hover:border-[#C5A059]/70 bg-[#131210]'
          : 'border-[#222222] hover:border-[#383838]'
      }`}
    >
      {/* Top Meta */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* CEFR Level Pill */}
            <span
              className={`px-2.5 py-1 rounded-md text-xs font-bold border ${levelInfo.badgeColor}`}
            >
              CEFR {article.level}
            </span>

            {/* Category Tag */}
            <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-[#1C1C1C] text-[#A0A0A0] border border-[#282828]">
              {article.category}
            </span>

            {article.isAiGenerated && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#241A0B] text-[#E5C378] border border-[#5E4417]">
                <Sparkles className="w-3 h-3 text-[#C5A059]" /> AI Tailored
              </span>
            )}
          </div>

          {/* Completed Checkmark */}
          {isCompleted && (
            <div className="flex items-center gap-1 text-xs font-semibold text-[#4ADE80] bg-[#0F291E] border border-[#166534] px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" /> Read
            </div>
          )}
        </div>

        {/* Title & Subtitle */}
        <h3 className="text-lg sm:text-xl font-bold text-[#EDEDED] tracking-tight leading-snug group-hover:text-[#E5C378] transition-colors font-display">
          {article.title}
        </h3>
        <p className="text-xs sm:text-sm text-[#8E8E8E] mt-2 line-clamp-2 leading-relaxed">
          {article.subtitle || article.summary}
        </p>

        {/* Target Vocabulary Preview Chips */}
        {article.targetVocabulary && article.targetVocabulary.length > 0 && (
          <div className="mt-4 pt-3 border-t border-[#1F1F1F]">
            <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-[#666666] mb-1.5">
              <BookMarked className="w-3 h-3" /> Key Target Vocabulary
            </div>
            <div className="flex flex-wrap gap-1.5">
              {article.targetVocabulary.slice(0, 4).map((vocab, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded bg-[#181818] text-[#D8B468] border border-[#2B2313] text-xs font-mono font-medium"
                >
                  {vocab.word}
                </span>
              ))}
              {article.targetVocabulary.length > 4 && (
                <span className="px-1.5 py-0.5 rounded text-[#666666] text-xs">
                  +{article.targetVocabulary.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Metrics & Action */}
      <div className="mt-5 pt-3 border-t border-[#1F1F1F] flex items-center justify-between text-xs text-[#737373]">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {article.estimatedReadTimeMinutes} min read
          </span>
          <span>•</span>
          <span>{article.wordCount} words</span>
        </div>

        <div className="flex items-center gap-1 font-semibold text-[#EDEDED] group-hover:text-[#E5C378] group-hover:translate-x-1 transition-all">
          <span>Read & Learn</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
};
