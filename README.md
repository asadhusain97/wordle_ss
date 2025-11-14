# Wordle Helper SS 🎮🔍

> **Screenshot Solver** - An intelligent Wordle assistant that uses computer vision and information theory to suggest optimal next guesses.

## Overview

**Wordle Helper SS** is a web application that helps solve Wordle puzzles by analyzing game screenshots or manual input. Using OpenCV for image processing, Tesseract for OCR, and information theory for word selection, it provides mathematically optimal word suggestions to help you maintain your Wordle streak.

### Key Capabilities

- **Screenshot Analysis**: Upload a Wordle screenshot and automatically extract the game state
- **Manual Grid Entry**: Type letters and cycle colors with a click-based interface
- **Intelligent Suggestions**: Uses entropy calculations to rank words by information gain
- **Dual Mode Support**: Works with both dark mode and light mode Wordle screenshots
- **Real-time Processing**: Instant suggestions after grid submission

## Why This Project Exists

Wordle is a fantastic word puzzle game, but sometimes you need a little help. This project demonstrates practical applications of:

- Computer vision techniques (contour detection, perspective transformation)
- Optical Character Recognition (OCR)
- Information theory and entropy-based decision making
- Full-stack web development with image processing

It's also a fun way to explore how machines can "see" and interpret visual information, then apply mathematical reasoning to solve problems.

## Features

### Core Features

- 📸 **Screenshot Upload**: Drag-and-drop or click to upload Wordle game screenshots
- ⌨️ **Manual Grid Entry**: Type letters directly and cycle through colors (gray → yellow → green)
- 🧠 **Entropy-Based Ranking**: Suggestions ranked by maximum information gain using information theory
- 🎯 **OCR Processing**: Automatic letter recognition from screenshots using Tesseract.js
- 🔄 **Perspective Correction**: Handles angled or skewed screenshots with OpenCV transformations
- 📊 **Ranked Results**: Top word suggestions with detailed reasoning
- 🎨 **Color Detection**: Accurate classification of green, yellow, and gray tiles using HSV color space

### Technical Features

- Contour detection for grid identification
- Perspective warping for image normalization
- Adaptive tile slicing for individual letter extraction
- Morphological operations for improved OCR accuracy
- Information entropy calculations for optimal word selection

## Tech Stack

### Frontend

- **HTML/CSS/JavaScript** - Core web technologies
- **OpenCV.js** - Computer vision and image processing
- **Tesseract.js** - Optical character recognition
- **ES6 Modules** - Modern JavaScript module system

### Backend

- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **wordle-solver** - Base word filtering and validation
- **@gueripep/wordle-solver** - Entropy calculation engine

## Project Structure

```bash
wordle_ss/
├── index.html                          # Main application page
├── results.html                        # Results display page
├── script.js                           # Main frontend logic
├── styles.css                          # Application styling
├── launch.js                           # Primary server entry point (recommended)
├── server.js                           # Alternative server entry point
├── process/                            # Core processing modules
│   ├── processWordleFromImage.js      # Main image processing orchestrator
│   ├── opencvBootstrap.js             # OpenCV initialization and utilities
│   ├── gridDetect.js                  # Grid detection using contour analysis
│   ├── warpAndTiles.js                # Perspective transformation and tile extraction
│   ├── colorAndOCR.js                 # Color classification and OCR processing
│   ├── applyGrid.js                   # DOM manipulation for grid updates
│   ├── wordleSolver.js                # Backend solver with entropy calculations
│   └── results-script.js              # Results page frontend logic
├── package.json                        # Node.js dependencies and scripts
└── README.md                           # This file
```

## How It Works

### Image Processing Pipeline

1. **Image Upload & Validation**
   - User uploads a Wordle screenshot
   - File is validated for type and size
   - Image is decoded to an ImageBitmap for processing

2. **Grid Detection**
   - OpenCV analyzes the image for contours
   - Identifies rectangular shapes matching Wordle grid proportions
   - Filters candidates by aspect ratio and area

3. **Perspective Correction**
   - Four corner points of the grid are identified
   - Perspective transformation warps the grid to a perfect rectangle
   - Output is a normalized 6×5 tile grid

4. **Tile Extraction**
   - Warped grid is divided into 30 individual tiles
   - Each tile is cropped and preprocessed for analysis

5. **Color Classification**
   - Tiles are converted to HSV color space
   - Mean HSV values are compared to reference centroids
   - Colors are classified as green, yellow, or gray

6. **OCR Processing**
   - Each tile undergoes preprocessing:
     - Border cropping
     - Grayscale conversion
     - Gaussian blur for noise reduction
     - Binary thresholding (OTSU method)
     - Morphological operations (dilation, closing)
   - Tesseract performs single-character recognition
   - Results are validated and post-processed

7. **Entropy Calculation**
   - Current game state is analyzed
   - Each candidate word is evaluated for information gain
   - Entropy scores are calculated based on how much each guess narrows down possible answers
   - Words are ranked by entropy (higher = better)

8. **Results Display**
   - Top suggestions are shown with ranking
   - Additional suggestions available via "View More" button
   - Metadata includes remaining possible words count

### Manual Entry Flow

1. **Letter Input**
   - Type letters using keyboard
   - Active cell advances automatically
   - Backspace to delete and move backwards

2. **Color Cycling**
   - Click any tile to cycle through colors: Gray → Yellow → Green
   - Row locking prevents editing completed rows until current row is filled

3. **Validation & Submission**
   - First row must be complete before solving
   - Incomplete rows with partial words are flagged
   - Valid grid state is sent to backend API

4. **API Processing**
   - Backend receives guesses in format: `[["word", "byygg"], ...]`
   - Solver filters possible words based on constraints
   - Top candidates are ranked by entropy and returned

## Installation

### Prerequisites

- **Node.js** (v14.0 or higher)
- **npm** (v6.0 or higher)
- Modern web browser with ES6 module support

### Setup Steps

1. **Clone the repository:**

   ```bash
   git clone https://github.com/yourusername/wordle_ss.git
   cd wordle_ss
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

   This installs:
   - Express.js (web server)
   - CORS middleware
   - wordle-solver (word filtering)
   - @gueripep/wordle-solver (entropy calculations)

3. **Verify installation:**

   ```bash
   npm run dev
   ```

## Usage

### Starting the Server

#### Recommended Method (launch.js)

```bash
npm run launch
```

- Starts server on port 3000 (or next available port)
- Serves files from project root
- Includes automatic port detection

#### Alternative Method (server.js)

```bash
npm start
```

- Starts server on port 3000
- Equivalent functionality to launch.js

#### Development Mode

```bash
npm run dev
```

- Enables hot-reload with nodemon
- Automatically restarts server on file changes
- Useful during development

### Using the Application

1. **Open your browser:**

    <http://localhost:3000>

2. **Screenshot Upload Method:**
   - Click "📷 Upload Screenshot" button
   - Select a Wordle screenshot from your device
   - Wait for automatic processing (5-10 seconds)
   - Grid populates automatically with detected letters and colors
   - Click "Solve" to get suggestions

3. **Manual Entry Method:**
   - Type letters directly into the grid using your keyboard
   - Click tiles to cycle colors: Gray → Yellow → Green
   - Arrow keys to navigate between cells
   - Click "Solve" when ready

4. **View Results:**
   - Results page shows top suggestions ranked by effectiveness
   - "View More Guesses" button expands to show additional options
   - Metadata shows remaining possible words count

## Algorithm Details

### Information Entropy

The solver uses Shannon entropy to measure information gain:

$$H(X) = -\sum_{x \in X} p(x) \log_2 p(x)$$

Where:

- `H(X)` = entropy of the guess
- `p(x)` = probability of a specific pattern occurring
- Higher entropy = more information gained

Each guess is evaluated against all remaining possible answers. The guess that maximizes expected information gain is ranked highest.

### Color Classification

Colors are classified using HSV (Hue, Saturation, Value) color space:

- **Green tiles**: H≈49-66, S≈89-98, V≈129-183
- **Yellow tiles**: H≈22, S≈124, V≈157-207
- **Gray tiles**: H≈85-114, S≈10-11, V≈65-146

Distance to reference centroids determines final classification using weighted Euclidean distance.

### OCR Preprocessing

To improve OCR accuracy, tiles undergo:

1. **Border cropping** (10px) - Removes tile borders
2. **Gaussian blur** (3×3 kernel) - Reduces noise
3. **Binary thresholding** (OTSU) - Converts to black/white
4. **Morphological dilation** (2×2 ellipse kernel) - Thickens letters
5. **Morphological closing** (3×3 ellipse kernel) - Fills gaps
6. **Upscaling** (2x) - Improves recognition

## Known Limitations

### Current Issues

- **OCR Accuracy**: Character 'O' sometimes misread as '0' (confidence threshold set to 30%)
- **Screenshot Quality**: Works best with high-resolution, well-lit screenshots
- **Perspective Limits**: Extreme angles (>45° rotation) may fail grid detection
- **Light Mode vs Dark Mode**: Dark mode screenshots generally produce better results

### Future Improvements

- Machine learning model for improved letter recognition
- Support for other games like Scrabble, etc.
- Historical tracking of solve patterns

## Contributing

Contributions are welcome! Here's how you can help:

### Reporting Issues

- Use GitHub Issues for bug reports
- Include screenshot examples for visual bugs
- Provide browser/OS information for compatibility issues

### Code Contributions

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes with clear commit messages
4. Test thoroughly (both screenshot and manual entry modes)
5. Submit a pull request with description of changes

### Development Guidelines

- Follow existing code style (ESLint configuration coming soon)
- Comment complex algorithms and transformations
- Update README for new features or API changes
- Test with both dark and light mode screenshots

## License

MIT License

Copyright (c) 2025 Asad Husain

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Acknowledgments

- **Wordle** by Josh Wardle - The original game that inspired this project
- **OpenCV.js** - Powerful computer vision library compiled to JavaScript
- **Tesseract.js** - Pure JavaScript OCR engine
- **wordle-solver** by Christoph Hain - Word filtering and validation
- **@gueripep/wordle-solver** by Pierre Guerip - Entropy calculation implementation

## Credits

Developed by [Asad Husain](https://asadhusain97.github.io/)

If you find this project helpful, consider:

- ⭐ Starring the repository
- 🐛 Reporting bugs or suggesting features
- 🔀 Contributing code improvements
- 📢 Sharing with fellow Wordle enthusiasts

## Support

For questions, issues, or suggestions:

- **GitHub Issues**: [Project Issues Page](https://github.com/yourusername/wordle_ss/issues)
- **Email**: Available through portfolio link
- **Portfolio**: [asadhusain97.github.io](https://asadhusain97.github.io/)

---

**Happy Wordling!** 🎉

*Built with Node.js, OpenCV, and a healthy appreciation for information theory.*
