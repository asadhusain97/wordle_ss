/**
 * Wordle grid detection using OpenCV contour analysis
 * Detects the main Wordle grid as a 4-point quadrilateral
 */

import { debugShowMat } from './opencvBootstrap.js';

// Debug timing constant - how long to display each debug image (in seconds)
const DEBUG_DISPLAY_DURATION = 0.1;

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

// Processing constants for tuning - improved for both light and dark themes
const BLUR_KERNEL_SIZE = 1; // Smaller blur to preserve edges
const APPROX_EPSILON_FACTOR = 0.015; // More precise polygon approximation

// Individual tile detection constants
const MIN_TILE_AREA_RATIO = 0.001; // Minimum area ratio for a single tile (0.1%)
const MAX_TILE_AREA_RATIO = 0.05;  // Maximum area ratio for a single tile (5%)
const MIN_TILE_ASPECT_RATIO = 0.99;  // Minimum width/height ratio for square tiles
const MAX_TILE_ASPECT_RATIO = 1.01;  // Maximum width/height ratio for square tiles
const EXPECTED_TILE_COUNT = 30;     // Wordle has exactly 30 tiles (6 rows x 5 cols)

/**
 * Custom error for when grid cannot be detected
 */
export class GridNotFoundError extends Error {
    constructor(message = 'Wordle grid not found or not rectangular') {
        super(message);
        this.name = 'GridNotFoundError';
    }
}

/**
 * Orders points in TL, TR, BR, BL format using sum/diff heuristics
 * @param {cv.Point[]} points - Array of 4 points
 * @returns {[cv.Point, cv.Point, cv.Point, cv.Point]} Ordered points [TL, TR, BR, BL]
 */
function orderCorners(points) {
    if (points.length !== 4) {
        throw new Error('Expected exactly 4 points for ordering');
    }

    // Use sum and difference heuristics for robust ordering
    const sums = points.map(p => ({ point: p, sum: p.x + p.y }));
    const diffs = points.map(p => ({ point: p, diff: p.x - p.y }));

    // Sort by sum (smallest = TL, largest = BR)
    sums.sort((a, b) => a.sum - b.sum);
    const topLeft = sums[0].point;
    const bottomRight = sums[3].point;

    // Sort by difference (smallest = BL, largest = TR)
    diffs.sort((a, b) => a.diff - b.diff);
    const bottomLeft = diffs[0].point;
    const topRight = diffs[3].point;

    return [topLeft, topRight, bottomRight, bottomLeft];
}

/**
 * Detects all 30 individual Wordle tiles in an image
 * @param {cv.Mat} srcMat - Source image matrix in RGBA format
 * @returns {{tiles: Array<{corners: cv.Point[], center: cv.Point, row: number, col: number, boundingRect: cv.Rect}>}} Individual tiles with positions
 * @throws {GridNotFoundError} If exactly 30 tiles are not found
 */
export async function detectWordleGrid(srcMat) {
    console.log('[GRID_DETECT] 🔄 Starting grid detection...', {
        imageSize: `${srcMat.cols}x${srcMat.rows}`,
        channels: srcMat.channels()
    });

    let gray, blur, edges, contours, hierarchy, adaptive, morphed;

    try {
        // 1) Enhanced Preprocessing for both light and dark themes
        console.log('[GRID_DETECT] 🎯 Step 1: Enhanced preprocessing for theme detection');

        // Convert RGBA to grayscale
        gray = new cv.Mat();
        cv.cvtColor(srcMat, gray, cv.COLOR_RGBA2GRAY);
        console.log('[GRID_DETECT] ✅ Converted to grayscale');

        // 🖼️ DEBUG: Show grayscale result
        debugShowMat(gray, '4️⃣ Grayscale Image');
        await debugWait(DEBUG_DISPLAY_DURATION, 'Grayscale Image');

        // Check if image is predominantly dark or light
        const meanValue = cv.mean(gray)[0];
        console.log('[GRID_DETECT] 📊 Image brightness analysis:', {
            meanBrightness: Math.round(meanValue),
            theme: meanValue < 128 ? 'Dark Theme' : 'Light Theme'
        });

        // Apply adaptive preprocessing based on theme
        let preprocessed = new cv.Mat();

        if (meanValue < 128) {
            // Dark theme: Use adaptive threshold to enhance grid lines
            console.log('[GRID_DETECT] 🌙 Processing dark theme image');
            cv.adaptiveThreshold(gray, adaptive = new cv.Mat(), 255,
                cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 11, 2);

            // Invert for consistent processing (make grid lines dark)
            cv.bitwise_not(adaptive, preprocessed);
            console.log('[GRID_DETECT] ✅ Applied adaptive threshold (dark theme)');

        } else {
            // Light theme: Use standard preprocessing with enhanced contrast
            console.log('[GRID_DETECT] ☀️ Processing light theme image');

            // Enhance contrast using CLAHE
            const clahe = new cv.CLAHE(2.0, new cv.Size(8, 8));
            clahe.apply(gray, preprocessed);
            console.log('[GRID_DETECT] ✅ Applied CLAHE contrast enhancement');
        }

        // 🖼️ DEBUG: Show preprocessed result
        debugShowMat(preprocessed, '4️⃣ Theme-Adapted Preprocessing');
        await debugWait(DEBUG_DISPLAY_DURATION, 'Theme-Adapted Preprocessing');

        // Apply Gaussian blur
        blur = new cv.Mat();
        cv.GaussianBlur(preprocessed, blur, new cv.Size(BLUR_KERNEL_SIZE, BLUR_KERNEL_SIZE), 0, 0);
        console.log('[GRID_DETECT] ✅ Applied Gaussian blur', { kernelSize: BLUR_KERNEL_SIZE });

        // Apply morphological operations to clean up noise
        const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));
        morphed = new cv.Mat();
        cv.morphologyEx(blur, morphed, cv.MORPH_CLOSE, kernel);
        console.log('[GRID_DETECT] ✅ Applied morphological closing');

        // Apply Canny edge detection with dynamic thresholds
        edges = new cv.Mat();
        const dynamicLow = Math.max(20, Math.min(50, meanValue * 0.2));
        const dynamicHigh = Math.max(60, Math.min(150, meanValue * 0.6));

        cv.Canny(morphed, edges, dynamicLow, dynamicHigh);
        console.log('[GRID_DETECT] ✅ Applied dynamic Canny edge detection', {
            lowThreshold: Math.round(dynamicLow),
            highThreshold: Math.round(dynamicHigh),
            basedOnBrightness: Math.round(meanValue)
        });

        // 🖼️ DEBUG: Show edge detection result
        debugShowMat(edges, '4️⃣ Enhanced Edge Detection Result');
        await debugWait(DEBUG_DISPLAY_DURATION, 'Enhanced Edge Detection Result');

        // Clean up intermediate matrices (set to null to avoid double cleanup)
        if (preprocessed) {
            preprocessed.delete();
            preprocessed = null;
        }
        if (morphed) {
            morphed.delete();
            morphed = null;
        }
        if (adaptive) {
            adaptive.delete();
            adaptive = null;
        }

        // 2) Contours
        console.log('[GRID_DETECT] 🎯 Step 2: Finding contours');
        contours = new cv.MatVector();
        hierarchy = new cv.Mat();
        cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

        console.log('[GRID_DETECT] ✅ Found contours', { count: contours.size() });

        // Collect contours with their areas for sorting
        const contourData = [];
        for (let i = 0; i < contours.size(); i++) {
            const contour = contours.get(i);
            const area = cv.contourArea(contour);
            contourData.push({ contour, area, index: i });
        }

        // Sort contours by area (descending)
        contourData.sort((a, b) => b.area - a.area);
        console.log('[GRID_DETECT] ✅ Sorted contours by area', {
            largest: contourData[0]?.area || 0,
            totalContours: contourData.length
        });

        // 3) Individual tile detection - find all 30 letter tiles
        console.log('[GRID_DETECT] 🎯 Step 3: Finding individual Wordle letter tiles');
        let tileDetectionCandidates = [];
        let rectangularCandidates = 0;
        const imageArea = srcMat.rows * srcMat.cols;

        for (const { contour, area } of contourData) {
            const approx = new cv.Mat();

            try {
                // Calculate perimeter and approximate polygon
                const peri = cv.arcLength(contour, true);
                cv.approxPolyDP(contour, approx, APPROX_EPSILON_FACTOR * peri, true);

                // Check if we have exactly 4 vertices (rectangle)
                if (approx.rows === 4) {
                    rectangularCandidates++;

                    // Extract the 4 corner points
                    const points = [];
                    for (let j = 0; j < 4; j++) {
                        const point = new cv.Point(
                            approx.data32S[j * 2],
                            approx.data32S[j * 2 + 1]
                        );
                        points.push(point);
                    }

                    // Calculate bounding rectangle and properties
                    const boundingRect = cv.boundingRect(approx);
                    const aspectRatio = boundingRect.width / boundingRect.height;
                    const areaRatio = area / imageArea;

                    // Validate as individual tile (smaller size, square aspect ratio)
                    const isValidTileSize = areaRatio >= MIN_TILE_AREA_RATIO && areaRatio <= MAX_TILE_AREA_RATIO;
                    const isValidTileAspect = aspectRatio >= MIN_TILE_ASPECT_RATIO && aspectRatio <= MAX_TILE_ASPECT_RATIO;

                    if (rectangularCandidates <= 50) { // Only debug first 50 candidates to avoid spam
                        console.log('[GRID_DETECT] 🔍 Tile candidate analysis', {
                            candidateNumber: rectangularCandidates,
                            area: Math.round(area),
                            areaRatio: (areaRatio * 100).toFixed(3) + '%',
                            aspectRatio: aspectRatio.toFixed(2),
                            isValidTileSize,
                            isValidTileAspect,
                            width: boundingRect.width,
                            height: boundingRect.height
                        });

                        // 🖼️ DEBUG: Show tile candidates (but only first few to avoid overwhelming)
                        if (rectangularCandidates <= 1 && isValidTileSize && isValidTileAspect) {
                            let candidateVisualization = null;
                            try {
                                candidateVisualization = visualizeTileCandidate(srcMat, points, rectangularCandidates, true);
                                debugShowMat(candidateVisualization, `🔍 Tile ${rectangularCandidates} (✅ Valid Letter Tile)`);
                                await debugWait(DEBUG_DISPLAY_DURATION, `Letter Tile Candidate ${rectangularCandidates}`);
                            } finally {
                                if (candidateVisualization && !candidateVisualization.isDeleted()) {
                                    candidateVisualization.delete();
                                }
                            }
                        }
                    }

                    if (isValidTileSize && isValidTileAspect) {
                        // Calculate center point
                        const centerX = boundingRect.x + boundingRect.width / 2;
                        const centerY = boundingRect.y + boundingRect.height / 2;
                        const center = new cv.Point(centerX, centerY);

                        tileDetectionCandidates.push({
                            corners: points,
                            center: center,
                            boundingRect: boundingRect,
                            area: area,
                            aspectRatio: aspectRatio
                        });

                        console.log('[GRID_DETECT] ✅ Valid letter tile found', {
                            tileNumber: tileDetectionCandidates.length,
                            center: `(${Math.round(centerX)}, ${Math.round(centerY)})`,
                            size: `${boundingRect.width}x${boundingRect.height}`
                        });
                    }
                }
            } finally {
                approx.delete();
            }
        }

        console.log('[GRID_DETECT] 📊 Individual tile detection results', {
            rectangularCandidates,
            validTileCandidates: tileDetectionCandidates.length,
            expectedTiles: EXPECTED_TILE_COUNT
        });

        // 4) Validate tile count and apply fallback if needed
        if (tileDetectionCandidates.length !== EXPECTED_TILE_COUNT) {
            console.warn('[GRID_DETECT] ⚠️ Tile count mismatch, trying relaxed criteria...', {
                found: tileDetectionCandidates.length,
                expected: EXPECTED_TILE_COUNT
            });

            if (tileDetectionCandidates.length < EXPECTED_TILE_COUNT) {
                // Too few tiles - try with more relaxed size criteria
                const relaxedCandidates = [];
                for (const { contour, area } of contourData.slice(0, 100)) { // Check more contours
                    const approx = new cv.Mat();
                    try {
                        const peri = cv.arcLength(contour, true);
                        cv.approxPolyDP(contour, approx, APPROX_EPSILON_FACTOR * peri, true);

                        if (approx.rows === 4) {
                            const boundingRect = cv.boundingRect(approx);
                            const aspectRatio = boundingRect.width / boundingRect.height;
                            const areaRatio = area / imageArea;

                            // More relaxed criteria
                            if (areaRatio >= MIN_TILE_AREA_RATIO * 0.5 &&
                                areaRatio <= MAX_TILE_AREA_RATIO * 2 &&
                                aspectRatio >= 0.5 && aspectRatio <= 2.0) {

                                const points = [];
                                for (let j = 0; j < 4; j++) {
                                    const point = new cv.Point(
                                        approx.data32S[j * 2],
                                        approx.data32S[j * 2 + 1]
                                    );
                                    points.push(point);
                                }

                                const centerX = boundingRect.x + boundingRect.width / 2;
                                const centerY = boundingRect.y + boundingRect.height / 2;
                                const center = new cv.Point(centerX, centerY);

                                relaxedCandidates.push({
                                    corners: points,
                                    center: center,
                                    boundingRect: boundingRect,
                                    area: area,
                                    aspectRatio: aspectRatio
                                });

                                if (relaxedCandidates.length >= EXPECTED_TILE_COUNT) break;
                            }
                        }
                    } finally {
                        approx.delete();
                    }
                }

                console.log('[GRID_DETECT] 🔄 Relaxed criteria found', {
                    relaxedCandidates: relaxedCandidates.length
                });

                if (relaxedCandidates.length >= tileDetectionCandidates.length) {
                    tileDetectionCandidates = relaxedCandidates;
                }
            } else if (tileDetectionCandidates.length > EXPECTED_TILE_COUNT) {
                // Too many tiles - filter by best aspect ratios (closest to 1.0)
                tileDetectionCandidates.sort((a, b) =>
                    Math.abs(a.aspectRatio - 1.0) - Math.abs(b.aspectRatio - 1.0)
                );
                tileDetectionCandidates = tileDetectionCandidates.slice(0, EXPECTED_TILE_COUNT);
                console.log('[GRID_DETECT] ✂️ Filtered to best 30 tiles by aspect ratio');
            }
        }

        if (tileDetectionCandidates.length < 15) { // Need at least half the tiles
            console.error('[GRID_DETECT] ❌ Insufficient tiles found', {
                found: tileDetectionCandidates.length,
                minimum: 15
            });
            throw new GridNotFoundError(`Only ${tileDetectionCandidates.length} letter tiles detected. Need at least 15. Please ensure the Wordle grid is clearly visible.`);
        }

        // 5) Sort tiles by position to determine grid coordinates (6 rows x 5 cols)
        console.log('[GRID_DETECT] 🎯 Step 5: Sorting tiles by position to determine grid layout');
        const sortedTiles = sortTilesByGridPosition(tileDetectionCandidates);

        // 🖼️ DEBUG: Show final grid layout
        let finalVisualization = null;
        try {
            finalVisualization = visualizeAllTiles(srcMat, sortedTiles);
            debugShowMat(finalVisualization, `✅ Final Grid Layout (${sortedTiles.length} tiles)`);
            await debugWait(DEBUG_DISPLAY_DURATION, 'Final Grid Layout');
        } finally {
            if (finalVisualization && !finalVisualization.isDeleted()) {
                finalVisualization.delete();
            }
        }

        console.log('[GRID_DETECT] ✅ Grid detection completed successfully');
        console.log('[GRID_DETECT] 📋 Final grid layout:', {
            totalTiles: sortedTiles.length,
            rows: Math.max(...sortedTiles.map(t => t.row)) + 1,
            cols: Math.max(...sortedTiles.map(t => t.col)) + 1,
            firstRowTiles: sortedTiles.filter(t => t.row === 0).length,
            samplePositions: sortedTiles.slice(0, 5).map(t => `(${t.row},${t.col})`).join(', ')
        });

        return {
            tiles: sortedTiles
        };

    } catch (error) {
        console.error('[GRID_DETECT] ❌ Grid detection failed:', error.message);
        if (error instanceof GridNotFoundError) {
            throw error;
        }
        throw new GridNotFoundError('Wordle grid not found or not rectangular');
    } finally {
        // Memory safety - delete all temporary Mats (check for null to avoid double deletes)
        try {
            if (gray && !gray.isDeleted()) gray.delete();
        } catch (e) { /* ignore if already deleted */ }

        try {
            if (blur && !blur.isDeleted()) blur.delete();
        } catch (e) { /* ignore if already deleted */ }

        try {
            if (edges && !edges.isDeleted()) edges.delete();
        } catch (e) { /* ignore if already deleted */ }

        try {
            if (hierarchy && !hierarchy.isDeleted()) hierarchy.delete();
        } catch (e) { /* ignore if already deleted */ }

        try {
            if (adaptive && adaptive !== null && !adaptive.isDeleted()) adaptive.delete();
        } catch (e) { /* ignore if already deleted */ }

        try {
            if (morphed && morphed !== null && !morphed.isDeleted()) morphed.delete();
        } catch (e) { /* ignore if already deleted */ }

        try {
            if (contours && !contours.isDeleted()) {
                // Clean up individual contours
                for (let i = 0; i < contours.size(); i++) {
                    try {
                        const contour = contours.get(i);
                        if (contour && !contour.isDeleted()) contour.delete();
                    } catch (e) { /* ignore if already deleted */ }
                }
                contours.delete();
            }
        } catch (e) { /* ignore if already deleted */ }
    }
}

/**
 * Sorts tiles by their spatial position to determine grid coordinates
 * @param {Array} tiles - Array of tile objects with center points
 * @returns {Array} Tiles with assigned row and col properties
 */
function sortTilesByGridPosition(tiles) {
    console.log('[GRID_DETECT] 🧮 Calculating grid positions for', tiles.length, 'tiles');

    // Sort tiles by Y position first (rows), then by X position (columns)
    const sortedTiles = [...tiles].sort((a, b) => {
        const yDiff = a.center.y - b.center.y;
        if (Math.abs(yDiff) < 20) { // If Y positions are close (same row), sort by X
            return a.center.x - b.center.x;
        }
        return yDiff;
    });

    // Group tiles into rows based on Y positions
    const rowGroups = [];
    let currentRowGroup = [sortedTiles[0]];
    let currentRowY = sortedTiles[0].center.y;

    for (let i = 1; i < sortedTiles.length; i++) {
        const tile = sortedTiles[i];
        const yDiff = Math.abs(tile.center.y - currentRowY);

        if (yDiff < 30) { // Same row (adjust threshold as needed)
            currentRowGroup.push(tile);
        } else {
            // Sort current row by X position
            currentRowGroup.sort((a, b) => a.center.x - b.center.x);
            rowGroups.push(currentRowGroup);

            currentRowGroup = [tile];
            currentRowY = tile.center.y;
        }
    }

    // Don't forget the last row
    currentRowGroup.sort((a, b) => a.center.x - b.center.x);
    rowGroups.push(currentRowGroup);

    console.log('[GRID_DETECT] 📊 Detected row groups:', {
        totalRows: rowGroups.length,
        tilesPerRow: rowGroups.map(row => row.length),
        expectedRows: 6,
        expectedCols: 5
    });

    // Assign row and column indices
    const tilesWithPositions = [];
    for (let rowIndex = 0; rowIndex < rowGroups.length; rowIndex++) {
        const row = rowGroups[rowIndex];
        for (let colIndex = 0; colIndex < row.length; colIndex++) {
            const tile = row[colIndex];
            tilesWithPositions.push({
                ...tile,
                row: rowIndex,
                col: colIndex
            });
        }
    }

    return tilesWithPositions;
}

/**
 * Debug visualization of individual tile candidate
 * @param {cv.Mat} srcMat - Source image
 * @param {cv.Point[]} corners - 4 corner points of tile
 * @param {number} tileNumber - Tile number for labeling
 * @param {boolean} isValid - Whether tile passed validation
 * @returns {cv.Mat} Image with tile overlay
 */
function visualizeTileCandidate(srcMat, corners, tileNumber, isValid) {
    let resultMat = null;
    let points = null;
    let contour = null;

    try {
        resultMat = srcMat.clone();

        // Colors for valid/invalid tiles
        const borderColor = isValid ? new cv.Scalar(0, 255, 0, 255) : new cv.Scalar(0, 0, 255, 255);
        const pointColor = isValid ? new cv.Scalar(255, 255, 0, 255) : new cv.Scalar(255, 0, 255, 255);

        // Draw tile boundary
        points = new cv.MatVector();
        contour = cv.matFromArray(4, 1, cv.CV_32SC2, [
            corners[0].x, corners[0].y,
            corners[1].x, corners[1].y,
            corners[2].x, corners[2].y,
            corners[3].x, corners[3].y
        ]);
        points.push_back(contour);

        cv.drawContours(resultMat, points, -1, borderColor, 2);

        // Draw center point
        const center = corners.reduce((acc, point) => ({
            x: acc.x + point.x / 4,
            y: acc.y + point.y / 4
        }), { x: 0, y: 0 });

        cv.circle(resultMat, new cv.Point(center.x, center.y), 4, pointColor, -1);

        // Add tile number label
        const labelPos = new cv.Point(center.x - 15, center.y - 10);
        cv.putText(resultMat, `T${tileNumber}`, labelPos, cv.FONT_HERSHEY_SIMPLEX, 0.5, borderColor, 2);

        return resultMat;

    } catch (error) {
        // If error occurred, clean up and return a placeholder
        if (resultMat && !resultMat.isDeleted()) resultMat.delete();
        console.error('Error in visualizeTileCandidate:', error);
        return srcMat.clone(); // Return a simple clone as fallback
    } finally {
        // Clean up temporary objects
        try {
            if (contour && !contour.isDeleted()) contour.delete();
        } catch (e) { /* ignore */ }

        try {
            if (points && !points.isDeleted()) points.delete();
        } catch (e) { /* ignore */ }
    }
}

/**
 * Visualization of all tiles with grid positions
 * @param {cv.Mat} srcMat - Source image
 * @param {Array} tiles - Array of tiles with row/col positions
 * @returns {cv.Mat} Image with all tiles labeled
 */
function visualizeAllTiles(srcMat, tiles) {
    let resultMat = null;

    try {
        resultMat = srcMat.clone();

        // Color coding for different rows
        const rowColors = [
            new cv.Scalar(255, 0, 0, 255),   // Row 0: Red
            new cv.Scalar(255, 165, 0, 255), // Row 1: Orange
            new cv.Scalar(255, 255, 0, 255), // Row 2: Yellow
            new cv.Scalar(0, 255, 0, 255),   // Row 3: Green
            new cv.Scalar(0, 0, 255, 255),   // Row 4: Blue
            new cv.Scalar(128, 0, 128, 255)  // Row 5: Purple
        ];

        for (const tile of tiles) {
            let points = null;
            let contour = null;

            try {
                const color = rowColors[tile.row % rowColors.length];

                // Draw tile boundary
                points = new cv.MatVector();
                contour = cv.matFromArray(4, 1, cv.CV_32SC2, [
                    tile.corners[0].x, tile.corners[0].y,
                    tile.corners[1].x, tile.corners[1].y,
                    tile.corners[2].x, tile.corners[2].y,
                    tile.corners[3].x, tile.corners[3].y
                ]);
                points.push_back(contour);

                cv.drawContours(resultMat, points, -1, color, 3);

                // Draw center point and position label
                cv.circle(resultMat, tile.center, 5, color, -1);

                const labelPos = new cv.Point(tile.center.x - 15, tile.center.y + 5);
                cv.putText(resultMat, `${tile.row},${tile.col}`, labelPos,
                    cv.FONT_HERSHEY_SIMPLEX, 0.6, color, 2);

            } finally {
                // Clean up per-tile objects
                try {
                    if (contour && !contour.isDeleted()) contour.delete();
                } catch (e) { /* ignore */ }

                try {
                    if (points && !points.isDeleted()) points.delete();
                } catch (e) { /* ignore */ }
            }
        }

        return resultMat;

    } catch (error) {
        // If error occurred, clean up and return a placeholder
        if (resultMat && !resultMat.isDeleted()) resultMat.delete();
        console.error('Error in visualizeAllTiles:', error);
        return srcMat.clone(); // Return a simple clone as fallback
    }
}

/**
 * Debug visualization of grid candidate during detection process
 * @param {cv.Mat} srcMat - Source image
 * @param {cv.Point[]} corners - 4 corner points of candidate
 * @param {number} candidateNumber - Candidate number for labeling
 * @param {boolean} isValid - Whether candidate passed validation
 * @returns {cv.Mat} Image with candidate overlay
 */
function visualizeGridCandidate(srcMat, corners, candidateNumber, isValid) {
    const resultMat = srcMat.clone();

    // Choose colors based on validity
    const borderColor = isValid ? new cv.Scalar(0, 255, 0, 255) : new cv.Scalar(0, 0, 255, 255); // Green if valid, Red if invalid
    const pointColor = isValid ? new cv.Scalar(0, 255, 255, 255) : new cv.Scalar(255, 0, 255, 255); // Cyan if valid, Magenta if invalid

    // Draw corner points with numbers
    for (let i = 0; i < corners.length; i++) {
        cv.circle(resultMat, corners[i], 8, pointColor, -1);

        // Add corner labels (TL, TR, BR, BL)
        const labels = ['TL', 'TR', 'BR', 'BL'];
        const textPos = new cv.Point(corners[i].x + 12, corners[i].y - 5);
        cv.putText(resultMat, labels[i], textPos, cv.FONT_HERSHEY_SIMPLEX, 0.6, pointColor, 2);
    }

    // Draw grid outline
    const points = new cv.MatVector();
    const contour = cv.matFromArray(4, 1, cv.CV_32SC2, [
        corners[0].x, corners[0].y,
        corners[1].x, corners[1].y,
        corners[2].x, corners[2].y,
        corners[3].x, corners[3].y
    ]);
    points.push_back(contour);

    cv.drawContours(resultMat, points, -1, borderColor, 4);

    // Add candidate number label at top-left of detected region
    const topLeft = corners.reduce((min, point) =>
        (point.x + point.y < min.x + min.y) ? point : min
    );
    const labelPos = new cv.Point(Math.max(10, topLeft.x - 50), Math.max(30, topLeft.y - 10));
    const statusText = isValid ? '✅ VALID' : '❌ INVALID';
    cv.putText(resultMat, `#${candidateNumber} ${statusText}`, labelPos,
        cv.FONT_HERSHEY_SIMPLEX, 0.8, borderColor, 2);

    contour.delete();
    points.delete();

    return resultMat;
}

/**
 * Debug visualization of detected grid (optional utility)
 * @param {cv.Mat} srcMat - Source image
 * @param {[cv.Point, cv.Point, cv.Point, cv.Point]} corners - Detected corners
 * @returns {cv.Mat} Image with grid overlay
 */
export function visualizeDetectedGrid(srcMat, corners) {
    const resultMat = srcMat.clone();

    // Draw corner points
    for (let i = 0; i < corners.length; i++) {
        const color = new cv.Scalar(255, 0, 0, 255); // Red
        cv.circle(resultMat, corners[i], 10, color, -1);
    }

    // Draw grid outline
    const points = new cv.MatVector();
    const contour = cv.matFromArray(4, 1, cv.CV_32SC2, [
        corners[0].x, corners[0].y,
        corners[1].x, corners[1].y,
        corners[2].x, corners[2].y,
        corners[3].x, corners[3].y
    ]);
    points.push_back(contour);

    const color = new cv.Scalar(0, 255, 0, 255); // Green
    cv.drawContours(resultMat, points, -1, color, 3);

    contour.delete();
    points.delete();

    return resultMat;
}