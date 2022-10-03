const ip = '192.168.1.151';

socket = new WebSocket('ws://' + ip + ':4040');

const log = document.getElementById('eventLogBody');
const callbacks = [];
let connected = false;
let toReconnect = false;
let autoReconnect = true;
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
    if (e.data != 'ping') {
        let json = JSON.parse(e.data);
        for (let i in callbacks) {
            if (i == json.event) {
                callbacks[i](json.data);
            }
        }
    }
};
socket.onopen = function() {
    connected = true;
    appendLog('Connected!', 'lime');
};
socket.onclose = function() {
    connected = false;
    if (autoReconnect) toReconnect = true;
    appendLog('Connection closed<button class="connectNow" onclick="reconnect(true);">RECONNECT NOW</button>', 'red');
    setTimeout(reconnect, 10000);
};
function reconnect(force) {
    if (toReconnect || force) {
        toReconnect = false;
        autoReconnect = true;
        document.querySelectorAll('.connectNow').forEach(button => button.remove());
        appendLog('Attempting to reconnect...');
        let newsocket = new WebSocket('ws://' + ip + ':4040');
        newsocket.onmessage = socket.onmessage;
        newsocket.onopen = socket.onopen;
        newsocket.onclose = socket.onclose;
        socket = newsocket;
    }
};

// messages
const pendingsounds = [];
let first = true;
async function playSound() {
    if (first) {
        for (let i = 0; i < 10; i++) {
            await new Promise(function(resolve, reject) {
                let ping = new Audio('127 - Official Meadow Guarder Song.mp3');
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
    let ping = new Audio('ping.mp3');
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
    let scroll = false;
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

let grabbing = false;
let grabbingtouch = false;
let throttle = 0;
let steering = 0;
joystick.onmousedown = function(e) {
    grabbing = true;
};
joystick.addEventListener('touchstart', function(e) {
    grabbingtouch = true;
}, {passive: true});
document.onmouseup = function(e) {
    if (grabbing) {
        grabbing = false;
        joystickPin.style.right = '114px';
        joystickPin.style.bottom = '114px';
        sliderX.style.bottom = '140px';
        sliderY.style.right = '140px';
        throttle = 0;
        steering = 0;
        send('joystick', {throttle: 0, steering: 0});
    }
};
document.addEventListener('touchend', function(e) {
    if (grabbingtouch) {
        grabbingtouch = false;
        joystickPin.style.right = '110px';
        joystickPin.style.bottom = '110px';
        sliderX.style.bottom = '140px';
        sliderY.style.right = '140px';
        throttle = 0;
        steering = 0;
        send('joystick', {throttle: 0, steering: 0});
    }
}, {passive: true});
document.addEventListener('touchcancel', function(e) {
    if (grabbingtouch) {
        grabbingtouch = false;
        joystickPin.style.right = '114px';
        joystickPin.style.bottom = '114px';
        sliderX.style.bottom = '140px';
        sliderY.style.right = '140px';
        throttle = 0;
        steering = 0;
        send('joystick', {throttle: 0, steering: 0});
    }
}, {passive: true});
document.onmousemove = function(e) {
    if (grabbing) {
        let x = Math.max(-110, Math.min(e.clientX-window.innerWidth+150, 110));
        let y = Math.max(-110, Math.min(e.clientY-window.innerHeight+150, 110));
        throttle = Math.round(-y*90/99);
        steering = Math.round(x*90/99);
        joystickPin.style.bottom = 114-y + 'px';
        joystickPin.style.right = 114-x + 'px';
        sliderX.style.bottom = 140-y + 'px';
        sliderY.style.right = 140-x + 'px';
    }
};
document.addEventListener('touchmove', function(e) {
    if (grabbingtouch) {
        for (let i in e.touches) {
            if (joystick.contains(e.touches[i].target)) {
                let x = Math.max(-110, Math.min(e.touches[i].clientX-window.innerWidth+150, 110));
                let y = Math.max(-110, Math.min(e.touches[i].clientY-window.innerHeight+150, 110));
                throttle = Math.round(-y*90/99);
                steering = Math.round(x*90/99);
                joystickPin.style.bottom = 114-y + 'px';
                joystickPin.style.right = 114-x + 'px';
                sliderX.style.bottom = 140-y + 'px';
                sliderY.style.right = 140-x + 'px';
                break;
            }
        }
    }
}, {passive: true});

// controllers
let trim = 0;
let trim2 = 0.05;
let pressedbuttons = [];
function updateControllers() {
    let controllers = navigator.getGamepads();
    for (let i in controllers) {
        if (controllers[i] instanceof Gamepad) {
            let controller = controllers[i];
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
            if (controller.buttons[0].pressed && pressedbuttons.indexOf(0) == -1) {
                if (controller.buttons[7].pressed) document.getElementById('filterStreamButton').onclick();
                else document.getElementById('streamButton').onclick();
                pressedbuttons.push(0);
            } else if (!controller.buttons[0].pressed && pressedbuttons.indexOf(0) != -1) {
                pressedbuttons.splice(pressedbuttons.indexOf(0), 1);
            }
            joystickPin.style.bottom = 114-(controller.axes[1]*110) + 'px';
            joystickPin.style.right = 114-(controller.axes[2]*110) + 'px';
            sliderX.style.bottom = 140-(controller.axes[1]*110) + 'px';
            sliderY.style.right = 140-(controller.axes[2]*110) + 'px';
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
let streaming = false;
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
document.getElementById('captureFilterButton').onclick = function(e) {
    let arr = [];
    for (let i in sliders) {
        arr.push(sliders[i].value);
    }
    send('captureFilter', arr);
};
let filterstreaming = false;
document.getElementById('captureFilterStreamButton').onclick = function(e) {
    let arr = [];
    for (let i in sliders) {
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

// filtered capture (ignore the terrible coding practices this was intended to be a temporary thing)
let sliders = [
    document.getElementById('redHMax'),
    document.getElementById('greenHMax'),
    document.getElementById('redSMax'),
    document.getElementById('greenSMax'),
    document.getElementById('redVMax'),
    document.getElementById('greenVMax'),
    document.getElementById('redHMin'),
    document.getElementById('greenHMin'),
    document.getElementById('redSMin'),
    document.getElementById('greenSMin'),
    document.getElementById('redVMin'),
    document.getElementById('greenVMin')
];
function updateSlider(i) {
    document.getElementById(sliders[i].id + 'indicator').innerText = sliders[i].value;
    if (sliders[i].id.includes('H')) {
        sliders[i].style.setProperty('--hue', sliders[i].value * 2);
        sliders[i+2].style.setProperty('--hue', sliders[i].value * 2);
        sliders[i+4].style.setProperty('--hue', sliders[i].value * 2);
    } else if (sliders[i].id.includes('S')) {
        sliders[i].style.setProperty('--saturation', sliders[i].value*(100/255) + '%');
        sliders[i+2].style.setProperty('--saturation', sliders[i].value*(100/255) + '%');
    } else if (sliders[i].id.includes('V')) {
        sliders[i].style.setProperty('--value', sliders[i].value*(50/255) + '%');
    }
};
function setColors(colors) {
    for (let i in colors) {
        sliders[i].value = colors[i];
        updateSlider(parseInt(i));
    }
};
addListener('colors', setColors);

// non capture streams and iamges
document.getElementById('viewButton').onclick = function (e) {
    send('view', {});
};
document.getElementById('viewFilterButton').onclick = function (e) {
    let arr = [];
    for (let i in sliders) {
        arr.push(sliders[i].value);
    }
    send('viewFilter', arr)
};
let streaming2 = false;
let filterstreaming2 = false;
document.getElementById('streamButton').onclick = function(e) {
    streaming2 = !streaming2;
    send('stream', {state: streaming2});
    if (streaming2) {
        document.getElementById('streamButton').innerText = 'STOP STREAM';
        document.getElementById('streamButton').style.backgroundColor = 'lightcoral';
    } else {
        document.getElementById('streamButton').innerText = 'START STREAM';
        document.getElementById('streamButton').style.backgroundColor = 'lightgreen';
    }
};
document.getElementById('filterStreamButton').onclick = function(e) {
    filterstreaming2 = !filterstreaming2;
    let arr = [];
    for (let i in sliders) {
        arr.push(sliders[i].value);
    }
    send('colors', arr)
    send('filterstream', {state: filterstreaming2});
    if (filterstreaming2) {
        document.getElementById('filterStreamButton').innerText = 'STOP FILTERED STREAM';
        document.getElementById('filterStreamButton').style.backgroundColor = 'lightcoral';
    } else {
        document.getElementById('filterStreamButton').innerText = 'START FILTEREDSTREAM';
        document.getElementById('filterStreamButton').style.backgroundColor = 'lightgreen';
    }
};

// prediction view
document.getElementById('predictionButton').onclick = function(e) {
    send('prediction', {});
};

// bad coding practices
let initcolors = [
    [
        30, 255, 255,
        0, 75, 75
    ],
    [
        110, 255, 255,
        30, 30, 30
    ],
    [
        90, 75, 85,
        0, 0, 0
    ],
];
sliders[0].value = initcolors[0][0];
sliders[1].value = initcolors[1][0];
sliders[2].value = initcolors[0][1];
sliders[3].value = initcolors[1][1];
sliders[4].value = initcolors[0][2];
sliders[5].value = initcolors[1][2];
sliders[6].value = initcolors[0][3];
sliders[7].value = initcolors[1][3];
sliders[8].value = initcolors[0][4];
sliders[9].value = initcolors[1][4];
sliders[10].value = initcolors[0][5];
sliders[11].value = initcolors[1][5];
for (let i in sliders) {
    updateSlider(parseInt(i));
}

// capture display
let maxHistory = 1000;
const history = [];
let index = 0;
let lefting = false;
let righting = false;
let fasting = false;
let slowing = false;
const fpsTimes = [];
const displayImg = document.getElementById('displayImg');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext("2d");
const canvas2 = document.getElementById('canvas2');
const ctx2 = canvas2.getContext("2d");
const historySlider = document.getElementById('historySlider');
const FPS = document.getElementById('fps');
const strPredict = document.getElementById('strPredict');
const wallStrPredict = document.getElementById('wallStrPredict');
const pillarStrPredict = document.getElementById('pillarStrPredict');
const strReason = document.getElementById('strReason');
const downloadButton = document.getElementById('download');
const wallHeightLeft = document.getElementById('wallHeightLeft');
const wallHeightCenter = document.getElementById('wallHeightCenter');
const wallHeightRight = document.getElementById('wallHeightRight');
const turnsMade = document.getElementById('turnsMade');
const turnCooldown = document.getElementById('turnCooldown');
const justTurned = document.getElementById('justTurned');
const passedPillar = document.getElementById('passedPillar');
ctx.canvas.width = 272;
ctx.canvas.height = 154;
let displayTimer = 0;
let drawn = false;
let displayDelay = 5;
function addCapture(img) {
    history.unshift({
        img: 'data:image/png;base64,'+img,
        blobs: [[], [], [], []],
        steer: [0, 'none', 0, 0],
        wall: [0, 0, 0, [], [], [], [], [], []],
        turns: [false, 0, 0],
        passed: 0
    });
    index = 0;
    if (history.length > maxHistory) {
        history.pop();
    }
    historySlider.max = history.length;
    historySlider.value = history.length;
    displayTimer = performance.now();
    drawn = false;

    let now = performance.now();
    while(fpsTimes.length > 0 && fpsTimes[0] <= now - 1000){
        fpsTimes.shift();
    }
    fpsTimes.push(now);
    FPS.innerHTML = 'FPS: ' + fpsTimes.length;
};
function addBlobs(data) {
    index = 0;
    history[index].blobs = data;
    if (history.length > maxHistory) {
        history.pop();
    }
    displayTimer = performance.now();
    drawn = false;
};
function drawBlobs() {
    let data = history[index].blobs;
    ctx.clearRect(0,0,272,154);
    for(let i of data[1]){
        drawLightBlob(i,0);
    }
    for(let i of data[3]){
        drawLightBlob(i,1);
    }
    drawBlob(data[0],0);
    drawBlob(data[2],1);
};
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
    ctx.arc(blob[0],blob[1],blob[2] * 2, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
};
function drawLightBlob(blob,blobColor){
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
    ctx.arc(blob[0],blob[1],blob[2] * 2, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
};
function addData(data) {
    index = 0;
    // steering data
    history[index].steer = data[0];
    // wall data
    history[index].wall[0] = parseFloat(data[1]);
    history[index].wall[1] = parseFloat(data[2]);
    history[index].wall[2] = parseFloat(data[3]);
    history[index].wall[3] = JSON.parse(data[4]);
    history[index].wall[4] = JSON.parse(data[5]);
    history[index].wall[5] = JSON.parse(data[6]);
    history[index].wall[6] = JSON.parse(data[7]);
    history[index].wall[7] = JSON.parse(data[8]);
    history[index].wall[8] = JSON.parse(data[9]);
    // turn data
    if (data[10][0] == 'True') data[10][0] = true;
    else if (data[10][0] == 'False') data[10][0] = false;
    data[10][1] = parseInt(data[10][1]);
    data[10][2] = parseInt(data[10][2]);
    history[index].turns = data[10];
    // pass data
    history[index].passed = parseInt(data[11]);
    if (history.length > maxHistory) {
        history.pop();
    }
    displayTimer = performance.now();
    drawn = false;
};
function showPredictions() {
    let data = history[index].steer;
    strPredict.innerText = 'Final Steering: ' + Math.round(data[0]);
    strReason.innerText = data[1];
    wallStrPredict.innerText = 'Wall Steering: ' + Math.round(data[2]);
    pillarStrPredict.innerText = 'Pillar Steering: ' + Math.round(data[3]);
};
function showWallData() {
    let data = history[index].wall;
    canvas2.width = 272;
    canvas2.height = 154;
    ctx2.clearRect(0,0,272,154);
    ctx2.fillStyle = '#FFF9';
    for(let i = 0; i < 20; i++) {
        ctx2.fillRect(i*4, 100-data[3][i]-data[6][i], 1, data[3][i]);
    }
    for(let i = 0; i < 20; i++) {
        ctx2.fillRect(i*4+96, 100-data[4][i]-data[7][i], 1, data[4][i]);
    }
    for(let i = 0; i < 20; i++) {
        ctx2.fillRect(i*4+192, 100-data[5][i]-data[8][i], 1, data[5][i]);
    }
    wallHeightLeft.innerText = 'L: ' + data[0];
    wallHeightCenter.innerText = 'C: ' + data[1];
    wallHeightRight.innerText = 'R: ' + data[2];
};
function showTurnPassData() {
    let data = history[index].turns;
    justTurned.innerText = data[0];
    turnCooldown.innerText = data[1];
    turnsMade.innerText = data[2];
    passedPillar.innerText = history[index].passed;
};
async function displayBack() {
    index = Math.min(index+1, history.length-1);
    historySlider.max = history.length;
    historySlider.value = history.length-index;
    displayTimer = performance.now();
    drawn = false;
};
async function displayFront() {
    index = Math.max(index-1, 0);
    historySlider.max = history.length;
    historySlider.value = history.length-index;
    displayTimer = performance.now();
    drawn = false;
};
async function displayChange() {
    historySlider.max = history.length;
    index = history.length-parseInt(historySlider.value);
    if (history[index]) {
        displayImg.src = history[index].img;
        downloadButton.href = history[index].img;
        drawBlobs();
        showWallData();
        showPredictions();
        showTurnPassData();
    }
};
addListener('capture', addCapture);
addListener('blobs', addBlobs);
addListener('values', addData);
setInterval(() => {
    while (performance.now()-fpsTimes[0] > 1000) fpsTimes.shift();
    FPS.innerHTML = 'FPS: ' + fpsTimes.length;
}, 1000);
setInterval(() => {
    if (performance.now()-displayTimer >= displayDelay && !drawn) {
        drawn = true;
        displayChange();
    }
}, 1);
document.addEventListener('keydown', (e) => {
    if (e.key == 'ArrowLeft') {
        lefting = true;
    } else if (e.key == 'ArrowRight') {
        righting = true;
    } else if (e.key == 'Control') {
        fasting = true;
    } else if (e.key == 'Shift') {
        slowing = true;
    }
});
document.addEventListener('keyup', (e) => {
    if (e.key == 'ArrowLeft') {
        lefting = false;
    } else if (e.key == 'ArrowRight') {
        righting = false;
    } else if (e.key == 'Control') {
        fasting = false;
    } else if (e.key == 'Shift') {
        slowing = false;
    }
});
let timer = 0;
setInterval(() => {
    timer++;
    if ((slowing && timer > 10) || (!slowing && timer > 2) || fasting) {
        timer = 0;
        if (lefting) displayBack();
        if (righting) displayFront();
    }
}, 10);

// stop
document.getElementById('emergencyStop').onclick = function() {
    send('stop', {});
};
document.getElementById('disconnect').onclick = async function() {
    socket.close();
    toReconnect = false;
    autoReconnect = false;
    // let rickrolls = [];
    // let ready = 0;
    // for (let i = 0; i < 50; i++) {
    //     let rickroll = new Audio('./127 - Official Meadow Guarder Song.mp3');
    //     rickroll.preload = true;
    //     rickroll.addEventListener('loadeddata', function() {
    //         ready++;
    //     });
    //     rickrolls.push(rickroll);
    // }
    // let wait = setInterval(function() {
    //     if (ready == rickrolls.length) {
    //         clearInterval(wait);
    //         for (let rickroll of rickrolls) {
    //             rickroll.play();
    //         }
    //     }
    // }, 10);
};
document.addEventListener('keydown',(e) => {
    if (e.key.toLowerCase() == 'c' && e.ctrlKey) send('stop', {});
});

// errors
window.onerror = function(err) {
    appendLog(err, 'red');
};
document.onerror = function(err) {
    appendLog(err, 'red');
};

async function animate(slider, backwards) {
    if (backwards) {
        for (let i = parseInt(slider.min); i <= parseInt(slider.max); i++) {
            slider.value = i;
            slider.oninput();
            await new Promise((resolve) => setTimeout(resolve, Math.random()*10+5));
        }
        await animate(slider, false);
    } else {
        for (let i = parseInt(slider.max); i >= parseInt(slider.min); i--) {
            slider.value = i;
            slider.oninput();
            await new Promise((resolve) => setTimeout(resolve, Math.random()*10+5));
        }
        await animate(slider, true);
    }
};
async function animateAll() {
    setInterval(() => {
        // document.body.style.backgroundColor = 'hsl(' + sliders[0].value*2 + ' ' + sliders[2].value*(100/255) + '% ' + sliders[4].value*(50/255) + '%)';
        document.body.style.backgroundColor = 'hsl(' + sliders[0].value*2 + ' ' + sliders[2].value*(100/255) + '% 50%)';
    }, 50);
    for (let slider of sliders) {
        animate(slider, 1);
        await new Promise((resolve) => setTimeout(resolve, Math.random()*200));
    }
};