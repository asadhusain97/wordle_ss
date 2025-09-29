/**
 * OpenCV.js bootstrap utilities for Wordle image processing
 * Handles OpenCV initialization, canvas operations, and ImageBitmap conversions
 */

// Debug timing constant - how long to display each debug image (in seconds)
const DEBUG_DISPLAY_DURATION = 0.1;

/**
 * Ensures OpenCV.js is ready for use
 * @returns {Promise<void>} Resolves when OpenCV is fully initialized
 * @throws {Error} If OpenCV fails to load within timeout
 */
export async function ensureOpenCVReady() {
    console.log('[OPENCV] 🔄 Checking OpenCV availability...');

    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            console.error('[OPENCV] ❌ Timeout - OpenCV failed to load within 10 seconds');
            reject(new Error('OpenCV not available - failed to load within 10 seconds'));
        }, 10000);

        // Check if already loaded
        if (typeof cv !== 'undefined' && cv.Mat && cv.imread) {
            console.log('[OPENCV] ✅ OpenCV already loaded and ready');
            clearTimeout(timeout);
            resolve();
            return;
        }

        console.log('[OPENCV] ⏳ Waiting for OpenCV runtime initialization...');

        // Wait for runtime initialization
        if (typeof cv !== 'undefined') {
            cv.onRuntimeInitialized = () => {
                console.log('[OPENCV] ✅ OpenCV runtime initialized successfully');
                clearTimeout(timeout);
                resolve();
            };
        } else {
            console.log('[OPENCV] 🔍 Polling for OpenCV availability...');
            // Poll for cv availability
            const pollInterval = setInterval(() => {
                if (typeof cv !== 'undefined' && cv.Mat && cv.imread) {
                    console.log('[OPENCV] ✅ OpenCV detected and ready');
                    clearInterval(pollInterval);
                    clearTimeout(timeout);
                    resolve();
                }
            }, 100);
        }
    });
}

/**
 * Decodes a File to ImageBitmap for processing
 * @param {File} file - Image file to decode
 * @returns {Promise<ImageBitmap>} Decoded ImageBitmap
 */
export async function decodeFileToImageBitmap(file) {
    console.log('[OPENCV] 🔄 Decoding image file to ImageBitmap...', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
    });

    try {
        const imageBitmap = await createImageBitmap(file);
        console.log('[OPENCV] ✅ ImageBitmap created successfully', {
            width: imageBitmap.width,
            height: imageBitmap.height
        });
        return imageBitmap;
    } catch (error) {
        console.error('[OPENCV] ❌ Failed to decode image file:', error.message);
        throw new Error(`Failed to decode image file: ${error.message}`);
    }
}

/**
 * Converts an ImageBitmap to OpenCV Mat using canvas bridge
 * @param {ImageBitmap} imgBitmap - Source ImageBitmap
 * @returns {cv.Mat} OpenCV Mat in RGBA format
 */
export function matFromImageBitmap(imgBitmap) {
    // Create offscreen canvas for conversion
    const canvas = new OffscreenCanvas(imgBitmap.width, imgBitmap.height);
    const ctx = canvas.getContext('2d');

    // Draw ImageBitmap to canvas
    ctx.drawImage(imgBitmap, 0, 0);

    // Create Mat and read from canvas
    const mat = new cv.Mat(imgBitmap.height, imgBitmap.width, cv.CV_8UC4);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    mat.data.set(imageData.data);

    return mat;
}

/**
 * Alternative implementation using regular canvas if OffscreenCanvas not available
 * @param {ImageBitmap} imgBitmap - Source ImageBitmap
 * @returns {cv.Mat} OpenCV Mat in RGBA format
 */
export function matFromImageBitmapFallback(imgBitmap) {
    // Create regular canvas element
    const canvas = document.createElement('canvas');
    canvas.width = imgBitmap.width;
    canvas.height = imgBitmap.height;
    const ctx = canvas.getContext('2d');

    // Draw ImageBitmap to canvas
    ctx.drawImage(imgBitmap, 0, 0);

    // Use cv.imread to get Mat directly from canvas
    const mat = cv.imread(canvas);

    return mat;
}

/**
 * Smart Mat creation that uses best available method
 * @param {ImageBitmap} imgBitmap - Source ImageBitmap
 * @returns {cv.Mat} OpenCV Mat
 */
export function matFromImageBitmapSmart(imgBitmap) {
    console.log('[OPENCV] 🔄 Converting ImageBitmap to OpenCV Mat...', {
        width: imgBitmap.width,
        height: imgBitmap.height
    });

    try {
        let mat;
        // Try OffscreenCanvas first for better performance
        if (typeof OffscreenCanvas !== 'undefined') {
            console.log('[OPENCV] 🎯 Using OffscreenCanvas method');
            mat = matFromImageBitmap(imgBitmap);
        } else {
            console.log('[OPENCV] 🎯 Using regular canvas fallback method');
            mat = matFromImageBitmapFallback(imgBitmap);
        }

        console.log('[OPENCV] ✅ Mat created successfully', {
            rows: mat.rows,
            cols: mat.cols,
            channels: mat.channels(),
            type: mat.type()
        });

        return mat;
    } catch (error) {
        console.error('[OPENCV] ❌ Primary method failed, trying fallback:', error.message);
        // Fallback to regular canvas method
        const mat = matFromImageBitmapFallback(imgBitmap);
        console.log('[OPENCV] ✅ Fallback method succeeded');
        return mat;
    }
}

/**
 * Debug utility: Display OpenCV Mat as image in console
 * @param {cv.Mat} mat - OpenCV Mat to display
 * @param {string} label - Label for the debug output
 * @param {number} maxWidth - Maximum width for display (default 300px)
 */
export function debugShowMat(mat, label = 'Debug Mat', maxWidth = 300) {
    try {
        console.group(`🖼️ [DEBUG IMAGE] ${label}`);

        // Create canvas to convert Mat to image
        const canvas = document.createElement('canvas');
        cv.imshow(canvas, mat);

        // Create image element for console display
        const img = new Image();
        img.src = canvas.toDataURL();
        img.style.maxWidth = maxWidth + 'px';
        img.style.border = '2px solid #007acc';
        img.style.borderRadius = '4px';

        // Log image info
        console.log('📊 Image Info:', {
            size: `${mat.cols}x${mat.rows}`,
            channels: mat.channels(),
            type: mat.type(),
            depth: mat.depth()
        });

        // Method 1: Log canvas data URL (copy this to address bar to see image)
        const dataURL = canvas.toDataURL();
        console.log('📸 Visual (copy this URL to address bar):', dataURL);

        // Method 2: Log canvas element for inspection
        console.log('💾 Canvas (right-click to save):');
        console.log(canvas);

        // Method 3: Show on page temporarily (most reliable visual debugging)
        const debugDiv = document.createElement('div');
        debugDiv.id = 'debug-opencv-' + Date.now();
        debugDiv.style.cssText = `
            position: fixed;
            top: ${20 + (Math.random() * 200)}px;
            right: ${20 + (Math.random() * 50)}px;
            z-index: 9999;
            background: rgba(0,0,0,0.9);
            padding: 10px;
            border-radius: 8px;
            max-width: ${maxWidth + 20}px;
            border: 2px solid #007acc;
        `;

        const debugImg = document.createElement('img');
        debugImg.src = dataURL;
        debugImg.style.cssText = `
            max-width: ${maxWidth}px;
            border-radius: 4px;
            display: block;
        `;

        const debugLabel = document.createElement('div');
        debugLabel.textContent = label;
        debugLabel.style.cssText = `
            color: white;
            font-size: 11px;
            margin-bottom: 5px;
            text-align: center;
            font-family: monospace;
        `;

        debugDiv.appendChild(debugLabel);
        debugDiv.appendChild(debugImg);
        document.body.appendChild(debugDiv);

        // Auto-remove after DEBUG_DISPLAY_DURATION seconds
        setTimeout(() => {
            if (debugDiv.parentNode) {
                debugDiv.remove();
            }
        }, DEBUG_DISPLAY_DURATION * 1000);

        console.log(`📸 Also displaying on page (right side for ${DEBUG_DISPLAY_DURATION} seconds)`);

        console.groupEnd();

        // Clean up temporary canvas
        canvas.remove();

    } catch (error) {
        console.error(`[DEBUG IMAGE] Failed to display ${label}:`, error.message);
    }
}

/**
 * Debug utility: Display ImageBitmap in console
 * @param {ImageBitmap} imgBitmap - ImageBitmap to display
 * @param {string} label - Label for the debug output
 * @param {number} maxWidth - Maximum width for display (default 300px)
 */
export function debugShowImageBitmap(imgBitmap, label = 'Debug ImageBitmap', maxWidth = 300) {
    try {
        console.group(`🖼️ [DEBUG IMAGE] ${label}`);

        // Create canvas to display ImageBitmap
        const canvas = document.createElement('canvas');
        canvas.width = imgBitmap.width;
        canvas.height = imgBitmap.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(imgBitmap, 0, 0);

        // Create image element for console display
        const img = new Image();
        img.src = canvas.toDataURL();
        img.style.maxWidth = maxWidth + 'px';
        img.style.border = '2px solid #28a745';
        img.style.borderRadius = '4px';

        // Log image info
        console.log('📊 Image Info:', {
            size: `${imgBitmap.width}x${imgBitmap.height}`
        });

        // Display image in console
        console.log('📸 Visual:');
        console.log(img);

        // Also log the canvas for downloading
        console.log('💾 Canvas (right-click to save):');
        console.log(canvas);

        // Show on page temporarily (most reliable visual debugging)
        const debugDiv = document.createElement('div');
        debugDiv.id = 'debug-imagebitmap-' + Date.now();
        debugDiv.style.cssText = `
            position: fixed;
            top: ${20 + (Math.random() * 200)}px;
            left: ${20 + (Math.random() * 50)}px;
            z-index: 9999;
            background: rgba(40, 167, 69, 0.9);
            padding: 10px;
            border-radius: 8px;
            max-width: ${maxWidth + 20}px;
            border: 2px solid #28a745;
        `;

        const debugImg = document.createElement('img');
        debugImg.src = canvas.toDataURL();
        debugImg.style.cssText = `
            max-width: ${maxWidth}px;
            border-radius: 4px;
            display: block;
        `;

        const debugLabel = document.createElement('div');
        debugLabel.textContent = label;
        debugLabel.style.cssText = `
            color: white;
            font-size: 11px;
            margin-bottom: 5px;
            text-align: center;
            font-family: monospace;
        `;

        debugDiv.appendChild(debugLabel);
        debugDiv.appendChild(debugImg);
        document.body.appendChild(debugDiv);

        // Auto-remove after DEBUG_DISPLAY_DURATION seconds
        setTimeout(() => {
            if (debugDiv.parentNode) {
                debugDiv.remove();
            }
        }, DEBUG_DISPLAY_DURATION * 1000);

        console.log(`📸 Also displaying on page (left side for ${DEBUG_DISPLAY_DURATION} seconds)`);

        console.groupEnd();

        // Clean up
        canvas.remove();

    } catch (error) {
        console.error(`[DEBUG IMAGE] Failed to display ${label}:`, error.message);
    }
}