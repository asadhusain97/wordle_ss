document.addEventListener('DOMContentLoaded', function () {
    const resultsList = document.getElementById('results-list');

    // Get stored results from sessionStorage
    const storedResults = sessionStorage.getItem('wordleResults');
    const storedGridData = sessionStorage.getItem('wordleGridData');

    if (storedResults) {
        try {
            const results = JSON.parse(storedResults);
            displayResults(results);
        } catch (error) {
            console.error('Error parsing stored results:', error);
            displayError('Error loading results');
        }
    } else if (storedGridData) {
        // Fallback: show the grid data if no API results
        try {
            const gridData = JSON.parse(storedGridData);
            displayGridData(gridData);
        } catch (error) {
            console.error('Error parsing grid data:', error);
            displayError('Error loading grid data');
        }
    } else {
        displayError('No data available');
    }

    function displayResults(results) {
        resultsList.innerHTML = '';

        if (results.error) {
            const errorItem = document.createElement('li');
            errorItem.textContent = `Error: ${results.error}`;
            errorItem.style.color = '#ff6b6b';
            resultsList.appendChild(errorItem);
            return;
        }

        if (results.suggestions && results.suggestions.length > 0) {
            // Add header info
            if (results.nextBest) {
                const header = document.createElement('li');
                header.innerHTML = `<strong>Best Next Guess: ${results.nextBest}</strong>`;
                header.style.color = '#538d4e';
                header.style.fontSize = '1.2em';
                resultsList.appendChild(header);
            }

            if (results.remainingCount !== undefined) {
                const remainingInfo = document.createElement('li');
                remainingInfo.innerHTML = `<em>Remaining possibilities: ${results.remainingCount}</em>`;
                remainingInfo.style.color = '#b59f3b';
                remainingInfo.style.fontStyle = 'italic';
                resultsList.appendChild(remainingInfo);

                // Add separator
                const separator = document.createElement('li');
                separator.innerHTML = '---';
                separator.style.listStyleType = 'none';
                separator.style.textAlign = 'center';
                separator.style.color = '#585858';
                resultsList.appendChild(separator);
            }

            // Add all suggestions
            results.suggestions.forEach((word, index) => {
                const listItem = document.createElement('li');
                listItem.textContent = word;
                listItem.style.fontSize = '1.1em';
                listItem.style.marginBottom = '8px';

                // Highlight the top 3 suggestions
                if (index < 3) {
                    listItem.style.fontWeight = 'bold';
                    if (index === 0) listItem.style.color = '#538d4e';
                    else if (index === 1) listItem.style.color = '#b59f3b';
                    else listItem.style.color = '#f5f5f5';
                }

                resultsList.appendChild(listItem);
            });
        } else {
            displayError('No suggestions available');
        }

        // Add game completion message
        if (results.gameComplete) {
            const completionItem = document.createElement('li');
            completionItem.innerHTML = '<strong>🎉 Puzzle solved!</strong>';
            completionItem.style.color = '#538d4e';
            completionItem.style.fontSize = '1.2em';
            completionItem.style.listStyleType = 'none';
            completionItem.style.textAlign = 'center';
            completionItem.style.marginTop = '20px';
            resultsList.appendChild(completionItem);
        }
    }

    function displayGridData(gridData) {
        resultsList.innerHTML = '';

        const header = document.createElement('li');
        header.innerHTML = '<strong>Your guesses:</strong>';
        header.style.listStyleType = 'none';
        header.style.marginBottom = '10px';
        resultsList.appendChild(header);

        if (gridData.compactFormat && gridData.compactFormat.length > 0) {
            gridData.compactFormat.forEach(([word, colors]) => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `${word.toUpperCase()} - ${colors}`;
                listItem.style.fontFamily = 'monospace';
                resultsList.appendChild(listItem);
            });

            const noResultsItem = document.createElement('li');
            noResultsItem.innerHTML = '<em>Unable to get suggestions from server</em>';
            noResultsItem.style.color = '#b59f3b';
            noResultsItem.style.fontStyle = 'italic';
            noResultsItem.style.listStyleType = 'none';
            noResultsItem.style.marginTop = '20px';
            resultsList.appendChild(noResultsItem);
        } else {
            displayError('No valid guesses found');
        }
    }

    function displayError(message) {
        resultsList.innerHTML = '';
        const errorItem = document.createElement('li');
        errorItem.textContent = message;
        errorItem.style.color = '#ff6b6b';
        errorItem.style.listStyleType = 'none';
        errorItem.style.textAlign = 'center';
        resultsList.appendChild(errorItem);
    }

    // Add back button
    const backButton = document.createElement('button');
    backButton.textContent = 'Do it again';
    backButton.style.cssText = `
        background-color: #585858;
        color: #f5f5f5;
        border: none;
        padding: 12px 24px;
        font-size: 1rem;
        font-weight: 600;
        border-radius: 6px;
        cursor: pointer;
        margin-top: 30px;
        font-family: inherit;
        transition: all 0.2s ease-in-out;
    `;

    backButton.addEventListener('click', function () {
        // Clear stored data
        sessionStorage.removeItem('wordleResults');
        sessionStorage.removeItem('wordleGridData');
        // Go back to main page
        window.location.href = '/';
    });

    backButton.addEventListener('mouseover', function () {
        this.style.backgroundColor = '#6a6a6a';
    });

    backButton.addEventListener('mouseout', function () {
        this.style.backgroundColor = '#585858';
    });

    // Add button to the page
    document.querySelector('.main-container').appendChild(backButton);
});