/**
 * DOM manipulation utilities for applying processed grid data to the Wordle interface
 * Handles resetting and populating the grid with detected letters and colors
 */

/**
 * Resets the index page grid to initial state
 * Clear text/inputs, remove color classes, reset state in the existing 6x5 grid
 */
export function resetIndexGrid() {
    const gridCells = document.querySelectorAll('.grid-cell');

    gridCells.forEach(cell => {
        // Clear text content
        cell.textContent = '';

        // Reset color classes
        cell.classList.remove('green-cell', 'yellow-cell', 'grey-cell', 'is-green', 'is-yellow', 'is-gray');
        cell.classList.add('grey-cell');

        // Reset color index data attribute
        cell.setAttribute('data-color-index', '0');

        // Remove any active states
        cell.classList.remove('active');
    });

    // Reset any locked row states
    const gridRows = document.querySelectorAll('.grid-row');
    gridRows.forEach(row => {
        row.classList.remove('locked');
    });

    console.log('Grid reset to initial state');
}

/**
 * Maps color names to CSS class names used in the application
 * @param {'green'|'yellow'|'gray'} color - Detected color
 * @returns {string} CSS class name
 */
function mapColorToClass(color) {
    const colorMap = {
        'green': 'green-cell',
        'yellow': 'yellow-cell',
        'gray': 'grey-cell',
        'grey': 'grey-cell'  // Handle both spellings
    };

    return colorMap[color] || 'grey-cell';
}

/**
 * Maps color names to data-color-index values used by the existing application
 * @param {'green'|'yellow'|'gray'} color - Detected color
 * @returns {string} Color index value
 */
function mapColorToIndex(color) {
    const indexMap = {
        'gray': '0',
        'grey': '0',
        'yellow': '1',
        'green': '2'
    };

    return indexMap[color] || '0';
}

/**
 * Applies processed grid data to the DOM
 * For each {row,col,letter,color}, find cell by [data-row][data-col] or agreed selector
 * Set text/value to letter
 * Add color class: is-green | is-yellow | is-gray
 * @param {Array<{row: number, col: number, letter: string|null, color: string}>} grid - Grid data array
 */
export function applyGridToDOM(grid) {
    if (!grid || !Array.isArray(grid)) {
        console.error('Invalid grid data provided to applyGridToDOM');
        return;
    }

    const gridCells = document.querySelectorAll('.grid-cell');

    if (gridCells.length === 0) {
        console.error('No grid cells found in DOM');
        return;
    }

    let appliedCells = 0;
    let unlockedRows = new Set();

    // Apply each grid item
    grid.forEach((item, index) => {
        try {
            const { row, col, letter, color } = item;

            // Validate grid item
            if (typeof row !== 'number' || typeof col !== 'number' ||
                row < 0 || row > 5 || col < 0 || col > 4) {
                console.warn(`Invalid grid position at index ${index}:`, item);
                return;
            }

            // Find cell by position (row-major indexing)
            const cellIndex = row * 5 + col;

            if (cellIndex >= gridCells.length) {
                console.warn(`Cell index ${cellIndex} out of bounds`);
                return;
            }

            const cell = gridCells[cellIndex];

            // Set text/value to letter
            if (letter && typeof letter === 'string' && letter.match(/[A-Z]/i)) {
                cell.textContent = letter.toUpperCase();
                unlockedRows.add(row);
            }

            // Add color class: is-green | is-yellow | is-gray
            if (color && typeof color === 'string') {
                // Remove existing color classes
                cell.classList.remove('grey-cell', 'yellow-cell', 'green-cell', 'is-green', 'is-yellow', 'is-gray');

                // Add new color class
                const colorClass = `is-${color}`;
                cell.classList.add(colorClass);

                // Also maintain backward compatibility with existing classes
                const legacyColorClass = color === 'gray' ? 'grey-cell' : `${color}-cell`;
                cell.classList.add(legacyColorClass);

                // Set color index for existing functionality
                const colorIndex = color === 'gray' ? '0' : color === 'yellow' ? '1' : '2';
                cell.setAttribute('data-color-index', colorIndex);
            }

            appliedCells++;

        } catch (error) {
            console.error(`Error applying grid item at index ${index}:`, error, item);
        }
    });

    // Update row states based on applied data
    updateRowStatesAfterApplication(unlockedRows);

    // Update solve button state
    updateSolveButtonState();

    console.log(`Applied ${appliedCells} cells from processed grid data`);
}

/**
 * Updates row lock states after applying grid data
 * @param {Set<number>} unlockedRows - Set of row indices that have content
 */
function updateRowStatesAfterApplication(unlockedRows) {
    const gridRows = document.querySelectorAll('.grid-row');

    if (unlockedRows.size === 0) {
        // If no rows have content, unlock only the first row
        gridRows.forEach((row, index) => {
            if (index === 0) {
                row.classList.remove('locked');
            } else {
                row.classList.add('locked');
            }
        });
        return;
    }

    const maxUnlockedRow = Math.max(...unlockedRows);

    gridRows.forEach((row, index) => {
        if (index <= maxUnlockedRow + 1) {  // Allow one extra row for next input
            row.classList.remove('locked');
        } else {
            row.classList.add('locked');
        }
    });
}

/**
 * Updates the solve button state based on current grid content
 */
function updateSolveButtonState() {
    const solveButton = document.getElementById('solve-button');
    if (!solveButton) return;

    // Check if first row is complete
    const gridCells = document.querySelectorAll('.grid-cell');
    let firstRowComplete = true;

    for (let i = 0; i < 5; i++) {
        if (i < gridCells.length && !gridCells[i].textContent.trim()) {
            firstRowComplete = false;
            break;
        }
    }

    solveButton.disabled = !firstRowComplete;
}

/**
 * Sets the active cell for keyboard navigation
 * @param {number} cellIndex - Index of cell to make active
 */
export function setActiveCell(cellIndex) {
    const gridCells = document.querySelectorAll('.grid-cell');

    // Remove active class from all cells
    gridCells.forEach(cell => cell.classList.remove('active'));

    // Set new active cell
    if (cellIndex >= 0 && cellIndex < gridCells.length) {
        gridCells[cellIndex].classList.add('active');
    }
}

/**
 * Finds the next empty cell for navigation
 * @returns {number} Index of next empty cell, or -1 if none found
 */
export function findNextEmptyCell() {
    const gridCells = document.querySelectorAll('.grid-cell');

    for (let i = 0; i < gridCells.length; i++) {
        if (!gridCells[i].textContent.trim()) {
            return i;
        }
    }

    return -1;
}

/**
 * Validates that grid data matches expected structure
 * @param {any} grid - Grid data to validate
 * @returns {boolean} True if valid
 */
export function validateGridData(grid) {
    if (!Array.isArray(grid)) {
        return false;
    }

    return grid.every(item => {
        return (
            typeof item === 'object' &&
            typeof item.row === 'number' &&
            typeof item.col === 'number' &&
            item.row >= 0 && item.row <= 5 &&
            item.col >= 0 && item.col <= 4 &&
            (typeof item.letter === 'string' || item.letter === null) &&
            typeof item.color === 'string' &&
            ['green', 'yellow', 'gray', 'grey'].includes(item.color.toLowerCase())
        );
    });
}

/**
 * Creates visual feedback for successful grid application
 * @param {number} appliedCount - Number of cells that were successfully applied
 */
export function showApplicationFeedback(appliedCount) {
    // Find or create feedback element
    let feedbackElement = document.getElementById('grid-application-feedback');

    if (!feedbackElement) {
        feedbackElement = document.createElement('div');
        feedbackElement.id = 'grid-application-feedback';
        feedbackElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(83, 141, 78, 0.9);
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        document.body.appendChild(feedbackElement);
    }

    // Update content and show
    feedbackElement.textContent = `✅ Applied ${appliedCount} cells to grid`;
    feedbackElement.style.opacity = '1';

    // Auto-hide after 3 seconds
    setTimeout(() => {
        feedbackElement.style.opacity = '0';
        setTimeout(() => {
            if (feedbackElement && feedbackElement.parentNode) {
                feedbackElement.parentNode.removeChild(feedbackElement);
            }
        }, 300);
    }, 3000);
}