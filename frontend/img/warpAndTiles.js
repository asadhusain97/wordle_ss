/**
 * Perspective warp and tile extraction for Wordle grid processing
 * Handles geometric transformation and tile slicing
 */

import { debugShowMat } from './opencvBootstrap.js';

// Debug timing constant - how long to display each debug image (in seconds)
const DEBUG_DISPLAY_DURATION = 5;

/**
 * Debug utility: Wait for specified duration to allow visual inspection
 * @param {number} seconds - Number of seconds to wait
 * @param {string} stepName - Name of the step being debugged
 */
async function debugWait(seconds = DEBUG_DISPLAY_DURATION, stepName = 'Debug Step') {
    console.log(`⏳ [DEBUG WAIT] Pausing ${seconds}s for visual inspection of: ${stepName}`);
    await new Promise(resolve => setTimeout(resolve, seconds * 1000));
    console.log(`✅ [DEBUG WAIT] Continuing after ${seconds}s delay`);
}

/**
 * Performs perspective transformation to create top-down view of grid
 * @param {cv.Mat} srcMat - Source image matrix
 * @param {[cv.Point, cv.Point, cv.Point, cv.Point]} cornersTLTRBRBL - Grid corners [TL, TR, BR, BL]
 * @param {{w: number, h: number}} outSize - Output dimensions (default 500x600)
 * @returns {cv.Mat} Warped grid image
 */
export function warpGridTopDown(srcMat, cornersTLTRBRBL, outSize = { w: 500, h: 600 }) {
    console.log('[WARP] 🔄 Starting perspective warp to top-down view...', {
        inputSize: `${srcMat.cols}x${srcMat.rows}`,
        outputSize: `${outSize.w}x${outSize.h}`
    });

    let srcPtsMat, dstPtsMat, M, dst;

    try {
        const [tl, tr, br, bl] = cornersTLTRBRBL;
        console.log('[WARP] 🎯 Input corners:', {
            TL: `(${tl.x}, ${tl.y})`,
            TR: `(${tr.x}, ${tr.y})`,
            BR: `(${br.x}, ${br.y})`,
            BL: `(${bl.x}, ${bl.y})`
        });

        // Build srcPoints (Float32Array) from TL,TR,BR,BL
        srcPtsMat = cv.matFromArray(4, 1, cv.CV_32FC2, [
            tl.x, tl.y,  // Top-left
            tr.x, tr.y,  // Top-right
            br.x, br.y,  // Bottom-right
            bl.x, bl.y   // Bottom-left
        ]);
        console.log('[WARP] ✅ Source points matrix created');

        // Build dstPoints mapping to [0,0],[w,0],[w,h],[0,h]
        dstPtsMat = cv.matFromArray(4, 1, cv.CV_32FC2, [
            0, 0,                    // Top-left
            outSize.w, 0,           // Top-right
            outSize.w, outSize.h,   // Bottom-right
            0, outSize.h            // Bottom-left
        ]);
        console.log('[WARP] ✅ Destination points matrix created');

        // M = cv.getPerspectiveTransform(srcPtsMat, dstPtsMat)
        M = cv.getPerspectiveTransform(srcPtsMat, dstPtsMat);
        console.log('[WARP] ✅ Perspective transform matrix calculated');

        // cv.warpPerspective(srcMat, dst, M, new cv.Size(outSize.w, outSize.h), cv.INTER_LINEAR, cv.BORDER_REPLICATE)
        dst = new cv.Mat();
        cv.warpPerspective(
            srcMat,
            dst,
            M,
            new cv.Size(outSize.w, outSize.h),
            cv.INTER_LINEAR,
            cv.BORDER_REPLICATE
        );
        console.log('[WARP] ✅ Perspective warp completed', {
            outputSize: `${dst.cols}x${dst.rows}`,
            channels: dst.channels()
        });

        // Return dst
        return dst;

    } catch (error) {
        console.error('[WARP] ❌ Perspective warp failed:', error.message);
        if (dst) dst.delete();
        throw new Error(`Perspective warp failed: ${error.message}`);
    } finally {
        // Memory safety - delete srcPtsMat, dstPtsMat, M after use
        if (srcPtsMat) srcPtsMat.delete();
        if (dstPtsMat) dstPtsMat.delete();
        if (M) M.delete();
        console.log('[WARP] 🧹 Memory cleanup completed');
    }
}

/**
 * Extracts individual tiles from the warped grid
 * @param {cv.Mat} gridMat - Warped grid image
 * @param {number} rows - Number of rows (default 6)
 * @param {number} cols - Number of columns (default 5)
 * @returns {cv.Mat[]} Array of 30 tile matrices in row-major order
 */
export async function sliceTiles(gridMat, rows = 6, cols = 5) {
    console.log('[TILES] 🔄 Starting tile extraction...', {
        gridSize: `${gridMat.cols}x${gridMat.rows}`,
        gridLayout: `${rows}x${cols}`
    });

    // Compute tile width/height = floor(gridMat.cols/cols), floor(gridMat.rows/rows)
    const tileWidth = Math.floor(gridMat.cols / cols);
    const tileHeight = Math.floor(gridMat.rows / rows);

    console.log('[TILES] 📏 Calculated tile dimensions', {
        tileWidth,
        tileHeight,
        totalTiles: rows * cols
    });

    const tiles = [];

    try {
        // For each row,col create ROI Rect and cv.Mat tile via gridMat.roi(rect)
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const tileIndex = row * cols + col;
                const x = col * tileWidth;
                const y = row * tileHeight;
                const w = tileWidth;
                const h = tileHeight;

                console.log(`[TILES] 🎯 Extracting tile [${row},${col}] (index ${tileIndex})`, {
                    position: `(${x}, ${y})`,
                    size: `${w}x${h}`
                });

                // Create ROI Rect
                const rect = new cv.Rect(x, y, w, h);

                // Extract tile via gridMat.roi(rect)
                const tile = gridMat.roi(rect);

                tiles.push(tile);
            }
        }

        console.log('[TILES] ✅ Tile extraction completed', {
            extractedTiles: tiles.length,
            expectedTiles: rows * cols
        });

        // 🖼️ DEBUG: Show first few tiles as samples
        if (tiles.length > 0) {
            console.group('🔍 [DEBUG] Sample Extracted Tiles');

            // Show first 6 tiles (first row) with delays
            for (let i = 0; i < Math.min(6, tiles.length); i++) {
                if (tiles[i] && !tiles[i].empty()) {
                    debugShowMat(tiles[i], `5️⃣ Tile ${i} (Row ${Math.floor(i/5)}, Col ${i%5})`);
                    await debugWait(DEBUG_DISPLAY_DURATION, `Tile ${i} (Row ${Math.floor(i/5)}, Col ${i%5})`);
                }
            }

            console.groupEnd();
        }

        // Return array of 30 Mats in row-major order
        return tiles;

    } catch (error) {
        // Clean up any created tiles on error
        tiles.forEach(tile => {
            if (tile && typeof tile.delete === 'function') {
                tile.delete();
            }
        });
        throw new Error(`Tile slicing failed: ${error.message}`);
    }
}

/**
 * Enhanced tile extraction with adaptive sizing
 * @param {cv.Mat} gridMat - Warped grid image
 * @param {number} rows - Number of rows
 * @param {number} cols - Number of columns
 * @returns {cv.Mat[]} Array of processed tiles
 */
export function sliceTilesAdaptive(gridMat, rows = 6, cols = 5) {
    const tiles = [];

    try {
        // Calculate base tile dimensions
        const baseTileWidth = gridMat.cols / cols;
        const baseTileHeight = gridMat.rows / rows;

        // Adaptive padding based on image size
        const paddingX = Math.max(2, Math.floor(baseTileWidth * 0.08));
        const paddingY = Math.max(2, Math.floor(baseTileHeight * 0.08));

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                // Calculate precise tile boundaries
                const x = Math.floor(col * baseTileWidth) + paddingX;
                const y = Math.floor(row * baseTileHeight) + paddingY;
                const w = Math.floor(baseTileWidth) - (2 * paddingX);
                const h = Math.floor(baseTileHeight) - (2 * paddingY);

                // Boundary checks
                if (x + w > gridMat.cols || y + h > gridMat.rows || w <= 0 || h <= 0) {
                    // Create empty tile for invalid regions
                    const emptyTile = cv.Mat.zeros(50, 50, cv.CV_8UC3);
                    tiles.push(emptyTile);
                    continue;
                }

                // Extract and process tile
                const tileRect = new cv.Rect(x, y, w, h);
                const tileRoi = gridMat.roi(tileRect);

                // Resize tile to standard size for consistent processing
                const standardTile = new cv.Mat();
                const standardSize = new cv.Size(80, 80);
                cv.resize(tileRoi, standardTile, standardSize, 0, 0, cv.INTER_CUBIC);

                tileRoi.delete();
                tiles.push(standardTile);
            }
        }

        return tiles;

    } catch (error) {
        // Cleanup on error
        tiles.forEach(tile => {
            if (tile && typeof tile.delete === 'function') {
                tile.delete();
            }
        });
        throw new Error(`Adaptive tile slicing failed: ${error.message}`);
    }
}

/**
 * Validates that a warped grid has reasonable dimensions and content
 * @param {cv.Mat} gridMat - Warped grid to validate
 * @returns {boolean} True if grid appears valid
 */
export function validateWarpedGrid(gridMat) {
    try {
        // Check basic dimensions
        if (!gridMat || gridMat.rows < 100 || gridMat.cols < 100) {
            return false;
        }

        // Check if image isn't completely black or white
        const scalar = cv.mean(gridMat);
        const avgBrightness = (scalar[0] + scalar[1] + scalar[2]) / 3;

        // Reasonable brightness range (not pure black/white)
        if (avgBrightness < 10 || avgBrightness > 245) {
            return false;
        }

        // Check for some variation in the image (not completely uniform)
        let grayMat;
        try {
            grayMat = new cv.Mat();
            cv.cvtColor(gridMat, grayMat, cv.COLOR_RGBA2GRAY);

            const mean = new cv.Mat();
            const stdDev = new cv.Mat();
            cv.meanStdDev(grayMat, mean, stdDev);

            const variation = stdDev.data64F[0];

            mean.delete();
            stdDev.delete();

            // Should have some variation (not completely flat)
            return variation > 5;

        } finally {
            if (grayMat) grayMat.delete();
        }

    } catch (error) {
        console.warn('Grid validation failed:', error.message);
        return false;
    }
}

/**
 * Utility function to create debug visualization of tiles
 * @param {cv.Mat[]} tiles - Array of tile matrices
 * @param {number} cols - Number of columns for arrangement
 * @returns {cv.Mat} Combined visualization of all tiles
 */
export function visualizeTiles(tiles, cols = 5) {
    if (!tiles.length) {
        return cv.Mat.zeros(100, 100, cv.CV_8UC3);
    }

    try {
        const tileSize = 80;
        const rows = Math.ceil(tiles.length / cols);
        const outputWidth = cols * tileSize;
        const outputHeight = rows * tileSize;

        const result = cv.Mat.zeros(outputHeight, outputWidth, cv.CV_8UC3);

        for (let i = 0; i < tiles.length; i++) {
            const tile = tiles[i];
            if (!tile || tile.empty()) continue;

            const row = Math.floor(i / cols);
            const col = i % cols;
            const x = col * tileSize;
            const y = row * tileSize;

            // Resize tile to standard size
            const resizedTile = new cv.Mat();
            const size = new cv.Size(tileSize, tileSize);
            cv.resize(tile, resizedTile, size);

            // Copy to result
            const roi = result.roi(new cv.Rect(x, y, tileSize, tileSize));
            resizedTile.copyTo(roi);

            resizedTile.delete();
            roi.delete();
        }

        return result;

    } catch (error) {
        console.error('Tile visualization failed:', error.message);
        return cv.Mat.zeros(100, 100, cv.CV_8UC3);
    }
}