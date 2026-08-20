import React, { useState } from 'react';
import {
  Sparkles,
  X,
  BookOpen,
  Sliders,
  Check,
  FileText,
  Clock,
  Layers,
} from 'lucide-react';
import { Article, CEFRLevel } from '../types';
import { CEFR_LEVELS_MAP, CEFR_LEVELS_ARRAY } from '../data/cefrLevels';

interface GenerateArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultLevel: CEFRLevel;
  onArticleGenerated: (article: Article) => void;
}

const POPULAR_TOPICS = [
  { topic: 'The Psychology of Daily Habits', category: 'Mind & Health' },
  { topic: 'How Artificial Intelligence is Changing Medicine', category: 'Science & Tech' },
  { topic: 'The Deepest Secrets of the Ocean Trenches', category: 'Nature & Earth' },
  { topic: 'Ancient Roman Engineering Marvels', category: 'History & Culture' },
  { topic: 'The Science of High-Quality Coffee Brewing', category: 'Lifestyle & Science' },
  { topic: 'Urban Rooftop Farming and the Future of Food', category: 'Environment' },
];

export const GenerateArticleModal: React.FC<GenerateArticleModalProps> = ({
  isOpen,
  onClose,
  defaultLevel,
  onArticleGenerated,
}) => {
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState<CEFRLevel>(defaultLevel);
  const [category, setCategory] = useState('Science & Tech');
  const [length, setLength] = useState<'Short' | 'Medium' | 'Long'>('Medium');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/articles/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          level,
          category,
          length,
          customPrompt: customPrompt.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate tailored article.');
      }

      const generatedArticle: Article = await response.json();
      onArticleGenerated(generatedArticle);
      onClose();
    } catch (err: any) {
      console.error('Generation error:', err);
      setErrorMessage(err.message || 'An error occurred during article generation.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
      <div className="bg-[#121212] rounded-3xl w-full max-w-xl border border-[#282828] p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto text-[#E5E5E5]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#222222]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#8C6B2D] text-[#0A0A0A] flex items-center justify-center shadow-lg shadow-[#C5A059]/20">
              <Sparkles className="w-4 h-4 text-[#0A0A0A]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-display text-[#EDEDED]">Generate Custom AI Article</h2>
              <p className="text-xs text-[#888888] font-light">Tailored strictly to your selected CEFR reading level</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#1E1E1E] text-[#888888] hover:text-[#EDEDED] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleGenerate} className="mt-6 space-y-5">
          {/* Topic Input */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#737373] block mb-1.5">
              Article Topic / Theme <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Space Exploration, Mindfulness, Architecture, Solar Energy..."
              className="w-full px-4 py-2.5 rounded-xl bg-[#181818] border border-[#2A2A2A] text-xs sm:text-sm text-[#EDEDED] placeholder-[#666666] focus:ring-1 focus:ring-[#C5A059] focus:border-[#C5A059] focus:outline-none transition-colors"
            />
          </div>

          {/* Quick Popular Topics */}
          <div>
            <span className="text-[11px] font-semibold text-[#737373] block mb-1.5">
              Or pick an interesting idea:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_TOPICS.map((t, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => {
                    setTopic(t.topic);
                    setCategory(t.category);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#181818] hover:bg-[#241A0B] border border-[#262626] hover:border-[#5E4417] text-[#CCCCCC] hover:text-[#E5C378] text-xs transition-colors"
                >
                  {t.topic}
                </button>
              ))}
            </div>
          </div>

          {/* CEFR Level Selection */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#737373] block mb-1.5">
              Target CEFR Level
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {CEFR_LEVELS_ARRAY.map((lvl) => {
                const isSelected = level === lvl;
                return (
                  <button
                    type="button"
                    key={lvl}
                    onClick={() => setLevel(lvl)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      isSelected
                        ? 'bg-[#C5A059] text-[#0A0A0A] border-[#C5A059] shadow-xs'
                        : 'border-[#262626] bg-[#181818] text-[#888888] hover:border-[#383838] hover:text-[#EDEDED]'
                    }`}
                  >
                    {lvl}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category & Length Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#737373] block mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#181818] border border-[#2A2A2A] text-xs sm:text-sm text-[#CCCCCC] focus:ring-1 focus:ring-[#C5A059] focus:border-[#C5A059] focus:outline-none"
              >
                <option value="Science & Tech" className="bg-[#181818]">Science & Tech</option>
                <option value="Nature & Wildlife" className="bg-[#181818]">Nature & Wildlife</option>
                <option value="Mind & Health" className="bg-[#181818]">Mind & Health</option>
                <option value="History & Society" className="bg-[#181818]">History & Society</option>
                <option value="Art & Culture" className="bg-[#181818]">Art & Culture</option>
                <option value="Business & Economy" className="bg-[#181818]">Business & Economy</option>
                <option value="Everyday Life" className="bg-[#181818]">Everyday Life</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#737373] block mb-1.5">
                Length
              </label>
              <div className="grid grid-cols-3 gap-1">
                {(['Short', 'Medium', 'Long'] as const).map((len) => (
                  <button
                    type="button"
                    key={len}
                    onClick={() => setLength(len)}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                      length === len
                        ? 'bg-[#C5A059] text-[#0A0A0A] border-[#C5A059] font-bold'
                        : 'border-[#262626] bg-[#181818] text-[#888888] hover:border-[#383838] hover:text-[#EDEDED]'
                    }`}
                  >
                    {len}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Error display */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-[#2E1417] text-rose-300 border border-[#881337]/60 text-xs">
              {errorMessage}
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-4 border-t border-[#222222] flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#888888] hover:text-[#EDEDED] transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isGenerating || !topic.trim()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#C5A059] hover:bg-[#D4AF37] disabled:opacity-50 text-[#0A0A0A] font-extrabold text-xs sm:text-sm transition-all shadow-md active:scale-95"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#0A0A0A] border-t-transparent rounded-full animate-spin" />
                  <span>Drafting CEFR {level} Article...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#0A0A0A]" />
                  <span>Generate Article</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
