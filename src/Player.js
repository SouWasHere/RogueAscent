class Player {
    // dictionary of character animations
    // 
    // NOTE: 
    // - use snake casing
    // - specify exact frame count (fCount)
    //
    // WARNING:
    // - might cause huge memory usage
    static animations = {
        "run": { "frames": new Image(), "fCount": 8 }, 
        "idle": { "frames": new Image(), "fCount": 1 }, 
        "ground_combo_1": { "frames": new Image(), "fCount": 8 }, 
        "ground_combo_2": { "frames": new Image(), "fCount": 10 }, 
    };
   
    static {

        // part where the images or sprite sheets are loaded
        this.animations["run"]["frames"].src = "Sprites/MCSprite/Run.png";
        this.animations["idle"]["frames"].src = "Sprites/MCSprite/Idle.png";
        this.animations["ground_combo_1"]["frames"].src = "Sprites/MCSprite/GroundCombo1.png";
        this.animations["ground_combo_2"]["frames"].src = "Sprites/MCSprite/GroundCombo2.png";
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
        
        // NOTE: 
        // - values that are set to this var at runtime should be specific
        //   and is a valid key to animations(dictionary)
        this.state = "idle";

        // temporary variables
        this.waitAnim = false;
        this.isMoveable = true;
    }

    update() { 
        this.velocityX = 0;
        this.moving = false;
         
        // player horizontal movement
        // 
        // NOTE: 
        //  - we want to stop the player from moving when doing an action
        //
        // BUG:
        //  - player sprite doesn't face the correct direction
        if (keys["ArrowRight"] && this.isMoveable) {
            this.velocityX = 5;
            this.moving = true;
        }else if (keys["ArrowLeft"] && this.isMoveable) {
            this.velocityX = -5;
            this.moving = true;
        }

        this.x += this.velocityX;
        cameraX = this.x - canvas.width / 4;

        // TODO: use unit/s^2
        //
        // this only applies a constant value to the velocity 
        // gravity should be applied as a acceleration
        this.velocityY += this.gravity;
        this.y += this.velocityY;
        
        this.grounded = false;
        
        // TODO: find more efficient way of doing this
        //
        // WARNING:
        //  - inefficient way to determine if the player is grounded
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
        }else if (keys["KeyJ"] ) {

            // TODO: find a different approach
            // - could be having a state component
            // - each state component has its own process for animation
            // - each state component has its own process for when certain variables are changed
            
            // BUG: 
            // when holding key down animation gets spammed
            // 
            // should find a way to check for combo key presses
            if (this.state == "ground_combo_1"){
                this.state = "ground_combo_2";
                this.frameIndex = 0;
            } else {
                this.state = "ground_combo_1";
            }

            this.waitAnim = true;
            this.isMoveable = false;
        }
          
        // TODO: create a way for stopping the player from moving and wait for the current action to finish,
        //       action should only be disturb if the player has been hit or interrupted by external forces
        //
        // temporary solution
        if (!this.waitAnim)
        {
            this.state = this.moving ? "run" : "idle";
            this.isMoveable = true;
        }
    }

    draw() {
        
        // get from dictionary using state as key
        // dictionary should contain:
        // - amount of frames
        // - image
        
        this.frameCounter++

        if (this.frameCounter >= this.frameSpeed) {
            this.frameIndex++;
            this.frameCounter = 0;
        } 

        // temporary solution
        if (this.frameIndex >= Player.animations[this.state]["fCount"])
        {
            this.frameIndex = 0;
            this.waitAnim = false;
        }

        ctx.drawImage(
            Player.animations[this.state]["frames"],
            this.frameIndex * frameWidth, 0,
            frameWidth, frameHeight,
            this.x - cameraX, this.y,
            frameWidth, frameHeight
        );
    }
}
