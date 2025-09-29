/**
 * Main orchestrator for processing Wordle screenshots into grid data
 * Coordinates all image processing modules and applies results to DOM
 */

import { ensureOpenCVReady, decodeFileToImageBitmap, matFromImageBitmapSmart } from '../img/opencvBootstrap.js';
import { detectWordleGrid, GridNotFoundError } from '../img/gridDetect.js';
import { warpGridTopDown, sliceTilesAdaptive } from '../img/warpAndTiles.js';
import { extractGridData, GridUnreadableError } from '../img/colorAndOCR.js';
import { resetIndexGrid, applyGridToDOM } from '../ui/applyGrid.js';

/**
 * Processing pipeline state for debugging and recovery
 */
class ProcessingState {
    constructor() {
        this.file = null;
        this.imageBitmap = null;
        this.sourceMat = null;
        this.warpedMat = null;
        this.tiles = [];
        this.colors = [];
        this.letters = [];
        this.grid = [];
    }

    /**
     * Cleans up OpenCV matrices and resources
     */
    cleanup() {
        if (this.sourceMat && typeof this.sourceMat.delete === 'function') {
            this.sourceMat.delete();
        }
        if (this.warpedMat && typeof this.warpedMat.delete === 'function') {
            this.warpedMat.delete();
        }
        this.tiles.forEach(tile => {
            if (tile && typeof tile.delete === 'function') {
                tile.delete();
            }
        });
        if (this.imageBitmap && typeof this.imageBitmap.close === 'function') {
            this.imageBitmap.close();
        }
    }
}

/**
 * Logs processing steps with detailed information
 * @param {string} step - Processing step name
 * @param {any} data - Step data or results
 * @param {string} level - Log level (info, warn, error)
 */
function logProcessingStep(step, data = null, level = 'info') {
    const timestamp = new Date().toISOString();
    const message = `[WORDLE_PROCESS ${timestamp}] ${step}`;

    if (level === 'error') {
        console.error(message, data || '');
    } else if (level === 'warn') {
        console.warn(message, data || '');
    } else {
        console.log(message, data || '');
    }
}

/**
 * Converts processing results to structured grid format
 * @param {string[]} colors - Array of 30 colors (row-major)
 * @param {(string|null)[]} letters - Array of 30 letters (row-major)
 * @returns {{row: number, col: number, letter: string, color: string}[]} Structured grid
 */
function buildStructuredGrid(colors, letters) {
    const grid = [];

    for (let i = 0; i < 30; i++) {
        const row = Math.floor(i / 5);
        const col = i % 5;
        const letter = letters[i] || '';
        const color = colors[i] || 'gray';

        // Only include cells with actual content or non-gray colors
        if (letter || color !== 'gray') {
            grid.push({
                row: row,
                col: col,
                letter: letter,
                color: color
            });
        }
    }

    return grid;
}

/**
 * Enhanced error handling with user-friendly messages
 * @param {Error} error - Original error
 * @param {string} context - Processing context
 * @returns {Error} Enhanced error with context
 */
function enhanceError(error, context) {
    let userMessage = 'Image processing failed';

    if (error instanceof GridNotFoundError) {
        userMessage = 'Could not detect the Wordle grid in the image. Please ensure the entire grid is visible and try again.';
    } else if (error instanceof GridUnreadableError) {
        userMessage = 'The grid appears corrupted or unreadable. Please try a clearer image.';
    } else if (error.message.includes('OpenCV')) {
        userMessage = 'Computer vision system is not ready. Please refresh the page and try again.';
    } else if (error.message.includes('Tesseract')) {
        userMessage = 'Text recognition system failed. Please try again or use manual input.';
    }

    const enhancedError = new Error(`${userMessage} (${context})`);
    enhancedError.originalError = error;
    enhancedError.context = context;
    enhancedError.userMessage = userMessage;

    return enhancedError;
}

/**
 * Main processing function - processes image and populates grid
 * @param {File} file - Image file to process
 * @returns {Promise<{grid: Array<{row: number, col: number, letter: string|null, color: string}>}>} Processing results
 * @throws {GridNotFoundError|GridUnreadableError|Error} Various processing errors
 */
export async function processAndPopulateGrid(file) {
    console.log('🚀 ============================================');
    console.log('🚀 WORDLE IMAGE PROCESSING PIPELINE STARTED');
    console.log('🚀 ============================================');
    console.log('[PIPELINE] 📁 Input file:', {
        name: file.name,
        size: file.size,
        type: file.type
    });

    console.log('[PIPELINE] 🔄 Step 1: Initializing OpenCV...');
    await ensureOpenCVReady();

    console.log('[PIPELINE] 🔄 Step 2: Decoding image file...');
    const imgBitmap = await decodeFileToImageBitmap(file);

    console.log('[PIPELINE] 🔄 Step 3: Creating OpenCV matrix...');
    const src = matFromImageBitmapSmart(imgBitmap);

    try {
        console.log('[PIPELINE] 🔄 Step 4: Detecting Wordle grid...');
        const { cornersTLTRBRBL } = detectWordleGrid(src);

        console.log('[PIPELINE] 🔄 Step 5: Applying perspective warp...');
        const gridTopDown = warpGridTopDown(src, cornersTLTRBRBL, { w: 500, h: 600 });

        let grid;
        try {
            console.log('[PIPELINE] 🔄 Step 6: Extracting grid data (colors + OCR)...');
            grid = await extractGridData(gridTopDown);

            console.log('[PIPELINE] 🔄 Step 7: Applying results to DOM...');
            resetIndexGrid();
            applyGridToDOM(grid);

            console.log('✅ ============================================');
            console.log('✅ PIPELINE COMPLETED SUCCESSFULLY!');
            console.log('✅ ============================================');
            console.log('[PIPELINE] 📊 Final results:', {
                totalCells: grid.length,
                filledCells: grid.filter(item => item.letter).length,
                nonGrayCells: grid.filter(item => item.color !== 'gray').length
            });

            return { grid };
        } finally {
            if (gridTopDown) {
                console.log('[PIPELINE] 🧹 Cleaning up warped grid matrix...');
                gridTopDown.delete();
            }
        }

    } catch (error) {
        console.error('❌ ============================================');
        console.error('❌ PIPELINE FAILED!');
        console.error('❌ ============================================');
        console.error('[PIPELINE] ❌ Error:', error.message);
        throw error;
    } finally {
        if (src) {
            console.log('[PIPELINE] 🧹 Cleaning up source matrix...');
            src.delete();
        }
        if (imgBitmap && typeof imgBitmap.close === 'function') {
            console.log('[PIPELINE] 🧹 Cleaning up ImageBitmap...');
            imgBitmap.close();
        }
        console.log('[PIPELINE] 🧹 Memory cleanup completed');
    }
}

/**
 * Utility function for testing individual pipeline steps
 * @param {File} file - Test image file
 * @returns {Promise<ProcessingState>} Processing state for inspection
 */
export async function processForDebugging(file) {
    const state = new ProcessingState();

    try {
        await ensureOpenCVReady();
        state.imageBitmap = await decodeFileToImageBitmap(file);
        state.sourceMat = matFromImageBitmapSmart(state.imageBitmap);

        const { cornersTLTRBRBL } = detectWordleGrid(state.sourceMat);
        state.warpedMat = warpGridTopDown(state.sourceMat, cornersTLTRBRBL);
        state.tiles = sliceTilesAdaptive(state.warpedMat, 6, 5);

        return state;

    } catch (error) {
        state.cleanup();
        throw error;
    }
}

/**
 * Health check function to verify all dependencies are available
 * @returns {Promise<{opencv: boolean, tesseract: boolean, overall: boolean}>} Status report
 */
export async function checkSystemHealth() {
    const health = {
        opencv: false,
        tesseract: false,
        overall: false
    };

    try {
        await ensureOpenCVReady();
        health.opencv = true;
        logProcessingStep('HEALTH_CHECK', 'OpenCV is ready', 'info');
    } catch (error) {
        logProcessingStep('HEALTH_CHECK', `OpenCV check failed: ${error.message}`, 'warn');
    }

    try {
        health.tesseract = typeof Tesseract !== 'undefined' && typeof Tesseract.createWorker === 'function';
        if (health.tesseract) {
            logProcessingStep('HEALTH_CHECK', 'Tesseract is available', 'info');
        } else {
            logProcessingStep('HEALTH_CHECK', 'Tesseract not available', 'warn');
        }
    } catch (error) {
        logProcessingStep('HEALTH_CHECK', `Tesseract check failed: ${error.message}`, 'warn');
    }

    health.overall = health.opencv && health.tesseract;
    logProcessingStep('HEALTH_CHECK', `System health: ${health.overall ? 'READY' : 'NOT READY'}`,
                     health.overall ? 'info' : 'warn');

    return health;
}