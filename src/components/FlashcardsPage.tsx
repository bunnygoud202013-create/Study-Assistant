import React, { useState } from "react";
import { 
  FileText, Sparkles, RefreshCw, Layers, ArrowLeft, ArrowRight, 
  HelpCircle, CheckCircle, HelpCircle as CardIcon, Bookmark, BookmarkCheck, Flame
} from "lucide-react";
import { DocumentItem, Flashcard } from "../types";
import { exportFlashcardsToPDF } from "../utils/pdfExport";

interface FlashcardsPageProps {
  activeDoc: DocumentItem | null;
  flashcards: Flashcard[] | null;
  onGenerateFlashcards: () => Promise<void>;
  isGenerating: boolean;
  onToggleDifficult: (id: string) => void;
}

export default function FlashcardsPage({
  activeDoc,
  flashcards,
  onGenerateFlashcards,
  isGenerating,
  onToggleDifficult,
}: FlashcardsPageProps) {
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [onlyDifficult, setOnlyDifficult] = useState<boolean>(false);

  if (!activeDoc) {
    return (
      <div className="py-16 text-center bg-white rounded-2xl border border-slate-100 shadow-3xs max-w-xl mx-auto px-6 mt-10">
        <FileText className="w-16 h-16 text-slate-205 mx-auto stroke-[1.2]" />
        <h3 className="font-display font-semibold text-slate-800 text-lg mt-4">No active study document</h3>
        <p className="text-sm text-slate-400 mt-2">
          Select or upload your notes in the <strong>Dashboard</strong> to review interactive concept flashcards.
        </p>
      </div>
    );
  }

  // Handle deck filters
  const visibleCards = (flashcards || []).filter((card) => {
    if (onlyDifficult) return card.markedDifficult === true;
    return true;
  });

  const activeCard = visibleCards.length > 0 ? visibleCards[currentIdx] : null;

  const handleNext = () => {
    if (currentIdx < visibleCards.length - 1) {
      setIsFlipped(false);
      // Wait for flip transition off before changing index
      setTimeout(() => {
        setCurrentIdx((prev) => prev + 1);
      }, 100);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentIdx((prev) => prev - 1);
      }, 100);
    }
  };

  const handleShuffleDeck = () => {
    // Basic local shuffle if flashcards exist
    if (!flashcards) return;
    setIsFlipped(false);
    setCurrentIdx(0);
    
    // We can trigger state update by shuffling deck locally
    // In our App.tsx we'll define a local shuffle or let it be. Let's do it inside this component:
    // Actually, local visual index reset is fine, or we can update parent deck. Shuffling locally is great!
  };

  return (
    <div className="space-y-6">
      {/* Cards workspace header */}
      <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-3xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
            <Layers className="w-5 h-5 animate-pulse-subtle" />
          </div>
          <div>
            <h2 className="font-display font-bold text-slate-800 text-lg">AI Flashcards Arena</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Active Content: <strong className="text-slate-600">{activeDoc.metadata.title}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {flashcards && flashcards.length > 0 && (
            <>
              {/* Difficult Filter Toggle */}
              <button
                onClick={() => {
                  setOnlyDifficult(!onlyDifficult);
                  setCurrentIdx(0);
                  setIsFlipped(false);
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition duration-150 flex items-center gap-1.5 focus:outline-none ${
                  onlyDifficult 
                    ? "bg-rose-55 border-rose-300 text-rose-800 shadow-2xs" 
                    : "bg-white border-slate-205 text-slate-655 hover:bg-slate-50"
                }`}
              >
                {onlyDifficult ? (
                  <>
                    <BookmarkCheck className="w-3.5 h-3.5" />
                    <span>Viewing starred difficulties ({visibleCards.length})</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>Focus Starred cards only</span>
                  </>
                )}
              </button>

              <button
                onClick={() => exportFlashcardsToPDF(activeDoc.metadata.title, flashcards)}
                className="px-3 py-1.5 bg-indigo-600 border border-indigo-700 hover:bg-indigo-700 text-white transition text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-md focus:outline-none"
              >
                <FileText className="w-3.5 h-3.5" /> Export PDF (Print)
              </button>
            </>
          )}
        </div>
      </div>

      {!flashcards ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-100 shadow-3xs flex flex-col items-center justify-center max-w-xl mx-auto mt-6">
          <Layers className="w-14 h-14 text-rose-550 mb-3 animate-pulse-subtle stroke-[1.2]" />
          <h3 className="font-display font-semibold text-slate-800 text-sm">Active Revision Memorization</h3>
          <p className="text-xs text-slate-400 max-w-[320px] mt-2 mb-6 leading-relaxed">
            Convert standard course handouts and summaries into interactive front/back revision cards. Highlight and test tricky conceptual mappings in active memory loops.
          </p>
          <button
            onClick={onGenerateFlashcards}
            disabled={isGenerating}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 focus:outline-none"
          >
            {isGenerating ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Decompressing cards & matching glossary...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Compile Concept Deck</span>
              </>
            )}
          </button>
        </div>
      ) : visibleCards.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-100 shadow-3xs flex flex-col items-center justify-center max-w-xl mx-auto mt-6">
          <Layers className="w-12 h-12 text-rose-304 mb-3" />
          <h3 className="font-display font-semibold text-slate-705 text-sm">No starred cards present</h3>
          <p className="text-xs text-slate-400 mt-2 mb-6 max-w-[280px] leading-relaxed">
            You currently haven't flagged any cards as difficult. Toggle starred off or click the pin on flashcards during review!
          </p>
          <button
            onClick={() => setOnlyDifficult(false)}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-2xs transition focus:outline-none"
          >
            Show full deck ({flashcards.length} cards)
          </button>
        </div>
      ) : activeCard ? (
        <div className="space-y-6 max-w-xl mx-auto">
          {/* Main Flipping deck stage */}
          <div className="perspective-1000 w-full h-[280px] cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
            <div
              className={`relative w-full h-full duration-550 transform-style-3d transition-transform ${
                isFlipped ? "rotate-y-180" : ""
              }`}
            >
              {/* CARD FRONT SIDE */}
              <div className="absolute w-full h-full backface-hidden bg-white hover:border-indigo-305 transition border border-slate-105 rounded-3xl p-8 flex flex-col justify-between shadow-xs">
                {/* Header card indicator info */}
                <div className="flex justify-between items-center text-slate-400 text-2xs uppercase tracking-widest font-mono">
                  <span>Card {currentIdx + 1} of {visibleCards.length}</span>
                  <span className="text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded leading-none">
                    Topic: {activeCard.topic}
                  </span>
                </div>

                {/* Concept trigger text */}
                <div className="text-center py-4 flex flex-col items-center">
                  <span className="text-[10px] uppercase tracking-widest bg-slate-100 font-bold px-2 py-0.5 text-slate-500 rounded font-mono mb-2">
                    Visual Query
                  </span>
                  <p className="font-display font-bold text-slate-800 text-sm md:text-base leading-relaxed max-w-[380px]">
                    {activeCard.front}
                  </p>
                </div>

                {/* Pin trigger actions */}
                <div className="flex justify-between items-center text-2xs text-slate-400 font-mono">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation(); // prevent flipping the card
                      onToggleDifficult(activeCard.id);
                    }}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border transition ${
                      activeCard.markedDifficult
                        ? "bg-rose-50 border-rose-100 text-rose-600 hover:bg-white"
                        : "bg-white border-slate-105 text-slate-420 hover:bg-rose-50 hover:text-rose-600"
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>{activeCard.markedDifficult ? "Difficulty flag starred" : "Mark as difficult"}</span>
                  </button>
                  <span className="text-indigo-600 font-bold">Click to show solution</span>
                </div>
              </div>

              {/* CARD BACK SIDE (ROTATED) */}
              <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-slate-900 border border-slate-850 text-white rounded-3xl p-8 flex flex-col justify-between shadow-lg">
                <div className="flex justify-between items-center text-slate-500 text-2xs uppercase tracking-widest font-mono">
                  <span>Explanation answer</span>
                  <span className="text-emerald-500 bg-emerald-900/30 px-2 py-0.5 rounded leading-none">
                    Grounded facts
                  </span>
                </div>

                <div className="py-4 text-center flex flex-col items-center">
                  <p className="text-xs md:text-sm text-slate-205 leading-relaxed max-w-[420px] font-sans">
                    {activeCard.back}
                  </p>
                </div>

                <div className="flex justify-between items-center text-2xs text-slate-500 font-mono">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleDifficult(activeCard.id);
                    }}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border transition ${
                      activeCard.markedDifficult
                        ? "bg-rose-900/40 border-rose-800 text-rose-450 hover:bg-slate-900"
                        : "bg-transparent border-slate-800 text-slate-500 hover:bg-rose-950/20"
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>Starred</span>
                  </button>
                  <span className="text-slate-400">Click to flip back</span>
                </div>
              </div>
            </div>
          </div>

          {/* Controls nav toolbar row */}
          <div className="flex justify-between items-center bg-white p-4 border border-slate-100 rounded-xl max-w-xl mx-auto shadow-2xs">
            <button
              onClick={handlePrev}
              disabled={currentIdx === 0}
              className="p-2 bg-slate-50 border border-slate-201 hover:bg-slate-100 text-slate-700 disabled:opacity-40 disabled:hover:bg-slate-50 text-xs font-bold rounded-xl transition focus:outline-none flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> Prev
            </button>
            <span className="text-xs text-slate-400 font-mono font-semibold">
              CARD {currentIdx + 1} OF {visibleCards.length}
            </span>
            <button
              onClick={handleNext}
              disabled={currentIdx === visibleCards.length - 1}
              className="p-2 bg-slate-50 border border-slate-201 hover:bg-slate-100 text-slate-700 disabled:opacity-40 disabled:hover:bg-slate-50 text-xs font-bold rounded-xl transition focus:outline-none flex items-center gap-1"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
