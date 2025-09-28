document.addEventListener('DOMContentLoaded', function() {
    const gridCells = document.querySelectorAll('.grid-cell');
    const solveButton = document.getElementById('solve-button');
    const colorClasses = ['grey-cell', 'yellow-cell', 'green-cell'];

    // Initialize all cells with grey-cell class
    gridCells.forEach(cell => {
        cell.classList.add('grey-cell');
        cell.setAttribute('data-color-index', '0');
    });

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
    gridCells.forEach(cell => {
        cell.addEventListener('click', function(e) {
            // Prevent default behavior and stop propagation
            e.preventDefault();
            cycleColor(this);
        });
    });

    // Input handling functionality
    gridCells.forEach((cell, index) => {
        // Handle input events
        cell.addEventListener('input', function(e) {
            const value = this.textContent.trim();

            // Only allow single alphabetic character
            if (value.length > 1 || (value.length === 1 && !/^[a-zA-Z]$/.test(value))) {
                // Remove invalid characters and keep only the first valid letter
                const cleanValue = value.replace(/[^a-zA-Z]/g, '').substring(0, 1);
                this.textContent = cleanValue.toUpperCase();
            } else if (value.length === 1 && /^[a-zA-Z]$/.test(value)) {
                // Convert to uppercase
                this.textContent = value.toUpperCase();

                // Move to next cell in the same row
                const currentRow = Math.floor(index / 5);
                const currentCol = index % 5;

                // Only move to next cell if not in the last column of the row
                if (currentCol < 4) {
                    const nextCellIndex = index + 1;
                    if (nextCellIndex < gridCells.length) {
                        gridCells[nextCellIndex].focus();
                        // Place cursor at the end of the content
                        const range = document.createRange();
                        const selection = window.getSelection();
                        range.selectNodeContents(gridCells[nextCellIndex]);
                        range.collapse(false);
                        selection.removeAllRanges();
                        selection.addRange(range);
                    }
                }
            }
        });

        // Handle keydown events for backspace and other special keys
        cell.addEventListener('keydown', function(e) {
            // Handle backspace
            if (e.key === 'Backspace') {
                e.preventDefault();
                this.textContent = '';
                return;
            }

            // Handle Enter key (prevent default)
            if (e.key === 'Enter') {
                e.preventDefault();
                return;
            }

            // Handle arrow keys for navigation
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                e.preventDefault();
                const currentRow = Math.floor(index / 5);
                const currentCol = index % 5;
                let targetIndex = index;

                switch (e.key) {
                    case 'ArrowLeft':
                        if (currentCol > 0) targetIndex = index - 1;
                        break;
                    case 'ArrowRight':
                        if (currentCol < 4) targetIndex = index + 1;
                        break;
                    case 'ArrowUp':
                        if (currentRow > 0) targetIndex = index - 5;
                        break;
                    case 'ArrowDown':
                        if (currentRow < 5) targetIndex = index + 5;
                        break;
                }

                if (targetIndex !== index && targetIndex >= 0 && targetIndex < gridCells.length) {
                    gridCells[targetIndex].focus();
                    // Place cursor at the end of the content
                    const range = document.createRange();
                    const selection = window.getSelection();
                    range.selectNodeContents(gridCells[targetIndex]);
                    range.collapse(false);
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
            }
        });

        // Prevent paste from adding multiple characters
        cell.addEventListener('paste', function(e) {
            e.preventDefault();
            const pastedText = (e.clipboardData || window.clipboardData).getData('text');
            const firstChar = pastedText.replace(/[^a-zA-Z]/g, '').substring(0, 1);
            if (firstChar) {
                this.textContent = firstChar.toUpperCase();

                // Trigger input event to handle automatic focus movement
                const inputEvent = new Event('input', { bubbles: true });
                this.dispatchEvent(inputEvent);
            }
        });
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
                    colors: rowData.map(cell => cell.color.charAt(0)).join('') // g, y, b format
                });
            }
        }

        // Log the collected data
        console.log('Grid State:', gridState);

        // Create a more compact format for the backend API
        const compactFormat = gridState.map(row => [
            row.word.toLowerCase(),
            row.colors.replace(/grey/g, 'b').replace(/yellow/g, 'y').replace(/green/g, 'g')
        ]);

        console.log('Compact Format for API:', compactFormat);

        // Store data in sessionStorage for the results page
        sessionStorage.setItem('wordleGridData', JSON.stringify({
            fullState: gridState,
            compactFormat: compactFormat
        }));

        // Redirect to results page
        window.location.href = 'results.html';
    });

    // Helper function to get current color state of a cell
    function getCellColorState(cell) {
        if (cell.classList.contains('yellow-cell')) return 'yellow';
        if (cell.classList.contains('green-cell')) return 'green';
        return 'grey';
    }

    // Focus on first cell on page load
    if (gridCells.length > 0) {
        gridCells[0].focus();
    }
});