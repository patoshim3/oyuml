const fs = require("fs");
const path = require("path");
const { ElevenLabsClient } = require("@elevenlabs/elevenlabs-js");

const apiKey = process.env.ELEVENLABS_API_KEY;

if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is not set");
}

const elevenlabs = new ElevenLabsClient({
    apiKey,
});

const DEFAULT_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "JBFqnCBsd6RMkjVDRZzb";
const DEFAULT_MODEL_ID = process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2";
const DEFAULT_OUTPUT_FORMAT = process.env.ELEVENLABS_OUTPUT_FORMAT || "mp3_44100_128";

const audioDir = path.join(__dirname, "audio");

if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
}

function safeFileName() {
    return `listening-${Date.now()}-${Math.random().toString(36).slice(2)}.mp3`;
}

async function streamToBuffer(stream) {
    const chunks = [];

    for await (const chunk of stream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    return Buffer.concat(chunks);
}

/**
 * Generates listening audio from text.
 *
 * @param {string} text
 * @param {object} options
 * @returns {Promise<{ audio_url: string, filename: string, text: string }>}
 */
async function generateListeningAudio(text, options = {}) {
    if (!text || !String(text).trim()) {
        throw new Error("text is required");
    }

    const cleanText = String(text).trim();

    if (cleanText.length > 5000) {
        throw new Error("text is too long. Max length is 5000 characters");
    }

    const voiceId = options.voiceId || DEFAULT_VOICE_ID;
    const modelId = options.modelId || DEFAULT_MODEL_ID;
    const outputFormat = options.outputFormat || DEFAULT_OUTPUT_FORMAT;

    const audioStream = await elevenlabs.textToSpeech.convert(voiceId, {
        text: cleanText,
        modelId,
        outputFormat,
    });

    const audioBuffer = await streamToBuffer(audioStream);

    if (!audioBuffer.length) {
        throw new Error("generated audio is empty");
    }

    const filename = safeFileName();
    const filePath = path.join(audioDir, filename);

    fs.writeFileSync(filePath, audioBuffer);

    return {
        text: cleanText,
        filename,
        audio_url: `/api/listening-api/audio/${filename}`,
    };
}

module.exports = {
    generateListeningAudio,
};