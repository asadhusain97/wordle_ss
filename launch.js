const express = require('express');
const cors = require('cors');
const path = require('path');
const { WordleSolver, solveWordle } = require('./backend/services/wordleSolver');

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_PORT = process.env.FRONTEND_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Serve frontend files from the frontend directory
const frontendPath = path.join(__dirname, 'frontend');

app.get('/', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

app.get('/results.html', (req, res) => {
    res.sendFile(path.join(frontendPath, 'results.html'));
});

app.get('/styles.css', (req, res) => {
    res.sendFile(path.join(frontendPath, 'css', 'styles.css'));
});

app.get('/script.js', (req, res) => {
    res.sendFile(path.join(frontendPath, 'js', 'script.js'));
});

app.get('/results-script.js', (req, res) => {
    res.sendFile(path.join(frontendPath, 'js', 'results-script.js'));
});

// API Routes
app.post('/api/solve', (req, res) => {
    try {
        const { guesses, options = {} } = req.body;

        console.log('Received solve request:', { guesses, options });

        if (!guesses || !Array.isArray(guesses) || guesses.length === 0) {
            return res.status(400).json({
                error: 'Invalid input: guesses array is required',
                hint: 'Try starting with SLATE or CRANE for your first guess'
            });
        }

        const result = solveWordle(guesses, {
            count: options.count || 10,
            includeGameState: options.includeGameState !== false
        });

        console.log('Solve result:', result);
        res.json(result);

    } catch (error) {
        console.error('Error solving Wordle:', error);
        res.status(500).json({
            error: 'Failed to solve Wordle puzzle',
            message: error.message
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'Wordle Solver SS Backend'
    });
});

// Example endpoint for testing
app.get('/api/example', (req, res) => {
    const exampleGuesses = [['arose', 'bybgg']];

    try {
        const result = solveWordle(exampleGuesses, { count: 5 });
        res.json({
            example: {
                input: exampleGuesses,
                output: result
            },
            message: 'This is an example of how the solver works'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Enhanced results endpoint for frontend
app.post('/api/get-results', (req, res) => {
    try {
        const { guesses } = req.body;

        if (!guesses || guesses.length === 0) {
            return res.json({
                suggestions: ['SLATE', 'CRANE', 'ADIEU', 'AUDIO', 'ROATE'],
                message: 'No guesses provided. Here are some great starting words!'
            });
        }

        const result = solveWordle(guesses, { count: 10, includeGameState: true });

        res.json({
            suggestions: result.rankedGuesses.map(g => g.word.toUpperCase()),
            nextBest: result.nextBestGuess?.toUpperCase(),
            remainingCount: result.gameState?.remainingPossibilities || 0,
            gameComplete: result.gameState?.gameComplete || false
        });

    } catch (error) {
        console.error('Error getting results:', error);
        res.json({
            suggestions: ['ERROR', 'CHECK', 'INPUT', 'AGAIN', 'PLEASE'],
            error: error.message
        });
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🎯 Wordle Solver SS Server running on http://localhost:${PORT}`);
    console.log(`📁 Serving frontend files from current directory`);
    console.log(`🔧 Backend API available at http://localhost:${PORT}/api/`);
    console.log(`🌐 Open http://localhost:${PORT} in your browser to start!`);
    console.log(`\n📋 Available endpoints:`);
    console.log(`   • GET  /                    - Main Wordle Solver interface`);
    console.log(`   • GET  /results.html        - Results page`);
    console.log(`   • POST /api/solve           - Solve Wordle puzzle`);
    console.log(`   • POST /api/get-results     - Get formatted results for frontend`);
    console.log(`   • GET  /api/example         - Example API usage`);
    console.log(`   • GET  /api/health          - Health check`);
});