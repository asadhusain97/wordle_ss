const express = require('express');
const cors = require('cors');
const path = require('path');
const uploadRoute = require('./routes/upload');
const { solveWordle } = require('./services/wordleSolver');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Serve CSS with correct content type
app.use('/css', express.static(path.join(__dirname, '../frontend/css'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        }
    }
}));

// Serve JS files with correct content type
app.use('/js', express.static(path.join(__dirname, '../frontend/js'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
    }
}));

// API Routes
app.use('/api', uploadRoute);

// Wordle solver API endpoint
app.post('/api/get-results', async (req, res) => {
    console.log('=== Wordle Solver API Request ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Request headers:', req.headers);

    try {
        const { guesses } = req.body;

        // Log the incoming guesses
        console.log('Processing guesses:', guesses);

        if (!guesses || !Array.isArray(guesses)) {
            console.log('❌ Invalid request: guesses must be an array');
            return res.status(400).json({
                error: 'Invalid request: guesses must be an array',
                received: typeof guesses
            });
        }

        if (guesses.length === 0) {
            console.log('ℹ️ No guesses provided, returning first guess suggestions');
            return res.json({
                suggestions: ['SLATE', 'CRANE', 'ADIEU', 'AUDIO', 'OUIJA'],
                nextBest: 'SLATE',
                remainingCount: 2315,
                gameComplete: false,
                message: 'Starting suggestions - try one of these popular first words!'
            });
        }

        // Call the solver with more guesses to get better results
        console.log('🔄 Calling wordle solver...');
        const result = solveWordle(guesses, {
            count: 20, // Get 20 guesses so we can show top 5 + view more
            includeGameState: true
        });

        console.log('✅ Solver result:', JSON.stringify(result, null, 2));

        // Extract ranked guesses (convert to simple array of words)
        const allSuggestions = result.rankedGuesses ?
            result.rankedGuesses.map(item => item.word.toUpperCase()) :
            [];

        // Get game state info
        const gameState = result.gameState || {};
        const remainingCount = gameState.remainingPossibilities || allSuggestions.length;
        const gameComplete = remainingCount === 1;

        // Prepare response
        const response = {
            suggestions: allSuggestions,
            nextBest: result.nextBestGuess ? result.nextBestGuess.toUpperCase() : (allSuggestions[0] || 'SLATE'),
            remainingCount: remainingCount,
            gameComplete: gameComplete,
            totalSuggestions: allSuggestions.length
        };

        if (gameComplete) {
            response.message = '🎉 Puzzle solved! Only one word remaining.';
        }

        console.log('📤 Sending response:', JSON.stringify(response, null, 2));
        res.json(response);

    } catch (error) {
        console.error('❌ Error processing request:', error);
        console.error('Error stack:', error.stack);

        // Send a user-friendly error response
        res.status(500).json({
            error: 'Failed to process Wordle solver request',
            details: error.message,
            suggestions: ['SLATE', 'CRANE', 'ADIEU'], // Fallback suggestions
            nextBest: 'SLATE',
            remainingCount: 'unknown'
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    console.log('🔍 Health check requested');
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'Wordle Solver API'
    });
});

// Serve frontend
app.get('/', (req, res) => {
    console.log('📄 Serving main page');
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/results.html', (req, res) => {
    console.log('📄 Serving results page');
    res.sendFile(path.join(__dirname, '../frontend/results.html'));
});

// Handle 404s
app.use((req, res) => {
    console.log('❌ 404 - Route not found:', req.path);
    res.status(404).json({
        error: 'Route not found',
        path: req.path,
        availableRoutes: [
            'GET /',
            'GET /results.html',
            'POST /api/upload',
            'POST /api/get-results',
            'GET /api/health'
        ]
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('🚨 Unhandled server error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: error.message
    });
});

// Start server
app.listen(PORT, () => {
    console.log('🚀 =================================');
    console.log(`🚀 Wordle Solver Server is running!`);
    console.log(`🚀 Port: ${PORT}`);
    console.log(`🚀 URL: http://localhost:${PORT}`);
    console.log('🚀 =================================');
    console.log('📡 Available endpoints:');
    console.log('   GET  /                - Main page');
    console.log('   GET  /results.html    - Results page');
    console.log('   POST /api/upload      - Upload image');
    console.log('   POST /api/get-results - Solve wordle');
    console.log('   GET  /api/health      - Health check');
    console.log('🚀 =================================');
});

module.exports = app;