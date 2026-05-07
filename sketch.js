let cam, prevFrame, trailLayer;
let pixelSize = 15;
let cornerRadius = 0;
let fadeAmount = 30;
const border = 40;
const camW = 1640;
const camH = 1480;
const sliderW = 220;
let draggingPixel = false;
let draggingCorner = false;
let draggingTrail = false;

function setup() {
  createCanvas(1740, 1660);
  pixelDensity(1);
  cam = createCapture(VIDEO);
  cam.size(camW, camH);
  cam.hide();
  prevFrame = createGraphics(camW, camH);
  trailLayer = createGraphics(camW, camH);
  trailLayer.background(255);
}

function draw() {
  background(255);
  cam.loadPixels();
  if (!cam.pixels || cam.pixels.length === 0) {
    fill(180);
    textSize(16);
    textAlign(CENTER, CENTER);
    text("等待摄像头授权...", width / 2, height / 2);
    return;
  }

  // 拖尾淡出：每帧盖一层半透明白
  trailLayer.noStroke();
  trailLayer.fill(255, fadeAmount);
  trailLayer.rect(0, 0, camW, camH);

  prevFrame.loadPixels();

  for (let x = 0; x < camW - pixelSize; x += pixelSize) {
    for (let y = 0; y < camH - pixelSize; y += pixelSize) {

      // 镜像 x（只做一次）
      let cx = constrain(camW - 1 - (x + floor(pixelSize / 2)), 0, camW - 1);
      let cy = constrain(y + floor(pixelSize / 2), 0, camH - 1);
      let idx = (cx + cy * camW) * 4;

      let dr = cam.pixels[idx]     - prevFrame.pixels[idx];
      let dg = cam.pixels[idx + 1] - prevFrame.pixels[idx + 1];
      let db = cam.pixels[idx + 2] - prevFrame.pixels[idx + 2];
      let motion = sqrt(dr * dr + dg * dg + db * db);

      if (motion > 25) {
        // 方向检测
        let lx = constrain(cx - pixelSize, 0, camW - 1);
        let rx = constrain(cx + pixelSize, 0, camW - 1);
        let uy = constrain(cy - pixelSize, 0, camH - 1);
        let dy = constrain(cy + pixelSize, 0, camH - 1);

        let bR = cam.pixels[(rx + cy * camW) * 4];
        let bL = cam.pixels[(lx + cy * camW) * 4];
        let bD = cam.pixels[(cx + dy * camW) * 4];
        let bU = cam.pixels[(cx + uy * camW) * 4];

        let diffH = bR - bL;
        let diffV = bD - bU;

        let col;
        if (abs(diffH) >= abs(diffV)) {
          col = diffH > 0 ? color(220, 60, 40) : color(40, 100, 220);
        } else {
          col = diffV > 0 ? color(40, 180, 100) : color(160, 60, 220);
        }

        let r2 = map(cornerRadius, 0, 100, 0, pixelSize);

        // 写入拖尾层
        trailLayer.noStroke();
        trailLayer.fill(col);
        trailLayer.rect(x, y, pixelSize, pixelSize, r2);

        // 实时块画在主画布
        noStroke();
        fill(col);
        rect(border + x, border + y, pixelSize, pixelSize, r2);
      }
    }
  }

  // 拖尾叠在实时块下方：先清白底，再画拖尾，实时块已在上面
  // 正确顺序：background(255) → image(trailLayer) → 实时块
  // 已在循环前 background(255)，这里补画拖尾
  image(trailLayer, border, border);

  // 边框
  stroke(0);
  strokeWeight(2);
  noFill();
  rect(border - 2, border - 2, camW + 4, camH + 4);

  // 保存当前帧为上一帧
  prevFrame.image(cam, 0, 0, camW, camH);

  drawSliders();
}

function drawSliders() {
  let uiY = border + camH + 24;
  let s1x = border;
  let s2x = border + sliderW + 60;
  let s3x = border + (sliderW + 60) * 2;

  textSize(13);
  textAlign(LEFT, CENTER);

  fill(0); noStroke();
  text("像素大小  " + pixelSize + "px", s1x, uiY - 14);
  stroke(180); strokeWeight(1.5);
  line(s1x, uiY + 10, s1x + sliderW, uiY + 10);
  fill(0); noStroke();
  ellipse(s1x + map(pixelSize, 4, 60, 0, sliderW), uiY + 10, 14, 14);

  fill(0); noStroke();
  text("像素圆角  " + cornerRadius + "%", s2x, uiY - 14);
  stroke(180); strokeWeight(1.5);
  line(s2x, uiY + 10, s2x + sliderW, uiY + 10);
  fill(0); noStroke();
  ellipse(s2x + map(cornerRadius, 0, 100, 0, sliderW), uiY + 10, 14, 14);

  let trailDisplay = int(map(fadeAmount, 5, 80, 100, 0));
  fill(0); noStroke();
  text("拖尾长度  " + trailDisplay + "%", s3x, uiY - 14);
  stroke(180); strokeWeight(1.5);
  line(s3x, uiY + 10, s3x + sliderW, uiY + 10);
  fill(0); noStroke();
  ellipse(s3x + map(fadeAmount, 5, 80, sliderW, 0), uiY + 10, 14, 14);
}

function mousePressed() {
  let uiY = border + camH + 24;
  let s1x = border;
  let s2x = border + sliderW + 60;
  let s3x = border + (sliderW + 60) * 2;
  if (dist(mouseX, mouseY, s1x + map(pixelSize, 4, 60, 0, sliderW), uiY + 10) < 14) draggingPixel = true;
  if (dist(mouseX, mouseY, s2x + map(cornerRadius, 0, 100, 0, sliderW), uiY + 10) < 14) draggingCorner = true;
  if (dist(mouseX, mouseY, s3x + map(fadeAmount, 5, 80, sliderW, 0), uiY + 10) < 14) draggingTrail = true;
}

function mouseDragged() {
  let s1x = border;
  let s2x = border + sliderW + 60;
  let s3x = border + (sliderW + 60) * 2;
  if (draggingPixel) pixelSize = int(map(constrain(mouseX - s1x, 0, sliderW), 0, sliderW, 4, 60));
  if (draggingCorner) cornerRadius = int(map(constrain(mouseX - s2x, 0, sliderW), 0, sliderW, 0, 100));
  if (draggingTrail) fadeAmount = map(constrain(mouseX - s3x, 0, sliderW), 0, sliderW, 80, 5);
}

function mouseReleased() {
  draggingPixel = false;
  draggingCorner = false;
  draggingTrail = false;
}
