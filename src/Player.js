class Player {
    static runSpriteSheet = new Image();
    static idleSprite = new Image();
    
    static {
        this.runSpriteSheet.src = "Sprites/MCSprite/Run.png";
        this.idleSprite.src = "Sprites/MCSprite/Idle.png";
    }

    constructor() {
        this.x = 100;
        this.y = 100;
        this.width = 80;
        this.height = 48;
        this.velocityY = 0;
        this.gravity = 0.5;
        this.jumpPower = -10;
        this.grounded = false;
        this.velocityX = 0;
        this.frameIndex = 0;
        this.frameSpeed = 4;
        this.frameCounter = 0;
        this.moving = false;
        this.jumping = false;
        this.state = "idle";
    }

    update() { 
        this.velocityX = 0;
        this.moving = false;

        // player horizontal movement
        if (keys["ArrowRight"]) {
            this.velocityX = 5;
            this.moving = true;
        }else if (keys["ArrowLeft"]) {
            this.velocityX = -5;
            this.moving = true;
        }

        this.x += this.velocityX;
        cameraX = this.x - canvas.width / 4;

        // use unit/s^2
        this.velocityY += this.gravity;
        this.y += this.velocityY;
        this.grounded = false;
        
        // TODO: find more efficient way of doing this 
        platforms.forEach(platform => {
            if (this.y + this.height > platform.y &&
                this.y + this.height - this.velocityY <= platform.y &&
                this.x + this.width > platform.x &&
                this.x < platform.x + platform.width) 
            {
                this.y = platform.y - this.height;
                this.velocityY = 0;
                this.grounded = true;
                this.jumping = false;
            }
        });

        // jump 
        if (keys["Space"] && this.grounded) {
            this.velocityY = this.jumpPower;
            this.grounded = false;
            this.jumping = true;
        }
        
        // for animation
        this.state = this.moving ? "running" : "idle";
        if (this.moving) {
            this.frameCounter++;

            if (this.frameCounter >= this.frameSpeed) {
                this.frameCounter = 0;
                this.frameIndex = (this.frameIndex + 1) % totalFrames;
            }
        
        } else {
            this.frameIndex = 0;
        }
    }

    draw() {
        if (this.state === "running") {
            ctx.drawImage(
                Player.runSpriteSheet,
                this.frameIndex * frameWidth, 0,
                frameWidth, frameHeight,
                this.x - cameraX, this.y,
                frameWidth, frameHeight
            );
        } else {
            ctx.drawImage(
                Player.idleSprite,
                0, 0,
                frameWidth, frameHeight,
                this.x - cameraX, this.y,
                frameWidth, frameHeight
            );
        }
    }
}
