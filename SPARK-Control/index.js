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
    div.innerHTML = text;
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
            addCapture(data);
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
var trim = 10
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
// bad coding practices
var initcolors = [
    [
        190, 80, 80,
        105, 45, 35
    ],
    [
        25, 140, 110,
        0, 50, 45
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
var index = 0;
const displayImg = document.getElementById('displayImg');
function addCapture(img) {
    recentCaptures.unshift('data:image/png;base64,' + img);
    if (recentCaptures.length > 10) recentCaptures.pop();
    index = 0;
    displayImg.src = recentCaptures[index];
    console.log(recentCaptures[index])
};
function displayBack() {
    index = Math.min(index+1, recentCaptures.length-1);
    if (recentCaptures[index]) displayImg.src = recentCaptures[index];
};
function displayFront() {
    index = Math.max(index-1, 0);
    if (recentCaptures[index]) displayImg.src = recentCaptures[index];
};

// errors
window.onerror = function(err) {
    appendLog(err, 'red')
};
document.onerror = function(err) {
    appendLog(err, 'red')
};