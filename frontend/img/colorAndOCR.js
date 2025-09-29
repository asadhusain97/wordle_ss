/**
 * Color classification and OCR for Wordle tiles
 * Handles tile color detection and letter recognition
 */

import { sliceTiles } from './warpAndTiles.js';

/**
 * Custom error for when grid tiles cannot be read properly
 */
export class GridUnreadableError extends Error {
    constructor(message = 'Grid tiles are unreadable or corrupted') {
        super(message);
        this.name = 'GridUnreadableError';
    }
}

// Reference HSV centroids (tunable)
const REF = {
    green:  { h: 100, s: 45, v: 60 }, // tuned to Wordle-like green
    yellow: { h: 55,  s: 45, v: 80 },
    gray:   { h: 0,   s: 0,  v: 50 }  // neutral
};

/**
 * Helper: convert tile to HSV and compute mean
 * @param {cv.Mat} tileMat - Input tile matrix
 * @returns {{h: number, s: number, v: number}} Mean HSV values
 */
function meanHSV(tileMat) {
    let hsvMat;

    try {
        // rgba->hsv
        hsvMat = new cv.Mat();
        cv.cvtColor(tileMat, hsvMat, cv.COLOR_RGBA2RGB);
        cv.cvtColor(hsvMat, hsvMat, cv.COLOR_RGB2HSV);

        // cv.mean, return {h,s,v}
        const meanScalar = cv.mean(hsvMat);
        return {
            h: meanScalar[0],
            s: meanScalar[1],
            v: meanScalar[2]
        };
    } finally {
        if (hsvMat) hsvMat.delete();
    }
}

/**
 * Simple nearest-centroid in HSV with weights
 * @param {cv.Mat} tileMat - Tile image matrix
 * @returns {'green'|'yellow'|'gray'} Classified color
 */
export function classifyTileColor(tileMat) {
    try {
        const tileHSV = meanHSV(tileMat);
        console.log('[COLOR] 🔄 Classifying tile color...', {
            HSV: `H:${Math.round(tileHSV.h)} S:${Math.round(tileHSV.s)} V:${Math.round(tileHSV.v)}`,
            tileSize: `${tileMat.cols}x${tileMat.rows}`
        });

        let closestColor = 'gray';
        let minDistance = Infinity;
        const distances = {};

        // Simple nearest-centroid classification
        for (const [colorName, centroid] of Object.entries(REF)) {
            // Weighted Euclidean distance
            const hDiff = Math.abs(tileHSV.h - centroid.h);
            const sDiff = Math.abs(tileHSV.s - centroid.s);
            const vDiff = Math.abs(tileHSV.v - centroid.v);

            const distance = Math.sqrt(hDiff * hDiff + sDiff * sDiff + vDiff * vDiff);
            distances[colorName] = Math.round(distance);

            if (distance < minDistance) {
                minDistance = distance;
                closestColor = colorName;
            }
        }

        console.log('[COLOR] ✅ Color classified', {
            result: closestColor,
            distances,
            confidence: Math.round((1 / (minDistance + 1)) * 100) + '%'
        });

        return closestColor;

    } catch (error) {
        console.error('[COLOR] ❌ Color classification failed:', error.message);
        return 'gray';
    }
}

/**
 * OCR across tiles with a single worker
 * @param {cv.Mat[]} tiles - Array of tile matrices
 * @returns {Promise<(string|null)[]>} Array of recognized letters (null for empty/unreadable tiles)
 */
export async function ocrTileLetters(tiles) {
    console.log('[OCR] 🔄 Starting OCR processing...', {
        totalTiles: tiles.length
    });

    const { createWorker, PSM } = Tesseract;

    console.log('[OCR] 🎯 Initializing Tesseract worker...');
    const worker = await createWorker({ logger: null });

    try {
        await worker.loadLanguage('eng');
        console.log('[OCR] ✅ Language loaded');

        await worker.initialize('eng');
        console.log('[OCR] ✅ Worker initialized');

        await worker.setParameters({
            tessedit_pageseg_mode: PSM.SINGLE_CHAR,
            tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        });
        console.log('[OCR] ✅ Parameters configured for single character recognition');

        const results = [];
        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < tiles.length; i++) {
            const tile = tiles[i];
            let gray, thresh, inverted;

            try {
                console.log(`[OCR] 🎯 Processing tile ${i + 1}/${tiles.length}...`);

                // Preprocess: gray -> adaptive threshold -> invert to enhance glyphs
                gray = new cv.Mat();
                cv.cvtColor(tile, gray, cv.COLOR_RGBA2GRAY);

                thresh = new cv.Mat();
                cv.adaptiveThreshold(gray, thresh, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 11, 2);

                inverted = new cv.Mat();
                cv.bitwise_not(thresh, inverted);

                console.log(`[OCR] 📸 Preprocessing completed for tile ${i + 1}`);

                // Pass canvas/ImageData to worker.recognize
                const canvas = document.createElement('canvas');
                canvas.width = inverted.cols;
                canvas.height = inverted.rows;
                const ctx = canvas.getContext('2d');

                const imageData = ctx.createImageData(canvas.width, canvas.height);
                const data = imageData.data;
                for (let j = 0; j < inverted.data.length; j++) {
                    data[j * 4] = inverted.data[j];     // R
                    data[j * 4 + 1] = inverted.data[j]; // G
                    data[j * 4 + 2] = inverted.data[j]; // B
                    data[j * 4 + 3] = 255;              // A
                }

                const { data: { text, confidence } } = await worker.recognize(imageData);

                // If low confidence or empty, treat as null
                const cleanText = text.trim().toUpperCase().replace(/[^A-Z]/g, '');

                if (cleanText.length === 1 && confidence > 30) {
                    console.log(`[OCR] ✅ Tile ${i + 1} recognized: "${cleanText}" (confidence: ${Math.round(confidence)}%)`);
                    results.push(cleanText);
                    successCount++;
                } else {
                    console.log(`[OCR] ❌ Tile ${i + 1} not recognized: text="${text}", clean="${cleanText}", confidence=${Math.round(confidence)}%`);
                    results.push(null);
                    failCount++;
                }

            } catch (error) {
                console.error(`[OCR] ❌ Error processing tile ${i + 1}:`, error.message);
                results.push(null);
                failCount++;
            } finally {
                if (gray) gray.delete();
                if (thresh) thresh.delete();
                if (inverted) inverted.delete();
            }
        }

        console.log('[OCR] ✅ OCR processing completed', {
            totalTiles: tiles.length,
            successCount,
            failCount,
            successRate: Math.round((successCount / tiles.length) * 100) + '%'
        });

        return results; // array of length tiles.length with uppercase letters or null

    } finally {
        console.log('[OCR] 🧹 Terminating Tesseract worker...');
        await worker.terminate();
        console.log('[OCR] ✅ Worker cleanup completed');
    }
}

/**
 * Compose grid objects
 * @param {cv.Mat} gridMat - Warped grid matrix
 * @returns {Promise<Array<{row: number, col: number, letter: string|null, color: string}>>} Grid data
 */
export async function extractGridData(gridMat) {
    console.log('[EXTRACT] 🔄 Starting grid data extraction...', {
        gridSize: `${gridMat.cols}x${gridMat.rows}`
    });

    let tiles;

    try {
        // sliceTiles -> classifyTileColor per tile -> ocrTileLetters
        console.log('[EXTRACT] 🎯 Step 1: Slicing grid into tiles');
        tiles = sliceTiles(gridMat, 6, 5);

        console.log('[EXTRACT] 🎯 Step 2: Classifying tile colors');
        const colors = tiles.map((tile, index) => {
            const color = classifyTileColor(tile);
            console.log(`[EXTRACT] 🎨 Tile ${index + 1}: ${color}`);
            return color;
        });

        console.log('[EXTRACT] 🎯 Step 3: Performing OCR on tiles');
        const letters = await ocrTileLetters(tiles);

        // Build [{row, col, letter, color}] with 6x5 shape
        console.log('[EXTRACT] 🎯 Step 4: Building grid structure');
        const grid = [];
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 5; col++) {
                const index = row * 5 + col;
                const gridItem = {
                    row,
                    col,
                    letter: letters[index],
                    color: colors[index]
                };
                grid.push(gridItem);

                if (gridItem.letter || gridItem.color !== 'gray') {
                    console.log(`[EXTRACT] 📍 Cell [${row},${col}]: "${gridItem.letter || 'null'}" (${gridItem.color})`);
                }
            }
        }

        // Validation and statistics
        const nonGrayTiles = grid.filter(item => item.color !== 'gray');
        const nullLettersInNonGray = nonGrayTiles.filter(item => item.letter === null).length;
        const filledCells = grid.filter(item => item.letter).length;

        console.log('[EXTRACT] 📊 Grid analysis:', {
            totalCells: grid.length,
            filledCells,
            nonGrayTiles: nonGrayTiles.length,
            nullLettersInNonGray,
            colorDistribution: colors.reduce((acc, color) => {
                acc[color] = (acc[color] || 0) + 1;
                return acc;
            }, {})
        });

        // Throw GridUnreadableError if too many null letters on non-gray tiles
        if (nonGrayTiles.length > 0 && nullLettersInNonGray / nonGrayTiles.length > 0.5) {
            const errorMsg = `Too many unreadable letters in non-gray tiles: ${nullLettersInNonGray}/${nonGrayTiles.length}`;
            console.error('[EXTRACT] ❌ Grid validation failed:', errorMsg);
            throw new GridUnreadableError(errorMsg);
        }

        console.log('[EXTRACT] ✅ Grid extraction completed successfully', {
            extractedItems: grid.length,
            readableRate: nonGrayTiles.length > 0 ?
                Math.round(((nonGrayTiles.length - nullLettersInNonGray) / nonGrayTiles.length) * 100) + '%' :
                'N/A'
        });

        return grid;

    } finally {
        // Clean up tiles
        if (tiles) {
            tiles.forEach(tile => {
                if (tile && typeof tile.delete === 'function') {
                    tile.delete();
                }
            });
        }
    }
}