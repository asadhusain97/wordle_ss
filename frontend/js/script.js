document.addEventListener('DOMContentLoaded', function () {
    const gridCells = document.querySelectorAll('.grid-cell');
    const solveButton = document.getElementById('solve-button');
    const colorClasses = ['grey-cell', 'yellow-cell', 'green-cell'];

    let currentActiveIndex = 0;
    let isProcessingInput = false;

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

        // Store data in sessionStorage for the results page
        sessionStorage.setItem('wordleGridData', JSON.stringify({
            fullState: gridState,
            compactFormat: compactFormat
        }));

        // If we have valid guesses, get results from API directly
        if (compactFormat.length > 0) {
            // Show loading state
            solveButton.textContent = 'Solving...';
            solveButton.disabled = true;

            // Make API call to get results
            fetch('/api/get-results', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ guesses: compactFormat })
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Server responded with status ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    // Store API results
                    sessionStorage.setItem('wordleResults', JSON.stringify(data));
                    // Redirect to results page
                    window.location.href = 'results.html';
                })
                .catch(error => {
                    console.error('Error during solving:', error);
                    showError('Failed to get solving results. Please try again.');

                    // Reset button state
                    solveButton.textContent = 'Solve';
                    solveButton.disabled = false;
                });
        } else {
            // No valid guesses, redirect directly
            window.location.href = 'results.html';
        }
    });


    // Focus on the document to capture keyboard events
    document.body.focus();
});