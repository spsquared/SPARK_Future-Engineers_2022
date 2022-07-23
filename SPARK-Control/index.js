const socket = new WebSocket('ws://192.168.1.151:4040');

function send(event, data) {
    socket.send(JSON.stringify({
        event: event,
        data: data
    }));
};

const log = document.getElementById('eventLogBody');
socket.onmessage = function(e) {
    const div = document.createElement('div');
    div.classList.add('logBlock');
    div.innerText = e.data;
    log.appendChild(div);
};
socket.onopen = function() {
    document.onkeydown = function(e) {
        const key = e.key.toLowerCase();
        send('key', {key: key});
    };
    document.onkeyup = function(e) {
        const key = e.key.toUpperCase();
        send('key', {key: key});
    };
};
socket.onclose = function() {
    const div = document.createElement('div');
    div.classList.add('logBlock');
    div.innerText = 'oh no disconnected';
    log.appendChild(div)
};

const joystick = document.getElementById('joystickWrapper');
const joystickPin = document.getElementById('joystickPin');

var grabbing = false;
var angle = 0;
var distance = 0;
joystick.onmousedown = function(e) {
    grabbing = true;
};
document.onmouseup = function(e) {
    grabbing = false;
    joystickPin.style.right = '150px';
    joystickPin.style.bottom = '150px';
    angle = 0;
    distance = 0;
    send('joystick', {throttle: 0, steering: 0});
};
document.onmousemove = function(e) {
    if (grabbing) {
        var x = e.clientX-window.innerWidth+200;
        var y = e.clientY-window.innerHeight+200;
        angle = Math.atan2(y, x);
        distance = Math.min(150, Math.sqrt(Math.pow(x, 2)+Math.pow(y, 2)));
        joystickPin.style.right = 150-(Math.cos(angle)*distance) + 'px';
        joystickPin.style.bottom = 150-(Math.sin(angle)*distance) + 'px';
    }
};
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