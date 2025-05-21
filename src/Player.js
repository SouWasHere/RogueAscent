// Part 1: Class Definition and Static Properties
class Player {
    static animations = {
        "run": { "frames": new Image(), "fCount": 8, "frameDelay": 6 },
        "idle": { "frames": new Image(), "fCount": 1, "frameDelay": 15 },
        "ground_combo_1": { "frames": new Image(), "fCount": 8, "frameDelay": 8 },
        "ground_combo_2": { "frames": new Image(), "fCount": 10, "frameDelay": 7 },
        "ground_combo_3": { "frames": new Image(), "fCount": 14, "frameDelay": 6 },
        "jump": { "frames": new Image(), "fCount": 1, "frameDelay": 15 },
        "fall": { "frames": new Image(), "fCount": 1, "frameDelay": 15 },
        "dash": { "frames": new Image(), "fCount": 6, "frameDelay": 3 },
        "air_combo_1": { "frames": new Image(), "fCount": 6, "frameDelay": 7 },
        "air_combo_2": { "frames": new Image(), "fCount": 6, "frameDelay": 7 },
        "air_combo_3": { "frames": new Image(), "fCount": 6, "frameDelay": 7 },
        "lunging_stab": { "frames": new Image(), "fCount": 8, "frameDelay": 6 },
        "hurt": { "frames": new Image(), "fCount": 4, "frameDelay": 10 }
    };

    static {
        // Load sprites with error handling
        const basePath = "Sprites/MCSprite/";
        const spriteFiles = {
            "run": "Run.png",
            "idle": "Idle.png",
            "ground_combo_1": "GroundCombo1.png",
            "ground_combo_2": "GroundCombo2.png",
            "ground_combo_3": "GroundCombo3.png",
            "jump": "Jump.png",
            "fall": "Fall.png",
            "dash": "Dash.png",
            "air_combo_1": "AirCombo1.png",
            "air_combo_2": "AirCombo2.png",
            "air_combo_3": "AirCombo3.png",
            "lunging_stab": "LungingStab.png",
            "hurt": "Hurt.png"
        };

        // Load each sprite with error handling
        for (const [animName, fileName] of Object.entries(spriteFiles)) {
            const img = this.animations[animName].frames;
            img.onerror = () => {
                console.error(`Failed to load sprite: ${basePath}${fileName}`);
                // Set a fallback state
                this.animations[animName].frames = new Image();
                this.animations[animName].frames.src = basePath + "Idle.png"; // Fallback to idle sprite
            };
            img.onload = () => {
                console.log(`Successfully loaded sprite: ${basePath}${fileName}`);
            };
            img.src = basePath + fileName;
        }
    }

    constructor() {
        // Position and size
        this.x = 100;
        this.y = 100;
        this.width = 80;
        this.height = 48;

        // Physics
        this.velocityY = 0;
        this.velocityX = 0;
        this.gravity = 0.2;
        this.jumpPower = -10;
        this.moveSpeed = 5;
        this.airControl = 0.7;

        // State
        this.grounded = false;
        this.facingLeft = false;
        this.state = "idle";
        this.frameIndex = 0;
        this.frameCounter = 0;
        this.moving = false;
        this.phaseThrough = false;
        this.isMoveable = true;

        // Attack state
        this.isAttacking = false;
        this.attackFrameIndex = 0;
        this.attackFrameTimer = 0;
        this.attackFrameDuration = 100;
        this.wasZPressed = false; // Track if Z was pressed last frame

        // Abilities
        this.canDoubleJump = false;
        this.hasDoubleJumped = false;
        this.dashing = false;
        this.dashSpeed = 12;
        this.dashDuration = 15;
        this.dashTimer = 0;
        this.dashCooldown = 0;
        this.dashCooldownTime = 45;

        // Combat
        this.lungingStab = false;
        this.lungingStabSpeed = 8;
        this.lungingStabDuration = 25;
        this.lungingStabTimer = 0;
        this.lungingStabCooldown = 0;
        this.lungingStabCooldownTime = 300;
        this.groundComboCount = 0;
        this.groundComboTimer = 0;
        this.groundComboCooldown = 0;
        this.airComboCount = 0;
        this.airComboTimer = 0;
        this.airComboCooldown = 0;

        // Health
        this.maxHealth = 10;
this.health = this.maxHealth;
        this.invincible = false;
        this.invincibleTimer = 0;
        this.invincibleDuration = 60;
    }
}

// Part 2: Class Methods
Player.prototype.update = function(deltaTime = 1) {
    // Handle input
    this.handleInput(deltaTime);

    // Apply physics
    this.applyPhysics(deltaTime);

    // Update position
    this.x += this.velocityX * deltaTime;
    this.y += this.velocityY * deltaTime;

    // Update attack animation
    if (this.isAttacking) {
        this.attackFrameTimer += deltaTime;
        if (this.attackFrameTimer > this.attackFrameDuration) {
            this.attackFrameTimer = 0;
            this.attackFrameIndex++;

            const animData = Player.animations[this.state];
            if (this.attackFrameIndex >= animData.fCount) {
                // Attack animation finished
                this.isAttacking = false;
                this.attackFrameIndex = 0;
                this.state = this.grounded ? "idle" : (this.velocityY < 0 ? "jump" : "fall");
            }
        }
    }

    // Update state
    this.updateState();

    // Update animation
    this.updateAnimation(deltaTime);

    // Update cooldowns
    this.updateCooldowns(deltaTime);

    // Update moving state
    this.moving = Math.abs(this.velocityX) > 0.1;
};

Player.prototype.handleInput = function(deltaTime) {
    // Movement
    if (keys["ArrowRight"] && this.isMoveable) {
        this.velocityX = this.moveSpeed * (this.grounded ? 1 : this.airControl);
        this.facingLeft = false;
    } else if (keys["ArrowLeft"] && this.isMoveable) {
        this.velocityX = -this.moveSpeed * (this.grounded ? 1 : this.airControl);
        this.facingLeft = true;
    } else {
        this.velocityX = 0;
    }

    // Phase through platforms
    this.phaseThrough = keys["ArrowDown"];

    // Jumping
    if ((keys["Space"] || keys["ArrowUp"] || keys["KeyW"]) && this.grounded) {
        this.jump();
    } else if ((keys["Space"] || keys["ArrowUp"] || keys["KeyW"]) && this.canDoubleJump && !this.hasDoubleJumped) {
        this.doubleJump();
    }

    // Dashing
    if (keys["KeyX"] && this.dashCooldown <= 0 && !this.dashing && !this.lungingStab) {
        this.dash();
    }

    // Lunging Stab
    if (keys["KeyC"] && this.lungingStabCooldown <= 0 && !this.lungingStab && !this.dashing) {
        this.lunge();
    }

    // Attacking - Check for key press (not hold)
    if (keys["KeyZ"] && !this.wasZPressed) {
        this.attack();
        this.wasZPressed = true;
    } else if (!keys["KeyZ"]) {
        this.wasZPressed = false;
    }
};

Player.prototype.jump = function() {
    this.velocityY = this.jumpPower;
    this.grounded = false;
    this.canDoubleJump = true;
    this.state = "jump";
    this.frameIndex = 0;
};

Player.prototype.doubleJump = function() {
    this.velocityY = this.jumpPower * 0.8;
    this.hasDoubleJumped = true;
    this.state = "jump";
    this.frameIndex = 0;
};

Player.prototype.dash = function() {
    this.dashing = true;
    this.dashTimer = this.dashDuration;
    this.invincible = true;
    this.invincibleTimer = this.dashDuration;
    this.state = "dash";
    this.frameIndex = 0;
    this.velocityX = this.facingLeft ? -this.dashSpeed : this.dashSpeed;
    this.velocityY = 0;
    this.dashCooldown = this.dashCooldownTime;
};

Player.prototype.lunge = function() {
    this.lungingStab = true;
    this.lungingStabTimer = this.lungingStabDuration;
    this.lungingStabCooldown = this.lungingStabCooldownTime;
    this.state = "lunging_stab";
    this.frameIndex = 0;
    this.velocityX = this.facingLeft ? -this.lungingStabSpeed : this.lungingStabSpeed;
};

Player.prototype.attack = function() {
    if (this.isAttacking) return; // Prevent new attack before the current one finishes

    this.isAttacking = true;
    this.attackFrameIndex = 0;
    this.attackFrameTimer = 0;

    if (this.grounded) {
        if (this.groundComboTimer > 0) {
            this.groundComboCount++;
            this.state = this.groundComboCount === 1 ? "ground_combo_2" : "ground_combo_3";
            if (this.groundComboCount >= 2) this.groundComboCount = 0; // Reset after final combo
        } else {
            this.state = "ground_combo_1";
            this.groundComboCount = 0;
        }
        this.groundComboTimer = 30; // Combo timing window
    } else {
        if (this.airComboTimer > 0) {
            this.airComboCount++;
            this.state = this.airComboCount === 1 ? "air_combo_2" : "air_combo_3";
            if (this.airComboCount >= 2) this.airComboCount = 0;
        } else {
            this.state = "air_combo_1";
            this.airComboCount = 0;
        }
        this.airComboTimer = 20;
    }

    this.frameIndex = 0;
    this.frameCounter = 0;
};

Player.prototype.updateAnimation = function(deltaTime) {
    const animData = Player.animations[this.state];
    if (!animData) return;

    this.frameCounter += deltaTime;
    if (this.frameCounter >= animData.frameDelay) {
        this.frameCounter = 0;
        this.frameIndex++;

        if (this.isAttacking && this.frameIndex >= animData.fCount - 1) {
            this.isAttacking = false;
            this.frameIndex = 0;
            this.state = this.grounded ? "idle" : (this.velocityY < 0 ? "jump" : "fall");
        }

        if (this.frameIndex >= animData.fCount) {
            this.frameIndex = 0; // Loop back if needed
        }
    }
};
Player.prototype.applyPhysics = function(deltaTime) {
    if (!this.dashing) {
        this.velocityY += this.gravity * deltaTime;
    }
    if (this.velocityY > 15) this.velocityY = 15;
};

Player.prototype.updateState = function() {
    // Don't change state if attacking or in combo
    if (this.isAttacking || this.groundComboTimer > 0 || this.airComboTimer > 0) return;

    if (this.dashing) {
        if (this.dashTimer <= 0) {
            this.dashing = false;
            this.state = this.grounded ? "idle" : (this.velocityY < 0 ? "jump" : "fall");
        } else {
            this.state = "dash";
        }
    } else if (this.lungingStab) {
        if (this.lungingStabTimer <= 0) {
            this.lungingStab = false;
            this.state = this.grounded ? "idle" : (this.velocityY < 0 ? "jump" : "fall");
        } else {
            this.state = "lunging_stab";
        }
    } else if (!this.grounded) {
        this.state = this.velocityY < 0 ? "jump" : "fall";
    } else if (Math.abs(this.velocityX) > 0.1) {
        this.state = "run";
    } else {
        this.state = "idle";
    }
};

Player.prototype.updateAnimation = function(deltaTime) {
    const animData = Player.animations[this.state];
    if (!animData) return;

    this.frameCounter += deltaTime;
    if (this.frameCounter >= animData.frameDelay) {
        this.frameCounter = 0;
        this.frameIndex = (this.frameIndex + 1) % animData.fCount;
        
        // When attack animation completes
        if (this.isAttacking && this.frameIndex === animData.fCount - 1) {
            this.isAttacking = false;
            // Return to appropriate state
            this.state = this.grounded ? "idle" : (this.velocityY < 0 ? "jump" : "fall");
        }
    }
};

Player.prototype.updateCooldowns = function(deltaTime) {
    // Keep other cooldowns but remove attack cooldown
    if (this.dashCooldown > 0) this.dashCooldown -= deltaTime;
    if (this.dashTimer > 0) this.dashTimer -= deltaTime;
    if (this.lungingStabCooldown > 0) this.lungingStabCooldown -= deltaTime;
    if (this.lungingStabTimer > 0) this.lungingStabTimer -= deltaTime;
    
    // Keep these for combo system
    if (this.groundComboTimer > 0) this.groundComboTimer -= deltaTime;
    if (this.airComboTimer > 0) this.airComboTimer -= deltaTime;
    
    if (this.invincibleTimer > 0) {
        this.invincibleTimer -= deltaTime;
    } else {
        this.invincible = false;
    }
};

Player.prototype.draw = function(ctx) {
    const animData = Player.animations[this.state];
    const drawX = Math.floor(this.x - cameraX);
    const drawY = Math.floor(this.y - cameraY);

    // Check if image is loaded and valid
    const imageReady = animData?.frames?.complete && animData.frames.naturalWidth > 0;

    try {
        if (!imageReady) {
            console.warn(`Animation frame not ready for state: ${this.state} — drawing fallback box.`);
            ctx.fillStyle = "red";
            ctx.fillRect(drawX, drawY, this.width, this.height);
            ctx.strokeStyle = "white";
            ctx.strokeRect(drawX, drawY, this.width, this.height);
            return;
        }

        const frameIndex = Math.min(this.frameIndex, animData.fCount - 1);
        const srcX = frameIndex * this.width;

        if (this.invincible) {
            ctx.globalAlpha = Math.sin(Date.now() / 50) * 0.5 + 0.5;
        }

        if (this.facingLeft) {
            ctx.save();
            ctx.translate(drawX + this.width, drawY);
            ctx.scale(-1, 1);
            ctx.drawImage(
                animData.frames,
                srcX, 0, this.width, this.height,
                0, 0, this.width, this.height
            );
            ctx.restore();
        } else {
            ctx.drawImage(
                animData.frames,
                srcX, 0, this.width, this.height,
                drawX, drawY, this.width, this.height
            );
        }

        ctx.globalAlpha = 1.0;

        if (DEBUG_MODE) {
            ctx.strokeStyle = "red";
            ctx.lineWidth = 1;
            ctx.strokeRect(drawX, drawY, this.width, this.height);
        }

    } catch (error) {
        console.error('Error drawing player:', error);
        ctx.fillStyle = 'red';
        ctx.fillRect(drawX, drawY, this.width, this.height);
    }
};

Player.prototype.takeDamage = function(amount = 1) {
    if (this.invincible) return false;

    this.health -= amount;
    if (this.health < 0) this.health = 0;

    this.invincible = true;
    this.invincibleTimer = this.invincibleDuration;
    this.state = "hurt";
    this.frameIndex = 0;

    this.velocityX = this.facingLeft ? 5 : -5;
    this.velocityY = -5;

    return this.health <= 0;
};

Player.prototype.resetPosition = function() {
    this.x = 100;
    this.y = 100;
    this.velocityX = 0;
    this.velocityY = 0;
    this.grounded = false;
    this.state = "idle";
    this.frameIndex = 0;
    this.health = this.maxHealth;
    this.invincible = false;
    this.invincibleTimer = 0;
}; 