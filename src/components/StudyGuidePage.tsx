import React, { useState } from "react";
import { 
  FileText, Sparkles, AlertCircle, BookOpen, Layers, 
  HelpCircle, Zap, Shield, HelpCircle as QuestionIcon, Flame, ListChecks, ArrowUpRight
} from "lucide-react";
import { DocumentItem, StudyGuide, LearningInsights } from "../types";
import { exportStudyGuideToPDF } from "../utils/pdfExport";

interface StudyGuidePageProps {
  activeDoc: DocumentItem | null;
  studyGuide: StudyGuide | null;
  insights: LearningInsights | null;
  onGenerateStudyGuideAndInsights: () => Promise<void>;
  isGenerating: boolean;
}

export default function StudyGuidePage({
  activeDoc,
  studyGuide,
  insights,
  onGenerateStudyGuideAndInsights,
  isGenerating,
}: StudyGuidePageProps) {
  const [activeTab, setActiveTab] = useState<"guide" | "insights">("guide");
  const [expandedFaqId, setExpandedFaqId] = useState<number | null>(null);

  if (!activeDoc) {
    return (
      <div className="py-16 text-center bg-white rounded-2xl border border-slate-100 shadow-3xs max-w-xl mx-auto px-6 mt-10">
        <FileText className="w-16 h-16 text-slate-205 mx-auto stroke-[1.2]" />
        <h3 className="font-display font-semibold text-slate-800 text-lg mt-4">No active study document</h3>
        <p className="text-sm text-slate-400 mt-2">
          Select or upload your notes in the <strong>Dashboard</strong> to compute academic study guides.
        </p>
      </div>
    );
  }

  const handleToggleFaq = (idx: number) => {
    setExpandedFaqId(expandedFaqId === idx ? null : idx);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-3xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-bold text-slate-800 text-lg">AI Study Guide & Intel Map</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Active Content: <strong className="text-slate-600">{activeDoc.metadata.title}</strong>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!studyGuide ? (
            <button
              onClick={onGenerateStudyGuideAndInsights}
              disabled={isGenerating}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              {isGenerating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Drafting curricula and potential questions...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Study Guide & Insights</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => exportStudyGuideToPDF(activeDoc.metadata.title, studyGuide, insights)}
              className="px-3 py-1.5 bg-indigo-600 border border-indigo-700 text-white hover:bg-indigo-700 transition text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-md"
            >
              <FileText className="w-3.5 h-3.5" /> Export PDF (Print)
            </button>
          )}
        </div>
      </div>

      {!studyGuide ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-100 shadow-3xs flex flex-col items-center justify-center max-w-xl mx-auto mt-6">
          <Flame className="w-14 h-14 text-emerald-550 mb-3 animate-pulse-subtle stroke-[1.2]" />
          <h3 className="font-display font-semibold text-slate-800 text-sm">Design Study Blueprints</h3>
          <p className="text-xs text-slate-400 max-w-[340px] mt-2 mb-6 leading-relaxed">
            Acquire topics checklists, active exam equations list, frequently asked exam questions, expected critical topics weighted out of 100, and tailored syllabus tips automatically.
          </p>
          <button
            onClick={onGenerateStudyGuideAndInsights}
            disabled={isGenerating}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            {isGenerating ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Drafting guidelines and priority areas...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Compile Study blueprints</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Section Selector Tab Nav */}
          <div className="flex bg-slate-150 p-1 rounded-xl w-fit max-w-full">
            <button
              onClick={() => setActiveTab("guide")}
              className={`px-4 py-1.5 font-display text-xs font-bold rounded-lg transition duration-200 ${
                activeTab === "guide" 
                  ? "bg-white text-indigo-700 shadow-2xs" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              📝 Structured Study Guide
            </button>
            <button
              onClick={() => setActiveTab("insights")}
              className={`px-4 py-1.5 font-display text-xs font-bold rounded-lg transition duration-200 ${
                activeTab === "insights" 
                  ? "bg-white text-indigo-700 shadow-2xs" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              🔥 Learning Insights & Priority Map
            </button>
          </div>

          {/* Tab Content Display */}
          {activeTab === "guide" && (
            <div className="space-y-6">
              {/* Modules covered row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Syllabus Covered List */}
                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-3xs space-y-3 md:col-span-1">
                  <h3 className="font-display font-semibold text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-500" /> Syllabus Covered
                  </h3>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {studyGuide.topicsCovered?.map((topic, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-slate-50 border border-slate-100 text-slate-700 rounded-lg text-xs leading-none font-medium text-center"
                      >
                        📁 {topic}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Last mile exam strategy sheet */}
                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-3xs space-y-3 md:col-span-2">
                  <h3 className="font-display font-semibold text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500 animate-pulse-subtle" /> Last-Mile Exam tactics
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    {studyGuide.examPreparationTips?.map((tip, index) => (
                      <div key={index} className="flex gap-2 items-start p-2.5 bg-amber-50/20 border border-amber-50 rounded-lg">
                        <span className="w-4 h-4 rounded-full bg-amber-100 text-[10px] font-bold text-amber-800 flex items-center justify-center shrink-0">
                          !
                        </span>
                        <p className="text-[11px] text-slate-650 leading-relaxed font-sans">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Core concept sections */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Concepts list details */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                  <h3 className="font-display font-bold text-slate-800 text-sm border-b border-slate-50 pb-3 flex items-center gap-2">
                    <ListChecks className="w-4 h-4 text-indigo-505" /> Crucial Concepts Index
                  </h3>
                  <div className="space-y-3.5">
                    {studyGuide.importantConcepts?.map((concept, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded font-mono font-bold">
                            {index + 1}
                          </span>
                          <h4 className="text-xs font-bold text-slate-900">{concept.conceptName}</h4>
                        </div>
                        <p className="text-xs text-slate-505 pl-6 leading-relaxed">{concept.summary}</p>
                        <p className="text-[10px] text-emerald-600 pl-6 italic">
                          💡 Focus priority: {concept.importanceReason}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Math Equations index if present */}
                <div className="space-y-6">
                  {studyGuide.formulas?.length > 0 && (
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-3">
                      <h3 className="font-display font-bold text-slate-800 text-sm border-b border-slate-50 pb-2 flex items-center gap-2">
                        🧮 Math Formulas & Rationales
                      </h3>
                      <div className="grid grid-cols-1 gap-3">
                        {studyGuide.formulas.map((frm, idx) => (
                          <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1 flex justify-between items-center">
                            <div className="space-y-0.5 max-w-[280px]">
                              <span className="text-[11px] font-bold text-slate-800">{frm.formulaName}</span>
                              <p className="text-2xs text-slate-400 leading-normal">{frm.explanation}</p>
                            </div>
                            <span className="px-3 py-1.5 bg-indigo-600 font-mono text-white rounded-lg text-xs font-bold tracking-wider shrink-0 text-center shadow-2xs">
                              {frm.formula}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Syllabus Key index terms */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                    <h3 className="font-display font-bold text-slate-800 text-sm border-b border-slate-50 pb-2 flex items-center gap-2">
                      📋 Subject Glossary Key Terms
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {studyGuide.definitions?.map((def, idx) => (
                        <div key={idx} className="p-3 bg-slate-50/50 border border-slate-100 rounded-lg">
                          <span className="text-xs font-bold text-slate-800 font-mono block leading-snug">{def.term}</span>
                          <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{def.definition}</p>
                          {def.example && (
                            <span className="text-[9px] text-indigo-700 italic block mt-1">E.g., {def.example}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Study Guide FAQ section */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                <h3 className="font-display font-bold text-slate-800 text-sm border-b border-slate-50 pb-3 flex items-center gap-2">
                  <QuestionIcon className="w-4 h-4 text-emerald-500" /> Frequently Asked Exam FAQs
                </h3>
                <div className="space-y-3">
                  {studyGuide.frequentlyAskedQuestions?.map((faq, idx) => {
                    const isExpanded = expandedFaqId === idx;
                    return (
                      <div key={idx} className="border border-slate-100 rounded-xl overflow-hidden">
                        <button
                          onClick={() => handleToggleFaq(idx)}
                          className="w-full flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-50 text-left transition focus:outline-none"
                        >
                          <span className="text-xs font-bold text-slate-800 tracking-tight leading-snug">
                            ❓ {faq.question}
                          </span>
                          <span className="text-xs text-slate-400 shrink-0 select-none">
                            {isExpanded ? "▲ Hide" : "▼ Expand"}
                          </span>
                        </button>
                        {isExpanded && (
                          <div className="p-4 bg-white space-y-2.5 border-t border-slate-100">
                            <p className="text-xs text-slate-600 leading-relaxed font-sans">{faq.answer}</p>
                            {faq.examTip && (
                              <div className="p-2 bg-rose-50 border border-rose-100 text-rose-800 rounded-lg text-[10px] font-semibold flex items-center gap-1.5 font-sans">
                                🚀 AI EXAM TRICK: {faq.examTip}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === "insights" && insights && (
            <div className="space-y-6">
              {/* Importance Priority Weight Progress list */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs lg:col-span-2 space-y-4">
                  <h3 className="font-display font-bold text-slate-800 text-sm border-b border-slate-50 pb-3 flex items-center gap-2">
                    <Flame className="w-4 h-4 text-rose-500" /> Topic Priority Rating Maps
                  </h3>
                  <div className="space-y-4 pt-1">
                    {insights.importantTopics?.map((item, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-800 leading-none">{item.topic}</span>
                          <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded leading-none">
                            {item.relevanceScore}% Weight
                          </span>
                        </div>
                        {/* Dynamic Progress Bar */}
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${item.relevanceScore}%` }}
                            className={`h-full rounded-full ${
                              item.relevanceScore > 85
                                ? "bg-rose-500"
                                : item.relevanceScore > 65
                                ? "bg-amber-500"
                                : "bg-indigo-600"
                            }`}
                          ></div>
                        </div>
                        <p className="text-[10px] text-slate-405 leading-relaxed">{item.reasoning}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Repeated patterns */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs lg:col-span-1 space-y-4">
                  <h3 className="font-display font-bold text-slate-800 text-sm border-b border-slate-50 pb-3 flex items-center gap-2">
                    🔄 Frequently Repeated Themes
                  </h3>
                  <div className="space-y-3 pt-1">
                    {insights.frequentlyRepeatedConcepts?.map((theme, idx) => (
                      <div key={idx} className="p-3 bg-emerald-50/30 border border-emerald-50 rounded-lg flex gap-2.5 items-start">
                        <span className="p-1 bg-emerald-100 text-emerald-800 rounded uppercase font-bold text-[9px] shrink-0 font-sans tracking-wide">
                          Repeat
                        </span>
                        <p className="text-xs text-slate-705 leading-normal font-medium">{theme}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Expected Questions List Details */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                <h3 className="font-display font-bold text-slate-800 text-sm border-b border-slate-50 pb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-505 animate-pulse-subtle" /> Potential Exam Questions Predictions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {insights.potentialExamQuestions?.map((item, idx) => (
                    <div key={idx} className="p-4 bg-slate-50/50 hover:bg-slate-50 hover:border-indigo-300 transition duration-200 border border-slate-100 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                          Q-PREDICTION {idx + 1}
                        </span>
                        <span className="px-1.5 py-0.5 bg-orange-50 stroke-orange-300 text-orange-700 text-[9px] font-bold rounded">
                          {item.expectedType}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold leading-snug text-slate-800">
                        {item.question}
                      </h4>
                      <div className="p-2.5 bg-indigo-50/35 border border-indigo-100 text-[10px] text-slate-650 rounded-lg font-sans leading-relaxed">
                        <strong>🛡️ Recommended Tactical Answer Path:</strong> {item.bestApproach}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* High Revision areas categorizations */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                <h3 className="font-display font-bold text-slate-800 text-sm border-b border-slate-50 pb-3 flex items-center gap-2">
                  ⚠️ Hotspot Priority Revision Matrix
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                  {insights.highPriorityRevisionAreas?.map((area, idx) => {
                    const isCritical = area.level === "Critical";
                    const isHigh = area.level === "High";
                    return (
                      <div
                        key={idx}
                        className={`p-4 border rounded-xl space-y-2 ${
                          isCritical
                            ? "bg-red-50/15 border-red-100 text-red-900"
                            : isHigh
                            ? "bg-amber-50/15 border-amber-100 text-amber-900"
                            : "bg-indigo-50/10 border-indigo-100 text-indigo-900"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold font-display truncate truncate-2 font-mono">
                            {area.topic}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 text-[8px] uppercase tracking-widest font-extrabold rounded leading-none ${
                              isCritical
                                ? "bg-red-600 text-white"
                                : isHigh
                                ? "bg-amber-500 text-white"
                                : "bg-indigo-600 text-white"
                            }`}
                          >
                            {area.level}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-550 leading-relaxed font-sans">{area.advice}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
