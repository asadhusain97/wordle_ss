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
        viewMoreSection.classList.add('hidden');

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

        // Display entropy explanation first (only if game is not complete), then header
        if (!results.gameComplete) {
            displayEntropyExplanation();
        }
        displayHeader(results);

        // Display suggestions starting from the second one (first is already in the green box)
        const remainingSuggestions = suggestions.slice(1, 5);
        console.log(`🏆 Displaying ${remainingSuggestions.length} remaining suggestions:`, remainingSuggestions);

        remainingSuggestions.forEach((suggestion, index) => {
            const listItem = document.createElement('li');
            listItem.className = 'result-item';

            // Extract word and entropy
            const word = typeof suggestion === 'string' ? suggestion : suggestion.word;
            const entropy = typeof suggestion === 'object' ? suggestion.entropy : null;

            console.log(`Word ${index + 2}: ${word}, Entropy: ${entropy}, Type: ${typeof suggestion}`);

            // Add number, word, and entropy in brackets with styling
            const entropyDisplay = entropy !== null ? ` <span class="entropy-value">(${entropy.toFixed(2)})</span>` : '';

            listItem.innerHTML = `<span class="result-number">${index + 2}.</span> ${word}${entropyDisplay}`;

            resultsList.appendChild(listItem);
        });

        // Show "View More" button if there are more than 5 suggestions
        if (suggestions.length > 5) {
            const remainingCount = suggestions.length - 5;
            console.log(`➕ ${remainingCount} additional suggestions available`);

            viewMoreBtn.textContent = `View ${remainingCount} More`;
            viewMoreSection.classList.remove('hidden');

            // Setup view more functionality
            viewMoreBtn.addEventListener('click', function () {
                console.log('👁️ View More clicked');
                toggleAdditionalResults(suggestions.slice(5));
            });

            // Hover effects are now handled by CSS
        }

    }

    function displayHeader(results) {
        console.log('📋 Creating header with results info');

        // Best next guess (only show if game is not complete)
        if (results.nextBest && !results.gameComplete) {
            const bestGuessDiv = document.createElement('div');
            bestGuessDiv.className = 'best-guess';

            // Get entropy for the best guess (first suggestion)
            const firstSuggestion = results.suggestions && results.suggestions[0];
            const entropyValue = firstSuggestion && typeof firstSuggestion === 'object' ? firstSuggestion.entropy : null;
            const entropyDisplay = entropyValue !== null ? ` <span class="entropy-value">(${entropyValue.toFixed(2)})</span>` : '';

            bestGuessDiv.innerHTML = `<strong>🎯 Best Next Guess: ${results.nextBest}${entropyDisplay}</strong>`;
            resultsHeader.appendChild(bestGuessDiv);
        }

        // Additional message if provided
        if (results.message) {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'result-message';
            messageDiv.innerHTML = `${results.message}`;
            resultsHeader.appendChild(messageDiv);
        }
    }

    function displayEntropyExplanation() {
        const explanationDiv = document.createElement('div');
        explanationDiv.className = 'entropy-explanation';
        explanationDiv.innerHTML = `
            <p class="entropy-info">
                These words are ranked using information theory. The numbers shown are entropy values (in bits) — higher values mean the word will give you more information to narrow down the answer efficiently.
            </p>
        `;
        resultsHeader.appendChild(explanationDiv);
    }

    function toggleAdditionalResults(additionalSuggestions) {
        console.log('🔄 Toggling additional results');

        if (additionalResults.classList.contains('hidden')) {
            // Show additional results
            console.log(`📝 Showing ${additionalSuggestions.length} additional suggestions`);

            additionalResults.innerHTML = '';
            additionalSuggestions.forEach((suggestion, index) => {
                const listItem = document.createElement('li');
                listItem.className = 'result-item';

                // Extract word and entropy
                const word = typeof suggestion === 'string' ? suggestion : suggestion.word;
                const entropy = typeof suggestion === 'object' ? suggestion.entropy : null;

                // Add number, word, and entropy in brackets (continuing from where the main list left off)
                const entropyDisplay = entropy !== null ? ` <span class="entropy-value">(${entropy.toFixed(2)})</span>` : '';

                listItem.innerHTML = `<span class="result-number">${index + 6}.</span> ${word}${entropyDisplay}`;

                additionalResults.appendChild(listItem);
            });

            // Create a "Show Less" button and add it to the end of the additional results
            const showLessItem = document.createElement('li');
            showLessItem.className = 'show-less-container';

            const showLessBtn = document.createElement('button');
            showLessBtn.className = 'view-more-btn';
            showLessBtn.textContent = 'Show Less';
            showLessBtn.addEventListener('click', function () {
                toggleAdditionalResults(additionalSuggestions);
            });

            showLessItem.appendChild(showLessBtn);
            additionalResults.appendChild(showLessItem);

            additionalResults.classList.remove('hidden');
            // Hide the original "View More" button when showing additional results
            viewMoreBtn.style.display = 'none';
        } else {
            // Hide additional results
            console.log('🙈 Hiding additional results');
            additionalResults.classList.add('hidden');
            // Show the original "View More" button again
            viewMoreBtn.style.display = 'block';
            const remainingCount = additionalSuggestions.length;
            viewMoreBtn.textContent = `View ${remainingCount} More`;
        }
    }

    function displayGridData(gridData) {
        console.log('📋 Displaying grid data fallback');

        resultsHeader.innerHTML = '';
        resultsList.innerHTML = '';

        const header = document.createElement('div');
        header.className = 'grid-data-header';
        header.innerHTML = '<strong>📝 Your guesses:</strong>';
        resultsHeader.appendChild(header);

        if (gridData.compactFormat && gridData.compactFormat.length > 0) {
            gridData.compactFormat.forEach(([word, colors]) => {
                const listItem = document.createElement('li');
                listItem.className = 'grid-data-item';
                listItem.innerHTML = `${word.toUpperCase()} - ${colors}`;
                resultsList.appendChild(listItem);
            });

            const noResultsDiv = document.createElement('div');
            noResultsDiv.className = 'no-results-warning';
            noResultsDiv.innerHTML = '⚠️ <em>Unable to get suggestions from server</em>';
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
        errorDiv.className = 'error-display';
        errorDiv.textContent = message;
        resultsHeader.appendChild(errorDiv);
    }

    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';

    // Add "Add Next Word" button
    const addNextWordButton = document.createElement('button');
    addNextWordButton.className = 'add-next-word-button';
    addNextWordButton.textContent = 'Add Next Word';

    addNextWordButton.addEventListener('click', function () {
        // Get the submitted words from sessionStorage
        const submittedWordsData = sessionStorage.getItem('submittedWords');

        if (submittedWordsData) {
            // Store it with a different key for restoration
            sessionStorage.setItem('restoreWords', submittedWordsData);
        }

        // Clear results but keep the restore flag
        sessionStorage.removeItem('wordleResults');
        sessionStorage.removeItem('wordleGridData');
        sessionStorage.removeItem('submittedWords');

        // Go back to main page
        window.location.href = '/';
    });

    // Add "Start Over" button (renamed from "Do it again")
    const startOverButton = document.createElement('button');
    startOverButton.className = 'start-over-button';
    startOverButton.textContent = 'Start Over';

    startOverButton.addEventListener('click', function () {
        // Clear all stored data
        sessionStorage.removeItem('wordleResults');
        sessionStorage.removeItem('wordleGridData');
        sessionStorage.removeItem('submittedWords');
        sessionStorage.removeItem('restoreWords');
        // Go back to main page
        window.location.href = '/';
    });

    // Add buttons to container
    buttonContainer.appendChild(addNextWordButton);
    buttonContainer.appendChild(startOverButton);

    // Add button container to the page
    document.querySelector('.main-container').appendChild(buttonContainer);
});