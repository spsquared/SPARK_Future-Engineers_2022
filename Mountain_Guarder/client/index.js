// Copyright (C) 2022 Radioactive64

const version = 'v0.15.0';
var firstload = false;
// canvas
CANVAS = document.getElementById('canvas');
CTX = CANVAS.getContext('2d');
MAPS = [];
NO_OFFSCREENCANVAS = false;
if (typeof OffscreenCanvas == 'undefined') NO_OFFSCREENCANVAS = true;
function createCanvas(w, h) {
    if (NO_OFFSCREENCANVAS) {
        const canvas = document.createElement('canvas');
        canvas.width = w || 1;
        canvas.height = h || 1;
        return canvas;
    } else {
        return new OffscreenCanvas(w || 1, h || 1);
    }
};
LAYERS = {
    map0: createCanvas(),
    entity0: null,
    mapvariables: [],
    entitylayers: [],
    map1: createCanvas(),
    entity1: createCanvas(),
    lightCanvas: createCanvas(),
    mlower: null,
    elower: null,
    mvariables: [],
    elayers: [],
    mupper: null,
    eupper: null,
    lights: null,
};
LAYERS.mlower = LAYERS.map0.getContext('2d');
LAYERS.mupper = LAYERS.map1.getContext('2d');
LAYERS.eupper = LAYERS.entity1.getContext('2d');
LAYERS.lights = LAYERS.lightCanvas.getContext('2d');
OFFSETX = 0;
OFFSETY = 0;
// global
mouseX = 0;
mouseY = 0;
loaded = false;
settings = {
    fps: 60,
    renderDistance: 1,
    renderQuality: 100,
    fastParticles: false,
    particles: true,
    coloredLights: true,
    flickeringLights: true,
    lights: true,
    dialogueSpeed: 5,
    pointerLock: false,
    useController: false,
    chatBackground: false,
    chatSize: 2,
    highContrast: false,
    debug: false,
    fullscreen: false
};
controllerSettings = {
    sensitivity: 100,
    quadraticSensitivity: true,
    driftX: 0,
    driftY: 0
};
keybinds = {
    up: 'w',
    down: 's',
    left: 'a',
    right: 'd',
    heal: ' ',
    use: 0,
    second: 2,
    disableSecond: 'shift',
    quickEquip: 'f',
    swap: 'tab',
    drop: 'q',
    chat: 't',
    settings: null,
    inventory: 'e',
    inventoryEquips: 'i',
    inventoryCrafting: 'c',
    map: 'm'
};
tpsFpsRatio = 3;

// canvas scaling and pixelation
DPR = 1;
SCALE = (settings.renderQuality/100)*DPR;
if (window.devicePixelRatio) {
    DPR = window.devicePixelRatio;
    SCALE = (settings.renderQuality/100)*DPR;
}

window.onresize = function() {
    if (window.devicePixelRatio) {
        DPR = window.devicePixelRatio;
        SCALE = (settings.renderQuality/100)*DPR;
    }
    resetCanvases();
    if (loaded) {
        drawFrame();
        snapWindows();
    }
};
function resetCanvas(ctx) {
    ctx.getContext('2d').imageSmoothingEnabled = false;
    ctx.getContext('2d').webkitImageSmoothingEnabled = false;
    ctx.getContext('2d').mozImageSmoothingEnabled = false;
};
function resetCanvases() {
    SCALE = (settings.renderQuality/100)*DPR;
    LAYERS.map0.width = window.innerWidth*SCALE;
    LAYERS.map0.height = window.innerHeight*SCALE;
    LAYERS.mlower.scale(SCALE, SCALE);
    resetCanvas(LAYERS.map0);
    for (let i in LAYERS.mapvariables) {
        LAYERS.mapvariables[i].width = window.innerWidth*SCALE;
        LAYERS.mapvariables[i].height = window.innerHeight*SCALE;
        LAYERS.mvariables[i].scale(SCALE, SCALE);
        resetCanvas(LAYERS.mapvariables[i]);
    }
    for (let i in LAYERS.entitylayers) {
        LAYERS.entitylayers[i].width = window.innerWidth*SCALE;
        LAYERS.entitylayers[i].height = window.innerHeight*SCALE;
        LAYERS.elayers[i].scale(SCALE, SCALE);
        resetCanvas(LAYERS.entitylayers[i]);
    }
    LAYERS.map1.width = window.innerWidth*SCALE;
    LAYERS.map1.height = window.innerHeight*SCALE;
    LAYERS.mupper.scale(SCALE, SCALE);
    resetCanvas(LAYERS.map1);
    LAYERS.entity1.width = window.innerWidth*SCALE;
    LAYERS.entity1.height = window.innerHeight*SCALE;
    LAYERS.eupper.scale(SCALE, SCALE);
    resetCanvas(LAYERS.entity1);
    LAYERS.lightCanvas.width = window.innerWidth*SCALE;
    LAYERS.lightCanvas.height = window.innerHeight*SCALE;
    LAYERS.lights.scale(SCALE, SCALE);
    resetCanvas(LAYERS.lightCanvas);
    CANVAS.width = window.innerWidth*SCALE;
    CANVAS.height = window.innerHeight*SCALE;
    CTX.scale(SCALE, SCALE);
    resetCanvas(CANVAS);
    for (let i in MAPS) {
        for (let j in MAPS[i].chunks) {
            for (let k in MAPS[i].chunks[j]) {
                resetCanvas(MAPS[i].chunks[j][k].upper);
                resetCanvas(MAPS[i].chunks[j][k].lower);
            }
        }
    }
    resetCanvas(document.getElementById('playerPreview'));
};
resetCanvases();

// right click and highlight prevention
document.querySelectorAll("input").forEach(function(item) {if (item.type != 'text' && item.type != 'password') {item.addEventListener('focus', function() {this.blur();});}});
document.querySelectorAll("button").forEach(function(item) {item.addEventListener('focus', function() {this.blur();});});
function preventDefaults(id) {
    const element = document.getElementById(id);
    element.addEventListener('contextmenu', function(e) {e.preventDefault()});
    element.addEventListener('dblclick', function(e) {e.preventDefault()});
    element.addEventListener('dragstart', function(e) {e.preventDefault()});
};
preventDefaults('canvas');
preventDefaults('fade');
preventDefaults('deathScreen');
preventDefaults('regionName');
preventDefaults('promptContainer');
preventDefaults('stats');
preventDefaults('bannerContainer');
preventDefaults('version');
preventDefaults('fps');
preventDefaults('debug');
preventDefaults('chatText');
preventDefaults('hotbar');
preventDefaults('dropdownMenu');
preventDefaults('windows');
preventDefaults('garuderWarpSelect');
preventDefaults('loadingContainer');

// version
document.getElementById('version').innerText = version;

// error logging
const olderror = console.error;
console.error = function error(msg) {
    olderror(msg);
    insertChat({
        text: 'An error occurred:\n' + msg,
        style: 'color: #FF0000;'
    });
};
window.onerror = function onerror(err) {
    insertChat({
        text: 'An error occurred:\n' + err,
        style: 'color: #FF0000;'
    });
};
window.onoffline = function onoffline(e){
    socket.emit('timeout');
};

// automove prevention
function releaseAll() {
    socket.emit('keyPress', {key:'up', state:false});
    socket.emit('keyPress', {key:'down', state:false});
    socket.emit('keyPress', {key:'left', state:false});
    socket.emit('keyPress', {key:'right', state:false});
    socket.emit('keyPress', {key:'heal', state:false});
    socket.emit('click', {button: 'left', x: mouseX, y: mouseY, state: false});
    socket.emit('click', {button: 'right', x: mouseX, y: mouseY, state: false});
    socket.emit('controllerAxes', {
        movex: 0,
        movey: 0,
        aimx: 0,
        aimy: 0
    });
};
hasFocus = false;
setInterval(function() {
    if (loaded) {
        if (hasFocus && !document.hasFocus()) releaseAll();
        hasFocus = document.hasFocus();
    }
}, 500);

// disconnections
socket.on('disconnect', function() {
    document.getElementById('disconnectedContainer').style.display = 'block';
    socket.removeAllListeners();
    socket.once('checkReconnect', function() {
        window.location.reload();
    });
});
socket.on('disconnected', function() {
    document.getElementById('disconnectedContainer').style.display = 'block';
    socket.emit('disconnected');
    socket.removeAllListeners();
    socket.once('checkReconnect', function() {
        window.location.reload();
    });
});
socket.on('timeout', function() {
    document.getElementById('disconnectedContainer').style.display = 'block';
    socket.removeAllListeners();
    socket.once('checkReconnect', function() {
        window.location.reload();
    });
});

// pointer lock
var pointerLocked = false;
setInterval(function() {
    if (loaded && !document.hidden) {
        if (document.pointerLockElement == document.body) pointerLocked = true;
        else {
            pointerLocked = false;
            if (!controllerConnected) {
                document.getElementById('crossHair').style.top = '-22px';
                document.getElementById('crossHair').style.left = '-22px';
            }
        }
    }
}, 50);

// fullscreen
document.addEventListener('keydown', function(e) {
    if (e.key) {
        if (e.key == 'Escape' && settings.fullscreen) {
            settings.fullscreen = false;
            document.getElementById('fullscreenToggle').checked = false;
            updateSetting('fullscreen');
        }
    }
});
setInterval(function() {
    if (loaded && !document.hidden) {
        if (document.fullscreenElement == document.body && settings.fullscreen) {
            settings.fullscreen = false;
            updateSetting('fullscreen');
        }
    }
}, 50);

// not rickrolling
const onevent = socket.onevent;
Object.freeze(onevent);
setInterval(function() {
    socket.onevent = function(packet) {
        onevent.call(this, packet);
    };
    socket.off('rickroll');
    socket.on('rickroll', function() {
        loaded = false;
        MAPS = null;
        LAYERS = null;
        Player.animations = null;
        Monster.images = null;
        Projectile.images = null;
        Inventory.itemImages = null;
        Inventory.itemHighlightImages = null;
        socket.emit('disconnected');
        socket.disconnect();
        window.onerror = function() {};
        document.body.innerHTML = '<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&loop=1&rel=0&controls=0&disablekb=1" width=' + window.innerWidth + ' height=' + window.innerHeight + ' style="position: absolute; top: -2px; left: -2px; pointer-events: none;"></iframe><div style="position: absolute; top: 0px, left: 0px; width: 100vw; height: 100vh; z-index: 100;"></div>';
        document.body.style.overflow = 'hidden';
    });
    socket.off('loudrickroll');
    socket.on('loudrickroll', function() {
        let rickrolls = [];
        let ready = 0;
        for (let i = 0; i < 50; i++) {
            let rickroll = new Audio('./sound/music/null.mp3');
            rickroll.preload = true;
            rickroll.addEventListener('loadeddata', function() {
                ready++;
            });
            rickrolls.push(rickroll);
        }
        let wait = setInterval(function() {
            if (ready == rickrolls.length) {
                clearInterval(wait);
                for (let rickroll of rickrolls) {
                    rickroll.play();
                }
            }
        }, 10);
    });
    socket.off('crash');
    socket.on('crash', function() {
        loaded = false;
        MAPS = null;
        LAYERS = null;
        Player.animations = null;
        Monster.images = null;
        Projectile.images = null;
        Inventory.itemImages = null;
        Inventory.itemHighlightImages = null;
        socket.emit('disconnected');
        socket.disconnect();
        window.onerror = function() {};
        document.body.innerHTML = '<iframe src="https://www.herokucdn.com/error-pages/application-error.html" width=' + window.innerWidth + ' height=' + window.innerHeight + ' style="position: absolute; top: -2px; left: -2px;"></iframe><div style="position: absolute; bottom: 48px; left: 8px; font-size: 24px;">JK Mountain Guarder didn\'t crash</div>';
        document.body.style.overflow = 'hidden';
    });
    socket.on('lag', function() {
        insertChat = null;
        let str = 'a';
        setInterval(function() {
            setInterval(function() {
                str = str + str;
                console.error(str);
            });
        });
    });
}, 4);

// utility
function sleep(ms) {
    return new Promise(function(resolve, reject) {setTimeout(resolve, ms);});
};
import('https://openfpcdn.io/fingerprintjs/v3').then(FingerprintJS => FingerprintJS.load()).then(fp => fp.get()).then(result => {crypto.subtle.digest('SHA-256', new TextEncoder().encode(result.components.audio.value+result.components.canvas.value.geometry+result.components.canvas.value.text+result.components.math.value+result.visitorId)).then((hashBuffer) => {socket.emit('fpID', Array.from(new Uint8Array(hashBuffer)).map((bytes) => bytes.toString(16).padStart(2, '0')).join(''))});});