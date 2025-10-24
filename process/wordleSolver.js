const Solver = require('wordle-solver');

// Configuration: Number of candidates to generate and sort
const CANDIDATE_COUNT = 100;

// Inline entropy calculation for browser compatibility
function calculateWordleFeedback(guess, target) {
    const guessLower = guess.toLowerCase();
    const targetLower = target.toLowerCase();
    const result = [];
    const usedTargetIndices = new Set();

    // First pass: mark correct positions (green)
    for (let i = 0; i < 5; i++) {
        if (guessLower[i] === targetLower[i]) {
            result[i] = { letter: guessLower[i], state: 'CORRECT' };
            usedTargetIndices.add(i);
        } else {
            result[i] = { letter: guessLower[i], state: 'ABSENT' };
        }
    }

    // Second pass: check for present letters (yellow)
    for (let i = 0; i < 5; i++) {
        if (result[i].state === 'ABSENT') {
            for (let j = 0; j < 5; j++) {
                if (!usedTargetIndices.has(j) && guessLower[i] === targetLower[j]) {
                    result[i].state = 'PRESENT';
                    usedTargetIndices.add(j);
                    break;
                }
            }
        }
    }
    return result;
}

function feedbackToString(feedback) {
    return feedback.map(f => `${f.letter}:${f.state}`).join('|');
}

function calculateAverageEntropy(guess, wordList) {
    const feedbackCounts = new Map();

    // Calculate feedback for each possible target word
    for (const target of wordList) {
        const feedback = calculateWordleFeedback(guess, target);
        const feedbackKey = feedbackToString(feedback);
        feedbackCounts.set(feedbackKey, (feedbackCounts.get(feedbackKey) || 0) + 1);
    }

    // Calculate entropy: sum of -p * log2(p)
    const totalWords = wordList.length;
    let entropy = 0;
    for (const count of feedbackCounts.values()) {
        const probability = count / totalWords;
        if (probability > 0) {
            entropy += probability * (-Math.log2(probability));
        }
    }
    return entropy;
}

class WordleSolver {
    constructor() {
        this.solver = new Solver();
        this.logger = console;
    }

    validateInput(guesses) {
        const errors = [];

        if (!Array.isArray(guesses)) {
            errors.push('Guesses must be an array');
            return { isValid: false, errors };
        }

        if (guesses.length === 0) {
            errors.push('Are you using this for the first guess? Try SLATE or CRANE.');
            return { isValid: false, errors };
        }

        guesses.forEach((guess, index) => {
            if (!Array.isArray(guess) || guess.length !== 2) {
                errors.push(`Guess ${index + 1}: Must be an array with exactly 2 elements [word, colors]`);
                return;
            }

            const [word, colors] = guess;

            if (typeof word !== 'string') {
                errors.push(`Guess ${index + 1}: Word must be a string`);
            } else if (!/^[a-zA-Z]{5}$/.test(word)) {
                errors.push(`Guess ${index + 1}: Word must be exactly 5 letters containing only alphabetic characters`);
            }

            if (typeof colors !== 'string') {
                errors.push(`Guess ${index + 1}: Colors must be a string`);
            } else if (!/^[gybGYB]{5}$/.test(colors)) {
                errors.push(`Guess ${index + 1}: Colors must be exactly 5 characters using only 'g' (green), 'y' (yellow), 'b' (black/gray)`);
            }

            if (word && colors && word.length !== colors.length) {
                errors.push(`Guess ${index + 1}: Word and colors must have the same length`);
            }
        });

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    processGuessResults(guesses) {
        const validation = this.validateInput(guesses);
        if (!validation.isValid) {
            throw new Error(`Input validation failed: ${validation.errors.join(', ')}`);
        }

        this.logger.log(`Processing ${guesses.length} guess(es)`);

        guesses.forEach((guess, index) => {
            const [word, colors] = guess;
            const normalizedWord = word.toLowerCase();
            const normalizedColors = colors.toLowerCase();

            this.logger.log(`Processing guess ${index + 1}: "${normalizedWord}" with colors "${normalizedColors}"`);

            this.solver.guess(normalizedWord, normalizedColors);

            this.logger.log(`  - Applied guess to solver`);
        });

        return this;
    }

    getNextBestGuess() {
        try {
            const bestGuess = this.solver.getNextBestGuess();
            this.logger.log(`Best next guess: "${bestGuess}"`);
            return bestGuess;
        } catch (error) {
            this.logger.error('Error getting next best guess:', error);
            throw new Error(`Failed to get next best guess: ${error.message}`);
        }
    }

    getNextBestGuesses(count = CANDIDATE_COUNT) {
        try {
            const bestGuesses = this.solver.getNextBestGuesses(count);
            this.logger.log(`Top ${count} best guesses:`, bestGuesses);
            return bestGuesses;
        } catch (error) {
            this.logger.error('Error getting next best guesses:', error);
            throw new Error(`Failed to get next best guesses: ${error.message}`);
        }
    }

    getPossibleWords() {
        try {
            const possibleWords = this.solver.getPossibleWords();
            this.logger.log(`${possibleWords.length} possible words remaining`);
            return possibleWords;
        } catch (error) {
            this.logger.error('Error getting possible words:', error);
            throw new Error(`Failed to get possible words: ${error.message}`);
        }
    }

    /**
     * Sorts candidates using entropy-based information theory from /wordle-solver
     * @param {number} count - Number of initial candidates to evaluate
     * @returns {Promise<Array>} - Ranked list sorted by entropy (highest first)
     */
    async sortByEntropy(count = CANDIDATE_COUNT) {
        try {
            // Get initial candidates from the original solver
            const candidates = this.getNextBestGuesses(count);

            if (!candidates || candidates.length === 0) {
                throw new Error('NO_CANDIDATES');
            }

            this.logger.log(`Sorting ${candidates.length} candidates using entropy calculation...`);

            // Get all possible remaining words as the answer space
            const possibleAnswers = this.getPossibleWords();

            if (possibleAnswers.length === 0) {
                throw new Error('NO_CANDIDATES');
            }

            this.logger.log(`Evaluating against ${possibleAnswers.length} possible answers`);

            // Use inline entropy calculation (works in both Node and browser)
            const rankedByEntropy = candidates.map((word) => {
                try {
                    const entropy = calculateAverageEntropy(
                        word.toLowerCase(),
                        possibleAnswers.map(w => w.toLowerCase())
                    );

                    return {
                        word: word.toLowerCase(),
                        entropy: entropy,
                        isPossibleAnswer: possibleAnswers.includes(word.toLowerCase())
                    };
                } catch (error) {
                    this.logger.error(`Error calculating entropy for "${word}":`, error.message);
                    return {
                        word: word.toLowerCase(),
                        entropy: 0,
                        isPossibleAnswer: possibleAnswers.includes(word.toLowerCase()),
                        error: true
                    };
                }
            });

            // Log entropy scores before sorting (original order from wordle-solver)
            this.logger.log('=== Original Ranking (from wordle-solver) ===');
            const originalOrder = candidates.slice(0, 10).map((word, index) => {
                const matchingEntry = rankedByEntropy.find(item => item.word === word.toLowerCase());
                this.logger.log(`  ${index + 1}. "${word.toUpperCase()}" → Entropy: ${matchingEntry.entropy.toFixed(4)} bits`);
                return {
                    word: word.toLowerCase(),
                    originalRank: index + 1,
                    entropy: matchingEntry.entropy
                };
            });

            // Sort by entropy (highest first)
            rankedByEntropy.sort((a, b) => b.entropy - a.entropy);

            // Log entropy scores after sorting and show rank changes
            this.logger.log('\n=== After Entropy Sorting (Re-ranked) ===');
            rankedByEntropy.slice(0, 10).forEach((item, index) => {
                const newRank = index + 1;
                const originalData = originalOrder.find(o => o.word === item.word);
                const oldRank = originalData ? originalData.originalRank : '?';
                const rankChange = originalData ? (originalData.originalRank - newRank) : 0;
                const arrow = rankChange > 0 ? `↑${rankChange}` : rankChange < 0 ? `↓${Math.abs(rankChange)}` : '—';

                this.logger.log(`  ${newRank}. "${item.word.toUpperCase()}" → Entropy: ${item.entropy.toFixed(4)} bits [${arrow} was #${oldRank}]`);
            });

            // Assign ranks
            rankedByEntropy.forEach((item, index) => {
                item.rank = index + 1;
            });

            const topGuess = rankedByEntropy[0];
            const originalTopData = originalOrder.find(o => o.word === topGuess.word);
            const wasRank = originalTopData ? originalTopData.originalRank : '?';
            this.logger.log(`\n✅ Best guess after entropy sorting: "${topGuess.word.toUpperCase()}" (was #${wasRank}, entropy: ${topGuess.entropy.toFixed(4)} bits)`);

            return rankedByEntropy;
        } catch (error) {
            this.logger.error('Error sorting by entropy:', error);
            throw new Error(`Failed to sort by entropy: ${error.message}`);
        }
    }

    async getRankedNextGuesses(count = CANDIDATE_COUNT) {
        try {
            // Use entropy-based sorting for better ranking
            const rankedByEntropy = await this.sortByEntropy(count);

            this.logger.log(`Created ranked list of ${rankedByEntropy.length} guesses using information theory`);

            return rankedByEntropy;
        } catch (error) {
            this.logger.error('Error creating ranked guess list:', error);
            throw new Error(`Failed to create ranked guess list: ${error.message}`);
        }
    }

    resetSolver() {
        this.solver = new Solver();
        this.logger.log('Solver has been reset');
        return this;
    }

    getGameState() {
        try {
            const possibleWords = this.getPossibleWords();
            const nextBestGuess = possibleWords.length > 0 ? this.getNextBestGuess() : null;

            return {
                remainingPossibilities: possibleWords.length,
                possibleWords: possibleWords.slice(0, CANDIDATE_COUNT),
                nextBestGuess: nextBestGuess,
                gameComplete: possibleWords.length === 1
            };
        } catch (error) {
            this.logger.error('Error getting game state:', error);
            throw new Error(`Failed to get game state: ${error.message}`);
        }
    }

    validateWords(words) {
        try {
            this.logger.log(`Validating ${words.length} words against Wordle word list`);

            const allValidWords = this.solver.getAllWords();
            const invalidWords = words.filter(word => !allValidWords.includes(word.toLowerCase()));

            return {
                isValid: invalidWords.length === 0,
                invalidWords: invalidWords,
                totalChecked: words.length
            };
        } catch (error) {
            this.logger.error('Error validating words:', error);
            throw new Error(`Failed to validate words: ${error.message}`);
        }
    }
}

async function solveWordle(guesses, options = {}) {
    const { count = CANDIDATE_COUNT, includeGameState = false } = options;

    try {
        const solver = new WordleSolver();
        solver.processGuessResults(guesses);

        const rankedGuesses = await solver.getRankedNextGuesses(count);

        const result = {
            rankedGuesses: rankedGuesses,
            nextBestGuess: rankedGuesses[0].word
        };

        if (includeGameState) {
            result.gameState = solver.getGameState();
        }

        return result;
    } catch (error) {
        throw new Error(`Wordle solving failed: ${error.message}`);
    }
}

module.exports = {
    WordleSolver,
    solveWordle,
    CANDIDATE_COUNT
};