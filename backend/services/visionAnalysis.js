const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const fs = require('fs').promises;

class VisionAnalysis {
    constructor() {
        this.wordleColors = {
            green: [106, 170, 100],
            yellow: [201, 180, 88],
            gray: [120, 124, 126]
        };
    }

    async analyzeWordleImage(imagePath) {
        try {
            const processedImage = await this.preprocessImage(imagePath);
            const ocrResult = await this.performOCR(processedImage);
            const gameState = await this.extractGameState(imagePath, ocrResult);
            const suggestions = this.generateSuggestions(gameState);

            await fs.unlink(imagePath);

            return {
                letters: gameState.letters,
                colors: gameState.colors,
                suggestions: suggestions,
                confidence: ocrResult.confidence
            };
        } catch (error) {
            console.error('Vision analysis error:', error);
            throw new Error(`Image analysis failed: ${error.message}`);
        }
    }

    async preprocessImage(imagePath) {
        const processedPath = imagePath.replace(/\.[^/.]+$/, '_processed.png');

        await sharp(imagePath)
            .resize(800, 600, { fit: 'inside' })
            .greyscale()
            .normalize()
            .sharpen()
            .png()
            .toFile(processedPath);

        return processedPath;
    }

    async performOCR(imagePath) {
        const result = await Tesseract.recognize(imagePath, 'eng', {
            logger: m => console.log(m)
        });

        await fs.unlink(imagePath);

        return {
            text: result.data.text,
            confidence: result.data.confidence
        };
    }

    async extractGameState(imagePath, ocrResult) {
        const gameState = {
            letters: [],
            colors: [],
            rows: []
        };

        const text = ocrResult.text.toUpperCase().replace(/[^A-Z]/g, '');

        for (let i = 0; i < Math.min(text.length, 30); i += 5) {
            const row = text.substring(i, i + 5);
            if (row.length === 5) {
                gameState.rows.push(row);
                gameState.letters.push(...row.split(''));
                gameState.colors.push(...Array(5).fill('unknown'));
            }
        }

        return gameState;
    }

    generateSuggestions(gameState) {
        const commonWords = [
            'ADIEU', 'AUDIO', 'ARISE', 'SLATE', 'CRANE', 'STARE', 'ROATE', 'SOARE',
            'RAISE', 'TRACE', 'TALES', 'LEAST', 'STEAM', 'STEAL', 'TEARS', 'RATES',
            'STALE', 'ALERT', 'ALTER', 'LATER', 'HEART', 'EARTH', 'HATER', 'DREAM'
        ];

        return commonWords.slice(0, 10);
    }
}

module.exports = new VisionAnalysis();