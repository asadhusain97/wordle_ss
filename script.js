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

    // Input divider element
    const inputDivider = document.getElementById('input-divider');

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

        // Keep contenteditable for mobile keyboard support
        // Add input event listener for mobile keyboard input
        cell.addEventListener('input', function (e) {
            const text = this.textContent;
            if (text.length > 0) {
                // Take only the last character and make it uppercase
                const lastChar = text.slice(-1).toUpperCase();
                if (lastChar.match(/^[A-Z]$/)) {
                    this.textContent = lastChar;

                    // Trigger the same logic as keyboard input
                    const cellIndex = Array.from(gridCells).indexOf(this);
                    if (!isCellInLockedRow(cellIndex)) {
                        // Apply real-time auto-coloring for current row
                        const currentRow = Math.floor(cellIndex / 5);
                        applyRealTimeAutoColor(currentRow);

                        updateSolveButtonState();
                        updateRowStates();

                        // Move to next empty cell
                        const nextEmpty = findNextEmptyCell(cellIndex + 1);
                        if (nextEmpty !== -1) {
                            gridCells[nextEmpty].focus();
                            setActiveCell(nextEmpty);
                        } else {
                            const nextIndex = cellIndex + 1;
                            if (nextIndex < gridCells.length && !isCellInLockedRow(nextIndex)) {
                                gridCells[nextIndex].focus();
                                setActiveCell(nextIndex);
                            }
                        }
                    }
                } else {
                    this.textContent = '';
                }
            }
        });

        // Handle focus event to set active cell
        cell.addEventListener('focus', function () {
            const cellIndex = Array.from(gridCells).indexOf(this);
            if (!isCellInLockedRow(cellIndex)) {
                setActiveCell(cellIndex);
            }
        });
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

    // Restore submitted words if returning from results page with "Add Next Word"
    function restoreSubmittedWords() {
        const submittedWordsData = sessionStorage.getItem('restoreWords');
        if (submittedWordsData) {
            try {
                const submittedWords = JSON.parse(submittedWordsData);
                console.log('🔄 Restoring submitted words:', submittedWords);

                submittedWords.forEach((rowData) => {
                    const rowIndex = rowData.row - 1;
                    rowData.cells.forEach((cellData) => {
                        const cellIndex = rowIndex * 5 + (cellData.position - 1);
                        const cell = gridCells[cellIndex];

                        cell.textContent = cellData.letter;

                        // Set color
                        const colorIndex = cellData.color === 'grey' ? 0 :
                            cellData.color === 'yellow' ? 1 : 2;
                        cell.classList.remove(...colorClasses);
                        cell.classList.add(colorClasses[colorIndex]);
                        cell.setAttribute('data-color-index', colorIndex.toString());
                    });
                });

                // Update UI state
                updateSolveButtonState();
                updateRowStates();

                // Set focus to first empty cell or first cell of next row
                const nextEmptyCell = findNextEmptyCell(0);
                if (nextEmptyCell !== -1) {
                    setActiveCell(nextEmptyCell);
                    gridCells[nextEmptyCell].focus();
                }

                // Clear the restore flag
                sessionStorage.removeItem('restoreWords');

            } catch (error) {
                console.error('❌ Error restoring submitted words:', error);
            }
        }
    }

    // Initialize with first cell active and focused
    setActiveCell(0);
    gridCells[0].focus();

    // Initialize yellow tracked letters for Rule 4
    window.yellowTrackedLetters = new Set();

    // Restore words if coming back from results
    restoreSubmittedWords();

    // Function to check if first row is complete (5 letters)
    function isFirstRowComplete() {
        for (let i = 0; i < 5; i++) {
            if (gridCells[i].textContent.trim() === '') {
                return false;
            }
        }
        return true;
    }

    // Function to check if grid has any content
    function hasGridContent() {
        for (let i = 0; i < gridCells.length; i++) {
            if (gridCells[i].textContent.trim() !== '') {
                return true;
            }
        }
        return false;
    }

    // Function to update input divider visibility
    function updateDividerVisibility() {
        if (hasGridContent()) {
            inputDivider.style.display = 'none';
        } else {
            inputDivider.style.display = 'flex';
        }
    }

    // Function to update solve button state
    function updateSolveButtonState() {
        if (isFirstRowComplete()) {
            solveButton.disabled = false;
        } else {
            solveButton.disabled = true;
        }
        // Also update divider visibility whenever we update button state
        updateDividerVisibility();
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
            } else if (index === 5 && window.yellowTrackedLetters && window.yellowTrackedLetters.size > 0) {
                // RULE 4: Last row might have some unlocked cells for yellow-tracked letters
                // Don't lock the entire row, but individual cell locking is handled by isCellInLockedRow()
                // For visual consistency, we can keep it unlocked if any yellow letters exist
                const rowHasYellowLetter = Array.from(gridCells.slice(25, 30)).some(cell => {
                    const letter = cell.textContent.trim().toUpperCase();
                    return letter !== '' && window.yellowTrackedLetters.has(letter);
                });

                if (rowHasYellowLetter) {
                    row.classList.remove('locked');
                } else {
                    row.classList.add('locked');
                }
            } else {
                row.classList.add('locked');
            }
        });
    }

    // Function to check if a cell is in a locked row
    function isCellInLockedRow(cellIndex) {
        const rowIndex = Math.floor(cellIndex / 5);
        const currentRow = getCurrentUnlockedRow();

        // RULE 4: If this is the last row (row 5, index 5), check if cell contains a yellow-tracked letter
        if (rowIndex === 5 && window.yellowTrackedLetters) {
            const cell = gridCells[cellIndex];
            const letter = cell.textContent.trim().toUpperCase();

            // If this letter has been yellow in any previous row, keep it unlocked
            if (letter !== '' && window.yellowTrackedLetters.has(letter)) {
                return false; // Don't lock this cell
            }
        }

        return rowIndex > currentRow;
    }

    // Initialize row states (lock rows 2-6)
    updateRowStates();

    /**
     * Builds a map of letter constraints from previous rows
     * Returns: { greenPositions: {letter: [positions]}, yellowLetters: Set(letters), letterPositions: {letter: [{row, col, color}]} }
     */
    function buildLetterConstraints() {
        const greenPositions = {}; // { 'A': [0, 2] } - positions where letter must be green
        const yellowLetters = new Set(); // Set of letters that were yellow anywhere
        const letterPositions = {}; // { 'A': [{row: 0, col: 1, color: 2}] } - all letter occurrences

        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 5; col++) {
                const cellIndex = row * 5 + col;
                const cell = gridCells[cellIndex];
                const letter = cell.textContent.trim().toUpperCase();
                const colorIndex = parseInt(cell.getAttribute('data-color-index'));

                if (letter === '') continue;

                // Track all positions
                if (!letterPositions[letter]) {
                    letterPositions[letter] = [];
                }
                letterPositions[letter].push({ row, col, colorIndex });

                // Track green positions
                if (colorIndex === 2) {
                    if (!greenPositions[letter]) {
                        greenPositions[letter] = [];
                    }
                    if (!greenPositions[letter].includes(col)) {
                        greenPositions[letter].push(col);
                    }
                }

                // Track yellow letters
                if (colorIndex === 1) {
                    yellowLetters.add(letter);
                }
            }
        }

        return { greenPositions, yellowLetters, letterPositions };
    }

    /**
     * Applies real-time auto-coloring when a letter is typed in the current row
     * Called immediately after a letter is added to a cell
     *
     * Rules:
     * 1. Letter was GREEN at position X → auto GREEN at position X
     * 2. Letter was GREEN, added elsewhere:
     *    2.1: Single instance → YELLOW
     *    2.2: Multiple instances → allowed yellows based on matched greens, rest GREY
     * 3. Letter was YELLOW at position X → auto YELLOW at position X
     */
    function applyRealTimeAutoColor(currentRowIndex) {
        const constraints = buildLetterConstraints();
        const rowStartIndex = currentRowIndex * 5;

        // Get all letters in current row with their positions
        const currentRowLetters = {};
        for (let col = 0; col < 5; col++) {
            const cellIndex = rowStartIndex + col;
            const cell = gridCells[cellIndex];
            const letter = cell.textContent.trim().toUpperCase();

            if (letter === '') continue;

            if (!currentRowLetters[letter]) {
                currentRowLetters[letter] = [];
            }
            currentRowLetters[letter].push({ col, cellIndex, cell });
        }

        // Apply rules for each letter in current row
        for (const letter in currentRowLetters) {
            const instances = currentRowLetters[letter];
            const wasGreen = constraints.greenPositions[letter];
            const wasYellow = constraints.yellowLetters.has(letter);

            instances.forEach((instance, index) => {
                const { col, cell } = instance;

                // RULE 1 & 2: Letter was GREEN (enhanced logic)
                if (wasGreen) {
                    const isAtGreenPosition = wasGreen.includes(col);

                    if (isAtGreenPosition) {
                        // This instance is at a green position → GREEN
                        cell.classList.remove(...colorClasses);
                        cell.classList.add(colorClasses[2]); // GREEN
                        cell.setAttribute('data-color-index', '2');
                    } else {
                        // Not at green position - need to calculate allowed yellows
                        // Count how many green positions are matched in current row
                        const matchedGreens = instances.filter(inst => wasGreen.includes(inst.col)).length;
                        const totalGreenPositions = wasGreen.length;
                        const allowedYellows = totalGreenPositions - matchedGreens;

                        if (instances.length === 1) {
                            // Single instance not at green position → YELLOW
                            cell.classList.remove(...colorClasses);
                            cell.classList.add(colorClasses[1]); // YELLOW
                            cell.setAttribute('data-color-index', '1');
                        } else {
                            // Multiple instances - assign yellows first, then grey
                            // Get all non-green instances in order
                            const nonGreenInstances = instances.filter(inst => !wasGreen.includes(inst.col));
                            const nonGreenIndex = nonGreenInstances.findIndex(inst => inst.col === col);

                            if (nonGreenIndex < allowedYellows) {
                                // This is one of the allowed yellow instances
                                cell.classList.remove(...colorClasses);
                                cell.classList.add(colorClasses[1]); // YELLOW
                                cell.setAttribute('data-color-index', '1');
                            } else {
                                // Beyond allowed yellows → GREY
                                cell.classList.remove(...colorClasses);
                                cell.classList.add(colorClasses[0]); // GREY
                                cell.setAttribute('data-color-index', '0');
                            }
                        }
                    }
                }
                // RULE 3: Letter was YELLOW at this position
                else if (wasYellow && constraints.letterPositions[letter]) {
                    const yellowAtSamePosition = constraints.letterPositions[letter].some(
                        pos => pos.col === col && pos.colorIndex === 1
                    );

                    if (yellowAtSamePosition) {
                        cell.classList.remove(...colorClasses);
                        cell.classList.add(colorClasses[1]); // YELLOW
                        cell.setAttribute('data-color-index', '1');
                    }
                }
            });
        }
    }

    /**
     * Applies autocolor rules to propagate colors down the grid
     *
     * Rules:
     * 1. Green letter with multiple instances in following word:
     *    - Letter at same position → GREEN
     *
     * 2. Yellow letter with single instance in following word:
     *    - If at same position → YELLOW
     *
     * 3. Yellow letter with multiple instances in following word:
     *    - Letter at same position → YELLOW
     */
    function applyAutoColorRules() {
        // Track all yellow letters across all rows (for Rule 4)
        const yellowLettersInGrid = new Set();

        // First pass: identify all letters that have been yellow anywhere
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 5; col++) {
                const cellIndex = row * 5 + col;
                const cell = gridCells[cellIndex];
                const letter = cell.textContent.trim().toUpperCase();
                const colorIndex = parseInt(cell.getAttribute('data-color-index'));

                if (letter !== '' && colorIndex === 1) { // 1 = yellow
                    yellowLettersInGrid.add(letter);
                }
            }
        }

        // Store for Rule 4
        window.yellowTrackedLetters = yellowLettersInGrid;

        // Build a map of all letter occurrences by row and position
        const lettersByRow = Array.from({ length: 6 }, () => ({}));

        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 5; col++) {
                const cellIndex = row * 5 + col;
                const cell = gridCells[cellIndex];
                const letter = cell.textContent.trim().toUpperCase();
                const colorIndex = parseInt(cell.getAttribute('data-color-index'));

                if (letter === '') continue;

                if (!lettersByRow[row][letter]) {
                    lettersByRow[row][letter] = [];
                }
                lettersByRow[row][letter].push({ col, colorIndex, cellIndex });
            }
        }

        // Process each row and apply rules to rows below
        for (let sourceRow = 0; sourceRow < 6; sourceRow++) {
            // Get all letters in this source row
            for (let sourceCol = 0; sourceCol < 5; sourceCol++) {
                const sourceCellIndex = sourceRow * 5 + sourceCol;
                const sourceCell = gridCells[sourceCellIndex];
                const sourceLetter = sourceCell.textContent.trim().toUpperCase();
                const sourceColor = parseInt(sourceCell.getAttribute('data-color-index'));

                if (sourceLetter === '') continue;

                // Apply rules to all rows below this one
                for (let targetRow = sourceRow + 1; targetRow < 6; targetRow++) {
                    const targetWord = lettersByRow[targetRow][sourceLetter];

                    if (!targetWord || targetWord.length === 0) continue;

                    const instanceCount = targetWord.length;
                    const samePositionInstance = targetWord.find(inst => inst.col === sourceCol);

                    // RULE 1: Source is GREEN (colorIndex = 2)
                    if (sourceColor === 2) {
                        if (instanceCount > 1) {
                            // Multiple instances: green at same position
                            targetWord.forEach(inst => {
                                const targetCell = gridCells[inst.cellIndex];

                                if (inst.col === sourceCol) {
                                    // Same position → GREEN
                                    targetCell.classList.remove(...colorClasses);
                                    targetCell.classList.add(colorClasses[2]);
                                    targetCell.setAttribute('data-color-index', '2');
                                }
                            });
                        } else {
                            // Single instance at same position → GREEN
                            if (samePositionInstance) {
                                const targetCell = gridCells[samePositionInstance.cellIndex];
                                targetCell.classList.remove(...colorClasses);
                                targetCell.classList.add(colorClasses[2]);
                                targetCell.setAttribute('data-color-index', '2');
                            }
                        }
                    }

                    // RULE 2 & 3: Source is YELLOW (colorIndex = 1)
                    else if (sourceColor === 1) {
                        if (instanceCount === 1) {
                            // RULE 2: Single instance
                            const singleInstance = targetWord[0];
                            const targetCell = gridCells[singleInstance.cellIndex];

                            if (singleInstance.col === sourceCol) {
                                // Same position → YELLOW
                                targetCell.classList.remove(...colorClasses);
                                targetCell.classList.add(colorClasses[1]);
                                targetCell.setAttribute('data-color-index', '1');
                            }
                        } else {
                            // RULE 3: Multiple instances
                            targetWord.forEach(inst => {
                                const targetCell = gridCells[inst.cellIndex];

                                if (inst.col === sourceCol) {
                                    // Same position → YELLOW
                                    targetCell.classList.remove(...colorClasses);
                                    targetCell.classList.add(colorClasses[1]);
                                    targetCell.setAttribute('data-color-index', '1');
                                }
                            });
                        }
                    }
                }
            }
        }
    }


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

        // Apply autocolor rules after color change
        applyAutoColorRules();
    }

    // Add click event listeners for color cycling
    gridCells.forEach((cell, index) => {
        cell.addEventListener('click', function (e) {
            // Don't prevent default - allow focus to work

            // Prevent interaction with locked cells
            if (isCellInLockedRow(index)) {
                e.preventDefault();
                return;
            }

            // Set this cell as active when clicked and focus it
            setActiveCell(index);
            this.focus();

            // Cycle color only if cell has content
            if (this.textContent.trim() !== '') {
                cycleColor(this);
            }
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

                // Apply real-time auto-coloring for current row
                const currentRow = Math.floor(currentActiveIndex / 5);
                applyRealTimeAutoColor(currentRow);

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
                let deletedFromRow = Math.floor(currentActiveIndex / 5);

                if (currentCell.textContent.trim() !== '') {
                    currentCell.textContent = '';
                } else {
                    // Current cell is empty, find last filled cell and clear it
                    const lastFilled = findLastFilledCell();
                    if (lastFilled !== -1) {
                        deletedFromRow = Math.floor(lastFilled / 5);
                        gridCells[lastFilled].textContent = '';
                        setActiveCell(lastFilled);
                    }
                }

                // Reapply real-time auto-coloring for the affected row
                applyRealTimeAutoColor(deletedFromRow);

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

        // Handle Enter key
        else if (e.key === 'Enter') {
            e.preventDefault();
            // If solve button is enabled, click it
            if (!solveButton.disabled) {
                solveButton.click();
            } else {
                // Otherwise, move to next row, first column (only if not locked)
                const currentRow = Math.floor(currentActiveIndex / 5);
                const nextRowStart = (currentRow + 1) * 5;
                if (nextRowStart < gridCells.length && !isCellInLockedRow(nextRowStart)) {
                    setActiveCell(nextRowStart);
                }
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

        // Auto-remove error after 10 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 10000);
    }

    // Function to clear any existing error messages
    function clearError() {
        const existingError = document.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
    }

    /**
     * Validates grid state for Wordle rule consistency
     *
     * WORDLE CONSISTENCY RULES:
     *
     * 1. GREEN POSITION LOCK: If a letter is green at position X, it MUST remain green
     *    at position X in all subsequent words
     *
     * 2. GREY LETTER EXCLUSION: If a letter is grey (black), it means the letter does NOT
     *    exist in the solution. It CANNOT appear as yellow or green in ANY word
     *
     * 3. YELLOW PERSISTENCE (with multiple instance exception): If a letter is yellow
     *    (exists but wrong position), it CANNOT have ALL instances become grey in subsequent
     *    words. At least ONE instance must remain yellow or green. However, if a word has
     *    multiple instances of the same letter, some can be grey as long as at least one
     *    is yellow or green.
     *    Example: If 'L' was yellow before, "HELLO" with L at positions 3,4 can have one
     *    grey and one yellow/green.
     *
     * 4. GREEN TO NON-GREEN VIOLATION: Once green at a position, cannot revert to yellow/grey
     *
     * 5. MULTIPLE INSTANCE HANDLING: Same letter can appear multiple times with different
     *    colors, indicating count constraints
     *
     * @param {Array} gridState - Array of row objects with word and color data
     * @returns {Object} - { valid: boolean, errors: Array of error messages }
     */
    function validateGridConsistency(gridState) {
        const errors = [];

        // Track letter states across all words
        // greenPositions[letter] = Set of positions where letter must be green
        // greyLetters = Set of letters that don't exist in solution
        // yellowLetters = Set of letters that exist in solution
        const greenPositions = {}; // { 'A': Set([0, 2]), 'B': Set([1]) }
        const greyLetters = new Set();
        const yellowLetters = new Set();

        console.log('🔍 Starting grid consistency validation...');

        // Process each word sequentially
        for (let i = 0; i < gridState.length; i++) {
            const row = gridState[i];
            const word = row.word.toUpperCase();
            const colors = row.colors; // Format: 'byygg' (b=grey/black, y=yellow, g=green)
            const rowNumber = row.row;

            console.log(`\n📋 Validating Word ${rowNumber}: ${word} [${colors}]`);

            // Track letters in current word for duplicate handling
            const lettersInWord = {};

            for (let pos = 0; pos < 5; pos++) {
                const letter = word[pos];
                const color = colors[pos]; // 'b', 'y', or 'g'

                // Initialize tracking for this letter if not exists
                if (!lettersInWord[letter]) {
                    lettersInWord[letter] = [];
                }
                lettersInWord[letter].push({ position: pos, color: color });

                console.log(`  Position ${pos}: ${letter} is ${color === 'g' ? 'GREEN' : color === 'y' ? 'YELLOW' : 'GREY'}`);

                // RULE 1 & 4: GREEN POSITION CONSISTENCY
                // If this position was previously green for a different letter, that's an error
                // If this letter was previously green at this position, it must still be green
                if (greenPositions[letter] && greenPositions[letter].has(pos)) {
                    if (color !== 'g') {
                        errors.push(`\n Word ${rowNumber}, Position ${pos + 1}: Letter '${letter}' was GREEN at this position in an earlier word. It must remain GREEN.`);
                        console.log(`  ❌ ERROR: ${letter} should be GREEN at position ${pos}`);
                    }
                }

                // Check if another letter was marked green at this position
                for (const [otherLetter, positions] of Object.entries(greenPositions)) {
                    if (otherLetter !== letter && positions.has(pos)) {
                        if (color === 'g') {
                            errors.push(`\n Word ${rowNumber}, Position ${pos + 1}: Position was locked to letter '${otherLetter}' (green in earlier word), but now shows '${letter}' as green.`);
                            console.log(`  ❌ ERROR: Position ${pos} was locked to ${otherLetter}`);
                        }
                    }
                }

                // RULE 2: GREY LETTER EXCLUSION
                // If letter was previously grey, it cannot be yellow or green
                if (greyLetters.has(letter)) {
                    if (color === 'y' || color === 'g') {
                        errors.push(`\n Word ${rowNumber}, Position ${pos + 1}: Letter '${letter}' was marked GREY (doesn't exist) in an earlier word. It cannot be ${color === 'y' ? 'YELLOW' : 'GREEN'}.`);
                        console.log(`  ❌ ERROR: ${letter} was marked as non-existent (grey) earlier`);
                    }
                }

                // RULE 3: YELLOW PERSISTENCE (with multiple instance exception)
                // If letter was previously yellow, it cannot be grey now
                // UNLESS there's another instance of the same letter in this word that is yellow or green
                if (yellowLetters.has(letter)) {
                    if (color === 'b') {
                        // Check if there's another instance of this letter in the current word that's yellow/green
                        // We need to check the entire word first, so we'll validate this after processing all positions
                        // For now, mark it for later validation
                        console.log(`  ⚠️  PENDING: ${letter} was yellow before, now grey at position ${pos} - will check for other instances`);
                    }
                }
            }

            // RULE 3 VALIDATION: Check yellow-to-grey transitions
            // After seeing all positions, validate that yellow letters turning grey have another instance
            for (const [letter, instances] of Object.entries(lettersInWord)) {
                // Check if this letter was previously yellow
                if (yellowLetters.has(letter)) {
                    // Count how many instances are yellow or green in current word
                    const yellowOrGreenCount = instances.filter(inst => inst.color === 'y' || inst.color === 'g').length;
                    const greyCount = instances.filter(inst => inst.color === 'b').length;

                    // If ALL instances are grey, that's an error (letter should exist)
                    if (greyCount > 0 && yellowOrGreenCount === 0) {
                        const greyPositions = instances
                            .filter(inst => inst.color === 'b')
                            .map(inst => inst.position + 1)
                            .join(', ');
                        errors.push(`\n Word ${rowNumber}: Letter '${letter}' was YELLOW (exists in solution) in an earlier word, but ALL instances are GREY in the next word(s). At least one instance must be yellow or green.`);
                        console.log(`  ❌ ERROR: All instances of ${letter} are grey, but it should exist in solution`);
                    } else if (greyCount > 0 && yellowOrGreenCount > 0) {
                        console.log(`  ✅ ${letter} has grey instance(s) but also has yellow/green instance(s) - valid`);
                    }
                }
            }

            // After processing all positions in this word, update our tracking
            for (let pos = 0; pos < 5; pos++) {
                const letter = word[pos];
                const color = colors[pos];

                if (color === 'g') {
                    // Mark this letter as green at this position
                    if (!greenPositions[letter]) {
                        greenPositions[letter] = new Set();
                    }
                    greenPositions[letter].add(pos);
                    // Green means letter exists, so it's also yellow-eligible
                    yellowLetters.add(letter);
                    console.log(`  ✅ Locked: ${letter} is GREEN at position ${pos}`);
                } else if (color === 'y') {
                    // Letter exists in solution
                    yellowLetters.add(letter);
                    console.log(`  ✅ Tracked: ${letter} exists in solution (yellow)`);
                } else if (color === 'b') {
                    // Only mark as grey if this letter was never yellow or green
                    // AND doesn't appear as yellow/green elsewhere in the same word
                    const hasYellowOrGreenInWord = lettersInWord[letter].some(
                        instance => instance.color === 'y' || instance.color === 'g'
                    );

                    if (!hasYellowOrGreenInWord && !yellowLetters.has(letter)) {
                        greyLetters.add(letter);
                        console.log(`  ✅ Tracked: ${letter} does not exist in solution (grey)`);
                    }
                }
            }
        }

        console.log('\n📊 Validation Summary:');
        console.log(`  Green locked positions:`, Object.entries(greenPositions).map(([l, p]) => `${l}@${Array.from(p)}`));
        console.log(`  Letters in solution:`, Array.from(yellowLetters));
        console.log(`  Letters not in solution:`, Array.from(greyLetters));
        console.log(`  Errors found: ${errors.length}`);

        return {
            valid: errors.length === 0,
            errors: errors
        };
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

        // Validation: Check for Wordle rule consistency
        console.log('\n🔍 === CONSISTENCY VALIDATION START ===');
        const consistencyCheck = validateGridConsistency(gridState);
        console.log('🔍 === CONSISTENCY VALIDATION END ===\n');

        if (!consistencyCheck.valid) {
            console.error('❌ Grid validation failed:', consistencyCheck.errors);
            // Show first error with summary
            const errorCount = consistencyCheck.errors.length;
            const firstError = consistencyCheck.errors[0];
            const errorMessage = errorCount === 1
                ? firstError
                : `First issue of ${errorCount}: ${firstError}`;

            showError(`Inconsistency detected. ${errorMessage}`);
            return; // Stop execution
        }

        console.log('✅ Grid validation passed: All rules consistent');

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

        // Store submitted words for "Add Next Word" functionality
        sessionStorage.setItem('submittedWords', JSON.stringify(gridState));

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

                    // Extract suggestions with entropy values
                    const allSuggestions = result.rankedGuesses ?
                        result.rankedGuesses.map(item => ({
                            word: item.word.toUpperCase(),
                            entropy: item.entropy
                        })) :
                        [];

                    const gameState = result.gameState || {};
                    const remainingCount = gameState.remainingPossibilities || allSuggestions.length;

                    // Check if game is actually complete (has a row with all green cells)
                    const hasAllGreenRow = gridState.some(row =>
                        row.colors === 'ggggg'
                    );
                    const gameComplete = hasAllGreenRow;

                    const response = {
                        suggestions: allSuggestions,
                        nextBest: result.nextBestGuess ? result.nextBestGuess.toUpperCase() : (allSuggestions[0]?.word || 'SLATE'),
                        remainingCount: remainingCount,
                        gameComplete: gameComplete,
                        totalSuggestions: allSuggestions.length
                    };

                    if (gameComplete) {
                        response.message = '🎉 Puzzle solved! Are you testing me?';
                    }

                    // Store results
                    sessionStorage.setItem('wordleResults', JSON.stringify(response));

                    // Redirect to results page
                    window.location.href = 'results.html';
                }).catch(error => {
                    console.error('Solver error:', error);

                    // Check if it's a "no candidates" error - check multiple error message patterns
                    const errorMsg = error.message || '';
                    if (errorMsg.includes('NO_CANDIDATES') ||
                        errorMsg.includes('No candidates available') ||
                        errorMsg.includes('No possible answers remaining')) {
                        showError("I can't seem to find any word that fits. Can you double check your input?");
                    } else {
                        showError('Failed to solve. Please try again.');
                    }

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