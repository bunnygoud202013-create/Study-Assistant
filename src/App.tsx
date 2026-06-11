import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, BookOpen, Layers, Trophy, Bot, Moon, Sun, 
  GraduationCap, Sparkles, AlertCircle, FileText, CheckCircle2, 
  ChevronRight, Calendar, Bookmark, FolderHeart, BarChart2
} from "lucide-react";

import { 
  DocumentItem, SummaryData, QuizQuestion, Flashcard, 
  StudyGuide, LearningInsights, ChatMessage, ActiveSession 
} from "./types";

import Dashboard from "./components/Dashboard";
import SummaryPage from "./components/SummaryPage";
import StudyGuidePage from "./components/StudyGuidePage";
import QuizPage from "./components/QuizPage";
import FlashcardsPage from "./components/FlashcardsPage";
import TutorChatPage from "./components/TutorChatPage";
import AnalyticsPage from "./components/AnalyticsPage";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(false);

  // Loading/Generating indicators
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
  const [isGeneratingGuide, setIsGeneratingGuide] = useState(false);
  const [isSendingChatMessage, setIsSendingChatMessage] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Mapped session stores matching documentId -> Session cache
  const [sessions, setSessions] = useState<Record<string, ActiveSession>>({});

  // 1. Load initial cache from localStorage
  useEffect(() => {
    try {
      const cachedDocs = localStorage.getItem("study_docs");
      const cachedSessions = localStorage.getItem("study_sessions");
      const isDark = localStorage.getItem("study_dark") === "true";

      if (cachedDocs) {
        setDocuments(JSON.parse(cachedDocs));
      }
      if (cachedSessions) {
        setSessions(JSON.parse(cachedSessions));
      }
      if (isDark) {
        setDarkMode(true);
        document.documentElement.classList.add("dark-mode-main", "dark");
      }
    } catch (e) {
      console.error("Local storage restoration failed:", e);
    }
  }, []);

  // 2. Synchronize cache
  useEffect(() => {
    localStorage.setItem("study_docs", JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    localStorage.setItem("study_sessions", JSON.stringify(sessions));
  }, [sessions]);

  const toggleDarkMode = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    localStorage.setItem("study_dark", String(nextDark));
    if (nextDark) {
      document.documentElement.classList.add("dark-mode-main", "dark");
    } else {
      document.documentElement.classList.remove("dark-mode-main", "dark");
    }
  };

  const activeDoc = documents.find((doc) => doc.id === activeDocId) || null;
  const activeSession = activeDocId ? (sessions[activeDocId] || { documentId: activeDocId, lastAccessedAt: new Date().toISOString() }) : null;

  // Handles updating parent semester mapping
  const handleUpdateSemester = (docId: string, semester: string) => {
    setDocuments((prevDocs) =>
      prevDocs.map((doc) => (doc.id === docId ? { ...doc, semester } : doc))
    );
  };

  // Handles raw document deletions and its related study states
  const handleDeleteDoc = (docId: string) => {
    setDocuments((prevDocs) => prevDocs.filter((doc) => doc.id !== docId));
    setSessions((prevSessions) => {
      const next = { ...prevSessions };
      delete next[docId];
      return next;
    });
    if (activeDocId === docId) {
      setActiveDocId(null);
    }
  };

  const handleSelectDoc = (doc: DocumentItem) => {
    setActiveDocId(doc.id);
  };

  const handleUploadSuccess = (newDoc: DocumentItem) => {
    // Check if fileName is already indexed to prevent duplication confusion
    if (documents.some((d) => d.fileName === newDoc.fileName)) {
      setGlobalError(`A document named "${newDoc.fileName}" is already indexed in your library.`);
      setTimeout(() => setGlobalError(null), 4000);
      return;
    }
    setDocuments((prev) => [newDoc, ...prev]);
  };

  // 3. API Actions Handlers
  const handleGenerateSummary = async () => {
    if (!activeDoc) return;
    setIsGeneratingSummary(true);
    setGlobalError(null);

    try {
      const response = await fetch("/api/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docContent: activeDoc.text,
          fileName: activeDoc.fileName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to parse summary notes.");
      }

      setSessions((prev) => ({
        ...prev,
        [activeDoc.id]: {
          ...(prev[activeDoc.id] || { documentId: activeDoc.id, lastAccessedAt: new Date().toISOString() }),
          summary: data,
          lastAccessedAt: new Date().toISOString(),
        },
      }));

    } catch (err: any) {
      console.error(err);
      setGlobalError(err.message || "Failed to make summary API request.");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleGenerateQuiz = async (type: string, difficulty: string, count: number) => {
    if (!activeDoc) return;
    setIsGeneratingQuiz(true);
    setGlobalError(null);

    try {
      const response = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docContent: activeDoc.text,
          questionType: type,
          difficulty: difficulty,
          count: count,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate evaluation quiz.");
      }

      setSessions((prev) => ({
        ...prev,
        [activeDoc.id]: {
          ...(prev[activeDoc.id] || { documentId: activeDoc.id, lastAccessedAt: new Date().toISOString() }),
          quiz: data.questions,
          lastAccessedAt: new Date().toISOString(),
        },
      }));

    } catch (err: any) {
      console.error(err);
      setGlobalError(err.message || "Failed to generate interactive evaluation.");
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleGenerateFlashcards = async () => {
    if (!activeDoc) return;
    setIsGeneratingFlashcards(true);
    setGlobalError(null);

    try {
      const response = await fetch("/api/generate-flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docContent: activeDoc.text,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate smart flashcards.");
      }

      setSessions((prev) => ({
        ...prev,
        [activeDoc.id]: {
          ...(prev[activeDoc.id] || { documentId: activeDoc.id, lastAccessedAt: new Date().toISOString() }),
          flashcards: data.flashcards,
          lastAccessedAt: new Date().toISOString(),
        },
      }));

    } catch (err: any) {
      console.error(err);
      setGlobalError(err.message || "Failed to construct revision flashcards.");
    } finally {
      setIsGeneratingFlashcards(false);
    }
  };

  const handleGenerateStudyGuideAndInsights = async () => {
    if (!activeDoc) return;
    setIsGeneratingGuide(true);
    setGlobalError(null);

    try {
      // Fetch both Study Guide and Insights in parallel for optimum response speed!
      const [guideRes, insightsRes] = await Promise.all([
        fetch("/api/generate-study-guide", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ docContent: activeDoc.text, fileName: activeDoc.fileName }),
        }),
        fetch("/api/generate-insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ docContent: activeDoc.text }),
        }),
      ]);

      const guideData = await guideRes.json();
      const insightsData = await insightsRes.json();

      if (!guideRes.ok || !insightsRes.ok) {
        throw new Error(guideData.error || insightsData.error || "Failed to compile blueprints.");
      }

      setSessions((prev) => ({
        ...prev,
        [activeDoc.id]: {
          ...(prev[activeDoc.id] || { documentId: activeDoc.id, lastAccessedAt: new Date().toISOString() }),
          studyGuide: guideData,
          insights: insightsData,
          lastAccessedAt: new Date().toISOString(),
        },
      }));

    } catch (err: any) {
      console.error(err);
      setGlobalError(err.message || "Failed to generate comprehensive guides.");
    } finally {
      setIsGeneratingGuide(false);
    }
  };

  const handleSendMessage = async (msg: string) => {
    if (!activeDoc) return;
    setIsSendingChatMessage(true);
    setGlobalError(null);

    const userMessageItem: ChatMessage = {
      id: `m-${Date.now()}`,
      role: "user",
      text: msg,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    // Prompt state update
    const currentHistory = activeSession?.chatHistory || [];
    const nextHistory = [...currentHistory, userMessageItem];

    setSessions((prev) => ({
      ...prev,
      [activeDoc.id]: {
        ...(prev[activeDoc.id] || { documentId: activeDoc.id, lastAccessedAt: new Date().toISOString() }),
        chatHistory: nextHistory,
        lastAccessedAt: new Date().toISOString(),
      },
    }));

    try {
      // We pass the updated history to the backend grounded system instruction
      const chatHistoryForBackend = nextHistory.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const replyResponse = await fetch("/api/tutor-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docContent: activeDoc.text,
          chatHistory: chatHistoryForBackend,
          userMessage: msg,
        }),
      });

      const replyData = await replyResponse.json();

      if (!replyResponse.ok) {
        throw new Error(replyData.error || "Failed to get tutor feedback.");
      }

      const modelMessageItem: ChatMessage = {
        id: `m-bot-${Date.now()}`,
        role: "model",
        text: replyData.text,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setSessions((prev) => ({
        ...prev,
        [activeDoc.id]: {
          ...(prev[activeDoc.id] || { documentId: activeDoc.id, lastAccessedAt: new Date().toISOString() }),
          chatHistory: [...nextHistory, modelMessageItem],
          lastAccessedAt: new Date().toISOString(),
        },
      }));

    } catch (err: any) {
      console.error(err);
      setGlobalError(err.message || "Failed to communicate with AI Tutor.");
    } finally {
      setIsSendingChatMessage(false);
    }
  };

  const handleToggleDifficultCard = (cardId: string) => {
    if (!activeDoc) return;
    const currentCards = activeSession?.flashcards || [];
    const nextCards = currentCards.map((card) =>
      card.id === cardId ? { ...card, markedDifficult: !card.markedDifficult } : card
    );

    setSessions((prev) => ({
      ...prev,
      [activeDoc.id]: {
        ...(prev[activeDoc.id] || { documentId: activeDoc.id, lastAccessedAt: new Date().toISOString() }),
        flashcards: nextCards,
      },
    }));
  };

  const clearActiveChat = () => {
    if (!activeDoc) return;
    setSessions((prev) => ({
      ...prev,
      [activeDoc.id]: {
        ...(prev[activeDoc.id] || { documentId: activeDoc.id, lastAccessedAt: new Date().toISOString() }),
        chatHistory: [],
      },
    }));
  };

  const clearActiveQuizAnswers = () => {
    if (!activeDoc) return;
    setSessions((prev) => ({
      ...prev,
      [activeDoc.id]: {
        ...(prev[activeDoc.id] || { documentId: activeDoc.id, lastAccessedAt: new Date().toISOString() }),
        quiz: undefined,
      },
    }));
  };

  return (
    <div className={`flex min-h-screen ${darkMode ? "bg-slate-900 text-slate-100 dark" : "bg-slate-50 text-slate-800"}`}>
      
      {/* 1. LEFT SIDEBAR NAVIGATION NAVIGATION */}
      <aside className={`w-64 border-r hidden md:flex flex-col justify-between shrink-0 p-5 ${
        darkMode ? "bg-slate-950 border-slate-850" : "bg-white border-slate-100"
      }`}>
        <div className="space-y-6">
          {/* Header Branding Panel */}
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-500/10">
              <GraduationCap className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <span className="font-display font-black text-sm tracking-tight block">AI STUDY DESK</span>
              <span className="text-[10px] text-slate-400 block font-semibold leading-none">Vite + Gemini 3.5</span>
            </div>
          </div>

          {/* Active Document Badge Preview */}
          <div className={`p-3 rounded-xl border text-left ${
            activeDoc 
              ? darkMode ? "bg-indigo-950/20 border-indigo-900/40 text-indigo-400" : "bg-indigo-50/50 border-indigo-100 text-indigo-800"
              : darkMode ? "bg-slate-900 border-slate-800 text-slate-500" : "bg-slate-50 border-slate-100 text-slate-400"
          }`}>
            <span className="text-[9px] uppercase font-bold tracking-wider block mb-1">Active Handbook</span>
            <div className="flex items-center gap-1.5 min-w-0">
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <p className="text-2xs font-semibold truncate flex-1 leading-normal">
                {activeDoc ? activeDoc.metadata.title : "No textbook active"}
              </p>
            </div>
          </div>

          {/* Menu Selector lists */}
          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all focus:outline-none ${
                activeTab === "dashboard"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-100/60 dark:hover:bg-slate-850/60"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4" />
                <span>My Workspace</span>
              </div>
              <ChevronRight className={`w-3 h-3 transition ${activeTab === "dashboard" ? "rotate-90" : ""}`} />
            </button>

            <button
              onClick={() => setActiveTab("summary")}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all focus:outline-none ${
                activeTab === "summary"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-100/60 dark:hover:bg-slate-850/60"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-4 h-4" />
                <span>Smart Summaries</span>
              </div>
              <ChevronRight className={`w-3 h-3 transition ${activeTab === "summary" ? "rotate-90" : ""}`} />
            </button>

            <button
              onClick={() => setActiveTab("guide")}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all focus:outline-none ${
                activeTab === "guide"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-100/60 dark:hover:bg-slate-850/60"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4" />
                <span>Syllabus Guides</span>
              </div>
              <ChevronRight className={`w-3 h-3 transition ${activeTab === "guide" ? "rotate-90" : ""}`} />
            </button>

            <button
              onClick={() => setActiveTab("flashcards")}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all focus:outline-none ${
                activeTab === "flashcards"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-100/60 dark:hover:bg-slate-850/60"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Bookmark className="w-4 h-4" />
                <span>Active Flashcards</span>
              </div>
              <ChevronRight className={`w-3 h-3 transition ${activeTab === "flashcards" ? "rotate-90" : ""}`} />
            </button>

            <button
              onClick={() => setActiveTab("quiz")}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all focus:outline-none ${
                activeTab === "quiz"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-100/60 dark:hover:bg-slate-850/60"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Trophy className="w-4 h-4" />
                <span>Practice Quizzes</span>
              </div>
              <ChevronRight className={`w-3 h-3 transition ${activeTab === "quiz" ? "rotate-90" : ""}`} />
            </button>

            <button
              onClick={() => setActiveTab("chat")}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all focus:outline-none ${
                activeTab === "chat"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-100/60 dark:hover:bg-slate-850/60"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Bot className="w-4 h-4" />
                <span>Active AI Tutor</span>
              </div>
              <ChevronRight className={`w-3 h-3 transition ${activeTab === "chat" ? "rotate-90" : ""}`} />
            </button>

            <button
              onClick={() => setActiveTab("analytics")}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all focus:outline-none ${
                activeTab === "analytics"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-100/60 dark:hover:bg-slate-850/60 block"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BarChart2 className="w-4 h-4" />
                <span>Study Analytics</span>
              </div>
              <ChevronRight className={`w-3 h-3 transition ${activeTab === "analytics" ? "rotate-90" : ""}`} />
            </button>
          </nav>
        </div>

        {/* Sidebar Footer layout controls / Dark mode */}
        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-850">
          <button
            onClick={toggleDarkMode}
            className={`w-full flex items-center gap-2.5 p-2 rounded-lg text-xs font-medium transition focus:outline-none ${
              darkMode ? "text-amber-400 hover:bg-slate-900" : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            {darkMode ? (
              <>
                <Sun className="w-4 h-4" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4" />
                <span>Twilight Twilight Dark</span>
              </>
            )}
          </button>
          <div className="text-[10px] text-slate-400 font-mono text-center">
            STUDENT ASSISTANT V1.0.4
          </div>
        </div>
      </aside>

      {/* 2. CHIEF CONTENT VIEW CONTAINER */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Global Error Notice Indicator */}
        {globalError && (
          <div className="m-4 p-3.5 bg-red-50 text-red-700 text-xs rounded-xl flex items-center justify-between border border-red-101 shadow-sm font-sans animate-pulse-subtle z-50">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{globalError}</span>
            </div>
            <button
              onClick={() => setGlobalError(null)}
              className="text-red-550 hover:text-red-800 text-xs font-bold font-sans underline ml-4 hover:bg-transparent"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Mobile Navigation bar */}
        <div className={`md:hidden p-4 border-b flex justify-between items-center ${
          darkMode ? "bg-slate-950 border-slate-850" : "bg-white border-slate-100"
        }`}>
          <div className="flex items-center gap-1.5 focus:outline-none">
            <GraduationCap className="w-5 h-5 text-indigo-600" />
            <span className="font-display font-black text-xs tracking-tight">AI STUDY DESK</span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="bg-slate-100 text-xs rounded-lg px-2.5 py-1 text-slate-800 border-none font-bold focus:outline-none"
            >
              <option value="dashboard">📁 Workspace</option>
              <option value="summary">📝 Summaries</option>
              <option value="guide">📚 Syllabus</option>
              <option value="flashcards">⚡ Flashcards</option>
              <option value="quiz">✏️ Quizzes</option>
              <option value="chat">💬 AI Tutor</option>
              <option value="analytics">📊 Analytics</option>
            </select>
            <button
              onClick={toggleDarkMode}
              className="p-1 text-slate-400 hover:text-indigo-600"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* View container wrap */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {activeTab === "dashboard" && (
            <Dashboard
              documents={documents}
              activeDoc={activeDoc}
              onSelectDoc={handleSelectDoc}
              onUploadSuccess={handleUploadSuccess}
              onDeleteDoc={handleDeleteDoc}
              onUpdateSemester={handleUpdateSemester}
              onSelectTab={setActiveTab}
            />
          )}

          {activeTab === "summary" && (
            <SummaryPage
              activeDoc={activeDoc}
              summary={activeSession?.summary || null}
              onGenerateSummary={handleGenerateSummary}
              isGenerating={isGeneratingSummary}
            />
          )}

          {activeTab === "guide" && (
            <StudyGuidePage
              activeDoc={activeDoc}
              studyGuide={activeSession?.studyGuide || null}
              insights={activeSession?.insights || null}
              onGenerateStudyGuideAndInsights={handleGenerateStudyGuideAndInsights}
              isGenerating={isGeneratingGuide}
            />
          )}

          {activeTab === "flashcards" && (
            <FlashcardsPage
              activeDoc={activeDoc}
              flashcards={activeSession?.flashcards || null}
              onGenerateFlashcards={handleGenerateFlashcards}
              isGenerating={isGeneratingFlashcards}
              onToggleDifficult={handleToggleDifficultCard}
            />
          )}

          {activeTab === "quiz" && (
            <QuizPage
              activeDoc={activeDoc}
              quizQuestions={activeSession?.quiz || null}
              onGenerateQuiz={handleGenerateQuiz}
              isGenerating={isGeneratingQuiz}
              onResetQuiz={clearActiveQuizAnswers}
            />
          )}

          {activeTab === "chat" && (
            <TutorChatPage
              activeDoc={activeDoc}
              chatHistory={activeSession?.chatHistory || []}
              onSendMessage={handleSendMessage}
              isSending={isSendingChatMessage}
              onClearHistory={clearActiveChat}
            />
          )}

          {activeTab === "analytics" && (
            <AnalyticsPage
              documents={documents}
              sessions={sessions}
              onSelectTab={setActiveTab}
              activeDoc={activeDoc}
            />
          )}
        </div>
      </main>
    </div>
  );
}
