const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreText = document.getElementById("score");
const gameOverScreen = document.getElementById("gameOver");
const restartBtn = document.getElementById("restartBtn");

const box = 20;
let snake = [{ x: 9 * box, y: 9 * box }];
let direction = null;
let food = randomFood();
let score = 0;
let game;

document.addEventListener("keydown", changeDirection);
restartBtn.addEventListener("click", startGame);

startGame();

function startGame() {
  snake = [{ x: 9 * box, y: 9 * box }];
  direction = null;
  score = 0;
  food = randomFood();
  scoreText.textContent = "Puntuación: 0";
  gameOverScreen.style.display = "none";
  clearInterval(game);
  game = setInterval(draw, 150); // velocidad moderada
}

function randomFood() {
  return {
    x: Math.floor(Math.random() * 20) * box,
    y: Math.floor(Math.random() * 20) * box
  };
}

function changeDirection(event) {
  if (event.key === "ArrowUp" && direction !== "DOWN") direction = "UP";
  else if (event.key === "ArrowDown" && direction !== "UP") direction = "DOWN";
  else if (event.key === "ArrowLeft" && direction !== "RIGHT") direction = "LEFT";
  else if (event.key === "ArrowRight" && direction !== "LEFT") direction = "RIGHT";
}

function draw() {
  ctx.fillStyle = "#fffafc";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Dibuja la comida
  ctx.fillStyle = "#b5ead7";
  ctx.beginPath();
  ctx.arc(food.x + box / 2, food.y + box / 2, box / 2.2, 0, Math.PI * 2);
  ctx.fill();

  // Dibuja la serpiente
  for (let i = 0; i < snake.length; i++) {
    ctx.fillStyle = i === 0 ? "#ffafcc" : "#ffc8dd";
    ctx.beginPath();
    ctx.roundRect(snake[i].x, snake[i].y, box, box, 6);
    ctx.fill();
  }

  let snakeX = snake[0].x;
  let snakeY = snake[0].y;

  if (direction === "UP") snakeY -= box;
  if (direction === "DOWN") snakeY += box;
  if (direction === "LEFT") snakeX -= box;
  if (direction === "RIGHT") snakeX += box;

  if (snakeX === food.x && snakeY === food.y) {
    score++;
    scoreText.textContent = "Puntuación: " + score;
    food = randomFood();
  } else {
    snake.pop();
  }

  const newHead = { x: snakeX, y: snakeY };

  if (
    snakeX < 0 || snakeY < 0 ||
    snakeX >= canvas.width || snakeY >= canvas.height ||
    collision(newHead, snake)
  ) {
    clearInterval(game);
    gameOverScreen.style.display = "block";
  }

  snake.unshift(newHead);
}

function collision(head, array) {
  for (let i = 0; i < array.length; i++) {
    if (head.x === array[i].x && head.y === array[i].y) {
      return true;
    }
  }
  return false;
}
