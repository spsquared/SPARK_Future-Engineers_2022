MAPS = [];
function loadMap(mapname) {
    var temp = require('./client/maps/' + mapname + '.json');
    MAPS[mapname] = new Object();
    MAPS[mapname].name = mapname;
    MAPS[mapname].width = temp.width;
    MAPS[mapname].height = temp.height;
    for (var i in temp.layers) {
        if (temp.layers[i].name == 'Ground Terrain') MAPS[mapname].groundT = make2d(temp.layers[i].data, temp.width, temp.height);
        if (temp.layers[i].name == 'Ground Overlay') MAPS[mapname].groundO = make2d(temp.layers[i].data, temp.width, temp.height);
        if (temp.layers[i].name == 'Deco0') MAPS[mapname].deco0 = make2d(temp.layers[i].data, temp.width, temp.height);
        if (temp.layers[i].name == 'Deco1') MAPS[mapname].deco1 = make2d(temp.layers[i].data, temp.width, temp.height);
        if (temp.layers[i].name == 'Deco2') MAPS[mapname].deco2 = make2d(temp.layers[i].data, temp.width, temp.height);
        if (temp.layers[i].name == 'Above0') MAPS[mapname].above0 = make2d(temp.layers[i].data, temp.width, temp.height);
        if (temp.layers[i].name == 'Above1') MAPS[mapname].above1 = make2d(temp.layers[i].data, temp.width, temp.height);
        if (temp.layers[i].name == 'Collision') MAPS[mapname].col0 = make2d(temp.layers[i].data, temp.width, temp.height);
    }
}
function make2d(array, width, height) {
    var temp = [];
    temp.width = width;
    temp.height = height;
    var j = 0;
    for (var i = 0; i < width; i++) {
        temp[i] = [];
    }
    for (var i in array) {
        temp[i-(j*width)][j] = array[i];
        if (i-(j*width) > width-2) {
            j++;
        }
    }
    return temp;
}
editMap = function(x1, y1, x2, y2, map, layer, id) {
    if (layer == 'C0') {
        try {
            for (var i = Math.min(x1, x2); i < Math.max(x1, x2)+1; i++) {
                for (var j = Math.min(y1, y2); j < Math.max(y1, y2)+1; j++) {
                    Collision.list[map][i][j] = id;
                }
            }
        } catch (err) {}
    } else {
        var templayer;
        try {
            if (layer == 'GT') templayer = 'groundT';
            if (layer == 'GO') templayer = 'groundO';
            if (layer == 'D0') templayer = 'deco0';
            if (layer == 'D1') templayer = 'deco1';
            if (layer == 'D2') templayer = 'deco2';
            if (layer == 'A0') templayer = 'above0';
            if (layer == 'A1') templayer = 'above1';
        } catch (err) {}
        try {
            for (var i = Math.min(x1, x2); i < Math.max(x1, x2)+1; i++) {
                for (var j = Math.min(y1, y2); j < Math.max(y1, y2)+1; j++) {
                    MAPS[map][templayer][i][j] = id;
                }
            }
        } catch (err) {
            console.error(err);
        }
        tempmaps1 = MAPS[map];
        var tempmaps2 = new Object();
        tempmaps2.name = MAPS[map].name;
        tempmaps2.width = MAPS[map].width;
        tempmaps2.height = MAPS[map].height;
        try {
            tempmaps2.groundT = {
                width: MAPS[map].groundT.width,
                height: MAPS[map].groundT.height
            };
        } catch (err) {}
        try {
            tempmaps2.groundO = {
                width: MAPS[map].groundO.width,
                height: MAPS[map].groundO.height
            };
        } catch (err) {}
        try {
            tempmaps2.deco0 = {
                width: MAPS[map].deco0.width,
                height: MAPS[map].deco0.height
            };
        } catch (err) {}
        try {
            tempmaps2.deco1 = {
                width: MAPS[map].deco1.width,
                height: MAPS[map].deco1.height
            };
        } catch (err) {}
        try {
            tempmaps2.deco2 = {
                width: MAPS[map].deco2.width,
                height: MAPS[map].deco2.height
            };
        } catch (err) {}
        try {
            tempmaps2.above0 = {
                width: MAPS[map].above0.width,
                height: MAPS[map].above0.height
            };
        } catch (err) {}
        try {
            tempmaps2.above1 = {
                width: MAPS[map].above1.width,
                height: MAPS[map].above1.height
            };
        } catch (err) {}
        try {
            tempmaps2.col0 = {
                width: MAPS[map].col0.width,
                height: MAPS[map].col0.height
            };
        } catch (err) {}
        try {
            tempmaps2.col1 = {
                width: MAPS[map].col1.width,
                height: MAPS[map].col1.height
            };
        } catch (err) {}
    }
    try {
        io.emit('updateMap', {map:tempmaps1, meta:tempmaps2});
    } catch (err) {console.error(err)}
}
editTile = function(x, y, map, layer, id) {
    if (x < MAPS[map].width && x > -1 && y < MAPS[map].height && y > -1) {
        try {
        if (layer == 'C0') {
            Collision.list[map][x][y] = id;
        } else {
                if (layer == 'GT') MAPS[map].groundT[x][y] = id;
                if (layer == 'GO') MAPS[map].groundO[x][y] = id;
                if (layer == 'D0') MAPS[map].deco0[x][y] = id;
                if (layer == 'D1') MAPS[map].deco1[x][y] = id;
                if (layer == 'D2') MAPS[map].deco2[x][y] = id;
                if (layer == 'A0') MAPS[map].above0[x][y] = id;
                if (layer == 'A1') MAPS[map].above1[x][y] = id;
                io.emit('updateTile', {
                    pos: [x, y],
                    map: map,
                    layer: layer,
                    id: id
                });
            }
        } catch (err) {}
    }
}

loadMap('The Village');
loadMap('Town Hall');
loadMap('House');
loadMap('Tiny House');
loadMap('The Docks');
loadMap('The Flaming Sea');
loadMap('Fishing Hut');
loadMap('The River');
loadMap('The Forest');
loadMap('Lilypad Pathway Part 1');
loadMap('Lilypad Pathway Part 2');
loadMap('Lilypad Temple Room 0');
loadMap('Lilypad Temple Room 1');
loadMap('Lilypad Temple Room 2');
loadMap('Lilypad Kingdom');
loadMap('Lilypad Castle');
loadMap('Lilypad Castle Upstairs');
loadMap('Lilypad Castle Basement');
loadMap('Mysterious Room');
loadMap('The Weeping Forest');
loadMap('The Graveyard');
loadMap('The Arena');
loadMap('The Outskirts');
loadMap('Deserted Town');
loadMap('The Guarded Citadel');
loadMap('Town Cave');
loadMap('The Pet Arena');
// console.warn('\x1b[31m%s\x1b[0m', 'WORLDEDIT CURRENTLY DOES NOT SUPPORT TINY HOUSE DUE TO COMPATABILITY ISSUES');
console.info('MeadowGuarder Modded => WorldEdit v1.1.0');