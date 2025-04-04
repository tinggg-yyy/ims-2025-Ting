// Press f/F to enter fullscreen
// Adapted from my Nature of Code Homework
// Declare an array to hold dust particles
let dust = [];
let a;
let b;

function setup() {
  createCanvas(windowWidth, windowHeight); // Create a canvas the size of the window
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  //background(0); // Set background to black on every frame
background(255);
  // Add a new dust particle each frame
  dust.push(new Dust(windowWidth / 2, (9 * windowHeight) / 10));

  // Adjust frame rate depending on mouse state
  if (mouseIsPressed === true) {
    frameRate(10); // Slow motion when mouse is pressed
  } else {
    frameRate(60); // Normal speed
  }

  // Loop through all dust particles
  for (let i = 0; i < dust.length; i++) {
    let d = dust[i];
    d.rise(); // Update position
    d.checkEdges(); // Check if it's off screen
    d.display(); // Draw the particle
  }

  // Limit total number of particles to 300
  while (dust.length > windowHeight/3) {
    dust.splice(0, 1); // Remove oldest particles
  }

  // Remove particles that are done
  for (let i = dust.length - 1; i >= 0; i--) {
    let d = dust[i];
    if (d.isDone) {
      dust.splice(i, 10); // Remove multiple particles if one is marked done
    }
  }
}

// Handle key press for fullscreen
function keyPressed() {
  if (key === "f" || key === "F") {
    let fs = fullscreen();
    fullscreen(!fs); // Toggle fullscreen mode
  }
}

// Define Dust class for individual particles
class Dust {
  constructor(x, y) {
    this.pos = createVector(x, y); // Position
    this.vel = createVector(random(-2, 2), 0); // Horizontal velocity
    this.float = createVector(0, random(-1, 0)); // Vertical upward float
    this.wind1 = createVector(random(0, 1), random(0, 0.01)); // Wind effect to the left
    this.wind2 = createVector(random(0, 1), random(-0.01, 0)); // Wind effect to the right
    this.r = random(0, 255); // Red color value
    this.g = random(0, 255); // Green color value
    this.b = random(0, 255); // Blue color value
    this.t = 90; // Transparency
  }

  // Update position with floating and wind effects
  rise() {
    this.pos.add(this.vel); // Add horizontal movement
    this.pos.add(this.float); // Add vertical float

    // Apply wind based on position and mouse X
    if (
      this.pos.x >
      width / 2 + ((height - this.pos.y) / (width / 2 - mouseX)) * 10
    ) {
      this.vel.sub(this.wind1); // Push to the left
    }
    if (
      this.pos.x <=
      width / 2 - ((height - this.pos.y) / (mouseX - width / 2)) * 10
    ) {
      this.vel.add(this.wind2); // Push to the right
    }
  }

  // Check if the particle has exited the screen
  checkEdges() {
    if (this.pos.y < windowHeight/10) {
      this.isDone = true;
    }
  }

  // Draw the particle
  display() {
    push();
    //blendMode(ADD); // Additive blending for glowing effect
    blendMode(MULTIPLY);
    fill(this.r, this.g, this.b, this.t); // Semi-transparent colored circle
    noStroke();
    // Circle size depends on height and current position
    let normY = max(1, this.pos.y); // Avoid this.pos.y=0
    let size = log(height / normY) * (windowHeight/50);
    circle(this.pos.x, this.pos.y, size);
    pop();
  }
}
