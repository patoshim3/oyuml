const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const ffmpegPath = "ffmpeg";

const { predictLetterFromAudio } = require("./service");

const router = express.Router();

const uploadsDir = path.join(__dirname, "uploads");
const tempDir = path.join(__dirname, "temp");

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

const upload = multer({ dest: uploadsDir });

function convertToWav(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        const ffmpeg = spawn(ffmpegPath, [
            "-y",
            "-i", inputPath,
            "-ac", "1",
            "-ar", "16000",
            outputPath
        ]);

        let stderr = "";

        ffmpeg.stderr.on("data", (data) => {
            stderr += data.toString();
        });

        ffmpeg.on("close", (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(stderr || "ffmpeg conversion failed"));
            }
        });
    });
}

router.post("/predict-letter", upload.single("audio"), async (req, res) => {
    let inputPath = null;
    let outputPath = null;

    try {
        if (!req.file) {
            return res.status(400).json({ error: "audio file is required" });
        }

        inputPath = req.file.path;
        outputPath = path.join(tempDir, `${Date.now()}-${req.file.filename}.wav`);

        await convertToWav(inputPath, outputPath);

        const result = await predictLetterFromAudio(outputPath);

        return res.json(result);
    } catch (error) {
        console.error("predict-letter error:", error);
        return res.status(500).json({
            error: "failed to predict letter"
        });
    } finally {
        try {
            if (inputPath && fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
            if (outputPath && fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        } catch (e) {
            console.error("cleanup error:", e);
        }
    }
});

module.exports = router;