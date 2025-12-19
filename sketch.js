let step = 0;
let tools = ['V (選取)', 'C (剃刀)', 'T (文字)'];
let activeTool = 0;
let clipWidth = 200;
let isCut = false;
let particles = [];
let showOverlay = false;
let overlayAlpha = 0;
let overlayAlpha2 = 0;
let timelinePhase = 0;
let introPhase = 0;
let introTransitionStart = 0;

// 響應式縮放變數
const BASE_W = 800;
const BASE_H = 500;
let scaleFactor = 1;
let offsetX = 0;
let offsetY = 0;

// 圖片變數
let imgPR1, imgPR2, imgPR3, imgPR4;
let imgVS, imgClip, imgPD, imgPRIcon;
let lastStep = -1;
let stepStartMillis = 0;

function preload() {
  imgPR1 = loadImage('images/PR1.png');
  imgPR2 = loadImage('images/PR2.png');
  imgPR3 = loadImage('images/PR3.png');
  imgPR4 = loadImage('images/PR4.png');
  
  // 載入競品與 PR 圖示
  imgVS = loadImage('images/Corel VideoStudio.png');
  imgClip = loadImage('images/microsoft clipchamp.png');
  imgPD = loadImage('images/PowerDirector.jpg');
  imgPRIcon = loadImage('images/pr.png');
}

function setup() {
   // 強制設定像素密度為 1，大幅提升大螢幕與高解析度螢幕的效能
  pixelDensity(1);
  createCanvas(windowWidth, windowHeight);
  textAlign(CENTER, CENTER);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  background(25);
  
  // 計算縮放比例與偏移量以維持 800x500 的比例並置中
  scaleFactor = min(width / BASE_W, height / BASE_H);
  offsetX = (width - BASE_W * scaleFactor) / 2;
  offsetY = (height - BASE_H * scaleFactor) / 2;

  // 偵測步驟切換以重置動畫計時
  if (step !== lastStep) {
    stepStartMillis = millis();
    lastStep = step;
    // 重置 Step 0 的狀態
    if (step === 0) {
      introPhase = 0;
    }
    // 重置 Step 1 的狀態
    if (step === 1) {
      showOverlay = 0;
      overlayAlpha = 0;
      overlayAlpha2 = 0;
    }
    // 重置 Step 2 的狀態
    if (step === 2) {
      timelinePhase = 0;
      activeTool = 0;
    }
  }

  push();
  translate(offsetX, offsetY);
  scale(scaleFactor);

  if (step === 0) {
    drawIntro();
  } else if (step === 1) {
    drawLayoutInterface();
  } else if (step === 2) {
    drawTimelineSim();
  } else if (step === 3) {
    drawExportEffect();
  }
  
  // 頂部進度條 (移至最後繪製以確保在最上層)
  drawProgress();
  
  // 繪製粒子特效 (點擊時產生的火花)
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].show();
    if (particles[i].finished()) particles.splice(i, 1);
  }
  
  pop();
}

// --- 介面繪製函數 ---

function drawIntro() {
  // 使用深色純色背景
  noStroke();
  fill(30);
  rect(0, 0, BASE_W, BASE_H);

  let animTime = millis() - stepStartMillis;

  // 轉場動畫變數
  let fadeAlpha = 255;
  let prAnim = { x: 650, y: 250, s: 80, a: 255, txtSize: 16, txtOffset: 60 };

  if (introPhase === 1) {
    let t = millis() - introTransitionStart;
    
    // 1. 淡出其他元素 (500ms)
    fadeAlpha = map(t, 0, 500, 255, 0, true);

    // 2. PR 圖示移動與放大 (1000ms)
    let moveT = constrain(t / 1000, 0, 1);
    let ease = 1 - pow(1 - moveT, 3);
    
    prAnim.x = lerp(650, BASE_W/2, ease);
    prAnim.y = 250;
    prAnim.s = lerp(80, 150, ease);
    prAnim.txtSize = lerp(16, 32, ease);
    prAnim.txtOffset = lerp(60, 100, ease);

    // 3. 等待 1 秒後淡出 PR (2000ms ~ 2500ms)
    if (t > 2000) {
      prAnim.a = map(t, 2000, 2500, 255, 0, true);
    }

    // 4. 切換步驟
    if (t > 2500) {
      step = 1;
      introPhase = 0;
      return;
    }
  }

  // 標題淡入
  let titleAlpha = constrain(map(animTime, 0, 800, 0, 255), 0, 255);
  fill(255, min(titleAlpha, fadeAlpha));
  textSize(28);
  text("🎬 歡迎進入 Premiere Pro 互動教室", BASE_W/2, 80);
  
  // 副標題淡入
  let subAlpha = constrain(map(animTime, 300, 1100, 0, 255), 0, 255);
  textSize(18);
  fill(200, min(subAlpha, fadeAlpha));
  text("現在市面上有很多剪輯用的軟體", BASE_W/2, 130);
  
  // 定義要顯示的軟體列表
  let items = [
    { img: imgVS, label: "會聲會影" },
    { img: imgClip, label: "Microsoft Clipchamp" },
    { img: imgPD, label: "威力導演" },
    { img: imgPRIcon, label: "Premiere Pro" }
  ];

  let startX = 140;
  let spacing = 170;
  let iconY = 250;

  for (let i = 0; i < items.length; i++) {
    // 特殊處理 Premiere Pro (最後一個項目)
    if (i === 3) {
      let curX, curY, curS, curA, curTxtS, curTxtOff;
      
      if (introPhase === 1) {
        curX = prAnim.x;
        curY = prAnim.y;
        curS = prAnim.s;
        curA = prAnim.a;
        curTxtS = prAnim.txtSize;
        curTxtOff = prAnim.txtOffset;
      } else {
        let delay = i * 200;
        let t = constrain((animTime - delay) / 500, 0, 1);
        let ease = 1 - pow(1 - t, 3);
        curX = startX + i * spacing;
        curY = iconY + (1 - ease) * 50;
        curS = 80;
        curA = t * 255;
        curTxtS = 16;
        curTxtOff = 60;
      }

      if (items[i].img) {
        imageMode(CENTER);
        tint(255, curA);
        image(items[i].img, curX, curY, curS, curS);
        tint(255);
      }
      fill(255, curA);
      textSize(curTxtS);
      text(items[i].label, curX, curY + curTxtOff);
    } else {
      // 其他軟體圖示
      let delay = i * 200;
      let t = constrain((animTime - delay) / 500, 0, 1);
      let ease = 1 - pow(1 - t, 3);
      
      let currentY = iconY + (1 - ease) * 50;
      let currentAlpha = min(t * 255, fadeAlpha); // 套用淡出效果

      if (currentAlpha > 0) {
        if (items[i].img) {
          imageMode(CENTER);
          tint(255, currentAlpha);
          image(items[i].img, startX + i * spacing, currentY, 80, 80);
          tint(255);
        }
        fill(255, currentAlpha);
        textSize(16);
        text(items[i].label, startX + i * spacing, currentY + 60);
      }
    }
  }
  
  // 按鈕淡入
  let btnAlpha = constrain(map(animTime, 1200, 1700, 0, 255), 0, 255);
  btnAlpha = min(btnAlpha, fadeAlpha);
  if (btnAlpha > 0) {
    drawButton("點擊進入Pr教學", BASE_W/2, 420, 150, 40, btnAlpha);
  }
}

function drawLayoutInterface() {
  let animTime = millis() - stepStartMillis;
  let entryFade = constrain(map(animTime, 0, 800, 0, 1), 0, 1);

  // 1. 背景：PR1 (降低透明度)
  if (imgPR1) {
    imageMode(CORNER);
    tint(255, 150 * entryFade);
    image(imgPR1, 0, 0, BASE_W, BASE_H);
    tint(255);
  }

  // 2. 第一階段點擊：淡入 PR2 (降低透明度)
  if (showOverlay >= 1) {
    if (overlayAlpha < 180) overlayAlpha += 10;
    if (imgPR2) {
      tint(255, overlayAlpha);
      image(imgPR2, 0, 0, BASE_W, BASE_H);
      tint(255);
    }
  }
  
  // 3. 第二階段點擊：淡入 PR3 (降低透明度)
  if (showOverlay >= 2) {
    if (overlayAlpha2 < 200) overlayAlpha2 += 10;
    if (imgPR3) {
      tint(255, overlayAlpha2);
      image(imgPR3, 0, 0, BASE_W, BASE_H);
      tint(255);
    }
  }

  // 標題 (保持在最上層，加入深色底色)
  fill(0, 255, 255, 180 * entryFade);
  rectMode(CENTER);
  rect(BASE_W/2, 50, 300, 50, 10);
  rectMode(CORNER);
  
  fill(255, 255 * entryFade);
  textSize(22);
  text("第一步：認識基本的操作界面", BASE_W/2, 50);
  
  // 當顯示到最後一張圖時，顯示按鈕
  if (showOverlay >= 2 && overlayAlpha2 >= 200) {
    drawButton("開始模擬基本的剪輯流程", BASE_W/2, 460, 280, 50);
  }
}

function drawTimelineSim() {
  // 繪製時間軸背景圖
  if (imgPR3) {
    imageMode(CORNER);
    tint(255, 50);
    image(imgPR3, 0, 0, BASE_W, BASE_H);
    tint(255);
  }

  // 計算滑鼠位置用於互動效果
  let mx = (mouseX - offsetX) / scaleFactor;
  let my = (mouseY - offsetY) / scaleFactor;

  textAlign(CENTER, TOP);
  
  // 標題背景
  rectMode(CENTER);
  fill(0, 0, 0, 180);
  rect(BASE_W/2, 60, 500, 70, 10);
  rectMode(CORNER);

  fill(255);
  textSize(20);
  
  // 繪製工具欄 (PR4.png)
  if (imgPR4) {
    imageMode(CORNER);
    image(imgPR4, 0, 10, 50, 280);
  }

  // 繪製工具按鈕 (垂直排列)
  let btnX = 60;
  let btnYStart = 30;
  let btnGap = 70;

  for(let i=0; i<tools.length; i++) {
    let btnY = btnYStart + i * btnGap;
    fill(activeTool === i ? color(0, 150, 255) : 50);
    stroke(255);
    rect(btnX, btnY, 80, 30, 5);
    noStroke();
    fill(255);
    textSize(14);
    textAlign(CENTER, CENTER);
    text(tools[i], btnX + 40, btnY + 15);
    textAlign(CENTER, TOP);
  }
  
  // 根據階段顯示不同的教學內容
  if (timelinePhase === 0) {
    text("第二階段：實作練習 - 1. 匯入素材", BASE_W/2, 40);
    text("動作：在左下角 Project 面板雙擊滑鼠左鍵", BASE_W/2, 70);
    
    // 高亮 Project 面板
    let isHover = (mx > 0 && mx < 130 && my > 300 && my < 480);
    if (isHover) {
      fill(0, 255, 200, 50); // 滑鼠懸停時顯示填充色
    } else {
      noFill();
    }
    stroke(0, 255, 200); strokeWeight(3);
    rect(0, 300, 130, 180);
    noStroke();
    
    // 提示切換工具 (需使用選取工具)
    if (activeTool !== 0) {
      noFill(); stroke(255, 0, 0); strokeWeight(3);
      rect(btnX, btnYStart + 0*btnGap, 80, 30, 5);
      noStroke();
    }
  } 
  else if (timelinePhase === 1) {
    text("第二階段：實作練習 - 2. 建立序列", BASE_W/2, 40);
    text("動作：點擊素材模擬將其「拖曳」到右側時間軸", BASE_W/2, 70);
    
    // Project 面板顯示檔案
    fill(0, 120, 215);
    rect(20, 300, 60, 40);
    fill(255); textSize(12); text("Video.mp4", 50, 345);
    
    // 箭頭指示
    stroke(255); strokeWeight(2);
    line(90, 320, 340, 350);
    fill(255); noStroke();
    triangle(340, 350, 330, 345, 330, 355);
    
    // 提示切換工具 (需使用選取工具)
    if (activeTool !== 0) {
      noFill(); stroke(255, 0, 0); strokeWeight(3);
      rect(btnX, btnYStart + 0*btnGap, 80, 30, 5);
      noStroke();
    }
  }
  else if (timelinePhase === 2) {
    text("第二階段：實作練習 - 3. 剪輯 (C 剃刀)", BASE_W/2, 40);
    text("動作：點選左側 C 工具，然後在影片上點擊模擬剪斷", BASE_W/2, 70);
    
    // 時間軸顯示影片
    fill(0, 120, 215);
    rect(350, 320, 300, 50);
    
    // 提示切換工具
    if (activeTool !== 1) {
      noFill(); stroke(255, 0, 0); strokeWeight(3);
      rect(btnX, btnYStart + 1*btnGap, 80, 30, 5);
      noStroke();
    }
  }
  else if (timelinePhase === 3) {
    text("第二階段：實作練習 - 4. 刪除 (V 選取)", BASE_W/2, 40);
    text("動作：點選左側 V 工具，點擊後段影片進行刪除", BASE_W/2, 70);
    
    // 顯示已切斷的影片
    fill(0, 120, 215);
    rect(350, 320, 140, 50); // 前段
    fill(0, 100, 180);
    rect(510, 320, 140, 50); // 後段 (待刪除)
    
    if (activeTool !== 0) {
      noFill(); stroke(255, 0, 0); strokeWeight(3);
      rect(btnX, btnYStart + 0*btnGap, 80, 30, 5);
      noStroke();
    }
  }
  else if (timelinePhase === 4) {
    text("第二階段：實作練習 - 5. 字幕 (T 文字)", BASE_W/2, 40);
    text("動作：點選左側 T 工具，在右上角畫面點擊輸入", BASE_W/2, 70);
    
    fill(0, 120, 215);
    rect(350, 320, 140, 50);
    
    if (activeTool !== 2) {
      noFill(); stroke(255, 0, 0); strokeWeight(3);
      rect(btnX, btnYStart + 2*btnGap, 80, 30, 5);
      noStroke();
    }
  }
  else if (timelinePhase === 5) {
    text("實作練習完成！", BASE_W/2, 40);
    text("接下來進入聲音處理與匯出環節", BASE_W/2, 70);
    
    fill(0, 120, 215);
    rect(350, 320, 140, 50);
    
    // 顯示字幕
    fill(255); textSize(40);
    text("字幕特效", 580, 150);
    
    drawButton("下一步", BASE_W/2, 450, 150, 40);
  }
  
  textAlign(CENTER, CENTER);
}

function drawExportEffect() {
  // 使用深色純色背景
  noStroke();
  fill(30);
  rect(0, 0, BASE_W, BASE_H);

  fill(255, 204, 0);
  textSize(32);
  text("✨ 第三階段：聲音處理與匯出 ✨", BASE_W/2, BASE_H/2 - 50);
  textSize(18);
  fill(200);
  text("聲音部分：可以調整音軌細線 | 匯出部分：快捷鍵Ctrl + M (選 H.264)匯出mp4", BASE_W/2, BASE_H/2);
  
  // 模擬進度條
  let barW = map(sin(frameCount * 0.05), -1, 1, 100, 500);
  fill(50);
  rect(150, BASE_H/2 + 50, 500, 20);
  fill(0, 255, 100);
  rect(150, BASE_H/2 + 50, barW, 20);
  
  drawButton("重新學習", BASE_W/2, 400, 150, 40);
}

// --- 互動邏輯 ---

function mousePressed() {
  // 將滑鼠座標轉換為虛擬畫布座標
  let mx = (mouseX - offsetX) / scaleFactor;
  let my = (mouseY - offsetY) / scaleFactor;

  // 粒子特效觸發
  for(let i=0; i<5; i++) particles.push(new Particle(mx, my));

  if (step === 0 && isOverButton(BASE_W/2, 420, 150, 40)) {
    if (introPhase === 0) {
      introPhase = 1;
      introTransitionStart = millis();
    }
  }
  else if (step === 1) {
    // 點擊切換圖片顯示階段
    if (showOverlay === 0) showOverlay = 1;
    else if (showOverlay === 1) showOverlay = 2;
    else if (showOverlay === 2) {
      if (isOverButton(BASE_W/2, 460, 280, 50)) step = 2;
    }
  }
  else if (step === 2) {
    // 檢查切換工具
    let btnX = 60;
    let btnYStart = 30;
    let btnGap = 70;
    for(let i=0; i<tools.length; i++) {
      if (mx > btnX && mx < btnX + 80 && my > btnYStart + i*btnGap && my < btnYStart + i*btnGap + 30) {
        activeTool = i;
      }
    }

    // 階段互動邏輯
    if (timelinePhase === 0) {
      // 點擊 Project 面板 (左下)
      if (activeTool === 0 && mx > 0 && mx < 130 && my > 300 && my < 480) timelinePhase = 1;
    }
    else if (timelinePhase === 1) {
      // 點擊檔案 (模擬拖曳)
      if (activeTool === 0 && mx > 20 && mx < 80 && my > 300 && my < 340) timelinePhase = 2;
    }
    else if (timelinePhase === 2) {
      // C 工具 + 點擊影片
      if (activeTool === 1 && mx > 350 && mx < 650 && my > 320 && my < 370) timelinePhase = 3;
    }
    else if (timelinePhase === 3) {
      // V 工具 + 點擊後段影片
      if (activeTool === 0 && mx > 510 && mx < 650 && my > 320 && my < 370) timelinePhase = 4;
    }
    else if (timelinePhase === 4) {
      // T 工具 + 點擊預覽視窗 (右上)
      if (activeTool === 2 && mx > 400 && mx < 750 && my > 50 && my < 250) timelinePhase = 5;
    }
    else if (timelinePhase === 5) {
      if (isOverButton(BASE_W/2, 450, 150, 40)) step = 3;
    }
  } else if (step === 3 && isOverButton(BASE_W/2, 400, 150, 40)) {
    step = 0;
    isCut = false;
    showOverlay = 0;
    overlayAlpha = 0;
  }
}

function keyPressed() {
  if (step === 2) {
    if (key === 'v' || key === 'V') activeTool = 0;
    else if (key === 'c' || key === 'C') activeTool = 1;
    else if (key === 't' || key === 'T') activeTool = 2;
  }
}

// --- 輔助工具 ---

function drawProgress() {
  stroke(50);
  line(50, 20, 750, 20);
  noStroke();
  fill(0, 255, 200);
  ellipse(50 + step * 233, 20, 15, 15);
}

function drawButton(txt, x, y, w = 150, h = 40, alpha = 255) {
  let c = isOverButton(x, y, w, h) ? color(0, 200, 255) : color(70);
  c.setAlpha(alpha);
  fill(c);
  rect(x - w/2, y - h/2, w, h, 20);
  fill(255, alpha);
  textSize(16);
  text(txt, x, y);
}

function isOverButton(x, y, w = 150, h = 40) {
  let mx = (mouseX - offsetX) / scaleFactor;
  let my = (mouseY - offsetY) / scaleFactor;
  return (mx > x - w/2 && mx < x + w/2 && my > y - h/2 && my < y + h/2);
}

class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = random(-2, 2);
    this.vy = random(-2, 2);
    this.alpha = 255;
  }
  finished() { return this.alpha < 0; }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= 5;
  }
  show() {
    noStroke();
    fill(0, 255, 200, this.alpha);
    ellipse(this.x, this.y, 4);
  }
}
