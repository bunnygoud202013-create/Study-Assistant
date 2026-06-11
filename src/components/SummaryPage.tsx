import React, { useState } from "react";
import { 
  BookOpen, FileText, Download, Volume2, VolumeX, Play, Pause, 
  Sparkles, ListCollapse, Bookmark, Award, HelpCircle, CheckCircle2
} from "lucide-react";
import { DocumentItem, SummaryData } from "../types";
import { exportSummaryToPDF } from "../utils/pdfExport";

interface SummaryPageProps {
  activeDoc: DocumentItem | null;
  summary: SummaryData | null;
  onGenerateSummary: () => Promise<void>;
  isGenerating: boolean;
}

export default function SummaryPage({
  activeDoc,
  summary,
  onGenerateSummary,
  isGenerating,
}: SummaryPageProps) {
  const [activeTab, setActiveTab] = useState<"quick" | "detailed" | "revision">("quick");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(1);
  const [synth, setSynth] = useState<SpeechSynthesis | null>(
    typeof window !== "undefined" ? window.speechSynthesis : null
  );
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  if (!activeDoc) {
    return (
      <div className="py-16 text-center bg-white rounded-2xl border border-slate-100 shadow-3xs max-w-xl mx-auto px-6 mt-10">
        <FileText className="w-16 h-16 text-slate-205 mx-auto stroke-[1.2]" />
        <h3 className="font-display font-semibold text-slate-800 text-lg mt-4">No Active study document selected</h3>
        <p className="text-sm text-slate-400 mt-2 leading-relaxed">
          Please select or upload a document from the <strong>Dashboard</strong> to enable summary generation.
        </p>
      </div>
    );
  }

  // Export functions
  const handleDownloadText = () => {
    if (!summary) return;

    let exportContent = `AI STUDY ASSISTANT SUMMARY - ${activeDoc.metadata.title}\n`;
    exportContent += `Generated: ${new Date().toLocaleDateString()}\n`;
    exportContent += `==============================================\n\n`;

    // Quick Summary
    exportContent += `PART 1: QUICK CONCEPT SNAPSHOT\n`;
    summary.quickSummary.forEach((point, index) => {
      exportContent += `- ${point}\n`;
    });
    exportContent += `\n==============================================\n\n`;

    // Detailed Summary
    exportContent += `PART 2: DETAILED SUBJECT EXPLANATION\n`;
    summary.detailedSummary.forEach((section) => {
      exportContent += `\nTopic: ${section.topic}\n`;
      exportContent += `Explanation: ${section.content}\n`;
      if (section.definitions?.length > 0) {
        exportContent += `Core Definitions:\n`;
        section.definitions.forEach((def) => {
          exportContent += `  * [${def.term}]: ${def.definition}\n`;
        });
      }
    });
    exportContent += `\n==============================================\n\n`;

    // Revision Summary
    exportContent += `PART 3: EXAM REVISION MEMO\n`;
    exportContent += summary.revisionNotes;

    const blob = new Blob([exportContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${activeDoc.metadata.title.replace(/\.[^/.]+$/, "")}_study_summary.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Web Speech Player
  const handleReadAloud = () => {
    if (!synth || !summary) return;

    if (isSpeaking) {
      synth.cancel();
      setIsSpeaking(false);
      return;
    }

    // Assemble text to speak based on active tab
    let speakText = "";
    if (activeTab === "quick") {
      speakText = `Quick Concept Summary. Here are the key points from your document. ${summary.quickSummary.join(". ")}`;
    } else if (activeTab === "detailed") {
      speakText = summary.detailedSummary
        .map((s) => `Topic: ${s.topic}. ${s.content}`)
        .join(" ");
    } else {
      speakText = `Exam revision facts. ${summary.revisionNotes.substring(0, 1000)}`;
    }

    const utterance = new SpeechSynthesisUtterance(speakText);
    utterance.rate = speechRate;
    
    utterance.onend = () => {
      setIsSpeaking(false);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    setCurrentUtterance(utterance);
    setIsSpeaking(true);
    synth.speak(utterance);
  };

  const handleRateChange = (newRate: number) => {
    setSpeechRate(newRate);
    if (synth && isSpeaking && currentUtterance) {
      synth.cancel();
      // Restart with new rate
      const utterance = new SpeechSynthesisUtterance(currentUtterance.text);
      utterance.rate = newRate;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      setCurrentUtterance(utterance);
      synth.speak(utterance);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Header Workspace */}
      <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-3xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-bold text-slate-800 text-lg">Smart Summary Engine</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Active Content: <strong className="text-slate-600">{activeDoc.metadata.title}</strong>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {summary && (
            <>
              <button
                onClick={handleDownloadText}
                className="px-3 py-1.5 bg-white border border-slate-205 text-slate-650 hover:bg-slate-50 transition text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" /> Export Text
              </button>
              <button
                onClick={() => exportSummaryToPDF(activeDoc.metadata.title, summary)}
                className="px-3 py-1.5 bg-indigo-600 border border-indigo-700 text-white hover:bg-indigo-700 transition text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-md"
              >
                <FileText className="w-3.5 h-3.5" /> Export PDF (Print)
              </button>
              {/* Auditory Reader */}
              <div className="flex items-center border border-slate-205 rounded-lg px-2 bg-white shadow-2xs">
                <button
                  onClick={handleReadAloud}
                  className={`p-1.5 rounded transition ${
                    isSpeaking ? "text-red-500 hover:bg-red-50" : "text-indigo-600 hover:bg-indigo-50"
                  }`}
                  title={isSpeaking ? "Mute / Stop listening" : "Listen aloud"}
                >
                  {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
                <div className="h-4 w-px bg-slate-200 mx-1"></div>
                <select
                  value={speechRate}
                  onChange={(e) => handleRateChange(parseFloat(e.target.value))}
                  className="bg-transparent text-[10px] font-bold text-slate-500 focus:outline-none py-1"
                >
                  <option value="1">1.0x Speed</option>
                  <option value="1.25">1.25x Speed</option>
                  <option value="1.5">1.5x Speed</option>
                  <option value="1.75">1.75x Speed</option>
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {!summary ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-100 shadow-3xs flex flex-col items-center justify-center max-w-xl mx-auto mt-6">
          <BookOpen className="w-14 h-14 text-indigo-550 mb-3 animate-pulse-subtle stroke-[1.2]" />
          <h3 className="font-display font-semibold text-slate-800 text-sm">Create visual takeaways</h3>
          <p className="text-xs text-slate-400 max-w-[320px] mt-2 mb-6 leading-relaxed">
            Generate an executive Quick Summary, rich concept flashcards definitions, and Last-minute Revision Sheets automatically parsed by Gemini 3.5.
          </p>
          <button
            onClick={onGenerateSummary}
            disabled={isGenerating}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            {isGenerating ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Synthesizing notes and technical terms...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Compile AI Summary</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Tabs Selector Navigation */}
          <div className="flex bg-slate-150 p-1 rounded-xl w-fit max-w-full">
            <button
              onClick={() => setActiveTab("quick")}
              className={`px-4 py-1.5 font-display text-xs font-bold rounded-lg transition duration-200 ${
                activeTab === "quick" 
                  ? "bg-white text-indigo-700 shadow-2xs" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              📋 Quick Highlights
            </button>
            <button
              onClick={() => setActiveTab("detailed")}
              className={`px-4 py-1.5 font-display text-xs font-bold rounded-lg transition duration-200 ${
                activeTab === "detailed" 
                  ? "bg-white text-indigo-700 shadow-2xs" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              📚 Detailed Explanations
            </button>
            <button
              onClick={() => setActiveTab("revision")}
              className={`px-4 py-1.5 font-display text-xs font-bold rounded-lg transition duration-200 ${
                activeTab === "revision" 
                  ? "bg-white text-indigo-700 shadow-2xs" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              ⚡ Last-Minute Revision
            </button>
          </div>

          {/* Active Tab rendering space */}
          {activeTab === "quick" && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
              <div className="flex items-center gap-2 mb-2 border-b border-slate-50 pb-3">
                <Bookmark className="w-4 h-4 text-indigo-500" />
                <h3 className="font-display font-bold text-slate-800 text-sm">Quick Concept Snapshot</h3>
              </div>
              <ul className="space-y-3.5">
                {summary.quickSummary?.map((point, index) => (
                  <li key={index} className="flex gap-3 items-start group">
                    <span className="mt-1 flex h-4.5 w-4.5 items-center justify-center shrink-0 rounded-full bg-indigo-50 text-[10px] font-bold font-mono text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-200">
                      {index + 1}
                    </span>
                    <p className="text-xs text-slate-650 leading-relaxed font-sans">{point}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {activeTab === "detailed" && (
            <div className="space-y-5">
              {summary.detailedSummary?.map((section, idx) => (
                <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                    <h3 className="font-display font-bold text-slate-800 text-sm">{section.topic}</h3>
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-semibold rounded">
                      Subject Concept
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-sans mt-2">{section.content}</p>

                  {/* Definitions Grid within subtopic card */}
                  {section.definitions?.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-50">
                      <h4 className="text-2xs font-bold text-slate-400 uppercase tracking-wider mb-2">Subject Index & Definitions</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                        {section.definitions.map((def, dIdx) => (
                          <div key={dIdx} className="p-3 bg-slate-50/60 border border-slate-100 rounded-lg hover:bg-slate-50 transition duration-150">
                            <span className="text-xs font-bold font-mono text-indigo-700 block">{def.term}</span>
                            <span className="text-2xs text-slate-500 mt-0.5 block leading-normal">{def.definition}</span>
                            {def.example && (
                              <span className="text-[10px] text-emerald-600 mt-1 block italic font-medium">
                                Example: {def.example}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === "revision" && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
              <div className="flex items-center gap-2 mb-4 border-b border-slate-50 pb-3 justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-500" />
                  <h3 className="font-display font-bold text-slate-800 text-sm">Exam Revision Fact Sheet</h3>
                </div>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> High Yield
                </span>
              </div>
              
              {/* Processed Revision text rendering */}
              <div className="prose prose-slate prose-xs max-w-none text-xs text-slate-650 leading-relaxed font-sans space-y-4 whitespace-pre-line bg-slate-50/40 p-4 rounded-xl border border-slate-100">
                {summary.revisionNotes}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
