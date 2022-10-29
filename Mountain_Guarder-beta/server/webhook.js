if (ENV.useDiscordWebhook) {
    const { Webhook } = require('discord-webhook-node');
    if (process.env.WEBHOOK_TOKEN) {
        token = process.env.WEBHOOK_TOKEN;
        debugtoken = process.env.DEBUG_WEBHOOK_TOKEN;
    } else {
        require('./token.js');
    }
    const webhook = new Webhook(token);
    const debugwebhook = new Webhook(debugtoken);
    token = null;
    debugtoken = null;
    
    postDiscord = async function postDiscord(text) {
        var time = new Date();
        var minute = '' + time.getUTCMinutes();
        if(minute.length == 1){
            minute = '' + 0 + minute;
        }
        if(minute == '0') {
            minute = '00';
        }
        if (typeof text == 'string') {
            text = text.replace(/\`/g, '\'');
            webhook.send('`[' + time.getUTCHours() + ':' + minute + '] ' + text + '`');
        }
    };
    postDebugDiscord = async function postDebugDiscord(code, text) {
        if (debugtoken) {
            var time = new Date();
            var minute = '' + time.getUTCMinutes();
            if(minute.length == 1){
                minute = '' + 0 + minute;
            }
            if(minute == '0') {
                minute = '00';
            }
            if (typeof text == 'string' && typeof code == 'string') {
                text = text.replace(/\`/g, '\'');
                debugwebhook.send('`' + code + ' [' + time.getUTCHours() + ':' + minute + '] ' + text + '`');
            }
        }
    };
}