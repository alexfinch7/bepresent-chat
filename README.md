# BePresent Config Bot

Bea, a chatbot, interacts with users to understand their phone usage habits and goals, and then creates a personalized blocking schedule and intensity score for the app.

## Features

- **Interactive Chat**: Engages users in a friendly, spa-like conversation to gather necessary data.
- **Custom Schedule Setup**: Automatically configures phone blocking schedules based on user input.
- **Goal Setting**: Provides an intensity score based on user's desired screen time reduction.
- **JSON Configuration**: Saves the configuration to a JSON file for easy access and updates.

## Prerequisites

- [Node.js](https://nodejs.org/en/download/) (version 14 or higher)
- [npm](https://www.npmjs.com/get-npm)

## Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/bepresent-config-bot.git
   cd bepresent-config-bot
2. **Install dependencies**:
   ```bash
   npm install

3. **Set up environment variables**:
   Create a .env file in the root directory of the project.
   Add your OpenAI API key to the .env file:
   ```bash
   OPENAI_API_KEY=your_openai_api_key

## Usage
   ```bash
   npm run start
   ```
   Output JSON will be stored in the project directory as be_present_config.json