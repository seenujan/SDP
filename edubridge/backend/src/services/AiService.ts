import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';
// pdf-parse v1.1.1 — exports a direct callable function

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Models to try in order — exact names confirmed available for this API project
// gemini-2.5-flash is newest with best free-tier; fallbacks use versioned names
const MODEL_FALLBACK_CHAIN = [
    'gemini-2.5-flash',          // newest, best free-tier quota
    'gemini-2.0-flash-lite',     // versioned lite
    'gemini-2.0-flash-lite-001', // specific version
    'gemini-2.0-flash',          // standard flash
    'gemini-2.0-flash-001',      // specific version fallback
];

/**
 * Retries an async function with exponential backoff.
 * @param fn - The async function to retry
 * @param retries - Number of retries
 * @param delayMs - Initial delay in ms
 */
async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    retries = 3,
    delayMs = 5000
): Promise<T> {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await fn();
        } catch (err: any) {
            const isRateLimit =
                err?.status === 429 ||
                err?.message?.includes('429') ||
                err?.message?.includes('quota') ||
                err?.message?.includes('Too Many Requests') ||
                err?.message?.includes('RESOURCE_EXHAUSTED');

            if (isRateLimit && attempt < retries) {
                const waitMs = delayMs * Math.pow(2, attempt); // exponential backoff
                console.warn(`[AiService] Rate limit hit. Retrying in ${waitMs / 1000}s... (attempt ${attempt + 1}/${retries})`);
                await new Promise(res => setTimeout(res, waitMs));
            } else {
                throw err;
            }
        }
    }
    throw new Error('Max retries exceeded');
}

export interface ExtractedQuestion {
    question_text: string;
    question_type: 'multiple_choice' | 'true_false' | 'short_answer';
    options: string[];
    correct_answer: string;
    difficulty_level: 'easy' | 'medium' | 'hard';
    marks: number;
    topic?: string;
}

export class AiService {
    /**
     * Extracts raw text from an uploaded file.
     * Supports PDF, TXT, PPT/PPTX (text extraction from PPTX via reading XML inside zip).
     */
    async extractTextFromFile(filePath: string, originalName: string): Promise<string> {
        const ext = path.extname(originalName).toLowerCase();

        if (ext === '.pdf') {
            const dataBuffer = fs.readFileSync(filePath);
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const pdfParse = require('pdf-parse');
            const data = await pdfParse(dataBuffer);
            return data.text;
        }

        if (ext === '.txt') {
            return fs.readFileSync(filePath, 'utf-8');
        }

        if (ext === '.pptx') {
            // PPTX is a ZIP. Extract slide XML text using basic pattern matching
            const JSZip = require('jszip');
            const zip = new JSZip();
            const content = fs.readFileSync(filePath);
            const loaded = await zip.loadAsync(content);
            let text = '';

            const slideFiles = Object.keys(loaded.files).filter(f => f.match(/ppt\/slides\/slide\d+\.xml/));
            for (const slideFile of slideFiles) {
                const slideXml = await loaded.files[slideFile].async('string');
                // Extract text from <a:t> tags
                const matches = slideXml.match(/<a:t>([^<]+)<\/a:t>/g) || [];
                text += matches.map((m: string) => m.replace(/<[^>]+>/g, '')).join(' ') + '\n';
            }
            return text;
        }

        throw new Error(`Unsupported file type: ${ext}. Please upload a PDF, PPT/PPTX, or TXT file.`);
    }

    /**
     * Sends extracted text to Gemini API and returns structured questions.
     */
    async generateQuestionsFromText(
        text: string,
        instructions: string
    ): Promise<ExtractedQuestion[]> {
        const prompt = `You are an expert teacher creating exam questions from lesson content.

Teacher's instructions: ${instructions}

Lesson content:
${text.substring(0, 15000)} 

Based on the above lesson content and the teacher's instructions, generate exam questions.

IMPORTANT: Return ONLY a valid JSON array. No markdown, no explanation, just raw JSON.

Each question object must have these exact fields:
- "question_text": string (the question)
- "question_type": one of "multiple_choice", "true_false", "short_answer"
- "options": array of 4 strings for multiple_choice, ["True", "False"] for true_false, [] for short_answer
- "correct_answer": string (must exactly match one of the options for MCQ/T-F)
- "difficulty_level": one of "easy", "medium", "hard"
- "marks": integer between 1 and 5
- "topic": string (brief topic/chapter name this question covers)

Example format:
[
  {
    "question_text": "What is photosynthesis?",
    "question_type": "multiple_choice",
    "options": ["Process of making food using sunlight", "Process of breathing", "Process of digestion", "Process of respiration"],
    "correct_answer": "Process of making food using sunlight",
    "difficulty_level": "easy",
    "marks": 1,
    "topic": "Plant Biology"
  }
]`;

        // Try each model in the fallback chain
        let lastError: any = null;
        for (const modelName of MODEL_FALLBACK_CHAIN) {
            try {
                console.log(`[AiService] Trying model: ${modelName}`);
                const model = genAI.getGenerativeModel({ model: modelName });

                const result = await retryWithBackoff(() => model.generateContent(prompt), 2, 3000);
                const responseText = result.response.text().trim();

                // Strip markdown code fences if present
                const cleaned = responseText
                    .replace(/^```json\s*/i, '')
                    .replace(/^```\s*/i, '')
                    .replace(/\s*```$/i, '')
                    .trim();

                const questions: ExtractedQuestion[] = JSON.parse(cleaned);

                // Validate and sanitize output
                return questions
                    .filter(q => q.question_text && q.question_type && q.correct_answer)
                    .map(q => ({
                        question_text: q.question_text,
                        question_type: q.question_type,
                        options: Array.isArray(q.options) ? q.options : [],
                        correct_answer: q.correct_answer,
                        difficulty_level: q.difficulty_level || 'medium',
                        marks: Number(q.marks) || 1,
                        topic: q.topic || '',
                    }));
            } catch (error: any) {
                lastError = error;
                const isSkippableError =
                    // 429 quota/rate limit
                    error?.status === 429 ||
                    error?.message?.includes('429') ||
                    error?.message?.includes('quota') ||
                    error?.message?.includes('Too Many Requests') ||
                    error?.message?.includes('RESOURCE_EXHAUSTED') ||
                    // 404 model not found / not supported
                    error?.status === 404 ||
                    error?.message?.includes('404') ||
                    error?.message?.includes('not found') ||
                    error?.message?.includes('not supported') ||
                    error?.message?.includes('is not found for API version');

                if (isSkippableError) {
                    console.warn(`[AiService] Model ${modelName} unavailable (${error?.status || 'error'}), trying next model...`);
                    continue; // try next model
                }

                // Non-skippable error — don't try other models
                console.error('[AiService] Gemini error:', error);
                throw new Error('AI extraction failed: ' + (error.message || 'Unknown error'));
            }
        }

        // All models exhausted
        console.error('[AiService] All models exhausted. Last error:', lastError);
        throw new Error(
            'AI service is temporarily unavailable due to API quota limits. ' +
            'Please wait a few minutes and try again, or contact the administrator to upgrade the API plan.'
        );
    }
}

export const aiService = new AiService();
