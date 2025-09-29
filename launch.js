const express = require('express');
const cors = require('cors');
const path = require('path');
const { solveWordle } = require('./backend/services/wordleSolver');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Serve frontend files from the frontend directory
const frontendPath = path.join(__dirname, 'frontend');

// Serve CSS with correct content type
app.use('/css', express.static(path.join(__dirname, 'frontend/css'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        }
    }
}));

// Serve JS files with correct content type
app.use('/js', express.static(path.join(__dirname, 'frontend/js'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
    }
}));

app.get('/', (req, res) => {
    console.log('📄 Serving main page');
    res.sendFile(path.join(frontendPath, 'index.html'));
});

app.get('/results.html', (req, res) => {
    console.log('📄 Serving results page');
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

// Enhanced results endpoint for frontend with comprehensive logging
app.post('/api/get-results', (req, res) => {
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

// API Routes (backward compatibility)
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
    console.log('🔍 Health check requested');
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

// 404 handler
app.use((req, res) => {
    console.log('❌ 404 - Route not found:', req.path);
    res.status(404).json({
        error: 'Endpoint not found',
        availableRoutes: [
            'GET /',
            'GET /results.html',
            'POST /api/get-results',
            'POST /api/solve',
            'GET /api/health',
            'GET /api/example'
        ]
    });
});

// Function to find available port
function findAvailablePort(startPort) {
    return new Promise((resolve, reject) => {
        const server = require('net').createServer();

        server.listen(startPort, (err) => {
            if (err) {
                // Port is in use, try next port
                server.close();
                findAvailablePort(startPort + 1).then(resolve).catch(reject);
            } else {
                // Port is available
                const port = server.address().port;
                server.close();
                resolve(port);
            }
        });

        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                // Port is in use, try next port
                findAvailablePort(startPort + 1).then(resolve).catch(reject);
            } else {
                reject(err);
            }
        });
    });
}

// Start server with automatic port finding
async function startServer() {
    try {
        const availablePort = await findAvailablePort(PORT);

        const server = app.listen(availablePort, () => {
            console.log('🚀 =================================');
            console.log(`🎯 Wordle Solver SS Server running on http://localhost:${availablePort}`);
            console.log(`📁 Serving frontend files from current directory`);
            console.log(`🔧 Backend API available at http://localhost:${availablePort}/api/`);
            console.log(`🌐 Open http://localhost:${availablePort} in your browser to start!`);
            if (availablePort !== PORT) {
                console.log(`⚠️  Note: Port ${PORT} was in use, using port ${availablePort} instead`);
            }
            console.log('🚀 =================================');
            console.log(`📋 Available endpoints:`);
            console.log(`   • GET  /                    - Main Wordle Solver interface`);
            console.log(`   • GET  /results.html        - Results page`);
            console.log(`   • POST /api/solve           - Solve Wordle puzzle`);
            console.log(`   • POST /api/get-results     - Get formatted results for frontend`);
            console.log(`   • GET  /api/example         - Example API usage`);
            console.log(`   • GET  /api/health          - Health check`);
            console.log('🚀 =================================');
        });

        // Handle server errors
        server.on('error', (err) => {
            console.error('🚨 Server error:', err);
            if (err.code === 'EADDRINUSE') {
                console.log(`❌ Port ${availablePort} is in use. Trying to find another port...`);
                startServer(); // Try again with next available port
            }
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Start the server
startServer();

module.exports = app;