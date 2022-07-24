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
var angle = 0;
var distance = 0;
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
        var x = e.clientX-window.innerWidth+200;
        var y = e.clientY-window.innerHeight+200;
        angle = Math.atan2(y, x);
        distance = Math.min(150, Math.sqrt(Math.pow(x, 2)+Math.pow(y, 2)));
        joystickPin.style.bottom = 150-(Math.sin(angle)*distance) + 'px';
        joystickPin.style.right = 150-(Math.cos(angle)*distance) + 'px';
        sliderX.style.bottom = 190-(Math.sin(angle)*distance) + 'px';
        sliderY.style.right = 190-(Math.cos(angle)*distance) + 'px';
    }
};
document.addEventListener('touchmove', function(e) {
    if (grabbingtouch) {
        for (var i in e.touches) {
            if (joystick.contains(e.touches[i].target)) {
                var x = e.touches[i].clientX-window.innerWidth+200;
                var y = e.touches[i].clientY-window.innerHeight+200;
                angle = Math.atan2(y, x);
                distance = Math.min(150, Math.sqrt(Math.pow(x, 2)+Math.pow(y, 2)));
                joystickPin.style.bottom = 150-(Math.sin(angle)*distance) + 'px';
                joystickPin.style.right = 150-(Math.cos(angle)*distance) + 'px';
                sliderX.style.bottom = 190-(Math.sin(angle)*distance) + 'px';
                sliderY.style.right = 190-(Math.cos(angle)*distance) + 'px';
            }
        }
    }
}, {passive: true});
setInterval(function() {
    if (angle != 0 || distance != 0) {
        var angle2 = angle;
        var distance2 = distance;
        if (angle > 0) {
            angle2 *= -1;
            distance2 *= -1;
        }
        var steering = Math.round(Math.max(-Math.PI/3, Math.min(angle2+Math.PI/2, Math.PI/3))*300/Math.PI);
        var throttle = Math.round(distance2/1.5, 2)
        send('joystick', {throttle: throttle, steering: steering});
    }
}, 100);

// capture
document.getElementById('captureButton').onclick = function(e) {
    send('capture', {});
};