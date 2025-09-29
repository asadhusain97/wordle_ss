document.addEventListener('DOMContentLoaded', function () {
    console.log('🎯 Results page loaded');

    const resultsHeader = document.getElementById('results-header');
    const resultsList = document.getElementById('results-list');
    const viewMoreSection = document.getElementById('view-more-section');
    const viewMoreBtn = document.getElementById('view-more-btn');
    const additionalResults = document.getElementById('additional-results');

    // Get stored results from sessionStorage
    const storedResults = sessionStorage.getItem('wordleResults');
    const storedGridData = sessionStorage.getItem('wordleGridData');

    console.log('📦 Stored results:', storedResults ? 'Found' : 'None');
    console.log('📦 Stored grid data:', storedGridData ? 'Found' : 'None');

    if (storedResults) {
        try {
            const results = JSON.parse(storedResults);
            console.log('✅ Parsed results:', results);
            displayResults(results);
        } catch (error) {
            console.error('❌ Error parsing stored results:', error);
            displayError('Error loading results');
        }
    } else if (storedGridData) {
        try {
            const gridData = JSON.parse(storedGridData);
            console.log('📋 Showing grid data as fallback:', gridData);
            displayGridData(gridData);
        } catch (error) {
            console.error('❌ Error parsing grid data:', error);
            displayError('Error loading grid data');
        }
    } else {
        console.log('⚠️ No data available');
        displayError('No data available');
    }

    function displayResults(results) {
        console.log('🎨 Displaying results:', results);

        // Clear existing content
        resultsHeader.innerHTML = '';
        resultsList.innerHTML = '';
        additionalResults.innerHTML = '';
        viewMoreSection.style.display = 'none';

        if (results.error) {
            console.log('❌ Showing error:', results.error);
            displayError(`Error: ${results.error}`);
            return;
        }

        const suggestions = results.suggestions || [];
        console.log(`📊 Total suggestions: ${suggestions.length}`);

        if (suggestions.length === 0) {
            displayError('No suggestions available');
            return;
        }

        // Display header information
        displayHeader(results);

        // Display suggestions starting from the second one (first is already in the green box)
        const remainingSuggestions = suggestions.slice(1, 5);
        console.log(`🏆 Displaying ${remainingSuggestions.length} remaining suggestions:`, remainingSuggestions);

        remainingSuggestions.forEach((word, index) => {
            const listItem = document.createElement('li');
            listItem.style.cssText = `
                font-size: 1.1em;
                margin-bottom: 10px;
                font-weight: 500;
                color: #f5f5f5;
                list-style: none;
                padding: 8px 12px;
                background-color: rgba(88, 88, 88, 0.15);
                border-radius: 6px;
                display: flex;
                align-items: center;
            `;

            // Add number and word with consistent styling
            listItem.innerHTML = `<span style="opacity: 0.7; margin-right: 12px; font-size: 0.9em;">${index + 2}.</span> ${word}`;

            resultsList.appendChild(listItem);
        });

        // Show "View More" button if there are more than 5 suggestions
        if (suggestions.length > 5) {
            const remainingCount = suggestions.length - 5;
            console.log(`➕ ${remainingCount} additional suggestions available`);

            viewMoreBtn.textContent = `View ${remainingCount} More`;
            viewMoreBtn.style.cssText = `
                background-color: rgba(88, 88, 88, 0.2);
                color: #f5f5f5;
                border: 1px solid rgba(88, 88, 88, 0.4);
                padding: 8px 16px;
                font-size: 0.9rem;
                font-weight: 400;
                border-radius: 6px;
                cursor: pointer;
                font-family: inherit;
                transition: all 0.2s ease;
                margin-top: 15px;
            `;

            viewMoreSection.style.display = 'block';

            // Setup view more functionality
            viewMoreBtn.addEventListener('click', function () {
                console.log('👁️ View More clicked');
                toggleAdditionalResults(suggestions.slice(5));
            });

            // Add hover effects
            viewMoreBtn.addEventListener('mouseover', function () {
                this.style.backgroundColor = 'rgba(88, 88, 88, 0.3)';
            });

            viewMoreBtn.addEventListener('mouseout', function () {
                this.style.backgroundColor = 'rgba(88, 88, 88, 0.2)';
            });
        }

        // Add game completion message
        if (results.gameComplete) {
            console.log('🎉 Game completed!');
            const completionDiv = document.createElement('div');
            completionDiv.innerHTML = '<strong>🎉 Puzzle solved! Only one word remaining.</strong>';
            completionDiv.style.cssText = `
                color: #538d4e;
                font-size: 1.3em;
                text-align: center;
                margin-top: 25px;
                padding: 15px;
                background-color: rgba(83, 141, 78, 0.1);
                border-radius: 8px;
                border: 2px solid #538d4e;
            `;
            resultsHeader.appendChild(completionDiv);
        }
    }

    function displayHeader(results) {
        console.log('📋 Creating header with results info');

        // Best next guess
        if (results.nextBest) {
            const bestGuessDiv = document.createElement('div');
            bestGuessDiv.innerHTML = `<strong>🎯 Best Next Guess: ${results.nextBest}</strong>`;
            bestGuessDiv.style.cssText = `
                color: #538d4e;
                font-size: 1.4em;
                text-align: center;
                margin-bottom: 15px;
                padding: 10px;
                background-color: rgba(83, 141, 78, 0.1);
                border-radius: 6px;
            `;
            resultsHeader.appendChild(bestGuessDiv);
        }


        // Additional message if provided
        if (results.message) {
            const messageDiv = document.createElement('div');
            messageDiv.innerHTML = `💡 ${results.message}`;
            messageDiv.style.cssText = `
                color: #6c757d;
                font-size: 1em;
                text-align: center;
                margin-bottom: 15px;
                font-style: italic;
            `;
            resultsHeader.appendChild(messageDiv);
        }
    }

    function toggleAdditionalResults(additionalSuggestions) {
        console.log('🔄 Toggling additional results');

        if (additionalResults.style.display === 'none') {
            // Show additional results
            console.log(`📝 Showing ${additionalSuggestions.length} additional suggestions`);

            additionalResults.innerHTML = '';
            additionalSuggestions.forEach((word, index) => {
                const listItem = document.createElement('li');
                listItem.style.cssText = `
                    font-size: 1.1em;
                    margin-bottom: 10px;
                    font-weight: 500;
                    color: #f5f5f5;
                    list-style: none;
                    padding: 8px 12px;
                    background-color: rgba(88, 88, 88, 0.15);
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                `;

                // Add number and word with consistent styling (continuing from where the main list left off)
                listItem.innerHTML = `<span style="opacity: 0.7; margin-right: 12px; font-size: 0.9em;">${index + 6}.</span> ${word}`;

                additionalResults.appendChild(listItem);
            });

            additionalResults.style.display = 'block';
            viewMoreBtn.textContent = 'Show Less';
        } else {
            // Hide additional results
            console.log('🙈 Hiding additional results');
            additionalResults.style.display = 'none';
            const remainingCount = additionalSuggestions.length;
            viewMoreBtn.textContent = `View ${remainingCount} More`;
        }
    }

    function displayGridData(gridData) {
        console.log('📋 Displaying grid data fallback');

        resultsHeader.innerHTML = '';
        resultsList.innerHTML = '';

        const header = document.createElement('div');
        header.innerHTML = '<strong>📝 Your guesses:</strong>';
        header.style.cssText = `
            font-size: 1.2em;
            margin-bottom: 15px;
            color: #f5f5f5;
        `;
        resultsHeader.appendChild(header);

        if (gridData.compactFormat && gridData.compactFormat.length > 0) {
            gridData.compactFormat.forEach(([word, colors]) => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `${word.toUpperCase()} - ${colors}`;
                listItem.style.cssText = `
                    font-family: monospace;
                    font-size: 1.1em;
                    margin-bottom: 8px;
                    background-color: rgba(88, 88, 88, 0.2);
                    padding: 8px;
                    border-radius: 4px;
                `;
                resultsList.appendChild(listItem);
            });

            const noResultsDiv = document.createElement('div');
            noResultsDiv.innerHTML = '⚠️ <em>Unable to get suggestions from server</em>';
            noResultsDiv.style.cssText = `
                color: #b59f3b;
                font-style: italic;
                text-align: center;
                margin-top: 20px;
                padding: 15px;
                background-color: rgba(181, 159, 59, 0.1);
                border-radius: 6px;
            `;
            resultsHeader.appendChild(noResultsDiv);
        } else {
            displayError('No valid guesses found');
        }
    }

    function displayError(message) {
        console.log('❌ Displaying error:', message);

        resultsHeader.innerHTML = '';
        resultsList.innerHTML = '';

        const errorDiv = document.createElement('div');
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            color: #ff6b6b;
            text-align: center;
            font-size: 1.2em;
            padding: 20px;
            background-color: rgba(255, 107, 107, 0.1);
            border-radius: 8px;
            border: 2px solid #ff6b6b;
        `;
        resultsHeader.appendChild(errorDiv);
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