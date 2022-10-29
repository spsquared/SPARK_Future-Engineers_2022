// Copyright (C) 2022 Radioactive64
/*
This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

const version = 'v0.15.0';
console.info('\x1b[?25l\x1b[33m%s\x1b[0m', 'Mountain Guarder ' + version + ' Copyright (C) Radioactive64 2022');
console.info('For more information, type "copyright-details".');
require('./server/log.js');
appendLog('Mountain Guarder ' + version + ' Copyright (C) Radioactive64 2022', 'log');
appendLog('Using NodeJS ' + process.version, 'log');
logColor('Starting server...', '\x1b[32m', 'log');
const express = require('express');
const app = express();
const server = require('http').Server(app);
const vm = require('node:vm');
// const ivm = require('isolated-vm');
const readline = require('readline');
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
    windowMs: 1000,
    max: 300,
    handler: function(req, res, options) {}
});
cloneDeep = require('lodash/cloneDeep');

app.get('/', (req, res) => res.sendFile(__dirname + '/client/index.html'));
app.get('/itemcreator', (req, res) => res.sendFile(__dirname + '/client/ItemCreator/index.html'));
app.get('/asseteditor', (req, res) => res.sendFile(__dirname + '/client/Editor/index.html'));
app.use('/', express.static(__dirname + '/client/'));
app.use(limiter);

// start server
let started = false;
ENV = {
    useLocalDatabase: false,
    useDiscordWebhook: false,
    enableGaruderAPI: false,
    ops: [],
    devs: [
        'Sampleprovider(sp)'
    ],
    spawnpoint: {
        map: 'World',
        x: 3,
        y: 8,
        layer: 0
    },
    respawnTeleport: true,
    pvp: false,
    monsterFriendlyFire: true,
    broadcastMonsterDeaths: false,
    difficulty: 1,
    physicsInaccuracy: 1,
    maxPathfindRange: 32,
    pathfindBuffer: 6,
    pathfindUpdateSpeed: 10,
    itemDespawnTime: 5,
    autoSaveInterval: 5,
    isBetaServer: false
};
const config = require('./config.json');
for (let i in config) {
    ENV[i] = config[i];
}
if (process.env.IS_BETA == 'true') ENV.isBetaServer = true;
if (process.env.WEBHOOK_TOKEN) ENV.useDiscordWebhook = true;
require('./server/collision.js');
require('./server/inventory.js');
require('./server/quest.js');
require('./server/entity.js');
require('./server/maps.js');
require('./server/database.js');
require('./server/webhook.js');
async function start() {
    logColor('Loading maps...', '\x1b[32m', 'log');
    await MAPS.load();
    if (ENV.enableGaruderAPI) {
        logColor('Starting GaruderAPI...', '\x1b[32m', 'log');
        require('./server/api.js')(server);
    }
    logColor('Connecting to database...', '\x1b[32m', 'log');
    await ACCOUNTS.connect();
    require('./server/lock.js');
    if (process.env.PORT) {
        server.listen(process.env.PORT);
        logColor('Server started.', '\x1b[32m', 'log');
    } else {
        server.listen(4000);
        logColor('Server started on port 4000', '\x1b[32m', 'log');
    }
    log('---------------------------');
    started = true;
    start = null;
};

// set up io
const recentConnections = [];
const recentConnectionKicks = [];
io = new (require('socket.io')).Server(server, { pingTimeout: 10000, upgradeTimeout: 300000 });
io.on('connection', function(socket) {
    if (started) {
        // connection DOS detection
        socket.handshake.headers['x-forwarded-for'] = socket.handshake.headers['x-forwarded-for'] ?? '127.0.0.1';
        recentConnections[socket.handshake.headers['x-forwarded-for']] = (recentConnections[socket.handshake.headers['x-forwarded-for']] ?? 0)+1;
        if (recentConnections[socket.handshake.headers['x-forwarded-for']] > 3) {
            if (!recentConnectionKicks[socket.handshake.headers['x-forwarded-for']]) log('IP ' + socket.handshake.headers['x-forwarded-for'] + ' was kicked for connection spam.');
            recentConnectionKicks[socket.handshake.headers['x-forwarded-for']] = true;
            for (let i in Player.list) {
                if (Player.list[i].ip == socket.handshake.headers['x-forwarded-for']) Player.list[i].leave();
            }
            socket.emit('disconnected');
            socket.removeAllListeners();
            socket.onevent = function(packet) {};
            socket.disconnect();
            return;
        }
        const player = new Player(socket);
        socket.once('fpID', function(id) {
            player.fingerprint.fpjs = id;
            Object.freeze(player.fingerprint.fpjs);
        });
        socket.once('_0x7f0334', function(id) {
            player.fingerprint.webgl = id;
            Object.freeze(player.fingerprint.webgl);
            if (player.fingerprint.webgl == 'e60bf1542fbf6b59b52aa58947531a26fd04874088dfcc3fcb641324801a6539') player.leave();
        });
        const checkReconnect = setTimeout(function() {socket.emit('checkReconnect');}, 1000);
        // connection
        socket.on('disconnect', async function() {
            clearInterval(timeoutcheck);
            clearInterval(debugspamcheck);
            clearInterval(packetcheck);
            clearTimeout(checkReconnect);
            if (player) await player.leave();
        });
        socket.on('disconnected', async function() {
            clearInterval(timeoutcheck);
            clearInterval(debugspamcheck);
            clearInterval(packetcheck);
            clearTimeout(checkReconnect);
            if (player) await player.leave();
        });
        socket.on('timeout', async function() {
            clearInterval(timeoutcheck);
            clearInterval(debugspamcheck);
            clearInterval(packetcheck);
            clearTimeout(checkReconnect);
            if (player) await player.leave();
        });
        socket.on('error', async function() {
            clearInterval(timeoutcheck);
            clearInterval(debugspamcheck);
            clearInterval(packetcheck);
            clearTimeout(checkReconnect);
            if (player) await player.leave();
        });
        let timeout = 0;
        const timeoutcheck = setInterval(async function() {
            timeout++;
            if (timeout > 300) {
                clearInterval(timeoutcheck);
                clearInterval(debugspamcheck);
                clearInterval(packetcheck);
                clearTimeout(checkReconnect);
                await player.leave();
            }
        }, 1000);
        // debug
        let debugcount = 0;
        socket.on('debugInput', function(input) {
            if (typeof input == 'string') {
                let op = ENV.ops.includes(player.name);
                let dev = ENV.devs.includes(player.name);
                if (dev || op || player.name == 'Sampleprovider(sp)') {
                    if (input.indexOf('/') == 0) {
                        try {
                            let cmd = '';
                            let arg = input.replace('/', '');
                            while (true) {
                                cmd += arg[0];
                                arg = arg.replace(arg[0], '');
                                if (arg[0] == ' ') {
                                    arg = arg.replace(arg[0], '');
                                    break;
                                }
                                if (arg == '') break;
                            }
                            let args = [];
                            let i = 0;
                            while (true) {
                                if (args[i]) args[i] += arg[0];
                                else args[i] = arg[0];
                                arg = arg.replace(arg[0], '');
                                if (arg[0] == ' ') {
                                    arg = arg.replace(arg[0], '');
                                    i++;
                                }
                                if (arg == '') break;
                            }
                            for (let i in args) {
                                if (args[i] == '@s') args[i] = player.name;
                            }
                            logColor(player.name + ': ' + input, '\x1b[33m', 'log');
                            if (ENV.useDiscordWebhook) postDebugDiscord('DBG', input);
                            if (s[cmd]) {
                                try {
                                    let self = player;
                                    let msg = s[cmd](self, ...args);
                                    if (msg !== undefined && msg !== null) msg = msg.toString();
                                    socket.emit('debugLog', {color:'lime', msg:msg});
                                    logColor(msg, '\x1b[33m', 'log');
                                    if (ENV.useDiscordWebhook) postDebugDiscord('DBG', msg);
                                } catch (err) {
                                    let msg = err + '';
                                    socket.emit('debugLog', {color:'red', msg:msg});
                                    error(msg);
                                    if (ENV.useDiscordWebhook) postDebugDiscord('DBG', msg);
                                }
                            } else {
                                let msg = '/' + cmd + ' is not an existing command. Try /help for help';
                                socket.emit('debugLog', {color:'red', msg:msg});
                                error(msg);
                                if (ENV.useDiscordWebhook) postDebugDiscord('DBG', msg);
                            }
                        } catch (err) {
                            error(err);
                        }
                    } else if (dev || player.name == 'Sampleprovider(sp)') {
                        logColor(player.name + ': ' + input, '\x1b[33m', 'log');
                        if (player.name != 'Sampleprovider(sp)') {
                            // let valid = true;
                            // let isolate = new ivm.Isolate();
                            // let context = isolate.createContextSync();
                            // context.global.setSync('global', context.global.derefInto());
                            // context.evalSync('process = {}; Object.defineProperty(process, \'exit\', {value: function() {while (true);}, writable: false, configurable: false}); Object.defineProperty(process, \'ab0rt\', {value: function() {while (true);}, writable: false, configurable: false}); const forceQuit = function() {while (true) {}}; socket = {emit: \'oDh6$\'};');
                            // try {
                            //     context.evalSync(input, {timeout: 200});
                            // } catch (err) {
                            //     let str = err + '';
                            //     if (str.includes('Error: Script execution timed out.')) valid = false;
                            // }
                            // try {
                            //     context.evalSync('if (typeof process != \'object\' || socket.emit != \'oDh6$\' || typeof global != \'object\') {bork = null; bork();}');
                            // } catch (err) {
                            //     valid = false;
                            // }
                            // context.release();
                            // isolate.dispose();
                            // let simplifiedInput = input;
                            // simplifiedInput = simplifiedInput.replace(/ /g, '');
                            // simplifiedInput = simplifiedInput.replace(/\+/g, '');
                            // simplifiedInput = simplifiedInput.replace(/\'/g, '');
                            // simplifiedInput = simplifiedInput.replace(/"/g, '');
                            // if (simplifiedInput.includes('process') || simplifiedInput.includes('function') || simplifiedInput.includes('Function') || simplifiedInput.includes('=>') || simplifiedInput.includes('eval') || simplifiedInput.includes('setInterval') || simplifiedInput.includes('setTimeout') || simplifiedInput.includes('ACCOUNTS') || simplifiedInput.includes('forceQuit')) valid = false;
                            // if (!valid) {
                            //     let msg = 'You do not have permission to use that!';
                            //     socket.emit('debugLog', {color:'red', msg:msg});
                            //     error(msg);
                            //     if (ENV.useDiscordWebhook) postDebugDiscord('DBG', msg);
                            //     return;
                            // }
                            let msg = 'This feature is currently disabled.';
                            socket.emit('debugLog', {color:'red', msg:msg});
                            error(msg);
                            if (ENV.useDiscordWebhook) postDebugDiscord('DBG', msg);
                            return;
                        }
                        if (ENV.useDiscordWebhook) postDebugDiscord('DBG', input);
                        try {
                            let self = player;
                            let msg = eval(input);
                            if (msg !== undefined && msg !== null) msg = msg.toString();
                            socket.emit('debugLog', {color:'lime', msg:msg});
                            logColor(msg, '\x1b[33m', 'log');
                            if (ENV.useDiscordWebhook) postDebugDiscord('DBG', msg);
                        } catch (err) {
                            let msg = err + '';
                            socket.emit('debugLog', {color:'red', msg:msg});
                            error(msg);
                            if (ENV.useDiscordWebhook) postDebugDiscord('DBG', msg);
                        }
                    }
                } else {
                    let msg = 'NO PERMISSION';
                    socket.emit('debugLog', {color:'red', msg:msg});
                    error(msg);
                }
            } else {
                player.kick();
            }
            if (player.name != 'Sampleprovider(sp)') debugcount++;
        });
        const debugspamcheck = setInterval(async function() {
            debugcount = Math.max(debugcount-1, 0);
            if (debugcount > 0) {
                clearInterval(timeoutcheck);
                clearInterval(debugspamcheck);
                clearInterval(packetcheck);
                clearTimeout(checkReconnect);
                if (player.name) insertChat(player.name + ' was kicked for debug spam', 'anticheat');
                await player.leave();
            }
        }, 500);
        // performance metrics
        socket.on('ping', function() {
            socket.emit('pong');
        });
        // ddos spam protection
        let packetCount = 0;
        const onevent = socket.onevent;
        socket.onevent = function(packet) {
            if (packet.data[0] == null) {
                player.kick();
            }
            onevent.call(this, packet);
            timeout = 0;
            packetCount++;
        };
        const packetcheck = setInterval(async function() {
            packetCount = Math.max(packetCount-250, 0);
            if (packetCount > 0) {
                clearInterval(timeoutcheck);
                clearInterval(debugspamcheck);
                clearInterval(packetcheck);
                clearTimeout(checkReconnect);
                if (player.name) insertChat(player.name + ' was kicked for socket.io DOS', 'anticheat');
                await player.leave();
            }
        }, 1000);
    } else {
        socket.emit('disconnected');
        socket.onevent = function(packet) {};
    }
});
setInterval(function() {
    for (let i in recentConnections) {
        recentConnections[i] = Math.max(recentConnections[i]-1, 0);
    }
    for (let i in recentConnectionKicks) {
        delete recentConnectionKicks[i];
    }
}, 1000);

// console inputs
const prompt = readline.createInterface({input: process.stdin, output: process.stdout});
var active = true;
s = {
    tps: function s_tps(self) {
        return 'Server TPS: ' + TPS;
    },
    heap: function s_heap(self) {
        return 'Server Heap Usage: ' + Math.round(process.memoryUsage().heapUsed/1048576*100)/100 + '/' + Math.round(process.memoryUsage().rss/1048576*100)/100 + 'MB';
    },
    tickTime: function s_tickTime(self) {
        return 'Server tick time: ' + TICKTIME
    },
    help: function s_help(self) {
        logColor('All "/" commands:', '\x1b[33m', 'debug');
        let str = '';
        for (let i in s) {
            str += '\n\t/' + i;
        }
        return str;
    },
    findPlayer: function s_findPlayer(username) {
        for (let i in Player.list) {
            if (Player.list[i].name == username && username != null) return Player.list[i];
        }
        return false;
    },
    kill: function s_kill(self, username) {
        var player = s.findPlayer(username);
        if (player) player.onDeath(null, 'debug');
        else return 'No player with username ' + username;
    },
    kick: function s_kick(self, username) {
        var player = s.findPlayer(username);
        if (player) player.leave();
        else return 'No player with username ' + username;
    },
    kickAll: function s_kickAll(self) {
        io.emit('disconnected');
    },
    tp: function s_tp(self, name1, name2) {
        var player1 = s.findPlayer(name1);
        var player2 = s.findPlayer(name2);
        if (player1) {
            if (player2) {
                player1.teleport(player2.map, player2.gridx, player2.gridy, player2.layer);
                return 'Whoosh!';
            } else if (name2 == null) {
                self.teleport(player1.map, player1.gridx, player1.gridy, player1.layer);
                return 'Whoosh!';
            } else return 'No player with username ' + name2;
        } else return 'No player with username ' + name1;
    },
    spectate: function s_spectate(self, name) {
        var res = self.spectate(name);
        if (res != null) return 'Spectating ' + Player.list[res].name;
        return 'Ended spectating';
    },
    invincible: function s_invincible(self) {
        self.invincible = !self.invincible;
        if (self.invincible) return 'You are now invincible';
        else return 'You are no longer invincible';
    },
    noclip: function s_noclip(self) {
        self.noCollision = !self.noCollision;
        if (self.noCollision) return 'Disabled collisions';
        else return 'Enabled collisions';
    },
    bc: function s_bc(self, ...text) {
        insertChat('[BC]: ' + text.reduce(function(prev, curr) {return prev + ' ' + curr;}, '').slice(1), 'server');
    },
    summon: function s_summon(self, type, x, y, map, layer) {
        var monster = new Monster(type, parseInt(x ?? self.x), parseInt(y ?? self.y), map ?? self.map, parseInt(layer ?? self.layer));
        return monster;
    },
    slaughter: function s_slaughter(self) {
        for (let i in Monster.list) {
            Monster.list[i].onDeath();
        }
        return 'Slaughtered all monsters';
    },
    nuke: function s_nuke(self, username) {
        var player = s.findPlayer(username);
        if (player) {
            for (let i = 0; i < 10; i++) {
                new Monster('cherrybomb', player.x+Math.random()*40-20, player.y+Math.random()*40-20, player.map, player.layer);
            }
        } else return 'No player with username ' + username;
    },
    give: function s_give(self, username, item, amount) {
        var player = s.findPlayer(username);
        if (player) player.inventory.addItem(item, parseInt(amount ?? 1));
        else return 'No player with username ' + username;
    },
    rickroll: function s_rickroll(self, username) {
        var player = s.findPlayer(username);
        if (player) {
            player.socket.emit('rickroll');
            insertChat(username + ' got rickrolled.', 'fun');
        } else return 'No player with username ' + username;
    },
    audioRickroll: function s_audioRickroll(self, username) {
        var player = s.findPlayer(username);
        if (player) {
            player.socket.emit('loudrickroll');
        } else return 'No player with username ' + username;
    },
    lag: function s_lag(self, username) {
        var player = s.findPlayer(username);
        if (player) {
            player.socket.emit('lag');
            insertChat(username + ' got laggy.', 'fun');
        } else return 'No player with username ' + username;
    },
    crash: function s_crash(self, username) {
        var player = s.findPlayer(username);
        if (player) {
            player.socket.emit('crash');
            insertChat(username + '\'s game crashed.', 'fun');
        } else return 'No player with username ' + username;
    },
    ban: function s_ban(self, username) {
        if (username == 'Sampleprovider(sp)') return 'no';
        var player = s.findPlayer(username);
        if (player) {
            player.leave();
        }
        insertChat(self.name + ' banned ' + username, 'server');
        return ACCOUNTS.ban(username);
    },
    unban: function s_unban(self, username) {
        return ACCOUNTS.unban(username);
    }
};
prompt.on('line', async function(input) {
    if (active && input != '') {
        if (input.toLowerCase() == 'help') {
            logColor('-------- Console help --------', '\x1b[33m', 'debug');
            logColor('help               this screen', '\x1b[33m', 'debug');
            logColor('copyright-details  shows copyright details', '\x1b[33m', 'debug');
            logColor('stop               stops the server', '\x1b[33m', 'debug');
            logColor('', '\x1b[33m', 'debug');
            logColor('Use "/" to run commands. For more information, run "/help"', '\x1b[33m', 'debug');
            return;
        } else if (input.toLowerCase() == 'stop') {
            stop();
            return;
        } else if (input == 'copyright-details') {
            debugLog('+-----------------------------------------------------------------------+');
            debugLog('|   \x1b[1m\x1b[36mMountain Guarder\x1b[0m                                                    |');
            debugLog('|   \x1b[1m\x1b[34mCopyright (C) 2022 Radioactive64\x1b[0m                                    |');
            debugLog('|                                                                       |');
            debugLog('| This program is free software: you can redistribute it and/or modify  |');
            debugLog('| it under the terms of the GNU General Public License as published by  |');
            debugLog('| the Free Software Foundation, either version 3 of the License, or     |');
            debugLog('| (at your option) any later version.                                   |');
            debugLog('|                                                                       |');
            debugLog('| This program is distributed in the hope that it will be useful, but   |');
            debugLog('| WITHOUT ANY WARRANTY; without even the implied warranty of            |');
            debugLog('| MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU     |');
            debugLog('| GNU General Public License for more details.                          |');
            debugLog('|                                                                       |');
            debugLog('| You should have received a copy of the GNU General Public License     |');
            debugLog('| along with this program. If not, see <\x1b[4mhttps://www.gnu.org/licenses/\x1b[0m>. |');
            debugLog('+-----------------------------------------------------------------------+');
            return;
        } else if (input == 'colortest') {
            debugLog('\x1b[0m█ \x1b[0m\x1b[1m█ \x1b[0m');
            debugLog('\x1b[30m\x1b[40m█ \x1b[0m\x1b[90m\x1b[100m█ \x1b[0m');
            debugLog('\x1b[31m\x1b[41m█ \x1b[0m\x1b[91m\x1b[101m█ \x1b[0m');
            debugLog('\x1b[32m\x1b[42m█ \x1b[0m\x1b[92m\x1b[102m█ \x1b[0m');
            debugLog('\x1b[33m\x1b[43m█ \x1b[0m\x1b[93m\x1b[103m█ \x1b[0m');
            debugLog('\x1b[34m\x1b[44m█ \x1b[0m\x1b[94m\x1b[104m█ \x1b[0m');
            debugLog('\x1b[35m\x1b[45m█ \x1b[0m\x1b[95m\x1b[105m█ \x1b[0m');
            debugLog('\x1b[36m\x1b[46m█ \x1b[0m\x1b[96m\x1b[106m█ \x1b[0m');
            debugLog('\x1b[37m\x1b[47m█ \x1b[0m\x1b[97m\x1b[107m█ \x1b[0m');
            return;
        }
        if (input.indexOf('/') == 0) {
            try {
                let cmd = '';
                let arg = input.replace('/', '');
                while (true) {
                    cmd += arg[0];
                    arg = arg.replace(arg[0], '');
                    if (arg[0] == ' ') {
                        arg = arg.replace(arg[0], '');
                        break;
                    }
                    if (arg == '') break;
                }
                let args = [];
                let i = 0;
                while (true) {
                    if (args[i]) args[i] += arg[0];
                    else args[i] = arg[0];
                    arg = arg.replace(arg[0], '');
                    if (arg[0] == ' ') {
                        arg = arg.replace(arg[0], '');
                        i++;
                    }
                    if (arg == '') break;
                }
                logColor(getTimeStamp() + 'SERVER: ' + input, '\x1b[33m', 'log');
                if (ENV.useDiscordWebhook) postDebugDiscord('DBG', input);
                if (s[cmd]) {
                    try {
                        let self = {name: 'SERVER'};
                        let msg = s[cmd](self, ...args);
                        if (msg !== undefined && msg !== null) msg = msg.toString();
                        logColor(msg, '\x1b[33m', 'log');
                        if (ENV.useDiscordWebhook) postDebugDiscord('DBG', msg);
                    } catch (err) {
                        let msg = err + '';
                        error(msg);
                        if (ENV.useDiscordWebhook) postDebugDiscord('DBG', msg);
                    }
                } else {
                    let msg = '/' + cmd + ' is not an existing command. Try /help for help';
                    error(msg);
                    if (ENV.useDiscordWebhook) postDebugDiscord('DBG', msg);
                }
            } catch (err) {
                error(err);
            }
        } else {
            try {
                appendLog(getTimeStamp() + 'SERVER: ' + input, 'log');
                if (ENV.useDiscordWebhook) postDebugDiscord('DBG', 'SERV-> ' + input);
                let msg = eval(input);
                if (msg === undefined || msg === null) msg = 'Successfully executed command';
                else msg = msg.toString();
                logColor(msg, '\x1b[33m', 'log');
                if (ENV.useDiscordWebhook) postDebugDiscord('DBG', msg);
            } catch (err) {
                error(err);
            }
        }
    } else if (input == '') {
        process.stdout.write('\x1b[1A\x1b[2C');
    }
});
async function stop() {
    if (active) {
        active = false;
        insertChat('[!] SERVER IS CLOSING [!]', 'server');
        logColor('Stopping Server...', '\x1b[32m', 'log');
        clearInterval(updateTicks);
        clearInterval(autoSave);
        started = false;
        for (let i in Player.list) {
            await Player.list[i].disconnect();
        }
        await ACCOUNTS.disconnect();
        server.close();
        logColor('Server Stopped.', '\x1b[32m', 'log')
        appendLog('----------------------------------------');
        process.stdout.write('\x1b[1A');
        process.exit(0);
    }
}
prompt.on('close', async function() {
    if (process.env.PORT == null) await stop();
});
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
process.on('SIGQUIT', stop);
process.on('SIGILL', stop);
process.stdout.write('\x1b[?25h');

// Tickrate
TPS = 0;
let tpsTimes = [];
let consecutiveTimeouts = 0;
TICKTIME = 0;
const update = ('var fn = new Function("return ' + function() {
    const pack = Entity.update();
    for (let i in Player.list) {
        let localplayer = Player.list[i];
        if (localplayer.name) {
            const localpack = {};
            localpack.players = pack.players;
            localpack.particles = pack.particles;
            for (let j in pack) {
                if (j != 'players' && j != 'particles' && j != 'droppedItems') {
                    localpack[j] = [];
                    if (pack[j][localplayer.map]) {
                        for (let y = localplayer.chunky-localplayer.renderDistance; y <= localplayer.chunky+localplayer.renderDistance; y++) {
                            if (pack[j][localplayer.map][y]) {
                                for (let x = localplayer.chunkx-localplayer.renderDistance; x <= localplayer.chunkx+localplayer.renderDistance; x++) {
                                    if (pack[j][localplayer.map][y][x]) localpack[j].push(...pack[j][localplayer.map][y][x]);
                                }
                            }
                        }
                    }
                } else if (j == 'droppedItems') {
                    localpack[j] = [];
                    if (pack[j][localplayer.map]) {
                        for (let y = localplayer.chunky-localplayer.renderDistance; y <= localplayer.chunky+localplayer.renderDistance; y++) {
                            if (pack[j][localplayer.map][y]) {
                                for (let x = localplayer.chunkx-localplayer.renderDistance; x <= localplayer.chunkx+localplayer.renderDistance; x++) {
                                    if (pack[j][localplayer.map][y][x]) for (let item of pack[j][localplayer.map][y][x]) {
                                        if (item && (item.playerId === localplayer.id || item.playerId == null)) localpack[j].push(item);
                                    }
                                }
                            }
                        }
                    }
                }
            }
            localplayer.socket.emit('updateTick', localpack);
        }
    }
    const debugPack = Entity.getDebugData();
    let heapSize = Math.round(process.memoryUsage().heapUsed/1048576*100)/100;
    let heapMax = Math.round(process.memoryUsage().rss/1048576*100)/100;
    for (let i in Player.list) {
        let localplayer = Player.list[i];
        if (localplayer.name && localplayer.debugEnabled) {
            const localpack = {};
            localpack.players = debugPack.players;
            for (let j in debugPack) {
                if (j != 'players' && j != 'particles') {
                    localpack[j] = [];
                    if (debugPack[j][localplayer.map]) {
                        for (let y = localplayer.chunky-localplayer.renderDistance; y <= localplayer.chunky+localplayer.renderDistance; y++) {
                            if (debugPack[j][localplayer.map][y]) {
                                for (let x = localplayer.chunkx-localplayer.renderDistance; x <= localplayer.chunkx+localplayer.renderDistance; x++) {
                                    if (debugPack[j][localplayer.map][y][x]) localpack[j].push(...debugPack[j][localplayer.map][y][x]);
                                }
                            }
                        }
                    }
                }
            }
            localplayer.socket.emit('debugTick', {
                data: localpack,
                tps: TPS,
                tickTime: TICKTIME,
                heapSize: heapSize,
                heapMax: heapMax
            });
        }
    }
    GaruderWarp.updateTriggers();
}.toString() + '")();fn();').replaceAll('\n', '').replaceAll('\r', '').replaceAll('    ', '');
const updateTicks = setInterval(function() {
    if (started) {
        var start = performance.now();
        try {
            vm.runInThisContext(update, {timeout: 1000});
            consecutiveTimeouts = 0;
        } catch (err) {
            if (err instanceof Error && err.message.includes('Script execution timed out')) {
                insertChat('[!] Server tick timed out! [!]', 'error');
                error('Server tick timed out!');
                consecutiveTimeouts++;
                if (consecutiveTimeouts > 6) {
                    insertChat('[!] Internal server error! Resetting server... [!]', 'error');
                    error('Internal server error! Resetting server...');
                    Monster.list = [];
                    Projectile.list = [];
                    DroppedItem.list = [];
                    Particle.list = [];
                    MAPS.reload();
                }
                if (consecutiveTimeouts > 5) {
                    insertChat('[!] Internal server error! Removing projectiles... [!]', 'error');
                    error('Internal server error! Removing projectiles...');
                    Projectile.list = [];
                    for (let map in Projectile.chunks) {
                        Projectile.chunks[map] = [];
                    }
                }
                if (consecutiveTimeouts > 4) {
                    insertChat('[!] Internal server error! Killing all monsters... [!]', 'error');
                    error('Internal server error! Killing all monsters...');
                    for (let i in Monster.list) {
                        Monster.list[i].onDeath();
                    }
                }
            } else {
                forceQuit(err, 1);
            }
        }
        TICKTIME = Math.round((performance.now()-start)*100)/100;
        tpsTimes.push(performance.now());
        while (performance.now()-tpsTimes[0] > 1000) tpsTimes.shift();
        TPS = tpsTimes.length;
    }
}, 1000/20);

// autosave
const autoSave = setInterval(function() {
    for (let i in Player.list) {
        if (Player.list[i].name) Player.list[i].saveData();
    }
}, ENV.autoSaveInterval*60000);

// critical errors
var quitting = false;
forceQuit = async function(err, code) {
    if (!quitting) {
        try {
            quitting = true;
            error('SERVER ENCOUNTERED A CATASTROPHIC ERROR. STOP CODE:');
            console.error(err);
            appendLog(err, 'error');
            if (err instanceof Error) appendLog(err.stack, 'error');
            insertChat('[!] SERVER ENCOUNTERED A CATASTROPHIC ERROR. [!]', 'error');
            if (err instanceof Error && !err.message.includes('https://discord.com/api/webhooks/')) insertChat(err.message, 'error');
            else insertChat(err, 'error');
            appendLog('Error code ' + code, 'error');
            appendLog('Environment versions:');
            for (let i in process.versions) {
                appendLog(i + ': ' + process.versions[i], 'error');
            }
            error('STOP.');
            clearInterval(updateTicks);
            clearInterval(autoSave);
            for (let i in Player.list) {
                await Player.list[i].disconnect();
            }
            started = false;
            await ACCOUNTS.disconnect();
            server.close();
            active = false;
            console.error('\x1b[33mIf this issue persists, consult README.md for troubleshooting information.\x1b[0m');
            console.error('\x1b[33mPress ENTER or CTRL+C to exit.\x1b[0m');
            const stopprompt = readline.createInterface({input: process.stdin, output: process.stdout});
            stopprompt.on('line', function(input) {
                appendLog('----------------------------------------');
                process.exit(code);
            });
            stopprompt.on('close', function() {
                appendLog('----------------------------------------');
                process.exit(code);
            });
            if (process.env.PORT) {
                log('Heroku server detected, automatically stopping server.');
                appendLog('----------------------------------------');
                process.exit(code);
            }
            if (process.env.REPL_OWNER) {
                log('Repl detected, automatically stopping server.');
                appendLog('----------------------------------------');
                process.exit(code);
            }
        } catch (err) {
            forceQuit(err, 1);
        }
    } else {
        console.error('\x1b[31mThere was an error trying to stop the server!\x1b[0m');
        console.error(err);
        process.exit(code);
    }
};
process.on('uncaughtException', function(err) {
    forceQuit(err, 1);
});

// profanity filter
Filter = {
    words: ['shole', 'hhole', 'ass', 'bastard', 'basterd', 'bitch', 'bich', 'beetch', 'blowjob', 'blow job', 'boob', 'butthole', 'butth0le', 'buthole', 'buth0le', 'clit', 'cock', 'cokk', 'cawk', 'cowk', 'cawc', 'cowc', 'clit', 'cnt', 'crap', ' cum', 'cum ', 'dildo', 'dilldo', 'dominatrix', 'dominatric', 'dominatrik', 'enema', 'fuc', 'fuk', 'foc', 'fok', 'phuc', 'phuk', 'fag', 'faig', 'hoor', 'hor', 'hoar', 'haor', 'jackoff', 'jap', 'jerkoff', 'jisim', 'jism', 'jsm', 'jizim', 'jizm', 'jzm', 'gisim', 'gism', 'gsm', 'gizim', 'gizm', 'gzm', 'knob', 'nob', 'cunt', 'kunt', 'masochist', 'masokist', 'masocist', 'masturbat', 'masterbat', 'masturbait', 'masterbait', 'massturbat', 'massterbat', 'massturbait', 'massterbait', 'mastrbat', 'mastrbait', 'nigger', 'niger', 'niggur', 'nigur', 'niggr', 'nigr', 'orgasm', 'orgasim', 'orgasum', 'orifice', 'orafis', 'orifiss', 'orafiss', 'packie', 'packi', 'packy', 'pakie', 'paki', 'paky', 'pecker', 'peker', 'penis', 'penus', 'penas', 'peenis', 'peenus', 'peenas', 'peeenis', 'peeenus', 'peeenas', 'pinis', 'pinus', 'pinas', 'peniis', 'penuus', 'penaas', 'peeniis', 'peenuus', 'peenaas', 'peeeniis', 'peeenuus', 'peeenaas', 'polac', 'polak', 'pric', 'prik', 'puss', 'rectum', 'rektum', 'recktum', 'retard', 'sadist', 'scank', 'schlong', 'sclong', 'shlong', 'screwin', 'skrewin', 'semen', 'seemen', 'sex', 'secks', 'seks', 'shit', 'shat', 'shiit', 'shaat', 'shyt', 'shyyt', 'skanc', 'skank', 'scanc', 'scank', 'slag', 'slut', 'tit', 'turd', 'vagina', 'vagiina', 'vaigina', 'vaigiina', 'vajina', 'vajiina', 'vaijina', 'vaijiina', 'vulva', 'vullva' , 'whor', 'whoar', 'wop', 'xrated', 'xxx'],
    check: function(string) {
        if (typeof string == 'string') {
            let checkstring = string.toLowerCase();
            checkstring = checkstring.replaceAll(' ', '');
            checkstring = checkstring.replaceAll('.', '');
            checkstring = checkstring.replaceAll('_', '');
            checkstring = checkstring.replaceAll('-', '');
            checkstring = checkstring.replaceAll('+', '');
            checkstring = checkstring.replaceAll('⠀', '');
            checkstring = checkstring.replaceAll('\'', '');
            checkstring = checkstring.replaceAll('"', '');
            checkstring = checkstring.replaceAll('!', 'i');
            checkstring = checkstring.replaceAll('@', 'a');
            checkstring = checkstring.replaceAll('$', 's');
            checkstring = checkstring.replaceAll('0', 'o');
            checkstring = checkstring.replaceAll('()', 'o');
            checkstring = checkstring.replaceAll('[]', 'o');
            checkstring = checkstring.replaceAll('{}', 'o');
            checkstring = checkstring.replaceAll('|', 'i');
            checkstring = checkstring.replaceAll('/', 'i');
            checkstring = checkstring.replaceAll('\\', 'i');
            checkstring = checkstring.replaceAll('hs', 'sh');
            checkstring = checkstring.replaceAll('hc', 'ch');
            for (let i in Filter.words) {
                if (checkstring.includes(Filter.words[i])) return true;
            }
            return false;
        }
        return true;
    }
};

start();