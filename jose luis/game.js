// game.js - Juego Dino Runner (versión ajustada con aumento de velocidad cada minuto y obstáculos más separados)
(function () {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const speedLabel = document.getElementById('speedLabel');
  const restartBtn = document.getElementById('restart');

  // DPR handling
  let DPR = window.devicePixelRatio || 1;
  function resizeCanvas(){
    const rect = canvas.getBoundingClientRect();
    DPR = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * DPR);
    canvas.height = Math.round((rect.height || 200) * DPR);
    ctx.setTransform(DPR,0,0,DPR,0,0);
  }
  function initCanvasSize(){
    const rect = canvas.getBoundingClientRect();
    if(rect.height === 0){
      canvas.style.height = '200px';
    }
    resizeCanvas();
  }
  initCanvasSize();
  window.addEventListener('resize', resizeCanvas);

  // ----------------- Variables del juego -----------------
  let lastTime = performance.now();
  let gameSpeed = 3; // velocidad inicial
  const gravity = 0.8;
  const groundY = 150;

  // Jugador
  const dino = {
    x: 60,
    y: groundY - 40,
    w: 44,
    h: 36,
    vy: 0,
    jumping: false
  };

  // Obstáculos
  let obstacles = [];
  let spawnTimer = 0;

  // Estado
  let playing = true;
  let score = 0;
  let highScore = 0;

  // Tiempo para subir velocidad cada minuto
  let lastSpeedIncreaseTime = performance.now();

  // Util
  function rand(min, max){ return Math.floor(Math.random() * (max - min + 1)) + min; }

  function resetGame(){
    obstacles = [];
    // primer obstáculo con un buen delay
    spawnTimer = 1200 + Math.floor(Math.random() * 800);
    gameSpeed = 3;
    score = 0;
    playing = true;
    dino.y = groundY - dino.h;
    dino.vy = 0;
    lastTime = performance.now();
    lastSpeedIncreaseTime = performance.now();
    speedLabel.textContent = 'Velocidad: ' + Math.round(gameSpeed);
    scoreEl.textContent = score;
  }

  function jump(){
    if(!playing){ resetGame(); return; }
    if(!dino.jumping){
      dino.vy = -14;
      dino.jumping = true;
    }
  }

  function collide(a, b){
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function draw(){
    const W = canvas.width / DPR;
    const H = canvas.height / DPR;

    ctx.clearRect(0,0, W, H);

    // suelo
    ctx.fillStyle = '#efefef';
    ctx.fillRect(0, groundY, W, H - groundY);
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    ctx.fillRect(0, groundY + 2, W, 2);

    // dino
    ctx.fillStyle = '#222';
    ctx.fillRect(dino.x, dino.y, dino.w, dino.h);
    ctx.fillStyle = '#fff';
    ctx.fillRect(dino.x + dino.w - 10, dino.y + 8, 6, 6);

    // obstáculos
    ctx.fillStyle = '#555';
    obstacles.forEach(o => ctx.fillRect(o.x, o.y, o.w, o.h));

    // marcador
    ctx.fillStyle = '#222';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText('Puntos: ' + score, W - 110, 20);

    if(!playing){
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(W/2 - 120, H/2 - 36, 240, 72);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '16px system-ui, sans-serif';
      ctx.fillText('Game Over', W/2, H/2 - 4);
      ctx.font = '12px system-ui, sans-serif';
      ctx.fillText('Presiona Espacio o toca para reiniciar', W/2, H/2 + 16);
      ctx.textAlign = 'start';
    }
  }

  function update(time){
    const dt = Math.min(40, time - lastTime);
    lastTime = time;

    if(playing){
      // física dino
      dino.vy += gravity * (dt / 16.67);
      dino.y += dino.vy * (dt / 16.67);
      if(dino.y >= groundY - dino.h){
        dino.y = groundY - dino.h;
        dino.vy = 0;
        dino.jumping = false;
      }

      // spawn obstáculos (más separados)
      spawnTimer -= dt;
      if(spawnTimer <= 0){
        const size = rand(18, 34);
        const type = Math.random() > 0.75 ? 'tall' : 'low';
        const height = type === 'tall' ? Math.round(size * 1.6) : size;
        obstacles.push({
          x: (canvas.width / DPR) + 10,
          w: size,
          h: height,
          y: groundY - height
        });
        // intervalo mayor para que estén más separados
        spawnTimer = rand(1200, 2000) - Math.round(gameSpeed * 15);
        if (spawnTimer < 600) spawnTimer = 600;
      }

      // mover obstáculos y colisiones
      for(let i = obstacles.length - 1; i >= 0; i--){
        const o = obstacles[i];
        o.x -= gameSpeed * (dt / 16.67);
        if(o.x + o.w < -50) obstacles.splice(i, 1);
        if(collide(dino, o)){
          playing = false;
          highScore = Math.max(highScore, score);
        }
      }

      // puntaje
      score += Math.floor((dt / 16.67) * 0.2 * gameSpeed);

      // aumento de velocidad cada minuto
      const now = performance.now();
      if (now - lastSpeedIncreaseTime >= 60000) {
        const increments = Math.floor((now - lastSpeedIncreaseTime) / 60000);
        gameSpeed += increments;
        lastSpeedIncreaseTime += increments * 60000;
      }
      speedLabel.textContent = 'Velocidad: ' + Math.round(gameSpeed);
    }

    scoreEl.textContent = score;
    draw();
    requestAnimationFrame(update);
  }

  // Eventos
  window.addEventListener('keydown', (e) => {
    if(e.code === 'Space' || e.code === 'ArrowUp'){
      e.preventDefault();
      if(!playing && e.code === 'Space'){ resetGame(); return; }
      jump();
    }
    if(e.key && e.key.toLowerCase() === 'r') resetGame();
  });

  canvas.addEventListener('touchstart', (e) => { e.preventDefault(); if(!playing){ resetGame(); return; } jump(); });
  canvas.addEventListener('mousedown', (e) => { e.preventDefault(); if(!playing){ resetGame(); return; } jump(); });

  restartBtn.addEventListener('click', () => { resetGame(); });

  resetGame();
  requestAnimationFrame(update);
})();
