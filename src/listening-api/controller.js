const express = require("express");
const fs = require("fs");
const path = require("path");

const { generateListeningAudio } = require("./service");

const router = express.Router();

const audioDir = path.join(__dirname, "audio");

if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
}

// ─── POST /generate ─────────────────────────────────────────────────────────
/**
 * Body JSON:
 * {
 *   "text": "Менің атым Айбек. Мен Алматыда тұрамын.",
 *   "voiceId": "JBFqnCBsd6RMkjVDRZzb",      // optional
 *   "modelId": "eleven_multilingual_v2",    // optional
 *   "outputFormat": "mp3_44100_128"         // optional
 * }
 *
 * Response 200:
 * {
 *   "text": "...",
 *   "filename": "listening-....mp3",
 *   "audio_url": "/api/listening-api/audio/listening-....mp3"
 * }
 */
router.post("/generate", async (req, res) => {
    try {
        console.log("POST /listening-api/generate called");

        const text = String(req.body?.text || "").trim();
        const voiceId = req.body?.voiceId ? String(req.body.voiceId).trim() : undefined;
        const modelId = req.body?.modelId ? String(req.body.modelId).trim() : undefined;
        const outputFormat = req.body?.outputFormat
            ? String(req.body.outputFormat).trim()
            : undefined;

        if (!text) {
            return res.status(400).json({
                error: "text is required",
            });
        }

        const result = await generateListeningAudio(text, {
            voiceId,
            modelId,
            outputFormat,
        });

        return res.status(200).json(result);
    } catch (error) {
        console.error("listening generate error:", error.message);
        console.error(error.stack);

        return res.status(500).json({
            error: "failed to generate listening audio",
            details: error.message,
        });
    }
});

// ─── GET /audio/:filename ───────────────────────────────────────────────────
router.get("/audio/:filename", (req, res) => {
    try {
        const filename = path.basename(req.params.filename);
        const filePath = path.join(audioDir, filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                error: "audio file not found",
            });
        }

        res.setHeader("Content-Type", "audio/mpeg");
        return res.sendFile(filePath);
    } catch (error) {
        console.error("audio serve error:", error.message);

        return res.status(500).json({
            error: "failed to serve audio",
            details: error.message,
        });
    }
});

module.exports = router;