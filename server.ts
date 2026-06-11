import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

// @ts-ignore
import pdf from "pdf-parse";
// @ts-ignore
import mammoth from "mammoth";
// @ts-ignore
import AdmZip from "adm-zip";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload limit to handle large document uploads as JSON base64
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialize GoogleGenAI SDK
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Helper: Extract text from PPTX
function extractPPTXText(buffer: Buffer): string {
  try {
    const zip = new AdmZip(buffer);
    const zipEntries = zip.getEntries();
    let text = "";

    // Find and sort slides ppt/slides/slide1.xml, slide2.xml...
    const slideEntries = zipEntries
      .filter((entry: any) => entry.entryName.match(/ppt\/slides\/slide\d+\.xml/))
      .sort((a: any, b: any) => {
        const matchA = a.entryName.match(/\d+/);
        const matchB = b.entryName.match(/\d+/);
        const numA = parseInt(matchA ? matchA[0] : "0", 10);
        const numB = parseInt(matchB ? matchB[0] : "0", 10);
        return numA - numB;
      });

    slideEntries.forEach((entry: any, index: number) => {
      text += `\n--- Slide ${index + 1} ---\n`;
      const content = entry.getData().toString("utf8");
      const matches = content.match(/<a:t[^>]*>(.*?)<\/a:t>/g);
      if (matches) {
        matches.forEach((match: string) => {
          const tText = match
            .replace(/<[^>]+>/g, "")
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/&apos;/g, "'");
          text += tText + " ";
        });
      }
      text += "\n";
    });

    return text.trim() || "No text content found in slides.";
  } catch (error) {
    console.error("PPTX extraction failed:", error);
    return "Failed to extract text from PowerPoint slides.";
  }
}

// Ensure the Google API Key is set when endpoints are run
function checkApiKey(req: any, res: any, next: any) {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      error: "GEMINI_API_KEY is not configured in the developer environment. Please specify it in the Secrets panel in AI Studio Settings.",
    });
  }
  next();
}

// API: Document Processing Upload
app.post("/api/upload", async (req, res) => {
  const { fileName, fileData } = req.body;

  if (!fileName || !fileData) {
    return res.status(400).json({ error: "Missing fileName or fileData payload." });
  }

  try {
    const buffer = Buffer.from(fileData, "base64");
    const extension = path.extname(fileName).toLowerCase();
    let extractedText = "";

    if (extension === ".txt" || extension === ".md" || extension === ".json" || extension === ".csv") {
      extractedText = buffer.toString("utf8");
    } else if (extension === ".pdf") {
      const data = await pdf(buffer);
      extractedText = data.text || "";
    } else if (extension === ".docx") {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value || "";
    } else if (extension === ".pptx" || extension === ".ppt") {
      extractedText = extractPPTXText(buffer);
    } else {
      return res.status(400).json({ error: `Unsupported file type: ${extension}. Only PDF, DOCX, TXT, and PPTX visual formats are supported.` });
    }

    if (!extractedText.trim()) {
      return res.status(400).json({ error: "Could not extract any standard text content from this document. Please verify it is not empty or scanned image-only." });
    }

    // Determine content metadata using Gemini
    let docMetadata = {
      title: fileName,
      topic: "General Study",
      detectedStructure: "Linear",
      estimatedWordCount: extractedText.split(/\s+/).length,
      topKeyTerms: [] as string[]
    };

    if (process.env.GEMINI_API_KEY) {
      try {
        const geminiMetaResponse = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: `Create metadata for this document in JSON format.
Document content preview:
"${extractedText.substring(0, 3000)}"

Return a json object matching this TypeScript format:
{
  "title": string (improved title representing the topic of document, or original filename without extension),
  "topic": string (main academic subject or topic),
  "detectedStructure": string (e.g., Slides, Academic Report, Notes, Textbook Chapter),
  "topKeyTerms": string[] (5 main keywords or technical terms)
}`,
          config: {
            responseMimeType: "application/json",
          }
        });

        if (geminiMetaResponse.text) {
          const contentMeta = JSON.parse(geminiMetaResponse.text.trim());
          docMetadata = { ...docMetadata, ...contentMeta };
        }
      } catch (err) {
        console.warn("Failed to generate metadata using Gemini:", err);
      }
    }

    res.json({
      success: true,
      text: extractedText,
      metadata: docMetadata
    });

  } catch (error: any) {
    console.error("Upload parsing failure:", error);
    res.status(500).json({ error: error.message || "Failed to process and analyze document." });
  }
});

// API: Quick, Detailed and Revision Summary Generator
app.post("/api/generate-summary", checkApiKey, async (req, res) => {
  const { docContent, fileName } = req.body;

  if (!docContent) {
    return res.status(400).json({ error: "No document content provided." });
  }

  try {
    const prompt = `Analyze this student uploaded document and generate a premium three-tiered academic summary.
Document Title: ${fileName || "Study Notes"}

Document Content:
"""
${docContent}
"""

You must generate exactly these 3 summary types and organize them into the specified JSON format matching this schema:
{
  "quickSummary": string[] (5 to 10 highly impactful bullet points summarizing the most important elements),
  "detailedSummary": [
    {
      "topic": string (heading/concept name),
      "content": string (detailed educational paragraphs explaining this topic thoroughly),
      "definitions": [
        { "term": string, "definition": string }
      ]
    }
  ],
  "revisionNotes": string (extremely condensed, last-minute revision summary centered on hard facts, equations, or crucial takeaways formatted beautifully with Markdown)
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    if (!response.text) {
      throw new Error("Empty response returned from Gemini summary model.");
    }

    const data = JSON.parse(response.text.trim());
    res.json(data);

  } catch (error: any) {
    console.error("Summary generation failed:", error);
    res.status(500).json({ error: error.message || "Failed to generate visual summaries." });
  }
});

// API: Quiz Generator (Multiple Choice, True/False, Fill Blank, Short Answers)
app.post("/api/generate-quiz", checkApiKey, async (req, res) => {
  const { docContent, questionType, difficulty, count } = req.body;

  if (!docContent) {
    return res.status(400).json({ error: "No document content provided." });
  }

  const quizCount = Math.min(Number(count) || 10, 50); // limit to 50 max
  const qType = questionType || "all"; // 'mcq', 'tf', 'fib', 'short', or 'all'
  const diff = difficulty || "medium"; // 'easy', 'medium', 'hard'

  try {
    const prompt = `Generate a rigorous academic evaluation quiz using this study content.
Generate exactly ${quizCount} questions.
Question Type Target: ${qType} (mcq = Multiple Choice, tf = True/or/False, fib = Fill in the blank, short = Short answer, all = Equal blend of all types)
Difficulty Target: ${diff}

Document Content:
"""
${docContent}
"""

Format your response as a JSON array of questions, conforming strictly to this format:
[
  {
    "id": string (unique ID e.g., "q-1"),
    "type": "mcq" | "tf" | "fib" | "short",
    "question": string (the question text),
    "options": string[] (ONLY include this field for "mcq" type, must contain exactly 4 unique choices),
    "answer": string (The correct choice or word as it exactly appears in options/text, or model answer outline for short answers),
    "explanation": string (A detailed answer key rationale citing the content for pedagogical value),
    "topic": string (subject category/subtopic inside document)
  }
]`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    if (!response.text) {
      throw new Error("Empty response returned from quiz generation.");
    }

    const questions = JSON.parse(response.text.trim());
    res.json({ success: true, questions });

  } catch (error: any) {
    console.error("Quiz generation failed:", error);
    res.status(500).json({ error: error.message || "Failed to generate interactive quiz." });
  }
});

// API: Flashcard Generator (Front/Back)
app.post("/api/generate-flashcards", checkApiKey, async (req, res) => {
  const { docContent } = req.body;

  if (!docContent) {
    return res.status(400).json({ error: "No document content provided." });
  }

  try {
    const prompt = `Convert the following text into flashcards representing major definitions, formulas, processes, and high-yield concepts.
Format into an active learning deck fit for student revision.

Document Content:
"""
${docContent}
"""

Generate between 10 to 25 items in this scientific JSON format:
[
  {
    "id": string (unique serial identifier),
    "front": string (clear question, term, formula, or concept trigger),
    "back": string (concise explanation, definition, solution, or standard explanation),
    "topic": string (specific subtopic categorization)
  }
]`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    if (!response.text) {
      throw new Error("Empty response returned from flashcard generator.");
    }

    const flashcards = JSON.parse(response.text.trim());
    res.json({ success: true, flashcards });

  } catch (error: any) {
    console.error("Flashcard generation failed:", error);
    res.status(500).json({ error: error.message || "Failed to generate flashcards." });
  }
});

// API: Study Guide Generator
app.post("/api/generate-study-guide", checkApiKey, async (req, res) => {
  const { docContent, fileName } = req.body;

  if (!docContent) {
    return res.status(400).json({ error: "No document content provided." });
  }

  try {
    const prompt = `Create a visually gorgeous, comprehensive Study Guide designed to help high-performing college students ace exams from this material.
Material Title: ${fileName || "Active Document"}

Document Content:
"""
${docContent}
"""

Organize into a structured JSON response matching this exact schema:
{
  "topicsCovered": string[] (list of primary subjects/modules),
  "importantConcepts": [
    { "conceptName": string, "summary": string, "importanceReason": string }
  ],
  "definitions": [
    { "term": string, "definition": string, "example": string }
  ],
  "formulas": [
    { "formulaName": string, "formula": string, "explanation": string }
  ],
  "frequentlyAskedQuestions": [
    { "question": string, "answer": string, "examTip": string }
  ],
  "examPreparationTips": string[] (practical last-mile exam-specific preparation tactics)
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    if (!response.text) {
      throw new Error("Empty response returned from study guide generator.");
    }

    const data = JSON.parse(response.text.trim());
    res.json(data);

  } catch (error: any) {
    console.error("Study Guide generation failed:", error);
    res.status(500).json({ error: error.message || "Failed to generate structured study guide." });
  }
});

// API: Learning Insights & Priority Map
app.post("/api/generate-insights", checkApiKey, async (req, res) => {
  const { docContent } = req.body;

  if (!docContent) {
    return res.status(400).json({ error: "No document content provided." });
  }

  try {
    const prompt = `Analyze this course/textbook material and identify structural high-priority focus map areas.
Perform deep educational analysis: recurring concepts, exam probabilities, topic hierarchies, and gaps.

Document Content:
"""
${docContent}
"""

Format exactly into JSON conforming to this schema:
{
  "importantTopics": [
    { "topic": string, "relevanceScore": number (out of 100), "reasoning": string }
  ],
  "frequentlyRepeatedConcepts": string[] (3 to 6 major repeated academic themes),
  "potentialExamQuestions": [
    { "question": string, "expectedType": string (e.g., Essay, Multi-part problem, Critical theory), "bestApproach": string }
  ],
  "highPriorityRevisionAreas": [
    { "topic": string, "level": "Critical" | "High" | "Medium", "advice": string }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    if (!response.text) {
      throw new Error("Empty response returned from insights model.");
    }

    const data = JSON.parse(response.text.trim());
    res.json(data);

  } catch (error: any) {
    console.error("Insights generation failed:", error);
    res.status(500).json({ error: error.message || "Failed to analyze study insights." });
  }
});

// API: Grounded Study Tutor Chat (Answers ONLY based on documents, simple language)
app.post("/api/tutor-chat", checkApiKey, async (req, res) => {
  const { docContent, chatHistory, userMessage } = req.body;

  if (!docContent) {
    return res.status(400).json({ error: "A document must be uploaded and active to chat with your AI Tutor." });
  }
  if (!userMessage) {
    return res.status(400).json({ error: "User message is empty." });
  }

  try {
    const systemInstruction = `You are a warm, extremely polite, brilliant AI Academic Tutor dedicated to helping students learn challenging course content.
Your knowledge is GROUNDED STRICTLY inside the student's active uploaded document provided below.

RULES:
1. Ground your answers ONLY on the uploaded document text.
2. If the user asks about a topic not mentioned, or if facts are not present, clearly and polite state: "This topic/detail is not present in your active study document, so I cannot provide an answer to prevent errors." Give helpful guidance related to what is actually inside the document instead.
3. Use simple, friendly, student-focused language.
4. If the user asks for formulas, explain them step-by-step with simple examples.
5. Provide exam-focused answers with clear lists, simple summaries, and active testing questions.
6. Do not make up facts under any circumstances.

ACTIVE STUDY DOCUMENT CONTENT:
"""
${docContent}
"""`;

    // Package previous history cleanly for the Chat format
    // chatHistory is expected to be array of: { role: 'user' | 'model', text: string }
    const contents = [];

    if (chatHistory && Array.isArray(chatHistory)) {
      chatHistory.forEach((msg: any) => {
        contents.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.text }],
        });
      });
    }

    // Push the newest message
    contents.push({
      role: "user",
      parts: [{ text: userMessage }],
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
      },
    });

    res.json({
      success: true,
      text: response.text || "Your AI Tutor parsed the query but did not produce custom text instruction. Please clarify your study question."
    });

  } catch (error: any) {
    console.error("Tutor chat failed:", error);
    res.status(500).json({ error: error.message || "Failed to communicate with AI Study Tutor." });
  }
});

// Setup Vite Development and Production servers
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite dev server mounted as middleware.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Hosting static Production files from dist/.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Study Assistant listening securely at http://localhost:${PORT}`);
  });
}

startServer();
