# Inferno AI

A simple AI chat assistant. This is a learning project, built with Node.js, Express and the Google Gemini API.

## What it does
- Chat page with a welcome screen
- Answers questions, including step-by-step math in plain text
- Uses a fast model for easy questions and a stronger model for hard ones

## How to run it
1. Install Node.js
2. Download this project and open the folder in a terminal
3. Install packages:

    npm install

4. Create a file named .env and add your own Gemini API key:

    GEMINI_API_KEY=your_key_here

5. Start the app:

    node server.js

6. Open http://localhost:3000

## Notes
- Never share your API key or upload your .env file.
- The free Gemini tier has limits, and Google may use free-tier data, so do not type private information.
- Still a work in progress.
