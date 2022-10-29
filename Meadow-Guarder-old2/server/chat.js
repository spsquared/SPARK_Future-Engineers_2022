const {Client,Intents} = require('discord.js');
const client = new Client({intents:[Intents.FLAGS.GUILDS]});

if(SERVER === 'localhost'){
    require('./CHAT_TOKEN');
}
else{
    chatToken = process.env.TOKEN;
}

client.login(chatToken);

globalChat = function(color,message,rank,rankColor){
    var d = new Date();
    var m = '' + d.getMinutes();
    var h = d.getHours() + 24;
    if(SERVER !== 'localhost'){
        h -= 5;
    }
    h = h % 24;
    h = '' + h;
    if(m.length === 1){
        m = '' + 0 + m;
    }
    if(m === '0'){
        m = '00';
    }
    if(rank){
        console.error("[" + h + ":" + m + "] " + rank + ' ' + message);
    }
    else{
        console.error("[" + h + ":" + m + "] " + message);
    }
    for(var i in Player.list){
        if(Player.list[i]){
            if(Player.list[i].loggedOn){
                if(SOCKET_LIST[i]){
                    SOCKET_LIST[i].emit('addToChat',{
                        color:color,
                        message:message,
                        rank:rank,
                        rankColor:rankColor,
                    });
                }
            }
        }
    }
    if(rank){
        client.channels.fetch('923580123574329404').then(channel => channel.send("```[" + h + ":" + m + "] " + rank + ' ' + message.replace(/`/gi,'\'') + '```'));
    }
    else{
        client.channels.fetch('923580123574329404').then(channel => channel.send("```[" + h + ":" + m + "] " + message.replace(/`/gi,'\'') + '```'));
    }
}
clanChat = function(color,message,clanName,rank,rankColor){
    var d = new Date();
    var m = '' + d.getMinutes();
    var h = d.getHours() + 24;
    if(SERVER !== 'localhost'){
        h -= 5;
    }
    h = h % 24;
    h = '' + h;
    if(m.length === 1){
        m = '' + 0 + m;
    }
    if(m === '0'){
        m = '00';
    }
    console.error("[" + h + ":" + m + "] " + clanName + " -> " + message);
    for(var i in Player.list){
        if(Player.list[i]){
            if(Player.list[i].loggedOn){
                for(var j in Clan.list[clanName].members){
                    if(Player.list[i].name === j){
                        if(SOCKET_LIST[i]){
                            SOCKET_LIST[i].emit('addToChat',{
                                color:color,
                                message:clanName + " -> " + message,
                                rank:rank,
                                rankColor:rankColor,
                            });
                        }
                    }
                }
            }
        }
    }
}

logError = function(err){
    client.channels.fetch('925382870208503828').then(channel => channel.send("```" + err + "```"));
}