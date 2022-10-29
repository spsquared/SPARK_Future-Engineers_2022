// Copyright (C) 2022 Radioactive64

const PF = require('pathfinding');
const msgpack = require('@ygoe/msgpack');
const fs = require('fs');

Collision = function Collision(map, x, y, layer, type) {
    var coltype = 0;
    switch (type) {
        case -1:
            coltype = 0;
            break;
        case 2121:
            coltype = 1;
            break;
        case 2122:
            coltype = 2;
            break;
        case 2123:
            coltype = 3;
            break;
        case 2124:
            coltype = 4;
            break;
        case 2125:
            coltype = 5;
            break;
        case 2126:
            coltype = 6;
            break;
        case 2127:
            coltype = 7;
            break;
        case 2128:
            coltype = 8;
            break;
        case 2129:
            coltype = 9;
            break;
        case 2207:
            coltype = 10;
            break;
        case 2208:
            coltype = 11;
            break;
        case 2209:
            coltype = 12;
            break;
        case 2210:
            coltype = 13;
            break;
        case 2211:
            coltype = 14;
            break;
        case 2212:
            coltype = 15;
            break;
        case 2213:
            coltype = 16;
            break;
        case 2214:
            coltype = 17;
            break;
        case 2215:
            coltype = 18;
            break;
        // no projectile collision
        case 2293:
            coltype = 19;
            break;
        case 2294:
            coltype = 20;
            break;
        case 2295:
            coltype = 21;
            break;
        case 2296:
            coltype = 22;
            break;
        case 2297:
            coltype = 23;
            break;
        case 2298:
            coltype = 24;
            break;
        case 2299:
            coltype = 25;
            break;
        case 2300:
            coltype = 26;
            break;
        case 2301:
            coltype = 27;
            break;
        case 2379:
            coltype = 28;
            break;
        case 2380:
            coltype = 29;
            break;
        case 2381:
            coltype = 30;
            break;
        case 2382:
            coltype = 31;
            break;
        case 2383:
            coltype = 32;
            break;
        case 2384:
            coltype = 33;
            break;
        case 2385:
            coltype = 34;
            break;
        case 2386:
            coltype = 35;
            break;
        case 2387:
            coltype = 36;
            break;
        case 1949:
            new Layer(map, x, y, layer, 1);
            return;
        case 1950:
            new Layer(map, x, y, layer, 2);
            return;
        case 1951:
            new Layer(map, x, y, layer, 3);
            return;
        case 1952:
            new Layer(map, x, y, layer, 4);
            return;
        case 1953:
            new Layer(map, x, y, layer, 5);
            return;
        case 2035:
            new Layer(map, x, y, layer, 6);
            return;
        case 2036:
            new Layer(map, x, y, layer, 7);
            return;
        case 2037:
            new Layer(map, x, y, layer, 8);
            return;
        case 2038:
            new Layer(map, x, y, layer, 9);
            return;
        case 2039:
            new Layer(map, x, y, layer, 10);
            return;
        case 2130:
            coltype = 3;
            new Layer(map, x, y, layer, 2);
            break;
        case 2131:
            coltype = 2;
            new Layer(map, x, y, layer, 3);
            break;
        case 2132:
            coltype = 5;
            new Layer(map, x, y, layer, 4);
            break;
        case 2133:
            coltype = 4;
            new Layer(map, x, y, layer, 5);
            break;
        case 2216:
            coltype = 3;
            new Layer(map, x, y, layer, 7);
            break;
        case 2217:
            coltype = 2;
            new Layer(map, x, y, layer, 8);
            break;
        case 2218:
            coltype = 5;
            new Layer(map, x, y, layer, 9);
            break;
        case 2219:
            coltype = 4;
            new Layer(map, x, y, layer, 10);
            break;
        case 2302:
            coltype = 19;
            new Layer(map, x, y, layer, 2);
            break;
        case 2303:
            coltype = 18;
            new Layer(map, x, y, layer, 3);
            break;
        case 2304:
            coltype = 21;
            new Layer(map, x, y, layer, 4);
            break;
        case 2305:
            coltype = 20;
            new Layer(map, x, y, layer, 5);
            break;
        case 2388:
            coltype = 19;
            new Layer(map, x, y, layer, 7);
            break;
        case 2389:
            coltype = 18;
            new Layer(map, x, y, layer, 8);
            break;
        case 2390:
            coltype = 21;
            new Layer(map, x, y, layer, 9);
            break;
        case 2391:
            coltype = 20;
            new Layer(map, x, y, layer, 10);
            break;
        default:
            error('Invalid collision at (' + map + ', ' + layer + ', ' + x + ', ' + y + ')');
            break;
    }

    if (Collision.grid[map][parseInt(layer)][parseInt(y)] == null) {
        Collision.grid[map][parseInt(layer)][parseInt(y)] = [];
    }
    Collision.grid[map][parseInt(layer)][parseInt(y)][parseInt(x)] = coltype;
    return coltype;
};
Collision.getColEntity = function getColEntity(map, x, y, layer) {
    let collision = [];
    let coltype = 0;
    if (Collision.grid[map] && Collision.grid[map][layer] && Collision.grid[map][layer][y] && Collision.grid[map][layer][y][x]) coltype = Collision.grid[map][layer][y][x];
    let noProjectile = false;
    if (coltype > 18) {
        noProjectile = true;
        coltype -= 18;
    }
    switch (coltype) {
        case 0:
            break;
        case 1:
            collision[0] = {
                map: map,
                x: x*64+32,
                y: y*64+32,
                width: 64,
                height: 64,
                collisionBoxSize: 64,
                noProjectile: noProjectile
            };
            break;
        case 2:
            collision[0] = {
                map: map,
                x: x*64+32,
                y: y*64+48,
                width: 64,
                height: 32,
                collisionBoxSize: 64,
                noProjectile: noProjectile
            };
            break;
        case 3:
            collision[0] = {
                map: map,
                x: x*64+32,
                y: y*64+16,
                width: 64,
                height: 32,
                collisionBoxSize: 64,
                noProjectile: noProjectile
            };
            break;
        case 4:
            collision[0] = {
                map: map,
                x: x*64+16,
                y: y*64+32,
                width: 32,
                height: 64,
                collisionBoxSize: 64,
                noProjectile: noProjectile
            };
            break;
        case 5:
            collision[0] = {
                map: map,
                x: x*64+48,
                y: y*64+32,
                width: 32,
                height: 64,
                collisionBoxSize: 64,
                noProjectile: noProjectile
            };
            break;
        case 6:
            collision[0] = {
                map: map,
                x: x*64+32,
                y: y*64+48,
                width: 64,
                height: 32,
                collisionBoxSize: 64,
                noProjectile: noProjectile
            };
            collision[1] = {
                map: map,
                x: x*64+48,
                y: y*64+32,
                width: 32,
                height: 64,
                collisionBoxSize: 64,
                noProjectile: noProjectile
            };
            break;
        case 7:
            collision[0] = {
                map: map,
                x: x*64+32,
                y: y*64+16,
                width: 64,
                height: 32,
                collisionBoxSize: 64,
                noProjectile: noProjectile
            };
            collision[1] = {
                map: map,
                x: x*64+16,
                y: y*64+32,
                width: 32,
                height: 64,
                collisionBoxSize: 64,
                noProjectile: noProjectile
            };
            break;
        case 8:
            collision[0] = {
                map: map,
                x: x*64+32,
                y: y*64+16,
                width: 64,
                height: 32,
                collisionBoxSize: 64,
                noProjectile: noProjectile
            };
            collision[1] = {
                map: map,
                x: x*64+48,
                y: y*64+32,
                width: 32,
                height: 64,
                collisionBoxSize: 64,
                noProjectile: noProjectile
            };
            break;
        case 9:
            collision[0] = {
                map: map,
                x: x*64+32,
                y: y*64+48,
                width: 64,
                height: 32,
                collisionBoxSize: 64,
                noProjectile: noProjectile
            };
            collision[1] = {
                map: map,
                x: x*64+16,
                y: y*64+32,
                width: 32,
                height: 64,
                collisionBoxSize: 64,
                noProjectile: noProjectile
            };
            break;
        case 10:
            collision[0] = {
                map: map,
                x: x*64+32,
                y: y*64+32,
                width: 32,
                height: 64,
                collisionBoxSize: 64,
                noProjectile: noProjectile
            };
            break;
        case 11:
            collision[0] = {
                map: map,
                x: x*64+16,
                y: y*64+48,
                width: 32,
                height: 32,
                collisionBoxSize: 32,
                noProjectile: noProjectile
            };
            break;
        case 12:
            collision[0] = {
                map: map,
                x: x*64+48,
                y: y*64+48,
                width: 32,
                height: 32,
                collisionBoxSize: 32,
                noProjectile: noProjectile
            };
            break;
        case 13:
            collision[0] = {
                map: map,
                x: x*64+48,
                y: y*64+16,
                width: 32,
                height: 32,
                collisionBoxSize: 32,
                noProjectile: noProjectile
            };
            break;
        case 14:
            collision[0] = {
                map: map,
                x: x*64+16,
                y: y*64+16,
                width: 32,
                height: 32,
                collisionBoxSize: 32,
                noProjectile: noProjectile
            };
            break;
        case 15:
            collision[0] = {
                map: map,
                x: x*64+32,
                y: y*64+40,
                width: 48,
                height: 48,
                collisionBoxSize: 48,
                noProjectile: noProjectile
            };
            break;
        case 16:
            collision[0] = {
                map: map,
                x: x*64+32,
                y: y*64+36,
                width: 48,
                height: 56,
                collisionBoxSize: 56,
                noProjectile: noProjectile
            };
            break;
        case 17:
            collision[0] = {
                map: map,
                x: x*64+32,
                y: y*64+40,
                width: 64,
                height: 40,
                collisionBoxSize: 64,
                noProjectile: noProjectile
            };
            break;
        case 18:
            collision[0] = {
                map: map,
                x: x*64+32,
                y: y*64+8,
                width: 64,
                height: 40,
                collisionBoxSize: 64,
                noProjectile: noProjectile
            };
            break;
        default:
            error('Invalid collision ' + coltype + ' at (' + map + ',' + layer + ',' + x + ',' + y + ')');
            break;
    }
    
    return collision;
};
Collision.grid = [];

Layer = function Layer(map, x, y, layer, type) {
    if (Layer.grid[map][parseInt(layer)][parseInt(y)] == null) {
        Layer.grid[map][parseInt(layer)][parseInt(y)] = [];
    }
    Layer.grid[map][parseInt(layer)][parseInt(y)][parseInt(x)] = type;
    return type;
};
Layer.getColEntity = function getColEntity(map, x, y, layer) {
    let collision = [];
    let coltype = 0;
    if (Layer.grid[map] && Layer.grid[map][layer] && Layer.grid[map][layer][y] && Layer.grid[map][layer][y][x]) coltype = Layer.grid[map][layer][y][x];
    let dir = 1;
    if (coltype > 5) {
        dir = -1;
        coltype -= 5;
    }
    switch (coltype) {
        case 0:
            break;
        case 1:
            collision[0] = {
                map: map,
                x: x*64+32,
                y: y*64+32,
                width: 64,
                height: 64,
                collisionBoxSize: 64,
                dir: dir
            };
            break;
        case 2:
            collision[0] = {
                map: map,
                x: x*64+32,
                y: y*64+48,
                width: 64,
                height: 32,
                collisionBoxSize: 64,
                dir: dir
            };
            break;
        case 3:
            collision[0] = {
                map: map,
                x: x*64+32,
                y: y*64+16,
                width: 64,
                height: 32,
                collisionBoxSize: 64,
                dir: dir
            };
            break;
        case 4:
            collision[0] = {
                map: map,
                x: x*64+16,
                y: y*64+32,
                width: 32,
                height: 64,
                collisionBoxSize: 64,
                dir: dir
            };
            break;
        case 5:
            collision[0] = {
                map: map,
                x: x*64+48,
                y: y*64+32,
                width: 32,
                height: 64,
                collisionBoxSize: 64,
                dir: dir
            };
            break;
        default:
            error('Invalid layer ' + coltype + 'at (' + map + ',' + layer + ',' + x + ',' + y + ')');
            break;
    }
    
    return collision;
};
Layer.getColDir = function getColDir(map, x, y, layer) {
    let coltype = 0;
    if (Layer.grid[map] && Layer.grid[map][layer] && Layer.grid[map][layer][y] && Layer.grid[map][layer][y][x]) coltype = Layer.grid[map][layer][y][x];
    if (coltype > 5) return -1;
    return 1;
};
Layer.init = async function() {
    for (let map in Layer.grid) {
        let s = Layer.loadCache(map);
        if (s) {
            Layer.lazyInitQueue.push(map);
        } else {
            await Layer.generateGraphs(map, false);
            await Layer.generateLookupTables(map, false);
            Layer.writeCache(map);
        }
    }
};
Layer.lazyInit = async function lazyInit() {
    while (Layer.lazyInitQueue.length) {
        await Layer.generateGraphs(Layer.lazyInitQueue[0], true);
        await Layer.generateLookupTables(Layer.lazyInitQueue[0], true);
        Layer.writeCache(Layer.lazyInitQueue[0]);
        Layer.lazyInitQueue.shift();
    }
};
Layer.loadCache = function loadCache(map) {
    let exists = fs.existsSync('./server/cache/' + map + '.cache');
    if (exists) {
        try {
            let bytes = fs.readFileSync('./server/cache/' + map + '.cache');
            let data = msgpack.deserialize(bytes);
            Layer.graph[map] = data.graph;
            Layer.lookupTable[map] = data.table;
            return true;
        } catch (err) {
            forceQuit(err, 4);
        }
    }
    return false;
};
Layer.writeCache = function writeCache(map) {
    try {
        let bytes = msgpack.serialize({graph: Layer.graph[map], table: Layer.lookupTable[map]});
        if (!fs.existsSync('./server/cache')) fs.mkdirSync('./server/cache');
        fs.writeFileSync('./server/cache/' + map + '.cache', bytes, {flag: 'w'});
    } catch (err) {
        forceQuit(err, 4);
    }
};
Layer.generateGraphs = async function generateGraphs(map, lazy) {
    const pathfinder = new PF.JumpPointFinder(PF.JPFMoveDiagonallyIfNoObstacles);
    // create layer lists grouped by layer
    const layers = [];
    for (let z in Layer.grid[map]) {
        layers[z] = [];
        for (let y in Layer.grid[map][z]) {
            for (let x in Layer.grid[map][z][y]) {
                if (Layer.grid[map][z][y][x]) {
                    layers[z].push({
                        x: parseInt(x)-Collision.grid[map].offsetX,
                        y: parseInt(y)-Collision.grid[map].offsetY,
                        z: parseInt(z),
                        dir: Layer.getColDir(map, parseInt(x), parseInt(y), parseInt(z)),
                        connections: [],
                        attempts: []
                    });
                }
            }
            if (lazy) await sleep(1);
        }
    }

    // create grids by layer
    const grids = [];
    for (let z in layers) {
        const grid = new PF.Grid(Collision.grid[map].width, Collision.grid[map].height);
        for (let y in Collision.grid[map][z]) {
            for (let x in Collision.grid[map][z][y]) {
                if (Collision.grid[map][z][y][x]) {
                    if (parseInt(x)-Collision.grid[map].offsetX >= 0 && parseInt(x)-Collision.grid[map].offsetX < Collision.grid[map].width && parseInt(y)-Collision.grid[map].offsetY >= 0 && parseInt(y)-Collision.grid[map].offsetY < Collision.grid[map].height) {
                        grid.setWalkableAt(parseInt(x)-Collision.grid[map].offsetX, parseInt(y)-Collision.grid[map].offsetY, false);
                    }
                }
            }
            if (lazy) await sleep(1);
        }
        grids[z] = grid;
    }

    // find connected tiles
    for (let z in layers) {
        for (let l1 in layers[z]) {
            // enumerate all layers after change in layer
            let z2 = layers[z][l1].z+layers[z][l1].dir;
            if (layers[z2]) {
                for (let l2 in layers[z2]) {
                    // ignore if already done
                    if (layers[z][l1].attempts.indexOf(layers[z2][l2]) == -1) {
                        layers[z][l1].attempts.push(layers[z2][l2]);
                        layers[z2][l2].attempts.push(layers[z][l1]);
                        // find distance
                        let grid2 = grids[layers[z][l1].z+layers[z][l1].dir].clone();
                        let path = pathfinder.findPath(layers[z][l1].x, layers[z][l1].y, layers[z2][l2].x, layers[z2][l2].y, grid2);
                        if (path[0]) {
                            // layers are connected, add to both lists (undirected graph) to avoid recalculation
                            layers[z][l1].connections.push({
                                node: layers[z2][l2],
                                distance: path.length
                            });
                            layers[z2][l2].connections.push({
                                node: layers[z][l1],
                                distance: path.length
                            });
                        }
                    }
                }
                if (lazy) await sleep(1);
            }
        }
    }

    // convert to grid-layout graph
    const graph = [];
    for (let z in layers) {
        graph[z] = [];
        for (let i in layers[z]) {
            let x = layers[z][i].x+Collision.grid[map].offsetX;
            let y = layers[z][i].y+Collision.grid[map].offsetY;
            // connection list
            let connections = [];
            for (let connection of layers[z][i].connections) {
                connections.push({
                    x: connection.node.x+Collision.grid[map].offsetX,
                    y: connection.node.y+Collision.grid[map].offsetY,
                    distance: connection.distance
                });
            }
            if (graph[z][y] == null) graph[z][y] = [];
            graph[z][y][x] = {
                x: x,
                y: y,
                layer: layers[z][i].z,
                dir: layers[z][i].dir,
                parent: null,
                connections: connections,
                f: 0,
                g: 0,
                h: 0,
                visited: false,
                closed: false
            };
        }
        if (lazy) await sleep(1);
    }
    
    Layer.graph[map] = graph;
};
Layer.generateLookupTables = async function generateLookupTables(map, lazy) {
    const pathfinder = new PF.JumpPointFinder(PF.JPFMoveDiagonallyIfNoObstacles);

    // create grids by layer
    const grids = [];
    for (let z in Layer.grid) {
        const grid = new PF.Grid(Collision.grid[map].width, Collision.grid[map].height);
        for (let y in Collision.grid[map][z]) {
            for (let x in Collision.grid[map][z][y]) {
                if (Collision.grid[map][z][y][x]) {
                    if (parseInt(x)-Collision.grid[map].offsetX >= 0 && parseInt(x)-Collision.grid[map].offsetX < Collision.grid[map].width && parseInt(y)-Collision.grid[map].offsetY >= 0 && parseInt(y)-Collision.grid[map].offsetY < Collision.grid[map].height) {
                        grid.setWalkableAt(parseInt(x)-Collision.grid[map].offsetX, parseInt(y)-Collision.grid[map].offsetY, false);
                    }
                }
            }
            if (lazy) await sleep(1);
        }
        grids[z] = grid;
    }

    // create table
    const table = [];
    for (let z in Collision.grid[map]) {
        table[parseInt(z)] = [];
        for (let y in Collision.grid[map][z]) {
            table[parseInt(z)][parseInt(y)] = [];
            for (let x in Collision.grid[map][z][y]) {
                table[parseInt(z)][parseInt(y)][parseInt(x)] = [];
                    // since it's parsed top down, left to right
                    // if the neighbor to the left or top has connections
                    // then this tile has the same connections
                    for (let y2 in Layer.grid[map][z]) {
                        for (let x2 in Layer.grid[map][z][y2]) {
                            if (Layer.grid[map][z][y2][x2]) {
                            }
                        }
                    }
                }
            if (lazy) await sleep(1);
        }
    }

    Layer.lookupTable[map] = table;
};
Layer.grid = [];
Layer.graph = [];
Layer.lookupTable = [];
Layer.lazyInitQueue = [];

Slowdown = function Slowdown(map, x, y, type) {
    let coltype = 0;
    switch (type) {
        case -1:
            break;
        case 2465:
            coltype = 1;
            break;
        case 2466:
            coltype = 2;
            break;
        case 2467:
            coltype = 3;
            break;
        case 2468:
            coltype = 4;
            break;
        case 2469:
            coltype = 5;
            break;
        default:
            error('Invalid slowdown at (' + map + ', ' + x + ', ' + y + ')');
            break;
    }

    if (Slowdown.grid[map][parseInt(y)] == null) {
        Slowdown.grid[map][parseInt(y)] = [];
    }
    Slowdown.grid[map][parseInt(y)][parseInt(x)] = coltype;
    return coltype;
};
Slowdown.getColEntity = function getColEntity(map, x, y) {
    let collision = [];
    let coltype = 0;
    if (Slowdown.grid[map] && Slowdown.grid[map][y] && Slowdown.grid[map][y][x]) coltype = Slowdown.grid[map][y][x];
    switch (coltype) {
        case 0:
            break;
        case 1:
            collision[0] = {
                map: map,
                x: x*64+32,
                y: y*64+32,
                width: 64,
                height: 64,
                collisionBoxSize: 64,
            };
            break;
        case 2:
            collision[0] = {
                map: map,
                x: x*64+32,
                y: y*64+48,
                width: 64,
                height: 32,
                collisionBoxSize: 64,
            };
            break;
        case 3:
            collision[0] = {
                map: map,
                x: x*64+32,
                y: y*64+16,
                width: 64,
                height: 32,
                collisionBoxSize: 64,
            };
            break;
        case 4:
            collision[0] = {
                map: map,
                x: x*64+16,
                y: y*64+32,
                width: 32,
                height: 64,
                collisionBoxSize: 64,
            };
            break;
        case 5:
            collision[0] = {
                map: map,
                x: x*64+48,
                y: y*64+32,
                width: 32,
                height: 64,
                collisionBoxSize: 64,
            };
            break;
        default:
            error('Invalid slowdown ' + coltype + 'at (' + map + ',' + layer + ',' + x + ',' + y + ')');
            break;
    }
    
    return collision;
};
Slowdown.grid = [];

Spawner = function Spawner(map, x, y, layer, types) {
    const self = {
        x: x*64+32,
        y: y*64+32,
        map: map,
        layer: parseInt(layer),
        types: types
    };

    self.spawnMonster = function spawnMonster() {
        try {
            let multiplier = 0;
            for (let id of Array.from(self.types)) multiplier += Monster.types[id].spawnChance;
            let random = Math.random()*multiplier;
            let min = 0;
            let max = 0;
            let monstertype;
            for (let id of self.types) {
                max += Monster.types[id].spawnChance;
                if (random >= min && random <= max) {
                    monstertype = id;
                    break;
                }
                min += Monster.types[id].spawnChance;
            }
            for (let i = 0; i < 50; i++) {
                new Particle(self.map, self.x, self.y, 'spawn');
            }
            let localmonster = new Monster(monstertype, self.x, self.y, self.map, self.layer);
            const onDeath = localmonster.onDeath;
            localmonster.onDeath = function modified_onDeath(entity, type) {
                onDeath(entity, type);
                try {
                    self.onMonsterDeath();
                } catch (err) {
                    error(err);
                }
            };
            localmonster.canMove = false;
            setTimeout(function() {
                localmonster.canMove = true;
            }, 3000);
        } catch (err) {
            error(err);
        }
    };
    self.onMonsterDeath = function onMonsterDeath() {
        let time = Math.random()*10000+10000;
        setTimeout(function() {
            self.spawnMonster();
        }, time);
    };

    Spawner.list.push(self);
    return self;
};
BossSpawner = function BossSpawner(map, x, y, layer, id) {
    const self = new Spawner(map, x, y, layer, [id]);

    self.onMonsterDeath = function onMonsterDeath() {
        let time = Math.random()*10000+60000;
        setTimeout(function() {
            let wait = setInterval(function() {
                if (Player.chunks[self.map]) {
                    let range = 2;
                    let chunkx = Math.floor(self.x/64/Collision.grid[self.map].chunkWidth);
                    let chunky = Math.floor(self.y/64/Collision.grid[self.map].chunkHeight);
                    for (let z in Player.chunks[self.map]) {
                        for (let y = chunky-range; y <= chunky+range; y++) {
                            for (let x = chunkx-range; x <= chunkx+range; x++) {
                                if (Player.chunks[self.map][z][y] && Player.chunks[self.map][z][y][x]) {
                                    for (let i in Player.chunks[self.map][z][y][x]) {
                                        if (Player.chunks[self.map][z][y][x][i] != null) {
                                            return;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                self.spawnMonster();
                clearInterval(wait);
            }, 1000);
        }, time);
    };
};
Spawner.init = function init() {
    for (let localspawner of Spawner.list) {
        localspawner.spawnMonster();
    }
};
Spawner.list = [];

Region = function Region(map, x, y, properties) {
    let data = {
        name: 'missing name',
        noattack: false,
        nomonster: false
    };
    for (let i in properties) {
        if (properties[i] == 'noattack') data.noattack = true;
        else if (properties[i] == 'nomonster') data.nomonster = true;
        else data.name = properties[i];
    }
    
    if (Region.grid[map][parseInt(y)] == null) {
        Region.grid[map][parseInt(y)] = [];
    }
    Region.grid[map][parseInt(y)][parseInt(x)] = data;
    return data;
};
Region.grid = [];

Teleporter = function Teleporter(map, x, y, properties) {
    let data = {
        map: properties[0],
        x: parseInt(properties[1]),
        y: parseInt(properties[2]),
        layer: parseInt(properties[3]),
        direction: properties[4]
    };

    if (Teleporter.grid[map][parseInt(y)] == null) {
        Teleporter.grid[map][parseInt(y)] = [];
    }
    Teleporter.grid[map][parseInt(y)][parseInt(x)] = data;
    return data;
};
Teleporter.grid = [];

GaruderWarp = {
    locations: [],
    triggers: [],
    addPosition: function addPosition(map, x, y, layer, id, tr) {
        GaruderWarp.locations[id] = {
            id: id,
            map: map,
            x: parseInt(x)*64+32,
            y: parseInt(y)*64+32,
            layer: parseInt(layer),
            triggerRadius: parseInt(tr)
        };
    },
    updateTriggers: function updateTriggers() {
        for (let i in GaruderWarp.locations) {
            let localwarp = GaruderWarp.locations[i];
            for (let j in Player.list) {
                let localplayer = Player.list[j];
                if (localplayer.garuderWarpPositions.indexOf(localwarp.id) == -1 && localplayer.map == localwarp.map && localplayer.getDistance(localwarp) < localwarp.triggerRadius*64) {
                    localplayer.garuderWarpPositions.push(localwarp.id);
                }
            }
        }
    }
};

EventTrigger = function EventTrigger(map, x, y, properties) {
    let data = {
        type: properties[0]
    }
};
EventTrigger.triggers = require('./triggers.json');

async function sleep(ms) {
    await new Promise((resolve, reject) => setTimeout(resolve, ms));
};