// Copyright (C) 2022 Radioactive64

const PF = require('pathfinding');
const fs = require('fs');

Collision = function(map, x, y, layer, type) {
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
    var collision = [];
    var coltype = 0;
    if (Collision.grid[map] && Collision.grid[map][layer] && Collision.grid[map][layer][y] && Collision.grid[map][layer][y][x]) coltype = Collision.grid[map][layer][y][x];
    var noProjectile = false;
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

Layer = function(map, x, y, layer, type) {
    if (Layer.grid[map][parseInt(layer)][parseInt(y)] == null) {
        Layer.grid[map][parseInt(layer)][parseInt(y)] = [];
    }
    Layer.grid[map][parseInt(layer)][parseInt(y)][parseInt(x)] = type;
    return type;
};
Layer.getColEntity = function getColEntity(map, x, y, layer) {
    var collision = [];
    var coltype = 0;
    if (Layer.grid[map] && Layer.grid[map][layer] && Layer.grid[map][layer][y] && Layer.grid[map][layer][y][x]) coltype = Layer.grid[map][layer][y][x];
    var dir = 1;
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
    var coltype = 0;
    if (Layer.grid[map] && Layer.grid[map][layer] && Layer.grid[map][layer][y] && Layer.grid[map][layer][y][x]) coltype = Layer.grid[map][layer][y][x];
    if (coltype > 5) return -1;
    return 1;
};
Layer.loadCache = function loadCache(map) {

};
Layer.writeCache = function writeCache(map) {

};
Layer.generateGraphs = function generateGraphs(map) {
    const pathfinder = new PF.JumpPointFinder(PF.JPFMoveDiagonallyIfNoObstacles);
    // create graphs
    var layers = [];
    for (var z in Layer.grid[map]) {
        layers[z] = [];
        for (var y in Layer.grid[map][z]) {
            for (var x in Layer.grid[map][z][y]) {
                if (Layer.grid[map][z][y][x]) {
                    layers[z].push({
                        x: parseInt(x)-Collision.grid[map].offsetX,
                        y: parseInt(y)-Collision.grid[map].offsetY,
                        z: parseInt(z),
                        dir: Layer.getColDir(map, parseInt(x), parseInt(y), parseInt(z)),
                        connections: [],
                        attempts: [],
                        distances: []
                    });
                }
            }
        }
    }
    // create grids
    var grids = [];
    for (var z in layers) {
        const grid = new PF.Grid(Collision.grid[map].width, Collision.grid[map].height);
        for (var y in Collision.grid[map][z]) {
            for (var x in Collision.grid[map][z][y]) {
                if (Collision.grid[map][z][y][x]) {
                    if (parseInt(x)-Collision.grid[map].offsetX >= 0 && parseInt(x)-Collision.grid[map].offsetX < Collision.grid[map].width && parseInt(y)-Collision.grid[map].offsetY >= 0 && parseInt(y)-Collision.grid[map].offsetY < Collision.grid[map].height) {
                        grid.setWalkableAt(parseInt(x)-Collision.grid[map].offsetX, parseInt(y)-Collision.grid[map].offsetY, false);
                    }
                }
            }
        }
        grids[z] = grid;
    }
    // find connected tiles
    for (var z in layers) {
        for (var l1 in layers[z]) {
            var z2 = layers[z][l1].z+layers[z][l1].dir;
            if (layers[z2]) {
                for (var l2 in layers[z2]) {
                    if (layers[z2][l2].z == layers[z][l1].z+layers[z][l1].dir && layers[z][l1].attempts.indexOf(layers[z2][l2]) == -1) {
                        layers[z][l1].attempts.push(layers[z2][l2]);
                        layers[z2][l2].attempts.push(layers[z][l1]);
                        var grid2 = grids[layers[z][l1].z+layers[z][l1].dir].clone();
                        var path = pathfinder.findPath(layers[z][l1].x, layers[z][l1].y, layers[z2][l2].x, layers[z2][l2].y, grid2);
                        if (path[0]) {
                            layers[z][l1].connections.push(layers[z2][l2]);
                            layers[z2][l2].connections.push(layers[z][l1]);
                            layers[z][l1].distances.push(path.length);
                            layers[z2][l2].distances.push(path.length);
                        }
                    }
                }
            }
        }
    }
    // convert to grid
    var graph = [];
    for (var z in layers) {
        graph[z] = [];
        for (var i in layers[z]) {
            if (graph[z][layers[z][i].y+Collision.grid[map].offsetY] == null) {
                graph[z][layers[z][i].y+Collision.grid[map].offsetY] = [];
            }
            graph[z][layers[z][i].y+Collision.grid[map].offsetY][layers[z][i].x+Collision.grid[map].offsetX] = {
                x: layers[z][i].x+Collision.grid[map].offsetX,
                y: layers[z][i].y+Collision.grid[map].offsetY,
                layer: parseInt(z),
                dir: Layer.getColDir(map, layers[z][i].x+Collision.grid[map].offsetX, layers[z][i].y+Collision.grid[map].offsetY, z),
                parent: null,
                connections: [],
                f: 0,
                g: 0,
                h: 0,
                visited: false,
                closed: false
            };
            for (var j in layers[z][i].connections) {
                graph[z][layers[z][i].y+Collision.grid[map].offsetY][layers[z][i].x+Collision.grid[map].offsetX].connections[j] = {
                    x: layers[z][i].connections[j].x+Collision.grid[map].offsetX,
                    y: layers[z][i].connections[j].y+Collision.grid[map].offsetY,
                    distance: layers[z][i].distances[j]
                };
            }
        }
    }
    
    Layer.graph[map] = graph;
};
Layer.generateLookupTables = function generateLookupTables(map) {
    var grid = [];
    for (var z in Collision.grid[map]) {
        grid[parseInt(z)] = [];
        for (var y in Collision.grid[map][z]) {
            grid[parseInt(z)][parseInt(y)] = [];
            for (var x in Collision.grid[map][z][y]) {
                if (parseInt(x)-Collision.grid[map].offsetX >= 0 && parseInt(x)-Collision.grid[map].offsetX < Collision.grid[map].width && parseInt(y)-Collision.grid[map].offsetY >= 0 && parseInt(y)-Collision.grid[map].offsetY < Collision.grid[map].height) {
                    var lowest = null;
                    for (var y2 in Layer.grid[map][z]) {
                        for (var x2 in Layer.grid[map][z][y2]) {
                            if (Layer.grid[map][z][y2][x2]) {
                                var distance = Math.pow(parseInt(x2)-parseInt(x), 2)+Math.pow(parseInt(y2)-parseInt(y), 2)
                                if (lowest == null || distance < lowest.distance) {
                                    lowest = {
                                        x: parseInt(x2),
                                        y: parseInt(y2),
                                        distance: distance
                                    };
                                    break;
                                }
                            }
                        }
                    }
                    if (lowest) grid[parseInt(z)][parseInt(y)][parseInt(x)] = lowest;
                    else grid[parseInt(z)][parseInt(y)][parseInt(x)] = {x: 0, y: 0, distance: 1000000};
                }
            }
        }
    }
    Layer.lookupTable[map] = grid;
};
Layer.grid = [];
Layer.graph = [];
Layer.lookupTable = [];

Slowdown = function(map, x, y, type) {
    var coltype = 0;
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
    var collision = [];
    var coltype = 0;
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

Spawner = function(map, x, y, layer, types) {
    var self = {
        id: null,
        x: x*64+32,
        y: y*64+32,
        map: map,
        layer: parseInt(layer),
        types: types
    };
    self.id = Math.random();

    self.spawnMonster = function spawnMonster() {
        try {
            var multiplier = 0;
            for (var i in self.types) {
                multiplier += Monster.types[self.types[i]].spawnChance;
            }
            var random = Math.random()*multiplier;
            var min = 0;
            var max = 0;
            var monstertype;
            for (var i in self.types) {
                max += Monster.types[self.types[i]].spawnChance;
                if (random >= min && random <= max) {
                    monstertype = self.types[i];
                    break;
                }
                min += Monster.types[self.types[i]].spawnChance;
            }
            for (var i = 0; i < 50; i++) {
                new Particle(self.map, self.x, self.y, 'spawn');
            }
            var localmonster = new Monster(monstertype, self.x, self.y, self.map, self.layer);
            localmonster.spawnerID = self.id;
            const onDeath = localmonster.onDeath;
            localmonster.onDeath = function modified_onDeath(entity, type) {
                onDeath(entity, type);
                try {
                    Spawner.list[localmonster.spawnerID].onMonsterDeath();
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
        var time = Math.random()*10000+10000;
        setTimeout(function() {
            self.spawnMonster();
        }, time);
    };

    Spawner.list[self.id] = self;
    return self;
};
Spawner.init = function init() {
    for (var i in Spawner.list) {
        Spawner.list[i].spawnMonster();
    }
};
Spawner.list = [];

Region = function(map, x, y, properties) {
    var data = {
        name: 'missing name',
        noattack: false,
        nomonster: false
    };
    for (var i in properties) {
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

Teleporter = function(map, x, y, properties) {
    var data = {
        x: 0,
        y: 0,
        map: 'World',
        layer: 0,
        direction: null
    };
    data.map = properties[0];
    data.x = parseInt(properties[1]);
    data.y = parseInt(properties[2]);
    data.layer = parseInt(properties[3]);
    data.direction = properties[4];

    if (Teleporter.grid[map][parseInt(y)] == null) {
        Teleporter.grid[map][parseInt(y)] = [];
    }
    Teleporter.grid[map][parseInt(y)][parseInt(x)] = data;
    return data;
};
Teleporter.grid = [];