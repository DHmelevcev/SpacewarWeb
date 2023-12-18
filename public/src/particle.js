const friction = 0.97
class Particle {
    constructor(color, radius, x, y, xSpeed = 0, ySpeed = 0) {
        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
        this.xSpeed = xSpeed
        this.ySpeed = ySpeed
        this.alpha = 1
    }

    draw() {
        context.save()
        context.globalAlpha = this.alpha
        context.beginPath()
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
        context.fillStyle = this.color
        context.fill()
        context.restore()
    }

    update() {
        if (this.alpha > 0) {
            this.draw()
            this.xSpeed *= friction
            this.ySpeed *= friction
            this.x = this.x + this.xSpeed
            this.y = this.y + this.ySpeed
            this.alpha -= 0.01
        }
    }
}