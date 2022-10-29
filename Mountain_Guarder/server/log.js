// Copyright (C) 2022 Radioactive64

const fs = require('fs');

// chat
insertChat = function insertChat(text, color) {
    var style = color;
    if (color == 'server') {
        style = 'color: #FFDD00;';
    } else if (color == 'death') {
        style = 'color: #FF0000;';
    } else if (color == 'error') {
        style = 'color: #FF9900;';
    } else if (color == 'anticheat') {
        style = 'color: #FF0000; font-weight: bold;';
    } else if (color == 'fun') {
        style = 'animation: special 2s linear infinite;';
    }
    logColor(text, '\x1b[36m', 'chat');
    io.emit('insertChat', {text:text, style:style});
    if (!ENV.offlineMode && ENV.useDiscordWebhook) try {postDiscord(text);} catch (err) {error(err);};
};
insertSingleChat = function insertSingleChat(text, color, username, log) {
    var socket = null;
    for (let i in Player.list) {
        if (Player.list[i].name == username) socket = Player.list[i].socket;
    }
    if (socket) {
        var style = color;
        if (color == 'server') {
            style = 'color: #FFDD00;';
        } else if (color == 'death') {
            style = 'color: #FF0000;';
        } else if (color == 'error') {
            style = 'color: #FF9900;';
        } else if (color == 'anticheat') {
            style = 'color: #FF0000; font-weight: bold;';
        } else if (color == 'fun') {
            style = 'animation: special 2s linear infinite;';
        }
        if (log) logColor(text, '\x1b[36m', 'chat');
        socket.emit('insertChat', {text:text, style:style});
    }
};

// logging
getTimeStamp = function getTimeStamp() {
    var time = new Date();
    var minute = '' + time.getUTCMinutes();
    if(minute.length == 1){
        minute = '' + 0 + minute;
    }
    if(minute == '0'){
        minute = '00';
    }
    return '[' + time.getUTCHours() + ':' + minute + '] ';
};
logColor = function logColor(text, colorstring, type) {
    let timestamp = getTimeStamp();
    if (process.env.DATABASE_URL) process.stdout.write(timestamp + colorstring + text + '\x1b[0m\n\r> ');
    else process.stdout.write('\r' + timestamp + colorstring + text + '\x1b[0m\n\r> ');
    appendLog(timestamp + text, type);
};
log = function log(text) {
    logColor(text, '', 'log');
};
debugLog = function debugLog(text) {
    logColor(text, '', 'debug');
};
warn = function warn(text) {
    logColor(text, '\x1b[33m', 'warn');
};
error = function error(text) {
    logColor(text, '\x1b[31m', 'error');
    if (text instanceof Error) appendLog(text.stack, 'error');
};
appendLog = function appendLog(text, type) {
    var typestring = '--- ';
    if (type == 'error') typestring = 'ERR ';
    else if (type == 'warn') typestring = '!WN ';
    else if (type == 'log') typestring = 'LOG ';
    else if (type == 'debug') typestring = 'DBG ';
    else if (type == 'chat') typestring = 'CHT ';
    fs.appendFileSync('./log.log', typestring + text + '\n', {encoding: 'utf-8'}, function() {});
    if (global.ENV && !ENV.offlineMode && ENV.useDiscordWebhook && type != 'chat') try {postDebugDiscord(typestring, text.toString());} catch (err) {error(err);};
};

const oldLog = console.log;
console.log = function mod_log(message, ...params) {
    oldLog(message, ...params);
    appendLog(message);
};
const oldError = console.error;
console.error = function mod_error(message, ...params) {
    oldError(message, ...params);
    appendLog(message);
};