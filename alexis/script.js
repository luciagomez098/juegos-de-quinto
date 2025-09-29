const canvas = document.getElementById('pong');
const ctx = canvas.getContext('2d');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// Paddles
const PADDLE_WIDTH = 15, PADDLE_HEIGHT = 100, PADDLE_MARGIN = 20, PADDLE_SPEED = 5;

// Ball
const BALL_SIZE = 16, BALL_SPEED = 6;

// Jugadores
const leftPaddle = { x: PADDLE_MARGIN, y: HEIGHT/2 - PADDLE_HEIGHT/2, width: PADDLE_WIDTH, height: PADDLE_HEIGHT };
const rightPaddle = { x: WIDTH - PADDLE_MARGIN - PADDLE_WIDTH, y: HEIGHT/2 - PADDLE_HEIGHT/2, width: PADDLE_WIDTH, height: PADDLE_HEIGHT };

// Pelota
const ball = {
  x: WIDTH/2 - BALL_SIZE/2,
  y: HEIGHT/2 - BALL_SIZE/2,
  size: BALL_SIZE,
  speedX: BALL_SPEED * (Math.random() < 0.5 ? 1 : -1),
  speedY: BALL_SPEED * (Math.random() * 2 - 1)
};

function resetBall() {
  ball.x = WIDTH/2 - BALL_SIZE/2;
  ball.y = HEIGHT/2 - BALL_SIZE/2;
  ball.speedX = BALL_SPEED * (Math.random() < 0.5 ? 1 : -1);
  ball.speedY = BALL_SPEED * (Math.random() * 2 - 1);
}

// Control de velocidad progresiva
let lastSpeedIncrease = Date.now();
let currentInterval = 5000;
const MIN_INTERVAL = 1500;
const INTERVAL_DECREASE = 500;
const SPEED_MULTIPLIER = 1.1;

function increaseBallSpeed() {
  ball.speedX *= SPEED_MULTIPLIER;
  ball.speedY *= SPEED_MULTIPLIER;
  if (currentInterval > MIN_INTERVAL) currentInterval -= INTERVAL_DECREASE;
}

// Dibujar juego
function draw() {
  let currentSpeed = Math.sqrt(ball.speedX**2 + ball.speedY**2);

  // Fondo normal o parpadeante
  if (currentSpeed > 20) {
    ctx.fillStyle = (Math.floor(Date.now()/200) % 2 === 0) ? '#300' : '#000';
  } else {
    ctx.fillStyle = '#000';
  }
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Red central
  ctx.fillStyle = '#444';
  for (let i = 0; i < HEIGHT; i += 30) ctx.fillRect(WIDTH/2 - 2, i, 4, 20);

  // Paletas
  ctx.fillStyle = '#fff';
  ctx.fillRect(leftPaddle.x, leftPaddle.y, leftPaddle.width, leftPaddle.height);
  ctx.fillRect(rightPaddle.x, rightPaddle.y, rightPaddle.width, rightPaddle.height);

  // Pelota
  ctx.beginPath();
  ctx.arc(ball.x + ball.size/2, ball.y + ball.size/2, ball.size/2, 0, Math.PI*2);
  ctx.fill();

  // Velocidad con color dinámico
  let displaySpeed = currentSpeed.toFixed(2);
  let speedColor = '#0f0';
  if (currentSpeed > 12) speedColor = '#ff0';
  if (currentSpeed > 20) speedColor = '#f00';

  ctx.font = '20px Arial';
  if (currentSpeed > 20) {
    if (Math.floor(Date.now()/300) % 2 === 0) {
      ctx.fillStyle = speedColor;
      ctx.fillText(`Velocidad: ${displaySpeed}`, 20, 30);
    }
  } else {
    ctx.fillStyle = speedColor;
    ctx.fillText(`Velocidad: ${displaySpeed}`, 20, 30);
  }
}

// Actualizar juego
function update() {
  let now = Date.now();
  if (now - lastSpeedIncrease > currentInterval) {
    increaseBallSpeed();
    lastSpeedIncrease = now;
  }

  // Movimiento pelota
  ball.x += ball.speedX;
  ball.y += ball.speedY;

  // Rebote arriba/abajo
  if (ball.y <= 0 || ball.y + ball.size >= HEIGHT) ball.speedY *= -1;

  // Colisión paleta izquierda
  if (ball.x <= leftPaddle.x + leftPaddle.width &&
      ball.y + ball.size >= leftPaddle.y &&
      ball.y <= leftPaddle.y + leftPaddle.height) {
    ball.x = leftPaddle.x + leftPaddle.width;
    ball.speedX *= -1;
  }

  // Colisión paleta derecha
  if (ball.x + ball.size >= rightPaddle.x &&
      ball.y + ball.size >= rightPaddle.y &&
      ball.y <= rightPaddle.y + rightPaddle.height) {
    ball.x = rightPaddle.x - ball.size;
    ball.speedX *= -1;
  }

  // Punto (reinicio)
  if (ball.x < 0 || ball.x > WIDTH) {
    resetBall();
    lastSpeedIncrease = Date.now();
    currentInterval = 5000;
  }

  // Movimiento IA (seguir la pelota)
  if (ball.y + ball.size/2 > rightPaddle.y + rightPaddle.height/2) rightPaddle.y += PADDLE_SPEED;
  else if (ball.y + ball.size/2 < rightPaddle.y + rightPaddle.height/2) rightPaddle.y -= PADDLE_SPEED;
  rightPaddle.y = Math.max(0, Math.min(HEIGHT - rightPaddle.height, rightPaddle.y));
}

// Control jugador (ratón)
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  leftPaddle.y = e.clientY - rect.top - leftPaddle.height/2;
  leftPaddle.y = Math.max(0, Math.min(HEIGHT - leftPaddle.height, leftPaddle.y));
});

// Loop del juego
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}
gameLoop();
