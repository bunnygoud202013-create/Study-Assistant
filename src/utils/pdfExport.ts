import { jsPDF } from "jspdf";

export function exportSummaryToPDF(title: string, summary: any) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;

  let y = margin;

  const addText = (
    text: string, 
    size: number, 
    style: "normal" | "bold" | "italic" = "normal", 
    color: [number, number, number] = [31, 41, 55], 
    spacingAfter = 4
  ) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);

    const lines: string[] = doc.splitTextToSize(text, contentWidth);
    
    lines.forEach((line) => {
      if (y + (size * 0.35) > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += (size * 0.35) + 1.2;
    });

    y += spacingAfter;
  };

  const addHeader = (text: string) => {
    // Elegant bold index headings
    addText(text.toUpperCase(), 12, "bold", [79, 70, 229], 4);
    // Draw horizontal separator
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    if (y + 2 > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;
  };

  // Header / Cover Header Block
  addText("AI Revision & Study Companion", 10, "bold", [100, 116, 139], 2);
  addText(title, 18, "bold", [17, 24, 39], 4);
  addText(`Compiled on ${new Date().toLocaleDateString()}`, 8.5, "italic", [156, 163, 175], 10);

  // Section 1: Quick Concept Snapshot
  if (summary.quickSummary && Array.isArray(summary.quickSummary) && summary.quickSummary.length > 0) {
    addHeader("1. Quick Concept Snapshot");
    summary.quickSummary.forEach((point: string, idx: number) => {
      addText(`${idx + 1}. ${point}`, 9.5, "normal", [55, 65, 81], 3);
    });
    y += 4;
  }

  // Section 2: Detailed Subject Explanations
  if (summary.detailedSummary && Array.isArray(summary.detailedSummary) && summary.detailedSummary.length > 0) {
    addHeader("2. Detailed Subject Explanations");
    summary.detailedSummary.forEach((section: any) => {
      addText(section.topic, 10.5, "bold", [17, 24, 39], 2);
      addText(section.content, 9, "normal", [55, 65, 81], 3);

      if (section.definitions && Array.isArray(section.definitions) && section.definitions.length > 0) {
        addText("Definitions & Core Index:", 9, "bold", [79, 70, 229], 2);
        section.definitions.forEach((def: any) => {
          let defText = `- [${def.term}]: ${def.definition}`;
          if (def.example) {
            defText += ` (Example: ${def.example})`;
          }
          addText(defText, 8.5, "normal", [75, 85, 99], 1.5);
        });
        y += 2.5;
      }
      y += 3;
    });
  }

  // Section 3: Last-Minute Revision Fact Sheet
  if (summary.revisionNotes) {
    addHeader("3. Last-Minute Revision Fact Sheet");
    addText(summary.revisionNotes, 9, "normal", [55, 65, 81], 4);
  }

  doc.save(`${title.replace(/\.[^/.]+$/, "")}_summary.pdf`);
}

export function exportStudyGuideToPDF(title: string, studyGuide: any, insights: any) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;

  let y = margin;

  const addText = (
    text: string, 
    size: number, 
    style: "normal" | "bold" | "italic" = "normal", 
    color: [number, number, number] = [31, 41, 55], 
    spacingAfter = 4
  ) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);

    const lines: string[] = doc.splitTextToSize(text, contentWidth);
    
    lines.forEach((line) => {
      if (y + (size * 0.35) > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += (size * 0.35) + 1.2;
    });

    y += spacingAfter;
  };

  const addHeader = (text: string) => {
    // Elegant emerald style for study guide topics
    addText(text.toUpperCase(), 12, "bold", [16, 185, 129], 4);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    if (y + 2 > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;
  };

  // Header BLOCK
  addText("Syllabus Blueprint & Revision Plan", 10, "bold", [100, 116, 139], 2);
  addText(title, 18, "bold", [17, 24, 39], 4);
  addText(`Compiled on ${new Date().toLocaleDateString()}`, 8.5, "italic", [156, 163, 175], 10);

  // Section 1: Syllabus Overview
  if (studyGuide.topicsCovered && Array.isArray(studyGuide.topicsCovered) && studyGuide.topicsCovered.length > 0) {
    addHeader("1. Syllabus Overview & Checklist");
    addText("Topics Checklist:", 10, "bold", [17, 24, 39], 2);
    const bullets = studyGuide.topicsCovered.map((t: string) => `- ${t}`).join("\n");
    addText(bullets, 9, "normal", [55, 65, 81], 4);
  }

  // Exam prep tips
  if (studyGuide.examPreparationTips && Array.isArray(studyGuide.examPreparationTips) && studyGuide.examPreparationTips.length > 0) {
    addText("High-Impact Exam Tactics:", 10, "bold", [17, 24, 39], 2);
    studyGuide.examPreparationTips.forEach((tip: string) => {
      addText(`* ${tip}`, 9, "normal", [55, 65, 81], 2);
    });
    y += 3;
  }

  // Section 2: Important Study Concepts
  if (studyGuide.importantConcepts && Array.isArray(studyGuide.importantConcepts) && studyGuide.importantConcepts.length > 0) {
    addHeader("2. Crucial Syllabus Concepts");
    studyGuide.importantConcepts.forEach((concept: any, idx: number) => {
      addText(`${idx + 1}. ${concept.conceptName}`, 10.5, "bold", [17, 24, 39], 1.5);
      addText(`Overview: ${concept.summary}`, 9, "normal", [55, 65, 81], 1.5);
      addText(`Priority rationale: ${concept.importanceReason}`, 8.5, "italic", [16, 185, 129], 3.5);
    });
  }

  // Section 3: Math Formulas & Logical Rationales
  if (studyGuide.formulas && Array.isArray(studyGuide.formulas) && studyGuide.formulas.length > 0) {
    addHeader("3. Math Formulas & Rationales");
    studyGuide.formulas.forEach((frm: any) => {
      addText(`${frm.formulaName}: ${frm.formula}`, 10, "bold", [17, 24, 39], 1.5);
      addText(`Explanation: ${frm.explanation}`, 9, "normal", [55, 65, 81], 3.5);
    });
  }

  // Section 4: Glossary Definitions
  if (studyGuide.definitions && Array.isArray(studyGuide.definitions) && studyGuide.definitions.length > 0) {
    addHeader("4. Core Glossary Definitions");
    studyGuide.definitions.forEach((def: any) => {
      let defText = `[${def.term}] - ${def.definition}`;
      if (def.example) {
        defText += ` (Example: ${def.example})`;
      }
      addText(defText, 9, "normal", [55, 65, 81], 2);
    });
    y += 3;
  }

  // Section 5: FAQs
  if (studyGuide.frequentlyAskedQuestions && Array.isArray(studyGuide.frequentlyAskedQuestions) && studyGuide.frequentlyAskedQuestions.length > 0) {
    addHeader("5. Frequently Asked Exam Questions");
    studyGuide.frequentlyAskedQuestions.forEach((faq: any, idx: number) => {
      addText(`Question ${idx + 1}: ${faq.question}`, 10, "bold", [17, 24, 39], 1.5);
      addText(`Proposed Answer: ${faq.answer}`, 9, "normal", [55, 65, 81], 1.5);
      if (faq.examTip) {
        addText(`Exam Hack: ${faq.examTip}`, 8.5, "bold", [16, 185, 129], 3.5);
      } else {
        y += 2.5;
      }
    });
  }

  // Section 6: Learning Prioritization insights
  if (insights) {
    addHeader("6. Learning Priority Map & Predictions");
    
    if (insights.importantTopics && Array.isArray(insights.importantTopics) && insights.importantTopics.length > 0) {
      addText("Syllabus Relevance Priority Rating:", 10, "bold", [17, 24, 39], 2);
      insights.importantTopics.forEach((t: any) => {
        addText(`- ${t.topic} (Weight: ${t.relevanceScore}%): ${t.reasoning}`, 9, "normal", [55, 65, 81], 2.5);
      });
      y += 2.5;
    }

    if (insights.frequentlyRepeatedConcepts && Array.isArray(insights.frequentlyRepeatedConcepts) && insights.frequentlyRepeatedConcepts.length > 0) {
      addText("Curriculum Themes Repeated:", 10, "bold", [17, 24, 39], 2);
      insights.frequentlyRepeatedConcepts.forEach((theme: string) => {
        addText(`* ${theme}`, 9, "normal", [55, 65, 81], 2);
      });
      y += 2.5;
    }

    if (insights.potentialExamQuestions && Array.isArray(insights.potentialExamQuestions) && insights.potentialExamQuestions.length > 0) {
      addText("Predicted Exam Questions:", 10, "bold", [17, 24, 39], 2);
      insights.potentialExamQuestions.forEach((eq: any, idx: number) => {
        addText(`Q${idx + 1} (${eq.expectedType}): ${eq.question}`, 9.5, "bold", [17, 24, 39], 1.5);
        addText(`Recommended Approach: ${eq.bestApproach}`, 9, "normal", [55, 65, 81], 3);
      });
      y += 2.5;
    }

    if (insights.highPriorityRevisionAreas && Array.isArray(insights.highPriorityRevisionAreas) && insights.highPriorityRevisionAreas.length > 0) {
      addText("Hotspot Priority Matrix:", 10, "bold", [17, 24, 39], 2);
      insights.highPriorityRevisionAreas.forEach((area: any) => {
        addText(`- [${area.level} Attention] ${area.topic}: ${area.advice}`, 9, "normal", [55, 65, 81], 2.5);
      });
    }
  }

  doc.save(`${title.replace(/\.[^/.]+$/, "")}_study_guide.pdf`);
}

export function exportFlashcardsToPDF(title: string, flashcards: any[]) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;

  let y = margin;

  const addText = (
    text: string, 
    size: number, 
    style: "normal" | "bold" | "italic" = "normal", 
    color: [number, number, number] = [31, 41, 55], 
    spacingAfter = 4
  ) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);

    const lines: string[] = doc.splitTextToSize(text, contentWidth);
    
    lines.forEach((line) => {
      if (y + (size * 0.35) > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += (size * 0.35) + 1.2;
    });

    y += spacingAfter;
  };

  const addHeader = (text: string) => {
    addText(text.toUpperCase(), 12, "bold", [225, 29, 72], 4); // Rose shade for flashcards
    doc.setDrawColor(244, 204, 212);
    doc.setLineWidth(0.4);
    if (y + 2 > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;
  };

  // Header BLOCK
  addText("Interactive Printable Flashcards Deck", 10, "bold", [100, 116, 139], 2);
  addText(title, 18, "bold", [17, 24, 39], 4);
  addText(`Compiled on ${new Date().toLocaleDateString()}`, 8.5, "italic", [156, 163, 175], 10);

  addHeader("Flashcards Library");

  flashcards.forEach((card, idx) => {
    const cardHeightEstimate = 45;
    if (y + cardHeightEstimate > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }

    const docYBefore = y;
    y += 4; // top margin inside box
    
    addText(`CARD ${idx + 1}: ${card.topic || "General"}`, 10, "bold", [225, 29, 72], 2);
    addText("Q / FRONT:", 9, "bold", [51, 65, 85], 1);
    addText(card.front, 9, "normal", [15, 23, 42], 3);

    addText("A / BACK:", 9, "bold", [51, 65, 85], 1);
    addText(card.back, 9, "normal", [71, 85, 105], 4);

    const docYAfter = y;
    
    // Draw dashed border around the card
    doc.setDrawColor(203, 213, 225);
    doc.setLineDashPattern([2, 5], 0);
    // Draw rect around card content
    doc.rect(margin - 4, docYBefore, contentWidth + 8, docYAfter - docYBefore);
    doc.setLineDashPattern([], 0); // reset dash

    y += 6; // gap between cards
  });

  doc.save(`${title.replace(/\.[^/.]+$/, "")}_flashcards.pdf`);
}

export function exportQuizToPDF(title: string, quizQuestions: any[]) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;

  let y = margin;

  const addText = (
    text: string, 
    size: number, 
    style: "normal" | "bold" | "italic" = "normal", 
    color: [number, number, number] = [31, 41, 55], 
    spacingAfter = 4
  ) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);

    const lines: string[] = doc.splitTextToSize(text, contentWidth);
    
    lines.forEach((line) => {
      if (y + (size * 0.35) > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += (size * 0.35) + 1.2;
    });

    y += spacingAfter;
  };

  const addHeader = (text: string) => {
    addText(text.toUpperCase(), 12, "bold", [16, 185, 129], 4); // Emerald shade for Quiz
    doc.setDrawColor(167, 243, 208);
    doc.setLineWidth(0.4);
    if (y + 2 > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;
  };

  // Header BLOCK
  addText("Syllabus Practice & Self-Assessment Quiz", 10, "bold", [100, 116, 139], 2);
  addText(title, 18, "bold", [17, 24, 39], 4);
  addText(`Compiled on ${new Date().toLocaleDateString()}`, 8.5, "italic", [156, 163, 175], 10);

  addHeader("Quiz Questions");

  // Part 1: Clear un-answered testing sheet
  addText("Instructions: Attempt the questions below before cross-referencing answers on page 2.", 9, "italic", [100, 116, 139], 6);

  quizQuestions.forEach((q, idx) => {
    addText(`${idx + 1}. ${q.question}`, 10, "bold", [15, 23, 42], 2);
    
    if (q.type === "mcq" && Array.isArray(q.options) && q.options.length > 0) {
      q.options.forEach((opt: string) => {
        addText(`[  ]  ${opt}`, 9, "normal", [71, 85, 105], 2);
      });
    } else if (q.type === "tf") {
      addText("[  ] True      [  ] False", 9, "normal", [71, 85, 105], 2);
    } else {
      // Free answers lines
      y += 2;
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      if (y + 5 > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.line(margin, y, pageWidth - margin, y);
      y += 4;
    }
    
    y += 3; // gap between questions
  });

  // Part 2: Answer Key
  doc.addPage();
  y = margin;
  addText("PRACTICE QUIZ ANSWER KEY", 14, "bold", [16, 185, 129], 6);
  
  quizQuestions.forEach((q, idx) => {
    addText(`Question ${idx + 1}: ${q.question}`, 9.5, "bold", [15, 23, 42], 1.5);
    addText(`CORRECT ANSWER: ${q.answer}`, 9.5, "bold", [16, 185, 129], 1.5);
    if (q.explanation) {
      addText(`Explanation: ${q.explanation}`, 8.5, "normal", [71, 85, 105], 3);
    }
    y += 2.5;
  });

  doc.save(`${title.replace(/\.[^/.]+$/, "")}_quiz.pdf`);
}
