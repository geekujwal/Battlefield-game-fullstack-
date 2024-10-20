const server = require('http').createServer();
const io = require('socket.io')(server, {
    cors: {
        origin: "http://localhost:5173"
    }

});

const { v4: uuidv4 } = require("uuid");
const uuid = uuidv4();

var users = []
var userInQueue = [

];

var games = []

io.on('connection', client => {

    client.on('queue', data => {

        console.log("data is", data)
        var message = data
        var alreadyExists = userInQueue.find(x => x.username == message.username)
        var userAlreadyExists = users.find(x => x.username == message.username)
        if (userAlreadyExists) {
            if (!userAlreadyExists.connections.includes(client.id)) {
                userAlreadyExists.connections.push(client.id);
            }
        }
        else {
            users.push({
                username: message.username,
                connections: [client.id]
            })
        }
        if (alreadyExists) {
            if (!alreadyExists.connections.includes(client.id)) {
                alreadyExists.connections.push(client.id);
            }
        } else {
            userInQueue.push({
                id: uuid,
                username: message.username,
                connections: [client.id]
            })
        }
        console.log("queue length", userInQueue.length)
        if (userInQueue.length >= 2) {
            let playerA = userInQueue.shift();
            let playerB = userInQueue.shift();
            var gameId = uuid
            var createdAt = new Date();
            games.push({
                id: gameId,
                createdAt: createdAt,
                playerA: playerA.username,
                playerB: playerB.username,
                playerAConnections: playerA.connections,
                playerBConnections: playerB.connections,
                turn: playerA.username,
                playerAStartingPosition: [],
                playerBStartingPosition: [],
                playerACurrentPosition: [],
                playerBCurrentPosition: []
            });

            console.log("game created")
            playerA.connections.forEach(connId => {
                io.to(connId).emit('gameCreated', { gameId: gameId, opponent: playerB.username, createdAt: createdAt });
            });
            playerB.connections.forEach(connId => {
                io.to(connId).emit('gameCreated', { gameId: gameId, opponent: playerA.username, createdAt: createdAt });
            });
        }
    })

    client.on("gameStart", data => {
        var message = data
        if (games.includes(message.gameId)) {
            console.log("invalid game id")
            return
        }
        var currentGame = games.find(x => x.id == message.gameId)
        console.log("curr game", currentGame)
        if (currentGame == null) {
            console.error("No game found with id ", message.gameId)
        }
        var isPlayerA = currentGame.playerAConnections.includes(client.id)
        var isPlayerB = currentGame.playerBConnections.includes(client.id)

        // get ship status from both player
        // dont let them mark their ship twice
        if (isPlayerA && currentGame.playerAStartingPosition.length > 0) {
            console.log("invalid player A already deployed his/her battleship")
            return
        }
        if (isPlayerB && currentGame.playerBStartingPosition.length > 0) {
            console.log("invalid player B already deployed his/her battleship")
            return
        }
        // check total marked for both player must be max 10
        if (message.ships.length && countXCharacters(message.ships) > 10) {
            console.log("Invalid max amount of ship is 10")
            return
        }
        const initialGrid = Array(4).fill().map(() => Array(4).fill("_"));

        if (isPlayerA) {
            console.log("Setting ship for playerA")
            currentGame.playerAStartingPosition = message.ships;
            currentGame.playerACurrentPosition = initialGrid;
        }
        if (isPlayerB) {
            console.log("Setting ship for playerb")
            currentGame.playerBStartingPosition = message.ships;
            currentGame.playerBCurrentPosition = initialGrid;
        }
        if ((isPlayerA && currentGame.playerBStartingPosition.length > 0) || (isPlayerB && currentGame.playerAStartingPosition.length > 0)) {
            // start the game
            // emit to both player that game is started
            console.log("starting the game")
            currentGame.playerAConnections.forEach(connId => {
                console.log("game started turn", currentGame.turn)
                io.to(connId).emit('gameStarted', { message: "game started", turn: currentGame.turn });
            });
            currentGame.playerBConnections.forEach(connId => {
                console.log("game started turn", currentGame.turn)
                io.to(connId).emit('gameStarted', { message: "game started", turn: currentGame.turn });
            });
        }
    })

    client.on("play", data => {
        const { row, col } = data;
        var currentGame = games.find(x => x.id == data.gameId)
        var isPlayerA = currentGame.playerAConnections.includes(client.id)
        var isPlayerB = currentGame.playerBConnections.includes(client.id)
        if (games.includes(data.gameId)) {
            console.log("invalid game id")
            return
        }
        if ((isPlayerA && currentGame.turn == currentGame.playerB) || (isPlayerB && currentGame.turn == currentGame.playerA)) {
            console.log("Not your turn bro chill", currentGame.turn, currentGame.playerA, currentGame.playerB)
            return
        }
        if (isPlayerA) {
            var targettedShip = currentGame.playerBCurrentPosition[row][col]
            console.log("target", targettedShip)
            if (targettedShip == "x" || targettedShip == "o") {
                console.log("already targetted this tank")
                return;
            }
            else {
                var isAttackSuccess = currentGame.playerBStartingPosition[row][col] == "x"
                console.log("attack success?", isAttackSuccess)
                if (isAttackSuccess) {
                    currentGame.playerBCurrentPosition[row][col] = "x"
                }
                else {
                    currentGame.playerBCurrentPosition[row][col] = "o"
                }

                currentGame.turn = currentGame.playerB
            }
            currentGame.playerAConnections.forEach(connId => {
                io.to(connId).emit("targetted", {
                    ships: currentGame.playerBCurrentPosition,
                    turn: currentGame.turn
                });
            });

            currentGame.playerBConnections.forEach(connId => {
                io.to(connId).emit("changeTurn", {
                    turn: currentGame.turn,
                    myShips: currentGame.playerBCurrentPosition
                });
            });
        }
        if (isPlayerB) {
            var targettedShip = currentGame.playerACurrentPosition[row][col]
            console.log("targetted", targettedShip)

            if (targettedShip == "x" || targettedShip == "o") {
                console.log("already targetted this tank")
                return;
            }
            else {
                var isAttackSuccess = currentGame.playerAStartingPosition[row][col] == "x"
                console.log("attack success?", isAttackSuccess)
                if (isAttackSuccess) {
                    currentGame.playerACurrentPosition[row][col] = "x"
                }
                else {
                    currentGame.playerACurrentPosition[row][col] = "o"
                }
                currentGame.turn = currentGame.playerA
            }
            currentGame.playerBConnections.forEach(connId => {
                io.to(connId).emit("targetted", {
                    ships: currentGame.playerACurrentPosition,
                    turn: currentGame.turn
                });
            });
            currentGame.playerAConnections.forEach(connId => {
                io.to(connId).emit("changeTurn", {
                    turn: currentGame.turn,
                    myShips: currentGame.playerACurrentPosition
                });
            })
        }
        var playerALost = countXCharacters(currentGame.playerACurrentPosition) == countXCharacters(currentGame.playerAStartingPosition)
        var playerBLost = countXCharacters(currentGame.playerBCurrentPosition) == countXCharacters(currentGame.playerBStartingPosition)

        console.log("playerA positon current and starting", countXCharacters(currentGame.playerACurrentPosition), countXCharacters(currentGame.playerAStartingPosition))
        console.log("player B position current and starting", countXCharacters(currentGame.playerBCurrentPosition), countXCharacters(currentGame.playerBStartingPosition))
        console.log("playerAlost", playerALost)
        console.log("playerBlost", playerBLost)

        if (playerALost || playerBLost) {
            console.log("Game over..")
            currentGame.playerAConnections.forEach(connId => {
                io.to(connId).emit('gameOver', { message: "game over", winner: playerALost ? "Opponent" : "You" });
            });
            currentGame.playerBConnections.forEach(connId => {
                io.to(connId).emit('gameOver', { message: "game over", winner: playerBLost ? "Opponent" : "You" });
            });
        }
    })


    client.on('disconnect', () => {
        console.log("disconnected", client.id)
    });
});

function countXCharacters(matrix) {
    let count = 0;

    for (let row of matrix) {
        for (let char of row) {
            if (char === 'x') {
                count++;
            }
        }
    }

    return count;
}
server.listen(3000);