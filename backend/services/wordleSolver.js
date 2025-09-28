const Solver = require('wordle-solver');

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

    getNextBestGuesses(count = 10) {
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

    getRankedNextGuesses(count = 10) {
        try {
            const bestGuesses = this.getNextBestGuesses(count);
            const possibleWords = this.getPossibleWords();

            const rankedGuesses = bestGuesses.map((guess, index) => ({
                rank: index + 1,
                word: guess,
                isPossibleAnswer: possibleWords.includes(guess)
            }));

            this.logger.log(`Ranked list of ${rankedGuesses.length} best next guesses prepared`);
            return rankedGuesses;
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
            const bestGuess = this.getNextBestGuess();

            return {
                remainingPossibilities: possibleWords.length,
                possibleWords: possibleWords.slice(0, 20),
                nextBestGuess: bestGuess,
                gameComplete: possibleWords.length === 1
            };
        } catch (error) {
            this.logger.error('Error getting game state:', error);
            throw new Error(`Failed to get game state: ${error.message}`);
        }
    }
}

function solveWordle(guesses, options = {}) {
    const { count = 10, includeGameState = false } = options;

    try {
        const solver = new WordleSolver();
        solver.processGuessResults(guesses);

        const result = {
            rankedGuesses: solver.getRankedNextGuesses(count),
            nextBestGuess: solver.getNextBestGuess()
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
    solveWordle
};