const fs = require("fs");
const OpenAI = require("openai");

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
}

const openai = new OpenAI({ apiKey });

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-audio-preview";

// ─── helpers ────────────────────────────────────────────────────────────────

function safeParseJson(text) {
    if (!text) return null;

    if (typeof text !== "string") {
        try {
            return JSON.parse(JSON.stringify(text));
        } catch (_) {
            return null;
        }
    }

    try {
        return JSON.parse(text);
    } catch (_) {
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
            try {
                return JSON.parse(match[0]);
            } catch (_) {
                return null;
            }
        }
        return null;
    }
}

function clampScore(value, min = 0, max = 10) {
    const num = Number(value);
    if (!Number.isFinite(num)) return 0;
    return Math.min(max, Math.max(min, Math.round(num * 10) / 10));
}

// пересчет overall_score (чтобы не доверять модели полностью)
function calculateOverall(scores) {
    if (!scores) return 0;

    return clampScore(
        scores.fluency * 0.25 +
        scores.pronunciation * 0.20 +
        scores.grammar * 0.20 +
        scores.vocabulary * 0.20 +
        scores.coherence * 0.15
    );
}

/**
 * Evaluates a spoken conversational response in audio.
 */
async function evaluateSpeaking(wavPath, topic = "", language = "en") {
    if (!wavPath) throw new Error("wavPath is required");
    if (!fs.existsSync(wavPath)) throw new Error(`Audio file not found: ${wavPath}`);

    const audioBuffer = fs.readFileSync(wavPath);
    const base64Audio = audioBuffer.toString("base64");

    // ─── language configs ────────────────────────────────────────────────

    const languageInstructions = {
        en: "The user is speaking in Kazakh. Evaluate their Kazakh speaking skills.",
        ru: "Пользователь говорит на казахском языке. Оцени его разговорные навыки казахского.",
        kk: "Пайдаланушы қазақ тілінде сөйлеп жатыр. Оның қазақша сөйлеу дағдыларын бағала.",
    };

    const outputLanguageInstructions = {
        en: "Write all feedback in English.",
        ru: "Write all feedback in Russian.",
        kk: "Барлық жауапты тек қазақ тілінде жаз. Орыс немесе ағылшын тілін қолданба.",
    };

    const langInstruction =
        languageInstructions[language] || languageInstructions["en"];

    const outputLangInstruction =
        outputLanguageInstructions[language] || outputLanguageInstructions["en"];

    const topicLine = topic
        ? `The topic/question the user was responding to: "${topic}"`
        : "";

    // ─── PROMPT ─────────────────────────────────────────────────────────

    const systemPrompt = `
You are an expert language speaking coach and evaluator.

    ${langInstruction}
${outputLangInstruction}
${topicLine}

Listen to the audio and evaluate the user's spoken response in Kazakh.

IMPORTANT:
    - If the speech is NOT mostly in Kazakh, mention it in summary and give lower scores.
- Be strict but fair.
- Focus on real speaking ability, not perfection.

    Return ONLY valid JSON:
{
    "transcript": "exact transcription",
    "overall_score": 7.5,
    "scores": {
    "fluency": 8.0,
        "pronunciation": 7.0,
        "grammar": 7.5,
        "vocabulary": 8.0,
        "coherence": 7.0
},
    "corrections": [
    {
        "original": "Мен кеше мектепке барамын",
        "corrected": "Мен кеше мектепке бардым",
        "explanation": "Өткен шақ қолданылуы керек"
    }
],
    "tips": ["..."],
    "strengths": ["..."],
    "summary": "..."
}

SCORING RULES:
    - fluency: smoothness, pauses, natural flow
- pronunciation: clarity, accent, sounds
- grammar: correctness of sentence structure
- vocabulary: richness and correctness
- coherence: logical structure

corrections:
    - only real mistakes
- max 5

tips:
    - 2–4 actionable tips

strengths:
    - 1–3 positives

summary:
    - 2–3 sentences
- encouraging tone

Return JSON only. No text outside JSON.
    `.trim();

    // ─── OpenAI call ────────────────────────────────────────────────────

    const completion = await openai.chat.completions.create({
        model: MODEL,
        temperature: 0,
        messages: [
            {
                role: "developer",
                content: systemPrompt,
            },
            {
                role: "user",
                content: [
                    { type: "text", text: "Evaluate my speech." },
                    {
                        type: "input_audio",
                        input_audio: {
                            data: base64Audio,
                            format: "wav",
                        },
                    },
                ],
            },
        ],
    });

    const message = completion?.choices?.[0]?.message;
    const rawContent = message?.content;

    let rawText = "";

    if (typeof rawContent === "string") {
        rawText = rawContent;
    } else if (Array.isArray(rawContent)) {
        rawText = rawContent
            .map((item) => {
                if (typeof item === "string") return item;
                if (item?.type === "text" && item?.text) return item.text;
                return "";
            })
            .join("\n")
            .trim();
    }

    const parsed = safeParseJson(rawText);

    if (!parsed) {
        return buildFallbackResult("Could not parse model response.");
    }

    const scores = {
        fluency:       clampScore(parsed.scores?.fluency),
        pronunciation: clampScore(parsed.scores?.pronunciation),
        grammar:       clampScore(parsed.scores?.grammar),
        vocabulary:    clampScore(parsed.scores?.vocabulary),
        coherence:     clampScore(parsed.scores?.coherence),
    };

    return {
        transcript: String(parsed.transcript || ""),
        overall_score: calculateOverall(scores), // ✅ теперь считаем сами
        scores,
        corrections: Array.isArray(parsed.corrections)
            ? parsed.corrections.slice(0, 5).map((c) => ({
                original:    String(c.original || ""),
                corrected:   String(c.corrected || ""),
                explanation: String(c.explanation || ""),
            }))
            : [],
        tips:      Array.isArray(parsed.tips)      ? parsed.tips.map(String)      : [],
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(String) : [],
        summary:   String(parsed.summary || ""),
    };
}

// ─── fallback ───────────────────────────────────────────────────────────────

function buildFallbackResult(reason) {
    return {
        transcript: "",
        overall_score: 0,
        scores: {
            fluency: 0,
            pronunciation: 0,
            grammar: 0,
            vocabulary: 0,
            coherence: 0,
        },
        corrections: [],
        tips: [],
        strengths: [],
        summary: reason,
    };
}

module.exports = { evaluateSpeaking };