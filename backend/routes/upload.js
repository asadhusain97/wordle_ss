const express = require('express');
const multer = require('multer');
const path = require('path');
const visionAnalysis = require('../services/visionAnalysis');

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../assets/uploads'));
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage });

router.post('/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file uploaded' });
        }

        const imagePath = req.file.path;
        const analysis = await visionAnalysis.analyzeWordleImage(imagePath);

        res.json({
            success: true,
            analysis: analysis,
            suggestions: analysis.suggestions || []
        });
    } catch (error) {
        console.error('Upload analysis error:', error);
        res.status(500).json({
            error: 'Failed to analyze image',
            details: error.message
        });
    }
});

module.exports = router;