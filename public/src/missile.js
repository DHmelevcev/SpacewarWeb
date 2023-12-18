class Missile {
    constructor(x, y, xSpeed, ySpeed, angle, image) {
        this.x = x
        this.y = y
        this.xSpeed = xSpeed
        this.ySpeed = ySpeed
        this.angle = angle
        this.image = image
    }

    draw() {
        context.translate(this.x, this.y);
        context.rotate(this.angle + Math.PI / 2);
        context.drawImage(this.image, -15, -15, 30, 30);
        context.rotate(-this.angle - Math.PI / 2);
        context.translate(-this.x, -this.y)
    }

    explode() {
        setTimeout(() => {
            context.save()
            context.beginPath()
            context.arc(this.x, this.y, 100, 0, Math.PI * 2, false)
            context.fillStyle = 'yellow'
            context.fill()
            context.restore()
        })
    }
}