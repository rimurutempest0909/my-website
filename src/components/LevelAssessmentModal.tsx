import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Award,
  CheckCircle2,
  XCircle,
  X,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Check,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { CEFRLevel, PlacementQuestion } from '../types';
import { DEFAULT_PLACEMENT_QUESTIONS, CEFR_LEVELS_MAP, CEFR_LEVELS_ARRAY } from '../data/cefrLevels';

interface LevelAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLevel: CEFRLevel;
  onSelectRecommendedLevel: (level: CEFRLevel) => void;
}

export const LevelAssessmentModal: React.FC<LevelAssessmentModalProps> = ({
  isOpen,
  onClose,
  currentLevel,
  onSelectRecommendedLevel,
}) => {
  const [questions, setQuestions] = useState<PlacementQuestion[]>(DEFAULT_PLACEMENT_QUESTIONS);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [isTestComplete, setIsTestComplete] = useState(false);
  const [isGeneratingAiTest, setIsGeneratingAiTest] = useState(false);

  if (!isOpen) return null;

  const currentQ = questions[currentIdx];
  const isLastQ = currentIdx === questions.length - 1;

  const handleSelect = (optionIdx: number) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQ.id]: optionIdx,
    });
  };

  const handleNext = () => {
    if (isLastQ) {
      setIsTestComplete(true);
      confetti({ particleCount: 70, spread: 60 });
    } else {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  // Calculate placement level based on highest consecutive correctly answered difficulty
  const calculateRecommendedLevel = (): CEFRLevel => {
    let scoreCount = 0;
    let highestLevelPassed: CEFRLevel = 'A1';

    questions.forEach((q, idx) => {
      const userAns = selectedAnswers[q.id];
      if (userAns === q.correctIndex) {
        scoreCount += 1;
        highestLevelPassed = q.level;
      }
    });

    // Score mappings
    if (scoreCount <= 1) return 'A1';
    if (scoreCount === 2) return 'A2';
    if (scoreCount === 3) return 'B1';
    if (scoreCount === 4) return 'B2';
    if (scoreCount === 5) return 'C1';
    return 'C2';
  };

  const handleGenerateFreshAiTest = async () => {
    setIsGeneratingAiTest(true);
    try {
      const res = await fetch('/api/assessment/generate', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.questions && data.questions.length > 0) {
          setQuestions(data.questions);
          setCurrentIdx(0);
          setSelectedAnswers({});
          setIsTestComplete(false);
        }
      }
    } catch (e) {
      console.error('Error generating AI test:', e);
    } finally {
      setIsGeneratingAiTest(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
      <div className="bg-[#121212] rounded-3xl w-full max-w-2xl border border-[#282828] p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto text-[#E5E5E5]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#222222]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#8C6B2D] text-[#0A0A0A] flex items-center justify-center shadow-lg shadow-[#C5A059]/20">
              <Award className="w-4 h-4 text-[#0A0A0A]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-display text-[#EDEDED]">CEFR Placement Diagnostic</h2>
              <p className="text-xs text-[#888888] font-light">6-question quick proficiency calibration</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#1E1E1E] text-[#888888] hover:text-[#EDEDED] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isTestComplete ? (
          /* Active Question */
          <div className="mt-6">
            {/* Progress */}
            <div className="flex items-center justify-between text-xs text-[#888888] mb-2">
              <span className="font-semibold text-[#E5C378]">
                Testing CEFR {currentQ.level} Difficulty
              </span>
              <span>
                Question {currentIdx + 1} of {questions.length}
              </span>
            </div>

            <div className="h-1.5 w-full bg-[#1C1C1C] rounded-full overflow-hidden mb-6 border border-[#2A2A2A]">
              <div
                className="h-full bg-[#C5A059] transition-all duration-300"
                style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
              />
            </div>

            {/* Passage / Prompt */}
            <div className="p-4 rounded-2xl bg-[#181818] border border-[#2A2A2A] mb-5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#737373] block mb-1">
                Reading Sample
              </span>
              <p className="text-xs sm:text-sm italic font-serif text-[#CCCCCC] leading-relaxed">
                "{currentQ.passageOrPrompt}"
              </p>
            </div>

            {/* Question */}
            <h3 className="text-sm sm:text-base font-bold mb-4 font-display text-[#EDEDED]">{currentQ.question}</h3>

            {/* Options */}
            <div className="space-y-2.5">
              {currentQ.options.map((opt, optIdx) => {
                const isSelected = selectedAnswers[currentQ.id] === optIdx;
                return (
                  <button
                    key={optIdx}
                    onClick={() => handleSelect(optIdx)}
                    className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm font-medium transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-[#C5A059] bg-[#241A0B] text-[#E5C378] ring-1 ring-[#C5A059]'
                        : 'border-[#262626] bg-[#181818] text-[#CCCCCC] hover:border-[#383838] hover:bg-[#1E1E1E]'
                    }`}
                  >
                    <span>{opt}</span>
                    {isSelected && <Check className="w-4 h-4 text-[#C5A059] shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Bottom Actions */}
            <div className="mt-8 pt-4 border-t border-[#222222] flex items-center justify-between">
              <button
                onClick={handleGenerateFreshAiTest}
                disabled={isGeneratingAiTest}
                className="text-xs text-[#888888] hover:text-[#E5C378] flex items-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>{isGeneratingAiTest ? 'Generating...' : 'Generate New Questions with AI'}</span>
              </button>

              <button
                onClick={handleNext}
                disabled={selectedAnswers[currentQ.id] === undefined}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#C5A059] hover:bg-[#D4AF37] disabled:opacity-40 text-[#0A0A0A] font-extrabold text-xs sm:text-sm transition-all active:scale-95 shadow-md"
              >
                <span>{isLastQ ? 'Complete Calibration' : 'Next'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Test Results & Recommendation */
          <div className="mt-6 text-center animate-in fade-in">
            {(() => {
              const recommendedLevel = calculateRecommendedLevel();
              const levelInfo = CEFR_LEVELS_MAP[recommendedLevel];
              let totalCorrect = 0;
              questions.forEach((q) => {
                if (selectedAnswers[q.id] === q.correctIndex) totalCorrect += 1;
              });

              return (
                <div>
                  <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#D4AF37] to-[#8C6B2D] text-[#0A0A0A] flex items-center justify-center mx-auto mb-3 shadow-lg shadow-[#C5A059]/20">
                    <ShieldCheck className="w-8 h-8 text-[#0A0A0A]" />
                  </div>

                  <span className="text-xs font-bold uppercase tracking-wider text-[#737373]">
                    Assessment Result
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold mt-1 text-[#EDEDED] font-display">
                    Recommended Level: CEFR {recommendedLevel}
                  </h2>
                  <p className="text-sm text-[#CCCCCC] font-semibold mt-1">
                    {levelInfo.name} · {levelInfo.tagline}
                  </p>

                  <div className="my-6 p-5 rounded-2xl bg-[#1C160B] border border-[#4A3716] text-left">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#E5C378] mb-1.5 font-display">
                      What this means for you:
                    </h4>
                    <p className="text-xs sm:text-sm text-[#CCCCCC] leading-relaxed mb-4 font-light">
                      {levelInfo.description}
                    </p>
                    <div className="text-xs text-[#A0A0A0] space-y-1.5 border-t border-[#33240F] pt-3">
                      <div>
                        <strong className="text-[#E5C378]">Target Vocabulary Size:</strong> {levelInfo.estimatedVocab}
                      </div>
                      <div>
                        <strong className="text-[#E5C378]">Optimal Reading Speed:</strong> {levelInfo.readingSpeedWPM}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      onClick={() => {
                        onSelectRecommendedLevel(recommendedLevel);
                        onClose();
                      }}
                      className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#C5A059] hover:bg-[#D4AF37] text-[#0A0A0A] font-extrabold text-xs sm:text-sm transition-all shadow-md active:scale-95"
                    >
                      Apply CEFR {recommendedLevel} as My Daily Level
                    </button>

                    <button
                      onClick={() => {
                        setCurrentIdx(0);
                        setSelectedAnswers({});
                        setIsTestComplete(false);
                      }}
                      className="w-full sm:w-auto px-5 py-3 rounded-xl border border-[#2A2A2A] text-xs sm:text-sm font-semibold text-[#CCCCCC] hover:bg-[#1C1C1C] hover:text-[#EDEDED] transition-colors"
                    >
                      Retake Test
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};
