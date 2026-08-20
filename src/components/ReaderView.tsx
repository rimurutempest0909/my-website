import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Type,
  Sun,
  Moon,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  BookOpen,
  Eye,
  Check,
  Share2,
  Lightbulb,
  X,
  FastForward,
} from 'lucide-react';
import { Article, ReaderSettings, TargetVocabularyItem, SavedWord } from '../types';
import { CEFR_LEVELS_MAP } from '../data/cefrLevels';
import { soundManager } from '../utils/audioUtils';

interface ReaderViewProps {
  article: Article;
  onBack: () => void;
  onStartQuiz: () => void;
  onSaveWord: (wordData: Omit<SavedWord, 'id' | 'dateAdded' | 'srsStage' | 'nextReviewDate' | 'timesReviewed' | 'correctCount'>) => void;
  savedWords: SavedWord[];
  onArticleCompleted: (articleId: string, readingSeconds: number) => void;
  isCompleted: boolean;
  readerSettings: ReaderSettings;
  onUpdateReaderSettings: (settings: ReaderSettings) => void;
}

interface InspectedWordData {
  word: string;
  phonetic: string;
  partOfSpeech: string;
  definition: string;
  cefrLevel: string;
  simpleExplanation?: string;
  exampleInContext?: string;
  exampleUsage: string;
  synonyms?: string[];
  collocations?: string[];
  isLoading?: boolean;
}

interface SentenceSimplificationData {
  original: string;
  simplified: string;
  plainExplanation: string;
  grammarBreakdown: Array<{ component: string; explanation: string }>;
  keyPhrases?: Array<{ phrase: string; meaning: string }>;
  isLoading?: boolean;
}

export const ReaderView: React.FC<ReaderViewProps> = ({
  article,
  onBack,
  onStartQuiz,
  onSaveWord,
  savedWords,
  onArticleCompleted,
  isCompleted,
  readerSettings,
  onUpdateReaderSettings,
}) => {
  const [readingSeconds, setReadingSeconds] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioSpeed, setAudioSpeed] = useState<number>(readerSettings.speechSpeed || 1.0);
  const [activeSentenceIndex, setActiveSentenceIndex] = useState<number | null>(null);
  
  // Word Inspector Modal / Sheet
  const [inspectedWord, setInspectedWord] = useState<InspectedWordData | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  // Sentence Simplification Modal
  const [simplification, setSimplification] = useState<SentenceSimplificationData | null>(null);
  const [isSimplifierOpen, setIsSimplifierOpen] = useState(false);

  // Customizer Drawer / Dropdown
  const [showAppearanceMenu, setShowAppearanceMenu] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);

  const readingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const levelInfo = CEFR_LEVELS_MAP[article.level] || CEFR_LEVELS_MAP.B1;

  // Track Reading Time
  useEffect(() => {
    readingTimerRef.current = setInterval(() => {
      setReadingSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (readingTimerRef.current) clearInterval(readingTimerRef.current);
      soundManager.stop();
    };
  }, []);

  // When user reads for at least 45 seconds or finishes, record completion
  useEffect(() => {
    if (readingSeconds === 45 && !isCompleted) {
      onArticleCompleted(article.id, 45);
    }
  }, [readingSeconds, isCompleted, article.id, onArticleCompleted]);

  // Audio Playback
  const togglePlayAudio = () => {
    if (isPlayingAudio) {
      soundManager.stop();
      setIsPlayingAudio(false);
    } else {
      const fullText = article.paragraphs.join('. ');
      setIsPlayingAudio(true);
      soundManager.speak(fullText, {
        rate: audioSpeed,
        onEnd: () => setIsPlayingAudio(false),
        onError: () => setIsPlayingAudio(false),
      });
    }
  };

  const handleSpeedChange = (speed: number) => {
    setAudioSpeed(speed);
    onUpdateReaderSettings({ ...readerSettings, speechSpeed: speed });
    if (isPlayingAudio) {
      soundManager.stop();
      setIsPlayingAudio(false);
    }
  };

  // Inspect Word Click
  const handleWordClick = async (clickedWordRaw: string, sentenceContext: string) => {
    // Clean punctuation
    const cleanWord = clickedWordRaw.replace(/[^a-zA-Z0-9'-]/g, '').trim();
    if (!cleanWord || cleanWord.length < 2) return;

    // Check if it matches a pre-defined target vocabulary in the article
    const targetMatch = article.targetVocabulary?.find(
      (v) => v.word.toLowerCase() === cleanWord.toLowerCase()
    );

    if (targetMatch) {
      setInspectedWord({
        word: targetMatch.word,
        phonetic: targetMatch.phonetic,
        partOfSpeech: targetMatch.partOfSpeech,
        definition: targetMatch.definition,
        cefrLevel: targetMatch.cefrLevel,
        simpleExplanation: targetMatch.definition,
        exampleInContext: sentenceContext,
        exampleUsage: targetMatch.exampleUsage,
        synonyms: targetMatch.synonyms,
        collocations: targetMatch.collocations,
        isLoading: false,
      });
      setIsInspectorOpen(true);
      soundManager.speakWord(cleanWord, 0.9);
      return;
    }

    // Otherwise fetch dynamic definition from backend
    setIsInspectorOpen(true);
    setInspectedWord({
      word: cleanWord,
      phonetic: `/${cleanWord.toLowerCase()}/`,
      partOfSpeech: 'word',
      definition: 'Fetching contextual definition and phonetic breakdown...',
      cefrLevel: article.level,
      exampleUsage: sentenceContext,
      isLoading: true,
    });
    soundManager.speakWord(cleanWord, 0.9);

    try {
      const response = await fetch('/api/vocabulary/define', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: cleanWord,
          sentenceContext,
          userLevel: article.level,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setInspectedWord({
          word: data.word || cleanWord,
          phonetic: data.phonetic || `/${cleanWord.toLowerCase()}/`,
          partOfSpeech: data.partOfSpeech || 'general',
          definition: data.definition,
          cefrLevel: data.cefrLevel || article.level,
          simpleExplanation: data.simpleExplanation,
          exampleInContext: sentenceContext,
          exampleUsage: data.exampleInContext || sentenceContext,
          synonyms: data.synonyms,
          collocations: data.collocations,
          isLoading: false,
        });
      }
    } catch (e) {
      console.error('Word define error:', e);
      setInspectedWord((prev) => (prev ? { ...prev, isLoading: false } : null));
    }
  };

  // Simplify Sentence Click
  const handleSimplifySentence = async (sentence: string) => {
    setIsSimplifierOpen(true);
    setSimplification({
      original: sentence,
      simplified: 'Analyzing sentence structure and simplifying grammar...',
      plainExplanation: 'Breaking down clauses and vocabulary...',
      grammarBreakdown: [],
      isLoading: true,
    });

    try {
      const response = await fetch('/api/text/simplify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sentence,
          targetLevel: 'A2',
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setSimplification({
          original: data.original || sentence,
          simplified: data.simplified,
          plainExplanation: data.plainExplanation,
          grammarBreakdown: data.grammarBreakdown || [],
          keyPhrases: data.keyPhrases || [],
          isLoading: false,
        });
      }
    } catch (e) {
      console.error('Simplify error:', e);
      setSimplification((prev) => (prev ? { ...prev, isLoading: false } : null));
    }
  };

  // Check if a word is already in the user's saved bank
  const isWordSaved = (wordStr: string) => {
    return savedWords.some((w) => w.word.toLowerCase() === wordStr.toLowerCase());
  };

  // Handle saving the inspected word
  const handleSaveInspectedWord = () => {
    if (!inspectedWord) return;
    onSaveWord({
      word: inspectedWord.word,
      phonetic: inspectedWord.phonetic,
      partOfSpeech: inspectedWord.partOfSpeech,
      definition: inspectedWord.definition,
      cefrLevel: inspectedWord.cefrLevel,
      exampleUsage: inspectedWord.exampleUsage,
      articleTitle: article.title,
      articleId: article.id,
    });
  };

  // Theme Styles
  const themeStyles = {
    light: 'bg-[#141414] text-[#E5E5E5]',
    sepia: 'bg-[#18140E] text-[#EADBB8]',
    slate: 'bg-[#0E1520] text-[#E2E8F0]',
    midnight: 'bg-[#0A0A0A] text-[#E5E5E5]',
  }[readerSettings.theme || 'midnight'];

  const paperBgStyles = {
    light: 'bg-[#181818] border-[#2A2A2A] text-[#E5E5E5] shadow-xl',
    sepia: 'bg-[#1F1912] border-[#382D1E] text-[#EADBB8] shadow-xl',
    slate: 'bg-[#131C2B] border-[#223147] text-[#E2E8F0] shadow-xl',
    midnight: 'bg-[#121212] border-[#242424] text-[#EDEDED] shadow-2xl shadow-black/80',
  }[readerSettings.theme || 'midnight'];

  const fontStyles = {
    sans: 'font-sans',
    serif: 'font-editorial tracking-normal leading-relaxed text-lg sm:text-xl',
    mono: 'font-mono text-sm leading-relaxed',
  }[readerSettings.fontFamily || 'serif'];

  const fontSizeStyles = {
    sm: 'text-sm sm:text-base leading-relaxed',
    base: 'text-base sm:text-lg leading-relaxed',
    lg: 'text-lg sm:text-xl leading-relaxed',
    xl: 'text-xl sm:text-2xl leading-relaxed',
  }[readerSettings.fontSize || 'base'];

  return (
    <div className={`min-h-screen transition-colors duration-200 ${themeStyles} pb-32`}>
      {/* Top Sticky Reader Header */}
      <div className="sticky top-0 z-30 backdrop-blur-md bg-[#0A0A0A]/90 border-b border-[#222222] px-4 py-2.5 transition-colors">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          {/* Back Button */}
          <button
            id="reader-back-btn"
            onClick={() => {
              soundManager.stop();
              onBack();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-[#1A1A1A] text-[#A3A3A3] hover:text-[#EDEDED] text-xs sm:text-sm font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Feed</span>
          </button>

          {/* Center Info */}
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${levelInfo.badgeColor}`}>
              CEFR {article.level}
            </span>
            <span className="text-xs text-[#8A8A8A] hidden md:inline truncate max-w-[240px]">
              {article.title}
            </span>
          </div>

          {/* Reader Controls (Audio, Appearance, Quiz) */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Audio Read-Aloud Button */}
            <button
              id="reader-audio-toggle-btn"
              onClick={togglePlayAudio}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                isPlayingAudio
                  ? 'bg-[#C5A059] text-[#0A0A0A] shadow-md shadow-[#C5A059]/20 animate-pulse font-bold'
                  : 'bg-[#181818] border border-[#282828] text-[#CCCCCC] hover:text-white hover:bg-[#222222]'
              }`}
              title="Listen to full article audio"
            >
              {isPlayingAudio ? <Pause className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isPlayingAudio ? 'Pause' : 'Listen'}</span>
            </button>

            {/* Appearance Settings Menu Toggle */}
            <div className="relative">
              <button
                id="reader-appearance-btn"
                onClick={() => setShowAppearanceMenu(!showAppearanceMenu)}
                className="p-2 rounded-xl bg-[#181818] border border-[#282828] text-[#CCCCCC] hover:text-white hover:bg-[#222222] transition-colors"
                title="Customize reader typography and theme"
              >
                <Type className="w-4 h-4" />
              </button>

              {showAppearanceMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-[#121212] rounded-2xl shadow-2xl border border-[#2A2A2A] p-4 z-50 animate-in fade-in zoom-in-95 text-[#E5E5E5]">
                  <div className="flex items-center justify-between pb-2 border-b border-[#222222] mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#8A8A8A]">
                      Reader Settings
                    </span>
                    <button
                      onClick={() => setShowAppearanceMenu(false)}
                      className="p-1 hover:bg-[#1E1E1E] rounded text-[#8A8A8A] hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Font Size */}
                  <div className="mb-3">
                    <label className="text-xs font-semibold text-[#8A8A8A] block mb-1.5">
                      Font Size
                    </label>
                    <div className="grid grid-cols-4 gap-1">
                      {(['sm', 'base', 'lg', 'xl'] as const).map((size) => (
                        <button
                          key={size}
                          onClick={() => onUpdateReaderSettings({ ...readerSettings, fontSize: size })}
                          className={`py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            readerSettings.fontSize === size
                              ? 'bg-[#C5A059] text-[#0A0A0A] font-bold'
                              : 'bg-[#1C1C1C] text-[#888888] hover:bg-[#242424] hover:text-[#EDEDED]'
                          }`}
                        >
                          {size.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Font Family */}
                  <div className="mb-3">
                    <label className="text-xs font-semibold text-[#8A8A8A] block mb-1.5">
                      Typography
                    </label>
                    <div className="grid grid-cols-3 gap-1">
                      {(['sans', 'serif', 'mono'] as const).map((font) => (
                        <button
                          key={font}
                          onClick={() => onUpdateReaderSettings({ ...readerSettings, fontFamily: font })}
                          className={`py-1.5 rounded-lg text-xs capitalize transition-colors ${
                            readerSettings.fontFamily === font
                              ? 'bg-[#C5A059] text-[#0A0A0A] font-bold'
                              : 'bg-[#1C1C1C] text-[#888888] hover:bg-[#242424] hover:text-[#EDEDED]'
                          }`}
                        >
                          {font}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Themes */}
                  <div className="mb-3">
                    <label className="text-xs font-semibold text-[#8A8A8A] block mb-1.5">
                      Atmosphere Theme
                    </label>
                    <div className="grid grid-cols-4 gap-1">
                      {(['midnight', 'sepia', 'slate', 'light'] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => onUpdateReaderSettings({ ...readerSettings, theme: t })}
                          className={`py-1.5 rounded-lg text-xs capitalize transition-all border ${
                            readerSettings.theme === t
                              ? 'border-[#C5A059] text-[#E5C378] font-bold bg-[#241A0B]'
                              : 'border-[#242424] hover:border-[#383838]'
                          } ${
                            t === 'light'
                              ? 'bg-[#1C1C1C] text-[#999999]'
                              : t === 'sepia'
                              ? 'bg-[#1F1912] text-[#C4AC82]'
                              : t === 'slate'
                              ? 'bg-[#131C2B] text-[#93C5FD]'
                              : 'bg-[#0A0A0A] text-[#D4AF37]'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Audio Speed */}
                  <div className="mb-3">
                    <label className="text-xs font-semibold text-[#8A8A8A] block mb-1.5 flex items-center justify-between">
                      <span>Audio Speech Rate</span>
                      <span className="font-mono text-[#E5C378]">{audioSpeed}x</span>
                    </label>
                    <div className="grid grid-cols-4 gap-1">
                      {[0.75, 1.0, 1.25, 1.5].map((speed) => (
                        <button
                          key={speed}
                          onClick={() => handleSpeedChange(speed)}
                          className={`py-1.5 rounded-lg text-xs font-mono transition-colors ${
                            audioSpeed === speed
                              ? 'bg-[#C5A059] text-[#0A0A0A] font-bold'
                              : 'bg-[#1C1C1C] text-[#888888] hover:bg-[#242424] hover:text-[#EDEDED]'
                          }`}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Highlight Vocab Switch */}
                  <div className="pt-2 border-t border-[#222222] flex items-center justify-between">
                    <span className="text-xs font-medium text-[#CCCCCC]">Highlight CEFR Words</span>
                    <button
                      onClick={() =>
                        onUpdateReaderSettings({
                          ...readerSettings,
                          highlightVocab: !readerSettings.highlightVocab,
                        })
                      }
                      className={`w-9 h-5 rounded-full transition-colors relative ${
                        readerSettings.highlightVocab ? 'bg-[#C5A059]' : 'bg-[#282828]'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                          readerSettings.highlightVocab ? 'translate-x-4' : ''
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Direct Start Quiz CTA in Header */}
            <button
              id="reader-top-quiz-btn"
              onClick={() => {
                onArticleCompleted(article.id, readingSeconds);
                onStartQuiz();
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#C5A059] hover:bg-[#D4AF37] text-[#0A0A0A] text-xs sm:text-sm font-bold transition-all shadow-xs active:scale-95"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Quiz ({article.comprehensionQuestions?.length || 4}Q)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Article Content Container */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10">
        {/* Article Paper Container */}
        <article className={`rounded-3xl p-6 sm:p-10 border transition-all ${paperBgStyles}`}>
          {/* Header Metadata */}
          <div className="space-y-3 mb-8 pb-6 border-b border-[#222222]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${levelInfo.badgeColor}`}>
                CEFR {article.level} · {levelInfo.name}
              </span>
              <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-[#1C1C1C] text-[#A0A0A0] border border-[#282828]">
                {article.category}
              </span>
              <span className="text-xs text-[#737373]">
                {article.wordCount} words · {article.estimatedReadTimeMinutes} min read
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight font-display text-[#EDEDED]">
              {article.title}
            </h1>

            {article.subtitle && (
              <p className="text-base sm:text-xl font-normal text-[#9E9E9E] leading-snug">
                {article.subtitle}
              </p>
            )}

            {/* Instruction Tip */}
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#241A0B] border border-[#5E4417] text-xs text-[#E5C378]">
              <Lightbulb className="w-4 h-4 text-[#C5A059] shrink-0" />
              <span>
                <strong>Smart Reader:</strong> Click on <em>any word</em> to view instant definitions, pronunciation, and save it to your Vocabulary Bank.
              </span>
            </div>
          </div>

          {/* Paragraphs with Interactive Word Breakdown */}
          <div className={`space-y-6 ${fontStyles} ${fontSizeStyles}`}>
            {article.paragraphs.map((paragraph, pIdx) => {
              return (
                <div key={pIdx} className="relative group/paragraph">
                  {/* Paragraph text with clickable words */}
                  <p className="leading-relaxed text-justify sm:text-left text-[#E0E0E0]">
                    {paragraph.split(/\s+/).map((wordRaw, wIdx) => {
                      const cleanWord = wordRaw.replace(/[^a-zA-Z0-9'-]/g, '');
                      const targetVocab = article.targetVocabulary?.find(
                        (v) => v.word.toLowerCase() === cleanWord.toLowerCase()
                      );
                      const isHighlighted = readerSettings.highlightVocab && Boolean(targetVocab);
                      const isSaved = isWordSaved(cleanWord);

                      return (
                        <span key={wIdx} className="inline-block mr-1">
                          <button
                            type="button"
                            onClick={() => handleWordClick(wordRaw, paragraph)}
                            className={`px-0.5 rounded cursor-pointer transition-all hover:bg-[#C5A059]/25 hover:text-[#FFFFFF] ${
                              isHighlighted
                                ? 'underline decoration-[#C5A059] decoration-2 font-semibold text-[#E5C378]'
                                : ''
                            } ${isSaved ? 'bg-[#241A0B] text-[#E5C378] border-b border-[#C5A059]/60' : ''}`}
                            title={`Click to define "${cleanWord}"`}
                          >
                            {wordRaw}
                          </button>
                        </span>
                      );
                    })}
                  </p>

                  {/* Sentence Simplifier Action Tooltip */}
                  <div className="mt-2 flex items-center justify-end gap-2 opacity-60 group-hover/paragraph:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleSimplifySentence(paragraph)}
                      className="inline-flex items-center gap-1.5 text-xs text-[#E5C378] hover:text-[#D4AF37] hover:underline px-2.5 py-1 rounded-lg bg-[#1C170E] border border-[#423112] transition-colors"
                      title="Explain this passage in simpler English and break down its grammar"
                    >
                      <Sparkles className="w-3 h-3 text-[#C5A059]" />
                      <span>Explain / Simplify Paragraph</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cultural Note / Fun Fact */}
          {article.funFact && (
            <div className="mt-10 p-5 rounded-2xl bg-[#171717] border border-[#262626] flex items-start gap-3.5">
              <div className="p-2 rounded-xl bg-[#241A0B] text-[#E5C378] border border-[#5E4417] shrink-0">
                <Lightbulb className="w-4 h-4 text-[#C5A059]" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#8A8A8A]">
                  Linguistic Note & Fun Fact
                </h4>
                <p className="text-xs sm:text-sm text-[#CCCCCC] mt-1 leading-relaxed">
                  {article.funFact}
                </p>
              </div>
            </div>
          )}

          {/* Article Target Vocabulary Recap Table */}
          {article.targetVocabulary && article.targetVocabulary.length > 0 && (
            <div className="mt-10 pt-6 border-t border-[#222222]">
              <h3 className="text-base sm:text-lg font-bold mb-4 flex items-center gap-2 text-[#EDEDED] font-display">
                <BookOpen className="w-4 h-4 text-[#C5A059]" />
                Target Vocabulary in this Article
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {article.targetVocabulary.map((vocab, i) => {
                  const isSaved = isWordSaved(vocab.word);
                  return (
                    <div
                      key={i}
                      className="p-3.5 rounded-2xl border border-[#222222] bg-[#141414] flex items-start justify-between gap-2 hover:border-[#333333] transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#EDEDED]">
                            {vocab.word}
                          </span>
                          <span className="text-xs text-[#8A8A8A] font-mono">{vocab.phonetic}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1F1F1F] text-[#AAAAAA] font-medium">
                            {vocab.partOfSpeech}
                          </span>
                        </div>
                        <p className="text-xs text-[#8E8E8E] mt-1.5 line-clamp-2">
                          {vocab.definition}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => soundManager.speakWord(vocab.word)}
                          className="p-2 rounded-lg hover:bg-[#222222] text-[#888888] hover:text-[#EDEDED] transition-colors"
                          title="Listen pronunciation"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            onSaveWord({
                              word: vocab.word,
                              phonetic: vocab.phonetic,
                              partOfSpeech: vocab.partOfSpeech,
                              definition: vocab.definition,
                              cefrLevel: vocab.cefrLevel,
                              exampleUsage: vocab.exampleUsage,
                              articleTitle: article.title,
                              articleId: article.id,
                            })
                          }
                          className={`p-2 rounded-lg transition-colors ${
                            isSaved
                              ? 'text-[#E5C378] bg-[#241A0B] border border-[#5E4417]'
                              : 'hover:bg-[#222222] text-[#888888] hover:text-[#EDEDED]'
                          }`}
                          title={isSaved ? 'Saved to Vocabulary Bank' : 'Save word'}
                        >
                          {isSaved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Big End-Of-Article Comprehension Quiz CTA */}
          <div className="mt-12 p-8 rounded-3xl bg-gradient-to-br from-[#1A160F] to-[#121212] border border-[#382B14] text-center shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#8C6B2D] text-[#0A0A0A] flex items-center justify-center mx-auto mb-3.5 shadow-lg shadow-[#C5A059]/20">
              <CheckCircle2 className="w-6 h-6 text-[#0A0A0A]" />
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-[#EDEDED] font-display">
              Finished Reading? Test Your Comprehension!
            </h3>
            <p className="text-xs sm:text-sm text-[#8E8E8E] max-w-md mx-auto mt-1.5 mb-6 leading-relaxed">
              Answer {article.comprehensionQuestions?.length || 4} curated comprehension questions to solidify your learning and earn XP points.
            </p>
            <button
              id="reader-bottom-start-quiz-btn"
              onClick={() => {
                onArticleCompleted(article.id, readingSeconds);
                onStartQuiz();
              }}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#C5A059] hover:bg-[#D4AF37] text-[#0A0A0A] font-extrabold text-sm sm:text-base transition-all shadow-md shadow-[#C5A059]/20 hover:scale-105 active:scale-95 cursor-pointer"
            >
              <span>Start Comprehension Quiz</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </div>
        </article>
      </main>

      {/* Word Inspector Floating Sheet / Modal */}
      {isInspectorOpen && inspectedWord && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#121212] rounded-t-3xl sm:rounded-3xl w-full max-w-lg border border-[#2A2A2A] p-6 shadow-2xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200 text-[#EDEDED]">
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-[#222222]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-[#241A0B] text-[#E5C378] border border-[#5E4417]">
                  CEFR {inspectedWord.cefrLevel}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#737373]">
                  Vocabulary Inspector
                </span>
              </div>
              <button
                onClick={() => setIsInspectorOpen(false)}
                className="p-1 rounded-lg hover:bg-[#1C1C1C] text-[#888888] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Word details */}
            <div className="mt-4">
              <div className="flex items-baseline justify-between">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold capitalize text-[#EDEDED] tracking-tight font-display">
                    {inspectedWord.word}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-mono text-[#E5C378]">
                      {inspectedWord.phonetic}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-[#1C1C1C] text-[#AAAAAA] italic font-medium">
                      {inspectedWord.partOfSpeech}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => soundManager.speakWord(inspectedWord.word)}
                  className="p-3 rounded-full bg-[#241A0B] hover:bg-[#332510] text-[#E5C378] border border-[#5E4417] transition-colors"
                  title="Pronounce word"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>

              {/* Loading State */}
              {inspectedWord.isLoading && (
                <div className="py-6 text-center text-xs text-[#8A8A8A]">
                  <div className="inline-block w-5 h-5 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin mb-2" />
                  <p>Analyzing word nuances & collocations...</p>
                </div>
              )}

              {/* Definition */}
              <div className="mt-4 space-y-3">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#737373] mb-1">
                    Definition
                  </h4>
                  <p className="text-sm sm:text-base font-medium text-[#D8D8D8] leading-relaxed">
                    {inspectedWord.definition}
                  </p>
                </div>

                {/* Example sentence */}
                {inspectedWord.exampleUsage && (
                  <div className="p-3.5 rounded-xl bg-[#181818] border border-[#262626]">
                    <h5 className="text-[11px] font-bold uppercase tracking-wider text-[#737373] mb-1">
                      Example Usage
                    </h5>
                    <p className="text-xs sm:text-sm italic text-[#CCCCCC]">
                      "{inspectedWord.exampleUsage}"
                    </p>
                  </div>
                )}

                {/* Collocations & Synonyms */}
                {inspectedWord.collocations && inspectedWord.collocations.length > 0 && (
                  <div>
                    <h5 className="text-[11px] font-bold uppercase tracking-wider text-[#737373] mb-1.5">
                      Common Collocations & Phrases
                    </h5>
                    <div className="flex flex-wrap gap-1.5">
                      {inspectedWord.collocations.map((col, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-md bg-[#1C1C1C] border border-[#282828] text-[#CCCCCC] text-xs font-medium"
                        >
                          {col}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {inspectedWord.synonyms && inspectedWord.synonyms.length > 0 && (
                  <div>
                    <h5 className="text-[11px] font-bold uppercase tracking-wider text-[#737373] mb-1.5">
                      Synonyms
                    </h5>
                    <div className="flex flex-wrap gap-1.5">
                      {inspectedWord.synonyms.map((syn, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-md bg-[#0F291E] text-[#4ADE80] border border-[#166534] text-xs font-medium"
                        >
                          {syn}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-[#222222] flex items-center justify-between gap-3">
                <button
                  onClick={() => setIsInspectorOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-[#888888] hover:text-[#EDEDED] hover:bg-[#1A1A1A] transition-colors"
                >
                  Close
                </button>

                <button
                  onClick={handleSaveInspectedWord}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs ${
                    isWordSaved(inspectedWord.word)
                      ? 'bg-[#0F291E] text-[#4ADE80] border border-[#166534]'
                      : 'bg-[#C5A059] hover:bg-[#D4AF37] text-[#0A0A0A]'
                  }`}
                >
                  {isWordSaved(inspectedWord.word) ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Saved in Vocabulary Bank</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-4 h-4" />
                      <span>Save to My Vocab Bank (+15 XP)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sentence Simplifier Modal */}
      {isSimplifierOpen && simplification && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#121212] rounded-t-3xl sm:rounded-3xl w-full max-w-xl border border-[#2A2A2A] p-6 shadow-2xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200 text-[#EDEDED]">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#222222]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C5A059]" />
                <span className="text-sm font-bold font-display">Linguistic Breakdown & Simplification</span>
              </div>
              <button
                onClick={() => setIsSimplifierOpen(false)}
                className="p-1 rounded-lg hover:bg-[#1C1C1C] text-[#888888] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Original */}
              <div className="p-4 rounded-2xl bg-[#171717] border border-[#262626]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#737373] block mb-1">
                  Original Passage
                </span>
                <p className="text-xs sm:text-sm italic text-[#CCCCCC] leading-relaxed font-serif">
                  "{simplification.original}"
                </p>
              </div>

              {simplification.isLoading ? (
                <div className="py-8 text-center text-xs text-[#8A8A8A]">
                  <div className="inline-block w-6 h-6 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin mb-2" />
                  <p>AI is simplifying grammar and breaking down clauses...</p>
                </div>
              ) : (
                <>
                  {/* Simplified */}
                  <div className="p-4 rounded-2xl bg-[#241A0B] border border-[#5E4417]">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#E5C378] block mb-1.5 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" /> Simplified Plain English (A2/B1)
                    </span>
                    <p className="text-sm sm:text-base font-medium text-[#FFF0D4] leading-relaxed">
                      {simplification.simplified}
                    </p>
                  </div>

                  {/* Plain Meaning */}
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-[#737373] mb-1">
                      Key Takeaway & Meaning
                    </h5>
                    <p className="text-xs sm:text-sm text-[#CCCCCC] leading-relaxed">
                      {simplification.plainExplanation}
                    </p>
                  </div>

                  {/* Grammar Components Breakdown */}
                  {simplification.grammarBreakdown && simplification.grammarBreakdown.length > 0 && (
                    <div>
                      <h5 className="text-xs font-bold uppercase tracking-wider text-[#737373] mb-2">
                        Grammar & Structure Breakdown
                      </h5>
                      <div className="space-y-2">
                        {simplification.grammarBreakdown.map((item, i) => (
                          <div
                            key={i}
                            className="p-3 rounded-xl bg-[#181818] border border-[#262626] text-xs"
                          >
                            <span className="font-bold text-[#E5C378]">
                              {item.component}:
                            </span>{' '}
                            <span className="text-[#CCCCCC]">{item.explanation}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="mt-6 pt-3.5 border-t border-[#222222] flex justify-end">
              <button
                onClick={() => setIsSimplifierOpen(false)}
                className="px-6 py-2.5 rounded-xl bg-[#C5A059] hover:bg-[#D4AF37] text-[#0A0A0A] text-xs font-bold transition-all"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
