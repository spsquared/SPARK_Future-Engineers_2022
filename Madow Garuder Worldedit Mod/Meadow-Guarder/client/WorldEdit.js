DECODE = null;
OBJECTS = null;
TERRAIN = null;
$.getJSON('/client/WorldEdit_tiles.json', function(data) {
    DECODE = data.decode;
    OBJECTS = data.objects;
    TERRAIN = data.terrain;
    updateOptions();
});

WorldEdit = function() {
    self = {
        position1: [0, 0],
        position2: [0, 0],
        currentLayer: 'GT',
        brushTile: 5761,
        pos1: async function(x, y) {
            self.position1[0] = x;
            self.position1[1] = y;
            for (var i in tempMap[Player.list[selfId].map]) {
                if (tempMap[Player.list[selfId].map][i].tile_idx == 1692) {
                    tempMap[Player.list[selfId].map].splice(i, 1);
                    i--;
                }
            }
            tempMap[Player.list[selfId].map].push({
                x:x * 64,
                y:y * 64,
                map:Player.list[selfId].map,
                tile_idx:1692,
                canvas:'upper',
            });
        },
        pos2: async function(x, y) {
            self.position2[0] = x;
            self.position2[1] = y;
            for (var i in tempMap[Player.list[selfId].map]) {
                if (tempMap[Player.list[selfId].map][i].tile_idx == 1778) {
                    tempMap[Player.list[selfId].map].splice(i, 1);
                    i--;
                }
            }
            tempMap[Player.list[selfId].map].push({
                x:x * 64,
                y:y * 64,
                map:Player.list[selfId].map,
                tile_idx:1778,
                canvas:'upper',
            });
        },
        set: function(id) {
            if (Player.list[selfId].currentItem == 'worldedit_wand') {
                var replacedid = id;
                for (var i in DECODE) {
                    if (replacedid == DECODE[i].id) replacedid = DECODE[i].number;
                }
                socket.emit('worldedit_set', {
                    pos1: self.position1,
                    pos2: self.position2,
                    map: Player.list[selfId].map,
                    layer: self.currentLayer,
                    id: replacedid
                });
            }
        },
        brush: async function(x, y) {
            if (Player.list[selfId].currentItem == 'worldedit_brush') {
                socket.emit('worldedit_brush', {
                    pos: [x, y],
                    map: Player.list[selfId].map,
                    layer: self.currentLayer,
                    id: self.brushTile
                });
            }
        },
        remove: async function(x, y) {
            if (Player.list[selfId].currentItem == 'worldedit_brush') {
                var tempid = 5761;
                if (self.currentLayer == 'C0') tempid = 0;
                socket.emit('worldedit_brush', {
                    pos: [x, y],
                    map: Player.list[selfId].map,
                    layer: self.currentLayer,
                    id: tempid
                });
            }
        },
        setBrushTile: function(id) {
            var replacedid = id;
            for (var i in DECODE) {
                if (replacedid == DECODE[i].id) replacedid = DECODE[i].number;
            }
            try {
                self.brushTile = parseInt(replacedid)+1;
            } catch (err) {
                console.error(err)
            }
        }
    }
    return self;
};
w = new WorldEdit();

// controls
var tilepreview = document.getElementById('tile_preview').getContext('2d');
resetCanvas(tilepreview);
tilepreview.scale(1, 1);
var showWEConsole = false;
// document.getElementById('showWEConsole').onclick = function(){
//     if(!showWEConsole){
//         document.getElementById('showWEConsole').innerHTML = 'Hide WorldEdit Console';
//         document.getElementById('WE-controls').style.display = 'block';
//         showWEConsole = true;
//     } else{
//         document.getElementById('showWEConsole').innerHTML = 'Show WorldEdit Console';
//         document.getElementById('WE-controls').style.display = 'none';
//         showWEConsole = false;
//     }
// }
document.getElementById('WE-controls').onclick = function() {
    socket.emit('releaseAll');
}
function updateOptions() {
    if (w.currentLayer == 'C0') {
        document.getElementById('tile').innerHTML = '';
        creategroup('collisions');
        createoption('collision', 'collisions');
        createoption('none', 'collisions');
        // createoption('slowdown', 'collisions');
    } else {
        if (document.getElementById('tile_type').value == 'base') {
            document.getElementById('tile').innerHTML = '';
            creategroup('terrain');
            creategroup('water');
            creategroup('flowers');
            for (var i in DECODE) {
                if ((DECODE[i].id.includes('grass') || DECODE[i].id.includes('dirt') || DECODE[i].id.includes('gravel') || DECODE[i].id.includes('sand') || DECODE[i].id.includes('cobble')) && !DECODE[i].id.includes('path') && !DECODE[i].id.includes('floor') && !DECODE[i].id.includes('sandstone') && !DECODE[i].id.includes('tuft')) {
                    createoption(DECODE[i].id, 'terrain');
                }
                if (DECODE[i].id.includes('water')) {
                    createoption(DECODE[i].id, 'water');
                }
                if (DECODE[i].id.includes('flower') && !DECODE[i].id.includes('single')) {
                    createoption(DECODE[i].id, 'flowers');
                }
            }
        }
        if (document.getElementById('tile_type').value == 'path') {
            document.getElementById('tile').innerHTML = '';
            creategroup('dirt small');
            creategroup('stone small');
            creategroup('sand small');
            creategroup('dirt large');
            creategroup('stone large');
            creategroup('sand large');
            for (var i in DECODE) {
                if (DECODE[i].id.includes('path_dirt') && DECODE[i].id.includes('small')) {
                    createoption(DECODE[i].id, 'dirt small');
                }
                if (DECODE[i].id.includes('path_stone') && DECODE[i].id.includes('small')) {
                    createoption(DECODE[i].id, 'stone small');
                }
                if (DECODE[i].id.includes('path_sand') && DECODE[i].id.includes('small')) {
                    createoption(DECODE[i].id, 'sand small');
                }
                if (DECODE[i].id.includes('path_dirt') && DECODE[i].id.includes('large')) {
                    createoption(DECODE[i].id, 'dirt large');
                }
                if (DECODE[i].id.includes('path_stone') && DECODE[i].id.includes('large')) {
                    createoption(DECODE[i].id, 'stone large');
                }
                if (DECODE[i].id.includes('path_sand') && DECODE[i].id.includes('large')) {
                    createoption(DECODE[i].id, 'sand large');
                }
            }
        }
        if (document.getElementById('tile_type').value == 'buildings') {
            document.getElementById('tile').innerHTML = '';
            creategroup('flooring');
            creategroup('sandstone walls');
            creategroup('stone walls');
            creategroup('wood walls');
            creategroup('tan roofing');
            creategroup('grey roofing');
            creategroup('wood roofing');
            creategroup('other sandstone');
            creategroup('other stone');
            creategroup('other wood');
            for (var i in DECODE) {
                if (DECODE[i].id.includes('floor')) {
                    createoption(DECODE[i].id, 'flooring');
                }
                if (DECODE[i].id.includes('wall_sandstone')) {
                    createoption(DECODE[i].id, 'sandstone walls');
                }
                if (DECODE[i].id.includes('wall_stone')) {
                    createoption(DECODE[i].id, 'stone walls');
                }
                if (DECODE[i].id.includes('wall_wood')) {
                    createoption(DECODE[i].id, 'wood walls');
                }
                if (DECODE[i].id.includes('roof_tan')) {
                    createoption(DECODE[i].id, 'tan roofing');
                }
                if (DECODE[i].id.includes('roof_grey')) {
                    createoption(DECODE[i].id, 'grey roofing');
                }
                if (DECODE[i].id.includes('roof_wood')) {
                    createoption(DECODE[i].id, 'wood roofing');
                }
                if (DECODE[i].id.includes('sandstone') && !DECODE[i].id.includes('wall_sandstone')) {
                    createoption(DECODE[i].id, 'other sandstone');
                }
                if (DECODE[i].id.includes('stone') && !DECODE[i].id.includes('wall_stone') && !DECODE[i].id.includes('sandstone') && !DECODE[i].id.includes('path') && !DECODE[i].id.includes('floor') && !DECODE[i].id.includes('tombstone') && !DECODE[i].id.includes('table') && !DECODE[i].id.includes('water')) {
                    createoption(DECODE[i].id, 'other stone');
                }
                if (DECODE[i].id.includes('wood') && !DECODE[i].id.includes('wall_wood') && !DECODE[i].id.includes('roof') && !DECODE[i].id.includes('floor') && !DECODE[i].id.includes('table') && !DECODE[i].id.includes('chair') && !DECODE[i].id.includes('door') && !DECODE[i].id.includes('window')) {
                    createoption(DECODE[i].id, 'other wood');
                }
            }
        }
        if (document.getElementById('tile_type').value == 'doorswindows') {
            document.getElementById('tile').innerHTML = '';
            creategroup('small doors');
            creategroup('small round doors');
            creategroup('medium doors');
            creategroup('medium round doors');
            creategroup('large doors');
            creategroup('large round doors');
            creategroup('extralarge doors');
            creategroup('extralarge round doors');
            creategroup('doorways');
            creategroup('other doors');
            creategroup('windows');
            creategroup('window openings');
            for (var i in DECODE) {
                if (DECODE[i].id.includes('door') && DECODE[i].id.includes('small') && !DECODE[i].id.includes('round') && !DECODE[i].id.includes('doorway') && !DECODE[i].id.includes('iron')) {
                    createoption(DECODE[i].id, 'small doors');
                }
                if (DECODE[i].id.includes('door') && DECODE[i].id.includes('small') && DECODE[i].id.includes('round') && !DECODE[i].id.includes('doorway') && !DECODE[i].id.includes('iron')) {
                    createoption(DECODE[i].id, 'small round doors');
                }
                if (DECODE[i].id.includes('door') && DECODE[i].id.includes('medium') && !DECODE[i].id.includes('round') && !DECODE[i].id.includes('doorway') && !DECODE[i].id.includes('iron')) {
                    createoption(DECODE[i].id, 'medium doors');
                }
                if (DECODE[i].id.includes('door') && DECODE[i].id.includes('medium') && DECODE[i].id.includes('round') && !DECODE[i].id.includes('doorway') && !DECODE[i].id.includes('iron')) {
                    createoption(DECODE[i].id, 'medium round doors');
                }
                if (DECODE[i].id.includes('door') && DECODE[i].id.includes('large') && !DECODE[i].id.includes('xlarge') && !DECODE[i].id.includes('round') && !DECODE[i].id.includes('doorway') && !DECODE[i].id.includes('iron')) {
                    createoption(DECODE[i].id, 'large doors');
                }
                if (DECODE[i].id.includes('door') && DECODE[i].id.includes('large') && !DECODE[i].id.includes('xlarge') && DECODE[i].id.includes('round') && !DECODE[i].id.includes('doorway') && !DECODE[i].id.includes('iron')) {
                    createoption(DECODE[i].id, 'large round doors');
                }
                if (DECODE[i].id.includes('door') && DECODE[i].id.includes('xlarge') && !DECODE[i].id.includes('round') && !DECODE[i].id.includes('doorway') && !DECODE[i].id.includes('iron')) {
                    createoption(DECODE[i].id, 'extralarge doors');
                }
                if (DECODE[i].id.includes('door') && DECODE[i].id.includes('xlarge') && DECODE[i].id.includes('round') && !DECODE[i].id.includes('doorway') && !DECODE[i].id.includes('iron')) {
                    createoption(DECODE[i].id, 'extralarge round doors');
                }
                if (DECODE[i].id.includes('doorway')) {
                    createoption(DECODE[i].id, 'doorways');
                }
                if (DECODE[i].id.includes('door') && DECODE[i].id.includes('iron')) {
                    createoption(DECODE[i].id, 'other doors');
                }
                if (DECODE[i].id.includes('window') && !DECODE[i].id.includes('windowopening')) {
                    createoption(DECODE[i].id, 'windows');
                }
                if (DECODE[i].id.includes('windowopening')) {
                    createoption(DECODE[i].id, 'window openings');
                }
            }
        }
        if (document.getElementById('tile_type').value == 'outdoors') {
            document.getElementById('tile').innerHTML = '';
            creategroup('trees');
            creategroup('bushes');
            creategroup('foilage');
            for (var i in DECODE) {
                if (DECODE[i].id.includes('tree')) {
                    createoption(DECODE[i].id, 'trees');
                }
                if (DECODE[i].id.includes('bush') || DECODE[i].id.includes('hedge')) {
                    createoption(DECODE[i].id, 'bushes');
                }
                if (DECODE[i].id.includes('cactus') || DECODE[i].id.includes('grasstuft') || (DECODE[i].id.includes('flower') && DECODE[i].id.includes('single')) || DECODE[i].id.includes('cactus')) {
                    createoption(DECODE[i].id, 'foilage');
                }
            }
        }
        if (document.getElementById('tile_type').value == 'tableschairs') {
            document.getElementById('tile').innerHTML = '';
            creategroup('stone tables');
            creategroup('wooden tables');
            creategroup('colored tables');
            creategroup('chairs');
            for (var i in DECODE) {
                if (DECODE[i].id.includes('table_stone')) {
                    createoption(DECODE[i].id, 'stone tables');
                }
                if (DECODE[i].id.includes('table_wood') && !DECODE[i].id.includes('marked')) {
                    createoption(DECODE[i].id, 'wooden tables');
                }
                if (DECODE[i].id.includes('table_wood') && DECODE[i].id.includes('marked')) {
                    createoption(DECODE[i].id, 'colored tables');
                }
                if (DECODE[i].id.includes('chair')) {
                    createoption(DECODE[i].id, 'chairs');
                }
            }
        }
        if (document.getElementById('tile_type').value == 'furniture') {
            document.getElementById('tile').innerHTML = '';
            creategroup('cabinets');
            creategroup('wall cabinets');
            creategroup('beds');
            creategroup('bookshelves');
            creategroup('mirrors');
            creategroup('other');
            for (var i in DECODE) {
                if (DECODE[i].id.includes('cabinet') && !DECODE[i].id.includes('wall')) {
                    createoption(DECODE[i].id, 'cabinets');
                }
                if (DECODE[i].id.includes('cabinet') && DECODE[i].id.includes('wall')) {
                    createoption(DECODE[i].id, 'wall cabinets');
                }
                if (DECODE[i].id.includes('bed')) {
                    createoption(DECODE[i].id, 'beds');
                }
                if (DECODE[i].id.includes('bookshelf')) {
                    createoption(DECODE[i].id, 'bookshelves');
                }
                if (DECODE[i].id.includes('mirror')) {
                    createoption(DECODE[i].id, 'mirrors');
                }
                if (DECODE[i].id.includes('piano') || DECODE[i].id.includes('dresser')) {
                    createoption(DECODE[i].id, 'other');
                }
            }
        }
        if (document.getElementById('tile_type').value == 'decoration') {
            document.getElementById('tile').innerHTML = '';
            creategroup('paintings');
            creategroup('flags');
            creategroup('candles');
            creategroup('drapes')
            creategroup('other');
            createoption('cuckooclock', 'other');
            createoption('anvil', 'other');
            for (var i in DECODE) {
                if (DECODE[i].id.includes('painting')) {
                    createoption(DECODE[i].id, 'paintings');
                }
                if (DECODE[i].id.includes('flag') || DECODE[i].id.includes('banner')) {
                    createoption(DECODE[i].id, 'flags');
                }
                if (DECODE[i].id.includes('candle')) {
                    createoption(DECODE[i].id, 'candles');
                }
                if ((DECODE[i].id.includes('drapes') && !DECODE[i].id.includes('window'))) {
                    createoption(DECODE[i].id, 'drapes');
                }
                if (DECODE[i].id.includes('furnace') || DECODE[i].id.includes('ladder') || DECODE[i].id.includes('coins') || DECODE[i].id.includes('chest')) {
                    createoption(DECODE[i].id, 'other');
                }
            }
        }
        if (document.getElementById('tile_type').value == 'other') {
            document.getElementById('tile').innerHTML = '';
            creategroup('none');
            creategroup('rails');
            creategroup('minecarts');
            creategroup('tents');
            creategroup('tombstones');
            creategroup('other');
            createoption('none', 'none');
            for (var i in DECODE) {
                if (DECODE[i].id.includes('tombstone')) {
                    createoption(DECODE[i].id, 'tombstones');
                }
                if (DECODE[i].id.includes('tent')) {
                    createoption(DECODE[i].id, 'tents');
                }
                if (DECODE[i].id.includes('rail')) {
                    createoption(DECODE[i].id, 'rails');
                }
                if (DECODE[i].id.includes('minecart')) {
                    createoption(DECODE[i].id, 'minecarts');
                }
                if ((DECODE[i].id.includes('crack') && !DECODE[i].id.includes('cracked')) || DECODE[i].id.includes('statue') || DECODE[i].id.includes('dock') || DECODE[i].id.includes('crystal')) {
                    createoption(DECODE[i].id, 'other');
                }
            }
            createoption('cyberpunk', 'other');
            createoption('illegal', 'other');
        }
    }
    w.setBrushTile(document.getElementById('tile').value);
    drawpreview();
}
function creategroup(value) {
    var group = document.createElement('optgroup');
    group.id = value;
    group.label = value;
    document.getElementById('tile').appendChild(group);
}
function createoption(value, group) {
    var option = document.createElement('option');
    option.innerText = value;
    option.value = value;
    document.getElementById(group).appendChild(option);
}
function drawpreview() {
    tilepreview.clearRect(1, 1,64,64);
    try {
        tile_idx = w.brushTile;
        if(tile_idx !== 0) {
            var img_x, img_y;
            tile_idx--;
            img_x = (tile_idx % (1462 / 17)) * 17;
            img_y = ~~(tile_idx / (1462 / 17)) * 17;
            tilepreview.drawImage(tileset,Math.round(img_x),Math.round(img_y),16,16,1, 1,64,64);
        }
    } catch (err) {console.error(err)}
}
document.getElementById('tile_type').oninput = function() {updateOptions();};
document.getElementById('tile').oninput = function() {
    if (w.currentLayer == 'C0') {
        if (document.getElementById('tile').value == 'collision') w.brushTile = 1;
        if (document.getElementById('tile').value == 'none') w.brushTile = 0;
        if (document.getElementById('tile').value == 'slowdown') w.brushTile = 2;
        tilepreview.clearRect(1, 1,64,64);
    } else {
        w.setBrushTile(document.getElementById('tile').value);
        drawpreview();
    }
}
document.getElementById('tile_layer').oninput = function() {
    w.currentLayer = document.getElementById('tile_layer').value;
    updateOptions();
}
document.getElementById('WE-set').onclick = function() {
    w.set(w.brushTile);
}

setInterval(async function() {
    try {
        if (Player.list[selfId].currentItem != 'worldedit_wand') {
            for (var i in tempMap[Player.list[selfId].map]) {
                if (tempMap[Player.list[selfId].map][i].tile_idx == 1778) {
                    tempMap[Player.list[selfId].map].splice(i, 1);
                    i--;
                }
            }
            for (var i in tempMap[Player.list[selfId].map]) {
                if (tempMap[Player.list[selfId].map][i].tile_idx == 1692) {
                    tempMap[Player.list[selfId].map].splice(i, 1);
                    i--;
                }
            }
            document.getElementById('WE-set').style.color = 'darkgrey';
            document.getElementById('WE-set').style.backgroundColor = 'lightgrey';
        } else {
            document.getElementById('WE-set').style.color = 'black';
            document.getElementById('WE-set').style.backgroundColor = 'whitesmoke';
        }
        if (!Player.list[selfId].currentItem.includes('worldedit') && showWEConsole) {
            // document.getElementById('showWEConsole').innerHTML = 'Show WorldEdit Console';
            document.getElementById('WE-controls').style.display = 'none';
            showWEConsole = false;
        }
        if (Player.list[selfId].currentItem.includes('worldedit') && !showWEConsole) {
            // document.getElementById('showWEConsole').innerHTML = 'Hide WorldEdit Console';
            document.getElementById('WE-controls').style.display = 'block';
            showWEConsole = true;
        }
    } catch (err) {}
}, 200);
