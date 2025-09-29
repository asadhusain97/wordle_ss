document.addEventListener('DOMContentLoaded', function() {
    const gridCells = document.querySelectorAll('.grid-cell');
    const solveButton = document.getElementById('solve-button');
    const colorClasses = ['grey-cell', 'yellow-cell', 'green-cell'];

    let currentActiveIndex = 0;
    let isProcessingInput = false;

    // Initialize all cells with grey-cell class
    gridCells.forEach((cell, index) => {
        cell.classList.add('grey-cell');
        cell.setAttribute('data-color-index', '0');
        // Remove contenteditable to prevent cursor appearance
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
        cell.addEventListener('click', function(e) {
            e.preventDefault();
            // Set this cell as active when clicked
            setActiveCell(index);
            // Cycle color
            cycleColor(this);
        });
    });

    // Find next empty cell in current row or next row
    function findNextEmptyCell(startIndex) {
        const row = Math.floor(startIndex / 5);
        const col = startIndex % 5;

        // Check remaining cells in current row first
        for (let c = col; c < 5; c++) {
            const cellIndex = row * 5 + c;
            if (cellIndex < gridCells.length && gridCells[cellIndex].textContent.trim() === '') {
                return cellIndex;
            }
        }

        // Check next rows
        for (let r = row + 1; r < 6; r++) {
            for (let c = 0; c < 5; c++) {
                const cellIndex = r * 5 + c;
                if (cellIndex < gridCells.length && gridCells[cellIndex].textContent.trim() === '') {
                    return cellIndex;
                }
            }
        }

        return -1; // No empty cells found
    }

    // Find last filled cell for backspace
    function findLastFilledCell() {
        for (let i = gridCells.length - 1; i >= 0; i--) {
            if (gridCells[i].textContent.trim() !== '') {
                return i;
            }
        }
        return -1; // No filled cells found
    }

    // Global keydown event listener for the entire document
    document.addEventListener('keydown', function(e) {
        if (isProcessingInput) return;
        isProcessingInput = true;

        // Handle letter input
        if (e.key.match(/^[a-zA-Z]$/)) {
            e.preventDefault();

            // Set letter in current active cell
            if (currentActiveIndex >= 0 && currentActiveIndex < gridCells.length) {
                gridCells[currentActiveIndex].textContent = e.key.toUpperCase();

                // Move to next empty cell
                const nextEmpty = findNextEmptyCell(currentActiveIndex + 1);
                if (nextEmpty !== -1) {
                    setActiveCell(nextEmpty);
                } else {
                    // If no more empty cells, try to move to next cell in sequence
                    const nextIndex = currentActiveIndex + 1;
                    if (nextIndex < gridCells.length) {
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

            if (targetIndex !== currentActiveIndex && targetIndex >= 0 && targetIndex < gridCells.length) {
                setActiveCell(targetIndex);
            }
        }

        // Handle Enter key (prevent default)
        else if (e.key === 'Enter') {
            e.preventDefault();
            // Move to next row, first column
            const currentRow = Math.floor(currentActiveIndex / 5);
            const nextRowStart = (currentRow + 1) * 5;
            if (nextRowStart < gridCells.length) {
                setActiveCell(nextRowStart);
            }
        }

        setTimeout(() => {
            isProcessingInput = false;
        }, 10);
    });

    // Prevent any paste operations
    document.addEventListener('paste', function(e) {
        e.preventDefault();
    });

    // Solve button functionality
    solveButton.addEventListener('click', function() {
        const gridState = [];

        // Process each row
        for (let row = 0; row < 6; row++) {
            const rowData = [];

            for (let col = 0; col < 5; col++) {
                const cellIndex = row * 5 + col;
                const cell = gridCells[cellIndex];
                const letter = cell.textContent.trim() || '';
                const colorIndex = parseInt(cell.getAttribute('data-color-index'));
                const colorState = ['grey', 'yellow', 'green'][colorIndex];

                rowData.push({
                    letter: letter,
                    color: colorState,
                    position: col + 1
                });
            }

            // Only add rows that have at least one letter
            if (rowData.some(cellData => cellData.letter !== '')) {
                gridState.push({
                    row: row + 1,
                    cells: rowData,
                    word: rowData.map(cell => cell.letter).join(''),
                    colors: rowData.map(cell => cell.color === 'grey' ? 'b' : cell.color.charAt(0)).join('') // b, y, g format
                });
            }
        }

        // Log the collected data
        console.log('Grid State:', gridState);

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

        // If we have valid guesses, try to get results from API
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
            .then(response => response.json())
            .then(data => {
                // Store API results
                sessionStorage.setItem('wordleResults', JSON.stringify(data));
                // Redirect to results page
                window.location.href = 'results.html';
            })
            .catch(error => {
                console.error('Error calling API:', error);
                // Still redirect, but without API results
                window.location.href = 'results.html';
            });
        } else {
            // No valid guesses, redirect directly
            window.location.href = 'results.html';
        }
    });


    // Focus on the document to capture keyboard events
    document.body.focus();
});