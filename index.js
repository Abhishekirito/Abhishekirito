import { createCanvas } from 'canvas';
import GIFEncoder from 'gifencoder';
import fs from 'fs';

// 1. Setup Canvas & Encoder
const width = 850; 
const height = 180;
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

const encoder = new GIFEncoder(width, height);
encoder.createReadStream().pipe(fs.createWriteStream('contribution-game.gif'));

encoder.start();
encoder.setRepeat(0);   
encoder.setDelay(50);   
encoder.setQuality(10); 

// 2. Game Config
const CONFIG = {
    cols: 53,
    rows: 7,
    size: 10,
    gap: 3,
    colors: ['#0e4429', '#006d32', '#26a641', '#39d353'], 
    shipColor: '#58a6ff',
    laserColor: '#f78166',
    shipSpeed: 6 
};

// 3. Initialize "Mid-Game" Grid
let grid = [];
for (let r = 0; r < CONFIG.rows; r++) {
    for (let c = 0; c < CONFIG.cols; c++) {
        // 70% destroyed state for realism
        let survivalChance = 0.3 + (r * 0.05); 
        
        if (Math.random() < survivalChance) { 
            grid.push({
                x: c * (CONFIG.size + CONFIG.gap) + 20,
                y: r * (CONFIG.size + CONFIG.gap) + 40,
                color: CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)],
                active: true
            });
        }
    }
}

// 4. Game State
let ship = { x: 400, y: height - 20 };
let bullets = [];
let particles = []; // New: Array to hold broken pieces
let targetX = 400; 

// Helper: Create Debris
function createExplosion(x, y, color) {
    // Create 6 small pieces per brick
    for(let i=0; i<6; i++) {
        particles.push({
            x: x + 5, // Start at center of brick
            y: y + 5,
            vx: (Math.random() - 0.5) * 6, // Explode horizontally
            vy: (Math.random() - 1) * 4,   // Explode up slightly first
            color: color,
            size: Math.random() * 3 + 2    // Random chunk sizes
        });
    }
}

// Helper: AI Targeting
function pickNewTarget() {
    const activeBricks = grid.filter(b => b.active);
    if (activeBricks.length > 0) {
        const randomBrick = activeBricks[Math.floor(Math.random() * activeBricks.length)];
        return randomBrick.x;
    }
    return width / 2;
}
targetX = pickNewTarget();

// 5. Animation Loop
const TOTAL_FRAMES = 120; // Slightly longer to let pieces fall

for (let frame = 0; frame < TOTAL_FRAMES; frame++) {
    
    // --- MOVEMENT LOGIC ---

    // Human-like Pilot
    if (Math.abs(ship.x - targetX) > CONFIG.shipSpeed) {
        if (ship.x < targetX) ship.x += CONFIG.shipSpeed;
        else ship.x -= CONFIG.shipSpeed;
    } else {
        if (Math.random() > 0.8) targetX = pickNewTarget();
    }
    
    // Random target switch
    if (frame % 20 === 0 && Math.random() > 0.5) targetX = pickNewTarget();

    // Shoot
    if (frame % 5 === 0) bullets.push({ x: ship.x, y: ship.y });

    // Update Bullets
    bullets.forEach((b, index) => {
        b.y -= 12; 
        
        // Collision Check
        for (let g of grid) {
            if (g.active && 
                b.x >= g.x - 2 && b.x <= g.x + CONFIG.size + 2 &&
                b.y <= g.y + CONFIG.size && b.y >= g.y) {
                
                g.active = false; // Destroy brick
                createExplosion(g.x, g.y, g.color); // Trigger Explosion!
                bullets.splice(index, 1); // Remove bullet
                
                if (Math.random() > 0.6) targetX = pickNewTarget();
                break;
            }
        }
    });
    bullets = bullets.filter(b => b.y > 0);

    // Update Particles (Gravity)
    particles.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.8; // Gravity: Makes them fall faster over time
        
        // Remove if off screen
        if (p.y > height) particles.splice(index, 1);
    });

    // --- DRAW LOGIC ---
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, width, height);

    // Draw Grid
    grid.forEach(g => {
        if (g.active) {
            ctx.fillStyle = g.color;
            ctx.fillRect(g.x, g.y, CONFIG.size, CONFIG.size);
        } else {
            ctx.fillStyle = '#161b22'; // Empty slot
            ctx.fillRect(g.x, g.y, CONFIG.size, CONFIG.size);
        }
    });

    // Draw Particles (The falling debris)
    particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
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

    encoder.addFrame(ctx);
}

encoder.finish();
console.log("GIF Generated with Physics!");
