/**
 * Wordle grid detection using OpenCV contour analysis
 * Detects the main Wordle grid as a 4-point quadrilateral
 */

// Processing constants for tuning
const BLUR_KERNEL_SIZE = 5;
const CANNY_THRESHOLD_LOW = 50;
const CANNY_THRESHOLD_HIGH = 150;
const APPROX_EPSILON_FACTOR = 0.02;

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
 * Detects the main Wordle grid in an image
 * @param {cv.Mat} srcMat - Source image matrix in RGBA format
 * @returns {{cornersTLTRBRBL: [cv.Point, cv.Point, cv.Point, cv.Point]}} Grid corners
 * @throws {GridNotFoundError} If no suitable grid is found
 */
export function detectWordleGrid(srcMat) {
    console.log('[GRID_DETECT] 🔄 Starting grid detection...', {
        imageSize: `${srcMat.cols}x${srcMat.rows}`,
        channels: srcMat.channels()
    });

    let gray, blur, edges, contours, hierarchy;

    try {
        // 1) Preprocess
        console.log('[GRID_DETECT] 🎯 Step 1: Preprocessing image');

        // Convert RGBA to grayscale
        gray = new cv.Mat();
        cv.cvtColor(srcMat, gray, cv.COLOR_RGBA2GRAY);
        console.log('[GRID_DETECT] ✅ Converted to grayscale');

        // Apply Gaussian blur
        blur = new cv.Mat();
        cv.GaussianBlur(gray, blur, new cv.Size(BLUR_KERNEL_SIZE, BLUR_KERNEL_SIZE), 0, 0);
        console.log('[GRID_DETECT] ✅ Applied Gaussian blur', { kernelSize: BLUR_KERNEL_SIZE });

        // Apply Canny edge detection
        edges = new cv.Mat();
        cv.Canny(blur, edges, CANNY_THRESHOLD_LOW, CANNY_THRESHOLD_HIGH);
        console.log('[GRID_DETECT] ✅ Applied Canny edge detection', {
            lowThreshold: CANNY_THRESHOLD_LOW,
            highThreshold: CANNY_THRESHOLD_HIGH
        });

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

        // 3) Polygon approx + pick largest rectangle
        console.log('[GRID_DETECT] 🎯 Step 3: Finding rectangular polygons');
        let bestCandidate = null;
        let bestArea = 0;
        let rectangularCandidates = 0;

        for (const { contour, area } of contourData) {
            const approx = new cv.Mat();

            try {
                // Calculate perimeter and approximate polygon
                const peri = cv.arcLength(contour, true);
                cv.approxPolyDP(contour, approx, APPROX_EPSILON_FACTOR * peri, true);

                // Check if we have exactly 4 vertices (rectangle)
                if (approx.rows === 4 && area > bestArea) {
                    rectangularCandidates++;
                    console.log('[GRID_DETECT] 🎯 Found rectangular candidate', {
                        candidateNumber: rectangularCandidates,
                        area: Math.round(area),
                        perimeter: Math.round(peri)
                    });

                    // Extract the 4 corner points
                    const points = [];
                    for (let j = 0; j < 4; j++) {
                        const point = new cv.Point(
                            approx.data32S[j * 2],
                            approx.data32S[j * 2 + 1]
                        );
                        points.push(point);
                    }

                    bestCandidate = points;
                    bestArea = area;
                }
            } finally {
                approx.delete();
            }
        }

        console.log('[GRID_DETECT] 📊 Rectangle search results', {
            rectangularCandidates,
            bestArea: Math.round(bestArea),
            foundValidGrid: !!bestCandidate
        });

        if (!bestCandidate) {
            console.error('[GRID_DETECT] ❌ No rectangular grid found');
            throw new GridNotFoundError('Wordle grid not found or not rectangular');
        }

        // 4) Order corners TL, TR, BR, BL
        console.log('[GRID_DETECT] 🎯 Step 4: Ordering corners');
        const orderedCorners = orderCorners(bestCandidate);
        console.log('[GRID_DETECT] ✅ Corners ordered', {
            TL: `(${orderedCorners[0].x}, ${orderedCorners[0].y})`,
            TR: `(${orderedCorners[1].x}, ${orderedCorners[1].y})`,
            BR: `(${orderedCorners[2].x}, ${orderedCorners[2].y})`,
            BL: `(${orderedCorners[3].x}, ${orderedCorners[3].y})`
        });

        // 5) Return result
        console.log('[GRID_DETECT] ✅ Grid detection completed successfully');
        return {
            cornersTLTRBRBL: orderedCorners
        };

    } catch (error) {
        console.error('[GRID_DETECT] ❌ Grid detection failed:', error.message);
        if (error instanceof GridNotFoundError) {
            throw error;
        }
        throw new GridNotFoundError('Wordle grid not found or not rectangular');
    } finally {
        // Memory safety - delete all temporary Mats
        if (gray) gray.delete();
        if (blur) blur.delete();
        if (edges) edges.delete();
        if (hierarchy) hierarchy.delete();
        if (contours) {
            // Clean up individual contours
            for (let i = 0; i < contours.size(); i++) {
                const contour = contours.get(i);
                contour.delete();
            }
            contours.delete();
        }
    }
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