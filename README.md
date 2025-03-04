# CRM ScreenHub  - Application

## Introduction

This document provides an overview of the CRM-ScreenHub Socket application, including setup instructions, configuration details, and usage guidelines.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Dependencies](#Dependencies)
4. [Configuration](#configuration)
5. [Running the Application](#running-the-application)
6. [Folder Structure](#folder-structure)
7. [Troubleshooting](#troubleshooting)
8. [Contributing](#contributing)

## Prerequisites

- Node.js (version 14.x or higher) Install Node.js from [Node.js official website](https://nodejs.org/)
- npm (version 6.x or higher)
- Requires WebSocket-compatible browsers for clients and a Node.js server running

## Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/yourusername/CRM-ScreenHub
    ```
2. Navigate to the project directory:
    ```sh
    cd CRM-ScreenHub
    ```
3. Install dependencies:
    ```sh
    npm install
    ```

## Dependencies

```
"body-parser": "^1.20.3",
"cors": "^2.8.5",
"dotenv": "^16.4.5",
"express": "^4.21.1",
"nodemon": "^3.1.7",
"socket.io": "^4.8.1"
```

- `body-parser`: Middleware to parse incoming request bodies, making them accessible via req.body.
- `dotenv`: Loads environment variables from .env files into process.env.
- `cors`: Middleware for enabling Cross-Origin Resource Sharing (CORS), allowing APIs to handle requests from different origins.
- `express`: A popular web framework for building APIs and web apps in Node.js.
- `nodemon`: Watches your project files and restarts the server automatically on changes.
- `socket.io`: Library for real-time communication, enabling WebSocket connections between clients and servers.

## Configuration

1. Create a `.env.development` and `.env.production` file in the root directory and add the following environment variables:
    ```env

    PORT = 7000

    ```

## Running the Application

1. Start Socket app:
    ```sh
    npm run dev
    ```

## Folder Structure

The following is the folder structure of the API:

```
CRM-ScreenHub/
├── .env
├── .gitignore
├── app.js
├── package-lock.json
└── package.json
```

## Troubleshooting

- Check the `.env`file for correct configuration.

## Contributing

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Commit your changes (`git commit -am 'Add new feature'`).
4. Push to the branch (`git push origin feature-branch`).
5. Create a new Pull Request.