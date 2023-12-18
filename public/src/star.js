class Star {
    constructor(x, y, g, image) {
        this.x = x
        this.y = y
        this.g = g
        this.image = image
    }

    draw() {
        context.translate(this.x, this.y);
        context.drawImage(this.image, -150, -150, 300, 300);
        context.translate(-this.x, -this.y)
    }
}