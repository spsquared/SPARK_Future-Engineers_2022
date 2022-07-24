socket = new WebSocket('ws://192.168.1.151:4040');

const log = document.getElementById('eventLogBody');
var connected = false;
socket.onmessage = function(e) {
    const div = document.createElement('div');
    div.classList.add('logBlock');
    div.innerText = e.data;
    log.appendChild(div);
};
socket.onopen = function() {
    connected = true;
    const div = document.createElement('div');
    div.classList.add('logBlock');
    div.innerText = 'Connected!';
    div.style.backgroundColor = 'lime';
    log.appendChild(div);
};
socket.onclose = function() {
    connected = false;
    const div = document.createElement('div');
    div.classList.add('logBlock');
    div.innerText = 'Connection closed';
    div.style.backgroundColor = 'red';
    log.appendChild(div)
    setTimeout(function() {
        const div = document.createElement('div');
        div.classList.add('logBlock');
        div.innerText = 'Attempting to reconnect...';
        log.appendChild(div)
        var newsocket = new WebSocket('ws://192.168.1.151:4040');
        newsocket.onmessage = socket.onmessage;
        newsocket.onopen = socket.onopen;
        newsocket.onclose = socket.onclose;
        socket = newsocket;
    }, 5000);
};
function send(event, data) {
    if (connected) {
        socket.send(JSON.stringify({
            event: event,
            data: data
        }));
    }
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
    grabbing = false;
    joystickPin.style.right = '150px';
    joystickPin.style.bottom = '150px';
    sliderX.style.bottom = '190px';
    sliderY.style.right = '190px';
    angle = 0;
    distance = 0;
    send('joystick', {throttle: 0, steering: 0});
};
document.addEventListener('touchend', function(e) {
    grabbingtouch = false;
    joystickPin.style.right = '150px';
    joystickPin.style.bottom = '150px';
    sliderX.style.bottom = '190px';
    sliderY.style.right = '190px';
    angle = 0;
    distance = 0;
    send('joystick', {throttle: 0, steering: 0});
}, {passive: true});
document.addEventListener('touchcancel', function(e) {
    grabbingtouch = false;
    joystickPin.style.right = '150px';
    joystickPin.style.bottom = '150px';
    sliderX.style.bottom = '190px';
    sliderY.style.right = '190px';
    angle = 0;
    distance = 0;
    send('joystick', {throttle: 0, steering: 0});
}, {passive: true});
document.onmousemove = function(e) {
    if (grabbing) {
        var x = Math.max(-150, Math.min(e.clientX-window.innerWidth+200, 150));
        var y = Math.max(-150, Math.min(e.clientY-window.innerHeight+200, 150));
        throttle = Math.round(x*0.75);
        steering = Math.round(y*0.75);
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
                throttle = Math.round(x*0.75);
                steering = Math.round(y*0.75);
                joystickPin.style.bottom = 150-y + 'px';
                joystickPin.style.right = 150-x + 'px';
                sliderX.style.bottom = 190-y + 'px';
                sliderY.style.right = 190-x + 'px';
                break;
            }
        }
    }
}, {passive: true});
setInterval(function() {
    if (throttle != 0 || steering != 0) {
        send('joystick', {throttle: throttle, steering: steering});
    }
}, 100);

// controllers
function updateControllers() {
    var controllers = navigator.getGamepads();
    for (var i in controllers) {
        if (controllers[i] instanceof Gamepad) {
            var controller = controllers[i];
            throttle = Math.round(controller.axes[1]*-100);
            steering = Math.round(controller.axes[2]*100);
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
}, 50);

// capture
document.getElementById('captureButton').onclick = function(e) {
    send('capture', {});
};