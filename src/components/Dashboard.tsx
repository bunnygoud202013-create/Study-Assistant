import React, { useState, useRef } from "react";
import { 
  UploadCloud, FileText, Trash2, CheckCircle2, 
  FolderPlus, AlertCircle, Calendar, Sparkles, BookOpen, Clock, Tag,
  ArrowRight, Trophy, Bot, Bookmark
} from "lucide-react";
import { DocumentItem } from "../types";

interface DashboardProps {
  documents: DocumentItem[];
  activeDoc: DocumentItem | null;
  onSelectDoc: (doc: DocumentItem) => void;
  onUploadSuccess: (doc: DocumentItem) => void;
  onDeleteDoc: (id: string) => void;
  onUpdateSemester: (id: string, semester: string) => void;
  onSelectTab: (tab: string) => void;
}

export default function Dashboard({
  documents,
  activeDoc,
  onSelectDoc,
  onUploadSuccess,
  onDeleteDoc,
  onUpdateSemester,
  onSelectTab,
}: DashboardProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedSemesterFilter, setSelectedSemesterFilter] = useState<string>("all");
  const [newSemesterInput, setNewSemesterInput] = useState<string>("");
  const [editingSemesterDocId, setEditingSemesterDocId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Semesters extraction
  const semesters = Array.from(
    new Set(documents.map((doc) => doc.semester).filter(Boolean))
  ) as string[];

  // Statistics calculation
  const totalWords = documents.reduce((acc, doc) => acc + (doc.metadata.estimatedWordCount || 0), 0);
  const totalTopics = Array.from(new Set(documents.map((doc) => doc.metadata.topic))).length;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = async (file: File) => {
    const allowedExtensions = [".txt", ".md", ".pdf", ".docx", ".pptx", ".ppt"];
    const fileExtension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
      setError(`Unsupported file format. Please upload files in PDF, DOCX, TXT, MD or PPTX format.`);
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setError("File size exceeds typical limit (20MB). Please upload a smaller study document.");
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const reader = new FileReader();
      
      const fileLoadedPromise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          // Extract base64 part
          const base64Data = result.split(",")[1] || result;
          resolve(base64Data);
        };
        reader.onerror = () => reject(new Error("Failed to read file bytes."));
        reader.readAsDataURL(file);
      });

      const base64Data = await fileLoadedPromise;

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileData: base64Data,
        }),
      });

      const data = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(data.error || "Failed to parse document text.");
      }

      const newDoc: DocumentItem = {
        id: `doc-${Date.now()}`,
        fileName: file.name,
        text: data.text,
        uploadedAt: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        metadata: data.metadata,
        semester: "General Study",
      };

      onUploadSuccess(newDoc);
      // Automatically activate first uploaded document
      onSelectDoc(newDoc);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Network error while parsing notes. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const filteredDocs = documents.filter((doc) => {
    if (selectedSemesterFilter === "all") return true;
    return doc.semester === selectedSemesterFilter;
  });

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-white rounded-2xl border border-slate-100 shadow-xs gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Study Workspace <Sparkles className="h-5 w-5 text-indigo-500 animate-pulse-subtle" />
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Upload your lecture guides, slides, research papers, or syllabus to start learning.
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-lg">
          <Clock className="w-3.5 h-3.5" />
          <span>Active Session Code: COLLEGE_FALL2026</span>
        </div>
      </div>

      {/* Statistics Header Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-2xs hover:shadow-xs transition duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Indexed Documents</span>
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-display font-semibold text-slate-800 mt-2">{documents.length}</p>
          <p className="text-2xs text-slate-400 mt-1">Ready for study generation</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-2xs hover:shadow-xs transition duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Extracted Words</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-display font-semibold text-slate-800 mt-2">
            {totalWords > 1000 ? `${(totalWords / 1000).toFixed(1)}k` : totalWords}
          </p>
          <p className="text-2xs text-slate-300 mt-1">Digested from materials</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-2xs hover:shadow-xs transition duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Discovered Subjects</span>
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-display font-semibold text-slate-800 mt-2">{totalTopics}</p>
          <p className="text-2xs text-slate-300 mt-1">Distinct academic fields</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-2xs hover:shadow-xs transition duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Guide</span>
            <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-sm font-semibold text-slate-700 truncate mt-2 max-w-[150px]">
            {activeDoc ? activeDoc.metadata.title : "No materials active"}
          </p>
          <p className="text-2xs text-slate-400 mt-1">Click below to activate</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side: Drag & Drop Upload Space */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-3xs">
            <h2 className="font-display font-semibold text-base text-slate-800 mb-3 flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-indigo-500" />
              Upload Source File
            </h2>
            
            <form
              id="file-upload-form"
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onSubmit={(e) => e.preventDefault()}
              className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-all duration-200 ${
                dragActive 
                  ? "border-indigo-500 bg-indigo-50/40" 
                  : "border-slate-200 hover:border-indigo-300 bg-slate-50/20"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".txt,.md,.pdf,.docx,.pptx,.ppt"
                onChange={handleFileInput}
              />
              <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-2xs mb-3 text-slate-400 group-hover:text-indigo-500">
                <UploadCloud className="w-6 h-6 text-indigo-600" />
              </div>
              
              <p className="text-xs font-semibold text-slate-700 text-center">
                Drag slides or syllabus here, or
              </p>
              <button
                type="button"
                onClick={onButtonClick}
                className="mt-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 underline focus:outline-none"
              >
                browse local files
              </button>

              <div className="mt-4 flex flex-wrap justify-center gap-1.5 max-w-[200px]">
                <span className="px-1.5 py-0.5 bg-white border border-slate-150 text-[10px] text-slate-500 font-mono rounded">PDF</span>
                <span className="px-1.5 py-0.5 bg-white border border-slate-150 text-[10px] text-slate-500 font-mono rounded">DOCX</span>
                <span className="px-1.5 py-0.5 bg-white border border-slate-150 text-[10px] text-slate-500 font-mono rounded">PPTX</span>
                <span className="px-1.5 py-0.5 bg-white border border-slate-150 text-[10px] text-slate-500 font-mono rounded">TXT</span>
              </div>
            </form>

            {isUploading && (
              <div className="mt-4 p-3 bg-indigo-50 text-indigo-700 italic text-xs rounded-lg flex items-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Analyzing document with Gemini AI. Parsing tables, headers, and formulas...</span>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 text-xs rounded-lg flex items-start gap-2 border border-red-105">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span className="leading-snug">{error}</span>
              </div>
            )}
          </div>

          <div className="bg-amber-50/50 hover:bg-amber-50 p-4 rounded-xl border border-amber-100 shadow-3xs cursor-pointer">
            <h3 className="font-display font-semibold text-xs text-amber-800 uppercase tracking-wide flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Semester Structure
            </h3>
            <p className="text-xs text-amber-700 mt-1 leading-snug">
              Keep your studies neatly structured. Assign documents below into terms like "Term 1 (Fall)", "Biology 101" to study specific curriculum segments easily.
            </p>
          </div>

          {/* Quick Study Launchpad Panel */}
          <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white p-5 rounded-xl border border-indigo-800 shadow-md">
            <h3 className="font-display font-bold text-xs uppercase tracking-widest text-indigo-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse-subtle" /> Quick Study Launchpad
            </h3>
            
            {activeDoc ? (
              <div className="mt-3 space-y-3">
                <div className="border-b border-indigo-900/60 pb-2.5">
                  <span className="text-[9px] text-indigo-400 font-bold block uppercase tracking-wider">Activerevision segment</span>
                  <p className="text-xs font-bold font-display text-white line-clamp-1 mt-0.5">{activeDoc.metadata.title}</p>
                  <span className="text-[10px] px-1.5 py-0.5 bg-indigo-900/60 text-indigo-300 rounded font-semibold font-mono inline-block mt-1">
                    {activeDoc.metadata.topic}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-1.5 pt-1">
                  <button
                    onClick={() => onSelectTab("summary")}
                    className="w-full text-left px-3 py-2 bg-indigo-900/30 hover:bg-indigo-900/60 border border-indigo-900/50 rounded-lg text-xs font-semibold flex items-center justify-between text-indigo-200 hover:text-white transition"
                  >
                    <span className="flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-400" /> Smart Summary
                    </span>
                    <ArrowRight className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => onSelectTab("guide")}
                    className="w-full text-left px-3 py-2 bg-indigo-900/30 hover:bg-indigo-900/60 border border-indigo-900/50 rounded-lg text-xs font-semibold flex items-center justify-between text-indigo-200 hover:text-white transition"
                  >
                    <span className="flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5 text-teal-400" /> Syllabus Guides & Insights
                    </span>
                    <ArrowRight className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => onSelectTab("flashcards")}
                    className="w-full text-left px-3 py-2 bg-indigo-900/30 hover:bg-indigo-900/60 border border-indigo-900/50 rounded-lg text-xs font-semibold flex items-center justify-between text-indigo-200 hover:text-white transition"
                  >
                    <span className="flex items-center gap-2">
                      <Bookmark className="w-3.5 h-3.5 text-amber-400" /> Active Flashcards
                    </span>
                    <ArrowRight className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => onSelectTab("quiz")}
                    className="w-full text-left px-3 py-2 bg-indigo-900/30 hover:bg-indigo-900/60 border border-indigo-900/50 rounded-lg text-xs font-semibold flex items-center justify-between text-indigo-200 hover:text-white transition"
                  >
                    <span className="flex items-center gap-2">
                      <Trophy className="w-3.5 h-3.5 text-emerald-400" /> Practice Quizzes
                    </span>
                    <ArrowRight className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => onSelectTab("chat")}
                    className="w-full text-left px-3 py-2 bg-indigo-900/30 hover:bg-indigo-900/60 border border-indigo-900/50 rounded-lg text-xs font-semibold flex items-center justify-between text-indigo-200 hover:text-white transition"
                  >
                    <span className="flex items-center gap-2">
                      <Bot className="w-3.5 h-3.5 text-indigo-400" /> Q&A AI Tutor
                    </span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-3 text-center py-4 bg-indigo-950/40 rounded-lg border border-indigo-900/40 text-indigo-300">
                <p className="text-2xs">No textbook armed in launchpad.</p>
                <span className="text-[10px] text-indigo-450 block mt-1">Select any notebook from your library below to begin!</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Document Table & Directory Navigator */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-3xs">
            {/* Filter Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-3">
              <h2 className="font-display font-semibold text-base text-slate-800 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-500" />
                Indexed Study Library
              </h2>
              {/* Semester Select Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 whitespace-nowrap">Filter term:</span>
                <select
                  value={selectedSemesterFilter}
                  onChange={(e) => setSelectedSemesterFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs rounded-lg px-2.5 py-1 text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="all">📁 All Semesters / Topics</option>
                  <option value="General Study">📓 General Study</option>
                  {semesters.map((sem) => (
                    <option key={sem} value={sem}>
                      📂 {sem}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filteredDocs.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-450 border border-dotted border-slate-150 rounded-xl mt-4">
                <FileText className="w-12 h-12 text-slate-250 stroke-[1.5]" />
                <p className="font-semibold text-slate-700 text-sm mt-3">No study documents found</p>
                <p className="text-xs text-slate-400 text-center max-w-[280px] mt-1">
                  Upload PDF presentation or standard college notes on the left side to populate this workspace.
                </p>
              </div>
            ) : (
              <div className="space-y-3 mt-4">
                {filteredDocs.map((doc) => {
                  const isActive = activeDoc?.id === doc.id;
                  return (
                    <div
                      key={doc.id}
                      className={`p-4 rounded-xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        isActive 
                          ? "border-indigo-500 bg-indigo-50/20 shadow-3xs" 
                          : "border-slate-100 hover:border-slate-200 bg-white"
                      }`}
                    >
                      {/* Left Block info */}
                      <div className="space-y-1.5 cursor-pointer max-w-[350px]" onClick={() => onSelectDoc(doc)}>
                        <div className="flex items-center gap-2">
                          <FileText className={`w-4 h-4 shrink-0 ${isActive ? "text-indigo-600" : "text-slate-405"}`} />
                          <h4 className="text-xs font-semibold text-slate-800 line-clamp-1">{doc.metadata.title}</h4>
                          {isActive && (
                            <span className="px-1.5 py-0.5 bg-indigo-600 text-white text-[9px] uppercase font-bold tracking-widest rounded leading-none shrink-0">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400">
                          <span className="px-1.5 py-0.5 bg-slate-50 border border-slate-100 text-slate-500 rounded font-medium">
                            {doc.metadata.detectedStructure}
                          </span>
                          <span className="px-1.5 py-0.5 bg-indigo-50/50 text-indigo-700 rounded font-medium">
                            {doc.metadata.topic}
                          </span>
                          <span>•</span>
                          <span>{doc.metadata.estimatedWordCount} words</span>
                          <span>•</span>
                          <span>{doc.uploadedAt}</span>
                        </div>
                        {/* Key terms previews */}
                        {doc.metadata.topKeyTerms?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {doc.metadata.topKeyTerms.slice(0, 3).map((term, tIdx) => (
                              <span key={tIdx} className="text-[10px] text-slate-500 font-mono italic">
                                #{term}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Right Block Actions */}
                      <div className="flex items-center gap-1.5 justify-end shrink-0">
                        {editingSemesterDocId === doc.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              placeholder="New semester..."
                              value={newSemesterInput}
                              onChange={(e) => setNewSemesterInput(e.target.value)}
                              className="border border-slate-250 rounded text-xs px-2 py-0.5 w-[110px] focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-slate-800"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  onUpdateSemester(doc.id, newSemesterInput || "General Study");
                                  setEditingSemesterDocId(null);
                                  setNewSemesterInput("");
                                }
                              }}
                            />
                            <button
                              onClick={() => {
                                onUpdateSemester(doc.id, newSemesterInput || "General Study");
                                setEditingSemesterDocId(null);
                                setNewSemesterInput("");
                              }}
                              className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded shadow-2xs"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingSemesterDocId(doc.id);
                              setNewSemesterInput(doc.semester || "");
                            }}
                            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded"
                            title="Assign to semester / class Folder"
                          >
                            <FolderPlus className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => onDeleteDoc(doc.id)}
                          className="p-1 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Remove study guide"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions cards & Study Progress Widget Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Study Progress Widget */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-3xs md:col-span-1 space-y-4">
          <h3 className="font-display font-semibold text-xs text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-emerald-500 animate-pulse-subtle" /> Study Completion Progress
          </h3>
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between text-xs">
              <div>
                <span className="text-[10px] font-semibold inline-block py-1 px-2 uppercase rounded-full bg-emerald-50 text-emerald-600">
                  Course syllabus check
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold inline-block text-emerald-600">
                  {documents.length > 0 ? Math.min(100, Math.round((documents.length / 5) * 100)) : 0}%
                </span>
              </div>
            </div>
            {/* Custom progress slider */}
            <div className="overflow-hidden h-2 text-xs flex rounded-full bg-slate-100 border border-slate-150">
              <div
                style={{ width: `${documents.length > 0 ? Math.min(100, Math.round((documents.length / 5) * 100)) : 0}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-emerald-500 transition-all duration-300"
              ></div>
            </div>
            <p className="text-[10px] text-slate-400 mt-2.5 leading-relaxed">
              Target index: cover 5 reference handbooks per syllabus code to ensure optimal exam prediction accuracy.
            </p>
          </div>
        </div>

        {/* Quick Action cards (2 columns spanned) */}
        <div className="md:col-span-2 space-y-3">
          <h3 className="font-display font-semibold text-xs text-slate-400 uppercase tracking-widest">
            💡 Fast Navigation Quick Actions
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Summaries", desc: "Short executive summaries", tab: "summary", icon: BookOpen, color: "bg-indigo-50 border-indigo-150 text-indigo-700" },
              { label: "Practice Quiz", desc: "Automated mock test", tab: "quiz", icon: Trophy, color: "bg-emerald-50 border-emerald-150 text-emerald-700" },
              { label: "Active Cards", desc: "Interactive cards deck", tab: "flashcards", icon: Bookmark, color: "bg-amber-50 border-amber-150 text-amber-700" },
              { label: "AI Tutor Live", desc: "Grounded conversational chatbot", tab: "chat", icon: Bot, color: "bg-purple-50 border-purple-150 text-purple-700" }
            ].map((act, index) => (
              <button
                key={index}
                onClick={() => onSelectTab(act.tab)}
                disabled={documents.length === 0}
                className={`p-3 border rounded-xl flex flex-col items-start text-left hover:scale-[1.02] hover:shadow-2xs transition-all duration-205 cursor-pointer disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed ${act.color}`}
              >
                <div className="p-1.5 bg-white rounded-lg shadow-3xs mb-2">
                  <act.icon className="w-4 h-4" />
                </div>
                <strong className="text-xs font-bold block">{act.label}</strong>
                <span className="text-[9px] opacity-80 leading-normal block mt-0.5 line-clamp-2">{act.desc}</span>
              </button>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
