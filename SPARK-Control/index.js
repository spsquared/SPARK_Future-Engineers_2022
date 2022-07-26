socket = new WebSocket('ws://192.168.1.151:4040');

const log = document.getElementById('eventLogBody');
var connected = false;
function send(event, data) {
    if (connected) {
        socket.send(JSON.stringify({
            event: event,
            data: data
        }));
    }
};
function appendLog(text, color) {
    const div = document.createElement('div');
    div.classList.add('logBlock');
    div.innerText = text;
    div.style.backgroundColor = color ?? '';
    var scroll = false;
    if (log.scrollTop + log.clientHeight >= log.scrollHeight - 5) scroll = true;
    log.appendChild(div);
    if (scroll) log.scrollTop = log.scrollHeight;
};
socket.onmessage = function(e) {
    var event = JSON.parse(e.data).event;
    var data = JSON.parse(e.data).data;
    switch (event) {
        case 'message':
            playSound();
            appendLog(data);
            break;
        case 'capture':
            // slowconvert(data);
            break;
        case 'colors':
            setColors(data);
            break;
        
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
async function playSound() {
    var ping = new Audio('ping.mp3');
    ping.addEventListener('loadeddata', function() {
        ping.play();
    });
};

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
const joystick = document.getElementById('joystickBody');
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
trim = 10
function updateControllers() {
    var controllers = navigator.getGamepads();
    for (var i in controllers) {
        if (controllers[i] instanceof Gamepad) {
            var controller = controllers[i];
            throttle = Math.round(controller.axes[1]*-100);
            steering = Math.round(controller.axes[2]*100)-trim;
            // buttons.clicking = controller.buttons[0].pressed;
            // buttons.interacting = controller.buttons[3].pressed;
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
streaming = false;
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
const redR = document.getElementById('redR');
const redG = document.getElementById('redG');
const redB = document.getElementById('redB');
const redT = document.getElementById('redT');
const greenR = document.getElementById('greenR');
const greenG = document.getElementById('greenG');
const greenB = document.getElementById('greenB');
const greenT = document.getElementById('greenT');
const blueR = document.getElementById('blueR');
const blueG = document.getElementById('blueG');
const blueB = document.getElementById('blueB');
const blueT = document.getElementById('blueT');
document.getElementById('captureFilterButton').onclick = function(e) {
    arr = [
        [
            redR.value,
            redG.value,
            redB.value,
            redT.value,
        ],
        [
            greenR.value,
            greenG.value,
            greenB.value,
            greenT.value,
        ],
        [
            blueR.value,
            blueG.value,
            blueB.value,
            blueT.value,
        ],
    ]
    send('captureFilter', arr);
};
redR.oninput();
redG.oninput();
redB.oninput();
redT.oninput();
greenR.oninput();
greenG.oninput();
greenB.oninput();
greenT.oninput();
blueR.oninput();
blueG.oninput();
blueB.oninput();
blueT.oninput();

function setColors(colors) {
    redR.value = colors[0][0];
    redG.value = colors[0][1];
    redB.value = colors[0][2];
    redT.value = colors[0][3];
    greenR.value = colors[1][0];
    greenG.value = colors[1][1];
    greenB.value = colors[1][2];
    greenT.value = colors[1][3];
    blueR.value = colors[2][0];
    blueG.value = colors[2][1];
    blueB.value = colors[2][2];
    blueT.value = colors[2][3];
    redR.oninput();
    redG.oninput();
    redB.oninput();
    redT.oninput();
    greenR.oninput();
    greenG.oninput();
    greenB.oninput();
    greenT.oninput();
    blueR.oninput();
    blueG.oninput();
    blueB.oninput();
    blueT.oninput();
    arr = [
        [
            redR.value,
            redG.value,
            redB.value,
            redT.value,
        ],
        [
            greenR.value,
            greenG.value,
            greenB.value,
            greenT.value,
        ],
        [
            blueR.value,
            blueG.value,
            blueB.value,
            blueT.value,
        ],
    ]
    send('colors', arr);
};