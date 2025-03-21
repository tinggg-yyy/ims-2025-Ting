// “star in the bottle” by Senbaku https://openprocessing.org/sketch/911421
// CreativeCommons Attribution NonCommercial ShareAlike: https://creativecommons.org/licenses/by-nc-sa/3.0

let mover = []; // array for storing stars
let liquid;
let c; // color for stars
let cw; // color for water

function setup() {
  createCanvas(600, 600);
  //background(0);

  // generate 30 stars
  for (let i = 0; i < 30; i++) {
    mover[i] = new Mover(
      random(1, 5), // mass
      random(230, 360), // x position
      random(160, 170), // y position
      45, // radius1
      70, // radius2
      10 // number of points
    );
  }

  // create water
  liquid = new Water(220, height / 2 - 80, 160, 315, 1.5);

  // create a texture for the background
  // createGraphics: https://p5js.org/reference/p5/createGraphics/  a separate canvas to draw on, will not affect the main canvas
  tx = createGraphics(width, height);
  //angleMode: https://p5js.org/reference/p5/angleMode/ p5.js use radians by default but degrees is more direct.
  tx.angleMode(DEGREES);
  tx.noStroke();
  // draw random circles for the texture for the bottle
  for (let i = 0; i < (width * height * 1) / 10; i++) {
    let x = random(width);
    let y = random(height);
    tx.fill(0, 3);
    tx.ellipse(x, y, random(20), random(20));
  }
}

function draw() {
  background("#212331");
  // create a wind force
  let wind = createVector(0, 0);
  // if mouse is pressed, apply wind force to make the stars move up
  if (mouseIsPressed) {
    wind = createVector(0, -1);
  }

  // draw the bottle
  bottle();

  // apply forces to the stars
  for (let i = 0; i < mover.length; i++) {
    if (liquid.contains(mover[i])) {
      let dragForce = liquid.calculateDrag(mover[i]);
      mover[i].applyForce(dragForce);
    }
    let m = mover[i].mass;
    let gravity = createVector(0, 0.2 * m); //重力をスケーリング Gravity force based on mass
    mover[i].applyForce(wind);
    mover[i].applyForce(gravity);
    mover[i].update();
    mover[i].show();
    mover[i].checkEdges();
    liquid.show();
  }
  // draw the texture for the bottle
  image(tx, 0, 0);
}

// draw the bottle
function bottle() {
  push();
  // drawingContext: https://p5js.org/reference/p5/drawingContext/
  // it uses the HTML5 canvas 2D context to draw shadows
  drawingContext.shadowOffsetX = 0;
  drawingContext.shadowOffsetY = 0;
  drawingContext.shadowBlur = 250;
  drawingContext.shadowColor = "#f4f1de";
  fill(220);
  noStroke();
  push();
  rectMode(CENTER);
  rect(width / 2, 80, 40, 30, 20);
  rect(width / 2, 100, 130, 20, 10);
  rect(width / 2, 130, 100, 50, 10);
  rect(width / 2, height / 2 + 50, 180, 400, 50);
  rect(width / 2, height / 2 + 150, 180, 200, 20);
  pop();
  pop();
}

// stars class
class Mover {
  constructor(m, x, y, radius1, radius2, npoints) {
    // this.x = x;
    // this.y = y;
    this.radius1 = radius1;
    this.radius2 = radius2;
    this.npoints = npoints;
    this.angle = TWO_PI / this.npoints;
    this.halfAngle = this.angle / 2.0;

    this.mass = m;
    this.pos = createVector(x, y);
    this.vel = createVector(0, 0);
    this.acc = createVector(0.0);
    // d is the diameter of the star
    this.d = this.mass * 8;
    //this.topspeed = 4;
    // yama and tani are the distance from the center to the top and bottom of the star
    this.yama = (this.radius1 * this.mass) / 15;
    this.tani = (this.radius2 * this.mass) / 15;
  }
  applyForce(force) {
    let f = p5.Vector.div(force, this.mass);
    this.acc.add(f);
  }
  update() {
    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.acc.mult(0);
  }
  show() {
    stroke(255);
    c = color("#f4f1de");
    fill(c);
    push();
    drawingContext.shadowOffsetX = 0;
    drawingContext.shadowOffsetY = 0;
    drawingContext.shadowBlur = 30;
    drawingContext.shadowColor = "#f4f1de";
    beginShape();
    // draw the star
    for (let a = 0; a < TWO_PI; a += this.angle) {
      let sx = this.pos.x + cos(a) * this.yama;
      let sy = this.pos.y + sin(a) * this.yama;
      vertex(sx, sy);
      sx = this.pos.x + cos(a + this.halfAngle) * this.tani;
      sy = this.pos.y + sin(a + this.halfAngle) * this.tani;
      vertex(sx, sy);
    }
    endShape(CLOSE);

    pop();
  }

  // check if the stars are in the bottle
  checkEdges() {
    if (this.pos.y > 540 - this.d) {
      this.vel.y *= -1;
      this.pos.y = 540 - this.d;
    } else if (this.pos.x > 380) {
      this.pos.x = 380;
      this.vel.x *= -1;
    } else if (this.pos.x < 240) {
      this.vel.x *= -1;
      this.pos.x = 240;
    } else if (this.pos.y < height / 2 - 100) {
      this.vel.y *= -1;
      this.pos.y = height / 2 - 100;
    }
  }
}

// Water
class Water {
  constructor(x, y, w, h, c) {
    this.x = x; // x position
    this.y = y; // y position
    this.w = w; // width
    this.h = h; // height
    this.c = c; // drag coefficient
  }

  contains(mover) {
    let l = mover.pos; // l is the location of the mover
    // check if stars are inside the water, if not, return false, it will not apply drag
    return (
      l.x > this.x &&
      l.x < this.x + this.w &&
      l.y > this.y &&
      l.y < this.y + this.h
    );
  }

  calculateDrag(mover) {
    let speed = mover.vel.mag(); // get the speed/direction of the star
    let dragMagnitude = this.c * speed * speed; // drag force is acceleration, so it is proportional to the square of the speed
    let dragForce = mover.vel.copy(); // create a vector for drag force
    dragForce.mult(-1); // reverse the direction of the drag force
    dragForce.normalize(); // normalize the vector as the direction of the velocity
    dragForce.mult(dragMagnitude); // multiply the drag force by the drag magnitude
    return dragForce; // if the stars are in the water, it will apply drag
  }

  show() {
    noStroke();
    cw = color("#91ADC2");
    cw.setAlpha(10);
    fill(cw);
    rect(this.x, this.y, this.w, this.h);
  }
}
