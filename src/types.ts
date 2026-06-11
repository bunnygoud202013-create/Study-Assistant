/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DocumentMetadata {
  title: string;
  topic: string;
  detectedStructure: string;
  estimatedWordCount: number;
  topKeyTerms: string[];
}

export interface DocumentItem {
  id: string;
  fileName: string;
  text: string;
  uploadedAt: string;
  metadata: DocumentMetadata;
  semester?: string;
}

export interface Definition {
  term: string;
  definition: string;
  example?: string;
}

export interface DetailedSection {
  topic: string;
  content: string;
  definitions: Definition[];
}

export interface SummaryData {
  quickSummary: string[];
  detailedSummary: DetailedSection[];
  revisionNotes: string;
}

export interface QuizQuestion {
  id: string;
  type: "mcq" | "tf" | "fib" | "short";
  question: string;
  options?: string[];
  answer: string;
  explanation: string;
  topic: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  topic: string;
  markedDifficult?: boolean;
}

export interface StudyGuide {
  topicsCovered: string[];
  importantConcepts: Array<{
    conceptName: string;
    summary: string;
    importanceReason: string;
  }>;
  definitions: Array<{
    term: string;
    definition: string;
    example: string;
  }>;
  formulas: Array<{
    formulaName: string;
    formula: string;
    explanation: string;
  }>;
  frequentlyAskedQuestions: Array<{
    question: string;
    answer: string;
    examTip: string;
  }>;
  examPreparationTips: string[];
}

export interface ImportantTopic {
  topic: string;
  relevanceScore: number;
  reasoning: string;
}

export interface PotentialQuestion {
  question: string;
  expectedType: string;
  bestApproach: string;
}

export interface RevisionArea {
  topic: string;
  level: "Critical" | "High" | "Medium";
  advice: string;
}

export interface LearningInsights {
  importantTopics: ImportantTopic[];
  frequentlyRepeatedConcepts: string[];
  potentialExamQuestions: PotentialQuestion[];
  highPriorityRevisionAreas: RevisionArea[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
}

export interface ActiveSession {
  documentId: string;
  summary?: SummaryData;
  quiz?: QuizQuestion[];
  flashcards?: Flashcard[];
  studyGuide?: StudyGuide;
  insights?: LearningInsights;
  chatHistory?: ChatMessage[];
  lastAccessedAt: string;
}
