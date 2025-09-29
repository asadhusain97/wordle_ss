/**
 * OpenCV.js bootstrap utilities for Wordle image processing
 * Handles OpenCV initialization, canvas operations, and ImageBitmap conversions
 */

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