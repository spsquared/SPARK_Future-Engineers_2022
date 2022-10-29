socket.on('quest', function(data) {
    const quest = Quests[data.id];
    switch (data.type) {
        case 'start':
            if (quest) {
                var html = 'Quest: <span class="quest-title">' + quest.name + '</span>';
                for (var i in quest.objectives[0]) {
                    if (i == 'obtain') {
                        for (var j in quest.objectives[0][i]) {
                            var id = data.id + i + j;
                            html += '<div class="quest-progress"><div id="quest-bar_' + id + '" class="quest-progressinner"></div><div class="quest-progresstext">Obtain ' + Inventory.itemTypes[j].name + ': <span id="quest-counter_' + id + '">0</span>/' + quest.objectives[0][i][j] + '</div></div>';
                        }
                    } else if (i == 'area') {
                        var id = data.id + i;
                        html += 'Oh no, this is an unfinished feature! Please post a bug report!';
                    } else if (i == 'killPlayer') {
                        var id = data.id + i;
                        html += '<div class="quest-progress"><div id="quest-bar_' + id + '" class="quest-progressinner"></div><div class="quest-progresstext">Kill Player: <span id="quest-counter_' + id + '">0</span>/' + quest.objectives[0][i] + '</div></div>';
                    } else if (i == 'killMonster') {
                        for (var j in quest.objectives[0][i]) {
                            var id = data.id + i + j;
                            if (j == 'any') html += '<div class="quest-progress"><div id="quest-bar_' + id + '" class="quest-progressinner"></div><div class="quest-progresstext">Kill Monster: <span id="quest-counter_' + id + '">0</span>/' + quest.objectives[0][i][j] + '</div></div>';
                            else if (j == 'bird') html += '<div class="quest-progress"><div id="quest-bar_' + id + '" class="quest-progressinner"></div><div class="quest-progresstext">Kill Bird: <span id="quest-counter_' + id + '">0</span>/' + quest.objectives[0][i][j] + '</div></div>';
                            else html += '<div class="quest-progress"><div id="quest-bar_' + id + '" class="quest-progressinner"></div><div class="quest-progresstext">Kill ' + Monster.types[j].name + ': <span id="quest-counter_' + id + '">0</span>/' + quest.objectives[0][i][j] + '</div></div>';
                        }
                    } else if (i == 'deal damage') {
                        var id = data.id + i;
                        html += 'Oh no, this is an unfinished feature! Please post a bug report!';
                    } else if (i == 'dps') {
                        var id = data.id + i;
                        html += 'Oh no, this is an unfinished feature! Please post a bug report!';
                    } else if (i == 'talk') {
                        var id = data.id + i;
                        var name = 'Non-Existent NPC';
                        for (var j in Player.list) {
                            if (Player.list[j].npcId == quest.objectives[0][i]) name = Player.list[j].name;
                        }
                        html += '<div class="quest-progress"><div id="quest-bar_' + id + '" class="quest-progressinner"></div><div class="quest-progresstext">Talk to ' + name + '</div></div>';
                    }
                }
                new Banner(html, {
                    type: 'id',
                    id: data.id
                });
            } else {
                console.error('Invalid quest id ' + data.id);
            }
            break;
        case 'advance':
            if (quest) {
                var html = 'Quest: <span class="quest-title">' + quest.name + '</span>';
                for (var i in quest.objectives[data.stage]) {
                    if (i == 'obtain') {
                        for (var j in quest.objectives[data.stage][i]) {
                            var id = data.id + i + j;
                            html += '<div class="quest-progress"><div id="quest-bar_' + id + '" class="quest-progressinner"></div><div class="quest-progresstext">Obtain ' + Inventory.itemTypes[j].name + ': <span id="quest-counter_' + id + '">0</span>/' + quest.objectives[data.stage][i][j] + '</div></div>';
                        }
                    } else if (i == 'area') {
                        var id = data.id + i;
                        html += 'Oh no, this is an unfinished feature! Please post a bug report!';
                    } else if (i == 'killPlayer') {
                        var id = data.id + i;
                        html += '<div class="quest-progress"><div id="quest-bar_' + id + '" class="quest-progressinner"></div><div class="quest-progresstext">Kill Player: <span id="quest-counter_' + id + '">0</span>/' + quest.objectives[data.stage][i] + '</div></div>';
                    } else if (i == 'killMonster') {
                        for (var j in quest.objectives[data.stage][i]) {
                            var id = data.id + i + j;
                            if (j == 'any') html += '<div class="quest-progress"><div id="quest-bar_' + id + '" class="quest-progressinner"></div><div class="quest-progresstext">Kill Monster: <span id="quest-counter_' + id + '">0</span>/' + quest.objectives[data.stage][i][j] + '</div></div>';
                            else if (j == 'bird') html += '<div class="quest-progress"><div id="quest-bar_' + id + '" class="quest-progressinner"></div><div class="quest-progresstext">Kill Bird: <span id="quest-counter_' + id + '">0</span>/' + quest.objectives[data.stage][i][j] + '</div></div>';
                            else html += '<div class="quest-progress"><div id="quest-bar_' + id + '" class="quest-progressinner"></div><div class="quest-progresstext">Kill ' + Monster.types[j].name + ': <span id="quest-counter_' + id + '">0</span>/' + quest.objectives[data.stage][i][j] + '</div></div>';
                        }
                    } else if (i == 'deal damage') {
                        var id = data.id + i;
                        html += 'Oh no, this is an unfinished feature! Please post a bug report!';
                    } else if (i == 'dps') {
                        var id = data.id + i;
                        html += 'Oh no, this is an unfinished feature! Please post a bug report!';
                    } else if (i == 'talk') {
                        var id = data.id + i;
                        var name = 'Non-Existent NPC';
                        for (var j in Player.list) {
                            if (Player.list[j].npcId == quest.objectives[data.stage][i]) name = Player.list[j].name;
                        }
                        html += '<div class="quest-progress"><div id="quest-bar_' + id + '" class="quest-progressinner"></div><div class="quest-progresstext">Talk to ' + name + '</div></div>';
                    }
                }
                for (var i in Banners) {
                    if (Banners[i].id2 == data.id) {
                        Banners[i].innerHTML = html;
                    }
                }
            } else {
                console.error('Invalid quest id ' + data.id);
            }
            break;
        case 'end':
            for (var i in Banners) {
                if (Banners[i].id2 == data.id) {
                    Banners[i].style.animationName = 'banner-out';
                    setTimeout(async function() {
                        Banners[i].remove();
                        delete Banners[i];
                        var html = '<span style="color: lime;">Quest Completed!</span><br><span class="quest-title">' + quest.name + '</span>';
                        new Banner(html, {
                            type: 'time',
                            time: 10000
                        });
                    }, 500);
                }
            }
            break;
        case 'fail':
            for (var i in Banners) {
                if (Banners[i].id2 == data.id) {
                    Banners[i].style.animationName = 'banner-out';
                    setTimeout(async function() {
                        Banners[i].remove();
                        delete Banners[i];
                        var html = '<span style="color: red;">Quest Failed!</span><br><span class="quest-title">' + quest.name + '</span>';
                        new Banner(html, {
                            type: 'time',
                            time: 10000
                        });
                    }, 500);
                }
            }
            break;
        default:
            console.error('Invalid quest action ' + data.type);
    }
});
socket.on('questData', function(data) {
    for (var i in data) {
        var id = data[i].id;
        var objectives = data[i].data;
        var goals = Quests[id].objectives;
        for (var j in objectives) {
            if (j == 'obtain') {
                for (var k in objectives[j]) {
                    var id2 = data[i].id + j + k;
                    document.getElementById('quest-bar_' + id2).style.width = Math.round(objectives[j][k]/goals[i][j][k]*100) + '%';
                    document.getElementById('quest-counter_' + id2).innerText = objectives[j][k];
                }
            } else if (j == 'area') {
                var id2 = data[i].id + j;
                if (objectives[j]) document.getElementById('quest-bar_' + id2).style.width = '100%';
            } else if (j == 'killPlayer') {
                var id2 = data[i].id + j;
                document.getElementById('quest-bar_' + id2).style.width = Math.round(objectives[j]/goals[i][j]*100) + '%';
                document.getElementById('quest-counter_' + id2).innerText = objectives[j];
            } else if (j == 'killMonster') {
                for (var k in objectives[j]) {
                    var id2 = data[i].id + j + k;
                    document.getElementById('quest-bar_' + id2).style.width = Math.round(objectives[j][k]/goals[i][j][k]*100) + '%';
                    document.getElementById('quest-counter_' + id2).innerText = objectives[j][k];
                }
            } else if (j == 'deal damage') {
                var id2 = data[i].id + j;
            } else if (j == 'dps') {
                var id2 = data[i].id + j;
            } else if (j == 'talk') {
                var id2 = data[i].id + j;
                if (objectives[j]) document.getElementById('quest-bar_' + id2).style.width = '100%';
            }
        }
    }
});
Quests = [];
async function getQuestData() {
    await new Promise(async function(resolve, reject) {
        totalassets++;
        var request = new XMLHttpRequest();
        request.open('GET', '/client/quests.json', true);
        request.onload = async function() {
            if (this.status >= 200 && this.status < 400) {
                var json = JSON.parse(this.response);
                Quests = json;
                loadedassets++;
                resolve();
            } else {
                console.error('Error: Server returned status ' + this.status);
                await sleep(1000);
                request.send();
            }
        };
        request.onerror = function(){
            console.error('There was a connection error. Please retry');
            reject();
        };
        request.send();
    });
};
async function loadQuestData() {};