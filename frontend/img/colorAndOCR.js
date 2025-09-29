/**
 * Color classification and OCR for Wordle tiles
 * Handles tile color detection and letter recognition
 */

import { sliceTiles } from './warpAndTiles.js';

/**
 * Helper function to display a canvas on the page temporarily for debugging
 * @param {HTMLCanvasElement} canvas - Canvas to display
 * @param {string} label - Label for the debug image
 * @param {number} duration - Duration to display in milliseconds
 * @returns {Promise} Promise that resolves when display time is complete
 */
function displayDebugCanvas(canvas, label, duration = 3000) {
    return new Promise((resolve) => {
        // Create container div
        const container = document.createElement('div');
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0,0,0,0.8);
            padding: 10px;
            border-radius: 8px;
            color: white;
            font-family: monospace;
            font-size: 12px;
            z-index: 10000;
            max-width: 300px;
        `;

        // Add label
        const labelDiv = document.createElement('div');
        labelDiv.textContent = label;
        labelDiv.style.cssText = `
            margin-bottom: 5px;
            font-weight: bold;
            text-align: center;
        `;
        container.appendChild(labelDiv);

        // Style the canvas for display
        const displayCanvas = canvas.cloneNode();
        const ctx = displayCanvas.getContext('2d');
        ctx.drawImage(canvas, 0, 0);

        displayCanvas.style.cssText = `
            max-width: 280px;
            max-height: 280px;
            border: 1px solid #ccc;
            background: white;
        `;
        container.appendChild(displayCanvas);

        // Add to page
        document.body.appendChild(container);

        // Remove after duration
        setTimeout(() => {
            if (container.parentNode) {
                container.parentNode.removeChild(container);
            }
            resolve();
        }, duration);
    });
}

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
    green: [
        { h: 66, s: 98, v: 129 },  // Dark Mode
        { h: 49, s: 89, v: 183 }   // Light Mode
    ],
    yellow: [
        { h: 22, s: 124, v: 157 }, // Dark Mode
        { h: 22, s: 124, v: 207 }  // Light Mode
    ],
    gray: [
        { h: 114, s: 11, v: 65 },  // Dark mode lettered
        { h: 85, s: 10, v: 146 },  // Light mode lettered
    ],
    gray_blanked: [
        { h: 120, s: 24, v: 25 },  // Dark mode blank
        { h: 15, s: 1, v: 251 }    // Light mode blank
    ]
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
/**
 * --- HIGHLIGHT: State flags for optimization ---
 * These flags persist across multiple calls and must be reset before processing a new grid.
 */
let grayBlankDetected = false;
let blankTileDetected = false;

/**
 * Reset optimization flags before processing a new grid
 */
export function resetOptimizationFlags() {
    grayBlankDetected = false;
    blankTileDetected = false;
    console.log('[OPTIMIZATION] 🔄 Flags reset for new grid processing');
}

/**
 * Detect if a tile is blank using histogram analysis
 * @param {cv.Mat} tileMat - Input tile matrix
 * @param {number} tolerance - Tolerance for blank detection (default: 5 pixels)
 * @returns {boolean} True if tile is considered blank
 */
function isTileBlankHist(tileMat, tolerance = 15) {
    let gray, hist, mask, srcVec;

    try {
        // Convert to grayscale if needed
        gray = new cv.Mat();
        if (tileMat.channels() === 3 || tileMat.channels() === 4) {
            cv.cvtColor(tileMat, gray, cv.COLOR_RGBA2GRAY);
        } else {
            gray = tileMat.clone();
        }

        // Create MatVector for calcHist (it expects an array of Mats)
        srcVec = new cv.MatVector();
        srcVec.push_back(gray);

        // Compute histogram
        hist = new cv.Mat();
        mask = new cv.Mat(); // Empty mask means use whole image
        cv.calcHist(srcVec, [0], mask, hist, [256], [0, 256]);

        let maxVal = 0;
        for (let i = 0; i < hist.rows; i++) {
            if (hist.data32F[i] > maxVal) maxVal = hist.data32F[i];
        }

        // If 99%+ pixels match, tile is blank
        let totalPixels = tileMat.rows * tileMat.cols;
        const emptyMetric = (maxVal / totalPixels) * 100;
        const isBlank = emptyMetric > (100 - tolerance);
        console.log('[OCR] 🔘 Blank tile check:', { isBlank, emptyMetric: emptyMetric.toFixed(1) });
        return isBlank;

    } finally {
        if (gray) gray.delete();
        if (srcVec) srcVec.delete();
        if (mask) mask.delete();
        if (hist) hist.delete();
    }
}

/**
 * Crops a cv.Mat by x pixels from all sides.
 * @param {cv.Mat} tileMat The input image tile to crop.
 * @returns {cv.Mat} A new, cropped cv.Mat.
 */
function cropBorder(tileMat, cropSize = 10) {
    // Define a rectangle for the Region of Interest (ROI).
    // The parameters are (x, y, width, height).
    const rect = new cv.Rect(
        cropSize,                  // The starting x-coordinate.
        cropSize,                  // The starting y-coordinate.
        tileMat.cols - cropSize * 2,  // The new width (original width - xpx left - xpx right).
        tileMat.rows - cropSize * 2   // The new height (original height - xpx top - xpx bottom).
    );

    // Create a new matrix header for the ROI without copying data.
    const cropped = tileMat.roi(rect);

    // It's good practice to clone the ROI if you plan to modify it
    // or if the original tileMat might be deleted.
    const finalImage = cropped.clone();

    // Clean up the temporary ROI header.
    cropped.delete();

    return finalImage;
}


export function classifyTileColor(tileMat) {
    /**
     * --- HIGHLIGHT: Optimization shortcut ---
     * If a blank gray tile has already been found, we know all
     * subsequent tiles are also gray. This skips the expensive
     * color comparison for the rest of the grid.
     */
    if (grayBlankDetected) {
        return 'gray';
    }

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
        // Iterate over each color category (green, yellow, gray)
        for (const [colorName, centroids] of Object.entries(REF)) {
            // For each color, find the distance to its closest reference point
            const distancesToCentroids = centroids.map(centroid => {
                const hDiff = Math.abs(tileHSV.h - centroid.h);
                const sDiff = Math.abs(tileHSV.s - centroid.s);
                const vDiff = Math.abs(tileHSV.v - centroid.v);
                // Using weighted Euclidean distance (optional, but recommended)
                // Hue is often the most important, so we give it more weight.
                return Math.sqrt(Math.pow(hDiff, 2) + Math.pow(sDiff, 2) + Math.pow(vDiff, 2));
            });

            // The distance for this color is the minimum of the distances to its centroids
            const minDistanceForColor = Math.min(...distancesToCentroids);

            if (minDistanceForColor < minDistance) {
                minDistance = minDistanceForColor;
                closestColor = colorName;
            }
        }

        /**
         * --- HIGHLIGHT: Setting the flag ---
         * If the closest match is a blank gray tile, we set the flag
         * to true for future calls and return 'gray' for consistency.
         */
        if (closestColor === 'gray_blanked') {
            grayBlankDetected = true;
            return 'gray';
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
    const worker = await createWorker({ logger: () => {} });

    try {
        await worker.loadLanguage('eng');
        console.log('[OCR] ✅ Language loaded');

        await worker.initialize('eng');
        console.log('[OCR] ✅ Worker initialized');

        await worker.setParameters({
            tessedit_pageseg_mode: PSM.SINGLE_CHAR,
            tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
            tessedit_ocr_engine_mode: 1,
            preserve_interword_spaces: '0',
        });
        console.log('[OCR] ✅ Parameters configured for single character recognition');

        const results = [];
        let successCount = 0;
        let failCount = 0;
        let debugCount = 5;

        for (let i = 0; i < tiles.length; i++) {
            const tile = tiles[i];
            let croppedTile, gray, blurred, thresh, floodfill, filled, inverted, originalCanvas, grayCanvas, threshCanvas, finalCanvas;

            try {
                console.log(`[OCR] 🎯 Processing tile ${i + 1}/${tiles.length}...`);

                // OPTIMIZATION: Skip processing if blank tiles already detected
                if (blankTileDetected) {
                    console.log(`[OCR] ⏭️  Tile ${i + 1} skipped - blank tiles detected, assuming rest are blank`);
                    results.push(null);
                    continue;
                }

                // Check if tile is blank before expensive preprocessing
                if (isTileBlankHist(tile)) {
                    console.log(`[OCR] ⬜ Tile ${i + 1} detected as blank - setting optimization flag`);
                    blankTileDetected = true;
                    results.push(null);
                    continue;
                }

                // Debug: Log input tile info
                if (i <= debugCount) { // Only log first few tiles to avoid clutter
                    console.log(`[OCR] 📊 Input tile ${i + 1} info:`, {
                        size: `${tile.cols}x${tile.rows}`,
                        channels: tile.channels(),
                        type: tile.type(),
                        dataLength: tile.data.length
                    });
                }


                // Create debug canvas for original tile
                originalCanvas = document.createElement('canvas');
                originalCanvas.width = tile.cols;
                originalCanvas.height = tile.rows;
                cv.imshow(originalCanvas, tile);

                if (i <= debugCount) { // Only log first few tiles to avoid clutter
                    console.log(`[OCR] 🖼️  Original tile ${i + 1}:`, originalCanvas.toDataURL());

                    // Display original tile on screen
                    await displayDebugCanvas(originalCanvas, `Tile ${i + 1}/30 - Original`, 1000);

                }

                // Step 0:Crop the border from all sides.
                croppedTile = cropBorder(tile);

                // Step 1: Convert to grayscale and blur
                gray = new cv.Mat();
                cv.cvtColor(croppedTile, gray, cv.COLOR_RGBA2GRAY);

                // This smooths noise and helps the thresholding.
                blurred = new cv.Mat();
                cv.GaussianBlur(gray, blurred, new cv.Size(3, 3), 0, 0, cv.BORDER_DEFAULT);

                // Debug: Show grayscale result and check emptiness
                grayCanvas = document.createElement('canvas');
                grayCanvas.width = gray.cols;
                grayCanvas.height = gray.rows;
                cv.imshow(grayCanvas, gray);

                if (i <= debugCount) { // Only log first few tiles to avoid clutter
                    console.log(`[OCR] 🔘 Grayscale tile ${i + 1}:`, {
                        size: `${gray.cols}x${gray.rows}`,
                        dataURL: grayCanvas.toDataURL()
                    });

                    // Display grayscale tile on screen
                    await displayDebugCanvas(grayCanvas, `Tile ${i + 1}/30 - Grayscale`, 1000);
                }

                // Step 2: Apply adaptive thresholding
                thresh = new cv.Mat();
                cv.threshold(blurred, thresh, 0, 255, cv.THRESH_BINARY | cv.THRESH_OTSU);

                // Debug: Show threshold result
                threshCanvas = document.createElement('canvas');
                threshCanvas.width = thresh.cols;
                threshCanvas.height = thresh.rows;
                cv.imshow(threshCanvas, thresh);
                if (i <= debugCount) { // Only log first few tiles to avoid clutter
                    console.log(`[OCR] ⚫ Thresholded tile ${i + 1}:`, {
                        size: `${thresh.cols}x${thresh.rows}`,
                        dataURL: threshCanvas.toDataURL()
                    });
                    // Display thresholded tile on screen
                    await displayDebugCanvas(threshCanvas, `Tile ${i + 1}/30 - Thresholded`, 1000);
                }

                // Step 2.5: Flood fill to remove border artifacts (if any)
                // Create a copy to flood fill, leaving the original threshold intact
                floodfill = thresh.clone();
                cv.bitwise_not(floodfill, floodfill); // Invert for flood fill
                // Create a mask for flood fill
                let mask = new cv.Mat();
                mask.create(floodfill.rows + 2, floodfill.cols + 2, cv.CV_8UC1);
                mask.setTo(new cv.Scalar(0));

                // Perform the flood fill from the top-left corner
                cv.floodFill(floodfill, mask, new cv.Point(0, 0), new cv.Scalar(255));

                // Invert the flood-filled image back
                cv.bitwise_not(floodfill, floodfill);

                // Debug: Show filled result
                finalCanvas = document.createElement('canvas');
                finalCanvas.width = floodfill.cols;
                finalCanvas.height = floodfill.rows;
                cv.imshow(finalCanvas, floodfill);
                if (i <= debugCount) { // Only log first few tiles to avoid clutter
                    console.log(`[OCR] Flood Filled tile ${i + 1}:`, {
                        size: `${floodfill.cols}x${floodfill.rows}`,
                        dataURL: finalCanvas.toDataURL()
                    });

                    // Display final processed tile on screen
                    await displayDebugCanvas(finalCanvas, `Tile ${i + 1}/30 - Flood Filled`, 2000);
                }

                console.log(`[OCR] 📸 Preprocessing completed for tile ${i + 1}`);

                // Create a proper canvas with cv.imshow to avoid data corruption
                const ocrCanvas = document.createElement('canvas');
                ocrCanvas.width = floodfill.cols;
                ocrCanvas.height = floodfill.rows;
                cv.imshow(ocrCanvas, floodfill);

                // Validate canvas before passing to Tesseract
                if (!ocrCanvas || ocrCanvas.width === 0 || ocrCanvas.height === 0) {
                    console.warn(`[OCR] ⚠️ Invalid canvas for tile ${i + 1}, skipping OCR`);
                    results.push(null);
                    failCount++;
                    continue;
                }

                // Pass canvas directly to Tesseract (not ImageData)
                const { data: { text, confidence } } = await worker.recognize(ocrCanvas);

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
                // Clean up OpenCV matrices
                if (gray) gray.delete();
                if (thresh) thresh.delete();
                if (inverted) inverted.delete();
                if (croppedTile) croppedTile.delete();
                if (blurred) blurred.delete();
                if (floodfill) floodfill.delete();
                if (filled) filled.delete();
                // Clean up debug canvases (optional - browser will GC them)
                if (originalCanvas) originalCanvas.remove();
                if (grayCanvas) grayCanvas.remove();
                if (threshCanvas) threshCanvas.remove();
                if (finalCanvas) finalCanvas.remove();
            }
        }

        const skippedCount = tiles.length - successCount - failCount;
        console.log('[OCR] ✅ OCR processing completed', {
            totalTiles: tiles.length,
            successCount,
            failCount,
            skippedCount,
            successRate: Math.round((successCount / tiles.length) * 100) + '%',
            optimizationUsed: blankTileDetected ? 'Blank tile detection' : 'None'
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

    // Reset optimization flags for new grid processing
    resetOptimizationFlags();

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

/**
 * Extract data from individual tile locations (NEW approach)
 * @param {cv.Mat} srcMat - Source image matrix
 * @param {Array} tiles - Array of tile objects with positions and boundaries
 * @returns {Promise<Array<{row: number, col: number, letter: string|null, color: string}>>} Grid data
 */
export async function extractIndividualTileData(srcMat, tiles) {
    console.log('[EXTRACT_TILES] 🔄 Starting individual tile data extraction...', {
        sourceSize: `${srcMat.cols}x${srcMat.rows}`,
        tileCount: tiles.length
    });

    // Reset optimization flags for new grid processing
    resetOptimizationFlags();

    const tileMats = [];
    const gridData = [];

    try {
        // Step 1: Extract tile regions from source image
        console.log('[EXTRACT_TILES] 🔄 Step 1: Extracting tile regions...');

        for (let i = 0; i < tiles.length; i++) {
            const tile = tiles[i];

            try {
                // Use bounding rectangle to extract tile region
                const rect = tile.boundingRect;

                // Add some padding to ensure we capture the full tile
                const padding = 5;
                const expandedRect = new cv.Rect(
                    Math.max(0, rect.x - padding),
                    Math.max(0, rect.y - padding),
                    Math.min(srcMat.cols - (rect.x - padding), rect.width + 2 * padding),
                    Math.min(srcMat.rows - (rect.y - padding), rect.height + 2 * padding)
                );

                // Extract tile region
                const tileRegion = srcMat.roi(expandedRect);

                // Resize to standard size for consistent processing
                const standardTile = new cv.Mat();
                cv.resize(tileRegion, standardTile, new cv.Size(80, 80), 0, 0, cv.INTER_CUBIC);

                tileMats.push(standardTile);
                tileRegion.delete();

                console.log(`[EXTRACT_TILES] ✅ Extracted tile ${i} at position (${tile.row}, ${tile.col})`);

            } catch (error) {
                console.error(`[EXTRACT_TILES] ❌ Failed to extract tile ${i}:`, error.message);
                // Create empty tile as fallback
                const emptyTile = cv.Mat.zeros(80, 80, cv.CV_8UC4);
                tileMats.push(emptyTile);
            }
        }

        // Step 2: Classify tile colors
        console.log('[EXTRACT_TILES] 🔄 Step 2: Classifying tile colors...');
        const colors = [];

        for (let i = 0; i < tileMats.length; i++) {
            const tile = tileMats[i];
            const color = classifyTileColor(tile);
            colors.push(color);

            console.log(`[EXTRACT_TILES] 🎨 Tile ${i} color: ${color}`);
        }

        // Step 3: OCR for letters
        console.log('[EXTRACT_TILES] 🔄 Step 3: Running OCR on tiles...');
        const letters = await ocrTileLetters(tileMats);

        // Step 4: Build structured grid data
        console.log('[EXTRACT_TILES] 🔄 Step 4: Building structured grid data...');

        for (let i = 0; i < tiles.length; i++) {
            const tile = tiles[i];
            const letter = letters[i] || null;
            const color = colors[i] || 'gray';

            // Only include cells that have content (letter or non-gray color)
            if (letter || color !== 'gray') {
                gridData.push({
                    row: tile.row,
                    col: tile.col,
                    letter: letter,
                    color: color
                });
            }

            if (i < 5) { // Log first few for debugging
                console.log(`[EXTRACT_TILES] 📊 Tile (${tile.row},${tile.col}): "${letter}" [${color}]`);
            }
        }

        console.log('[EXTRACT_TILES] ✅ Individual tile extraction completed', {
            tilesProcessed: tiles.length,
            gridDataItems: gridData.length,
            filledCells: gridData.filter(item => item.letter).length,
            coloredCells: gridData.filter(item => item.color !== 'gray').length
        });

        return gridData;

    } catch (error) {
        console.error('[EXTRACT_TILES] ❌ Tile extraction failed:', error.message);
        throw new GridUnreadableError(`Individual tile processing failed: ${error.message}`);
    } finally {
        // Cleanup tile matrices
        tileMats.forEach(tileMat => {
            if (tileMat && typeof tileMat.delete === 'function') {
                tileMat.delete();
            }
        });
        console.log('[EXTRACT_TILES] 🧹 Cleaned up tile matrices');
    }
}