// Juego Dodger 2D

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const speedEl = document.getElementById('speed');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const restartBtn = document.getElementById('restartBtn');
const leftTouch = document.getElementById('leftTouch');
const rightTouch = document.getElementById('rightTouch');

let W = canvas.width, H = canvas.height;

// Jugador
const player = {x: W/2 - 22, y: H - 70, w:44, h:44, speed: 6, color:'#06b6d4'};

// Obstáculos
let obstacles = [];
let spawnTimer = 0;
let spawnInterval = 80;

// Estado del juego
let score = 0;
let lives = 3;
let running = false;
let paused = false;
let frame = 0;
let gameSpeed = 1;

// Entrada teclado
const keys = {left:false,right:false};
window.addEventListener('keydown', e=>{
  if(e.key==='ArrowLeft' || e.key==='a' || e.key==='A') keys.left = true;
  if(e.key==='ArrowRight' || e.key==='d' || e.key==='D') keys.right = true;
  if(e.key===' '){ paused = !paused; }
});
window.addEventListener('keyup', e=>{
  if(e.key==='ArrowLeft' || e.key==='a' || e.key==='A') keys.left = false;
  if(e.key==='ArrowRight' || e.key==='d' || e.key==='D') keys.right = false;
});

// Entrada táctil
leftTouch.addEventListener('touchstart', e=>{ e.preventDefault(); keys.left=true; });
leftTouch.addEventListener('touchend', e=>{ e.preventDefault(); keys.left=false; });
rightTouch.addEventListener('touchstart', e=>{ e.preventDefault(); keys.right=true; });
rightTouch.addEventListener('touchend', e=>{ e.preventDefault(); keys.right=false; });

// Botones
startBtn.addEventListener('click', ()=>{ if(!running) startGame(); paused=false; });
pauseBtn.addEventListener('click', ()=>{ paused = !paused; });
restartBtn.addEventListener('click', ()=>{ resetGame(); startGame(); });

function startGame(){
  if(running) return;
  running = true; paused = false; frame = 0;
  requestAnimationFrame(loop);
}

function resetGame(){
  obstacles = []; score = 0; lives = 3; gameSpeed = 1;
  spawnInterval = 80; spawnTimer=0;
  updateUI(); running = false; paused = false;
  player.x = W/2 - player.w/2;
}

function updateUI(){
  scoreEl.textContent = Math.floor(score);
  livesEl.textContent = lives;
  speedEl.textContent = gameSpeed.toFixed(2) + 'x';
}

function spawnObstacle(){
  const bw = 24 + Math.random()*70;
  const bx = Math.random()*(W - bw - 10) + 5;
  const speedY = (1.2 + Math.random()*1.6) * (1 + score/2000) * gameSpeed;
  obstacles.push({x:bx,y:-60,w:bw,h:20,speed:speedY,color:'#ff6b6b'});
}

function rectsOverlap(a,b){
  return !(a.x + a.w < b.x || a.x > b.x + b.w || a.y + a.h < b.y || a.y > b.y + b.h);
}

function update(){
  if(paused || !running) return;
  frame++;

  if(keys.left) player.x -= player.speed * (1 + (gameSpeed-1)*0.3);
  if(keys.right) player.x += player.speed * (1 + (gameSpeed-1)*0.3);

  if(player.x < 6) player.x = 6;
  if(player.x + player.w > W-6) player.x = W - player.w - 6;

  spawnTimer++;
  if(spawnTimer >= spawnInterval){ spawnTimer = 0; spawnObstacle(); }

  for(let i = obstacles.length-1; i>=0; i--){
    const ob = obstacles[i];
    ob.y += ob.speed;
    if(ob.y > H + 40){
      obstacles.splice(i,1); score += 10;
    } else if(rectsOverlap(ob, player)){
      obstacles.splice(i,1);
      lives -= 1; score -= 50; if(score < 0) score = 0;
      if(lives <= 0){ running = false; }
    }
  }

  if(frame % 300 === 0){
    gameSpeed += 0.08;
    spawnInterval = Math.max(18, Math.floor(spawnInterval * 0.95));
  }

  if(frame % 6 === 0) score += 1 * gameSpeed;

  updateUI();
}

function drawRoundedRect(x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath(); ctx.fill();
}

function draw(){
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle = '#071423'; ctx.fillRect(0,0,W,H);

  ctx.strokeStyle = 'rgba(255,255,255,0.03)'; ctx.lineWidth = 1;
  for(let i=0;i<10;i++){
    ctx.beginPath(); ctx.moveTo(0, H/10*i); ctx.lineTo(W, H/10*i); ctx.stroke();
  }

  ctx.fillStyle = player.color;
  drawRoundedRect(player.x, player.y, player.w, player.h, 8);

  ctx.save(); ctx.globalAlpha = 0.08; ctx.fillStyle = player.color;
  ctx.fillRect(player.x-6, player.y-16, player.w+12, player.h+32); ctx.restore();

  for(const ob of obstacles){
    ctx.fillStyle = ob.color; drawRoundedRect(ob.x, ob.y, ob.w, ob.h, 6);
    ctx.save(); ctx.globalAlpha = 0.06; ctx.fillRect(ob.x-4, ob.y+ob.h-2, ob.w+8, 6); ctx.restore();
  }

  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(8,8,170,56);
  ctx.fillStyle = '#fff'; ctx.font = '600 18px system-ui';
  ctx.fillText('Dodger 2D', 16, 32);
  ctx.fillStyle = '#cbd5e1'; ctx.font = '14px system-ui';
  ctx.fillText('Puntuación: ' + Math.floor(score), 16, 52);

  if(!running){
    ctx.fillStyle = 'rgba(2,6,23,0.6)';
    ctx.fillRect(W/2 - 180, H/2 - 56, 360, 112);
    ctx.fillStyle = '#fff'; ctx.font = '700 20px system-ui'; ctx.textAlign = 'center';
    ctx.fillText('Juego detenido', W/2, H/2 - 12);
    ctx.font = '400 14px system-ui';
    ctx.fillText('Pulsa Iniciar o Reiniciar para jugar', W/2, H/2 + 18);
    ctx.textAlign = 'start';
  }

  if(paused){
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0,0,W,H);
    ctx.fillStyle = '#fff'; ctx.font = '700 38px system-ui'; ctx.textAlign='center';
    ctx.fillText('Pausa', W/2, H/2); ctx.textAlign='start';
  }
}

function loop(){
  update(); draw();
  if(running) requestAnimationFrame(loop);
}

function resizeForHiDPI(){
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const cssW = canvas.clientWidth || canvas.width;
  const cssH = canvas.clientHeight || canvas.height;
  canvas.width = Math.floor(cssW * ratio);
  canvas.height = Math.floor(cssH * ratio);
  canvas.style.width = cssW + 'px';
  canvas.style.height = cssH + 'px';
  ctx.setTransform(ratio,0,0,ratio,0,0);
  W = canvas.width / ratio; H = canvas.height / ratio;
}

window.addEventListener('resize', ()=>{ resizeForHiDPI(); draw(); });
resizeForHiDPI(); resetGame();

canvas.addEventListener('click', ()=>{ if(running) paused = !paused; else { startGame(); }});
