// Copyright (C) 2022 Radioactive64

const { subtle } = require('crypto').webcrypto;
const keys = subtle.generateKey({
    name: "RSA-OAEP",
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: "SHA-256"
}, false, ['encrypt', 'decrypt']);

module.exports = function GaruderAPIServer(server) {
    // set io
    const recentConnections = [];
    const recentConnectionKicks = [];
    const io = new (require('socket.io')).Server(server, {
        path: '/garuder-api/',
        pingTimeout: 10000,
        upgradeTimeout: 300000
    });
    io.on('connection', function(socket) {
        socket.handshake.headers['x-forwarded-for'] = socket.handshake.headers['x-forwarded-for'] ?? '127.0.0.1';
        recentConnections[socket.handshake.headers['x-forwarded-for']] = (recentConnections[socket.handshake.headers['x-forwarded-for']] ?? 0)+1;
        if (recentConnections[socket.handshake.headers['x-forwarded-for']] > 3) {
            if (!recentConnectionKicks[socket.handshake.headers['x-forwarded-for']]) log('IP ' + socket.handshake.headers['x-forwarded-for'] + ' was kicked for connection spam.');
            recentConnectionKicks[socket.handshake.headers['x-forwarded-for']] = true;
            socket.emit('disconnected');
            socket.removeAllListeners();
            socket.onevent = function(packet) {};
            socket.disconnect();
            return;
        }
        const player = new Player(socket);
        // remove unecessary functionality
        delete player.fingerprint;
        socket.removeAllListeners('requestPublicKey');
        socket.removeAllListeners('mouseMove');
        socket.removeAllListeners('renderDistance');
        socket.removeAllListeners('debug');
        socket.removeAllListeners('signIn');
        // public RSA key
        socket.once('requestPublicKey', async function() {
            socket.emit('publicKey', await subtle.exportKey('jwk', (await keys).publicKey));
        });
        // mapdata
        socket.once('requestMapData', function() {
            let maps = [];
            for (let i in Collision.grid) {
                maps.push(i);
            }
            socket.emit('mapData', maps);
        });
        // sign in
        socket.on('login', async function(cred) {
            if (typeof cred == 'object' && cred != null && typeof cred.username == 'string' && cred.password instanceof Buffer) {
                const decryptPassword = await RSAdecodeAPI(cred.password);
                let valid = ACCOUNTS.validateCredentials(cred.username, decryptPassword);
                switch (valid) {
                    case 0:
                        if (Filter.check(cred.username)) {
                            player.leave();
                            return;
                        }
                        if (!player.signedIn) {
                            let status = await ACCOUNTS.login(cred.username, decryptPassword);
                            switch (status) {
                                case 0:
                                    let signedIn = false;
                                    for (let i in Player.list) {
                                        if (Player.list[i].creds.username == cred.username) {
                                            signedIn = true;
                                        }
                                    }
                                    if (!signedIn) {
                                        player.creds.username = cred.username;
                                        player.creds.password = await RSAencode(decryptPassword);
                                        Object.freeze(player.creds);
                                        player.name = player.creds.username;
                                        player.updateClient();
                                        await player.loadData();
                                        socket.emit('loggedIn');
                                        insertChat(player.name + ' joined the game', 'server');
                                        player.signedIn = true;
                                        player.invincible = false;
                                        player.canMove = true;
                                        player.alive = true;
                                    } else {
                                        socket.emit('loginError', 'Already logged in');
                                    }
                                    break;
                                case 1:
                                    socket.emit('loginError', 'Incorrect password');
                                    break;
                                case 2:
                                    socket.emit('loginError', 'Account not found');
                                    break;
                                case 3:
                                    socket.emit('loginError', 'Account is banned');
                                    break;
                            }
                        }
                        break;
                    case 1:
                        socket.emit('loginError', 'No username');
                        break;
                    case 2:
                        socket.emit('loginError', 'Username too short');
                        break;
                    case 3:
                        socket.emit('loginError', 'Username too long');
                        break;
                    case 4:
                        socket.emit('loginError', 'No Password');
                        break;
                    case 5:
                        socket.emit('loginError', 'Invalid Characters');
                        break;
                }
            } else {
                player.kick();
            }
        });

        // manage disconnections
        let timeoutdetect = setTimeout(function() {});
        socket.on('pong', function() {
            clearTimeout(timeoutdetect);
        });
        setInterval(function() {
            socket.emit('ping');
            timeoutdetect = setTimeout(async function() {
                await player.leave();
            }, 10000);
        }, 1000);
    });
    setInterval(function() {
        for (let i in recentConnections) {
            recentConnections[i] = Math.max(recentConnections[i]-1, 0);
        }
        for (let i in recentConnectionKicks) {
            delete recentConnectionKicks[i];
        }
    }, 1000);
};

async function RSAdecodeAPI(buf) {
    return new TextDecoder().decode(await subtle.decrypt({name: "RSA-OAEP"}, (await keys).privateKey, buf));
};