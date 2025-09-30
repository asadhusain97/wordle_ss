/**
 * Main orchestrator for processing Wordle screenshots into grid data
 * Coordinates all image processing modules and applies results to DOM
 */

import { ensureOpenCVReady, decodeFileToImageBitmap, matFromImageBitmapSmart, debugShowMat, debugShowImageBitmap } from './opencvBootstrap.js';

import { detectWordleGrid, GridNotFoundError } from './gridDetect.js';
import { warpGridTopDown, sliceTilesAdaptive } from './warpAndTiles.js';
import { extractGridData, extractIndividualTileData, GridUnreadableError } from './colorAndOCR.js';
import { resetIndexGrid, applyGridToDOM } from './applyGrid.js';

// Debug configuration - control visual debugging features
const DEBUG = false; // Set to false to disable visual debug images and delays
const DEBUG_DISPLAY_DURATION = 0.5; // Seconds to display debug images (only when DEBUG = true)

/**
 * Debug utility: Wait for specified duration to allow visual inspection
 * @param {number} seconds - Number of seconds to wait
 * @param {string} stepName - Name of the step being debugged
 */
async function debugWait(seconds = DEBUG_DISPLAY_DURATION, stepName = 'Debug Step') {
    if (!DEBUG) return; // Skip wait if DEBUG is disabled

    console.log(`⏳ [DEBUG WAIT] Pausing ${seconds}s for visual inspection of: ${stepName}`);
    await new Promise(resolve => setTimeout(resolve, seconds * 1000));
    console.log(`✅ [DEBUG WAIT] Continuing after ${seconds}s delay`);
}

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

    // 🖼️ DEBUG: Show original uploaded image
    debugShowImageBitmap(imgBitmap, '1️⃣ Original Uploaded Image');
    await debugWait(DEBUG_DISPLAY_DURATION, 'Original Uploaded Image');

    console.log('[PIPELINE] 🔄 Step 3: Creating OpenCV matrix...');
    const src = matFromImageBitmapSmart(imgBitmap);

    // 🖼️ DEBUG: Show OpenCV source matrix
    debugShowMat(src, '2️⃣ OpenCV Source Matrix');
    await debugWait(DEBUG_DISPLAY_DURATION, 'OpenCV Source Matrix');

    try {
        console.log('[PIPELINE] 🔄 Step 4: Detecting individual Wordle tiles...');
        const { tiles } = await detectWordleGrid(src);

        console.log('[PIPELINE] 🔄 Step 5: Processing individual tiles (colors + OCR)...');
        console.log('[PIPELINE] 📊 Individual tile processing:', {
            detectedTiles: tiles.length,
            expectedTiles: 30
        });

        let grid;
        try {
            // Process each individual tile instead of using a warped grid
            grid = await extractIndividualTileData(src, tiles);

            console.log('[PIPELINE] 🔄 Step 6: Applying results to DOM...');
            resetIndexGrid();
            applyGridToDOM(grid);

            console.log('✅ ============================================');
            console.log('✅ PIPELINE COMPLETED SUCCESSFULLY!');
            console.log('✅ ============================================');
            console.log('[PIPELINE] 📊 Final results:', {
                totalCells: grid.length,
                filledCells: grid.filter(item => item.letter).length,
                nonGrayCells: grid.filter(item => item.color !== 'gray').length,
                tilesProcessed: tiles.length
            });

            return { grid };
        } finally {
            // No cleanup needed for individual tiles approach
            console.log('[PIPELINE] 🧹 Individual tile processing completed');
        }

    } catch (error) {
        console.error('❌ ============================================');
        console.error('❌ PIPELINE FAILED!');
        console.error('❌ ============================================');
        console.error('[PIPELINE] ❌ Error:', error.message);
        throw error;
    } finally {
        // Memory safety - defensive cleanup
        try {
            if (src && !src.isDeleted()) {
                console.log('[PIPELINE] 🧹 Cleaning up source matrix...');
                src.delete();
            }
        } catch (error) {
            console.warn('[PIPELINE] ⚠️ Source matrix cleanup failed:', error.message);
        }

        try {
            if (imgBitmap && typeof imgBitmap.close === 'function') {
                console.log('[PIPELINE] 🧹 Cleaning up ImageBitmap...');
                imgBitmap.close();
            }
        } catch (error) {
            console.warn('[PIPELINE] ⚠️ ImageBitmap cleanup failed:', error.message);
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