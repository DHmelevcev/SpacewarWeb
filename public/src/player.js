class Player {
    constructor(x, y, xSpeed, ySpeed, angle, image, alive) {
        this.x = x
        this.y = y
        this.xSpeed = xSpeed
        this.ySpeed = ySpeed
        this.angle = angle
        this.image = image
    }

    draw() {
        context.translate(this.x, this.y);

        context.rotate(this.angle);
        context.drawImage(this.image, -40, -40, 80, 80);
        context.rotate(-this.angle);

        context.translate(-canvas.width, -canvas.height);
        context.rotate(this.angle);
        context.drawImage(this.image, -40, -40, 80, 80);
        context.rotate(-this.angle);

        context.translate(canvas.width, 0);
        context.rotate(this.angle);
        context.drawImage(this.image, -40, -40, 80, 80);
        context.rotate(-this.angle);

        context.translate(canvas.width, 0);
        context.rotate(this.angle);
        context.drawImage(this.image, -40, -40, 80, 80);
        context.rotate(-this.angle);

        context.translate(0, canvas.height);
        context.rotate(this.angle);
        context.drawImage(this.image, -40, -40, 80, 80);
        context.rotate(-this.angle);

        context.translate(0, canvas.height);
        context.rotate(this.angle);
        context.drawImage(this.image, -40, -40, 80, 80);
        context.rotate(-this.angle);

        context.translate(-canvas.width, 0);
        context.rotate(this.angle);
        context.drawImage(this.image, -40, -40, 80, 80);
        context.rotate(-this.angle);

        context.translate(-canvas.width, 0);
        context.rotate(this.angle);
        context.drawImage(this.image, -40, -40, 80, 80);
        context.rotate(-this.angle);

        context.translate(0, -canvas.height);
        context.rotate(this.angle);
        context.drawImage(this.image, -40, -40, 80, 80);
        context.rotate(-this.angle);

        context.translate(canvas.width - this.x, -this.y)
    }
}