# Wordle Solver Vision

## Description

Wordle Solver Vision is a web application designed to assist Wordle players by providing optimal next-word suggestions. Users can upload a screenshot of their current Wordle game, and the application will use computer vision to analyze the image, determine the game state (green, yellow, and gray letters), and suggest the best possible next guess from a list of valid words.

## Features

* **Image Upload**: A simple interface for users to upload a screenshot of their Wordle game.
* **Screenshot Analysis**: Backend computer vision logic to parse the uploaded image, identifying letters and their corresponding colors (correct, present, absent).
* **Word Suggestion**: An algorithm that takes the analyzed game state and calculates the next best word to play.
* **Word List**: A secondary list of all other possible words that fit the current criteria.

## Tech Stack

* **Frontend**: HTML, CSS, JavaScript
* **Backend**: Node.js with Express.js
* **CV/Analysis**: Tesseract.js for OCR and Sharp for image processing

## Getting Started

### Prerequisites

* Node.js (v14 or higher)
* npm

### Installation

1. Clone the repository:

     ```sh
    git clone <your-repo-url>
    ```

2. Navigate to the backend directory and install dependencies:

    ```sh
    cd backend
    npm install
    ```

3. (Optional) Install frontend dependencies if needed:

    ```sh
    cd ../frontend
    # npm install if you add packages later
    ```

## Usage

1. Run the backend server from the `backend` directory:

    ```sh
    npm start
    # or for development with auto-reload:
    npm run dev
    ```

2. Open the `index.html` file in your browser to use the application.
3. Upload a screenshot of your Wordle game.
4. View the suggested next word and the list of other possibilities.
