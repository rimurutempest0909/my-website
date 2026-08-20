import React, { useState } from 'react';
import {
  Bookmark,
  Volume2,
  Trash2,
  Search,
  SlidersHorizontal,
  RotateCw,
  Sparkles,
  Award,
  Layers,
  List,
  Download,
  CheckCircle2,
  HelpCircle,
  Play,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { SavedWord, SRSStage, CEFRLevel } from '../types';
import { soundManager } from '../utils/audioUtils';

interface VocabularyBankProps {
  savedWords: SavedWord[];
  onUpdateSRS: (wordId: string, performance: 'again' | 'hard' | 'good' | 'easy') => void;
  onRemoveWord: (wordId: string) => void;
}

export const VocabularyBank: React.FC<VocabularyBankProps> = ({
  savedWords,
  onUpdateSRS,
  onRemoveWord,
}) => {
  const [viewMode, setViewMode] = useState<'cards' | 'list' | 'quiz'>('cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('all');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>('all');

  // Flashcard review state
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Vocab Quiz Mode state
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [selectedQuizOption, setSelectedQuizOption] = useState<string | null>(null);
  const [isQuizAnswered, setIsQuizAnswered] = useState(false);

  // Filtered word list
  const filteredWords = savedWords.filter((w) => {
    const matchesSearch =
      w.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.definition.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStage =
      selectedStageFilter === 'all' || w.srsStage === selectedStageFilter;
    const matchesLevel =
      selectedLevelFilter === 'all' || w.cefrLevel === selectedLevelFilter;
    return matchesSearch && matchesStage && matchesLevel;
  });

  const dueForReviewWords = savedWords.filter((w) => {
    const nextDate = new Date(w.nextReviewDate);
    return nextDate <= new Date() || w.srsStage === 'new';
  });

  const currentFlashcard = filteredWords[cardIndex] || filteredWords[0];

  const handleSRSResponse = (performance: 'again' | 'hard' | 'good' | 'easy') => {
    if (!currentFlashcard) return;
    onUpdateSRS(currentFlashcard.id, performance);
    setIsFlipped(false);
    if (cardIndex < filteredWords.length - 1) {
      setCardIndex((prev) => prev + 1);
    } else {
      setCardIndex(0);
    }
  };

  const exportToCSV = () => {
    const headers = ['Word', 'Phonetic', 'Part of Speech', 'CEFR Level', 'Definition', 'Example Sentence', 'SRS Stage'];
    const rows = savedWords.map((w) => [
      `"${w.word}"`,
      `"${w.phonetic}"`,
      `"${w.partOfSpeech}"`,
      `"${w.cefrLevel}"`,
      `"${w.definition.replace(/"/g, '""')}"`,
      `"${(w.exampleUsage || '').replace(/"/g, '""')}"`,
      `"${w.srsStage}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `lexipulse_vocabulary_bank_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#EDEDED] font-display">
              My Vocabulary Bank
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#241A0B] text-[#E5C378] border border-[#5E4417]">
              {savedWords.length} words
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#888888] mt-1 font-light">
            Master newly discovered English words through Spaced Repetition System (SRS) intervals.
          </p>
        </div>

        {/* View Mode Switcher & Export */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-[#141414] p-1 rounded-xl border border-[#242424]">
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'cards'
                  ? 'bg-[#C5A059] text-[#0A0A0A] font-bold shadow-xs'
                  : 'text-[#888888] hover:text-[#EDEDED]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Flashcards</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'list'
                  ? 'bg-[#C5A059] text-[#0A0A0A] font-bold shadow-xs'
                  : 'text-[#888888] hover:text-[#EDEDED]'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Word List</span>
            </button>
            <button
              onClick={() => {
                setViewMode('quiz');
                setQuizIndex(0);
                setQuizScore(0);
                setIsQuizAnswered(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'quiz'
                  ? 'bg-[#C5A059] text-[#0A0A0A] font-bold shadow-xs'
                  : 'text-[#888888] hover:text-[#EDEDED]'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Practice Quiz</span>
            </button>
          </div>

          <button
            onClick={exportToCSV}
            disabled={savedWords.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#282828] bg-[#141414] hover:bg-[#1E1E1E] text-xs font-semibold text-[#CCCCCC] transition-colors disabled:opacity-40"
            title="Export vocabulary to Anki/CSV"
          >
            <Download className="w-3.5 h-3.5 text-[#C5A059]" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* SRS Mastery Summary Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <div className="p-4 rounded-2xl bg-[#121212] border border-[#242424]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
            New Words
          </span>
          <div className="text-2xl font-black text-[#EDEDED] mt-0.5 font-display">
            {savedWords.filter((w) => w.srsStage === 'new').length}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#121212] border border-[#242424]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#E5C378]">
            In Learning
          </span>
          <div className="text-2xl font-black text-[#EDEDED] mt-0.5 font-display">
            {savedWords.filter((w) => w.srsStage === 'learning').length}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#121212] border border-[#242424]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400">
            Review Phase
          </span>
          <div className="text-2xl font-black text-[#EDEDED] mt-0.5 font-display">
            {savedWords.filter((w) => w.srsStage === 'review').length}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#121212] border border-[#242424]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
            Mastered
          </span>
          <div className="text-2xl font-black text-[#EDEDED] mt-0.5 font-display">
            {savedWords.filter((w) => w.srsStage === 'mastered').length}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#666666] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search saved vocabulary or definitions..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#121212] border border-[#242424] text-xs sm:text-sm text-[#EDEDED] placeholder-[#666666] focus:ring-1 focus:ring-[#C5A059] focus:border-[#C5A059] focus:outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* SRS Stage Filter */}
          <select
            value={selectedStageFilter}
            onChange={(e) => setSelectedStageFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-[#121212] border border-[#242424] text-xs font-semibold text-[#CCCCCC] focus:ring-1 focus:ring-[#C5A059] focus:border-[#C5A059] focus:outline-none"
          >
            <option value="all" className="bg-[#121212]">All SRS Stages</option>
            <option value="new" className="bg-[#121212]">New</option>
            <option value="learning" className="bg-[#121212]">Learning</option>
            <option value="review" className="bg-[#121212]">Review</option>
            <option value="mastered" className="bg-[#121212]">Mastered</option>
          </select>

          {/* CEFR Level Filter */}
          <select
            value={selectedLevelFilter}
            onChange={(e) => setSelectedLevelFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-[#121212] border border-[#242424] text-xs font-semibold text-[#CCCCCC] focus:ring-1 focus:ring-[#C5A059] focus:border-[#C5A059] focus:outline-none"
          >
            <option value="all" className="bg-[#121212]">All CEFR Levels</option>
            <option value="A1" className="bg-[#121212]">A1 Beginner</option>
            <option value="A2" className="bg-[#121212]">A2 Elementary</option>
            <option value="B1" className="bg-[#121212]">B1 Intermediate</option>
            <option value="B2" className="bg-[#121212]">B2 Upper Int</option>
            <option value="C1" className="bg-[#121212]">C1 Advanced</option>
            <option value="C2" className="bg-[#121212]">C2 Mastery</option>
          </select>
        </div>
      </div>

      {/* No Saved Words Empty State */}
      {savedWords.length === 0 ? (
        <div className="text-center py-16 px-4 bg-[#121212] rounded-3xl border border-[#242424]">
          <div className="w-14 h-14 rounded-2xl bg-[#241A0B] text-[#E5C378] border border-[#5E4417] flex items-center justify-center mx-auto mb-3">
            <Bookmark className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-[#EDEDED] font-display">
            No words saved yet
          </h3>
          <p className="text-xs sm:text-sm text-[#888888] max-w-sm mx-auto mt-1 font-light">
            Read daily articles and click on any interesting word to save it into your Spaced Repetition Bank!
          </p>
        </div>
      ) : filteredWords.length === 0 ? (
        <div className="text-center py-12 bg-[#121212] rounded-3xl border border-[#242424] text-xs sm:text-sm text-[#888888]">
          No words match your search filter.
        </div>
      ) : viewMode === 'cards' ? (
        /* --- 1. Flashcard Mode --- */
        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-between text-xs text-[#888888] mb-2 px-1">
            <span>
              Card {cardIndex + 1} of {filteredWords.length}
            </span>
            <span className="font-semibold uppercase tracking-wider text-[#E5C378]">
              Stage: {currentFlashcard.srsStage}
            </span>
          </div>

          {/* Flashcard Box */}
          <div
            onClick={() => {
              setIsFlipped(!isFlipped);
              if (!isFlipped) {
                soundManager.speakWord(currentFlashcard.word);
              }
            }}
            className="min-h-[320px] bg-[#121212] rounded-3xl p-8 border border-[#282828] shadow-2xl cursor-pointer flex flex-col justify-between items-center text-center transition-all hover:border-[#C5A059]/60"
          >
            {!isFlipped ? (
              /* Front of Card */
              <div className="my-auto">
                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-[#241A0B] text-[#E5C378] border border-[#5E4417]">
                  CEFR {currentFlashcard.cefrLevel}
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold capitalize text-[#EDEDED] tracking-tight mt-4 font-display">
                  {currentFlashcard.word}
                </h2>
                <p className="text-sm font-mono text-[#888888] mt-1">{currentFlashcard.phonetic}</p>
                <span className="text-xs text-[#A0A0A0] italic mt-2 block">
                  {currentFlashcard.partOfSpeech}
                </span>
                <p className="text-xs text-[#737373] mt-8 flex items-center justify-center gap-1.5">
                  <RotateCw className="w-3.5 h-3.5 text-[#C5A059]" /> Tap card to reveal definition & example
                </p>
              </div>
            ) : (
              /* Back of Card */
              <div className="my-auto space-y-4 text-left w-full animate-in fade-in">
                <div className="flex items-center justify-between border-b border-[#242424] pb-2">
                  <h3 className="text-xl font-bold capitalize text-[#EDEDED] font-display">
                    {currentFlashcard.word}
                  </h3>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      soundManager.speakWord(currentFlashcard.word);
                    }}
                    className="p-2 rounded-full bg-[#241A0B] text-[#E5C378] border border-[#5E4417] hover:bg-[#32230E] transition-colors"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#737373] block mb-1">
                    Definition
                  </span>
                  <p className="text-sm sm:text-base font-medium text-[#D8D8D8] leading-relaxed">
                    {currentFlashcard.definition}
                  </p>
                </div>

                {currentFlashcard.exampleUsage && (
                  <div className="p-3.5 rounded-2xl bg-[#181818] border border-[#242424]">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#737373] block mb-0.5">
                      Example
                    </span>
                    <p className="text-xs sm:text-sm italic text-[#CCCCCC] leading-relaxed">
                      "{currentFlashcard.exampleUsage}"
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SRS Grading Buttons */}
          <div className="mt-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#737373] text-center block mb-2">
              How well did you remember this word?
            </span>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => handleSRSResponse('again')}
                className="py-2.5 px-2 rounded-xl bg-[#2E1417] border border-[#881337]/50 text-rose-300 hover:bg-[#3D1A1F] text-xs font-bold transition-colors"
              >
                Again (<span className="font-mono">12h</span>)
              </button>
              <button
                onClick={() => handleSRSResponse('hard')}
                className="py-2.5 px-2 rounded-xl bg-[#291C0E] border border-[#6B4B1B]/50 text-[#E5C378] hover:bg-[#382613] text-xs font-bold transition-colors"
              >
                Hard (<span className="font-mono">1d</span>)
              </button>
              <button
                onClick={() => handleSRSResponse('good')}
                className="py-2.5 px-2 rounded-xl bg-[#0F2236] border border-[#1E40AF]/50 text-blue-300 hover:bg-[#142D47] text-xs font-bold transition-colors"
              >
                Good (<span className="font-mono">3d</span>)
              </button>
              <button
                onClick={() => handleSRSResponse('easy')}
                className="py-2.5 px-2 rounded-xl bg-[#0F291E] border border-[#166534]/50 text-emerald-300 hover:bg-[#143B2B] text-xs font-bold transition-colors"
              >
                Easy (<span className="font-mono">7d</span>)
              </button>
            </div>
          </div>
        </div>
      ) : viewMode === 'list' ? (
        /* --- 2. Word List Mode --- */
        <div className="bg-[#121212] rounded-3xl border border-[#242424] shadow-xl overflow-hidden">
          <div className="divide-y divide-[#202020]">
            {filteredWords.map((w) => (
              <div
                key={w.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#181818]/60 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-bold text-[#EDEDED] capitalize font-display">
                      {w.word}
                    </h3>
                    <span className="text-xs font-mono text-[#888888]">{w.phonetic}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#1C1C1C] text-[#A0A0A0] font-medium border border-[#2A2A2A]">
                      {w.partOfSpeech}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-[#241A0B] text-[#E5C378] border border-[#5E4417]">
                      CEFR {w.cefrLevel}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        w.srsStage === 'mastered'
                          ? 'bg-[#0F291E] text-[#4ADE80] border border-[#166534]'
                          : w.srsStage === 'review'
                          ? 'bg-[#241333] text-[#C084FC] border border-[#6B21A8]'
                          : w.srsStage === 'learning'
                          ? 'bg-[#241A0B] text-[#E5C378] border border-[#5E4417]'
                          : 'bg-[#0F2236] text-[#60A5FA] border border-[#1E40AF]'
                      }`}
                    >
                      {w.srsStage}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-[#CCCCCC] mt-1.5 font-medium leading-relaxed">
                    {w.definition}
                  </p>

                  {w.exampleUsage && (
                    <p className="text-xs italic text-[#8A8A8A] mt-1">
                      "{w.exampleUsage}"
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => soundManager.speakWord(w.word)}
                    className="p-2 rounded-xl bg-[#1A1A1A] hover:bg-[#241A0B] text-[#A0A0A0] hover:text-[#E5C378] border border-[#282828] transition-colors"
                    title="Pronounce word"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onRemoveWord(w.id)}
                    className="p-2 rounded-xl bg-[#1A1A1A] hover:bg-[#2E1417] text-[#737373] hover:text-[#FB7185] border border-[#282828] transition-colors"
                    title="Remove from bank"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* --- 3. Practice Quiz Mode for Saved Words --- */
        <div className="max-w-xl mx-auto bg-[#121212] rounded-3xl p-6 sm:p-8 border border-[#242424] shadow-2xl">
          {filteredWords.length < 3 ? (
            <div className="text-center py-6 text-sm text-[#888888]">
              You need at least 3 words in your vocabulary bank to run the practice quiz.
            </div>
          ) : quizIndex >= filteredWords.length ? (
            <div className="text-center py-8">
              <Award className="w-12 h-12 text-[#C5A059] mx-auto mb-2" />
              <h3 className="text-xl font-bold font-display text-[#EDEDED]">Vocabulary Practice Complete!</h3>
              <p className="text-sm text-[#888888] mt-1">
                You scored {quizScore} / {filteredWords.length}
              </p>
              <button
                onClick={() => {
                  setQuizIndex(0);
                  setQuizScore(0);
                  setIsQuizAnswered(false);
                }}
                className="mt-4 px-6 py-2.5 rounded-xl bg-[#C5A059] hover:bg-[#D4AF37] text-[#0A0A0A] text-xs font-bold transition-all shadow-xs"
              >
                Restart Practice
              </button>
            </div>
          ) : (
            (() => {
              const currentQWord = filteredWords[quizIndex];
              // Create 3 distractors
              const otherWords = savedWords.filter((w) => w.id !== currentQWord.id);
              const shuffledOthers = [...otherWords].sort(() => 0.5 - Math.random()).slice(0, 3);
              const options = [currentQWord, ...shuffledOthers].sort(() => 0.5 - Math.random());

              return (
                <div>
                  <div className="flex items-center justify-between text-xs text-[#888888] mb-4 pb-2 border-b border-[#222222]">
                    <span>
                      Question {quizIndex + 1} of {filteredWords.length}
                    </span>
                    <span className="font-bold text-[#E5C378]">Score: {quizScore}</span>
                  </div>

                  <span className="text-xs font-bold uppercase tracking-wider text-[#737373]">
                    Select the correct definition for:
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold capitalize text-[#EDEDED] mt-1 mb-6 font-display">
                    {currentQWord.word}
                  </h2>

                  <div className="space-y-3">
                    {options.map((opt, i) => {
                      const isCorrect = opt.id === currentQWord.id;
                      const isSelected = selectedQuizOption === opt.id;

                      let style = 'border-[#242424] hover:border-[#C5A059]/60 bg-[#181818] text-[#CCCCCC]';
                      if (isQuizAnswered) {
                        if (isCorrect) style = 'border-[#166534] bg-[#0C1A14] text-[#4ADE80] font-semibold ring-1 ring-[#166534]';
                        else if (isSelected) style = 'border-[#881337] bg-[#1F0E12] text-[#FB7185] ring-1 ring-[#881337]';
                        else style = 'border-[#242424] bg-[#141414] opacity-40 text-[#666666]';
                      }

                      return (
                        <button
                          key={i}
                          disabled={isQuizAnswered}
                          onClick={() => {
                            setSelectedQuizOption(opt.id);
                            setIsQuizAnswered(true);
                            if (isCorrect) setQuizScore((prev) => prev + 1);
                          }}
                          className={`w-full text-left p-4 rounded-2xl border text-xs sm:text-sm font-medium transition-all leading-relaxed ${style}`}
                        >
                          {opt.definition}
                        </button>
                      );
                    })}
                  </div>

                  {isQuizAnswered && (
                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={() => {
                          setSelectedQuizOption(null);
                          setIsQuizAnswered(false);
                          setQuizIndex((prev) => prev + 1);
                        }}
                        className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#C5A059] hover:bg-[#D4AF37] text-[#0A0A0A] font-bold text-xs sm:text-sm transition-all shadow-xs active:scale-95"
                      >
                        <span>Next Word</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })()
          )}
        </div>
      )}
    </div>
  );
};
