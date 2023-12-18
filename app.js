const express = require('express')
const app = express()
const http = require('http')
const server = http.createServer(app)
const {Server} = require('socket.io');
const io = new Server(server, { pingInterval: 400, pingTimeout: 1000 })
const port = 8000

app.use(express.static('public'))
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')
})

const MAX_SPEED = 0.8 // fullscreen in (canvas.width / 1000 / MAX_SPEED) sec
const MISSILE_SPEED = 1.2
const ACCELERATION = 0.0008 // full speed in (MAX_SPEED / 1000 / ACCELERATION) sec
const RELOAD_INTERVAL = 250
const WIDTH = 2400 // should always be 3:2 ratio
const HEIGHT = 1600

const star = {
    x: 1200,
    y: 800,
    g: 50,
}

const players = {}

const projectiles = {}

io.on('connection', (socket) => {
    console.log(`User connected ${socket.id}`)

    socket.emit('updateMap', MAX_SPEED, MISSILE_SPEED, ACCELERATION, RELOAD_INTERVAL, WIDTH, HEIGHT, star)

    const spawnPlayer = (id) => {
        const spawnAngle = 2 * Math.PI * Math.random()
        players[id] = {
            x: star.x - 700 * Math.sin(spawnAngle),
            y: star.y - 700 * Math.cos(spawnAngle),
            xSpeed: 0.25 * Math.cos(spawnAngle),
            ySpeed: -0.25 * Math.sin(spawnAngle),
            angle: -spawnAngle + Math.PI,
            controls: {
                acceleration: {
                    pressed: false,
                },
                mousePos: {
                    x: star.x,
                    y: star.y,
                },
            },
            invulnerability: 600
        }
    }

    spawnPlayer(socket.id)

    socket.emit('spawned',
        players[socket.id].x,
        players[socket.id].y,
        players[socket.id].xSpeed,
        players[socket.id].ySpeed
    )
    io.emit('updatePlayers', players)

    socket.on('disconnect', (reason) => {
        console.log(`${reason} ${socket.id}`)
        delete players[socket.id]
        io.emit('updatePlayers', players)
    })

    socket.on('keydown', (controls) => {
        if (players[socket.id])
            players[socket.id].controls = controls
    })

    socket.on('newProjectile', (projectilesCounter, missileData) => {
        projectiles[socket.id + ':' + projectilesCounter] = missileData
        projectiles[socket.id + ':' + projectilesCounter].timeToLive = 60000
    })

    socket.on('respawn', () => {
        setTimeout(() => {
            if (socket.connected) {
                spawnPlayer(socket.id)
                socket.emit('spawned',
                    players[socket.id].x,
                    players[socket.id].y,
                    players[socket.id].xSpeed,
                    players[socket.id].ySpeed
                )
            }
        }, 3000)
    })
})

function invSqrt(n) {
    const buf = new ArrayBuffer(4);
    const i = new Int32Array(buf);
    const y = new Float32Array(buf)

    y[0] = n;
    i[0] = 0x5f3759df - (i[0] >> 1);
    const r = y[0];
    return r * (1.5 - (n * 0.5 * r * r));
}

const frameTime = 15

setInterval(() => {
    for (const id in players) {
        if (players[id].invulnerability > 0)
        players[id].invulnerability -= frameTime

        players[id].angle = Math.atan((players[id].controls.mousePos.x - players[id].x) / -(players[id].controls.mousePos.y - players[id].y))
        if (players[id].y < players[id].controls.mousePos.y)
            players[id].angle += Math.PI

        const InvSpeed = invSqrt(players[id].xSpeed * players[id].xSpeed + players[id].ySpeed * players[id].ySpeed)

        if (players[id].controls.acceleration.pressed) {
            players[id].xSpeed += ACCELERATION * frameTime * Math.sin(players[id].angle)
            players[id].ySpeed -= ACCELERATION * frameTime * Math.cos(players[id].angle)

            if (MAX_SPEED * InvSpeed < 1) {
                players[id].xSpeed -= ACCELERATION * frameTime * players[id].xSpeed * InvSpeed
                players[id].ySpeed -= ACCELERATION * frameTime * players[id].ySpeed * InvSpeed
            }
        }

        const InvDistance = invSqrt((star.x - players[id].x) * (star.x - players[id].x) + (star.y - players[id].y) * (star.y - players[id].y))

        if (InvDistance > 0.02) {
            delete players[id]
            continue
        }

        players[id].xSpeed += star.g * frameTime * (star.x - players[id].x) * Math.pow(InvDistance, 3)
        players[id].ySpeed += star.g * frameTime * (star.y - players[id].y) * Math.pow(InvDistance, 3)

        players[id].x += players[id].xSpeed * frameTime
        players[id].y += players[id].ySpeed * frameTime

        players[id].x = (players[id].x + WIDTH) % WIDTH
        players[id].y = (players[id].y + HEIGHT) % HEIGHT
    }

    for (const id in projectiles) {
        projectiles[id].timeToLive -= frameTime
        if (projectiles[id].timeToLive <= 0) {
            delete projectiles[id]
            continue
        }

        const InvDistance = invSqrt((star.x - projectiles[id].x) * (star.x - projectiles[id].x) + (star.y - projectiles[id].y) * (star.y - projectiles[id].y))
        if (InvDistance > 0.02) {
            delete projectiles[id]
            continue
        }

        for (const pid in players) {
            const Distance = Math.hypot(players[pid].x - projectiles[id].x, players[pid].y - projectiles[id].y)
            if (Distance < 35 && players[pid].invulnerability <= 0) {
                delete projectiles[id]
                delete players[pid]
                break
            }
        }
        if (!projectiles[id])
            continue

        projectiles[id].xSpeed += star.g * frameTime * (star.x - projectiles[id].x) * Math.pow(InvDistance, 3)
        projectiles[id].ySpeed += star.g * frameTime * (star.y - projectiles[id].y) * Math.pow(InvDistance, 3)

        projectiles[id].angle = Math.atan((projectiles[id].xSpeed) / -(projectiles[id].ySpeed))
        if (projectiles[id].ySpeed > 0)
            projectiles[id].angle += Math.PI

        projectiles[id].x += projectiles[id].xSpeed * frameTime
        projectiles[id].y += projectiles[id].ySpeed * frameTime

        if (projectiles[id].x < -10 || projectiles[id].x > WIDTH + 10
            || projectiles[id].y < -10 || projectiles[id].y > HEIGHT + 10) {
            delete projectiles[id]
        }
    }

    io.emit('updatePlayers', players)
    io.emit('updateProjectiles', projectiles)

}, frameTime)

server.listen(port, '0.0.0.0', () => {
    console.log(`Server started on port ${port}`)
})