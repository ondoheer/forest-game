const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const offscreenCanvas = document.createElement('canvas');
offscreenCanvas.width = canvas.width;
offscreenCanvas.height = canvas.height;
const offscreenCtx = offscreenCanvas.getContext('2d');

const input = {};

document.addEventListener('keydown', (event) => {
  if (event.code === 'Escape') {
    togglePause();
  } else {
    input[event.code] = true;
  }
});

document.addEventListener('keyup', (event) => {
  if (event.code !== 'Escape') {
    input[event.code] = false;
  }
});


let gamePaused = false;

function togglePause() {
  gamePaused = !gamePaused;
  if (!gamePaused) {
    gameLoop();
  }
}




class Position {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

class Size {
  constructor(width, height) {
    this.width = width;
    this.height = height;
  }
}

class Velocity {
  constructor(speed) {
    this.speed = speed;
  }
}

class Health {
  constructor(value) {
    this.value = value;
  }
}

class Inventory {
  constructor(weapons) {
    this.weapons = weapons;
  }
}

class Color {
  constructor(value) {
    this.name = 'Color';
    this.value = value;
  }
}

class Damage {
  constructor(value) {
    this.name = 'Damage';
    this.value = value;
  }
}

class Spacing {
  constructor(value) {
    this.value = value;
  }
}

class Flocking {
  constructor(separationWeight, alignmentWeight, cohesionWeight, perceptionRadius) {
    this.separationWeight = separationWeight;
    this.alignmentWeight = alignmentWeight;
    this.cohesionWeight = cohesionWeight;
    this.perceptionRadius = perceptionRadius;
  }
}

class Entity {
  constructor() {
    this.id = Math.random().toString(36).substr(2, 9);
    this.components = {};
  }

  addComponent(component) {
    this.components[component.constructor.name] = component;
    return this;
  }

  removeComponent(componentName) {
    delete this.components[componentName];
    return this;
  }

  getComponent(componentName) {
    return this.components[componentName];
  }

  hasComponent(componentName) {
    return componentName in this.components;
  }
}

class EnemyPool {
  constructor() {
    this.pool = [];
  }

  createEnemy(x, y, width, height, speed, color, dmg, spacing) {
    const existingEnemy = this.pool.find((enemy) => !enemy.active);
  
    if (existingEnemy) {
      existingEnemy.active = true;
      const position = existingEnemy.getComponent('Position');
      position.x = x;
      position.y = y;
      return existingEnemy;
    } else {
      const newEnemy = new Entity()
        .addComponent(new Position(x, y))
        .addComponent(new Size(width, height))
        .addComponent(new Velocity(speed))
        .addComponent(new Health(1))
        .addComponent(new Color(color))
        .addComponent(new Damage(dmg))
        .addComponent(new Spacing(spacing))
        .addComponent(new Flocking(1.5, 1, 1, 50));
      newEnemy.active = true;
      this.pool.push(newEnemy);
      return newEnemy;
    }
  }
  
}

const enemyPool = new EnemyPool();

const player = new Entity()
  .addComponent(new Position(400, 300))
  .addComponent(new Color('blue'))
  .addComponent(new Size(30, 30))
  .addComponent(new Velocity(5))
  .addComponent(new Health(100))
  .addComponent(new Inventory([]));



const entities = [player];

function spawnEnemies() {
  const groupSize = Math.floor(Math.random() * 11) + 10; // Random group size between 10 and 20
  const edge = Math.random() < 0.5 ? 0 : canvas.width - 20; // Randomly choose left or right edge

  for (let i = 0; i < groupSize; i++) {
    let validPosition = false;
    let x, y;

    while (!validPosition) {
      x = edge;
      y = Math.random() * (canvas.height - 20);

      validPosition = true;

      // Check if the new enemy is too close to existing enemies
      for (const entity of entities) {
        if (entity.hasComponent('Spacing')) {
          const position = entity.getComponent('Position');
          const size = entity.getComponent('Size');
          const spacing = entity.getComponent('Spacing').value;

          const dx = Math.abs(position.x - x);
          const dy = Math.abs(position.y - y);
          const minDistance = size.width / 2 + spacing;

          if (dx < minDistance && dy < minDistance) {
            validPosition = false;
            break;
          }
        }
      }
    }

    const enemy = enemyPool.createEnemy(x, y, 20, 20, player.getComponent('Velocity').speed / 2, 'red', 1, 10);
    entities.push(enemy);
  }
}

function getRandomGreen() {
  const greenShades = [
    '#6dbf67',
    '#5cac5a',
    '#4b9950',
    '#388646',
    '#26733c',
  ];
  return greenShades[Math.floor(Math.random() * greenShades.length)];
}

let spawnInterval;
let startTime = Date.now();

function startSpawning() {
  spawnInterval = setInterval(() => {
    if (Date.now() - startTime < 30000) {
      spawnEnemies();
    } else {
      clearInterval(spawnInterval);
    }
  }, 3000);
}

startSpawning();


function update() {
  const playerPosition = player.getComponent('Position');
  const playerSize = player.getComponent('Size');
  const playerHealth = player.getComponent('Health');
  const playerVelocity = player.getComponent('Velocity');

  entities.forEach((entity) => {
    // Update the player's position based on input
    if (entity === player) {
      let newX = playerPosition.x;
      let newY = playerPosition.y;

      if (input['KeyW']) newY -= playerVelocity.speed;
      if (input['KeyA']) newX -= playerVelocity.speed;
      if (input['KeyS']) newY += playerVelocity.speed;
      if (input['KeyD']) newX += playerVelocity.speed;

      if (newX >= 0 && newX + playerSize.width <= canvas.width) {
        playerPosition.x = newX;
      }

      if (newY >= 0 && newY + playerSize.height <= canvas.height) {
        playerPosition.y = newY;
      }
    } if (entity.hasComponent('Flocking')) {
      // Flocking behavior
      const position = entity.getComponent('Position');
      const velocity = entity.getComponent('Velocity');
      const flocking = entity.getComponent('Flocking');
      
      let separation = { x: 0, y: 0 };
      let alignment = { x: 0, y: 0 };
      let cohesion = { x: 0, y: 0 };
      let neighbors = 0;

      entities.forEach((other) => {
        if (other !== entity && other.hasComponent('Flocking')) {
          const otherPosition = other.getComponent('Position');
          const distance = Math.hypot(position.x - otherPosition.x, position.y - otherPosition.y);

          if (distance < flocking.perceptionRadius) {
            // Separation
            separation.x += (position.x - otherPosition.x) / distance;
            separation.y += (position.y - otherPosition.y) / distance;

            // Alignment
            const otherVelocity = other.getComponent('Velocity');
            alignment.x += otherVelocity.speed;
            alignment.y += otherVelocity.speed;

            // Cohesion
            cohesion.x += otherPosition.x;
            cohesion.y += otherPosition.y;

            neighbors++;
          }
        }
      });

      if (neighbors > 0) {
        // Separation
        separation.x /= neighbors;
        separation.y /= neighbors;

        // Alignment
        alignment.x /= neighbors;
        alignment.y /= neighbors;

        // Cohesion
        cohesion.x /= neighbors;
        cohesion.y /= neighbors;
        cohesion.x = (cohesion.x - position.x) * flocking.cohesionWeight;
        cohesion.y = (cohesion.y - position.y) * flocking.cohesionWeight;
      }

      // Apply flocking forces
      const dx = playerPosition.x - position.x;
      const dy = playerPosition.y - position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const directionX = (dx / distance) * velocity.speed;
      const directionY = (dy / distance) * velocity.speed;

      position.x += directionX + separation.x * flocking.separationWeight + alignment.x * flocking.alignmentWeight + cohesion.x;
      position.y += directionY + separation.y * flocking.separationWeight + alignment.y * flocking.alignmentWeight + cohesion.y;

      // Check for collisions with the player
      if (
        position.x < playerPosition.x + playerSize.width &&
        position.x + entity.getComponent('Size').width > playerPosition.x &&
        position.y < playerPosition.y + playerSize.height &&
        position.y + entity.getComponent('Size').height > playerPosition.y
      ) {
        playerHealth.value -= entity.getComponent('Damage').value;
      }
    }
  });
}


function drawGrassOffscreen() {
  const grassSize = 10;

  for (let x = 0; x < offscreenCanvas.width; x += grassSize) {
    for (let y = 0; y < offscreenCanvas.height; y += grassSize) {
      offscreenCtx.fillStyle = getRandomGreen();
      offscreenCtx.fillRect(x, y, grassSize, grassSize);
    }
  }
}

// call it
drawGrassOffscreen();

function drawPausedText() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'white';
  ctx.font = '48px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
}

function drawHealthBar(entity) {
  const health = entity.getComponent('Health');
  const position = entity.getComponent('Position');
  const size = entity.getComponent('Size');

  const barWidth = 50;
  const barHeight = 10;
  const x = position.x + size.width / 2 - barWidth / 2;
  const y = position.y - 20;

  // Draw the background of the health bar
  ctx.fillStyle = 'black';
  ctx.fillRect(x, y, barWidth, barHeight);

  // Calculate the width of the health bar based on the health percentage
  const healthWidth = (health.value / 100) * barWidth;

  // Draw the health bar
  ctx.fillStyle = 'red';
  ctx.fillRect(x, y, healthWidth, barHeight);

  // Draw the health percentage text
  ctx.fillStyle = 'white';
  ctx.font = '10px Arial';
  ctx.fillText(`${health.value}%`, x + barWidth / 2 - 10, y + barHeight - 1);
}

function draw() {
  ctx.drawImage(offscreenCanvas, 0, 0);

  entities.forEach((entity) => {
    const position = entity.getComponent('Position');
    const size = entity.getComponent('Size');
    const color = entity.getComponent('Color');

    // Draw the player
    ctx.fillStyle = color.value;
    ctx.fillRect(position.x, position.y, size.width, size.height);

    
    // Draw the health bar only for the player
    if (entity === player) {
      drawHealthBar(entity);
    }

    
  });
  if (gamePaused) {
    drawPausedText();
    console.log("paused")
  }
}








// Main game loop
function gameLoop() {
  if (!gamePaused) {
    update();
    draw();

    requestAnimationFrame(gameLoop);
  } else {
    // Draw the paused text when the game is paused
    drawPausedText();
  }
}

gameLoop();
