import { createCanvas } from 'canvas';
import GIFEncoder from 'gifencoder';
import fs from 'fs';

// 1. Setup Canvas & Encoder
const width = 850; // Standard GitHub graph width
const height = 180;
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

const encoder = new GIFEncoder(width, height);
encoder.createReadStream().pipe(fs.createWriteStream('contribution-game.gif'));

encoder.start();
encoder.setRepeat(0);   // 0 for repeat, -1 for no-repeat
encoder.setDelay(50);   // Frame delay in ms
encoder.setQuality(10); // Image quality

// 2. Game Config & State
const CONFIG = {
    cols: 53,
    rows: 7,
    size: 10,
    gap: 3,
    colors: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'],
    shipColor: '#58a6ff',
    laserColor: '#f78166'
};

// Generate Mock Grid (In a real version, you'd fetch real GitHub data here)
let grid = [];
for (let r = 0; r < CONFIG.rows; r++) {
    for (let c = 0; c < CONFIG.cols; c++) {
        if (Math.random() > 0.4) {
            grid.push({
                x: c * (CONFIG.size + CONFIG.gap) + 20,
                y: r * (CONFIG.size + CONFIG.gap) + 40,
                color: CONFIG.colors[Math.floor(Math.random() * 4) + 1],
                active: true
            });
        }
    }
}

let ship = { x: 50, y: height - 20, dx: 15 };
let bullets = [];

// 3. Animation Loop
const TOTAL_FRAMES = 80; // Duration of the GIF

for (let frame = 0; frame < TOTAL_FRAMES; frame++) {
    // --- UPDATE LOGIC ---
    
    // Move Ship
    ship.x += ship.dx;
    if (ship.x > width - 20 || ship.x < 20) ship.dx *= -1;

    // Shoot
    if (frame % 3 === 0) {
        bullets.push({ x: ship.x, y: ship.y });
    }

    // Move Bullets & Collision
    bullets.forEach((b, index) => {
        b.y -= 10;
        
        // Collision
        for (let g of grid) {
            if (g.active && b.x >= g.x && b.x <= g.x + CONFIG.size && b.y <= g.y + CONFIG.size && b.y >= g.y) {
                g.active = false;
                g.color = '#161b22'; // Turn "off"
                bullets.splice(index, 1);
                break;
            }
        }
    });

    // --- DRAW LOGIC ---
    ctx.fillStyle = '#0d1117'; // GitHub Dark BG
    ctx.fillRect(0, 0, width, height);

    // Draw Grid
    grid.forEach(g => {
        ctx.fillStyle = g.active ? g.color : '#161b22';
        ctx.fillRect(g.x, g.y, CONFIG.size, CONFIG.size);
    });

    // Draw Ship
    ctx.fillStyle = CONFIG.shipColor;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y);
    ctx.lineTo(ship.x - 8, ship.y + 15);
    ctx.lineTo(ship.x + 8, ship.y + 15);
    ctx.fill();

    // Draw Bullets
    ctx.fillStyle = CONFIG.laserColor;
    bullets.forEach(b => ctx.fillRect(b.x - 2, b.y, 4, 8));

    // Add frame to GIF
    encoder.addFrame(ctx);
}

encoder.finish();
console.log("GIF Generated!");
