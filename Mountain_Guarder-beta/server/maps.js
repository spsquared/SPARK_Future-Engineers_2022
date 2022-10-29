// Copyright (C) 2022 Radioactive64

MAPS = {
    loaded: false,
    load: async function load() {
        if (!MAPS.loaded) loadAll();
        MAPS.loaded = true;
    },
    reload: async function reload() {
        resetMaps();
    }
}

var npcWaypoints = {};
function loadAll() {
    loadMap('World');
    loadMap('Caves');
    loadMap('The Void');
    loadMap('Outpost Cottage 1');
    loadMap('Outpost Cottage 2');
    loadMap('Outpost Trader\'s Store');
    loadMap('Pingu\'s Cave');
    for (var i in Npc.list) {
        if (npcWaypoints[Npc.list[i].npcId]) {
            Npc.list[i].ai.idleWaypoints.waypoints = npcWaypoints[Npc.list[i].npcId];
        }
    }
    Spawner.init();
    Npc.init();
};
function loadMap(name) {
    var raw = require('./../client/maps/' + name + '.json');
    Collision.grid[name] = [];
    Layer.grid[name] = [];
    Region.grid[name] = [];
    Teleporter.grid[name] = [];
    Collision.grid[name].width = 0;
    Collision.grid[name].height = 0;
    Collision.grid[name].offsetX = 0;
    Collision.grid[name].offsetY = 0;
    Collision.grid[name].chunkWidth = 0;
    Collision.grid[name].chunkHeight = 0;
    Collision.grid[name].dark = false;
    for (var i in raw.layers) {
        if (raw.layers[i].name == 'Ground Terrain') {
            var rawlayer = raw.layers[i];
            Collision.grid[name].width = rawlayer.width;
            Collision.grid[name].height = rawlayer.height;
            Collision.grid[name].chunkWidth = rawlayer.width;
            Collision.grid[name].chunkHeight = rawlayer.height;
            if (rawlayer.chunks) {
                for (var j in rawlayer.chunks) {
                    var rawchunk = rawlayer.chunks[j];
                    Collision.grid[name].chunkWidth = rawchunk.width;
                    Collision.grid[name].chunkHeight = rawchunk.height;
                    Collision.grid[name].offsetX = Math.min(rawchunk.x, Collision.grid[name].offsetX);
                    Collision.grid[name].offsetY = Math.min(rawchunk.y, Collision.grid[name].offsetY);
                }
            }
        } else if (raw.layers[i].name == 'Slowdown') {
            var rawlayer = raw.layers[i];
            Slowdown.grid[name] = [];
            if (rawlayer.chunks) {
                for (var j in rawlayer.chunks) {
                    var rawchunk = rawlayer.chunks[j];
                    for (var k in rawchunk.data) {
                        var x = (k % rawchunk.width)+rawchunk.x;
                        var y = ~~(k / rawchunk.width)+rawchunk.y;
                        new Slowdown(name, x, y, rawchunk.data[k]-1);
                    }
                }
            } else {
                for (var j in rawlayer.data) {
                    var x = (j % rawlayer.width);
                    var y = ~~(j / rawlayer.width);
                    new Slowdown(name, x, y, rawlayer.data[j]-1);
                }
            }
        } else if (raw.layers[i].name.includes('Collision:')) {
            var rawlayer = raw.layers[i];
            var layer = rawlayer.name.replace('Collision:', '');
            Collision.grid[name][layer] = [];
            Layer.grid[name][layer] = [];
            if (rawlayer.chunks) {
                for (var j in rawlayer.chunks) {
                    var rawchunk = rawlayer.chunks[j];
                    for (var k in rawchunk.data) {
                        var x = (k % rawchunk.width)+rawchunk.x;
                        var y = ~~(k / rawchunk.width)+rawchunk.y;
                        new Collision(name, x, y, layer, rawchunk.data[k]-1);
                    }
                }
            } else {
                for (var j in rawlayer.data) {
                    var x = (j % rawlayer.width);
                    var y = ~~(j / rawlayer.width);
                    new Collision(name, x, y, layer, rawlayer.data[j]-1);
                }
            }
        } else if (raw.layers[i].name.includes('Npc:')) {
            var rawlayer = raw.layers[i];
            if (rawlayer.name.includes(':waypoints')) {
                var npcId = rawlayer.name.replace('Npc:', '').replace(':waypoints', '');
                var waypoints = [];
                if (rawlayer.chunks) {
                    for (var j in rawlayer.chunks) {
                        var rawchunk = rawlayer.chunks[j];
                        for (var k in rawchunk.data) {
                            if (rawchunk.data[k] != 0) {
                                var x = (k % rawchunk.width)+rawchunk.x;
                                var y = ~~(k / rawchunk.width)+rawchunk.y;
                                if (rawchunk.data[k]-1 == 1777) {
                                    waypoints.push({
                                        map: name,
                                        x: x,
                                        y: y
                                    });
                                } else {
                                    error('Invalid npc waypoint at (' + name + ', ' + x + ', ' + y + ')');
                                }
                            }
                        }
                    }
                } else {
                    for (var j in rawlayer.data) {
                        if (rawlayer.data[j] != 0) {
                            var x = (j % rawlayer.width);
                            var y = ~~(j / rawlayer.width);
                            if (rawlayer.data[j]-1 == 1777) {
                                waypoints.push({
                                    map: name,
                                    x: x,
                                    y: y
                                });
                            } else {
                                error('Invalid npc waypoint at (' + name + ', ' + x + ', ' + y + ')');
                            }
                        }
                    }
                }
                if (npcWaypoints[npcId]) {
                    npcWaypoints[npcId] = npcWaypoints[npcId].concat(waypoints);
                } else {
                    npcWaypoints[npcId] = waypoints;
                }
            } else {
                var npcId = rawlayer.name.replace('Npc:', '');
                if (rawlayer.chunks) {
                    for (var j in rawlayer.chunks) {
                        var rawchunk = rawlayer.chunks[j];
                        for (var k in rawchunk.data) {
                            if (rawchunk.data[k] != 0) {
                                var x = (k % rawchunk.width)+rawchunk.x;
                                var y = ~~(k / rawchunk.width)+rawchunk.y;
                                if (rawchunk.data[k]-1 == 1691) {
                                    new Npc(npcId, x, y, name);
                                } else {
                                    error('Invalid npc spawner at (' + x + ',' + y + ')');
                                }
                            }
                        }
                    }
                } else {
                    for (var j in rawlayer.data) {
                        if (rawlayer.data[j] != 0) {
                            var x = (j % rawlayer.width);
                            var y = ~~(j / rawlayer.width);
                            if (rawlayer.data[j]-1 == 1691) {
                                new Npc(npcId, x, y, name);
                            } else {
                                error('Invalid npc spawner at (' + x + ',' + y + ')');
                            }
                        }
                    }
                }
            }
        } else if (raw.layers[i].name.includes('Spawner:')) {
            var rawlayer = raw.layers[i];
            var monsterstring = rawlayer.name.replace('Spawner:', '');
            var layer = monsterstring.charAt(0);
            monsterstring = monsterstring.replace(layer + ':', '');
            var spawnmonsters = [];
            var lastl = 0;
            for (var l in monsterstring) {
                if (monsterstring[l] == ',') {
                    spawnmonsters.push(monsterstring.slice(lastl, l));
                    lastl = parseInt(l)+1;
                }
            }
            if (rawlayer.chunks) {
                for (var j in rawlayer.chunks) {
                    var rawchunk = rawlayer.chunks[j];
                    for (var k in rawchunk.data) {
                        if (rawchunk.data[k] != 0) {
                            var x = (k % rawchunk.width)+rawchunk.x;
                            var y = ~~(k / rawchunk.width)+rawchunk.y;
                            if (rawchunk.data[k]-1 == 1692) {
                                new Spawner(name, x, y, layer, spawnmonsters);
                            } else {
                                error('Invalid spawner at (' + name + ', ' + x + ', ' + y + ')');
                            }
                        }
                    }
                }
            } else {
                for (var j in rawlayer.data) {
                    if (rawlayer.data[j] != 0) {
                        var x = (j % rawlayer.width);
                        var y = ~~(j / rawlayer.width);
                        if (rawlayer.data[j]-1 == 1692) {
                            new Spawner(name, x, y, spawnmonsters);
                        } else {
                            error('Invalid spawner at (' + name + ', ' + x + ', ' + y + ')');
                        }
                    }
                }
            }
        } else if (raw.layers[i].name.includes('Region:')) {
            var rawlayer = raw.layers[i];
            var propertystring = rawlayer.name.replace('Region:', '');
            var properties = [];
            var lastl = 0;
            for (var l in propertystring) {
                if (propertystring[l] == ':') {
                    properties.push(propertystring.slice(lastl, l));
                    lastl = parseInt(l)+1;
                }
            }
            if (rawlayer.chunks) {
                for (var j in rawlayer.chunks) {
                    var rawchunk = rawlayer.chunks[j];
                    for (var k in rawchunk.data) {
                        if (rawchunk.data[k] != 0) {
                            var x = (k % rawchunk.width)+rawchunk.x;
                            var y = ~~(k / rawchunk.width)+rawchunk.y;
                            if (rawchunk.data[k]-1 == 1695) {
                                new Region(name, x, y, properties);
                            } else {
                                error('Invalid region at (' + name + ', ' + x + ', ' + y + ')');
                            }
                        }
                    }
                }
            } else {
                for (var j in rawlayer.data) {
                    if (rawlayer.data[j] != 0) {
                        var x = (j % rawlayer.width);
                        var y = ~~(j / rawlayer.width);
                        if (rawlayer.data[j]-1 == 1695) {
                            new Region(name, x, y, properties);
                        } else {
                            error('Invalid region at (' + name + ', ' + x + ', ' + y + ')');
                        }
                    }
                }
            }
        } else if (raw.layers[i].name.includes('Teleporter:')) {
            var rawlayer = raw.layers[i];
            var propertystring = rawlayer.name.replace('Teleporter:', '');
            var properties = [];
            var lastl = 0;
            for (var l in propertystring) {
                if (propertystring[l] == ',') {
                    properties.push(propertystring.slice(lastl, l));
                    lastl = parseInt(l)+1;
                }
            }
            if (rawlayer.chunks) {
                for (var j in rawlayer.chunks) {
                    var rawchunk = rawlayer.chunks[j];
                    for (var k in rawchunk.data) {
                        if (rawchunk.data[k] != 0) {
                            var x = (k % rawchunk.width)+rawchunk.x;
                            var y = ~~(k / rawchunk.width)+rawchunk.y;
                            if (rawchunk.data[k]-1 == 1694) {
                                new Teleporter(name, x, y, properties);
                            } else {
                                error('Invalid teleporter at (' + name + ', ' + x + ', ' + y + ')');
                            }
                        }
                    }
                }
            } else {
                for (var j in rawlayer.data) {
                    if (rawlayer.data[j] != 0) {
                        var x = (j % rawlayer.width);
                        var y = ~~(j / rawlayer.width);
                        if (rawlayer.data[j]-1 == 1694) {
                            new Teleporter(name, x, y, properties);
                        } else {
                            error('Invalid teleporter at (' + name + ', ' + x + ', ' + y + ')');
                        }
                    }
                }
            }
        } else if (raw.layers[i].name == 'Darkness') {
            Collision.grid[name].dark = true;
        }
    }
    Layer.generateGraphs(name);
    Layer.generateLookupTables(name);
    Player.chunks[name] = [];
    Monster.chunks[name] = [];
    Projectile.chunks[name] = [];
};
function resetMaps() {
    insertChat('[!] Reloading all maps [!]', 'server');
    logColor('Reloading all maps', '\x1b[33m', 'error');
    Npc.list = [];
    Monster.list = [];
    Projectile.list = [];
    Collision.grid = [];
    Layer.grid = [];
    Slowdown.grid = [];
    Spawner.list = [];
    Region.grid = [];
    Teleporter.grid = [];
    loadAll();
};