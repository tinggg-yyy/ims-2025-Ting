// Press f/F to enter fullscreen
// Use your hand to interact with the tornado
// Adapted from my Nature of Code Homework
// Declare an array to hold dust particles
let dust = [];
let a;
let b;
let bodyPose;
let poses = [];
let connections;
let my = {};
let dustSize = 10; // Default size for dust particles
let dustColor = { r: 255, g: 255, b: 255 }; // Default color for dust particles
let dustRandomness = 2; // Default randomness for dust movement

function preload() {
  // Load the bodyPose model
  bodyPose = ml5.bodyPose();
}

function setup() {
  my.version = "?v=1";

  my.canvas = createCanvas(windowWidth, windowHeight);

  my.urlParams = get_url_params();

  console.log("my.urlParams", my.urlParams);
  let str = localStorage.getItem("urlParams");
  if (str) {
    my.urlParamsFromStorage = JSON.parse(str);
    console.log("my.urlParamsFromStorage", my.urlParamsFromStorage);
  }

  if (my.urlParams) {
    save_params();
  }

  // Create the video and hide it
  video = createCapture(VIDEO);
  video.size(windowWidth, windowHeight);
  video.hide();
  // Start detecting poses in the webcam video
  bodyPose.detectStart(video, gotPoses);
  // Get the skeleton connection information
  connections = bodyPose.getSkeleton();
}

// Callback function for when the model returns pose data
function gotPoses(results) {
  // Store the model's results in a global variable
  poses = results;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  // Re-parse URL parameters in every frame
  my.urlParams = get_url_params();

  let x = 10;
  let y = height * 0.2;
  let str = "no params";
  let params = my.urlParams;
  if (my.urlParams) {
    if (my.urlParams.dustSize) {
      dustSize = parseFloat(my.urlParams.dustSize);
    }
    if (my.urlParams.dustColor) {
      const colorArray = my.urlParams.dustColor.split(",").map(Number);
      if (colorArray.length === 3) {
        dustColor = { r: colorArray[0], g: colorArray[1], b: colorArray[2] };
      }
    }
    if (my.urlParams.randomness) {
      dustRandomness = parseFloat(my.urlParams.randomness);
    }
  }
  textSize(height * 0.05);
  fill(255);
  text(str, x, y);

  // Mirror the entire canvas
  push();
  translate(width, 0); // Move the origin to the right edge of the canvas
  scale(-1, 1); // Flip the canvas horizontally

  // Display the video
  image(video, 0, 0, width, height);

  // Scale factors for mapping video coordinates to canvas coordinates
  let scaleX = width / video.width;
  let scaleY = height / video.height;

  // Default wrist positions to (0, 0)
  let leftWristX = 0;
  let leftWristY = 0;
  let rightWristX = 0;
  let rightWristY = 0;

  // Update wrist positions if detected
  if (poses.length > 0) {
    if (poses[0].left_wrist && poses[0].left_wrist.x && poses[0].left_wrist.y) {
      leftWristX = poses[0].left_wrist.x * scaleX; // Map to canvas coordinates
      leftWristY = poses[0].left_wrist.y * scaleY; // Map to canvas coordinates
    }
    if (
      poses[0].right_wrist &&
      poses[0].right_wrist.x &&
      poses[0].right_wrist.y
    ) {
      rightWristX = poses[0].right_wrist.x * scaleX; // Map to canvas coordinates
      rightWristY = poses[0].right_wrist.y * scaleY; // Map to canvas coordinates
    }
  }

  // Draw circles on wrists with a blobby effect
  if (leftWristX !== 0 && leftWristY !== 0) {
    fill(255);
    noStroke();
    drawBlobbyCircle(leftWristX, leftWristY, 20); // Left wrist
  }

  if (rightWristX !== 0 && rightWristY !== 0) {
    fill(255);
    noStroke();
    drawBlobbyCircle(rightWristX, rightWristY, 20); // Right wrist
  }

  // Add a new dust particle based on the center of the canvas
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
  while (dust.length > windowHeight / 3) {
    dust.splice(0, 1); // Remove oldest particles
  }

  pop(); // Restore the original canvas orientation

  // Display URL parameters at the bottom center of the screen
  displayUrlParams();
}

// Handle key press for fullscreen
function keyPressed() {
  if (key === "f" || key === "F") {
    let fs = fullscreen();
    fullscreen(!fs); // Toggle fullscreen mode
  }
}

function draw_params(params) {
  let c = params.c || "255"; // Default color if not provided
  let r = (params.r || 10) * 0.01 * width; // Default radius if not provided
  let x = width * 0.5;
  let y = height * 0.5;
  fill(c);
  circle(x, y, r);
}

// Define Dust class for individual particles
class Dust {
  constructor(x, y) {
    this.pos = createVector(x, y); // Position
    this.vel = createVector(random(-2, 2), 0); // Horizontal velocity
    this.float = createVector(0, random(-1, 0)); // Vertical upward float
    this.wind1 = createVector(random(0, 1), random(0, 0.01)); // Wind effect to the left
    this.wind2 = createVector(random(0, 1), random(-0.01, 0)); // Wind effect to the right
    // Apply randomness to color
    this.r = constrain(
      dustColor.r + random(-dustRandomness * 10, dustRandomness * 10),
      0,
      255
    );
    this.g = constrain(
      dustColor.g + random(-dustRandomness * 10, dustRandomness * 10),
      0,
      255
    );
    this.b = constrain(
      dustColor.b + random(-dustRandomness * 10, dustRandomness * 10),
      0,
      255
    );

    this.t = 100; // Transparency
    this.size = dustSize;
  }

  // Update position with floating and wind effects
  rise() {
    this.pos.add(this.vel); // Add horizontal movement
    this.pos.add(this.float); // Add vertical float

    // Default wrist position to (0, 0)
    let leftwristX = 0;
    let leftwristY = 0;
    let rightwristX = 0;
    let rightwristY = 0;

    // Update wrist position if detected
    if (
      poses.length > 0 &&
      poses[0].left_wrist &&
      poses[0].left_wrist.x &&
      poses[0].left_wrist.y &&
      poses[0].right_wrist &&
      poses[0].right_wrist.x &&
      poses[0].right_wrist.y
    ) {
      leftwristX = poses[0].left_wrist.x; // Left wrist x position
      leftwristY = poses[0].left_wrist.y; // Left wrist y position
      rightwristX = poses[0].right_wrist.x; // Left wrist x position
      rightwristY = poses[0].right_wrist.y; // Left wrist y position
    }

    // Apply wind based on position and wrist position
    if (
      this.pos.x >
        width / 2 + ((height - this.pos.y) / (width / 2 - leftwristX)) * 10 ||
      this.pos.x >
        width / 2 + ((height - this.pos.y) / (width / 2 - rightwristX)) * 10
    ) {
      this.vel.sub(this.wind1); // Push to the left
    }
    if (
      this.pos.x <=
        width / 2 - ((height - this.pos.y) / (leftwristX - width / 2)) * 10 ||
      this.pos.x <=
        width / 2 - ((height - this.pos.y) / (rightwristX - width / 2)) * 10
    ) {
      this.vel.add(this.wind2); // Push to the right
    }
  }

  // Check if the particle has exited the screen
  checkEdges() {
    if (this.pos.y < windowHeight / 10) {
      this.isDone = true;
    }
  }

  // Draw the particle
  display() {
    push();
    blendMode(ADD); // Additive blending for glowing effect
    fill(this.r, this.g, this.b, this.t); // Semi-transparent colored circle
    noStroke();
    // Circle size depends on height and current position
    let normY = max(1, this.pos.y); // Avoid this.pos.y=0
    let size = log(height / normY) * (windowHeight / 50);
    circle(this.pos.x, this.pos.y, this.size);
    pop();
  }
}

function drawBlobbyCircle(x, y, radius) {
  push();
  translate(x, y); // Move to the wrist position
  fill(255, 150); // Semi-transparent white
  noStroke();

  let yoff = frameCount * 0.01; // Dynamic offset for animation
  beginShape();
  let xoff = 0;
  for (let a = 0; a < TWO_PI; a += 0.1) {
    let offset = map(noise(xoff, yoff), 0, 1, -5, 5); // Adjust the "blobby" range
    let r = radius + offset;
    let x = r * cos(a);
    let y = r * sin(a);
    vertex(x, y);
    xoff += 0.1;
  }
  endShape(CLOSE);
  // Apply blur effect
  filter(BLUR, 5);
  pop();
}

function get_url_params() {
  let query = window.location.search;
  console.log("Query string:", query); // Debugging: log the query string
  if (query.length < 1) return null;
  let params = params_query(query);
  console.log("Parsed params:", params); // Debugging: log the parsed parameters
  return params;
}

// https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams
function params_query(query) {
  const urlParams = new URLSearchParams(query);
  const params = Object.fromEntries(urlParams);
  return params;
}

// Function to display URL parameters at the bottom center
function displayUrlParams() {
  let params = my.urlParams;
  let str = "No URL Parameters";
  if (params) {
    str = JSON.stringify(params, null, 2); // Convert parameters to a readable string
  }

  // Draw the text at the bottom center of the screen
  textSize(10); // Set text size
  fill(255); // Set text color to white
  textAlign(CENTER, BOTTOM); // Align text to the bottom center
  text(str, width / 2, height - 10); // Position the text
}

function save_params() {
  if (!my.urlParams) {
    console.log("no my.urlParams");
    return;
  }
  let str = JSON.stringify(my.urlParams, null, 2);
  localStorage.setItem("urlParams", str);
}
