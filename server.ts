import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // API Routes
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", hasGeminiKey: Boolean(process.env.GEMINI_API_KEY) });
  });

  // 1. Generate Article Endpoint
  app.post("/api/articles/generate", async (req: Request, res: Response) => {
    try {
      const { level = "B1", topic = "Science & Technology", category = "Science", length = "Medium", customPrompt = "" } = req.body;
      const ai = getAI();

      if (!ai) {
        return res.status(503).json({
          error: "Gemini API key is not configured. Please add GEMINI_API_KEY to continue or use the preloaded curated articles.",
        });
      }

      const wordCountTarget = length === "Short" ? "200-300" : length === "Long" ? "600-800" : "400-500";

      const systemPrompt = `You are a master English Language Teaching (ELT) expert and linguist specializing in CEFR-aligned graded reading materials for English learners.
Your goal is to write an engaging, high-quality, authentic-feeling article strictly calibrated to CEFR level: ${level}.

CEFR Level Guidelines for ${level}:
- A1: Very simple sentences, present tense predominantly, common basic words (top 800 words), short simple clauses.
- A2: Simple connected text, basic past/future tenses, everyday topics, clear connectors (and, but, because, when).
- B1: Clear standard language, familiar topics, expressions of opinion and reasons, moderate sentence complexity (subordination, relative clauses).
- B2: Complex ideas, varied vocabulary, abstract and technical concepts introduced smoothly, nuanced discourse markers (moreover, whereas, consequently).
- C1: Demanding, rich text with wide lexical range, idiomatic phrasing, subtle tone, varied syntax, implicit meanings.
- C2: Sophisticated, highly articulate, nuanced academic/literary style, precise vocabulary, complex syntactic structures.

Target Word Count: ${wordCountTarget} words.
Category: ${category}
Topic/Theme: ${topic} ${customPrompt ? `(Additional context: ${customPrompt})` : ""}

Generate:
1. Catchy title and concise subtitle.
2. The article text broken into 3 to 6 logical paragraphs.
3. 6 to 10 key target vocabulary words from the article that are especially valuable for a learner at or striving towards ${level} level. Each word MUST appear in the article text.
4. Comprehension questions:
   - 3 Multiple Choice questions testing main ideas, key facts, and inference. Each must have 4 options and detailed explanations for why the correct option is right and why others are wrong.
   - 2 True/False/Not Given questions with justification.
   - 1 Vocabulary-in-Context question testing meaning of a phrase/word as used in the passage.
   - 1 Open reflection/summary question with an exemplary answer key.
5. A 1-paragraph Cultural Note or Fun Fact related to the article topic.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: `Write the CEFR ${level} article about "${topic}". Output in strict JSON format according to the schema.`,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              subtitle: { type: Type.STRING },
              category: { type: Type.STRING },
              level: { type: Type.STRING },
              estimatedReadTimeMinutes: { type: Type.INTEGER },
              summary: { type: Type.STRING },
              paragraphs: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              targetVocabulary: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    word: { type: Type.STRING },
                    phonetic: { type: Type.STRING },
                    partOfSpeech: { type: Type.STRING },
                    definition: { type: Type.STRING },
                    cefrLevel: { type: Type.STRING },
                    exampleInArticle: { type: Type.STRING },
                    exampleUsage: { type: Type.STRING },
                    synonyms: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    collocations: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                  },
                  required: ["word", "phonetic", "partOfSpeech", "definition", "cefrLevel", "exampleUsage"],
                },
              },
              comprehensionQuestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    type: { type: Type.STRING, description: "multiple_choice | true_false | vocab_context | open_ended" },
                    question: { type: Type.STRING },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    correctAnswer: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                    hint: { type: Type.STRING },
                  },
                  required: ["id", "type", "question", "correctAnswer", "explanation"],
                },
              },
              funFact: { type: Type.STRING },
            },
            required: [
              "title",
              "subtitle",
              "category",
              "level",
              "estimatedReadTimeMinutes",
              "summary",
              "paragraphs",
              "targetVocabulary",
              "comprehensionQuestions",
            ],
          },
        },
      });

      const rawText = response.text || "{}";
      const parsed = JSON.parse(rawText);
      const fullText = (parsed.paragraphs || []).join(" ");
      const wordCount = fullText.split(/\s+/).filter(Boolean).length;

      const articlePayload = {
        id: `ai-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        ...parsed,
        wordCount,
        createdAt: new Date().toISOString(),
        isAiGenerated: true,
      };

      res.json(articlePayload);
    } catch (err: any) {
      console.error("Error generating article:", err);
      res.status(500).json({ error: err.message || "Failed to generate article" });
    }
  });

  // 2. Define / Analyze Word in Context Endpoint
  app.post("/api/vocabulary/define", async (req: Request, res: Response) => {
    try {
      const { word, sentenceContext, userLevel = "B1" } = req.body;
      const ai = getAI();

      if (!word) {
        return res.status(400).json({ error: "Word parameter is required" });
      }

      if (!ai) {
        // Simple fallback definition
        return res.json({
          word,
          phonetic: `/${word.toLowerCase()}/`,
          partOfSpeech: "noun/verb",
          definition: `Meaning of "${word}" in general context. (Connect Gemini API for rich linguistic analysis)`,
          cefrLevel: userLevel,
          exampleInContext: sentenceContext || `This is an example using the word ${word}.`,
          synonyms: ["related term"],
          collocations: ["common phrase"],
          etymology: "English origin",
        });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: `Analyze the English word/phrase "${word}" as used in this sentence context: "${sentenceContext || ""}". Target learner CEFR level: ${userLevel}.`,
        config: {
          systemInstruction: `You are an expert English dictionary and lexicographer. Provide precise contextual definition, phonetic transcription (IPA), CEFR level (A1-C2), part of speech, collocations, synonyms, easy learner-friendly explanation, and one memorable example sentence.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              word: { type: Type.STRING },
              phonetic: { type: Type.STRING },
              partOfSpeech: { type: Type.STRING },
              definition: { type: Type.STRING },
              cefrLevel: { type: Type.STRING },
              simpleExplanation: { type: Type.STRING },
              exampleInContext: { type: Type.STRING },
              synonyms: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              antonyms: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              collocations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              etymologyOrMnemonic: { type: Type.STRING },
            },
            required: ["word", "phonetic", "partOfSpeech", "definition", "cefrLevel", "simpleExplanation", "synonyms", "collocations"],
          },
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      res.json(parsed);
    } catch (err: any) {
      console.error("Error defining word:", err);
      res.status(500).json({ error: err.message || "Failed to define word" });
    }
  });

  // 3. Sentence Simplifier & Grammar Explainer Endpoint
  app.post("/api/text/simplify", async (req: Request, res: Response) => {
    try {
      const { sentence, targetLevel = "A2" } = req.body;
      const ai = getAI();

      if (!sentence) {
        return res.status(400).json({ error: "Sentence parameter is required" });
      }

      if (!ai) {
        return res.json({
          original: sentence,
          simplified: sentence,
          explanation: "AI simplification requires GEMINI_API_KEY.",
          grammarBreakdown: [],
          keyPhrases: [],
        });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: `Analyze and simplify this English sentence for a ${targetLevel} learner: "${sentence}"`,
        config: {
          systemInstruction: `You are an English language tutor. 
1. Rewrite the sentence using simpler vocabulary and sentence structure suitable for CEFR ${targetLevel}.
2. Break down the complex grammar structures (clauses, voice, idioms, prepositions).
3. Provide a clear, friendly explanation of what the sentence means in plain English.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              original: { type: Type.STRING },
              simplified: { type: Type.STRING },
              plainExplanation: { type: Type.STRING },
              grammarBreakdown: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    component: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                  },
                  required: ["component", "explanation"],
                },
              },
              keyPhrases: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    phrase: { type: Type.STRING },
                    meaning: { type: Type.STRING },
                  },
                  required: ["phrase", "meaning"],
                },
              },
            },
            required: ["original", "simplified", "plainExplanation", "grammarBreakdown"],
          },
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      res.json(parsed);
    } catch (err: any) {
      console.error("Error simplifying sentence:", err);
      res.status(500).json({ error: err.message || "Failed to simplify sentence" });
    }
  });

  // 4. Evaluate User Summary / Open Comprehension Response
  app.post("/api/comprehension/evaluate-summary", async (req: Request, res: Response) => {
    try {
      const { articleTitle, articleSummary, userWrittenResponse, promptQuestion, targetLevel = "B1" } = req.body;
      const ai = getAI();

      if (!userWrittenResponse) {
        return res.status(400).json({ error: "User written response is required" });
      }

      if (!ai) {
        return res.json({
          score: 80,
          strengths: ["You attempted a concise summary!"],
          areasForImprovement: ["Connect API key for in-depth automated grammar & comprehension evaluation."],
          grammarSuggestions: [],
          recommendedVocabulary: [],
          feedbackSummary: "Good effort summarizing the key points.",
        });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: `Article Title: "${articleTitle}"
Original Key Points: "${articleSummary}"
Prompt Question: "${promptQuestion || "Summarize the article in your own words."}"
Learner's CEFR Level: ${targetLevel}
Learner's Written Response: "${userWrittenResponse}"`,
        config: {
          systemInstruction: `You are an encouraging and pedagogical English teacher grading an ESL/EFL student's reading comprehension response.
Assess:
1. Content accuracy (Did they grasp the main ideas from the text?)
2. Grammar, sentence structure, and vocabulary precision appropriate for CEFR ${targetLevel}.
3. Give an overall score from 0 to 100.
4. Highlight 2-3 specific strengths.
5. Provide actionable improvements and grammar corrections with before/after examples.
6. Suggest 2-3 higher-level vocabulary words they could have used.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.INTEGER, description: "Score from 0 to 100" },
              comprehensionAccuracy: { type: Type.STRING, description: "Excellent | Good | Partial | Needs Review" },
              feedbackSummary: { type: Type.STRING },
              strengths: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              areasForImprovement: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              grammarSuggestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    originalPart: { type: Type.STRING },
                    improvedPart: { type: Type.STRING },
                    reason: { type: Type.STRING },
                  },
                  required: ["originalPart", "improvedPart", "reason"],
                },
              },
              recommendedVocabulary: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    word: { type: Type.STRING },
                    howToUse: { type: Type.STRING },
                  },
                  required: ["word", "howToUse"],
                },
              },
            },
            required: ["score", "comprehensionAccuracy", "feedbackSummary", "strengths", "areasForImprovement", "grammarSuggestions"],
          },
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      res.json(parsed);
    } catch (err: any) {
      console.error("Error evaluating summary:", err);
      res.status(500).json({ error: err.message || "Failed to evaluate summary" });
    }
  });

  // 5. Diagnostic Placement Assessment
  app.post("/api/assessment/generate", async (req: Request, res: Response) => {
    try {
      const ai = getAI();
      if (!ai) {
        return res.status(503).json({ error: "Gemini API key required for dynamic placement test generation." });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: "Generate a 6-question CEFR placement diagnostic test containing 1 question per level from A1 to C2. Each question should test vocabulary, reading nuance, or grammar understanding appropriate for that level.",
        config: {
          systemInstruction: "You are an official CEFR testing specialist. Create 6 distinct multiple-choice questions graduated from A1, A2, B1, B2, C1, to C2.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    level: { type: Type.STRING },
                    passageOrPrompt: { type: Type.STRING },
                    question: { type: Type.STRING },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    correctIndex: { type: Type.INTEGER },
                    explanation: { type: Type.STRING },
                  },
                  required: ["id", "level", "passageOrPrompt", "question", "options", "correctIndex", "explanation"],
                },
              },
            },
            required: ["questions"],
          },
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      res.json(parsed);
    } catch (err: any) {
      console.error("Error generating assessment:", err);
      res.status(500).json({ error: err.message || "Failed to generate assessment" });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`LexiPulse Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
