class Level {
    constructor(jsonData) {
        this.name = jsonData.name;
        this.tileSize = jsonData.tileSize || 16;
        this.layers = jsonData.layers || [];
        this.spriteSheets = jsonData.spriteSheets || {};

        this.platforms = []; // Tiles considered solid for collision

        this.parsePlatforms();
    }

    parsePlatforms() {
        for (const layer of this.layers) {
            if (layer.type === "tilelayer" && layer.name.toLowerCase().includes("collision")) {
                const { width, height, data } = layer;

                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        const index = y * width + x;
                        const tileId = data[index];
                        if (tileId !== 0) {
                            this.platforms.push({
                                x: x * this.tileSize,
                                y: y * this.tileSize,
                                width: this.tileSize,
                                height: this.tileSize
                            });
                        }
                    }
                }
            }
        }
    }

    draw(ctx, cameraX = 0, cameraY = 0) {
        ctx.fillStyle = "gray";
        for (const platform of this.platforms) {
            ctx.fillRect(platform.x - cameraX, platform.y - cameraY, platform.width, platform.height);
        }
    }
}
