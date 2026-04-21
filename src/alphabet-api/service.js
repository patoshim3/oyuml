const fs = require("fs");
const OpenAI = require("openai");

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const KAZAKH_LETTERS = [
    "а","ә","б","в","г","ғ","д","е","ё","ж","з","и","й","к","қ","л",
    "м","н","ң","о","ө","п","р","с","т","у","ұ","ү","ф","х","һ","ц",
    "ч","ш","щ","ъ","ы","і","ь","э","ю","я"
];

function safeParseJson(text) {
    try {
        return JSON.parse(text);
    } catch (e) {
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

async function predictLetterFromAudio(wavPath) {
    const audioBuffer = fs.readFileSync(wavPath);
    const base64Audio = audioBuffer.toString("base64");

    const completion = await openai.chat.completions.create({
        model: "gpt-audio-mini",
        messages: [
            {
                role: "developer",
                content: `
You are a Kazakh alphabet audio classifier.

The user says exactly one single Kazakh letter.

Return JSON only:
{
  "predicted_letter": "ә",
  "confidence": 0.91
}

Allowed letters:
${KAZAKH_LETTERS.join(", ")}

Rules:
- return exactly one letter from the allowed list
- no explanation
- JSON only
- confidence must be from 0 to 1
        `.trim()
            },
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: "Predict the Kazakh letter from this audio."
                    },
                    {
                        type: "input_audio",
                        input_audio: {
                            data: base64Audio,
                            format: "wav"
                        }
                    }
                ]
            }
        ],
        temperature: 0
    });

    const rawText = completion?.choices?.[0]?.message?.content || "";
    const parsed = safeParseJson(rawText);

    if (!parsed || !parsed.predicted_letter) {
        return {
            predicted_letter: null,
            confidence: 0
        };
    }

    return {
        predicted_letter: String(parsed.predicted_letter).trim().toLowerCase(),
        confidence: Number(parsed.confidence) || 0
    };
}

module.exports = {
    predictLetterFromAudio
};