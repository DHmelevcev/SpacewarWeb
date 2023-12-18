const canvas = document.querySelector('canvas')
const context = canvas.getContext('2d')
const starsBG = document.getElementById('StarsImg');
const glowingStarImage = document.getElementById('GlowingStarImg');
const playerImage = document.getElementById('SpaceShipImg');
const enemyImage = document.getElementById('EnemyShipImg');
const missileImage = document.getElementById('MissileImg');

const socket = io()

let MaxSpeed = 0.8
let MissileSpeed = 0.8
let Acceleration = 0.0008
let ReloadInterval = 400
canvas.width = 1800
canvas.height = 1200

const star = new Star(
    1200,
    800,
    50,
    glowingStarImage
)

const otherPlayers = {}

let projectilesCounter = 0
const projectiles = {}

const particles = []

let player = new Player(
    0,
    0,
    0,
    0,
    0,
    playerImage
)

let alive = false

socket.on('updateMap', (backendS, backendMS, backendA, backendRI, backendW, backendH, backendStar) => {
    MaxSpeed = backendS
    MissileSpeed = backendMS
    Acceleration = backendA
    ReloadInterval = backendRI
    canvas.width = backendW
    canvas.height = backendH
    star.x = backendStar.x
    star.y = backendStar.y
    star.g = backendStar.g
})

socket.on('spawned', (x, y, xSpeed, ySpeed) => {
    player.x = x
    player.y = y
    player.xSpeed = xSpeed
    player.ySpeed = ySpeed
    alive = true
})

socket.on('updatePlayers', (backendPlayers) => {
    for (const id in backendPlayers) {
        const backEndPlayer = backendPlayers[id]

        if (socket.id.toString() !== id) {

            if (!otherPlayers[id]) {
                otherPlayers[id] = new Player(
                    backEndPlayer.x,
                    backEndPlayer.y,
                    backEndPlayer.xSpeed,
                    backEndPlayer.ySpeed,
                    backEndPlayer.angle,
                    enemyImage
                )
            }
            else {
                otherPlayers[id].x = backEndPlayer.x
                otherPlayers[id].y = backEndPlayer.y
                otherPlayers[id].xSpeed = backEndPlayer.xSpeed
                otherPlayers[id].ySpeed = backEndPlayer.ySpeed
                otherPlayers[id].angle = backEndPlayer.angle
            }
        }
        else {
            player.x = backEndPlayer.x
            player.y = backEndPlayer.y
            player.xSpeed = backEndPlayer.xSpeed
            player.ySpeed = backEndPlayer.ySpeed
        }
    }

    for (const id in otherPlayers) {
        if (!backendPlayers[id]) {
            for(let i = 0; i < 360; i+= 15) {
                const spawnAngle = 2 * Math.PI * i / 360
                particles.push(new Particle(
                    Math.random() < 0.33 ? 'rgb(63,63,63)' : Math.random() > 0.2 ? 'rgb(255, 165, 0)' : 'rgb(75,0,0)',
                    5,
                    otherPlayers[id].x + 5 * Math.sin(spawnAngle),
                    otherPlayers[id].y + 5 * Math.cos(spawnAngle),
                    otherPlayers[id].xSpeed + (Math.random() + 0.5) * 2 * Math.sin(spawnAngle),
                    otherPlayers[id].ySpeed + (Math.random() + 0.5) * 2 * Math.cos(spawnAngle)
                ))
            }

            delete otherPlayers[id]
        }
    }

    if (!backendPlayers[socket.id] && alive) {
        alive = false
        for(let i = 0; i < 360; i+= 15) {
            const spawnAngle = 2 * Math.PI * i / 360
            particles.push(new Particle(
                Math.random() < 0.33 ? 'rgb(220,220,220)' : Math.random() > 0.2 ? 'rgb(63,63,63)' : 'rgb(0,62,134)',
                5,
                player.x + 5 * Math.sin(spawnAngle),
                player.y + 5 * Math.cos(spawnAngle),
                player.xSpeed + (Math.random() + 0.5) * 2 * Math.sin(spawnAngle),
                player.ySpeed + (Math.random() + 0.5) * 2 * Math.cos(spawnAngle)
            ))
        }
        socket.emit('respawn')
    }
})

socket.on('updateProjectiles', (backendProjectiles) => {
    for (const id in backendProjectiles) {
        const backEndProjectile = backendProjectiles[id]

        if (!projectiles[id]) {
            projectiles[id] = new Missile(
                backEndProjectile.x,
                backEndProjectile.y,
                backEndProjectile.xSpeed,
                backEndProjectile.ySpeed,
                backEndProjectile.angle,
                missileImage
            )
        }
        else {
            projectiles[id].x = backEndProjectile.x
            projectiles[id].y = backEndProjectile.y
            projectiles[id].xSpeed = backEndProjectile.xSpeed
            projectiles[id].ySpeed = backEndProjectile.ySpeed
            projectiles[id].angle = backEndProjectile.angle
        }
    }

    for (const id in projectiles) {
        if (!backendProjectiles[id]) {
            if (projectiles[id].x > 0 && projectiles[id].x < canvas.width &&
                projectiles[id].y > 0 && projectiles[id].y < canvas.height) {
                for(let i = 0; i < 360; i+= 15) {
                    const spawnAngle = 2 * Math.PI * i / 360
                    particles.push(new Particle(
                        Math.random() > 0.33 ? 'yellow' : Math.random() > 0.5 ? 'red' : 'orange',
                        5,
                        projectiles[id].x + 5 * Math.sin(spawnAngle),
                        projectiles[id].y + 5 * Math.cos(spawnAngle),
                        (Math.random() + 4) * 0.25 * Math.sin(spawnAngle),
                        (Math.random() + 4) * 0.25 * Math.cos(spawnAngle)
                    ))
                }
            }
            delete projectiles[id]
        }
    }
})

const controls = {
    acceleration: {
        pressed: false,
    },
    mousePos: {
        x: star.x,
        y: star.y,
    },
    mouseDown: {
        pressed: false,
    },
    reload: {
        timeLeft: 0
    }
}

window.addEventListener('keydown', (event) => {
    switch (event.code) {
        case 'KeyW':
            controls.acceleration.pressed = true
            break
    }
})

window.addEventListener('keyup', (event) => {
    switch (event.code) {
        case 'KeyW':
            controls.acceleration.pressed = false
            break
    }
})

window.addEventListener('mousedown', (event) => {
    if (event.button === 0)
        controls.mouseDown.pressed = true
})

window.addEventListener('mouseup', (event) => {
    if (event.button === 0)
        controls.mouseDown.pressed = false
})

window.addEventListener('mousemove', (event) => {
    controls.mousePos.x = (event.clientX - canvas.offsetLeft) * canvas.width / canvas.offsetWidth
    controls.mousePos.y = (event.clientY - canvas.offsetTop) * canvas.height / canvas.offsetHeight
});

function invSqrt(n) {
    const buf = new ArrayBuffer(4);
    const i = new Int32Array(buf);
    const y = new Float32Array(buf)

    y[0] = n;
    i[0] = 0x5f3759df - (i[0] >> 1);
    const r = y[0];
    return r * (1.5 - (n * 0.5 * r * r));
}

let frameTime = 0
let prevTimeStamp = 0

const gameLoop = (timeStamp) => {
    frameTime = timeStamp - prevTimeStamp
    prevTimeStamp = timeStamp
    frameTime = frameTime > 33.3334 ? 33.3334 : frameTime

    if (alive) {
        player.angle = Math.atan((controls.mousePos.x - player.x) / -(controls.mousePos.y - player.y))
        if (player.y < controls.mousePos.y)
            player.angle += Math.PI

        // quadratic interpolation for player
        const RevSpeed = invSqrt(player.xSpeed * player.xSpeed + player.ySpeed * player.ySpeed)

        if (controls.acceleration.pressed) {
            player.xSpeed += Acceleration * frameTime * Math.sin(player.angle)
            player.ySpeed -= Acceleration * frameTime * Math.cos(player.angle)

            if (MaxSpeed * RevSpeed < 1) {
                player.xSpeed -= Acceleration * frameTime * player.xSpeed * RevSpeed
                player.ySpeed -= Acceleration * frameTime * player.ySpeed * RevSpeed
            }
        }

        const InvDistance = invSqrt((star.x - player.x) * (star.x - player.x) + (star.y - player.y) * (star.y - player.y))

        player.xSpeed += star.g * frameTime * (star.x - player.x) * Math.pow(InvDistance, 3)
        player.ySpeed += star.g * frameTime * (star.y - player.y) * Math.pow(InvDistance, 3)

        player.x += player.xSpeed * frameTime
        player.y += player.ySpeed * frameTime

        // player shoot after transition to not shoot itself
        if (controls.reload.timeLeft > 0)
            controls.reload.timeLeft -= frameTime
        else if (controls.mouseDown.pressed) {
            controls.reload.timeLeft = ReloadInterval

            const missileData = {
                x: player.x + 45 * Math.sin(player.angle),
                y: player.y - 45 * Math.cos(player.angle),
                xSpeed: player.xSpeed + MissileSpeed * Math.sin(player.angle),
                ySpeed: player.ySpeed + MissileSpeed * -Math.cos(player.angle),
                angle: player.angle,
            }

            socket.emit('newProjectile', projectilesCounter, missileData)

            projectilesCounter++
        }

        player.x = (player.x + canvas.width) % canvas.width
        player.y = (player.y + canvas.height) % canvas.height
    }

    context.clearRect(0, 0, canvas.width, canvas.height)
    context.drawImage(starsBG, 0, -50, canvas.width, canvas.height + 100)

    for (const id in projectiles) {
        // linear interpolation for projectiles
        projectiles[id].x += projectiles[id].xSpeed * frameTime
        projectiles[id].y += projectiles[id].ySpeed * frameTime

        if (projectiles[id].x > -10 && projectiles[id].x < canvas.width + 10 &&
            projectiles[id].y > -10 && projectiles[id].y < canvas.height + 10) {
            projectiles[id].draw()
        }
    }

    for (const id in otherPlayers) {
        // linear interpolation for other players
        otherPlayers[id].x += otherPlayers[id].xSpeed * frameTime
        otherPlayers[id].y += otherPlayers[id].ySpeed * frameTime

        otherPlayers[id].x = (otherPlayers[id].x + canvas.width) % canvas.width
        otherPlayers[id].y = (otherPlayers[id].y + canvas.height) % canvas.height

        otherPlayers[id].draw()
    }

    if (alive) {
        player.draw()
    }

    for (const particle of particles) {
        particle.update()
    }

    star.draw()

    requestAnimationFrame(gameLoop)
}

setInterval(() => {
    const index = particles.findIndex(particle => { return particle.alpha > 0 })
    particles.splice(0, index === -1 ? particles.length - 1 : index)
}, 500)

setInterval(() => {
    if (alive)
        socket.emit('keydown', controls)
}, 15)

setTimeout(() => requestAnimationFrame(gameLoop), 50)