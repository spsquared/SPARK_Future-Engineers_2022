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
    for (var i in Player.list) {
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
logColor = function logColor(text, colorstring, type) {
    var time = new Date();
    var minute = '' + time.getUTCMinutes();
    if(minute.length == 1){
        minute = '' + 0 + minute;
    }
    if(minute == '0'){
        minute = '00';
    }
    if (process.env.DATABASE_URL) console.log('[' + time.getUTCHours() + ':' + minute + '] ' + colorstring + text + '\x1b[0m');
    else console.log('\r[' + time.getUTCHours() + ':' + minute + '] ' + colorstring + text + '\x1b[0m');
    appendLog('[' + time.getUTCHours() + ':' + minute + '] ' + text, type);
};
log = function log(text) {
    logColor(text, '', 'log');
};
warn = function warn(text) {
    logColor(text, '\x1b[33m', 'warn');
};
error = function error(text) {
    logColor(text, '\x1b[31m', 'error');
};
appendLog = function appendLog(text, type) {
    var typestring = '--- ';
    if (type == 'error') typestring = 'ERR ';
    if (type == 'warn') typestring = '!WN ';
    if (type == 'log') typestring = 'LOG ';
    if (type == 'chat') typestring = 'CHT ';
    fs.appendFileSync('./server/log.txt', typestring + text + '\n', {encoding: 'utf-8'});
    if (global.ENV && !ENV.offlineMode && ENV.useDiscordWebhook && type != 'chat') try {postDebugDiscord(typestring, text.toString());} catch (err) {error(err);};
};