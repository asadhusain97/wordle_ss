document.addEventListener('DOMContentLoaded', function () {
    // Debug configuration - control visual debugging features
    const DEBUG = false; // Set to false to disable visual debug images and delays
    const DEBUG_DISPLAY_DURATION = 0.5; // Seconds to display debug images (only when DEBUG = true)

    const gridCells = document.querySelectorAll('.grid-cell');
    const solveButton = document.getElementById('solve-button');
    const colorClasses = ['grey-cell', 'yellow-cell', 'green-cell'];

    // Image upload elements
    const uploadButton = document.getElementById('upload-button');
    const fileInput = document.getElementById('screenshot-upload');
    const uploadStatus = document.getElementById('upload-status');

    let currentActiveIndex = 0;
    let isProcessingInput = false;

    // Debug utility: Display uploaded file in console
    function debugShowFile(file, label = 'Debug File') {
        if (!DEBUG) return; // Skip if DEBUG is disabled

        try {
            console.group(`🖼️ [DEBUG IMAGE] ${label}`);

            // Create URL for the file
            const url = URL.createObjectURL(file);

            // Log file info
            console.log('📊 File Info:', {
                name: file.name,
                size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
                type: file.type,
                lastModified: new Date(file.lastModified).toISOString()
            });

            // Method 1: Direct URL (works in most browsers)
            console.log('📸 Visual (copy this URL to address bar):', url);

            // Method 2: Create image element
            const img = new Image();
            img.onload = function () {
                console.log('📸 Loaded Image:', this);
            };
            img.src = url;
            img.style.maxWidth = '300px';
            img.style.border = '2px solid #ff6b6b';
            img.style.borderRadius = '4px';

            // Method 3: Show on page temporarily (most reliable)
            const debugDiv = document.createElement('div');
            debugDiv.id = 'debug-image-' + Date.now();
            debugDiv.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                z-index: 9999;
                background: rgba(0,0,0,0.8);
                padding: 10px;
                border-radius: 8px;
                max-width: 300px;
            `;

            const debugImg = document.createElement('img');
            debugImg.src = url;
            debugImg.style.cssText = `
                max-width: 280px;
                max-height: 200px;
                border-radius: 4px;
                display: block;
            `;

            const debugLabel = document.createElement('div');
            debugLabel.textContent = label;
            debugLabel.style.cssText = `
                color: white;
                font-size: 12px;
                margin-bottom: 5px;
                text-align: center;
            `;

            debugDiv.appendChild(debugLabel);
            debugDiv.appendChild(debugImg);
            document.body.appendChild(debugDiv);

            // Auto-remove after DEBUG_DISPLAY_DURATION seconds
            setTimeout(() => {
                if (debugDiv.parentNode) {
                    debugDiv.remove();
                }
                URL.revokeObjectURL(url);
            }, DEBUG_DISPLAY_DURATION * 1000);

            console.log(`📸 Also displaying on page (top-right corner for ${DEBUG_DISPLAY_DURATION} seconds)`);
            console.groupEnd();

        } catch (error) {
            console.error(`[DEBUG IMAGE] Failed to display ${label}:`, error.message);
        }
    }

    // Image upload functionality
    function logUploadEvent(type, message, data = null) {
        const timestamp = new Date().toISOString();
        console.log(`[UPLOAD ${timestamp}] ${type}: ${message}`, data || '');
    }

    function showUploadStatus(message, type) {
        uploadStatus.textContent = message;
        uploadStatus.className = `upload-status ${type}`;

        // Auto-hide after 5 seconds for success messages
        if (type === 'success') {
            setTimeout(() => {
                uploadStatus.className = 'upload-status hidden';
            }, 5000);
        }
    }

    function validateImageFile(file) {
        logUploadEvent('VALIDATION', 'Starting file validation', {
            name: file.name,
            size: file.size,
            type: file.type
        });

        // Check if file exists
        if (!file) {
            logUploadEvent('VALIDATION_ERROR', 'No file selected');
            return { valid: false, error: 'No file selected.' };
        }

        // Check file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
        if (!validTypes.includes(file.type)) {
            logUploadEvent('VALIDATION_ERROR', 'Invalid file type', { type: file.type });
            return { valid: false, error: 'Please select a valid image file (PNG, JPG, JPEG, GIF, WebP, or BMP).' };
        }

        // Check file size (10MB limit)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            logUploadEvent('VALIDATION_ERROR', 'File too large', { size: file.size, maxSize });
            return { valid: false, error: 'Image file is too large. Please select a file smaller than 10MB.' };
        }

        // Check file name for potential security issues
        const dangerousChars = /[<>:"/\\|?*]/;
        if (dangerousChars.test(file.name)) {
            logUploadEvent('VALIDATION_ERROR', 'Unsafe filename characters detected', { name: file.name });
            return { valid: false, error: 'Image filename contains unsafe characters. Please rename the file.' };
        }

        logUploadEvent('VALIDATION_SUCCESS', 'File validation passed', {
            name: file.name,
            size: file.size,
            type: file.type
        });

        return { valid: true };
    }

    async function handleImageUpload(file) {
        logUploadEvent('UPLOAD_START', 'Beginning image processing', {
            name: file.name,
            size: file.size,
            type: file.type
        });

        // Show processing status
        showUploadStatus('🔄 Processing image...', 'processing');
        uploadButton.disabled = true;
        uploadButton.textContent = '🔄 Processing...';

        try {
            // Import the processing function dynamically
            logUploadEvent('MODULE_IMPORT', 'Starting dynamic import of processWordleFromImage.js');
            console.log(`🔍 [CLIENT] Attempting to import: /process/processWordleFromImage.js`);
            console.log(`🔍 [CLIENT] Current location: ${window.location.origin}${window.location.pathname}`);
            console.log(`🔍 [CLIENT] Relative import path: /process/processWordleFromImage.js`);

            const { processAndPopulateGrid } = await import('/process/processWordleFromImage.js');

            logUploadEvent('MODULE_IMPORT_SUCCESS', 'Successfully imported processWordleFromImage.js module');

            // Process the image and populate the grid
            logUploadEvent('PROCESSING_START', 'Starting processAndPopulateGrid function');
            const result = await processAndPopulateGrid(file);

            logUploadEvent('UPLOAD_SUCCESS', 'Image processed and grid populated', {
                name: file.name,
                gridItemsDetected: result.grid.length
            });

            showUploadStatus(`✅ Image "${file.name}" processed successfully! Detected ${result.grid.length} filled cells.`, 'success');

        } catch (error) {
            console.error(`🚨 [CLIENT ERROR] Full error details:`, error);
            console.error(`🚨 [CLIENT ERROR] Error name: ${error.name}`);
            console.error(`🚨 [CLIENT ERROR] Error message: ${error.message}`);
            console.error(`🚨 [CLIENT ERROR] Error stack:`, error.stack);

            // Log specific import-related error details
            if (error.message.includes('404') || error.message.includes('Failed to fetch') || error.message.includes('import')) {
                console.error(`🚨 [CLIENT ERROR] Import failed - this is likely a 404 error`);
                console.error(`🚨 [CLIENT ERROR] Attempted import path: ./process/processWordleFromImage.js`);
            }

            logUploadEvent('UPLOAD_ERROR', 'Image processing failed', {
                name: file.name,
                error: error.message,
                errorName: error.name,
                userMessage: error.userMessage,
                fullError: error.toString()
            });

            // Show user-friendly error message
            const errorMessage = error.userMessage || 'Failed to process the image. Please try again with a clearer screenshot.';
            showUploadStatus(`❌ ${errorMessage}`, 'error');

        } finally {
            // Reset button state
            uploadButton.disabled = false;
            uploadButton.textContent = '📷 Upload Screenshot';
        }
    }

    // Upload button click handler
    uploadButton.addEventListener('click', function () {
        logUploadEvent('USER_ACTION', 'Upload button clicked');
        fileInput.click();
    });

    // File input change handler
    fileInput.addEventListener('change', function (e) {
        const file = e.target.files[0];

        if (!file) {
            logUploadEvent('USER_ACTION', 'File input cancelled - no file selected');
            return;
        }

        logUploadEvent('USER_ACTION', 'File selected for upload', {
            name: file.name,
            size: file.size,
            type: file.type
        });

        // Validate the file
        const validation = validateImageFile(file);

        if (!validation.valid) {
            showUploadStatus(`❌ ${validation.error}`, 'error');
            // Clear the input so the same file can be selected again after fixing
            fileInput.value = '';
            return;
        }

        // 🖼️ DEBUG: Show original file before processing
        debugShowFile(file, '0️⃣ Original File Before Processing');

        // Process the valid image
        handleImageUpload(file);

        // Clear the input so the same file can be selected again
        fileInput.value = '';
    });

    // Initialize all cells with grey-cell class
    gridCells.forEach((cell) => {
        cell.classList.add('grey-cell');
        cell.setAttribute('data-color-index', '0');
        // Remove content editable to prevent cursor appearance
        cell.removeAttribute('contenteditable');
    });

    // Set initial active cell
    function setActiveCell(index) {
        // Remove active class from all cells
        gridCells.forEach(cell => cell.classList.remove('active'));

        if (index >= 0 && index < gridCells.length) {
            currentActiveIndex = index;
            gridCells[currentActiveIndex].classList.add('active');
        }
    }

    // Initialize with first cell active
    setActiveCell(0);

    // Function to check if first row is complete (5 letters)
    function isFirstRowComplete() {
        for (let i = 0; i < 5; i++) {
            if (gridCells[i].textContent.trim() === '') {
                return false;
            }
        }
        return true;
    }

    // Function to update solve button state
    function updateSolveButtonState() {
        if (isFirstRowComplete()) {
            solveButton.disabled = false;
        } else {
            solveButton.disabled = true;
        }
    }

    // Initialize solve button as disabled
    updateSolveButtonState();

    // Function to check if a row is complete (5 letters)
    function isRowComplete(rowIndex) {
        const startIndex = rowIndex * 5;
        for (let i = 0; i < 5; i++) {
            if (gridCells[startIndex + i].textContent.trim() === '') {
                return false;
            }
        }
        return true;
    }

    // Function to get the current unlocked row (first incomplete row)
    function getCurrentUnlockedRow() {
        for (let row = 0; row < 6; row++) {
            if (!isRowComplete(row)) {
                return row;
            }
        }
        return 5; // All rows complete
    }

    // Function to update row lock states
    function updateRowStates() {
        const currentRow = getCurrentUnlockedRow();
        const gridRows = document.querySelectorAll('.grid-row');

        gridRows.forEach((row, index) => {
            if (index <= currentRow) {
                row.classList.remove('locked');
            } else {
                row.classList.add('locked');
            }
        });
    }

    // Function to check if a cell is in a locked row
    function isCellInLockedRow(cellIndex) {
        const rowIndex = Math.floor(cellIndex / 5);
        const currentRow = getCurrentUnlockedRow();
        return rowIndex > currentRow;
    }

    // Initialize row states (lock rows 2-6)
    updateRowStates();

    // Color cycling functionality
    function cycleColor(cell) {
        const currentIndex = parseInt(cell.getAttribute('data-color-index'));
        const nextIndex = (currentIndex + 1) % colorClasses.length;

        // Remove current color class
        colorClasses.forEach(className => {
            cell.classList.remove(className);
        });

        // Add next color class
        cell.classList.add(colorClasses[nextIndex]);
        cell.setAttribute('data-color-index', nextIndex.toString());
    }

    // Add click event listeners for color cycling
    gridCells.forEach((cell, index) => {
        cell.addEventListener('click', function (e) {
            e.preventDefault();

            // Prevent interaction with locked cells
            if (isCellInLockedRow(index)) {
                return;
            }

            // Set this cell as active when clicked
            setActiveCell(index);
            // Cycle color
            cycleColor(this);
        });
    });

    // Find next empty cell in current row or next unlocked row
    function findNextEmptyCell(startIndex) {
        const row = Math.floor(startIndex / 5);
        const col = startIndex % 5;
        const currentUnlockedRow = getCurrentUnlockedRow();

        // Check remaining cells in current row first (only if not locked)
        if (row <= currentUnlockedRow) {
            for (let c = col; c < 5; c++) {
                const cellIndex = row * 5 + c;
                if (cellIndex < gridCells.length && gridCells[cellIndex].textContent.trim() === '') {
                    return cellIndex;
                }
            }
        }

        // Check next unlocked rows only
        for (let r = Math.max(row + 1, 0); r <= currentUnlockedRow && r < 6; r++) {
            for (let c = 0; c < 5; c++) {
                const cellIndex = r * 5 + c;
                if (cellIndex < gridCells.length && gridCells[cellIndex].textContent.trim() === '') {
                    return cellIndex;
                }
            }
        }

        return -1; // No empty cells found in unlocked rows
    }

    // Find last filled cell for backspace (only in unlocked rows)
    function findLastFilledCell() {
        const currentUnlockedRow = getCurrentUnlockedRow();
        const maxIndex = Math.min(gridCells.length - 1, (currentUnlockedRow + 1) * 5 - 1);

        for (let i = maxIndex; i >= 0; i--) {
            if (gridCells[i].textContent.trim() !== '') {
                return i;
            }
        }
        return -1; // No filled cells found
    }

    // Global keydown event listener for the entire document
    document.addEventListener('keydown', function (e) {
        if (isProcessingInput) return;
        isProcessingInput = true;

        // Handle letter input
        if (e.key.match(/^[a-zA-Z]$/)) {
            e.preventDefault();

            // Prevent typing in locked rows
            if (isCellInLockedRow(currentActiveIndex)) {
                return;
            }

            // Set letter in current active cell
            if (currentActiveIndex >= 0 && currentActiveIndex < gridCells.length) {
                gridCells[currentActiveIndex].textContent = e.key.toUpperCase();

                // Update solve button state after adding letter
                updateSolveButtonState();

                // Update row states (may unlock next row)
                updateRowStates();

                // Move to next empty cell
                const nextEmpty = findNextEmptyCell(currentActiveIndex + 1);
                if (nextEmpty !== -1) {
                    setActiveCell(nextEmpty);
                } else {
                    // If no more empty cells, try to move to next cell in sequence
                    const nextIndex = currentActiveIndex + 1;
                    if (nextIndex < gridCells.length && !isCellInLockedRow(nextIndex)) {
                        setActiveCell(nextIndex);
                    }
                }
            }
        }

        // Handle backspace
        else if (e.key === 'Backspace') {
            e.preventDefault();

            // If current cell has content, clear it
            if (currentActiveIndex >= 0 && currentActiveIndex < gridCells.length) {
                const currentCell = gridCells[currentActiveIndex];

                if (currentCell.textContent.trim() !== '') {
                    currentCell.textContent = '';
                } else {
                    // Current cell is empty, find last filled cell and clear it
                    const lastFilled = findLastFilledCell();
                    if (lastFilled !== -1) {
                        gridCells[lastFilled].textContent = '';
                        setActiveCell(lastFilled);
                    }
                }

                // Update solve button state after removing letter
                updateSolveButtonState();

                // Update row states (may lock rows that were previously unlocked)
                updateRowStates();
            }
        }

        // Handle arrow keys for manual navigation
        else if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
            e.preventDefault();
            const currentRow = Math.floor(currentActiveIndex / 5);
            const currentCol = currentActiveIndex % 5;
            let targetIndex = currentActiveIndex;

            switch (e.key) {
                case 'ArrowLeft':
                    if (currentCol > 0) targetIndex = currentActiveIndex - 1;
                    break;
                case 'ArrowRight':
                    if (currentCol < 4) targetIndex = currentActiveIndex + 1;
                    break;
                case 'ArrowUp':
                    if (currentRow > 0) targetIndex = currentActiveIndex - 5;
                    break;
                case 'ArrowDown':
                    if (currentRow < 5) targetIndex = currentActiveIndex + 5;
                    break;
            }

            if (targetIndex !== currentActiveIndex && targetIndex >= 0 && targetIndex < gridCells.length && !isCellInLockedRow(targetIndex)) {
                setActiveCell(targetIndex);
            }
        }

        // Handle Enter key (prevent default)
        else if (e.key === 'Enter') {
            e.preventDefault();
            // Move to next row, first column (only if not locked)
            const currentRow = Math.floor(currentActiveIndex / 5);
            const nextRowStart = (currentRow + 1) * 5;
            if (nextRowStart < gridCells.length && !isCellInLockedRow(nextRowStart)) {
                setActiveCell(nextRowStart);
            }
        }

        setTimeout(() => {
            isProcessingInput = false;
        }, 10);
    });

    // Prevent any paste operations
    document.addEventListener('paste', function (e) {
        e.preventDefault();
    });

    // Function to show error message
    function showError(message) {
        // Remove any existing error message
        const existingError = document.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        // Create error message element
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `⚠️ ${message}`;

        // Insert error message before the solve button
        solveButton.parentNode.insertBefore(errorDiv, solveButton);

        // Auto-remove error after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }

    // Function to clear any existing error messages
    function clearError() {
        const existingError = document.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
    }

    // Solve button functionality
    solveButton.addEventListener('click', function () {
        // Prevent action if button is disabled
        if (solveButton.disabled) {
            return;
        }

        // Clear any existing errors
        clearError();

        const gridState = [];
        const incompleteRows = [];

        // Process each row
        for (let row = 0; row < 6; row++) {
            const rowData = [];
            let hasAnyLetter = false;
            let letterCount = 0;

            for (let col = 0; col < 5; col++) {
                const cellIndex = row * 5 + col;
                const cell = gridCells[cellIndex];
                const letter = cell.textContent.trim() || '';
                const colorIndex = parseInt(cell.getAttribute('data-color-index'));
                const colorState = ['grey', 'yellow', 'green'][colorIndex];

                if (letter !== '') {
                    hasAnyLetter = true;
                    letterCount++;
                }

                rowData.push({
                    letter: letter,
                    color: colorState,
                    position: col + 1
                });
            }

            // Check if row has letters but is incomplete
            if (hasAnyLetter) {
                if (letterCount < 5) {
                    incompleteRows.push(row + 1);
                } else {
                    // Only add complete rows to gridState
                    gridState.push({
                        row: row + 1,
                        cells: rowData,
                        word: rowData.map(cell => cell.letter).join(''),
                        colors: rowData.map(cell => cell.color === 'grey' ? 'b' : cell.color.charAt(0)).join('') // b, y, g format
                    });
                }
            }
        }

        // Validation: Check for incomplete rows
        if (incompleteRows.length > 0) {
            const rowText = incompleteRows.length === 1 ? 'row' : 'rows';
            const rowNumbers = incompleteRows.join(', ');
            showError(`${rowText.charAt(0).toUpperCase() + rowText.slice(1)} ${rowNumbers} ${incompleteRows.length === 1 ? 'has' : 'have'} incomplete word${incompleteRows.length === 1 ? '' : 's'}.`);
            return; // Stop execution
        }

        // Log the collected data
        console.log('Grid State:', gridState);
        console.log('Validation passed: All words are complete 5-letter words');

        // Create a more compact format for the backend API
        const compactFormat = gridState.map(row => {
            const word = row.word.toLowerCase();
            const colors = row.colors; // Already in 'b', 'y', 'g' format

            console.log(`🎯 Processing row: "${word}" with colors "${colors}"`);
            return [word, colors];
        });

        console.log('Compact Format for API:', compactFormat);

        // Clear old results before solving
        sessionStorage.removeItem('wordleResults');

        // Store data in sessionStorage for the results page
        sessionStorage.setItem('wordleGridData', JSON.stringify({
            fullState: gridState,
            compactFormat: compactFormat
        }));

        // If we have valid guesses, solve directly in browser
        if (compactFormat.length > 0) {
            // Show loading state
            solveButton.textContent = 'Solving...';
            solveButton.disabled = true;

            // Check if solver is loaded
            if (!window.WordleSolverModule) {
                showError('Solver not loaded. Please refresh the page.');
                solveButton.textContent = 'Solve';
                solveButton.disabled = false;
                return;
            }

            try {
                const { solveWordle } = window.WordleSolverModule;

                if (!solveWordle) {
                    showError('Solver function missing. Please refresh the page.');
                    solveButton.textContent = 'Solve';
                    solveButton.disabled = false;
                    return;
                }

                // Call solver asynchronously
                solveWordle(compactFormat, {
                    count: 20,
                    includeGameState: true
                }).then(result => {
                    console.log('✅ Solver result:', result);

                    // Extract suggestions
                    const allSuggestions = result.rankedGuesses ?
                        result.rankedGuesses.map(item => item.word.toUpperCase()) :
                        [];

                    const gameState = result.gameState || {};
                    const remainingCount = gameState.remainingPossibilities || allSuggestions.length;
                    const gameComplete = remainingCount === 1;

                    const response = {
                        suggestions: allSuggestions,
                        nextBest: result.nextBestGuess ? result.nextBestGuess.toUpperCase() : (allSuggestions[0] || 'SLATE'),
                        remainingCount: remainingCount,
                        gameComplete: gameComplete,
                        totalSuggestions: allSuggestions.length
                    };

                    if (gameComplete) {
                        response.message = '🎉 Puzzle solved!';
                    }

                    // Store results
                    sessionStorage.setItem('wordleResults', JSON.stringify(response));

                    // Redirect to results page
                    window.location.href = 'results.html';
                }).catch(error => {
                    console.error('Solver error:', error);
                    showError('Failed to solve. Please try again.');
                    solveButton.textContent = 'Solve';
                    solveButton.disabled = false;
                });
            } catch (error) {
                console.error('Solver not loaded:', error);
                showError('Solver not ready. Please refresh the page.');
                solveButton.textContent = 'Solve';
                solveButton.disabled = false;
            }
        } else {
            // No valid guesses, redirect directly
            window.location.href = 'results.html';
        }
    });


    // Focus on the document to capture keyboard events
    document.body.focus();
});