import React, { useState, useEffect, useRef } from "react";
import { 
  FileText, Sparkles, AlertCircle, HelpCircle, Trophy, RefreshCw, 
  Clock, Check, X, ArrowRight, BookOpen, AlertCircle as CheckIcon, CheckCircle2
} from "lucide-react";
import { DocumentItem, QuizQuestion } from "../types";
import { exportQuizToPDF } from "../utils/pdfExport";

interface QuizPageProps {
  activeDoc: DocumentItem | null;
  quizQuestions: QuizQuestion[] | null;
  onGenerateQuiz: (type: string, difficulty: string, count: number) => Promise<void>;
  isGenerating: boolean;
  onResetQuiz: () => void;
}

export default function QuizPage({
  activeDoc,
  quizQuestions,
  onGenerateQuiz,
  isGenerating,
  onResetQuiz,
}: QuizPageProps) {
  // Config selection states
  const [qType, setQType] = useState<string>("all");
  const [difficulty, setDifficulty] = useState<string>("medium");
  const [qCount, setQCount] = useState<number>(10);

  // Active playing states
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [submittedQuestions, setSubmittedQuestions] = useState<Record<string, boolean>>({});
  const [showResults, setShowResults] = useState<boolean>(false);
  const [quizTimer, setQuizTimer] = useState<number>(0);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load and unload timer
  useEffect(() => {
    if (isTimerActive) {
      timerRef.current = setInterval(() => {
        setQuizTimer((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerActive]);

  if (!activeDoc) {
    return (
      <div className="py-16 text-center bg-white rounded-2xl border border-slate-100 shadow-3xs max-w-xl mx-auto px-6 mt-10">
        <FileText className="w-16 h-16 text-slate-205 mx-auto stroke-[1.2]" />
        <h3 className="font-display font-semibold text-slate-800 text-lg mt-4">No active study document</h3>
        <p className="text-sm text-slate-400 mt-2">
          Select or upload your notes in the <strong>Dashboard</strong> to test yourself with computed exams.
        </p>
      </div>
    );
  }

  const handleStartQuiz = async () => {
    await onGenerateQuiz(qType, difficulty, qCount);
    setQuizTimer(0);
    setCurrentIdx(0);
    setSelectedAnswers({});
    setSubmittedQuestions({});
    setShowResults(false);
    setIsTimerActive(true);
  };

  const currentQuestion = quizQuestions ? quizQuestions[currentIdx] : null;

  const handleSelectOption = (option: string) => {
    if (!currentQuestion || submittedQuestions[currentQuestion.id]) return;
    setSelectedAnswers((prev) => ({ ...prev, [currentQuestion.id]: option }));
  };

  const handleTextAnswerChange = (text: string) => {
    if (!currentQuestion || submittedQuestions[currentQuestion.id]) return;
    setSelectedAnswers((prev) => ({ ...prev, [currentQuestion.id]: text }));
  };

  const handleVerifyQuestion = () => {
    if (!currentQuestion) return;
    setSubmittedQuestions((prev) => ({ ...prev, [currentQuestion.id]: true }));
  };

  const handleNextQuestion = () => {
    if (!quizQuestions) return;
    if (currentIdx < quizQuestions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      setIsTimerActive(false);
      setShowResults(true);
    }
  };

  // Score statistics calculations
  const calculateScore = () => {
    if (!quizQuestions) return { correct: 0, total: 0, percentage: 0 };
    let correct = 0;
    quizQuestions.forEach((q) => {
      const userAns = (selectedAnswers[q.id] || "").trim().toLowerCase();
      const actualAns = q.answer.trim().toLowerCase();
      
      if (q.type === "mcq" || q.type === "tf") {
        if (userAns === actualAns) correct++;
      } else if (q.type === "fib") {
        // loose check for fill in blanks
        if (actualAns.includes(userAns) && userAns.length > 0) correct++;
      } else {
        // Short Answer gets partial positive checking automatically
        if (userAns.length > 4) correct++; 
      }
    });
    return {
      correct,
      total: quizQuestions.length,
      percentage: Math.round((correct / quizQuestions.length) * 100),
    };
  };

  // Identify weak study areas
  const getWeakTopics = () => {
    if (!quizQuestions) return [];
    const topicFailures: Record<string, number> = {};
    quizQuestions.forEach((q) => {
      const userAns = (selectedAnswers[q.id] || "").trim().toLowerCase();
      const actualAns = q.answer.trim().toLowerCase();
      const isFailed = q.type === "short" 
        ? userAns.length <= 4 
        : userAns !== actualAns;

      if (isFailed) {
        topicFailures[q.topic] = (topicFailures[q.topic] || 0) + 1;
      }
    });

    return Object.entries(topicFailures)
      .sort((a, b) => b[1] - a[1])
      .map(([topic, count]) => ({ topic, count }));
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const scoreStats = calculateScore();
  const weakTopicsList = getWeakTopics();

  return (
    <div className="space-y-6">
      {/* Quiz Dashboard Container Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-3xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Trophy className="w-5 h-5 animate-pulse-subtle" />
          </div>
          <div>
            <h2 className="font-display font-bold text-slate-800 text-lg">AI Quiz & MCQ Arena</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Active Content: <strong className="text-slate-600">{activeDoc.metadata.title}</strong>
            </p>
          </div>
        </div>
        
        {/* Actions & Stopwatch displays */}
        <div className="flex flex-wrap items-center gap-2">
          {quizQuestions && quizQuestions.length > 0 && (
            <>
              <button
                onClick={() => exportQuizToPDF(activeDoc.metadata.title, quizQuestions)}
                className="px-3 py-1.5 bg-indigo-600 border border-indigo-700 hover:bg-indigo-700 text-white transition text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-md focus:outline-none animate-pulse-subtle"
              >
                <FileText className="w-3.5 h-3.5" /> Export PDF (Print)
              </button>

              {!showResults && (
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-201 px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-slate-700">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  <span>TIME ELAPSED: {formatTimer(quizTimer)}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 1. CONFIGURATION VIEW */}
      {!quizQuestions && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Settings panel */}
          <div className="md:col-span-1 bg-white p-5 rounded-xl border border-slate-100 shadow-3xs space-y-4">
            <h3 className="font-display font-bold text-xs text-slate-400 uppercase tracking-wider">Exam Parameters</h3>
            
            {/* Length parameter option */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-705">Number of Questions</label>
              <div className="grid grid-cols-3 gap-2">
                {[10, 20, 50].map((num) => (
                  <button
                    key={num}
                    onClick={() => setQCount(num)}
                    className={`px-3 py-2 text-xs font-bold rounded-lg border text-center transition duration-150 focus:outline-none ${
                      qCount === num 
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-2xs" 
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100/70"
                    }`}
                  >
                    {num} Qs
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty choice config */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-bold text-slate-705">Difficulty Assessment</label>
              <div className="grid grid-cols-3 gap-2">
                {["easy", "medium", "hard"].map((level) => (
                  <button
                    key={level}
                    onClick={() => setDifficulty(level)}
                    className={`px-2 py-2 text-2xs font-bold rounded-lg border text-center uppercase transition duration-150 focus:outline-none ${
                      difficulty === level 
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-2xs" 
                        : "bg-slate-50 border-slate-200 text-slate-605 hover:bg-slate-100/70"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Question Format template config */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-bold text-slate-705">Question formats</label>
              <select
                value={qType}
                onChange={(e) => setQType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg px-3 py-2 text-slate-600 focus:outline-none"
              >
                <option value="all">📁 Equal blend of all formats</option>
                <option value="mcq">🔘 Multiple choice options only</option>
                <option value="tf">🔔 True or False statements</option>
                <option value="fib">✏️ Fill in the blanks sentences</option>
                <option value="short">📝 Analytical Short answers</option>
              </select>
            </div>

            <button
              onClick={handleStartQuiz}
              disabled={isGenerating}
              className="w-full mt-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 focus:outline-none"
            >
              {isGenerating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Generating evaluation...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Begin Exam Session</span>
                </>
              )}
            </button>
          </div>

          {/* Guidelines info card right panel */}
          <div className="md:col-span-2 bg-white p-6 rounded-xl border border-slate-100 shadow-3xs flex flex-col justify-center text-center items-center">
            <Trophy className="w-14 h-14 text-indigo-501 mb-3 animate-pulse-subtle stroke-[1.2]" />
            <h3 className="font-display font-semibold text-slate-800 text-sm">Self-Testing Practice Room</h3>
            <p className="text-xs text-slate-400 max-w-[320px] mt-2 leading-relaxed">
              Create robust test scenarios. Answer questions one-by-one with immediate correct feedback, stopwatch indicators, and personalized diagnostic diagnostics of your final score.
            </p>
          </div>
        </div>
      )}

      {/* 2. LIVE INTERACTIVE QUIZ PLAYING */}
      {quizQuestions && quizQuestions.length > 0 && !showResults && currentQuestion && (
        <div className="space-y-5">
          {/* Progress Metrics row */}
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-3xs">
            <div className="flex justify-between items-center text-2xs font-bold text-slate-400 uppercase tracking-widest mb-2.5">
              <span>Question {currentIdx + 1} of {quizQuestions.length}</span>
              <span className="text-indigo-600">Topic Area: {currentQuestion.topic}</span>
            </div>
            {/* Progress bar */}
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                style={{ width: `${((currentIdx + 1) / quizQuestions.length) * 100}%` }}
                className="h-full bg-indigo-600 rounded-full transition-all duration-300"
              ></div>
            </div>
          </div>

          {/* Active Question Panel */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-6">
            <div className="space-y-1">
              <span className="px-2 py-0.5 bg-indigo-55/65 text-indigo-700 text-[10px] font-bold uppercase rounded">
                Format: {currentQuestion.type === "mcq" ? "Multiple Choice" : currentQuestion.type === "tf" ? "True / False" : currentQuestion.type === "fib" ? "Fill blank" : "Short answer"}
              </span>
              <h3 className="font-display font-bold text-slate-800 text-sm mt-3 leading-snug">
                {currentQuestion.question}
              </h3>
            </div>

            {/* Answer Options Selector or input boxes based on question types */}
            <div className="space-y-3">
              {/* MCF or TF option boxes */}
              {(currentQuestion.type === "mcq" || currentQuestion.type === "tf") && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(currentQuestion.options || ["True", "False"]).map((opt) => {
                    const isSelected = selectedAnswers[currentQuestion.id] === opt;
                    const isSubmitted = submittedQuestions[currentQuestion.id];
                    const isCorrect = opt.trim().toLowerCase() === currentQuestion.answer.trim().toLowerCase();
                    
                    let bgStyle = "bg-slate-50 border-slate-200 hover:bg-slate-100/70 text-slate-700";
                    if (isSelected) {
                      bgStyle = "bg-indigo-600 border-indigo-600 text-white shadow-3xs";
                    }
                    if (isSubmitted) {
                      if (isCorrect) {
                        bgStyle = "bg-emerald-50 text-emerald-850 border-emerald-400 font-semibold";
                      } else if (isSelected) {
                        bgStyle = "bg-red-50 text-red-800 border-red-300 font-semibold";
                      } else {
                        bgStyle = "bg-slate-50 opacity-55 border-slate-200 text-slate-400";
                      }
                    }

                    return (
                      <button
                        key={opt}
                        onClick={() => handleSelectOption(opt)}
                        disabled={isSubmitted}
                        className={`text-left p-4 rounded-xl border text-xs leading-normal transition duration-150 focus:outline-none flex justify-between items-center ${bgStyle}`}
                      >
                        <span>{opt}</span>
                        {isSubmitted && isCorrect && <Check className="w-4 h-4 text-emerald-600" />}
                        {isSubmitted && isSelected && !isCorrect && <X className="w-4 h-4 text-red-600" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* FIB fill option */}
              {currentQuestion.type === "fib" && (
                <div className="space-y-2">
                  <input
                    type="text"
                    disabled={submittedQuestions[currentQuestion.id]}
                    placeholder="Type your blank solution here..."
                    value={selectedAnswers[currentQuestion.id] || ""}
                    onChange={(e) => handleTextAnswerChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                  />
                  {submittedQuestions[currentQuestion.id] && (
                    <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-100 text-xs rounded-lg mt-2 font-mono">
                      🎯 Expected Solution: <strong className="text-emerald-700">{currentQuestion.answer}</strong>
                    </div>
                  )}
                </div>
              )}

              {/* Short answer input */}
              {currentQuestion.type === "short" && (
                <div className="space-y-2">
                  <textarea
                    rows={4}
                    disabled={submittedQuestions[currentQuestion.id]}
                    placeholder="Draft your evaluation rationale..."
                    value={selectedAnswers[currentQuestion.id] || ""}
                    onChange={(e) => handleTextAnswerChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans leading-relaxed"
                  />
                  {submittedQuestions[currentQuestion.id] && (
                    <div className="p-4 bg-emerald-5/30 border border-emerald-100 font-sans text-xs text-slate-650 rounded-xl space-y-1.5 mt-2">
                      <strong className="text-emerald-800 block text-2xs uppercase tracking-wider">🔬 AI Model Answer Key</strong>
                      <p className="leading-relaxed">{currentQuestion.answer}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Explanatory notes display on submit */}
            {submittedQuestions[currentQuestion.id] && currentQuestion.explanation && (
              <div className="p-4 bg-indigo-50/40 border border-slate-100 rounded-xl font-sans text-xs text-slate-650 leading-relaxed">
                <strong>💡 Pedagogical Explanation:</strong> {currentQuestion.explanation}
              </div>
            )}

            {/* Footer Navigation Row */}
            <div className="flex border-t border-slate-100 pt-4 justify-between items-center bg-white">
              <span className="text-2xs text-slate-300 font-mono">DIFFICULTY: {currentQuestion.topic}</span>
              <div className="flex gap-2.5">
                {!submittedQuestions[currentQuestion.id] ? (
                  <button
                    onClick={handleVerifyQuestion}
                    disabled={!selectedAnswers[currentQuestion.id]}
                    className="px-4 py-2 bg-indigo-600 disabled:bg-slate-150 disabled:text-slate-400 text-white hover:bg-indigo-700 text-xs font-bold rounded-xl transition shadow-2xs focus:outline-none"
                  >
                    Check Answer
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuestion}
                    className="px-4 py-2 bg-slate-900 text-white hover:bg-black text-xs font-bold rounded-xl transition shadow-2xs flex items-center gap-1.5 focus:outline-none"
                  >
                    <span>{currentIdx < quizQuestions.length - 1 ? "Next Question" : "Finish Review"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. PERFORMANCE SUMMARY VIEW */}
      {showResults && quizQuestions && (
        <div className="space-y-6">
          {/* Main Visual Score Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Pie Display */}
            <div className="flex flex-col items-center justify-center p-4 border-r border-slate-50">
              <div className="relative h-28 w-28 flex items-center justify-center">
                {/* SVG circular progress */}
                <svg className="absolute w-full h-full transform -rotate-90">
                  <circle
                    cx="56"
                    cy="56"
                    r="48"
                    className="stroke-slate-100 fill-none"
                    strokeWidth="8"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r="48"
                    style={{ strokeDasharray: `${2 * Math.PI * 48}`, strokeDashoffset: `${2 * Math.PI * 48 * (1 - scoreStats.percentage / 100)}` }}
                    className="stroke-indigo-605 fill-none transition-all duration-1000"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="text-center">
                  <strong className="text-2xl font-display font-extrabold text-slate-800 leading-none">
                    {scoreStats.percentage}%
                  </strong>
                  <span className="text-[10px] text-slate-400 block mt-1">SCORE</span>
                </div>
              </div>
            </div>

            {/* Score info list columns */}
            <div className="space-y-1.5 p-2">
              <h3 className="font-display font-extrabold text-slate-805 text-base flex items-center gap-1.5">
                Practice Session Passed! <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-pulse-subtle" />
              </h3>
              <p className="text-xs text-slate-500 leading-normal font-sans">
                You successfully evaluated <strong>{scoreStats.correct}</strong> out of <strong>{scoreStats.total}</strong> answers correctly.
              </p>
              <div className="flex items-center gap-3 text-[11px] text-slate-405 mt-3 pt-2 border-t border-slate-50 font-mono">
                <span>⏱️ TIME: {formatTimer(quizTimer)}</span>
                <span>🔥 RATINGS: {difficulty.toUpperCase()}</span>
              </div>
            </div>

            {/* Performance suggestions weakness list boxes */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Diagnostic Area study advice</span>
              {weakTopicsList.length === 0 ? (
                <p className="text-[11px] text-emerald-700 leading-normal font-sans font-medium">
                  🎯 Absolute master! You got 100% checkouts across all topics in this materials cycle. Clean!
                </p>
              ) : (
                <div className="space-y-1.5">
                  <p className="text-[10px] text-slate-550 leading-relaxed font-sans">
                    Focus your review on these weak areas in summaries and tutor chat:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {weakTopicsList.slice(0, 3).map((item, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-red-50 text-red-700 rounded text-[9.5px] font-bold">
                        ⚠️ {item.topic} ({item.count} wrong)
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Row */}
          <div className="flex justify-end gap-3 bg-white p-4 border border-slate-100 rounded-xl">
            <button
              onClick={onResetQuiz}
              className="px-4 py-2 bg-slate-50 text-slate-705 border border-slate-201 hover:bg-slate-100 text-xs font-bold rounded-xl transition flex items-center gap-1.5 focus:outline-none"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Configure New Quiz</span>
            </button>
          </div>

          {/* Fully expanded review list below results card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-5">
            <h3 className="font-display font-bold text-slate-800 text-sm border-b border-slate-50 pb-3">Complete Review Sheet</h3>
            <div className="space-y-4">
              {quizQuestions.map((q, qIndex) => {
                const isCorrect = (selectedAnswers[q.id] || "").trim().toLowerCase() === q.answer.trim().toLowerCase();
                return (
                  <div key={q.id} className="p-4 border border-slate-100 rounded-xl space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wide">
                        Q-{qIndex + 1} ({q.type.toUpperCase()})
                      </span>
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded ${
                        isCorrect ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"
                      }`}>
                        {isCorrect ? "✓ Correct" : "✗ Incorrect"}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-800">{q.question}</p>
                    <div className="text-xs mt-1 text-slate-650 font-sans space-y-1">
                      <div>Your Answer: <strong className={isCorrect ? "text-emerald-600" : "text-red-500"}>{selectedAnswers[q.id] || "No Answer"}</strong></div>
                      {!isCorrect && <div>Correct Answer: <strong className="text-emerald-600">{q.answer}</strong></div>}
                    </div>
                    {q.explanation && (
                      <p className="text-[10.5px] italic text-slate-450 mt-1 pl-2 border-l-2 border-slate-200">
                        {q.explanation}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
