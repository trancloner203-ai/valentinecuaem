const audio = document.getElementById("sound");
let isAudioPlaying = false;

function tryPlayAudio() {
  if (!isAudioPlaying && audio) {
    audio.currentTime = 0; 
    audio.play().then(() => {
      isAudioPlaying = true;
      console.log("Music started");
    }).catch((err) => {
      console.warn("Music play failed:", err);
    });
  }
}

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const stars = [];
const explosions = [];
const shootingStars = [];

function splitLines(text, wordsPerLine) {
  const words = text.split(" ");
  const lines = [];
  for (let i = 0; i < words.length; i += wordsPerLine) {
    lines.push(words.slice(i, i + wordsPerLine).join(" "));
  }
  return lines;
}

const fullText1 = splitLines("Gửi Cục Dàng Của Bụp ^.^", 5);
const fullText2 = splitLines("CHÚC MỪNG VALENTINE ĐẦU TIÊN MÌNH ĐƯỢC YÊU THƯƠNG CÙNG NHAU ❤️ ", 3);
const fullText3 = splitLines("Từ giờ trên đoạn đường phía trước, em không còn cô đơn bước đi một mình nữa, mà sẽ có anh cùng em vượt qua những lúc yếu mềm nhất cũng như là hạnh phúc nhất. Anh mong dù có chuyện gì đi nữa thì anh và em vẫn nắm chặt tay nhau nha!!!", 8)
const fullText4 = splitLines("Anh Yêu Cục Dàng của anh nhiều  ❤️ !!!", 4);

const allTexts = [fullText1, fullText2, fullText3, fullText4];

const fontSize = 100;
const fontFamily = "Arial";
const lineHeight = 120;
const bearX = 70;
let bearY = canvas.height - 80;

let dots = [];
let targetDotsQueue = [];
let currentCharIndex = 0;
let animationDone = false;
let currentTextIndex = 0;
let isScrolling = false;

// Optimization: Cache variables
let bgGradient;
const heartCache = document.createElement('canvas');
const heartCtx = heartCache.getContext('2d');
heartCache.width = 20;
heartCache.height = 20;

function initHeartCache() {
  heartCtx.clearRect(0, 0, heartCache.width, heartCache.height);
  heartCtx.font = "16px Arial";
  heartCtx.textAlign = "center";
  heartCtx.textBaseline = "middle";
  heartCtx.fillText("❤️", heartCache.width / 2, heartCache.height / 2);
}
initHeartCache();

const mouse = { x: null, y: null, radius: 100 };
window.addEventListener('mousemove', (event) => {
  mouse.x = event.clientX + window.scrollX;
  mouse.y = event.clientY + window.scrollY;
});

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight * allTexts.length;
  bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  bgGradient.addColorStop(0, "#0a001f");
  bgGradient.addColorStop(1, "#1a0033");

  stars.length = 0;
  for (let i = 0; i < 300 * allTexts.length; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
      alpha: Math.random(),
      delta: (Math.random() * 0.02) + 0.005
    });
  }
  
  // SỬA LỖI 1: Truyền tham số currentTextIndex vào để không bị undefined
  generateAllTargetDots(currentTextIndex); 
}

// --- PHẦN QUAN TRỌNG: SỬA HÀM NÀY ĐỂ NHẬN THAM SỐ INDEX ---
function generateAllTargetDots(Index) {
  const tempCtx = document.createElement('canvas').getContext('2d');
  tempCtx.font = `bold ${fontSize}px ${fontFamily}`;
  const lines = allTexts[Index];
  const sectionTop = Index * window.innerHeight;
  const startY = sectionTop + (window.innerHeight - lines.length * lineHeight) / 2;

  targetDotsQueue = [];
  lines.forEach((line, lineIndex) => {
    const lineWidth = tempCtx.measureText(line).width;
    let xCursor = (canvas.width - lineWidth) / 2;
    const y = startY + lineIndex * lineHeight;

    for (let char of line) {
      if (char === " ") {
        xCursor += tempCtx.measureText(" ").width;
        targetDotsQueue.push([]);
        continue;
      }
      const charDots = generateCharDots(char, xCursor, y);
      targetDotsQueue.push(charDots);
      xCursor += tempCtx.measureText(char).width;
    }
  });
}

function generateCharDots(char, x, y) {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.font = `bold ${fontSize}px ${fontFamily}`;
  tempCtx.fillStyle = "red";
  tempCtx.fillText(char, x, y);
  const imageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height).data;
  const charDots = [];
  for (let py = 0; py < canvas.height; py += 4) {
    for (let px = 0; px < canvas.width; px += 4) {
      if (imageData[(py * canvas.width + px) * 4 + 3] > 128) {
        charDots.push({ x: px, y: py });
      }
    }
  }
  return charDots;
}

function shootDot() {
  if (animationDone || isScrolling) return;
  while (currentCharIndex < targetDotsQueue.length && targetDotsQueue[currentCharIndex].length === 0) {
    currentCharIndex++;
  }
  const targetDots = targetDotsQueue[currentCharIndex];
  if (!targetDots || targetDots.length === 0) return;

  const dynamicBearY = window.scrollY + window.innerHeight - 80;
  
  // TĂNG TỐC ĐỘ: Cho đoạn văn dài (fullText3) bắn nhanh hơn nữa
  const batch = (currentTextIndex === 2) ? 50 : 25; 
  
  for (let i = 0; i < batch; i++) {
    const target = targetDots.shift();
    if (!target) break;
    const angle = Math.random() * Math.PI / 6 - Math.PI / 12;
    const speed = 7 + Math.random() * 5;
    dots.push({
      x: bearX + 50,
      y: dynamicBearY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      targetX: target.x,
      targetY: target.y
    });
  }
  if (targetDots.length === 0 && currentCharIndex < targetDotsQueue.length - 1) {
    currentCharIndex++;
  }
}

function animate() {
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawStars();
  drawShootingStars();

  dots.forEach(dot => {
    const dx = dot.targetX - dot.x;
    const dy = dot.targetY - dot.y;
    dot.vx += dx * 0.003;
    dot.vy += dy * 0.003;
    dot.vx *= 0.92;
    dot.vy *= 0.92;
    dot.x += dot.vx;
    dot.y += dot.vy;
    ctx.drawImage(heartCache, dot.x - 10, dot.y - 10);
  });

  // --- ĐIỀU CHỈNH CHUYỂN ĐOẠN MƯỢT HƠN TẠI ĐÂY ---
  if (!animationDone && currentCharIndex >= targetDotsQueue.length && 
      dots.every(d => Math.abs(d.targetX - d.x) < 5)) {
    animationDone = true;

    setTimeout(() => {
      currentTextIndex++;
      if (currentTextIndex < allTexts.length) {
        isScrolling = true;
        
        // TÍNH TRƯỚC: Tính ngay khi bắt đầu cuộn để không bị khựng
        generateAllTargetDots(currentTextIndex); 

        window.scrollTo({
          top: currentTextIndex * window.innerHeight,
          behavior: 'smooth'
        });

        setTimeout(() => {
          currentCharIndex = 0;
          animationDone = false;
          isScrolling = false;
        }, 400); // Giảm thời gian chờ cuộn xuống còn 400ms
      } else {
        // Hoàn tất
        const bear = document.getElementById("bear");
        bear.src = "https://i.pinimg.com/originals/7e/f6/9c/7ef69cd0a6b0b78526c8ce983b3296fc.gif";
      }
    }, 400); // Giảm thời gian nghỉ sau khi hiện chữ xong
  }
  requestAnimationFrame(animate);
}

// (Các hàm drawStars, drawShootingStars, createShootingStar giữ nguyên như của cậu)
function drawStars() {
  stars.forEach(s => {
    s.alpha += s.delta;
    if (s.alpha >= 1 || s.alpha <= 0) s.delta = -s.delta;
    ctx.save();
    ctx.globalAlpha = s.alpha;
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function createShootingStar() {
  const startX = Math.random() * canvas.width;
  const startY = window.scrollY + Math.random() * (window.innerHeight / 2);
  shootingStars.push({
    x: startX, y: startY,
    length: Math.random() * 200 + 100,
    speed: Math.random() * 10 + 10,
    angle: Math.PI / 4, opacity: 1
  });
}

function drawShootingStars() {
  for (let i = shootingStars.length - 1; i >= 0; i--) {
    const s = shootingStars[i];
    const endX = s.x - Math.cos(s.angle) * s.length;
    const endY = s.y - Math.sin(s.angle) * s.length;
    const gradient = ctx.createLinearGradient(s.x, s.y, endX, endY);
    gradient.addColorStop(0, `rgba(255, 255, 255, ${s.opacity})`);
    gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y); ctx.lineTo(endX, endY);
    ctx.stroke();
    s.x += Math.cos(s.angle) * s.speed;
    s.y += Math.sin(s.angle) * s.speed;
    s.opacity -= 0.015;
    if (s.opacity <= 0) shootingStars.splice(i, 1);
  }
}

function startShow() {
  if (gameStarted) return;
  gameStarted = true;
  document.getElementById("canvas").style.display = "block";
  const bearBtn = document.getElementById("bear");
  bearBtn.style.display = "block";
  void bearBtn.offsetWidth;
  bearBtn.style.opacity = 1;
  resizeCanvas();
  setInterval(shootDot, 20);
  setInterval(createShootingStar, 1500);
  animate();
}

let gameStarted = false;
const giftBox = document.getElementById("giftBox");
const giftOverlay = document.getElementById("giftOverlay");

giftBox.addEventListener("click", () => {
  const doc = document.documentElement;
  if (doc.requestFullscreen) doc.requestFullscreen();
  else if (doc.webkitRequestFullscreen) doc.webkitRequestFullscreen();

  tryPlayAudio();
  giftBox.style.transform = "scale(1.5)";
  giftBox.style.opacity = "0";
  giftOverlay.style.opacity = "0";
  setTimeout(() => {
    giftOverlay.style.display = "none";
    startShow();
  }, 1000);
});