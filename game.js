const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Create an object to store the state of each key
const keys = {
  w: false,
  a: false,
  s: false,
  d: false
};

// Update the 'keys' object when a key is pressed or released
document.addEventListener("keydown", event => {
  if (keys.hasOwnProperty(event.key)) {
    event.preventDefault();
    keys[event.key] = true;
  }
});

document.addEventListener("keyup", event => {
  if (keys.hasOwnProperty(event.key)) {
    event.preventDefault();
    keys[event.key] = false;
  }
});

// Update the player's position based on the pressed keys
function handlePlayerMovement(player, speed) {
  if (keys.w) {
    player.y -= speed;
  }
  if (keys.a) {
    player.x -= speed;
  }
  if (keys.s) {
    player.y += speed;
  }
  if (keys.d) {
    player.x += speed;
  }
}


class Forest {
    constructor(mapSize, minTreeSize, maxTreeSize, treeSpacing, playerStart, playerX, playerY) {
  
      this.mapSize = mapSize;
      this.minTreeSize = minTreeSize;
      this.maxTreeSize = maxTreeSize;
      this.treeSpacing = treeSpacing;
      this.playerStart = playerStart;
      this.playerX = playerX;
        this.playerY = playerY;
      this.trees = this.generateTrees();
    }
    distanceToPoint(x1, y1, x2, y2) {
        const dx = x1 - x2;
        const dy = y1 - y2;
        return Math.sqrt(dx * dx + dy * dy);
      }
      generateTrees() {
        const treeShades = [
          "#228B22", "#008000", "#006400", "#32CD32", "#3CB371", "#2E8B57"
        ];
      
        const trees = [];
        for (let x = 0; x < this.mapSize; x += this.treeSpacing) {
          for (let y = 0; y < this.mapSize; y += this.treeSpacing) {
            const size = Math.floor(Math.random() * (this.maxTreeSize - this.minTreeSize + 1)) + this.minTreeSize;
            const color = treeShades[Math.floor(Math.random() * treeShades.length)];
      
            /// Check if the position is close to the player's starting position and current position
const distanceToStart = this.distanceToPoint(x, y, this.playerStart.x, this.playerStart.y);
const distanceToCurrent = this.distanceToPoint(x, y, this.playerX, this.playerY);

      
            // Randomly decide if a tree will be placed at this position and not too close to the player's starting position
            const safeDistance = 100
            if (Math.random() < 0.5 && distanceToStart > safeDistance && distanceToCurrent > safeDistance) {
              trees.push({ x, y, size, color, collided: false });
            }
          }
        }
        return trees;
      }
      


    draw(playerX, playerY) {
        this.trees.forEach(tree => {
        ctx.fillStyle = tree.color;
        ctx.fillRect(tree.x - playerX + canvas.width / 2, tree.y - playerY + canvas.height / 2, tree.size, tree.size);
        });
    }
  

  drawFence() {
    const fenceWidth = 4;
    ctx.fillStyle = "#8B4513";
    ctx.fillRect(0, 0, this.mapSize, fenceWidth); // top
    ctx.fillRect(0, 0, fenceWidth, this.mapSize); // left
    ctx.fillRect(0, this.mapSize - fenceWidth, this.mapSize, fenceWidth); // bottom
    ctx.fillRect(this.mapSize - fenceWidth, 0, fenceWidth, this.mapSize); // right
  }
}

class Player {
    constructor(x, y, size) {
      this.x = x;
      this.y = y;
      this.size = size;
      this.health = 100;
      this.rotation = 0;
    }
  
    rotate(mouseX, mouseY) {
      const dx = mouseX - canvas.width / 2;
      const dy = mouseY - canvas.height / 2;
      this.rotation = Math.atan2(dy, dx);
    }
  
    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
  
      // Draw head
      ctx.fillStyle = "#FFA07A";
      ctx.fillRect(-this.size / 4, -this.size / 4, this.size / 2, this.size / 2);
  
      // Draw shoulders
      ctx.fillStyle = "#808080";
      ctx.fillRect(-this.size / 2, 0, this.size, this.size / 2);
  
      // Draw feet
      ctx.fillStyle = "#000000";
      ctx.fillRect(-this.size / 2, this.size / 2, this.size / 2, this.size / 4);
      ctx.fillRect(0, this.size / 2, this.size / 2, this.size / 4);
  
      // Draw flashlight
      ctx.fillStyle = "#D3D3D3";
      ctx.fillRect(this.size / 4, -this.size / 8, this.size / 2, this.size / 4);
  
      ctx.restore();
    }
  
    checkCollision(tree, playerX, playerY) {
      const dx = tree.x - playerX + canvas.width / 2 + tree.size / 2 - (this.x);
      const dy = tree.y - playerY + canvas.height / 2 + tree.size / 2 - (this.y);
      const distance = Math.sqrt(dx * dx + dy * dy);
      const minDistance = (tree.size + this.size) / 2;
    
      return distance < minDistance;
    }
    

    collideWithTree(tree) {
        if (!tree.collided) {
            this.health -= tree.size / 10;
            tree.collided = true;
        }
    }
  }
  
  class UI {
    static drawHealthBar(player) {
      const x = 20;
      const y = 20;
      const width = 200;
      const height = 20;
  
      ctx.fillStyle = "#000000";
      ctx.fillRect(x, y, width, height);
  
      ctx.fillStyle = "#FF0000";
      ctx.fillRect(x, y, width * (player.health / 100), height);
  
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "14px Arial";
      ctx.fillText(`${player.health}/100`, x + width / 2 - 20, y + 14);
    }
  
    static drawGameOver() {
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "48px Arial";
      ctx.fillText("GAME OVER", canvas.width / 2 - 100, canvas.height / 2);
    }
  }

// overlay
let overlayOpacity = 0;

function showOverlay() {
  overlayOpacity = 0.3;
  setTimeout(() => {
    overlayOpacity = 0;
  }, 500);
}

const playerStart = { x: canvas.width / 2, y: canvas.height / 2 };

const player = new Player(playerStart.x, playerStart.y, 30);
const forest = new Forest(1000, 30, 60, 40, playerStart, playerStart.x, playerStart.y);

let mouseX = 0;
let mouseY = 0;

canvas.addEventListener("mousemove", event => {
  mouseX = event.clientX - canvas.offsetLeft;
  mouseY = event.clientY - canvas.offsetTop;
});

document.addEventListener("keydown", event => {
  if (event.key === "w" || event.key === "a" || event.key === "s" || event.key === "d") {
    event.preventDefault();
  }
});

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  handlePlayerMovement(player, 2); // Adjust '2' to change the movement speed
  ctx.save();
  ctx.translate(canvas.width / 2 - player.x, canvas.height / 2 - player.y);

  forest.draw(player.x, player.y);
  forest.drawFence();
  player.draw();

  ctx.restore();

  player.rotate(mouseX, mouseY);
  if (overlayOpacity > 0) {
    ctx.fillStyle = `rgba(255, 0, 0, ${overlayOpacity})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  
  // Check tree collisions
  for (const tree of forest.trees) {
    if (player.checkCollision(tree, player.x, player.y)) {
      player.collideWithTree(tree);
      showOverlay();
    } else {
      tree.collided = false;
    }
  }
  
  
  

  UI.drawHealthBar(player);

  if (player.health <= 0) {
    UI.drawGameOver();
  } else {
    requestAnimationFrame(gameLoop);
  }
}

gameLoop();
