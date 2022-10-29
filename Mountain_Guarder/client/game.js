// Copyright (C) 2022 Radioactive64

var player;
var playerid = 0;
var mapnameFade, mapnameWait;
var lastmap;
var debugData = {};
const debug = document.getElementById('debug');
const mousepos = document.getElementById('mousepos');
const position = document.getElementById('position');

// loading
let loadedassets = 0;
let totalassets = 2;
socket.once('mapData', load);
let tilesetloaded = false;
const tileset = new Image();
tileset.onload = function() {
    tilesetloaded = true;
    loadedassets++;
};
function load(data) {
    document.getElementById('loadingContainer').style.animationName = 'fadeIn';
    document.getElementById('loadingContainer').style.display = 'block';
    for (let i in data.maps) {
        totalassets++;
    }
    setTimeout(async function() {
        await getEntityData();
        await getInventoryData();
        await getCraftingData();
        await getShopData();
        await getQuestData();
        await getNpcDialogues();
        document.getElementById('loadingBar').style.display = 'block';
        tileset.src = '/maps/tiles.png';
        map.src = '/img/World.png';
        const loadingBarText = document.getElementById('loadingBarText');
        const loadingBarInner = document.getElementById('loadingBarInner');
        const updateLoadBar = setInterval(function() {
            let percent = Math.round(loadedassets/totalassets*100) + '%';
            loadingBarText.innerText = loadedassets + '/' + totalassets + ' (' + percent + ')';
            loadingBarInner.style.width = percent;
            if (loadedassets >= totalassets) {
                clearInterval(updateLoadBar);
                document.getElementById('loadingIcon').style.opacity = 0;
                setTimeout(async function() {
                    socket.emit('signIn', {
                        state: 'loaded',
                        username: document.getElementById('username').value,
                        password: await RSAencode(document.getElementById('password').value)
                    });
                    loaded = true;
                    resetFPS();
                }, 500);
            }
        }, 5);
        await loadEntityData();
        await loadInventoryData();
        await loadCraftingData();
        await loadShopData();
        await loadQuestData();
        await loadNpcDialogues();
        for (let i in data.maps) {
            await loadMap(data.maps[i]);
        }
        player = data.self;
        lastmap = player.map;
        await updateRenderedChunks();
        loadedassets++;
    }, 500);
};
async function loadMap(name) {
    if (tilesetloaded) {
        await new Promise(async function(resolve, reject) {
            let request = new XMLHttpRequest();
            request.open('GET', '/maps/' + name + '.json', true);
            request.onload = function() {   
                if (this.status >= 200 && this.status < 400) {
                    let json = JSON.parse(this.response);
                    MAPS[name] = {
                        width: 0,
                        height: 0,
                        offsetX: 0,
                        offsetY: 0,
                        chunkwidth: 0,
                        chunkheight: 0,
                        chunks: [],
                        chunkJSON: [],
                        layerCount: 0,
                        isDark: false,
                        darknessOpacity: 0
                    };
                    for (let i in json.layers) {
                        if (json.layers[i].visible) {
                            if (json.layers[i].name == 'Ground Terrain') {
                                MAPS[name].width = json.layers[i].width;
                                MAPS[name].height = json.layers[i].height;
                                MAPS[name].chunkwidth = json.layers[i].width;
                                MAPS[name].chunkheight = json.layers[i].height;
                                if (json.layers[i].chunks) {
                                    for (let j in json.layers[i].chunks) {
                                        var rawchunk = json.layers[i].chunks[j];
                                        MAPS[name].chunkwidth = rawchunk.width;
                                        MAPS[name].chunkheight = rawchunk.height;
                                        MAPS[name].offsetX = Math.min(rawchunk.x*64, MAPS[name].offsetX);
                                        MAPS[name].offsetY = Math.min(rawchunk.y*64, MAPS[name].offsetY);
                                    }
                                }
                            }
                            if (json.layers[i].chunks) {
                                for (let j in json.layers[i].chunks) {
                                    var rawchunk = json.layers[i].chunks[j];
                                    if (MAPS[name].chunkJSON[rawchunk.y/rawchunk.width] == null) {
                                        MAPS[name].chunkJSON[rawchunk.y/rawchunk.width] = [];
                                    }
                                    if (MAPS[name].chunkJSON[rawchunk.y/rawchunk.width][rawchunk.x/rawchunk.height] == null) {
                                        MAPS[name].chunkJSON[rawchunk.y/rawchunk.width][rawchunk.x/rawchunk.height] = [];
                                    }
                                    MAPS[name].chunkJSON[rawchunk.y/rawchunk.width][rawchunk.x/rawchunk.width][json.layers[i].name] = rawchunk.data;
                                    MAPS[name].chunkJSON[rawchunk.y/rawchunk.width][rawchunk.x/rawchunk.width][json.layers[i].name].offsetX = 0;
                                    MAPS[name].chunkJSON[rawchunk.y/rawchunk.width][rawchunk.x/rawchunk.width][json.layers[i].name].offsetY = 0;
                                    if (json.layers[i].offsetx) MAPS[name].chunkJSON[rawchunk.y/rawchunk.width][rawchunk.x/rawchunk.width][json.layers[i].name].offsetX = json.layers[i].offsetx;
                                    if (json.layers[i].offsety) MAPS[name].chunkJSON[rawchunk.y/rawchunk.width][rawchunk.x/rawchunk.width][json.layers[i].name].offsetY = json.layers[i].offsety;
                                }
                            } else {
                                if (MAPS[name].chunkJSON[0] == null) {
                                    MAPS[name].chunkJSON[0] = [[]];
                                }
                                MAPS[name].chunkJSON[0][0][json.layers[i].name] = json.layers[i].data;
                                MAPS[name].chunkJSON[0][0][json.layers[i].name].offsetX = 0;
                                MAPS[name].chunkJSON[0][0][json.layers[i].name].offsetY = 0;
                                if (json.layers[i].offsetx) MAPS[name].chunkJSON[0][0][json.layers[i].name].offsetX = json.layers[i].offsetx;
                                if (json.layers[i].offsety) MAPS[name].chunkJSON[0][0][json.layers[i].name].offsetY = json.layers[i].offsety;
                            }
                            if (json.layers[i].name.startsWith('Variable')) MAPS[name].layerCount++;
                        } else if (json.layers[i].name.startsWith('Darkness:')) {
                            MAPS[name].isDark = true;
                            MAPS[name].darknessOpacity = parseFloat(json.layers[i].name.replace('Darkness:', ''));
                        } else if (json.layers[i].name.startsWith('Light:')) {
                            var properties = json.layers[i].name.replace('Light:', '').split(',');
                            if (json.layers[i].chunks) {
                                for (let j in json.layers[i].chunks) {
                                    let rawchunk = json.layers[i].chunks[j];
                                    for (let k in rawchunk.data) {
                                        if (rawchunk.data[k] != 0) {
                                            let x = ((k % rawchunk.width)+rawchunk.x)*64+32;
                                            let y = (~~(k / rawchunk.width)+rawchunk.y)*64+32;
                                            if (rawchunk.data[k]-1 == 1867) {
                                                new Light(x, y, name, parseInt(properties[4]), parseInt(properties[0]), parseInt(properties[1]), parseInt(properties[2]), parseFloat(properties[3]));
                                            } else {
                                                console.error('Invalid region at (' + name + ', ' + x + ', ' + y + ')');
                                            }
                                        }
                                    }
                                }
                            } else {
                                for (let j in json.layers[i].data) {
                                    if (json.layers[i].data[j] != 0) {
                                        let x = (j % json.layers[i].width)*64+32;
                                        let y = ~~(j / json.layers[i].width)*64+32;
                                        if (json.layers[i].data[j]-1 == 1867) {
                                            new Light(x, y, name, parseInt(properties[4]), parseInt(properties[0]), parseInt(properties[1]), parseInt(properties[2]), parseFloat(properties[3]));
                                        } else {
                                            console.error('Invalid region at (' + name + ', ' + x + ', ' + y + ')');
                                        }
                                    }
                                }
                            }
                        }
                    }
                    loadedassets++;
                    resolve();
                } else {
                    reject('Error: Server returned status ' + this.status);
                }
            };
            request.onerror = function(err) {
                reject(err);
            };
            request.send();
        });
    } else {
        await sleep(500);
        await loadMap(name);
    }
};
function MGHC() {};

// draw
let drawLoop = null;
function drawFrame() {
    if (loaded && player) {
        if (settings.debug) frameStart = performance.now();
        for (let i = 0; i < MAPS[player.map].layerCount; i++) {
            if (LAYERS.entitylayers[i] == null) {
                LAYERS.entitylayers[i] = createCanvas();
                LAYERS.elayers[i] = LAYERS.entitylayers[i].getContext('2d');
                LAYERS.entitylayers[i].width = window.innerWidth*SCALE;
                LAYERS.entitylayers[i].height = window.innerHeight*SCALE;
                LAYERS.elayers[i].scale(SCALE, SCALE);
                resetCanvas(LAYERS.entitylayers[i]);
            }
        }
        CTX.clearRect(0, 0, window.innerWidth, window.innerHeight);
        OFFSETX = 0;
        OFFSETY = 0;
        if (MAPS[player.map].width*64 > window.innerWidth) {
            OFFSETX = -Math.max((window.innerWidth/2)-(player.x-MAPS[player.map].offsetX), Math.min((MAPS[player.map].offsetX+(MAPS[player.map].width*64))-player.x-(window.innerWidth/2), 0));
            OFFSETY = -Math.max((window.innerHeight/2)-(player.y-MAPS[player.map].offsetY), Math.min((MAPS[player.map].offsetY+(MAPS[player.map].height*64))-player.y-(window.innerHeight/2), 0));
        }
        OFFSETX += lsdX;
        OFFSETY += lsdY;
        updateCameraShake();
        OFFSETX = Math.round(OFFSETX);
        OFFSETY = Math.round(OFFSETY);
        drawMap();
        DroppedItem.updateHighlight();
        Entity.draw();
        CTX.drawImage(LAYERS.map0, 0, 0, window.innerWidth, window.innerHeight);
        for (let i = 0; i < MAPS[player.map].layerCount+1; i++) {
            LAYERS.entitylayers[i] != null && CTX.drawImage(LAYERS.entitylayers[i], 0, 0, window.innerWidth, window.innerHeight);
            LAYERS.mapvariables[i] != null && CTX.drawImage(LAYERS.mapvariables[i], 0, 0, window.innerWidth, window.innerHeight);
        }
        CTX.drawImage(LAYERS.map1, 0, 0, window.innerWidth, window.innerHeight);
        CTX.drawImage(LAYERS.entity1, 0, 0, window.innerWidth, window.innerHeight);
        CTX.drawImage(LAYERS.lightCanvas, 0, 0, window.innerWidth, window.innerHeight);
        drawDebug();
        lastmap = player.map;
        if (settings.debug) {
            var current = performance.now();
            frameTimeCounter = Math.round((current-frameStart)*100)/100;
        }
    }
};
function drawMap() {
    if (settings.debug) mapStart = performance.now();
    for (let i = 0; i < MAPS[player.map].layerCount+1; i++) {
        if (LAYERS.mapvariables[i] == null) {
            LAYERS.mapvariables[i] = createCanvas();
            LAYERS.mvariables[i] = LAYERS.mapvariables[i].getContext('2d');
            LAYERS.mapvariables[i].width = window.innerWidth*SCALE;
            LAYERS.mapvariables[i].height = window.innerHeight*SCALE;
            LAYERS.mvariables[i].scale(SCALE, SCALE);
            resetCanvas(LAYERS.mapvariables[i]);
        }
    }
    let translatex = (window.innerWidth/2)-player.x2;
    let translatey = (window.innerHeight/2)-player.y2;
    LAYERS.mlower.clearRect(0, 0, window.innerWidth, window.innerHeight);
    LAYERS.mlower.save();
    LAYERS.mlower.translate(translatex, translatey);
    for (let i in LAYERS.mvariables) {
        LAYERS.mvariables[i].clearRect(0, 0, window.innerWidth, window.innerHeight);
        LAYERS.mvariables[i].save();
        LAYERS.mvariables[i].translate(translatex, translatey);
    }
    LAYERS.mupper.clearRect(0, 0, window.innerWidth, window.innerHeight);
    LAYERS.mupper.save();
    LAYERS.mupper.translate(translatex, translatey);
    let width = MAPS[player.map].chunkwidth*64;
    let height = MAPS[player.map].chunkheight*64;
    for (let y in MAPS[player.map].chunks) {
        for (let x in MAPS[player.map].chunks[y]) {
            LAYERS.mlower.drawImage(MAPS[player.map].chunks[y][x].lower, (x*width)+OFFSETX, (y*height)+OFFSETY, width, height);
            LAYERS.mupper.drawImage(MAPS[player.map].chunks[y][x].upper, (x*width)+OFFSETX, (y*height)+OFFSETY, width, height);
            for (let z in MAPS[player.map].chunks[y][x].variables) {
                LAYERS.mvariables[z].drawImage(MAPS[player.map].chunks[y][x].variables[z], (x*width)+OFFSETX, (y*height)+OFFSETY, width, height);
            }
        }
    }
    LAYERS.mupper.fillStyle = '#000000';
    let mwidth = MAPS[player.map].width*64;
    let mheight = MAPS[player.map].height*64;
    let offsetX = MAPS[player.map].offsetX;
    let offsetY = MAPS[player.map].offsetY;
    LAYERS.mupper.fillRect(-1024+offsetX+OFFSETX, -1024+offsetY+OFFSETY, mwidth+2048, 1024);
    LAYERS.mupper.fillRect(-1024+offsetX+OFFSETX, mheight+offsetY+OFFSETY, mwidth+2048, 1024);
    LAYERS.mupper.fillRect(-1024+offsetX+OFFSETX, -1024+offsetY+OFFSETY, 1024, mheight+2048);
    LAYERS.mupper.fillRect(mwidth+offsetX+OFFSETX, offsetY+OFFSETY, 1024, mheight+2048);
    LAYERS.mlower.restore();
    for (let i in LAYERS.mvariables) {
        LAYERS.mvariables[i].restore();
    }
    LAYERS.mupper.restore();
    if (settings.debug) {
        let current = performance.now();
        mapTimeCounter = Math.round((current-mapStart)*100)/100;
    }
};
async function updateRenderedChunks() {
    for (let y in MAPS[player.map].chunks) {
        for (let x in MAPS[player.map].chunks[y]) {
            if (Math.abs(player.chunkx-x) > settings.renderDistance || Math.abs(player.chunky-y) > settings.renderDistance) {
                delete MAPS[player.map].chunks[y][x];
            }
        }
    }
    for (let y = player.chunky-settings.renderDistance; y <= player.chunky+settings.renderDistance; y++) {
        for (let x = player.chunkx-settings.renderDistance; x <= player.chunkx+settings.renderDistance; x++) {
            if (MAPS[player.map].chunks[y] == undefined) {
                if (MAPS[player.map].chunkJSON[y] && MAPS[player.map].chunkJSON[y][x]) {
                    renderChunk(x, y, player.map);
                }
            } else if (MAPS[player.map].chunks[y][x] == undefined) {
                if (MAPS[player.map].chunkJSON[y] && MAPS[player.map].chunkJSON[y][x]) {
                    renderChunk(x, y, player.map);
                }
            }
        }
    }
};
function renderChunk(x, y, map) {
    let templower = createCanvas(MAPS[map].chunkwidth * 64, MAPS[map].chunkheight * 64);
    let tempupper = createCanvas(MAPS[map].chunkwidth * 64, MAPS[map].chunkheight * 64);
    let tlower = templower.getContext('2d');
    let tupper = tempupper.getContext('2d');
    resetCanvas(tempupper);
    resetCanvas(templower);
    let tempvariables = [];
    let tvariables = [];
    for (let i in MAPS[player.map].chunkJSON[y][x]) {
        let above = false;
        let variable = -1;
        if (i.includes('Above')) above = true;
        if (i.includes('Variable')) {
            variable = parseInt(i.replace('Variable', ''));
            tempvariables[variable] = createCanvas(MAPS[map].chunkwidth * 64, MAPS[map].chunkheight * 64);
            tvariables[variable] = tempvariables[variable].getContext('2d');
            resetCanvas(tempvariables[variable]);
        }
        for (let j in MAPS[player.map].chunkJSON[y][x][i]) {
            let tileid = MAPS[player.map].chunkJSON[y][x][i][j];
            if (tileid != 0) {
                tileid--;
                let imgx = (tileid % 86)*17;
                let imgy = ~~(tileid / 86)*17;
                let dx = (j % MAPS[map].chunkwidth)*16+MAPS[player.map].chunkJSON[y][x][i].offsetX;
                let dy = ~~(j / MAPS[map].chunkwidth)*16+MAPS[player.map].chunkJSON[y][x][i].offsetY;
                if (above) {
                    tupper.drawImage(tileset, imgx, imgy, 16, 16, dx*4, dy*4, 64, 64);
                } else if (variable != -1) {
                    tvariables[variable].drawImage(tileset, imgx, imgy, 16, 16, dx*4, dy*4, 64, 64);
                } else {
                    tlower.drawImage(tileset, imgx, imgy, 16, 16, dx*4, dy*4, 64, 64);
                }
            }
        }
    }
    if (MAPS[map].chunks[y] == null) {
        MAPS[map].chunks[y] = [];
    }
    MAPS[map].chunks[y][x] = {
        upper: tempupper,
        lower: templower,
        variables: tempvariables
    };
};
function drawDebug() {
    if (debugData && settings.debug) {
        debugStart = performance.now();
        let temp = new createCanvas(window.innerWidth, window.innerHeight);
        let tempctx = temp.getContext('2d');
        function getManhattanDistance(entity) {
            return Math.abs(player.x2-entity.x) + Math.abs(player.y2-entity.y);
        };
        tempctx.save();
        tempctx.translate((window.innerWidth/2)-player.x2, (window.innerHeight/2)-player.y2);
        // chunk borders
        let width = MAPS[player.map].chunkwidth*64;
        let height = MAPS[player.map].chunkheight*64;
        tempctx.beginPath();
        tempctx.strokeStyle = '#00FF00';
        tempctx.lineWidth = 4;
        for (let x = player.chunkx-settings.renderDistance; x <= player.chunkx+settings.renderDistance+1; x++) {
            tempctx.moveTo(x*width+OFFSETX, (player.chunky-settings.renderDistance)*height+OFFSETY);
            tempctx.lineTo(x*width+OFFSETX, (player.chunky+settings.renderDistance+1)*height+OFFSETY);
        }
        for (let y = player.chunky-settings.renderDistance; y <= player.chunky+settings.renderDistance+1; y++) {
            tempctx.moveTo((player.chunkx-settings.renderDistance)*width+OFFSETX, y*height+OFFSETY);
            tempctx.lineTo((player.chunkx+settings.renderDistance+1)*width+OFFSETX, y*height+OFFSETY);
        }
        tempctx.stroke();
        // players/npcs
        // hitbox
        tempctx.beginPath();
        tempctx.strokeStyle = '#FF9900';
        tempctx.lineWidth = 2;
        for (let i in debugData.players) {
            let localplayer = debugData.players[i];
            if (localplayer.map == player.map && getManhattanDistance(localplayer) < settings.renderDistance*2*MAPS[player.map].chunkwidth*64) {
                tempctx.moveTo(localplayer.x-localplayer.width/2+OFFSETX, localplayer.y-localplayer.height/2+OFFSETY);
                tempctx.lineTo(localplayer.x-localplayer.width/2+OFFSETX, localplayer.y+localplayer.height/2+OFFSETY);
                tempctx.lineTo(localplayer.x+localplayer.width/2+OFFSETX, localplayer.y+localplayer.height/2+OFFSETY);
                tempctx.lineTo(localplayer.x+localplayer.width/2+OFFSETX, localplayer.y-localplayer.height/2+OFFSETY);
                tempctx.lineTo(localplayer.x-localplayer.width/2+OFFSETX, localplayer.y-localplayer.height/2+OFFSETY);
                tempctx.moveTo(localplayer.x-localplayer.collisionBoxSize/2+OFFSETX, localplayer.y-localplayer.collisionBoxSize/2+OFFSETY);
                tempctx.lineTo(localplayer.x-localplayer.collisionBoxSize/2+OFFSETX, localplayer.y+localplayer.collisionBoxSize/2+OFFSETY);
                tempctx.lineTo(localplayer.x+localplayer.collisionBoxSize/2+OFFSETX, localplayer.y+localplayer.collisionBoxSize/2+OFFSETY);
                tempctx.lineTo(localplayer.x+localplayer.collisionBoxSize/2+OFFSETX, localplayer.y-localplayer.collisionBoxSize/2+OFFSETY);
                tempctx.lineTo(localplayer.x-localplayer.collisionBoxSize/2+OFFSETX, localplayer.y-localplayer.collisionBoxSize/2+OFFSETY);
            }
        }
        tempctx.stroke();
        // control vectors
        tempctx.beginPath();
        tempctx.strokeStyle = '#000000';
        tempctx.lineWidth = 2;
        for (let i in debugData.players) {
            let localplayer = debugData.players[i];
            if (localplayer.map == player.map && getManhattanDistance(localplayer) < settings.renderDistance*2*MAPS[player.map].chunkwidth*64) {
                tempctx.moveTo(localplayer.x+OFFSETX, localplayer.y+OFFSETY);
                tempctx.lineTo(localplayer.x+localplayer.controls.x*20+OFFSETX, localplayer.y+OFFSETY);
                tempctx.moveTo(localplayer.x+OFFSETX, localplayer.y+OFFSETY);
                tempctx.lineTo(localplayer.x+OFFSETX, localplayer.y+localplayer.controls.y*20+OFFSETY);
                tempctx.moveTo(localplayer.x+OFFSETX, localplayer.y+OFFSETY);
                tempctx.lineTo(localplayer.x+localplayer.controls.x*20+OFFSETX, localplayer.y+localplayer.controls.y*20+OFFSETY);
            }
        }
        tempctx.stroke();
        // waypoints
        tempctx.beginPath();
        tempctx.strokeStyle = '#FFFF00';
        tempctx.lineWidth = 4;
        tempctx.textAlign = 'left';
        tempctx.font = '10px Pixel';
        tempctx.fillStyle = '#FFFF00';
        for (let i in debugData.players) {
            let localplayer = debugData.players[i];
            if (localplayer.map == player.map && getManhattanDistance(localplayer) < settings.renderDistance*2*MAPS[player.map].chunkwidth*64 && localplayer.idleWaypoints) {
                let waypoints = localplayer.idleWaypoints.waypoints;
                if (waypoints && waypoints[0]) {
                    for (let j in waypoints) {
                        if (waypoints[j].map == player.map) {
                            tempctx.moveTo(waypoints[j].x*64+OFFSETX, waypoints[j].y*64+OFFSETY);
                            tempctx.lineTo(waypoints[j].x*64+64+OFFSETX, waypoints[j].y*64+OFFSETY);
                            tempctx.lineTo(waypoints[j].x*64+64+OFFSETX, waypoints[j].y*64+64+OFFSETY);
                            tempctx.lineTo(waypoints[j].x*64+OFFSETX, waypoints[j].y*64+64+OFFSETY);
                            tempctx.lineTo(waypoints[j].x*64+OFFSETX, waypoints[j].y*64+OFFSETY);
                            tempctx.fillText(localplayer.name, waypoints[j].x*64+OFFSETX, waypoints[j].y*64+OFFSETY);
                        }
                    }
                }
            }
        }
        tempctx.stroke();
        // pastwaypoints
        tempctx.beginPath();
        tempctx.strokeStyle = '#00FFFF';
        tempctx.lineWidth = 4;
        tempctx.textAlign = 'center';
        tempctx.font = '10px Pixel';
        tempctx.fillStyle = '#FFFF00';
        for (let i in debugData.players) {
            let localplayer = debugData.players[i];
            if (localplayer.map == player.map && getManhattanDistance(localplayer) < settings.renderDistance*2*MAPS[player.map].chunkwidth*64 && localplayer.idleWaypoints) {
                let lastWaypoints = localplayer.idleWaypoints.lastWaypoints;
                if (lastWaypoints && lastWaypoints[0]) {
                    for (let j in lastWaypoints) {
                        if (lastWaypoints[j].map == player.map) {
                            tempctx.moveTo(lastWaypoints[j].x*64+OFFSETX, lastWaypoints[j].y*64+OFFSETY);
                            tempctx.lineTo(lastWaypoints[j].x*64+64+OFFSETX, lastWaypoints[j].y*64+OFFSETY);
                            tempctx.lineTo(lastWaypoints[j].x*64+64+OFFSETX, lastWaypoints[j].y*64+64+OFFSETY);
                            tempctx.lineTo(lastWaypoints[j].x*64+OFFSETX, lastWaypoints[j].y*64+64+OFFSETY);
                            tempctx.lineTo(lastWaypoints[j].x*64+OFFSETX, lastWaypoints[j].y*64+OFFSETY);
                            tempctx.fillText(localplayer.name, lastWaypoints[j].x+OFFSETX, lastWaypoints[j].y+OFFSETY);
                        }
                    }
                }
            }
        }
        tempctx.stroke();
        // paths
        tempctx.beginPath();
        tempctx.strokeStyle = '#0000FF';
        tempctx.lineWidth = 4;
        for (let i in debugData.players) {
            let localplayer = debugData.players[i];
            if (localplayer.map == player.map && getManhattanDistance(localplayer) < settings.renderDistance*2*MAPS[player.map].chunkwidth*64) {
                if (localplayer.path && localplayer.path[0]) {
                    tempctx.moveTo(localplayer.x+OFFSETX, localplayer.y+OFFSETY);
                    for (let j in localplayer.path) {
                        tempctx.lineTo(localplayer.path[j][0]*64+32+OFFSETX, localplayer.path[j][1]*64+32+OFFSETY);
                    }
                }
            }
        }
        tempctx.stroke();
        // monsters
        // hitbox
        tempctx.beginPath();
        tempctx.strokeStyle = '#FF9900';
        tempctx.lineWidth = 2;
        for (let i in debugData.monsters) {
            let localmonster = debugData.monsters[i];
            if (localmonster && localmonster.map == player.map) {
                tempctx.moveTo(localmonster.x-localmonster.width/2+OFFSETX, localmonster.y-localmonster.height/2+OFFSETY);
                tempctx.lineTo(localmonster.x-localmonster.width/2+OFFSETX, localmonster.y+localmonster.height/2+OFFSETY);
                tempctx.lineTo(localmonster.x+localmonster.width/2+OFFSETX, localmonster.y+localmonster.height/2+OFFSETY);
                tempctx.lineTo(localmonster.x+localmonster.width/2+OFFSETX, localmonster.y-localmonster.height/2+OFFSETY);
                tempctx.lineTo(localmonster.x-localmonster.width/2+OFFSETX, localmonster.y-localmonster.height/2+OFFSETY);
                tempctx.moveTo(localmonster.x-localmonster.collisionBoxSize/2+OFFSETX, localmonster.y-localmonster.collisionBoxSize/2+OFFSETY);
                tempctx.lineTo(localmonster.x-localmonster.collisionBoxSize/2+OFFSETX, localmonster.y+localmonster.collisionBoxSize/2+OFFSETY);
                tempctx.lineTo(localmonster.x+localmonster.collisionBoxSize/2+OFFSETX, localmonster.y+localmonster.collisionBoxSize/2+OFFSETY);
                tempctx.lineTo(localmonster.x+localmonster.collisionBoxSize/2+OFFSETX, localmonster.y-localmonster.collisionBoxSize/2+OFFSETY);
                tempctx.lineTo(localmonster.x-localmonster.collisionBoxSize/2+OFFSETX, localmonster.y-localmonster.collisionBoxSize/2+OFFSETY);
            }
        }
        tempctx.stroke();
        // keys
        tempctx.beginPath();
        tempctx.strokeStyle = '#000000';
        tempctx.lineWidth = 2;
        for (let i in debugData.monsters) {
            let localmonster = debugData.monsters[i];
            if (localmonster && localmonster.map == player.map) {
                tempctx.moveTo(localmonster.x+OFFSETX, localmonster.y+OFFSETY);
                tempctx.lineTo(localmonster.x+localmonster.controls.x*20+OFFSETX, localmonster.y+OFFSETY);
                tempctx.moveTo(localmonster.x+OFFSETX, localmonster.y+OFFSETY);
                tempctx.lineTo(localmonster.x+OFFSETX, localmonster.y+localmonster.controls.y*20+OFFSETY);
                tempctx.moveTo(localmonster.x+OFFSETX, localmonster.y+OFFSETY);
                tempctx.lineTo(localmonster.x+localmonster.controls.x*20+OFFSETX, localmonster.y+localmonster.controls.y*20+OFFSETY);
            }
        }
        tempctx.stroke();
        // path
        tempctx.beginPath();
        tempctx.strokeStyle = '#0000FF';
        tempctx.lineWidth = 4;
        for (let i in debugData.monsters) {
            let localmonster = debugData.monsters[i];
            if (localmonster && localmonster.map == player.map) {
                if (localmonster.path[0]) {
                    tempctx.moveTo(localmonster.x+OFFSETX, localmonster.y+OFFSETY);
                    for (let j in localmonster.path) {
                        tempctx.lineTo(localmonster.path[j][0]*64+32+OFFSETX, localmonster.path[j][1]*64+32+OFFSETY);
                    }
                }
            }
        }
        tempctx.stroke();
        // aggro target
        tempctx.beginPath();
        tempctx.strokeStyle = '#FF0000';
        tempctx.lineWidth = 2;
        for (let i in debugData.monsters) {
            let localmonster = debugData.monsters[i];
            if (localmonster && localmonster.map == player.map) {
                if (Player.list[localmonster.aggroTarget]) {
                    tempctx.moveTo(localmonster.x+OFFSETX, localmonster.y+OFFSETY);
                    tempctx.lineTo(Player.list[localmonster.aggroTarget].x+OFFSETX, Player.list[localmonster.aggroTarget].y+OFFSETY);
                }
            }
        }
        tempctx.stroke();
        // aggro range
        tempctx.beginPath();
        tempctx.strokeStyle = '#FF0000';
        // tempctx.fillStyle = '#FF00000A';
        tempctx.lineWidth = 4;
        for (let i in debugData.monsters) {
            let localmonster = debugData.monsters[i];
            if (localmonster && localmonster.map == player.map) {
                // tempctx.beginPath();
                tempctx.moveTo(localmonster.x+OFFSETX+localmonster.aggroRange*64, localmonster.y+OFFSETY);
                tempctx.arc(localmonster.x+OFFSETX, localmonster.y+OFFSETY, localmonster.aggroRange*64, 0, 2*Math.PI, false);
                // tempctx.fill();
                // tempctx.stroke();
            }
        }
        tempctx.stroke();
        // projectiles
        // hitbox
        tempctx.beginPath();
        tempctx.strokeStyle = '#FF9900';
        tempctx.lineWidth = 2;
        for (let i in debugData.projectiles) {
            let localprojectile = debugData.projectiles[i];
            if (localprojectile && localprojectile.map == player.map) {
                var sinAngle = Math.sin(localprojectile.angle);
                var cosAngle = Math.cos(localprojectile.angle);
                tempctx.moveTo(((localprojectile.width/2)*cosAngle)-((localprojectile.height/2)*sinAngle)+localprojectile.x+OFFSETX, ((localprojectile.width/2)*sinAngle)+((localprojectile.height/2)*cosAngle)+localprojectile.y+OFFSETY);
                tempctx.lineTo(((localprojectile.width/2)*cosAngle)-((-localprojectile.height/2)*sinAngle)+localprojectile.x+OFFSETX, ((localprojectile.width/2)*sinAngle)+((-localprojectile.height/2)*cosAngle)+localprojectile.y+OFFSETY);
                tempctx.lineTo(((-localprojectile.width/2)*cosAngle)-((-localprojectile.height/2)*sinAngle)+localprojectile.x+OFFSETX, ((-localprojectile.width/2)*sinAngle)+((-localprojectile.height/2)*cosAngle)+localprojectile.y+OFFSETY);
                tempctx.lineTo(((-localprojectile.width/2)*cosAngle)-((localprojectile.height/2)*sinAngle)+localprojectile.x+OFFSETX, ((-localprojectile.width/2)*sinAngle)+((localprojectile.height/2)*cosAngle)+localprojectile.y+OFFSETY);
                tempctx.lineTo(((localprojectile.width/2)*cosAngle)-((localprojectile.height/2)*sinAngle)+localprojectile.x+OFFSETX, ((localprojectile.width/2)*sinAngle)+((localprojectile.height/2)*cosAngle)+localprojectile.y+OFFSETY);
                tempctx.moveTo(localprojectile.x-localprojectile.collisionBoxSize/2+OFFSETX, localprojectile.y-localprojectile.collisionBoxSize/2+OFFSETY);
                tempctx.lineTo(localprojectile.x-localprojectile.collisionBoxSize/2+OFFSETX, localprojectile.y+localprojectile.collisionBoxSize/2+OFFSETY);
                tempctx.lineTo(localprojectile.x+localprojectile.collisionBoxSize/2+OFFSETX, localprojectile.y+localprojectile.collisionBoxSize/2+OFFSETY);
                tempctx.lineTo(localprojectile.x+localprojectile.collisionBoxSize/2+OFFSETX, localprojectile.y-localprojectile.collisionBoxSize/2+OFFSETY);
                tempctx.lineTo(localprojectile.x-localprojectile.collisionBoxSize/2+OFFSETX, localprojectile.y-localprojectile.collisionBoxSize/2+OFFSETY);
            }
        }
        tempctx.stroke();
        // angle
        tempctx.beginPath();
        tempctx.strokeStyle = '#000000';
        tempctx.lineWidth = 2;
        for (let i in debugData.projectiles) {
            let localprojectile = debugData.projectiles[i];
            if (localprojectile && localprojectile.map == player.map) {
                let sinAngle = Math.sin(localprojectile.angle);
                let cosAngle = Math.cos(localprojectile.angle);
                tempctx.moveTo(localprojectile.x+OFFSETX, localprojectile.y+OFFSETY);
                tempctx.lineTo(((localprojectile.width/2)*cosAngle)+localprojectile.x+OFFSETX, ((localprojectile.width/2)*sinAngle)+localprojectile.y+OFFSETY);
            }
        }
        tempctx.stroke();
        // dropped items
        tempctx.beginPath();
        tempctx.strokeStyle = '#FF9900';
        tempctx.lineWidth = 2;
        for (let i in debugData.droppedItems) {
            let localdroppeditem = debugData.droppedItems[i];
            if (localdroppeditem && localdroppeditem.map == player.map) {
                tempctx.moveTo(localdroppeditem.x-24+OFFSETX, localdroppeditem.y-24+OFFSETY);
                tempctx.lineTo(localdroppeditem.x-24+OFFSETX, localdroppeditem.y+24+OFFSETY);
                tempctx.lineTo(localdroppeditem.x+24+OFFSETX, localdroppeditem.y+24+OFFSETY);
                tempctx.lineTo(localdroppeditem.x+24+OFFSETX, localdroppeditem.y-24+OFFSETY);
                tempctx.lineTo(localdroppeditem.x-24+OFFSETX, localdroppeditem.y-24+OFFSETY);
            }
        }
        tempctx.stroke();
        tempctx.restore();
        CTX.drawImage(temp, 0, 0);
        debug.style.display = 'block';
        mousepos.innerText = 'Mouse: (' + Math.floor((player.x+mouseX-OFFSETX)/64) + ', ' + Math.floor((player.y+mouseY-OFFSETY)/64) + ')';
        position.innerText = 'Player: (' + Math.floor(player.x/64) + ', ' + Math.floor(player.y/64) + ')';
        let current = performance.now();
        debugTimeCounter = Math.round((current-debugStart)*100)/100;
    } else {
        debug.style.display = '';
    }
};
function resetFPS() {
    clearInterval(drawLoop);
    fpsTimes = [];
    drawLoop = setInterval(function() {
        if (!document.hidden && hasFocus) requestAnimationFrame(function() {
            drawFrame();
            if (settings.useController) updateControllers();
            fpsTimes.push(performance.now());
            while (performance.now()-fpsTimes[0] > 1000) fpsTimes.shift();
        });
    }, 1000/settings.fps);
};

// io
socket.on('updateTick', function(data) {
    if (loaded && !document.hidden) {
        Entity.update(data);
        player = Player.list[playerid];
        if (player) {
            if (lastmap != player.map) MAPS[player.map].chunks = [];
            updateRenderedChunks();
            if (!controllerConnected) socket.emit('mouseMove', {x: mouseX-OFFSETX, y: mouseY-OFFSETY});
            if (settings.useController) sendControllers();
        }
    }
});
socket.on('debugTick', function(debug) {
    if (loaded && !document.hidden) {
        debugData = debug.data;
        tpsCounter = debug.tps;
        tickTime = debug.tickTime;
        serverHeapUsed = debug.heapSize;
        serverHeapMax = debug.heapMax;
    }
});
document.onkeydown = function onkeydown(e) {
    if (loaded) {
        if (!e.isTrusted) {
            socket.emit('timeout');
        } else if (!inchat && !indebug && !changingKeyBind) {
            var key = e.key.toLowerCase();
            switch (key) {
                case keybinds.up:
                    socket.emit('keyPress', {key: 'up', state: true});
                    break;
                case keybinds.down:
                    socket.emit('keyPress', {key: 'down', state: true});
                    break;
                case keybinds.left:
                    socket.emit('keyPress', {key: 'left', state: true});
                    break;
                case keybinds.right:
                    socket.emit('keyPress', {key: 'right', state: true});
                    break;
                case keybinds.heal:
                    socket.emit('keyPress', {key: 'heal', state: true});
                    break;
                case keybinds.disableSecond:
                    socket.emit('keyPress', {key: 'disableSecond', state: true});
                    break;
                case keybinds.chat:
                    document.getElementById('chatInput').focus();
                    e.preventDefault();
                    break;
                default:
                if (!e.getModifierState('Shift') && !e.getModifierState('Control') && !e.getModifierState('Alt') && !e.getModifierState('Meta')) {
                    switch (key) {
                        case keybinds.inventory:
                            toggleInventory();
                            break;
                        case keybinds.inventoryEquips:
                            toggleToEquips();
                            break;
                        case keybinds.inventoryCrafting:
                            toggleToCrafting();
                            break;
                        case keybinds.map:
                            toggleMap();
                            break;
                        case keybinds.settings:
                            toggleSettings();
                            break;
                    }
                } else if (key == 'i' && !e.getModifierState('Shift') && e.getModifierState('Control') && debugConsoleEnabled) {
                    toggleDebugConsole();
                } else if (e.key == 'Meta' || e.key == 'Alt' || e.key == 'Control') {
                    releaseAll();
                }
            }
        }
    }
};
document.onkeyup = function onkeyup(e) {
    if (loaded) {
        var key = e.key.toLowerCase();
        if (!e.isTrusted) {
            socket.emit('timeout');
        } else {
            switch (key) {
                case keybinds.up:
                    socket.emit('keyPress', {key: 'up', state: false});
                    break;
                case keybinds.down:
                    socket.emit('keyPress', {key: 'down', state: false});
                    break;
                case keybinds.left:
                    socket.emit('keyPress', {key: 'left', state: false});
                    break;
                case keybinds.right:
                    socket.emit('keyPress', {key: 'right', state: false});
                    break;
                case keybinds.heal:
                    socket.emit('keyPress', {key: 'heal', state: false});
                    break;
                case keybinds.disableSecond:
                    socket.emit('keyPress', {key: 'disableSecond', state: false});
                    break;
                case '\\':
                    if (!inchat) {
                        toggle('debug');
                        document.getElementById('debugToggle').checked = settings.debug;
                    }
                    break;
            }
        }
    }
};
document.onmousedown = function onmousedown(e) {
    if (loaded) {
        if (!e.isTrusted) {
            socket.emit('timeout');
        }
        if (!pointerLocked) {
            mouseX = e.clientX-window.innerWidth/2;
            mouseY = e.clientY-window.innerHeight/2;
        }
        if (!changingKeyBind && !document.getElementById('chat').contains(e.target) && !document.getElementById('dropdownMenu').contains(e.target) && !document.getElementById('windows').contains(e.target) && !document.getElementById('deathScreen').contains(e.target)) {
            switch (e.button) {
                case keybinds.use:
                    socket.emit('click', {button: 'left', x: mouseX-OFFSETX, y: mouseY-OFFSETY, state: true});
                    break;
                case keybinds.second:
                    socket.emit('click', {button: 'right', x: mouseX-OFFSETX, y: mouseY-OFFSETY, state: true});
                    break;
            }
        }
        if (!pointerLocked && settings.pointerLock) document.body.requestPointerLock();
    }
};
document.onmouseup = function onmouseup(e) {
    if (loaded) {
        if (!e.isTrusted) {
            socket.emit('timeout');
        }
        if (!pointerLocked) {
            mouseX = e.clientX-window.innerWidth/2;
            mouseY = e.clientY-window.innerHeight/2;
        }
        if (!e.target.matches('#menuContainer') && !e.target.matches('#chatInput') && !e.target.matches('#windows') && !e.target.matches('#dropdownMenu') && !e.target.matches('#regionName')) {
            switch (e.button) {
                case keybinds.use:
                    socket.emit('click', {button: 'left', x: mouseX-OFFSETX, y: mouseY-OFFSETY, state: false});
                    break;
                case keybinds.second:
                    socket.emit('click', {button: 'right', x: mouseX-OFFSETX, y: mouseY-OFFSETY, state: false});
                    break;
            }
        }
    }
};
document.onmousemove = function onmousemove(e) {
    if (loaded && !document.hidden) {
        if (!e.isTrusted) {
            socket.emit('timeout');
        }
        if (pointerLocked) {
            mouseX += e.movementX;
            mouseY += e.movementY;
            mouseX = Math.max(-window.innerWidth/2, Math.min(mouseX, window.innerWidth/2));
            mouseY = Math.max(-window.innerHeight/2, Math.min(mouseY, window.innerHeight/2));
            document.getElementById('crossHair').style.left = mouseX + window.innerWidth/2-11 + 'px';
            document.getElementById('crossHair').style.top = mouseY + window.innerHeight/2-11 + 'px';
        } else {
            mouseX = e.clientX-window.innerWidth/2;
            mouseY = e.clientY-window.innerHeight/2;
        }
    }
};
socket.on('updateSelf', function(data) {
    if (loaded && !document.hidden) {
        playerid = data.id;
        document.getElementById('statsHPvalue').style.width = (data.hp/data.maxHP)*100 + '%';
        document.getElementById('statsHPtext').innerText = data.hp + '/' + data.maxHP;
        document.getElementById('statsXPvalue').style.width = (data.xp/data.maxXP)*100 + '%';
        document.getElementById('statsXPtext').innerText = data.xp + '/' + data.maxXP;
        document.getElementById('statsMNvalue').style.width = (data.mana/data.maxMana)*100 + '%';
        document.getElementById('statsMNtext').innerText = data.mana + '/' + data.maxMana;
    }
});
const regionName = document.getElementById('regionName');
socket.on('region', async function(name) {
    clearInterval(mapnameFade);
    clearTimeout(mapnameWait);
    if (regionName.style.display == 'block') {
        regionName.style.animationDuration = '0.25s';
        regionName.style.animationName = 'fadeOut';
        mapnameWait = setTimeout(function() {
            regionName.innerText = name;
            regionName.style.animationName = 'fadeIn';
            mapnameWait = setTimeout(function() {
                regionName.style.animationDuration = '2s';
                regionName.style.animationName = 'fadeOut';
                mapnameWait = setTimeout(function() {
                    regionName.style.display = '';
                }, 2000);
            }, 4000);
        }, 250);
    } else {
        regionName.innerText = name;
        regionName.style.display = 'block';
        regionName.style.animationDuration = '1s';
        regionName.style.animationName = 'fadeIn';
        mapnameWait = setTimeout(function() {
            regionName.style.animationDuration = '2s';
            regionName.style.animationName = 'fadeOut';
            mapnameWait = setTimeout(function() {
                regionName.style.display = '';
            }, 2000);
        }, 4000);
    }
});
const fadeScreen = document.getElementById('fade');
let teleporting = false;
socket.on('teleport1', function() {
    if (!teleporting) {
        teleporting = true;
        fadeScreen.style.display = 'block';
        fadeScreen.style.animationName = 'fadeIn';
        fadeScreen.onanimationend = function() {
            socket.emit('teleport1');
            fadeScreen.onanimationend = function() {};
        };
    }
});
socket.on('teleport2', function(pos) {
    if (teleporting) {
        player.map = pos.map;
        player.x = pos.x;
        player.y = pos.y;
        fadeScreen.style.animationName = 'fadeOut';
        fadeScreen.onanimationend = function() {
            fadeScreen.style.display = 'none';
            socket.emit('teleport2');
            fadeScreen.onanimationend = function() {};
            teleporting = false;
        };
    }
});
socket.on('playerDied', function() {
    document.getElementById('respawnButton').style.display = 'none';
    document.getElementById('deathScreen').style.display = 'block';
    if (controllerConnected) document.getElementById('respawnButton').innerText = 'Press A to Respawn';
    let time = 5;
    document.getElementById('respawnTimer').innerText = time;
    const timer = setInterval(function() {
        time--;
        document.getElementById('respawnTimer').innerText = time;
        if (time == 0) {
            clearInterval(timer);
            document.getElementById('respawnButton').style.display = 'block';
        }
    }, 1000);
});
function respawn() {
    socket.emit('respawn');
    document.getElementById('respawnButton').style.display = 'none';
    document.getElementById('deathScreen').style.display = 'none';
    if (controllerConnected) document.getElementById('respawnButton').innerText = 'Respawn';
};

// automove prevention
document.onvisibilitychange = function() {
    socket.emit('keyPress', {key:'up', state:false});
    socket.emit('keyPress', {key:'down', state:false});
    socket.emit('keyPress', {key:'left', state:false});
    socket.emit('keyPress', {key:'right', state:false});
    socket.emit('keyPress', {key:'heal', state:false});
    socket.emit('controllerAxes', {
        movex: 0,
        movey: 0,
        aimx: 0,
        aimy: 0
    });
};

// npc prompts
const promptContainer = document.getElementById('promptContainer');
socket.on('prompt', async function(conversation) {
    var data = Prompts[conversation.id][conversation.i];
    promptContainer.style.display = 'block';
    await sleep((11-settings.dialogueSpeed)*10);
    var optionDivs = [];
    for (let i in data.options) {
        const div = document.createElement('div');
        div.classList.add('promptChoice');
        div.classList.add('ui-lightbutton');
        div.option = parseInt(i);
        div.onclick = function() {
            socket.emit('promptChoose', this.option);
            promptContainer.style.display = 'none';
            promptContainer.innerHTML = '<div id="promptText"></div><div id="promptChoices"></div>';
        };
        optionDivs[i] = div;
    }
    const textDiv = document.getElementById('promptText');
    await displayText(data.text, textDiv);
    for (let i in optionDivs) {
        document.getElementById('promptChoices').appendChild(optionDivs[i]);
        await sleep((11-settings.dialogueSpeed)*10);
        await displayText(data.options[i].text, optionDivs[i]);
    }
});
Prompts = [];
async function displayText(text, div) {
    let questLabel = false;
    for (let i in text) {
        const letter = document.createElement('span');
        letter.classList.add('ui-lighttext');
        letter.classList.add('promptFade');
        if (text[i] == '`') {
            questLabel = !questLabel;
            continue;
        }
        if (questLabel) letter.style.color = 'cyan';
        letter.innerText = text[i];
        div.appendChild(letter);
        await sleep((11-settings.dialogueSpeed)*2);
    }
};
async function getNpcDialogues() {
    await new Promise(async function(resolve, reject) {
        totalassets++;
        var request = new XMLHttpRequest();
        request.open('GET', '/prompts.json', true);
        request.onload = async function() {
            if (this.status >= 200 && this.status < 400) {
                var json = JSON.parse(this.response);
                Prompts = json;
                loadedassets++;
                resolve();
            } else {
                reject('Error: Server returned status ' + this.status);
            }
        };
        request.onerror = function(err) {
            reject(err);
        };
        request.send();
    });
};
async function loadNpcDialogues() {};

// Banners
const bannerContainer = document.getElementById('normalBanners');
const priorityBannerContainer = document.getElementById('priorityBanners');
Banners = [];
socket.on('banner', function(data) {
    new Banner(data.html, {
        type: 'time',
        time: data.time
    });
});
Banner = function(html, param) {
    const div = document.createElement('div');
    div.classList.add('ui-block');
    div.classList.add('banner');
    div.innerHTML = html;
    if (param) {
        if (param.type == 'id') div.id2 = param.id;
        else if (param.type == 'time') {
            setTimeout(async function() {
                div.style.animationName = 'banner-out';
                await sleep(500);
                div.remove();
                delete Banners[Banners.indexOf(div)];
            }, param.time ?? 10000);
        } else {
            console.error('invalid banner type ' + param.type);
        }
        div.priority = param.priority ?? false;
        if (param.priority) priorityBannerContainer.insertBefore(div, priorityBannerContainer.firstChild);
        else bannerContainer.insertBefore(div, bannerContainer.firstChild);
    }

    Banners.unshift(div);
    return div;
};
setInterval(function() {
    // dynamic sizing to fill screen is not possible with pure css
    bannerContainer.style.maxHeight = window.innerHeight-priorityBannerContainer.offsetHeight + 'px';
}, 20);

// garuder warp menu & garuder warp
const garuderWarpSelect = document.getElementById('garuderWarpSelect');
socket.on('openGWSelect', function(choices) {
    garuderWarpSelect.innerHTML = '';
    function cancelKey(e) {
        if (e.key == 'Escape') {
            garuderWarpSelect.style.display = '';
            document.removeEventListener('keydown', cancelKey);
        }
    };
    for (let n of choices) {
        const button = document.createElement('div');
        button.classList.add('locationBlock', 'ui-block');
        button.innerText = n;
        button.onclick = function() {
            garuderWarpSelect.style.display = '';
            document.removeEventListener('keydown', cancelKey);
            socket.emit('GWChoose', n);
        };
        garuderWarpSelect.appendChild(button);
    }
    document.addEventListener('keydown', cancelKey);
    garuderWarpSelect.style.display = 'block';
});
socket.on('gteleport1', async function() {
    if (!teleporting) {
        teleporting = true;
        await sleep(1000);
        fadeScreen.style.backgroundColor = 'white';
        fadeScreen.style.animationDuration = '2s';
        fadeScreen.style.animationTimingFunction = 'ease-in';
        fadeScreen.style.display = 'block';
        fadeScreen.style.animationName = 'fadeIn';
        CANVAS.style.animationName = 'warpSaturate';
        fadeScreen.onanimationend = async function() {
            socket.emit('gteleport1');
            fadeScreen.style.backgroundColor = '';
            fadeScreen.style.animationDuration = '';
            fadeScreen.style.animationTimingFunction = '';
            CANVAS.style.animationName = '';
            fadeScreen.onanimationend = function() {};
        };
    }
});

// camera shake
var cameraShake = [];
function startCameraShake(intensity, length) {
    let camShake = {
        intensity: intensity,
        x: 0,
        y: 0,
        xspeed: 0,
        yspeed: 0,
        length: length
    };
    cameraShake.push(camShake);
    let shake = setInterval(function() {
        camShake.xspeed = ((Math.random()*(2*camShake.intensity)-camShake.intensity)-camShake.x)/(settings.fps/40);
        camShake.yspeed = ((Math.random()*(2*camShake.intensity)-camShake.intensity)-camShake.y)/(settings.fps/40);
        camShake.intensity *= (1-(50/camShake.length)/50);
        if (camShake.intensity < 0.05) {
            camShake.x = 0;
            camShake.y = 0;
            camShake.xspeed = 0;
            camShake.yspeed = 0;
            cameraShake.splice(cameraShake.indexOf(camShake, 1));
            clearInterval(shake);
        }
    }, 25);
};
function updateCameraShake() {
    for (let camShake of cameraShake) {
        camShake.x += camShake.xspeed;
        camShake.y += camShake.yspeed;
        OFFSETX += camShake.x;
        OFFSETY += camShake.y;
    }
};
socket.on('cameraShake', function(intensity) {
    startCameraShake(intensity);
});

// chat
var inchat = false;
var messages = [];
const chat = document.getElementById('chatText');
const chatInput = document.getElementById('chatInput');
chatInput.onfocus = function() {
    inchat = true;
    socket.emit('keyPress', {key:'up', state:false});
    socket.emit('keyPress', {key:'down', state:false});
    socket.emit('keyPress', {key:'left', state:false});
    socket.emit('keyPress', {key:'right', state:false});
    socket.emit('keyPress', {key:'heal', state:false});
};
chatInput.onblur = function() {
    inchat = false;
};
chatInput.onkeydown = function(e) {
    if (!e.isTrusted) {
        socket.emit('timeout');
    }
    if (e.key == 'Enter') {
        if (chatInput.value != '') {
            socket.emit('chat', chatInput.value);
            chatInput.value = '';
        }
    }
};
socket.on('insertChat', function(data) {
    if (loaded) insertChat(data);
});
function insertChat(data) {
    var time = new Date();
    var minute = '' + time.getMinutes();
    if(minute.length == 1){
        minute = '' + 0 + minute;
    }
    if(minute == '0'){
        minute = '00';
    }
    const msg = document.createElement('div');
    msg.innerHTML = '[' + time.getHours() + ':' + minute + '] <span style="' + data.style + '">' + data.text + '</span>';
    var scroll = false;
    if (chat.scrollTop + chat.clientHeight >= chat.scrollHeight - 5) scroll = true;
    chat.appendChild(msg);
    if (scroll) chat.scrollTop = chat.scrollHeight;
    messages.unshift(msg);
    if (messages.length >= 100) messages.pop().remove();
};

// world map
const map = document.getElementById('worldMap');
var worldMap = {
    x: 0,
    y: 0,
    map: 'World',
    scale: 1,
    dragging: false
};
function updateWorldMap() {
    // worldMap.x = Math.max((-map.width+488)+map.width*(1-worldMap.scale), Math.min(worldMap.x, -map.width*(1-worldMap.scale)));
    // worldMap.y = Math.max((-map.height+488)+map.height*(1-worldMap.scale), Math.min(worldMap.y, -map.height*(1-worldMap.scale)));
    map.style.transform = 'scale(' + worldMap.scale + ')';
    map.style.left = worldMap.x + 'px';
    map.style.top = worldMap.y + 'px';
};
map.onmousedown = function() {
    map.requestPointerLock();
    worldMap.dragging = true;
};
map.onmouseup = function() {
    if (settings.pointerLock) document.body.requestPointerLock();
    else if (document.pointerLockElement == map) document.exitPointerLock();
    worldMap.dragging = false;
};
map.onmousemove = function(e) {
    if (worldMap.dragging) {
        worldMap.x += e.movementX;
        worldMap.y += e.movementY;
        updateWorldMap();
    }
};
map.addEventListener('wheel', function(e) {
    worldMap.scale -= e.deltaY/5000;
    worldMap.scale = Math.max(0.1, Math.min(worldMap.scale, 2));
    worldMap.x += ((mouseX+window.innerWidth/2)-worldMap.x)/(map.width*worldMap.scale)*(-e.deltaY/5000);
    worldMap.y += ((mouseY+window.innerHeight/2)-worldMap.y)/(map.height*worldMap.scale)*(-e.deltaY/5000);
    console.log(((mouseX+window.innerWidth/2)-worldMap.x)/(map.width*worldMap.scale))
    updateWorldMap();
}, {passive: true});
updateWorldMap();

// performance metrics
var fpsTimes = [];
var tpsCounter = 0;
var pingCounter = 0;
var pingSend = 0;
var frameTimeCounter = 0;
var frameStart = 0;
var entTimeCounter = 0;
var entStart = 0;
var lightTimeCounter = 0;
var lightStart = 0;
var mapTimeCounter = 0;
var mapStart = 0;
var debugTimeCounter = 0;
var debugStart = 0;
var tickTime = 0;
var entTime = 0;
var packetTime = 0;
var serverHeapUsed = 0;
var serverHeapMax = 0;
setInterval(function() {
    if (loaded && !document.hidden) {
        while (performance.now()-fpsTimes[0] > 1000) fpsTimes.shift();
        document.getElementById('fps').innerText = 'FPS: ' + fpsTimes.length;
        document.getElementById('tps').innerText = 'TPS: ' + tpsCounter;
        document.getElementById('ping').innerText = 'Ping: ' + pingCounter + 'ms';
        pingSend = performance.now();
        socket.emit('ping');
        if (settings.debug) {
            var entities = 0, monsters = 0, projectiles = 0, particles = 0;
            for (let i in Player.list) {entities++;}
            for (let i in Monster.list) {entities++; monsters++;}
            for (let i in Projectile.list) {entities++; projectiles++;}
            for (let i in Particle.list) {entities++; particles++;}
            for (let i in DroppedItem.list) {entities++;}
            document.getElementById('enttotal').innerText = 'Ent: ' + entities;
            document.getElementById('entmonst').innerText = 'Mon: ' + monsters;
            document.getElementById('entproj').innerText = 'Proj: ' + projectiles;
            document.getElementById('entpart').innerText = 'Part: ' + particles;
            document.getElementById('drawTime').innerText = 'Frame: ' + frameTimeCounter + 'ms';
            document.getElementById('entdrawTime').innerText = 'Entity: ' + entTimeCounter + 'ms';
            document.getElementById('mapdrawTime').innerText = 'Map: ' + mapTimeCounter + 'ms';
            document.getElementById('debugdrawTime').innerText = 'Debug: ' + debugTimeCounter + 'ms';
            document.getElementById('tickTime').innerText = 'Tick: ' + tickTime + 'ms';
            document.getElementById('serverHeap').innerText = 'Server Heap: ' + serverHeapUsed + '/' + serverHeapMax + 'MB';
            document.getElementById('clientHeap').innerText = 'Heap: ' + Math.round(performance.memory.usedJSHeapSize/1048576*100)/100 + '/' + Math.round(performance.memory.jsHeapSizeLimit/1048576*100)/100 + 'MB';
        }
    }
}, 500);
socket.on('pong', function() {
    var current = performance.now();
    pingCounter = Math.round((current-pingSend)*100)/100;
});

// debug console
var indebug = false;
const debugConsoleEnabled = new URLSearchParams(window.location.search).get('console');
if (debugConsoleEnabled) {
    var consoleHistory = [];
    var historyIndex = 0;
    const consoleInput = document.getElementById('debugInput');
    const consoleLog = document.getElementById('debugLog');
    consoleInput.onkeydown = function(event) {
        if (event.key == 'Enter') {
            if (consoleInput.value != '') {
                socket.emit('debugInput', consoleInput.value);
                if (consoleInput.value != consoleHistory[consoleHistory.length-1]) consoleHistory.push(consoleInput.value);
                historyIndex = consoleHistory.length;
                const log = document.createElement('div');
                log.className = 'ui-darkText';
                log.innerText = '> ' + consoleInput.value;
                var scroll = false;
                if (consoleLog.scrollTop + consoleLog.clientHeight >= consoleLog.scrollHeight - 5) scroll = true;
                consoleLog.appendChild(log);
                if (scroll) consoleLog.scrollTop = consoleLog.scrollHeight;
                consoleInput.value = '';
            }
        }
        if (event.key == 'ArrowUp') {
            historyIndex--;
            if (historyIndex < 0) {
                historyIndex = 0;
            }
            if (consoleHistory[historyIndex]) consoleInput.value = consoleHistory[historyIndex];
        }
        if (event.key == 'ArrowDown') {
            historyIndex++;
            if (consoleHistory[historyIndex]) consoleInput.value = consoleHistory[historyIndex];
            if (historyIndex >= consoleHistory.length) {
                historyIndex = consoleHistory.length;
                consoleInput.value = '';
            }
        }
    };
    socket.on('debugLog', function(msg) {
        const log = document.createElement('div');
        log.className = 'ui-darkText';
        log.style.color = msg.color;
        log.innerText = msg.msg;
        var scroll = false;
        if (consoleLog.scrollTop + consoleLog.clientHeight >= consoleLog.scrollHeight - 5) scroll = true;
        consoleLog.appendChild(log);
        if (scroll) consoleLog.scrollTop = consoleLog.scrollHeight;
    });
    consoleInput.onfocus = function() {
        indebug = true;
    };
    consoleInput.onblur = function() {
        indebug = false;
    };
    document.getElementById('debugConsoleButton').style.display = 'block';
}