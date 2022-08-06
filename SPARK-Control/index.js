socket = new WebSocket('ws://192.168.1.151:4040');

const log = document.getElementById('eventLogBody');
const callbacks = [];
var connected = false;
function addListener(event, cb) {
    callbacks[event] = cb;
};
function send(event, data) {
    if (connected) {
        socket.send(JSON.stringify({
            event: event,
            data: data
        }));
    }
};
socket.onmessage = function(e) {
    console.log(e)
    var json = JSON.parse(e.data);
    for (var i in callbacks) {
        if (i == json.event) {
            callbacks[i](json.data);
        }
    }
};
socket.onopen = function() {
    connected = true;
    appendLog('Connected!', 'lime');
};
socket.onclose = function() {
    connected = false;
    appendLog('Connection closed', 'red');
    setTimeout(function() {
        appendLog('Attempting to reconnect...');
        var newsocket = new WebSocket('ws://192.168.1.151:4040');
        newsocket.onmessage = socket.onmessage;
        newsocket.onopen = socket.onopen;
        newsocket.onclose = socket.onclose;
        socket = newsocket;
    }, 10000);
};

// messages
var pendingsounds = [];
var first = true;
async function playSound() {
    if (first) {
        for (var i = 0; i < 10; i++) {
            await new Promise(function(resolve, reject) {
                var ping = new Audio('ping.mp3');
                ping.preload = true;
                ping.addEventListener('loadeddata', function() {
                    pendingsounds.push(ping);
                    resolve();
                });
            });
        }
        first = false;
    }
    pendingsounds[0].play();
    pendingsounds.shift();
    var ping = new Audio('ping.mp3');
    ping.preload = true;
    ping.addEventListener('loadeddata', function() {
        pendingsounds.push(ping);
    });
};
function appendLog(text, color) {
    const div = document.createElement('div');
    div.classList.add('logBlock');
    div.innerHTML = text;
    div.style.backgroundColor = color ?? '';
    var scroll = false;
    if (log.scrollTop + log.clientHeight >= log.scrollHeight - 5) scroll = true;
    log.appendChild(div);
    if (scroll) log.scrollTop = log.scrollHeight;
};
addListener('message', function(data) {
    playSound();
    appendLog(data);
});

// keys
document.onkeydown = function(e) {
    const key = e.key.toLowerCase();
    send('key', {key: key});
};
document.onkeyup = function(e) {
    const key = e.key.toUpperCase();
    send('key', {key: key});
};

// joystick
const joystick = document.getElementById('joystick');
const joystickPin = document.getElementById('joystickPin');
const sliderX = document.getElementById('sliderX');
const sliderY = document.getElementById('sliderY');

var grabbing = false;
var grabbingtouch = false;
var throttle = 0;
var steering = 0;
joystick.onmousedown = function(e) {
    grabbing = true;
};
joystick.addEventListener('touchstart', function(e) {
    grabbingtouch = true;
}, {passive: true});
document.onmouseup = function(e) {
    if (grabbing) {
        grabbing = false;
        joystickPin.style.right = '150px';
        joystickPin.style.bottom = '150px';
        sliderX.style.bottom = '190px';
        sliderY.style.right = '190px';
        throttle = 0;
        steering = 0;
        send('joystick', {throttle: 0, steering: 0});
    }
};
document.addEventListener('touchend', function(e) {
    if (grabbingtouch) {
        grabbingtouch = false;
        joystickPin.style.right = '150px';
        joystickPin.style.bottom = '150px';
        sliderX.style.bottom = '190px';
        sliderY.style.right = '190px';
        throttle = 0;
        steering = 0;
        send('joystick', {throttle: 0, steering: 0});
    }
}, {passive: true});
document.addEventListener('touchcancel', function(e) {
    if (grabbingtouch) {
        grabbingtouch = false;
        joystickPin.style.right = '150px';
        joystickPin.style.bottom = '150px';
        sliderX.style.bottom = '190px';
        sliderY.style.right = '190px';
        throttle = 0;
        steering = 0;
        send('joystick', {throttle: 0, steering: 0});
    }
}, {passive: true});
document.onmousemove = function(e) {
    if (grabbing) {
        var x = Math.max(-150, Math.min(e.clientX-window.innerWidth+200, 150));
        var y = Math.max(-150, Math.min(e.clientY-window.innerHeight+200, 150));
        throttle = Math.round(-y*2/3);
        steering = Math.round(x*2/3);
        joystickPin.style.bottom = 150-y + 'px';
        joystickPin.style.right = 150-x + 'px';
        sliderX.style.bottom = 190-y + 'px';
        sliderY.style.right = 190-x + 'px';
    }
};
document.addEventListener('touchmove', function(e) {
    if (grabbingtouch) {
        for (var i in e.touches) {
            if (joystick.contains(e.touches[i].target)) {
                var x = Math.max(-150, Math.min(e.touches[i].clientX-window.innerWidth+200, 150));
                var y = Math.max(-150, Math.min(e.touches[i].clientY-window.innerHeight+200, 150));
                throttle = Math.round(-y*2/3);
                steering = Math.round(x*2/3);
                joystickPin.style.bottom = 150-y + 'px';
                joystickPin.style.right = 150-x + 'px';
                sliderX.style.bottom = 190-y + 'px';
                sliderY.style.right = 190-x + 'px';
                break;
            }
        }
    }
}, {passive: true});

// controllers
var trim = 0;
var trim2 = 0.1;
var pressedbuttons = [];
function updateControllers() {
    var controllers = navigator.getGamepads();
    for (var i in controllers) {
        if (controllers[i] instanceof Gamepad) {
            var controller = controllers[i];
            throttle = Math.round(controller.axes[1]*-100);
            steering = Math.round((controller.axes[2]-trim2)*100)-trim;
            if (controller.buttons[8].pressed && pressedbuttons.indexOf(8) == -1) {
                if (controller.buttons[7].pressed) document.getElementById('captureFilterButton').onclick();
                else document.getElementById('captureButton').onclick();
                pressedbuttons.push(8);
            } else if (!controller.buttons[8].pressed && pressedbuttons.indexOf(8) != -1) {
                pressedbuttons.splice(pressedbuttons.indexOf(8), 1);
            }
            if (controller.buttons[9].pressed && pressedbuttons.indexOf(9) == -1) {
                if (controller.buttons[7].pressed) document.getElementById('captureFilterStreamButton').onclick();
                else document.getElementById('captureStreamButton').onclick();
                pressedbuttons.push(9);
            } else if (!controller.buttons[9].pressed && pressedbuttons.indexOf(9) != -1) {
                pressedbuttons.splice(pressedbuttons.indexOf(9), 1);
            }
            joystickPin.style.bottom = 150-(controller.axes[1]*150) + 'px';
            joystickPin.style.right = 150-(controller.axes[2]*150) + 'px';
            sliderX.style.bottom = 190-(controller.axes[1]*150) + 'px';
            sliderY.style.right = 190-(controller.axes[2]*150) + 'px';
            break;
        }
    }
};
setInterval(function() {
    updateControllers()
}, 25);

// send
setInterval(function() {
    if (throttle != 0 || steering != 0) {
        send('joystick', {throttle: throttle, steering: steering});
    }
}, 50);

// capture
document.getElementById('captureButton').onclick = function(e) {
    send('capture', {});
};
var streaming = false;
document.getElementById('captureStreamButton').onclick = function(e) {
    streaming = !streaming;
    send('captureStream', {state: streaming});
    if (streaming) {
        document.getElementById('captureStreamButton').innerText = 'STOP CAPTURE STREAM';
        document.getElementById('captureStreamButton').style.backgroundColor = 'lightcoral';
    } else {
        document.getElementById('captureStreamButton').innerText = 'START CAPTURE STREAM';
        document.getElementById('captureStreamButton').style.backgroundColor = 'lightgreen';
    }
};

// filtered capture (ignore the terrible coding practices this was intended to be a temporary thing)
var sliders = [
    document.getElementById('redRMax'),
    document.getElementById('greenRMax'),
    document.getElementById('wallRMax'),
    document.getElementById('redGMax'),
    document.getElementById('greenGMax'),
    document.getElementById('wallGMax'),
    document.getElementById('redBMax'),
    document.getElementById('greenBMax'),
    document.getElementById('wallBMax'),
    document.getElementById('redRMin'),
    document.getElementById('greenRMin'),
    document.getElementById('wallRMin'),
    document.getElementById('redGMin'),
    document.getElementById('greenGMin'),
    document.getElementById('wallGMin'),
    document.getElementById('redBMin'),
    document.getElementById('greenBMin'),
    document.getElementById('wallBMin'),
];
document.getElementById('captureFilterButton').onclick = function(e) {
    arr = [];
    for (var i in sliders) {
        arr.push(sliders[i].value);
    }
    send('captureFilter', arr);
};
var filterstreaming = false;
document.getElementById('captureFilterStreamButton').onclick = function(e) {
    arr = [];
    for (var i in sliders) {
        arr.push(sliders[i].value);
    }
    send('colors', arr);
    filterstreaming = !filterstreaming;
    send('captureFilterStream', {state: filterstreaming});
    if (filterstreaming) {
        document.getElementById('captureFilterStreamButton').innerText = 'STOP FILTERED CAPTURE STREAM';
        document.getElementById('captureFilterStreamButton').style.backgroundColor = 'lightcoral';
    } else {
        document.getElementById('captureFilterStreamButton').innerText = 'START FILTERED CAPTURE STREAM';
        document.getElementById('captureFilterStreamButton').style.backgroundColor = 'lightgreen';
    }
};
function updateSlider(i) {
    document.getElementById(sliders[i].id + 'indicator').innerText = sliders[i].value;
};
function setColors(colors) {
    for (var i in colors) {
        sliders[i].value = colors[i];
        updateSlider(i);
    }
    arr = [];
    for (var i in sliders) {
        arr.push(sliders[i].value);
    }
    send('colors', arr);
};
addListener('colors', setColors);

// non capture stream
var streaming = false;
document.getElementById('streamButton').onclick = function(e) {
    streaming = !streaming;
    send('stream', {state: streaming});
    if (streaming) {
        document.getElementById('streamButton').innerText = 'STOP STREAM';
        document.getElementById('streamButton').style.backgroundColor = 'lightcoral';
    } else {
        document.getElementById('streamButton').innerText = 'START STREAM';
        document.getElementById('streamButton').style.backgroundColor = 'lightgreen';
    }
};

// bad coding practices
var initcolors = [
    [
        190, 80, 80,
        95, 40, 35
    ],
    [
        85, 150, 125,
        30, 90, 70
    ],
    [
        70, 80, 90,
        20, 20, 20
    ]
]
sliders[0].value = initcolors[0][0];
sliders[1].value = initcolors[1][0];
sliders[2].value = initcolors[2][0];
sliders[3].value = initcolors[0][1];
sliders[4].value = initcolors[1][1];
sliders[5].value = initcolors[2][1];
sliders[6].value = initcolors[0][2];
sliders[7].value = initcolors[1][2];
sliders[8].value = initcolors[2][2];
sliders[9].value = initcolors[0][3];
sliders[10].value = initcolors[1][3];
sliders[11].value = initcolors[2][3];
sliders[12].value = initcolors[0][4];
sliders[13].value = initcolors[1][4];
sliders[14].value = initcolors[2][4];
sliders[15].value = initcolors[0][5];
sliders[16].value = initcolors[1][5];
sliders[17].value = initcolors[2][5];
for (var i in sliders) {
    updateSlider(i);
}

// capture display
var recentCaptures = [];
var recentBlobs = [];
var index = 0;
const displayImg = document.getElementById('displayImg');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext("2d");
ctx.canvas.width = 272;
ctx.canvas.height = 154;
const FPS = document.getElementById('fps');
var fpsTimes = [];
function addCapture(img) {
    recentCaptures.unshift('data:image/png;base64,' + img);
    recentBlobs.unshift(null);
    if (recentCaptures.length > 50) {
        recentCaptures.pop();
        recentBlobs.pop();
    }
    index = 0;
    displayImg.src = recentCaptures[index];

    var now = performance.now();
    while(fpsTimes.length > 0 && fpsTimes[0] <= now - 1000){
        fpsTimes.shift();
    }
    fpsTimes.push(now);
    FPS.innerHTML = 'FPS: ' + fpsTimes.length;
};
function drawBlobs(data) {
    recentBlobs[index] = data;
    ctx.clearRect(0,0,272,154);
    drawBlob(recentBlobs[index][0],0);
    drawBlob(recentBlobs[index][1],1);
}
function drawBlob(blob,blobColor){
    if(!blob){
        return;
    }
    ctx.beginPath();
    if(blobColor === 0){
        ctx.strokeStyle = "#f00";
        ctx.fillStyle = "#F005";
    }
    else{
        ctx.strokeStyle = "#0f0"
        ctx.fillStyle = "#0F05";
    }
    ctx.arc(blob[0],blob[1],blob[2], 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
};
async function displayBack() {
    index = Math.min(index+1, recentCaptures.length-1);
    if (recentCaptures[index]) displayImg.src = recentCaptures[index];
    if (recentBlobs[index]) drawBlobs(recentBlobs[index]);
};
async function displayFront() {
    index = Math.max(index-1, 0);
    if (recentCaptures[index]) displayImg.src = recentCaptures[index];
    if (recentBlobs[index]) drawBlobs(recentBlobs[index]);
};
addListener('capture', addCapture);
addListener('blobs', drawBlobs);

// blobs

// stop
document.getElementById('emergencyStop').onclick = function() {
    send('stop', {});
};

// errors
window.onerror = function(err) {
    appendLog(err, 'red')
};
document.onerror = function(err) {
    appendLog(err, 'red')
};