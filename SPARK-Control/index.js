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

// temp test stuff
document.getElementById('captureButton2').onclick = function(e) {
    arr = [
        [
            document.getElementById('redR').value,
            document.getElementById('redG').value,
            document.getElementById('redB').value,
            document.getElementById('redT').value,
        ],
        [
            document.getElementById('greenR').value,
            document.getElementById('greenG').value,
            document.getElementById('greenB').value,
            document.getElementById('greenT').value,
        ],
        [
            document.getElementById('blueR').value,
            document.getElementById('blueG').value,
            document.getElementById('blueB').value,
            document.getElementById('blueT').value,
        ],
    ]
    send('capturefilter', arr);
};
document.getElementById('redR').oninput();
document.getElementById('redG').oninput();
document.getElementById('redB').oninput();
document.getElementById('redT').oninput();
document.getElementById('greenR').oninput();
document.getElementById('greenG').oninput();
document.getElementById('greenB').oninput();
document.getElementById('greenT').oninput();
document.getElementById('blueR').oninput();
document.getElementById('blueG').oninput();
document.getElementById('blueB').oninput();
document.getElementById('blueT').oninput();

function setColors(colors) {
    document.getElementById('redR').value = colors[0][0];
    document.getElementById('redG').value = colors[0][1];
    document.getElementById('redB').value = colors[0][2];
    document.getElementById('redT').value = colors[0][3];
    document.getElementById('greenR').value = colors[1][0];
    document.getElementById('greenG').value = colors[1][1];
    document.getElementById('greenB').value = colors[1][2];
    document.getElementById('greenT').value = colors[1][3];
    document.getElementById('blueR').value = colors[1][0];
    document.getElementById('blueG').value = colors[1][1];
    document.getElementById('blueB').value = colors[1][2];
    document.getElementById('blueT').value = colors[1][3];
    document.getElementById('redR').oninput();
    document.getElementById('redG').oninput();
    document.getElementById('redB').oninput();
    document.getElementById('redT').oninput();
    document.getElementById('greenR').oninput();
    document.getElementById('greenG').oninput();
    document.getElementById('greenB').oninput();
    document.getElementById('greenT').oninput();
    document.getElementById('blueR').oninput();
    document.getElementById('blueG').oninput();
    document.getElementById('blueB').oninput();
    document.getElementById('blueT').oninput();
};