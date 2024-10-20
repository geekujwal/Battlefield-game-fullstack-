
# Battlefield Game

This is a real-time multiplayer battlefield game built with React, Node.js, and Socket.IO. It was created as part of a challenge and was built from the ground up within a few hours. As a result, the code quality and structure may not follow best practices.

## Project Structure


`/client   # React front-end`

`/backend  # Node.js back-end with Socket.IO for real-time communication` 

## Prerequisites

-   Node.js (version 14.x or higher)
-   npm (Node Package Manager) or yarn

## Setup and Running the Project

### 1. Clone the repository


`git clone <your-repo-url>
cd battlefield-game` 

### 2. Install dependencies

For the back-end:


`cd backend
npm i` 

For the front-end:

`cd ../client
npm install` 

### 3. Run the application

To run both the server and client, you'll need two separate terminal instances.

#### Start the back-end server

`cd backend
npm start` 

#### Start the front-end React app


`cd client
npm run dev` 

### 4. Access the game

Open your browser and navigate to:

`http://localhost:5173/` 

This will load the React front-end, and the Socket.IO server will handle real-time gameplay interactions.

## Notes

-   The app was developed in a rush for a challenge, so expect rough code, minimal comments, and poor folder structure.
-   Feel free to refactor and improve the codebase as needed.