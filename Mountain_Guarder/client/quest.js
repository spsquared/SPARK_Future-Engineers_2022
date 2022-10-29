socket.on('quest', function(data) {
    const quest = Quests[data.id];
    function createProgressBar(id, text, max) {
        return '<div class="quest-progress"><div id="quest-bar_' + id + '" class="quest-progressinner"></div><div class="quest-progresstext">' + text + ': <span id="quest-counter_' + id + '">0</span>/' + max + '</div></div>';
    };
    function createTaskBar(id, text) {
        return '<div class="quest-progress"><div id="quest-bar_' + id + '" class="quest-progressinner"></div><div class="quest-progresstext">' + text + '</div></div>'
    };
    function generateHTML(stage) {
        let html = 'Quest: <span class="quest-title">' + quest.name + '</span>';
        for (let i in quest.objectives[stage]) {
            if (i == 'obtain') {
                for (let j in quest.objectives[stage][i]) {
                    let id = data.id + i + j;
                    html += createProgressBar(id, 'Obtain ' + Inventory.itemTypes[j].name, quest.objectives[stage][i][j]);
                }
            } else if (i == 'area') {
                let id = data.id + i;
                html += createTaskBar(id, quest.objectives[stage][i].description);
            } else if (i == 'killPlayer') {
                let id = data.id + i;
                html += createProgressBar(id, 'Kill Player', quest.objectives[stage][i]);
            } else if (i == 'killMonster') {
                for (let j in quest.objectives[stage][i]) {
                    let id = data.id + i + j;
                    if (j == 'any') html += createProgressBar(id, 'Kill Monster', quest.objectives[stage][i][j]);
                    else if (j == 'bird') html += createProgressBar(id, 'Kill Bird', quest.objectives[stage][i][j]);
                    else html += createProgressBar(id, 'Kill ' + Monster.types[j].name, quest.objectives[stage][i][j]);
                }
            } else if (i == 'deal damage') {
                let id = data.id + i;
                html += 'Oh no, this is an unfinished feature! Please post a bug report!';
            } else if (i == 'dps') {
                let id = data.id + i;
                html += 'Oh no, this is an unfinished feature! Please post a bug report!';
            } else if (i == 'talk') {
                let id = data.id + i;
                let name = 'Non-Existent NPC';
                for (let j in Player.list) {
                    if (Player.list[j].npcId == quest.objectives[stage][i]) name = Player.list[j].name;
                }
                html += createTaskBar(id, 'Talk to ' + name);
            }
        }
        return html;
    };
    switch (data.type) {
        case 'start':
            if (quest) {
                new Banner(generateHTML(0), {
                    type: 'id',
                    id: data.id,
                    priority: true
                });
            } else {
                console.error('Invalid quest id ' + data.id);
            }
            break;
        case 'advance':
            if (quest) {
                for (let i in Banners) {
                    if (Banners[i].id2 == data.id) {
                        Banners[i].innerHTML = generateHTML(data.stage);
                    }
                }
            } else {
                console.error('Invalid quest id ' + data.id);
            }
            break;
        case 'end':
            for (let i in Banners) {
                if (Banners[i].id2 == data.id) {
                    Banners[i].style.animationName = 'banner-out';
                    setTimeout(async function() {
                        Banners[i].remove();
                        delete Banners[i];
                        let html = '<span style="color: lime;">Quest Completed!</span><br><span class="quest-title">' + quest.name + '</span>';
                        new Banner(html, {
                            type: 'time',
                            time: 10000,
                            priority: true
                        });
                    }, 500);
                }
            }
            break;
        case 'fail':
            for (let i in Banners) {
                if (Banners[i].id2 == data.id) {
                    Banners[i].style.animationName = 'banner-out';
                    setTimeout(async function() {
                        Banners[i].remove();
                        delete Banners[i];
                        let html = '<span style="color: red;">Quest Failed!</span><br><span class="quest-title">' + quest.name + '</span>';
                        new Banner(html, {
                            type: 'time',
                            time: 10000,
                            priority: true
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
    for (let i in data) {
        const id = data[i].id;
        const stage = data[i].stage;
        const objectives = data[i].data;
        const goals = Quests[id].objectives;
        for (let j in objectives) {
            if (j == 'obtain') {
                for (let k in objectives[j]) {
                    let id2 = id + j + k;
                    document.getElementById('quest-bar_' + id2).style.width = Math.min(Math.round(objectives[j][k]/goals[stage][j][k]*100), 100) + '%';
                    document.getElementById('quest-counter_' + id2).innerText = objectives[j][k];
                }
            } else if (j == 'area') {
                let id2 = id + j;
                if (objectives[j]) document.getElementById('quest-bar_' + id2).style.width = '100%';
            } else if (j == 'killPlayer') {
                let id2 = id + j;
                document.getElementById('quest-bar_' + id2).style.width = Math.min(Math.round(objectives[j]/goals[stage][j]*100), 100) + '%';
                document.getElementById('quest-counter_' + id2).innerText = objectives[j];
            } else if (j == 'killMonster') {
                for (let k in objectives[j]) {
                    let id2 = id + j + k;
                    document.getElementById('quest-bar_' + id2).style.width = Math.min(Math.round(objectives[j][k]/goals[stage][j][k]*100), 100) + '%';
                    document.getElementById('quest-counter_' + id2).innerText = objectives[j][k];
                }
            } else if (j == 'deal damage') {
                let id2 = id + j;
            } else if (j == 'dps') {
                let id2 = id + j;
            } else if (j == 'talk') {
                let id2 = id + j;
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
        request.open('GET', '/quests.json', true);
        request.onload = async function() {
            if (this.status >= 200 && this.status < 400) {
                var json = JSON.parse(this.response);
                Quests = json;
                loadedassets++;
                resolve();
            } else {
                reject('Error: Server returned status ' + this.status);
            }
        };
        request.onerror = function(err) {
            reject(err);
        };
        request.send();
    });
};
async function loadQuestData() {};