import { useEffect, useState } from 'react';
import './App.css'
import { io } from 'socket.io-client';
export const socket = io("http://localhost:3000");


function App() {
  const [username, setUserName] = useState("");
  const [loading, setLoading] = useState(false)
  const [gameCreated, setGameCreated] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [inQueue, setInQueue] = useState(false)
  const [gameId, setGameId] = useState("")
  const [opponentName, setOpponentName] = useState("")
  const [turn, setTurn] = useState("")
  const initialGrid = Array(4).fill().map(() => Array(4).fill("_"));
  const [grid, setGrid] = useState(initialGrid);
  const [myGrid, setMyGrid] = useState(initialGrid);
  const [currentGrid, setCurrentGrid] = useState(initialGrid)

  const onChange = e => {
    if (e.target.value.length)
      setUserName(e.target.value);
  }
  const onFindAGame = () => {
    setLoading(true)
    socket.emit('queue', {
      username: username
    })
    setInQueue(true)
  }
  const onStartGame = () => {
    socket.emit('gameStart', {
      ships: grid,
      gameId: gameId
    })
    setLoading(true)

  }
  useEffect(() => {
    function onConnect() {
      console.log("Connected")
    }
    function onDisconnect() {
      console.log("onDisconnect")
    }
    function onGameCreated(value) {
      console.log("created at", value)
      setLoading(false)
      setGameCreated(true)
      setOpponentName(value.opponent)
      setGameId(value.gameId)
      setInQueue(false)
    }
    function onGameStarted(value) {
      setGameCreated(false)
      setGameStarted(true)
      setLoading(false)
      setTurn(value.turn)

    }
    function onTargetted(value) {
      console.log("targeted", value)
      setCurrentGrid(value.ships)
      setTurn(value.turn)
      console.log("new turn", value.turn)
    }
    function onChangeTurn(value) {
      console.log("change turn", value)
      setTurn(value.turn)
      setMyGrid(value.myShips)
    }
    function onGameOver(value) {
      alert(`Game over. ${value.winner} won`)
    }
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('gameCreated', onGameCreated);
    socket.on('gameStarted', onGameStarted);
    socket.on('targetted', onTargetted);
    socket.on('changeTurn', onChangeTurn);
    socket.on('gameOver', onGameOver);


    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('gameCreated', onGameCreated);
      socket.off('gameStarted', onGameStarted);
      socket.off('targetted', onTargetted);
      socket.off('changeTurn', onChangeTurn);
      socket.off('gameOver', onGameOver);
    }
  }, [])
  if (loading && inQueue) {
    return (
      <p>Find an opponent for you please wait...</p>
    )
  }
  if (gameCreated) {
    return (
      <>
        Welcome {username}
        <p>Match found with opponent: {opponentName}</p>
        <p>Lay your tank in the battle field</p>
        <Grid grid={grid} setGrid={setGrid} prep={true} canSelect={true} gameId={gameId} />
        <button onClick={onStartGame} disabled={loading}>Start game</button>
      </>

    )
  }
  if (gameStarted) {
    return (
      <>
        Welcome {username}
        <p>Opponent&apos;s Land</p>
        <Grid grid={currentGrid} setGrid={setCurrentGrid} prep={false} canSelect={username === turn} gameId={gameId} />

        <p>Your Land</p>
        <Grid grid={myGrid} setGrid={()=>console.log("hello")} prep={false} canSelect={false} gameId={gameId} />

      </>
    )
  }

  return (
    <>
      <form>
        <label htmlFor="Username">Username:</label>
        <input value={username} name="username" onChange={onChange} />
        <button onClick={onFindAGame} disabled={loading}>Find a game</button>
      </form>
    </>
  )
}

const Grid = ({ grid, setGrid, prep, canSelect = false, gameId }) => {

  const [selectedCount, setSelectedCount] = useState(0);

  const handleClick = (rowIndex, colIndex) => {
    if (selectedCount < 10 || grid[rowIndex][colIndex] === "x") {
      const newGrid = grid.map((row, rIndex) =>
        row.map((col, cIndex) =>
          (rIndex === rowIndex && cIndex === colIndex ? (col === "_" ? "x" : "_") : col)
        )
      );
      if (canSelect) {

        setGrid(newGrid);

        const newSelectedCount = newGrid.flat().filter(cell => cell === "x").length;
        setSelectedCount(newSelectedCount);
        if (!prep) {
          console.log("playing.....")
          socket.emit("play", {
            row: rowIndex,
            col: colIndex,
            gameId: gameId
          })
        }
      }
    } else {

      alert('You can only select up to 10 tanks!');
    }
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 50px)', gridGap: '10px' }}>
        {grid.map((row, rowIndex) =>
          row.map((col, colIndex) => (
            <button
              key={`${rowIndex}-${colIndex}`}
              onClick={() => handleClick(rowIndex, colIndex)}
              style={{
                width: '50px',
                height: '50px',
                backgroundColor: col === "x" ? 'lightblue' : 'white',
                border: '1px solid black'
              }}
            >
              {col}
            </button>
          ))
        )}
      </div>

      {prep ? <p>You have {10 - selectedCount} tanks remaining</p> : <p>{canSelect ? "Your" : "Opponent's"} turn</p>}
    </div>
  );
};

export default App
