const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const { predictLetterFromAudio } = require("./service");

const router = express.Router();

const ffmpegPath = process.env.FFMPEG_PATH || "ffmpeg";

const uploadsDir = path.join(__dirname, "uploads");
const tempDir = path.join(__dirname, "temp");

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

const upload = multer({
    dest: uploadsDir,
    limits: {
        fileSize: 20 * 1024 * 1024
    }
});

function convertToWav(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        const ffmpeg = spawn(ffmpegPath, [
            "-y",
            "-i",
            inputPath,
            "-ac",
            "1",
            "-ar",
            "16000",
            outputPath
        ]);

        let stderr = "";
        let stdout = "";

        ffmpeg.stdout.on("data", (data) => {
            stdout += data.toString();
        });

        ffmpeg.stderr.on("data", (data) => {
            stderr += data.toString();
        });

        ffmpeg.on("error", (error) => {
            reject(new Error(`ffmpeg spawn error: ${error.message}`));
        });

        ffmpeg.on("close", (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(
                    new Error(
                        stderr || stdout || `ffmpeg conversion failed with code ${code}`
                    )
                );
            }
        });
    });
}

router.post("/predict-letter", upload.single("audio"), async (req, res) => {
    let inputPath = null;
    let outputPath = null;

    try {
        console.log("POST /predict-letter called");

        if (!req.file) {
            return res.status(400).json({
                error: "audio file is required"
            });
        }

        console.log("uploaded file info:", {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            path: req.file.path
        });

        inputPath = req.file.path;
        outputPath = path.join(
            tempDir,
            `${Date.now()}-${req.file.filename}.wav`
        );

        console.log("starting ffmpeg conversion...");
        await convertToWav(inputPath, outputPath);
        console.log("ffmpeg conversion completed:", outputPath);

        if (!fs.existsSync(outputPath)) {
            throw new Error("converted wav file was not created");
        }

        const stats = fs.statSync(outputPath);
        console.log("converted wav file stats:", {
            size: stats.size,
            path: outputPath
        });

        if (stats.size === 0) {
            throw new Error("converted wav file is empty");
        }

        console.log("calling predictLetterFromAudio...");
        const result = await predictLetterFromAudio(outputPath);
        console.log("prediction result:", result);

        return res.status(200).json(result);
    } catch (error) {
        console.error("predict-letter error:", error.message);
        console.error(error.stack);

        return res.status(500).json({
            error: "failed to predict letter",
            details: error.message
        });
    } finally {
        try {
            if (inputPath && fs.existsSync(inputPath)) {
                fs.unlinkSync(inputPath);
                console.log("deleted input file:", inputPath);
            }

            if (outputPath && fs.existsSync(outputPath)) {
                fs.unlinkSync(outputPath);
                console.log("deleted output file:", outputPath);
            }
        } catch (cleanupError) {
            console.error("cleanup error:", cleanupError.message);
        }
    }
});

module.exports = router;