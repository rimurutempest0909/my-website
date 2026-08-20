import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  XCircle,
  Award,
  ArrowRight,
  RotateCcw,
  Sparkles,
  HelpCircle,
  BookOpen,
  ArrowLeft,
  Send,
  MessageSquare,
  Bookmark,
} from 'lucide-react';
import { Article, ComprehensionQuestion, QuizSubmission, SummaryEvaluationResponse, SavedWord } from '../types';

interface ComprehensionQuizProps {
  article: Article;
  onBackToArticle: () => void;
  onQuizComplete: (submission: QuizSubmission) => void;
  onSaveWord: (wordData: Omit<SavedWord, 'id' | 'dateAdded' | 'srsStage' | 'nextReviewDate' | 'timesReviewed' | 'correctCount'>) => void;
}

export const ComprehensionQuiz: React.FC<ComprehensionQuizProps> = ({
  article,
  onBackToArticle,
  onQuizComplete,
  onSaveWord,
}) => {
  const questions: ComprehensionQuestion[] = article.comprehensionQuestions || [];
  
  // Filter multiple-choice / objective questions vs open-ended
  const objectiveQuestions = questions.filter((q) => q.type !== 'open_ended');
  const openEndedQuestion = questions.find((q) => q.type === 'open_ended');

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [isQuizFinished, setIsQuizFinished] = useState(false);

  // Open-ended written response state
  const [openResponseText, setOpenResponseText] = useState('');
  const [isEvaluatingSummary, setIsEvaluatingSummary] = useState(false);
  const [summaryEvaluation, setSummaryEvaluation] = useState<SummaryEvaluationResponse | null>(null);

  const currentQ = objectiveQuestions[currentIdx];
  const isLastObjective = currentIdx === objectiveQuestions.length - 1;

  const handleSelectOption = (option: string) => {
    if (showExplanation) return; // Prevent changing after confirmed
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQ.id]: option,
    });
    setShowExplanation(true);
  };

  const handleNext = () => {
    setShowExplanation(false);
    if (!isLastObjective) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    setIsQuizFinished(true);

    // Calculate score
    let score = 0;
    objectiveQuestions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctAnswer) {
        score += 1;
      }
    });

    // Trigger celebratory confetti if score is >= 70%
    const scorePct = (score / objectiveQuestions.length) * 100;
    if (scorePct >= 70) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }

    const submission: QuizSubmission = {
      articleId: article.id,
      timestamp: new Date().toISOString(),
      score,
      totalQuestions: objectiveQuestions.length,
      answers: selectedAnswers,
      openResponseFeedback: summaryEvaluation || undefined,
    };

    onQuizComplete(submission);
  };

  const handleEvaluateOpenResponse = async () => {
    if (!openResponseText.trim()) return;
    setIsEvaluatingSummary(true);

    try {
      const response = await fetch('/api/comprehension/evaluate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleTitle: article.title,
          articleSummary: article.summary,
          userWrittenResponse: openResponseText,
          promptQuestion: openEndedQuestion?.question || 'Summarize the article.',
          targetLevel: article.level,
        }),
      });

      if (response.ok) {
        const data: SummaryEvaluationResponse = await response.json();
        setSummaryEvaluation(data);
      }
    } catch (e) {
      console.error('Summary evaluation error:', e);
    } finally {
      setIsEvaluatingSummary(false);
    }
  };

  const calculateFinalScore = () => {
    let correct = 0;
    objectiveQuestions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctAnswer) {
        correct += 1;
      }
    });
    return {
      correct,
      total: objectiveQuestions.length,
      percentage: Math.round((correct / objectiveQuestions.length) * 100),
    };
  };

  // 1. Finished Screen
  if (isQuizFinished) {
    const { correct, total, percentage } = calculateFinalScore();

    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 animate-in fade-in">
        <div className="bg-[#121212] rounded-3xl p-6 sm:p-10 border border-[#242424] shadow-2xl text-[#E5E5E5]">
          {/* Result Banner */}
          <div className="text-center pb-8 border-b border-[#222222]">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#8C6B2D] text-[#0A0A0A] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#C5A059]/20">
              <Award className="w-8 h-8 text-[#0A0A0A]" />
            </div>

            <span className="text-xs font-bold uppercase tracking-wider text-[#E5C378]">
              Comprehension Assessment Complete
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 font-display text-[#EDEDED]">
              {percentage >= 80 ? 'Outstanding Comprehension!' : percentage >= 50 ? 'Good Effort!' : 'Keep Practicing!'}
            </h2>

            <div className="mt-5 flex items-center justify-center gap-6">
              <div className="text-center">
                <span className="text-3xl sm:text-4xl font-extrabold text-[#EDEDED] font-display">
                  {correct}/{total}
                </span>
                <p className="text-xs text-[#8A8A8A] mt-0.5">Correct Answers</p>
              </div>
              <div className="h-10 w-px bg-[#262626]" />
              <div className="text-center">
                <span className="text-3xl sm:text-4xl font-extrabold text-[#E5C378] font-display">
                  {percentage}%
                </span>
                <p className="text-xs text-[#8A8A8A] mt-0.5">Accuracy Score</p>
              </div>
              <div className="h-10 w-px bg-[#262626]" />
              <div className="text-center">
                <span className="text-3xl sm:text-4xl font-extrabold text-[#D4AF37] font-display">
                  +{Math.round((correct / total) * 100)}
                </span>
                <p className="text-xs text-[#8A8A8A] mt-0.5">XP Gained</p>
              </div>
            </div>
          </div>

          {/* Open-Ended Summary Challenge Section */}
          {openEndedQuestion && (
            <div className="mt-8 p-6 rounded-3xl bg-[#1A160F] border border-[#3E2E16]">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-[#C5A059]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#E5C378]">
                  Bonus: Written Expression Challenge
                </h3>
              </div>
              <p className="text-sm text-[#CCCCCC] mb-3 leading-relaxed font-light">
                {openEndedQuestion.question}
              </p>

              <textarea
                value={openResponseText}
                onChange={(e) => setOpenResponseText(e.target.value)}
                placeholder="Write your answer or summary here in English..."
                rows={4}
                className="w-full rounded-2xl p-3.5 text-sm bg-[#121212] border border-[#2A2A2A] text-[#EDEDED] placeholder-[#666666] focus:ring-1 focus:ring-[#C5A059] focus:border-[#C5A059] focus:outline-none transition-colors"
              />

              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-[#737373]">
                  {openResponseText.split(/\s+/).filter(Boolean).length} words
                </span>
                <button
                  onClick={handleEvaluateOpenResponse}
                  disabled={isEvaluatingSummary || !openResponseText.trim()}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#C5A059] hover:bg-[#D4AF37] disabled:opacity-50 text-[#0A0A0A] text-xs font-bold transition-all shadow-xs"
                >
                  {isEvaluatingSummary ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-[#0A0A0A] border-t-transparent rounded-full animate-spin" />
                      <span>Grading...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Get AI Feedback & Grammar Check</span>
                    </>
                  )}
                </button>
              </div>

              {/* Summary Evaluation Report */}
              {summaryEvaluation && (
                <div className="mt-5 p-4 rounded-2xl bg-[#141414] border border-[#3E2E16] animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-[#242424] pb-2 mb-3">
                    <span className="text-xs font-bold text-[#E5C378]">
                      AI Writing Evaluation ({summaryEvaluation.comprehensionAccuracy})
                    </span>
                    <span className="text-sm font-extrabold text-[#D4AF37]">
                      Score: {summaryEvaluation.score}/100
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-[#CCCCCC] leading-relaxed mb-3">
                    {summaryEvaluation.feedbackSummary}
                  </p>

                  {/* Grammar Improvements */}
                  {summaryEvaluation.grammarSuggestions && summaryEvaluation.grammarSuggestions.length > 0 && (
                    <div className="space-y-2 mt-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#737373]">
                        Grammar & Phrasing Polish:
                      </span>
                      {summaryEvaluation.grammarSuggestions.map((sug, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-xl bg-[#181818] text-xs border border-[#242424]"
                        >
                          <div className="line-through text-rose-400">{sug.originalPart}</div>
                          <div className="font-semibold text-emerald-400 mt-0.5">
                            → {sug.improvedPart}
                          </div>
                          <p className="text-[11px] text-[#888888] mt-1">{sug.reason}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Question Breakdown Review */}
          <div className="mt-8 space-y-4">
            <h3 className="text-base font-bold flex items-center gap-2 text-[#EDEDED] font-display">
              <HelpCircle className="w-4 h-4 text-[#C5A059]" /> Question Breakdown Review
            </h3>

            {objectiveQuestions.map((q, idx) => {
              const userAns = selectedAnswers[q.id];
              const isCorrect = userAns === q.correctAnswer;

              return (
                <div
                  key={q.id}
                  className={`p-4 rounded-2xl border text-sm ${
                    isCorrect
                      ? 'border-[#166534] bg-[#0C1A14]'
                      : 'border-[#881337] bg-[#1F0E12]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-semibold text-xs text-[#8A8A8A]">
                      Question {idx + 1} ({q.type.replace('_', ' ')})
                    </span>
                    {isCorrect ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-[#4ADE80]">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-bold text-[#FB7185]">
                        <XCircle className="w-3.5 h-3.5" /> Incorrect
                      </span>
                    )}
                  </div>

                  <p className="font-medium text-[#EDEDED] mb-2">{q.question}</p>

                  <div className="text-xs space-y-1">
                    <p>
                      <strong className="text-[#888888]">Your Answer:</strong>{' '}
                      <span className={isCorrect ? 'text-[#4ADE80] font-semibold' : 'text-[#FB7185] font-semibold'}>
                        {userAns || 'No answer'}
                      </span>
                    </p>
                    {!isCorrect && (
                      <p>
                        <strong className="text-[#888888]">Correct Answer:</strong>{' '}
                        <span className="text-[#4ADE80] font-semibold">
                          {q.correctAnswer}
                        </span>
                      </p>
                    )}
                  </div>

                  <p className="text-xs text-[#8E8E8E] mt-2 pt-2 border-t border-[#222222]">
                    <strong className="text-[#CCCCCC]">Explanation:</strong> {q.explanation}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="mt-8 pt-6 border-t border-[#222222] flex items-center justify-between gap-3">
            <button
              onClick={() => {
                setSelectedAnswers({});
                setCurrentIdx(0);
                setIsQuizFinished(false);
                setShowExplanation(false);
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#2A2A2A] hover:bg-[#1C1C1C] text-xs sm:text-sm font-semibold text-[#CCCCCC] transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> Retake Quiz
            </button>

            <button
              onClick={onBackToArticle}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#C5A059] hover:bg-[#D4AF37] text-[#0A0A0A] font-extrabold text-xs sm:text-sm transition-all shadow-xs"
            >
              <BookOpen className="w-4 h-4" /> Back to Daily Articles
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Active Quiz Question View
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 animate-in fade-in">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBackToArticle}
          className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#888888] hover:text-[#EDEDED] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Exit Quiz
        </button>

        {/* Progress Dots */}
        <div className="flex items-center gap-1.5">
          {objectiveQuestions.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i === currentIdx
                  ? 'w-6 bg-[#C5A059]'
                  : i < currentIdx
                  ? 'w-2 bg-emerald-500'
                  : 'w-2 bg-[#262626]'
              }`}
            />
          ))}
        </div>

        <span className="text-xs font-bold text-[#888888]">
          {currentIdx + 1} / {objectiveQuestions.length}
        </span>
      </div>

      {/* Question Card */}
      <div className="bg-[#121212] rounded-3xl p-6 sm:p-8 border border-[#242424] shadow-2xl text-[#E5E5E5]">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-[#241A0B] text-[#E5C378] border border-[#5E4417]">
            {currentQ.type === 'vocab_context'
              ? 'Vocabulary in Context'
              : currentQ.type === 'true_false'
              ? 'True / False Analysis'
              : 'Reading Comprehension'}
          </span>
        </div>

        <h2 className="text-lg sm:text-xl font-bold tracking-tight leading-snug mt-2 mb-6 font-display text-[#EDEDED]">
          {currentQ.question}
        </h2>

        {/* Options */}
        <div className="space-y-3">
          {(currentQ.options || ['True', 'False', 'Not Given']).map((option, idx) => {
            const isSelected = selectedAnswers[currentQ.id] === option;
            const isCorrect = option === currentQ.correctAnswer;

            let optionStyle = 'border-[#242424] hover:border-[#C5A059]/60 bg-[#181818] text-[#D8D8D8] hover:bg-[#1E1E1E]';

            if (showExplanation) {
              if (isCorrect) {
                optionStyle = 'border-[#166534] bg-[#0C1A14] text-[#4ADE80] font-semibold ring-1 ring-[#166534]';
              } else if (isSelected && !isCorrect) {
                optionStyle = 'border-[#881337] bg-[#1F0E12] text-[#FB7185] ring-1 ring-[#881337]';
              } else {
                optionStyle = 'border-[#242424] bg-[#141414] opacity-40 text-[#666666]';
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelectOption(option)}
                disabled={showExplanation}
                className={`w-full text-left p-4 rounded-2xl border transition-all text-xs sm:text-sm flex items-start justify-between gap-3 ${optionStyle}`}
              >
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-lg bg-[#222222] text-[#E5C378] font-bold text-xs flex items-center justify-center shrink-0 border border-[#2E2E2E]">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="leading-snug">{option}</span>
                </div>

                {showExplanation && (
                  <div>
                    {isCorrect && <CheckCircle2 className="w-5 h-5 text-[#4ADE80] shrink-0" />}
                    {isSelected && !isCorrect && <XCircle className="w-5 h-5 text-[#FB7185] shrink-0" />}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Explanation Card */}
        {showExplanation && (
          <div className="mt-6 p-4 rounded-2xl bg-[#181818] border border-[#2A2A2A] animate-in fade-in">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#E5C378] mb-1">
              Explanation & Context
            </h4>
            <p className="text-xs sm:text-sm text-[#CCCCCC] leading-relaxed">
              {currentQ.explanation}
            </p>
          </div>
        )}

        {/* Next Question / Finish Button */}
        {showExplanation && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#C5A059] hover:bg-[#D4AF37] text-[#0A0A0A] font-extrabold text-xs sm:text-sm transition-all shadow-md active:scale-95"
            >
              <span>{isLastObjective ? 'View Final Results' : 'Next Question'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
