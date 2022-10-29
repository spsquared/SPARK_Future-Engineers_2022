// Copyright (C) 2021 Radioactive64

function updateItemPreviewImage(e) {
	var image = document.getElementById('itemPreviewImg');
	image.src = URL.createObjectURL(e.target.files[0]);
};
function updateItemBaseStats() {
    var slotType = document.getElementById('slotType').value;
    document.getElementById('statsWeapon').style.display = 'none';
    document.getElementById('statsShield').style.display = 'none';
    document.getElementById('statsOffhand').style.display = 'none';
    document.getElementById('statsKey').style.display = 'none';
    if (slotType == 'weapon' || slotType == 'crystal') {
        document.getElementById('statsWeapon').style.display = '';
    } else if (slotType == 'shield') {
        document.getElementById('statsShield').style.display = '';
    } else if (slotType == 'offhand') {
        document.getElementById('statsOffhand').style.display = '';
    } else if (slotType == 'key') {
        document.getElementById('statsKey').style.display = '';
    }
};
updateItemBaseStats();

const effects = ['health', 'damage', 'rangedDamage', 'meleeDamage', 'magicDamage', 'critChance', 'critPower', 'damageReduction', 'defense', 'speed'];
const enchantments = ['speed', 'poisonEffect', 'burningEffect', 'range', 'accuracy', 'power', 'piercing', 'sharpness', 'reach', 'force', 'efficiency', 'sorcery', 'focus', 'spuhrpling', 'protection', 'spikes', 'swiftness', 'toughness', 'mirroring'];

function generateServerItem() {
    var item = {
        slotType: null,
        rarity: null,
        maxStackSize: 1
    };
    var slotType = document.getElementById('slotType').value;
    if (slotType == 'weapon' || slotType == 'crystal') {
        item.projectile = null;
        item.projectilePattern = null;
        item.projectileSpeed = null;
        item.projectileRange = null;
        item.damage = null;
        item.damageType = null;
        item.critChance = null;
        item.critPower = null;
        item.knockback = null;
        item.useTime = null;
        item.manaCost = null;
    } else if (slotType == 'shield') {
        item.knockbackResistance = null;
        item.blockAngle = null;
        item.projectileReflectChance = null;
    } else if (slotType == 'key') {
        item.manaIncrease = null;
        item.manaRegenerationSpeed = null;
        item.manaRegenerationAmount = null;
    }
    for (var i in item) {
        var value = document.getElementById(i).value;
        if (value == '') {
            window.alert('Please fill out all values');
            return;
        }
        if (value.includes(' ') && i != 'name') {
            window.alert('Invalid characters.');
            return;
        }
        if (isNaN(value*2) == false) value = parseFloat(value);
        item[i] = value;
    }
    item.effects = [];
    for (var i in effects) {
        var value = document.getElementById('effect' + effects[i]).value;
        if (value != '') {
            if (isNaN(value*2) == false) value = parseFloat(value);
            item.effects.push({
                id: effects[i],
                value: value
            });
        }
    }
    item.enchantments = [];
    for (var i in enchantments) {
        var checked = document.getElementById(enchantments[i]).checked;
        if (checked) {
            item.enchantments.push(enchantments[i]);
        }
    }
    var temparray = {};
    temparray[document.getElementById('id').value] = item;
    var jsonStr = JSON.stringify(temparray, null, 4);
    jsonStr = jsonStr.replace('{\n    ', '');
    var modified = '';
    for (var i = 0; i < jsonStr.length-2; i++) {
        modified += jsonStr[i];
    }
    modified += ',';
    navigator.clipboard.writeText(modified);
    window.alert('Copied to clipboard!');
};
function generateClientItem() {
    var item = {
        name: null,
        description: null,
        slotType: null,
        rarity: null
    };
    var slotType = document.getElementById('slotType').value;
    if (slotType == 'weapon' || slotType == 'crystal') {
        item.damage = null;
        item.damageType = null;
        item.critChance = null;
        item.critPower = null;
        item.knockback = null;
        item.useTime = null;
        item.manaCost = null;
        item.heldAngle = null;
        item.heldDistance = null;
    } else if (slotType == 'shield') {
        item.knockbackResistance = null;
        item.blockAngle = null;
        item.projectileReflectChance = null;
    } else if (slotType == 'key') {
        item.manaIncrease = null;
        item.manaRegenerationSpeed = null;
        item.manaRegenerationAmount = null;
    }
    for (var i in item) {
        var value = document.getElementById(i).value;
        if (value == '') {
            window.alert('Please fill out all values');
            return;
        }
        if (value.includes(' ') && i != 'name' && i != 'description') {
            window.alert('Invalid characters.');
            return;
        }
        if (isNaN(value*2) == false) value = parseFloat(value);
        item[i] = value;
    }
    item.effects = [];
    for (var i in effects) {
        var value = document.getElementById('effect' + effects[i]).value;
        if (value != '') {
            if (isNaN(value*2) == false) value = parseFloat(value);
            item.effects.push({
                id: effects[i],
                value: value
            });
        }
    }
    var temparray = {};
    temparray[document.getElementById('id').value] = item;
    var jsonStr = JSON.stringify(temparray, null, 4);
    jsonStr = jsonStr.replace('{\n    ', '');
    var modified = '';
    for (var i = 0; i < jsonStr.length-2; i++) {
        modified += jsonStr[i];
    }
    modified += ',';
    navigator.clipboard.writeText(modified);
    window.alert('Copied to clipboard!');
};