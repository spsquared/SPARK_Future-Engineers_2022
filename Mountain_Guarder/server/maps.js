// Copyright (C) 2022 Radioactive64

MAPS = {
    loaded: false,
    load: async function load() {
        if (!MAPS.loaded) await loadAll();
        MAPS.loaded = true;
    },
    reload: async function reload() {
        resetMaps();
    }
};

var npcWaypoints = {};
async function loadAll() {
    loadMap('World');
    loadMap('Caves');
    loadMap('The Void');
    loadMap('Outpost Cottage 1');
    loadMap('Outpost Cottage 2');
    loadMap('Outpost Trader\'s Store');
    loadMap('Outpost Trader\'s Store Upstairs');
    loadMap('Mysterious Cave 1');
    loadMap('Pingu\'s Cave');
    for (let i in Npc.list) {
        if (npcWaypoints[Npc.list[i].npcId]) {
            Npc.list[i].ai.idleWaypoints.waypoints = npcWaypoints[Npc.list[i].npcId];
        }
    }
    await Layer.init();
    Spawner.init();
    Npc.init();
    Layer.lazyInit();
};
function loadMap(name) {
    const raw = require('./../client/maps/' + name + '.json');
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
    for (let rawlayer of raw.layers) {
        if (rawlayer.name == 'Ground Terrain') {
            Collision.grid[name].width = rawlayer.width;
            Collision.grid[name].height = rawlayer.height;
            Collision.grid[name].chunkWidth = rawlayer.width;
            Collision.grid[name].chunkHeight = rawlayer.height;
            if (rawlayer.chunks) {
                for (let rawchunk of rawlayer.chunks) {
                    Collision.grid[name].chunkWidth = rawchunk.width;
                    Collision.grid[name].chunkHeight = rawchunk.height;
                    Collision.grid[name].offsetX = Math.min(rawchunk.x, Collision.grid[name].offsetX);
                    Collision.grid[name].offsetY = Math.min(rawchunk.y, Collision.grid[name].offsetY);
                }
            }
        } else if (rawlayer.name == 'Slowdown') {
            Slowdown.grid[name] = [];
            if (rawlayer.chunks) {
                for (let rawchunk of rawlayer.chunks) {
                    for (let i in rawchunk.data) {
                        let x = (i % rawchunk.width)+rawchunk.x;
                        let y = ~~(i / rawchunk.width)+rawchunk.y;
                        new Slowdown(name, x, y, rawchunk.data[i]-1);
                    }
                }
            } else {
                for (let i in rawlayer.data) {
                    let x = (i % rawlayer.width);
                    let y = ~~(i / rawlayer.width);
                    new Slowdown(name, x, y, rawlayer.data[i]-1);
                }
            }
        } else if (rawlayer.name.startsWith('Collision:')) {
            let layer = rawlayer.name.replace('Collision:', '');
            Collision.grid[name][layer] = [];
            Layer.grid[name][layer] = [];
            if (rawlayer.chunks) {
                for (let rawchunk of rawlayer.chunks) {
                    for (let i in rawchunk.data) {
                        let x = (i % rawchunk.width)+rawchunk.x;
                        let y = ~~(i / rawchunk.width)+rawchunk.y;
                        new Collision(name, x, y, layer, rawchunk.data[i]-1);
                    }
                }
            } else {
                for (let i in rawlayer.data) {
                    let x = (i % rawlayer.width);
                    let y = ~~(i / rawlayer.width);
                    new Collision(name, x, y, layer, rawlayer.data[i]-1);
                }
            }
        } else if (rawlayer.name.startsWith('Npc:')) {
            if (rawlayer.name.includes(':waypoints')) {
                var npcId = rawlayer.name.replace('Npc:', '').replace(':waypoints', '');
                var waypoints = [];
                if (rawlayer.chunks) {
                    for (let rawchunk of rawlayer.chunks) {
                        for (let i in rawchunk.data) {
                            if (rawchunk.data[i] != 0) {
                                let x = (i % rawchunk.width)+rawchunk.x;
                                let y = ~~(i / rawchunk.width)+rawchunk.y;
                                if (rawchunk.data[i]-1 == 1777) {
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
                    for (let i in rawlayer.data) {
                        if (rawlayer.data[i] != 0) {
                            let x = (i % rawlayer.width);
                            let y = ~~(i / rawlayer.width);
                            if (rawlayer.data[i]-1 == 1777) {
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
                if (npcWaypoints[npcId]) npcWaypoints[npcId] = npcWaypoints[npcId].concat(waypoints);
                else npcWaypoints[npcId] = waypoints;
            } else {
                var npcId = rawlayer.name.replace('Npc:', '');
                if (rawlayer.chunks) {
                    for (let rawchunk of rawlayer.chunks) {
                        for (let i in rawchunk.data) {
                            if (rawchunk.data[i] != 0) {
                                let x = (i % rawchunk.width)+rawchunk.x;
                                let y = ~~(i / rawchunk.width)+rawchunk.y;
                                if (rawchunk.data[i]-1 == 1691) {
                                    new Npc(npcId, x, y, name);
                                } else {
                                    error('Invalid npc spawner at (' + x + ',' + y + ')');
                                }
                            }
                        }
                    }
                } else {
                    for (let i in rawlayer.data) {
                        if (rawlayer.data[i] != 0) {
                            let x = (i % rawlayer.width);
                            let y = ~~(i / rawlayer.width);
                            if (rawlayer.data[i]-1 == 1691) {
                                new Npc(npcId, x, y, name);
                            } else {
                                error('Invalid npc spawner at (' + x + ',' + y + ')');
                            }
                        }
                    }
                }
            }
        } else if (rawlayer.name.startsWith('Spawner:')) {
            var monsterstring = rawlayer.name.replace('Spawner:', '');
            var layer = monsterstring.charAt(0);
            monsterstring = monsterstring.replace(layer + ':', '');
            var spawnmonsters = monsterstring.split(',');
            if (rawlayer.chunks) {
                for (let rawchunk of rawlayer.chunks) {
                    for (let i in rawchunk.data) {
                        if (rawchunk.data[i] != 0) {
                            let x = (i % rawchunk.width)+rawchunk.x;
                            let y = ~~(i / rawchunk.width)+rawchunk.y;
                            if (rawchunk.data[i]-1 == 1692) {
                                new Spawner(name, x, y, layer, spawnmonsters);
                            } else {
                                error('Invalid spawner at (' + name + ', ' + x + ', ' + y + ')');
                            }
                        }
                    }
                }
            } else {
                for (let i in rawlayer.data) {
                    if (rawlayer.data[i] != 0) {
                        let x = (i % rawlayer.width);
                        let y = ~~(i / rawlayer.width);
                        if (rawlayer.data[i]-1 == 1692) {
                            new Spawner(name, x, y, layer, spawnmonsters);
                        } else {
                            error('Invalid spawner at (' + name + ', ' + x + ', ' + y + ')');
                        }
                    }
                }
            }
        } else if (rawlayer.name.startsWith('Boss:')) {
            var id = rawlayer.name.replace('Boss:', '');
            var layer = id.charAt(0);
            id = id.replace(layer + ':', '');
            if (rawlayer.chunks) {
                for (let rawchunk of rawlayer.chunks) {
                    for (let i in rawchunk.data) {
                        if (rawchunk.data[i] != 0) {
                            let x = (i % rawchunk.width)+rawchunk.x;
                            let y = ~~(i / rawchunk.width)+rawchunk.y;
                            if (rawchunk.data[i]-1 == 1692) {
                                new BossSpawner(name, x, y, layer, id);
                            } else {
                                error('Invalid boss spawner at (' + name + ', ' + x + ', ' + y + ')');
                            }
                        }
                    }
                }
            } else {
                for (let i in rawlayer.data) {
                    if (rawlayer.data[i] != 0) {
                        let x = (i % rawlayer.width);
                        let y = ~~(i / rawlayer.width);
                        if (rawlayer.data[i]-1 == 1692) {
                            new BossSpawner(name, x, y, layer, id);
                        } else {
                            error('Invalid boss spawner at (' + name + ', ' + x + ', ' + y + ')');
                        }
                    }
                }
            }
            
        } else if (rawlayer.name.startsWith('Bossdata:')) {
            var id = rawlayer.name.replace('Bossdata:', '').substring(0, rawlayer.name.replace('Bossdata:', '').length-2);
            var layer = parseInt(rawlayer.name.charAt(rawlayer.name.length-1));
            var locations = [];
            if (rawlayer.chunks) {
                for (let rawchunk of rawlayer.chunks) {
                    for (let i in rawchunk.data) {
                        if (rawchunk.data[i] != 0) {
                            let x = (i % rawchunk.width)+rawchunk.x;
                            let y = ~~(i / rawchunk.width)+rawchunk.y;
                            if (rawchunk.data[i]-1 == 1692) {
                                locations.push({
                                    x: x,
                                    y: y,
                                    z: layer
                                });
                            } else {
                                error('Invalid boss data marker at (' + name + ', ' + x + ', ' + y + ')');
                            }
                        }
                    }
                }
            } else {
                for (let i in rawlayer.data) {
                    if (rawlayer.data[i] != 0) {
                        let x = (i % rawlayer.width);
                        let y = ~~(i / rawlayer.width);
                        if (rawlayer.data[i]-1 == 1692) {
                            locations.push({
                                x: x,
                                y: y,
                                z: layer
                            });
                        } else {
                            error('Invalid boss data marker at (' + name + ', ' + x + ', ' + y + ')');
                        }
                    }
                }
            }
            if (Monster.bossData[id]) Monster.bossData[id] = Monster.bossData[id].concat(locations);
            else Monster.bossData[id] = locations;
        } else if (rawlayer.name.startsWith('Region:')) {
            let properties = rawlayer.name.replace('Region:', '').split(':');
            if (rawlayer.chunks) {
                for (let rawchunk of rawlayer.chunks) {
                    for (let i in rawchunk.data) {
                        if (rawchunk.data[i] != 0) {
                            let x = (i % rawchunk.width)+rawchunk.x;
                            let y = ~~(i / rawchunk.width)+rawchunk.y;
                            if (rawchunk.data[i]-1 == 1695) {
                                new Region(name, x, y, properties);
                            } else {
                                error('Invalid region at (' + name + ', ' + x + ', ' + y + ')');
                            }
                        }
                    }
                }
            } else {
                for (let i in rawlayer.data) {
                    if (rawlayer.data[i] != 0) {
                        let x = (i % rawlayer.width);
                        let y = ~~(i / rawlayer.width);
                        if (rawlayer.data[i]-1 == 1695) {
                            new Region(name, x, y, properties);
                        } else {
                            error('Invalid region at (' + name + ', ' + x + ', ' + y + ')');
                        }
                    }
                }
            }
        } else if (rawlayer.name.startsWith('Teleporter:')) {
            let properties = rawlayer.name.replace('Teleporter:', '').split(',');
            if (rawlayer.chunks) {
                for (let rawchunk of rawlayer.chunks) {
                    for (let i in rawchunk.data) {
                        if (rawchunk.data[i] != 0) {
                            let x = (i % rawchunk.width)+rawchunk.x;
                            let y = ~~(i / rawchunk.width)+rawchunk.y;
                            if (rawchunk.data[i]-1 == 1694) {
                                new Teleporter(name, x, y, properties);
                            } else {
                                error('Invalid teleporter at (' + name + ', ' + x + ', ' + y + ')');
                            }
                        }
                    }
                }
            } else {
                for (let i in rawlayer.data) {
                    if (rawlayer.data[i] != 0) {
                        let x = (i % rawlayer.width);
                        let y = ~~(i / rawlayer.width);
                        if (rawlayer.data[i]-1 == 1694) {
                            new Teleporter(name, x, y, properties);
                        } else {
                            error('Invalid teleporter at (' + name + ', ' + x + ', ' + y + ')');
                        }
                    }
                }
            }
        } else if (rawlayer.name.startsWith('GaruderWarp:')) {
            let properties = rawlayer.name.replace('GaruderWarp:', '').split(':');
            if (rawlayer.chunks) {
                for (let rawchunk of rawlayer.chunks) {
                    for (let i in rawchunk.data) {
                        if (rawchunk.data[i] != 0) {
                            let x = (i % rawchunk.width)+rawchunk.x;
                            let y = ~~(i / rawchunk.width)+rawchunk.y;
                            if (rawchunk.data[i]-1 == 1865) {
                                GaruderWarp.addPosition(name, x, y, properties[1], properties[0], properties[2]);
                            } else if (rawchunk.data[i]-1 == 1866) {
                            } else {
                                error('Invalid Garuder Warp at (' + name + ', ' + x + ', ' + y + ')');
                            }
                        }
                    }
                }
            } else {
                for (let i in rawlayer.data) {
                    if (rawlayer.data[i] != 0) {
                        let x = (i % rawlayer.width);
                        let y = ~~(i / rawlayer.width);
                        if (rawlayer.data[i]-1 == 1865) {
                            GaruderWarp.addPosition(name, x, y, properties[1], properties[0], properties[2]);
                        } else if (rawlayer.data[i]-1 == 1866) {
                        } else {
                            error('Invalid Garuder Warp at (' + name + ', ' + x + ', ' + y + ')');
                        }
                    }
                }
            }
        }
    }
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