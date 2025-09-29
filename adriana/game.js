// Juego de Adriana — Guerrera Femenina
// Versión femenina, con corazones, nubes, picos y enemigos proyectiles.
// Código original creado para ti (español).

// Canvas y DOM
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;

const nivelTxt = document.getElementById('nivel');
const vidasTxt = document.getElementById('vidas');
const puntosTxt = document.getElementById('puntos');
const dificultadSel = document.getElementById('dificultad');
const btnStart = document.getElementById('btnStart');
const btnResume = document.getElementById('btnResume');

let game = { nivel:1, maxNiveles:6, vidas:2, puntos:0, jugando:false, pausa:false, dificultad:parseFloat(dificultadSel.value) };

// Controles
const keys = {left:false,right:false,up:false,space:false};
window.addEventListener('keydown', e=>{ if(e.key==='ArrowLeft') keys.left=true; if(e.key==='ArrowRight') keys.right=true; if(e.key==='ArrowUp') keys.up=true; if(e.key===' ') keys.space=true; if(e.key.toLowerCase()==='p') game.pausa=!game.pausa; });
window.addEventListener('keyup', e=>{ if(e.key==='ArrowLeft') keys.left=false; if(e.key==='ArrowRight') keys.right=false; if(e.key==='ArrowUp') keys.up=false; if(e.key===' ') keys.space=false; });

dificultadSel.addEventListener('change', ()=> game.dificultad = parseFloat(dificultadSel.value));
btnStart.addEventListener('click', ()=> iniciar(true));
btnResume.addEventListener('click', ()=> game.pausa = false);

// Niveles y elementos
function crearNiveles(){
  const niveles = [];
  for(let n=1;n<=game.maxNiveles;n++){
    const plataformas = [];
    plataformas.push({x:0,y:H-56,w:W,h:56}); // suelo
    // plataformas tipo nube/cristal, más separadas en niveles avanzados
    for(let i=0;i<5;i++){
      plataformas.push({
        x: 60 + i*170 + (i%2)*30,
        y: H - 180 - i*80 - (n-1)*18,
        w: 140 - (n-1)*8,
        h: 18,
        tipo: 'nube'
      });
    }
    // corazones (recolectables) y bandera meta
    const objetos = [
      {x: 160 + n*70, y: plataformas[1].y - 30, tipo:'corazon', recogido:false},
      {x: W-110, y: H-160, tipo:'bandera', meta:true}
    ];
    // enemigos: sombras; algunos lanzan proyectiles
    const enemigos = [];
    for(let i=0;i<Math.min(4,1+n);i++){
      enemigos.push({x:220 + i*180, y: plataformas[1].y - 12, dir: i%2?1:-1, speed:1.5 + 0.25*n, tiroCooldown: 80 - n*8});
    }
    // picos en suelo
    const picos = [];
    for(let i=0;i<Math.min(4,n+1);i++){
      picos.push({x: 140 + i*220, y:H-56, w:48, h:20});
    }
    niveles.push({plataformas,objetos,enemigos,picos});
  }
  return niveles;
}

const niveles = crearNiveles();
let nivelAct = null;

// Jugadora guerrera (diseño femenino)
function crearJugador(){
  return {x:50, y:H-200, w:40, h:52, vx:0, vy:0, onGround:false, dir:1, atac:false, anim:0};
}
let player = crearJugador();

// Física
const GRAV = 0.75, MOVE = 3.4, FRICTION = 0.86;

function cargarNivel(i){
  const idx = Math.max(1, Math.min(i, niveles.length)) -1;
  nivelAct = JSON.parse(JSON.stringify(niveles[idx]));
  game.nivel = idx+1;
  player = crearJugador();
  nivelAct.enemigos.forEach(e => e.speed *= game.dificultad);
  nivelAct.enemigos.forEach(e => e.tiroTimer = Math.floor(Math.random()*e.tiroCooldown));
  actualizarPanel();
}

function actualizarPanel(){ nivelTxt.textContent = game.nivel; vidasTxt.textContent = game.vidas; puntosTxt.textContent = game.puntos; }

function rectsCollide(a,b){ return a.x < b.x + (b.w||0) && a.x + a.w > b.x && a.y < b.y + (b.h||0) && a.y + a.h > b.y; }

function perderVida(){
  game.vidas -= 1;
  if(game.vidas <= 0){
    game.jugando = false;
    mostrarMensaje('Juego terminado','Presiona Iniciar para jugar de nuevo.');
  } else {
    player.x = 50; player.y = H-200; player.vx = 0; player.vy = 0;
  }
  actualizarPanel();
}

function avanzarNivel(){
  if(game.nivel < game.maxNiveles){
    cargarNivel(game.nivel + 1);
    mostrarMensaje('Nivel completado','¡Bien hecho!');
  } else {
    game.jugando = false;
    mostrarMensaje('¡Victoria!','Puntos totales: ' + game.puntos);
  }
}

let mensaje = null;
function mostrarMensaje(t1,t2){ mensaje = {t1,t2,tiempo:220}; }

// Partículas brillantes al recoger
const particulas = [];
function crearParticulas(x,y,color,count=14){
  for(let i=0;i<count;i++){
    particulas.push({x,y,vx:(Math.random()-0.5)*4, vy:(Math.random()-1.5)*4, life:40+Math.random()*30, color});
  }
}

// Estado de proyectiles enemigos
let proyectiles = [];

// Update
function update(){
  if(!game.jugando || game.pausa) return;

  // controles y movimiento
  if(keys.left){ player.vx = Math.max(player.vx - 0.35, -MOVE); player.dir = -1; }
  if(keys.right){ player.vx = Math.min(player.vx + 0.35, MOVE); player.dir = 1; }
  if(!keys.left && !keys.right) player.vx *= FRICTION;
  if(keys.up && player.onGround){ player.vy = -12.5; player.onGround = false; }
  player.atac = keys.space;

  player.vy += GRAV;
  player.x += player.vx;
  player.y += player.vy;

  if(player.x < 0) player.x = 0;
  if(player.x + player.w > W) player.x = W - player.w;
  if(player.y > H + 120){ perderVida(); return; }

  player.onGround = false;

  // plataformas (nubes)
  for(const p of nivelAct.plataformas){
    if(player.x + player.w > p.x && player.x < p.x + p.w){
      if(player.y + player.h > p.y && player.y + player.h < p.y + p.h + Math.abs(player.vy) + 8 && player.vy >= 0){
        player.y = p.y - player.h;
        player.vy = 0;
        player.onGround = true;
      }
    }
  }

  // recoger objetos
  for(const o of nivelAct.objetos){
    if(o.recogido) continue;
    if(rectsCollide(player, {x:o.x-14,y:o.y-14,w:28,h:28})){
      if(o.tipo === 'corazon'){
        o.recogido = true; game.puntos += 200; puntosTxt.textContent = game.puntos;
        crearParticulas(o.x, o.y, '#ff77c1', 18);
      }
      if(o.meta){
        game.puntos += 400; puntosTxt.textContent = game.puntos; avanzarNivel(); return;
      }
    }
  }

  // picos (daño al tocar)
  for(const pico of nivelAct.picos){
    if(rectsCollide(player, {x:pico.x,y:pico.y - pico.h, w:pico.w, h:pico.h})){
      perderVida();
    }
  }

  // enemigos: patrullan y disparan
  nivelAct.enemigos.forEach(e => {
    e.x += e.dir * e.speed;
    if(!e.minX) e.minX = Math.max(60, e.x - 140);
    if(!e.maxX) e.maxX = Math.min(W-60, e.x + 140);
    if(e.x < e.minX) e.dir = 1;
    if(e.x > e.maxX) e.dir = -1;

    // colisión con jugador
    const enemyRect = {x:e.x-16, y:e.y-14, w:32, h:34};
    if(rectsCollide(player, enemyRect)){
      // si ataca desde arriba derrota enemigo
      if(player.atac && player.vy > 0.8){
        e.dead = true; game.puntos += 120; puntosTxt.textContent = game.puntos;
        player.vy = -7;
        crearParticulas(e.x, e.y, '#ffffff', 12);
      } else {
        perderVida();
      }
    }

    // disparo: enemigos lanzan proyectiles oscuros
    e.tiroTimer = (e.tiroTimer || 0) + 1;
    if(e.tiroTimer >= e.tiroCooldown){
      e.tiroTimer = 0;
      // generar proyectil hacia la player
      const dx = (player.x + player.w/2) - e.x;
      const dy = (player.y + player.h/2) - e.y;
      const dist = Math.sqrt(dx*dx + dy*dy) || 1;
      const speed = 3 + Math.random()*1.5 + (game.nivel*0.2);
      proyectiles.push({x:e.x, y:e.y, vx: dx/dist*speed, vy: dy/dist*speed, r:6, life:180});
    }
  });

  // limpiar enemigos muertos
  nivelAct.enemigos = nivelAct.enemigos.filter(e => !e.dead);

  // actualizar proyectiles
  proyectiles.forEach(p => {
    p.x += p.vx; p.y += p.vy; p.life--;
    if(rectsCollide(player, {x:p.x-p.r, y:p.y-p.r, w:p.r*2, h:p.r*2})){
      p.dead = true; perderVida();
    }
  });
  proyectiles = proyectiles.filter(p=> !p.dead && p.life>0);

  // particulas
  for(const pa of particulas){ pa.x += pa.vx; pa.y += pa.vy; pa.vy += 0.12; pa.life--; }
  for(let i=particulas.length-1;i>=0;i--) if(particulas[i].life<=0) particulas.splice(i,1);
}

// Dibujado estilizado femenino
function draw(){
  // fondo mágico (castillo + degradado con destellos sutiles)
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, W, H);
  const g = ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,'#fff0fb'); g.addColorStop(1,'#f3e7ff');
  ctx.fillStyle = g; ctx.fillRect(0,0,W,H);

  // destellos de fondo (simples)
  for(let i=0;i<6;i++){
    ctx.globalAlpha = 0.06;
    ctx.beginPath();
    ctx.ellipse(80 + i*140, 80 + (i%2)*20, 120, 60, 0,0,Math.PI*2);
    ctx.fillStyle = i%2? '#ffd9f0' : '#e9e0ff';
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // dibujar plataformas - nubes/cristales
  nivelAct.plataformas.forEach(p=>{
    if(p.tipo==='nube'){
      drawNube(p.x, p.y, p.w, p.h);
    } else {
      ctx.fillStyle = '#ffffff';
      roundRect(ctx,p.x,p.y,p.w,p.h,8,true,false);
    }
  });

  // picos
  nivelAct.picos.forEach(px=>{
    drawPico(px.x, px.y - px.h, px.w, px.h);
  });

  // objetos: corazones y bandera
  nivelAct.objetos.forEach(o=>{
    if(o.recogido) return;
    if(o.tipo==='corazon') drawCorazon(o.x, o.y);
    if(o.meta) drawBandera(o.x, o.y);
  });

  // enemigos sombras
  nivelAct.enemigos.forEach(e=>{
    ctx.save(); ctx.translate(e.x, e.y);
    // sombra cuerpo
    ctx.fillStyle = 'rgba(20,8,30,0.95)';
    roundRect(ctx,-16,-14,32,34,6,true,false);
    // ojos brillantes
    ctx.fillStyle = '#ffd166'; ctx.fillRect(-6,-2,4,4); ctx.fillRect(4,-2,4,4);
    ctx.restore();
  });

  // proyectiles oscuros
  proyectiles.forEach(p=>{
    ctx.beginPath(); ctx.fillStyle = 'rgba(30,8,40,0.95)'; ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.fillStyle = '#ffb3e6'; ctx.arc(p.x - p.vx*0.1, p.y - p.vy*0.1, p.r*0.6,0,Math.PI*2); ctx.fill();
  });

  // player - guerrera femenina
  drawPlayer();

  // particulas brillantes
  particulas.forEach(pa=>{
    ctx.globalAlpha = Math.max(0, pa.life/60);
    ctx.fillStyle = pa.color;
    ctx.fillRect(pa.x, pa.y, 3,3);
    ctx.globalAlpha = 1;
  });

  // HUD
  ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(12,12,198,64);
  ctx.fillStyle = '#fff'; ctx.font = '16px sans-serif'; ctx.fillText('Nivel: '+game.nivel,22,38); ctx.fillText('Vidas: '+game.vidas,22,60);

  // mensaje grande
  if(mensaje){
    ctx.save();
    ctx.globalAlpha = 0.98;
    ctx.fillStyle = 'rgba(12,6,20,0.85)';
    ctx.fillRect(W/2-260,H/2-96,520,160);
    ctx.fillStyle = '#fff'; ctx.textAlign='center';
    ctx.font = '28px sans-serif'; ctx.fillText(mensaje.t1, W/2, H/2 - 10);
    ctx.font = '16px sans-serif'; ctx.fillText(mensaje.t2, W/2, H/2 + 20);
    ctx.restore();
    if(mensaje.tiempo>0) mensaje.tiempo--;
    if(mensaje.tiempo===0) mensaje=null;
  }
}

// Dibujo de elementos estilizados
function drawNube(x,y,w,h){
  ctx.save(); ctx.translate(x,y);
  // base
  ctx.fillStyle = '#fff';
  roundRect(ctx,0,0,w,h,12,true,false);
  // borde rosado suave
  ctx.strokeStyle = 'rgba(255,110,185,0.08)'; ctx.lineWidth=6; ctx.stroke();
  // brillo superior
  const g = ctx.createLinearGradient(0,y-20,0,y+h); g.addColorStop(0,'#fff7ff'); g.addColorStop(1,'#fff0fb');
  ctx.fillStyle = g; roundRect(ctx,0,0,w,h,12,true,false);
  ctx.restore();
}

function drawPico(x,y,w,h){
  ctx.save(); ctx.translate(x,y);
  for(let i=0;i<Math.floor(w/24);i++){
    const px = i*24;
    ctx.beginPath();
    ctx.moveTo(px, h);
    ctx.lineTo(px+12, 0);
    ctx.lineTo(px+24, h);
    ctx.closePath();
    ctx.fillStyle = '#442233'; ctx.fill();
    ctx.fillStyle = '#ff8fd1'; ctx.globalAlpha = 0.16; ctx.fill(); ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function drawCorazon(cx,cy){
  ctx.save(); ctx.translate(cx,cy);
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.bezierCurveTo(12,-32,44,-8,0,28);
  ctx.bezierCurveTo(-44,-8,-12,-32,0,-6);
  ctx.closePath();
  const g = ctx.createLinearGradient(0, -32, 0, 28); g.addColorStop(0,'#ffb3e6'); g.addColorStop(1,'#ff4da6');
  ctx.fillStyle = g; ctx.fill();
  // brillo
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.ellipse(-6,-10,6,4,0,0,Math.PI*2); ctx.fill();
  ctx.restore();
}

function drawBandera(x,y){
  ctx.save(); ctx.translate(x,y);
  ctx.fillStyle = '#3a0045'; ctx.fillRect(0,0,6,44);
  ctx.beginPath(); ctx.moveTo(6,8); ctx.lineTo(40,18); ctx.lineTo(6,28); ctx.closePath();
  ctx.fillStyle = '#ffd166'; ctx.fill();
  ctx.restore();
}

function drawPlayer(){
  ctx.save(); ctx.translate(player.x + player.w/2, player.y + player.h/2);
  // sombra
  ctx.beginPath(); ctx.ellipse(0, player.h/2 - 6, 26,8,0,0,Math.PI*2); ctx.fillStyle='rgba(0,0,0,0.18)'; ctx.fill();
  // armadura/vestido
  ctx.fillStyle = '#ff6ac1'; roundRect(ctx,-18,-22,36,44,10,true,false);
  // pechera dorada
  ctx.fillStyle = '#ffd166'; roundRect(ctx,-10,-10,20,18,6,true,false);
  // cabeza
  ctx.beginPath(); ctx.fillStyle='#ffd9b6'; ctx.arc(0,-28,10,0,Math.PI*2); ctx.fill();
  // cabello largo oscuro
  ctx.fillStyle = '#4b2b2b'; ctx.beginPath(); ctx.moveTo(-6,-36); ctx.quadraticCurveTo(18,-18,8,-6); ctx.quadraticCurveTo(20,-4,12,18); ctx.quadraticCurveTo(-8,10,-10,-6); ctx.fill();
  // corona pequeña
  ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.moveTo(-8,-42); ctx.lineTo(-4,-48); ctx.lineTo(-0,-42); ctx.lineTo(4,-48); ctx.lineTo(8,-42); ctx.fill();
  // espada (cuando ataca, resalta)
  if(player.atac){
    ctx.fillStyle = '#fff0f8'; ctx.fillRect(16*player.dir, -6, 24*player.dir, 6);
    // brillo en espada
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(18*player.dir, -8, 6*player.dir, 2);
  } else {
    ctx.fillStyle = '#ffdede'; ctx.fillRect(20*player.dir, -4, 12*player.dir, 4);
  }
  ctx.restore();
}

// Util helper
function roundRect(ctx,x,y,w,h,r,fill,stroke){ if(typeof r==='undefined') r=6; ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); if(fill) ctx.fill(); if(stroke) ctx.stroke(); }

// Bucle
function loop(){
  update(); draw(); requestAnimationFrame(loop);
}

// Inicio / reinicio
function iniciar(reset=false){
  if(reset){ game.puntos = 0; game.vidas = 2; }
  game.dificultad = parseFloat(dificultadSel.value);
  cargarNivel(1);
  game.jugando = true; game.pausa = false; mensaje = null; proyectiles=[]; particulas.length=0;
  actualizarPanel();
}

iniciar(true);
loop();