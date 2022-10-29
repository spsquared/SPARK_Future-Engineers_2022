// Copyright (C) 2022 Radioactive64

controllerConnected = false;
var axes = {
    movex: 0,
    movey: 0,
    aimx: 0,
    aimy: 0
};
var buttons = {
    attack: false,
    second: false,
    disableSecond: false,
    clicking: false,
};
async function updateControllers() {
    controllerConnected = false;
    var controllers = navigator.getGamepads();
    for (var i in controllers) {
        if (controllers[i] instanceof Gamepad) {
            controllerConnected = true;
            var controller = controllers[i];
            axes.movex = controller.axes[0];
            axes.movey = controller.axes[1];
            if (controllerSettings.quadraticSensitivity) {
                axes.aimx = Math.max(-window.innerWidth/2, Math.min(axes.aimx + ((Math.round((controller.axes[2]+(controllerSettings.driftX/100))*10)/10*controllerSettings.sensitivity*0.1)**2)/2*parseInt(Math.abs(controller.axes[2])/controller.axes[2]), window.innerWidth/2));
                axes.aimy = Math.max(-window.innerHeight/2, Math.min(axes.aimy + ((Math.round((controller.axes[3]+(controllerSettings.driftY/100))*10)/10*controllerSettings.sensitivity*0.1)**2)/2*parseInt(Math.abs(controller.axes[3])/controller.axes[3]), window.innerHeight/2));
            } else {
                axes.aimx = Math.max(-window.innerWidth/2, Math.min(axes.aimx + Math.round((controller.axes[2]+(controllerSettings.driftX/100))*10)/10*controllerSettings.sensitivity*0.2, window.innerWidth/2));
                axes.aimy = Math.max(-window.innerHeight/2, Math.min(axes.aimy + Math.round((controller.axes[3]+(controllerSettings.driftY/100))*10)/10*controllerSettings.sensitivity*0.2, window.innerHeight/2));
            }
            document.getElementById('crossHair').style.left = axes.aimx + window.innerWidth/2-11 + 'px';
            document.getElementById('crossHair').style.top = axes.aimy + window.innerHeight/2-11 + 'px';
            buttons.attack = controller.buttons[6].value > 0.5;
            buttons.second = controller.buttons[4].value > 0.5;
            buttons.disableSecond = controller.buttons[5].value > 0.5;
            buttons.clicking = controller.buttons[0].pressed;
            buttons.interacting = controller.buttons[3].pressed;
            break;
        }
    }
    if (controllerConnected) document.getElementById('crossHair').style.display = 'block';
    else document.getElementById('crossHair').style.display = '';
};
async function sendControllers() {
    socket.emit('controllerInput', {
        movex: axes.movex,
        movey: axes.movey,
        aimx: axes.aimx,
        aimy: axes.aimy,
        attack: buttons.attack,
        second: buttons.second,
        disableSecond: buttons.disableSecond,
        clicking: buttons.clicking,
        interacting: buttons.interacting
    });
    if (buttons.clicking && document.getElementById('respawnButton').style.display == 'block') respawn();
};
window.ongamepadconnected = function(e) {
    controllers[e.gamepad.index] = e.gamepad;
};
window.ongamepaddisconnected = function(e) {
    delete controllers[e.gamepad.index];
};