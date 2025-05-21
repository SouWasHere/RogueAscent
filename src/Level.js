class Level {
    constructor(jsonData) {
        this.id = jsonData.id || "unknown";
        this.name = jsonData.name || "Unnamed Level";
        this.description = jsonData.description || "";
        this.tileSize = jsonData.tileSize || 16;
        this.mapWidth = jsonData.mapWidth || 30;
        this.mapHeight = jsonData.mapHeight || 20;
        this.layers = jsonData.layers || [];
        this.spriteSheets = jsonData.spriteSheets || {};
        this.canvasWidth = jsonData.canvasWidth || 800;
        this.canvasHeight = jsonData.canvasHeight || 600;
	this.collectibles = jsonData.collectibles || [];


        // Level elements
        this.platforms = [];
        this.hazards = [];
        this.checkpoints = jsonData.checkpoints || [];
        this.spawn = jsonData.spawn || { x: 0, y: 0 };
        this.exit = jsonData.exit || null;
        this.enemies = jsonData.enemies || [
            {
                id: "test_enemy",
                x: 100,
                y: 200,
                width: 32,
                height: 32,
                type: "slime",
                animationState: "idle"
            }
        ];
        this.collectibles = jsonData.collectibles || [];
	// Boss setup
this.boss = {
   x: 500,
    y: 100,
    radius: 60,
    health: 100,
    maxHealth: 100,
    damage: 2,
    active: true,
    defeated: false,
    nameShown: true,
    nameTimer: 180,
    fadeAlpha: 0
};


        // Background
        this.backgroundImage = null;
        this.parallaxFactor = 0.5;
        this.backgroundColor = jsonData.backgroundColor || "#1a1a2e";

        // Load assets
        this.loadBackgroundImage(jsonData.id);
        this.parseElements();
        
        // Debug logging
        console.log('Level initialized:', {
            id: this.id,
            name: this.name,
            tileSize: this.tileSize,
            layers: this.layers.length,
            platforms: this.platforms.length,
            hazards: this.hazards.length,
            checkpoints: this.checkpoints.length,
            enemies: this.enemies.length
        });
    }

    loadBackgroundImage(levelId) {
        if (!levelId) return;

        const img = new Image();
        const levelName = levelId.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join('_');

        const possiblePaths = [
            `Level/test/Tutorial_Project/${levelId}.webp`,
            `Level/test/Tutorial_Project/${levelId}.webp`,
            `Level/test/Tutorial_Project/${levelName}.jpeg`,
            `Level/test/Tutorial_Project/${levelName}.png`,
            `Level/test/Tutorial_Project/map.webp`,
            `Level/test/Tutorial_Project/map.png`
        ];

        let pathIndex = 0;
        const tryLoadImage = () => {
            if (pathIndex >= possiblePaths.length) {
                console.warn(`Could not load background for level: ${levelId}`);
                return;
            }

            img.src = possiblePaths[pathIndex];
            console.log(`Trying to load background: ${possiblePaths[pathIndex]}`);

            img.onerror = () => {
                console.log(`Failed to load: ${possiblePaths[pathIndex]}`);
                pathIndex++;
                tryLoadImage();
            };
        };

        img.onload = () => {
            this.backgroundImage = img;
            console.log(`Loaded background: ${img.src}`);
        };

        tryLoadImage();
    }

    parseElements() {
        console.log('Parsing level elements...');
        for (const layer of this.layers) {
            if (!layer.tiles || !Array.isArray(layer.tiles)) {
                console.log('Skipping layer - no tiles array:', layer);
                continue;
            }

            const layerName = layer.name ? layer.name.toLowerCase() : "";
            console.log('Processing layer:', { name: layerName, collider: layer.collider, tileCount: layer.tiles.length });

            if (layerName.includes("hazard")) {
                this.parseHazards(layer);
            } else if (layer.collider || layerName.includes("ground") || layerName.includes("platform")) {
                this.parsePlatforms(layer);
            }
        }
        console.log('Finished parsing elements. Platforms:', this.platforms.length, 'Hazards:', this.hazards.length);
    }

    parsePlatforms(layer) {
        console.log('Parsing platforms from layer:', layer.name);
        
        // Group consecutive tiles into longer platforms
        const tileGroups = [];
        let currentGroup = null;

        // Sort tiles by y position first, then x position
        const sortedTiles = [...layer.tiles].sort((a, b) => {
            if (a.y !== b.y) return a.y - b.y;
            return a.x - b.x;
        });

        for (const tile of sortedTiles) {
            if (!currentGroup || 
                currentGroup.y !== tile.y || 
                currentGroup.endX + 1 !== tile.x) {
                // Start new group
                currentGroup = {
                    x: tile.x,
                    y: tile.y,
                    endX: tile.x
                };
                tileGroups.push(currentGroup);
            } else {
                // Extend current group
                currentGroup.endX = tile.x;
            }
        }

        // Convert groups to platforms
        for (const group of tileGroups) {
            const platform = {
                id: "platform",
                x: group.x * this.tileSize,
                y: group.y * this.tileSize,
                width: (group.endX - group.x + 1) * this.tileSize,
                height: this.tileSize,
                type: "normal"
            };
            
            this.platforms.push(platform);
            console.log('Added platform:', platform);
        }
    }

    parseHazards(layer) {
        console.log('Parsing hazards from layer:', layer.name);
        for (const tile of layer.tiles) {
            const hazard = {
                id: tile.id || "hazard",
                x: tile.x * this.tileSize,
                y: tile.y * this.tileSize,
                width: this.tileSize,
                height: this.tileSize,
                damage: 1, // Increased damage
                type: "spike"
            };
            this.hazards.push(hazard);
            console.log('Added hazard:', hazard);
        }
    }

    draw(ctx, cameraX, cameraY) {
        // Draw background
        this.drawBackground(ctx, cameraX, cameraY);

        // Draw level elements
        this.drawPlatforms(ctx, cameraX, cameraY);
        
        this.drawCheckpoints(ctx, cameraX, cameraY);
	this.drawHazards(ctx, cameraX, cameraY);
        this.drawExit(ctx, cameraX, cameraY);
        this.drawEnemies(ctx, cameraX, cameraY);
    }

    drawBackground(ctx, cameraX, cameraY) {
        // Solid background
        ctx.fillStyle = this.backgroundColor;
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

        // Background image
        if (this.backgroundImage?.complete) {
            try {
                const bgX = -cameraX * this.parallaxFactor % this.backgroundImage.width;
                const bgY = -cameraY * (this.parallaxFactor * 0.3);

               // Stretch background to fill canvas
ctx.drawImage(
    this.backgroundImage,
    0, 0,
    this.canvasWidth,
    this.canvasHeight
);

            } catch (e) {
                console.error("Error drawing background:", e);
            }
        }
    }

    drawPlatforms(ctx, cameraX, cameraY) {
    console.log('Drawing cloud platforms. Count:', this.platforms.length, 'Camera:', { x: cameraX, y: cameraY });
    for (const platform of this.platforms) {
        const x = Math.floor(platform.x - cameraX);
        const y = Math.floor(platform.y - cameraY);
        const width = platform.width;
        const height = platform.height;


        // Cloud style
        ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
        ctx.strokeStyle = "rgba(200, 200, 255, 0.6)";
        ctx.lineWidth = 2;

        // Draw puffy cloud shape using multiple arcs
        ctx.beginPath();
        const puffCount = Math.max(2, Math.floor(width / 40));
        const puffRadius = height * 0.8;
        const step = width / puffCount;

        for (let i = 0; i < puffCount; i++) {
            const cx = x + i * step + step / 2;
            const cy = y + height / 2;
            ctx.moveTo(cx + puffRadius, cy);
            ctx.arc(cx, cy, puffRadius, 0, Math.PI * 2);
        }

        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
}
drawHazards(ctx, cameraX, cameraY) {
    for (const hazard of this.hazards) {
        const x = Math.floor(hazard.x - cameraX);
        const y = Math.floor(hazard.y - cameraY);

        ctx.fillStyle = "rgba(255, 50, 50, 0.8)";
        ctx.strokeStyle = "red";
        ctx.lineWidth = 1;

        ctx.fillRect(x, y, hazard.width, hazard.height);
        ctx.strokeRect(x, y, hazard.width, hazard.height);
    }
}

    drawCheckpoints(ctx, cameraX, cameraY) {
        for (const checkpoint of this.checkpoints) {
            const x = Math.floor(checkpoint.x * this.tileSize - cameraX);
            const y = Math.floor(checkpoint.y * this.tileSize - cameraY);
            const size = this.tileSize;

            // Checkpoint base
            ctx.fillStyle = "rgba(60, 255, 60, 0.7)";
            ctx.strokeStyle = "#2ECC71";
            ctx.lineWidth = 2;

            // Draw checkpoint platform
            ctx.beginPath();
            ctx.roundRect(x, y, size, size, 4);
            ctx.fill();
            ctx.stroke();
        }
    }

    drawExit(ctx, cameraX, cameraY) {
        if (!this.exit) return;

        const x = Math.floor(this.exit.x * this.tileSize - cameraX);
        const y = Math.floor(this.exit.y * this.tileSize - cameraY);
        const size = this.tileSize;

        // Exit portal effect
        ctx.save();
        ctx.globalAlpha = 0.8;

        // Portal gradient
        const gradient = ctx.createRadialGradient(
            x + size/2, y + size/2, 0,
            x + size/2, y + size/2, size
        );
        gradient.addColorStop(0, "rgba(100, 100, 255, 0.9)");
        gradient.addColorStop(1, "rgba(50, 50, 200, 0.3)");

        // Draw portal
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
        ctx.fill();

        // Portal ring
        ctx.strokeStyle = "#4444FF";
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.restore();
    }

    drawEnemies(ctx, cameraX, cameraY) {
        for (const enemy of this.enemies) {
            const x = Math.floor(enemy.x - cameraX);
            const y = Math.floor(enemy.y - cameraY);

            // Draw enemy hitbox
            ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
            ctx.fillRect(x, y, enemy.width, enemy.height);

            // Draw enemy type label
            ctx.fillStyle = "white";
            ctx.font = "12px Arial";
            ctx.fillText(enemy.type, x, y - 5);

            // Draw animation state
            ctx.fillText(enemy.animationState, x, y + enemy.height + 15);
        }
    }
drawBoss(ctx, cameraX, cameraY) {
    if (!this.boss?.active) return;

    const x = Math.floor(this.boss.x - cameraX);
    const y = Math.floor(this.boss.y - cameraY);

    // Draw boss
    ctx.fillStyle = this.boss.color;
    ctx.fillRect(x, y, this.boss.width, this.boss.height);

    // Draw boss health bar
    const barWidth = 200;
    const barX = (this.canvasWidth - barWidth) / 2;
    const barY = 30;
    const hpRatio = this.boss.health / this.boss.maxHealth;

    ctx.fillStyle = "black";
    ctx.fillRect(barX - 2, barY - 2, barWidth + 4, 24);

    ctx.fillStyle = "red";
    ctx.fillRect(barX, barY, barWidth * hpRatio, 20);

    ctx.strokeStyle = "white";
    ctx.strokeRect(barX, barY, barWidth, 20);
}
drawSunBoss(ctx, cameraX, cameraY) {
    const boss = this.boss;
    if (!boss?.active && !boss.defeated) return;

    const x = Math.floor(boss.x - cameraX);
    const y = Math.floor(boss.y - cameraY);

    // Draw radiant sun
    const gradient = ctx.createRadialGradient(x, y, 10, x, y, boss.radius);
    gradient.addColorStop(0, "yellow");
    gradient.addColorStop(1, "orange");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, boss.radius, 0, Math.PI * 2);
    ctx.fill();

    // Boss name display
    if (boss.nameShown && boss.nameTimer > 0) {
        const alpha = Math.min(1, boss.nameTimer / 60);
        ctx.globalAlpha = alpha;

        ctx.fillStyle = "#ffcc00";
        ctx.font = "20px Arial";
        ctx.textAlign = "center";
        ctx.fillText("☀️ Solarion, The Burning Wrath", this.canvasWidth / 2, 80);

        ctx.globalAlpha = 1.0;
        boss.nameTimer--;
        if (boss.nameTimer <= 0) boss.nameShown = false;
    }

    // Boss health bar
    if (!boss.defeated) {
        const barWidth = 300;
        const barX = (this.canvasWidth - barWidth) / 2;
        const barY = 30;
        const hpRatio = boss.health / boss.maxHealth;

        ctx.fillStyle = "black";
        ctx.fillRect(barX - 2, barY - 2, barWidth + 4, 24);

        ctx.fillStyle = "red";
        ctx.fillRect(barX, barY, barWidth * hpRatio, 20);

        ctx.strokeStyle = "white";
        ctx.strokeRect(barX, barY, barWidth, 20);
    }

    // Win animation (sun shrink and fade)
    if (boss.defeated) {
        if (boss.radius > 0) boss.radius -= 0.5;
        if (boss.fadeAlpha < 1) boss.fadeAlpha += 0.01;

        ctx.fillStyle = `rgba(255,255,255,${boss.fadeAlpha})`;
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    }
}

    checkPlatformCollision(player) {
        let isGrounded = false;
        let wasGrounded = player.grounded; // Store previous grounded state

        for (const platform of this.platforms) {
            const playerRight = player.x + player.width;
            const playerBottom = player.y + player.height;
            const platformRight = platform.x + platform.width;
            const platformBottom = platform.y + platform.height;

            // Check if player is within platform bounds
            if (playerRight > platform.x &&
                player.x < platformRight &&
                playerBottom > platform.y &&
                player.y < platformBottom) {

                // Calculate overlap on each side
                const bottomOverlap = platform.y - (player.y + player.height);
                const topOverlap = player.y - platformBottom;
                const rightOverlap = platform.x - (player.x + player.width);
                const leftOverlap = player.x - platformRight;

                // Determine collision side based on velocity and overlap
                if (player.velocityY >= 0 && bottomOverlap > -10 && bottomOverlap < 0) {
                    // Top collision (landing)
                    player.y = platform.y - player.height;
                    player.velocityY = 0;
                    isGrounded = true;
                    player.grounded = true;
                    player.isMoveable = true; // Ensure movement is enabled when landing
                    
                    // If we just landed, reset horizontal velocity to prevent sliding
                    if (!wasGrounded) {
                        player.velocityX = 0;
                    }
                } else if (player.velocityY <= 0 && topOverlap > -10 && topOverlap < 0) {
                    // Bottom collision (hitting head)
                    player.y = platformBottom;
                    player.velocityY = 0;
                } else if (player.velocityX >= 0 && rightOverlap > -10 && rightOverlap < 0) {
                    // Left collision
                    player.x = platform.x - player.width;
                    player.velocityX = 0;
                } else if (player.velocityX <= 0 && leftOverlap > -10 && leftOverlap < 0) {
                    // Right collision
                    player.x = platformRight;
                    player.velocityX = 0;
                }

                // Allow passing through platforms from below when pressing down
                if (player.phaseThrough && player.velocityY > 0) {
                    isGrounded = false;
                    player.grounded = false;
                    continue;
                }
            }
        }

        // Only clear grounded state if we're not grounded and moving upward
        if (!isGrounded && player.velocityY < 0) {
            player.grounded = false;
        }

        // Apply friction when grounded to prevent sliding
        if (player.grounded && Math.abs(player.velocityX) < 0.1) {
            player.velocityX = 0;
        }

        // Update player state based on grounded status
        if (player.grounded) {
            player.state = player.moving ? "run" : "idle";
            player.jumping = false;
            player.falling = false;
            player.isMoveable = true; // Ensure movement is enabled when grounded
        }

        return isGrounded;
    }

    checkHazardCollision(player) {
        for (const hazard of this.hazards) {
            if (player.x + player.width > hazard.x &&
                player.x < hazard.x + hazard.width &&
                player.y + player.height > hazard.y &&
                player.y < hazard.y + hazard.height) {
                
                console.log('Hazard collision detected:', hazard);
                
                // Apply damage and knockback
                player.takeDamage(hazard.damage);
                player.velocityY = -5; // Knockback
                player.velocityX = player.x < hazard.x ? -3 : 3; // Knockback direction
                
                return hazard.damage;
            }
        }
        return 0;
    }
}
