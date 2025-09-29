const express = require('express');
const cors = require('cors');
const path = require('path');
const uploadRoute = require('./routes/upload');
const { solveWordle, WordleSolver } = require('./services/wordleSolver');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`📝 [REQUEST] ${req.method} ${req.url} - ${new Date().toISOString()}`);
    console.log(`📝 [REQUEST] Headers:`, JSON.stringify(req.headers, null, 2));
    next();
});

// IMPORTANT: Specific route handlers must come BEFORE the generic static handler
// to ensure correct Content-Type headers for ES modules

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

// Serve image processing modules with correct content type
app.use('/img', express.static(path.join(__dirname, '../frontend/img'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
    }
}));

// Serve UI modules with correct content type
app.use('/ui', express.static(path.join(__dirname, '../frontend/ui'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
    }
}));

// Serve process modules with correct content type
app.use('/process', (req, res, next) => {
    console.log(`🔍 [PROCESS ROUTE] Request: ${req.method} ${req.url}`);
    console.log(`🔍 [PROCESS ROUTE] Full path: ${req.path}`);
    console.log(`🔍 [PROCESS ROUTE] Looking for file at: ${path.join(__dirname, '../frontend/process', req.url)}`);
    next();
}, express.static(path.join(__dirname, '../frontend/process'), {
    setHeaders: (res, filePath) => {
        console.log(`🔍 [PROCESS ROUTE] Setting headers for: ${filePath}`);
        if (filePath.endsWith('.js')) {
            console.log(`🔍 [PROCESS ROUTE] Setting Content-Type to application/javascript`);
            res.setHeader('Content-Type', 'application/javascript');
        }
    }
}));

// Generic static handler - MUST come after specific handlers
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api', uploadRoute);

// Word validation API endpoint
app.post('/api/validate-words', async (req, res) => {
    console.log('=== Word Validation API Request ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    try {
        const { words } = req.body;

        if (!words || !Array.isArray(words)) {
            console.log('❌ Invalid request: words must be an array');
            return res.status(400).json({
                error: 'Invalid request: words must be an array',
                received: typeof words
            });
        }

        if (words.length === 0) {
            console.log('ℹ️ No words provided for validation');
            return res.json({
                isValid: true,
                invalidWords: [],
                totalChecked: 0,
                message: 'No words to validate'
            });
        }

        // Create a temporary solver instance for word validation
        const solver = new WordleSolver();
        console.log('🔍 Validating words against Wordle word list...');

        const validation = solver.validateWords(words);

        console.log('✅ Validation result:', JSON.stringify(validation, null, 2));

        const response = {
            isValid: validation.isValid,
            invalidWords: validation.invalidWords,
            totalChecked: validation.totalChecked
        };

        if (!validation.isValid) {
            const wordText = validation.invalidWords.length === 1 ? 'word' : 'words';
            response.message = `${validation.invalidWords.length} ${wordText} not found in Wordle word list: ${validation.invalidWords.join(', ')}`;
        } else {
            response.message = `All ${validation.totalChecked} words are valid Wordle words`;
        }

        console.log('📤 Sending validation response:', JSON.stringify(response, null, 2));
        res.json(response);

    } catch (error) {
        console.error('❌ Error validating words:', error);
        console.error('Error stack:', error.stack);

        res.status(500).json({
            error: 'Failed to validate words',
            details: error.message,
            isValid: false
        });
    }
});

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
            response.message = '🎉 Puzzle solved! Are you testing me?';
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
            'POST /api/validate-words',
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
    console.log('   POST /api/validate-words - Validate Wordle words');
    console.log('   POST /api/get-results - Solve wordle');
    console.log('   GET  /api/health      - Health check');
    console.log('🚀 =================================');
});

module.exports = app;