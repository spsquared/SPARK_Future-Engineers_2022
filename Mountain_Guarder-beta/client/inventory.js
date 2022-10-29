// Copyright (C) 2022 Radioactive64

// inventory
const inventoryItems = document.getElementById('inventoryItemsBody');
const inventoryEquips = document.getElementById('inventoryEquipsBody');
const dragDiv = document.getElementById('invDrag');
const dragImg = document.getElementById('invDragImg');
const dragStackSize = document.getElementById('invDragStackSize');
const tooltip = document.getElementById('invHoverTooltip');

// inventory
Inventory = {
    items: [],
    equips: {
        weapon: null,
        weapon2: null,
        helmet: null,
        armor: null,
        boots: null,
        shield: null,
        key: null,
        crystal: null,
    },
    currentDrag: null,
    dragOffsetX: 0,
    dragOffsetY: 0,
    currentHover: null,
    maxItems: 30
};
Inventory.Item = function Item(id, slot, amount, enchantments) {
    const self = Object.assign({}, Inventory.itemTypes[id]);
    self.id = id;
    self.slot = slot;
    self.stackSize = amount || 1;
    self.enchantments = enchantments || [];
    self.refresh = function() {
        Inventory.items[self.slot].refresh();
    };
    self.enchant = function(enchantments) {
        // set enchant html string (<span style="color: #009900">Speed +10%</span>)
    };

    if (typeof slot == 'number') {
        Inventory.items[slot].item = self;
    } else {
        Inventory.equips[slot].item = self;
    }
    return self;
};
Inventory.Slot = function Slot() {
    const slot = document.createElement('div');
    slot.className = 'invSlot';
    slot.draggable = false;
    const self = {
        slotId: Inventory.items.length,
        item: null,
        slot: slot,
        mousedOver: false
    };

    self.refresh = function() {
        if (self.item) {
            if (self.item.stackSize != 1) slot.innerHTML = '<img src="/client/img/item/' + self.item.id + '.png" class="invSlotImg noSelect"></img><div class="invSlotStackSize noSelect">' + self.item.stackSize + '</div>';
            else slot.innerHTML = '<img src="/client/img/item/' + self.item.id + '.png" class="invSlotImg noSelect"></img>';
        } else {
            slot.innerHTML = '<img src="/client/img/item/empty.png" class="invSlotImgNoGrab noSelect"></img>';
        }
    };
    slot.onmouseover = function(e) {
        self.mousedOver = true;
        if (self.item) {
            Inventory.hovering = true;
            Inventory.loadTooltip(self.slotId);
        }
    };
    slot.onmouseout = function(e) {
        self.mousedOver = false;
        Inventory.hovering = false;
    };

    inventoryItems.appendChild(slot);
    Inventory.items.push(self);
    self.refresh();
    return self;
};
Inventory.EquipSlot = function EquipSlot(equip) {
    const slot = document.createElement('div');
    slot.id = 'invSlotEquip' + equip;
    slot.className = 'invSlot';
    slot.draggable = false;
    const self = {
        slotId: equip,
        item: null,
        slot: slot,
        mousedOver: false
    };

    self.refresh = function() {
        if (self.item) {
            slot.innerHTML = '<img src="/client/img/item/' + self.item.id + '.png" class="invSlotImg noSelect"></img>';
        } else {
            slot.innerHTML = '<img src="/client/img/item/emptySlot' + self.slotId + '.png" class="invSlotImgNoGrab noSelect"></img>';
        }
    };
    slot.onmouseover = function(e) {
        self.mousedOver = true;
        if (self.item) {
            Inventory.hovering = true;
            Inventory.loadTooltip(self.slotId);
        }
    };
    slot.onmouseout = function(e) {
        self.mousedOver = false;
        Inventory.hovering = false;
    };

    inventoryEquips.appendChild(slot);
    Inventory.equips[self.slotId] = self;
    self.refresh();
    return self;
};
Inventory.addItem = function addItem(id, slot, amount, enchantments) {
    new Inventory.Item(id, slot, amount, enchantments);
    Inventory.refreshSlot(slot);
};
Inventory.removeItem = function removeItem(slot) {
    if (slot != null) {
        if (typeof slot == 'number') {
            Inventory.items[slot].item = null;
        } else {
            Inventory.equips[slot].item = null;
        }
        Inventory.refreshSlot(slot);
    }
};
Inventory.refreshSlot = function refreshSlot(slot) {
    if (typeof slot == 'number') {
        Inventory.items[slot].refresh();
    } else {
        Inventory.equips[slot].refresh();
    }
};
Inventory.enchantSlot = function enchantSlot(slot, enchantments) {
    if (typeof slot == 'number') {
        Inventory.items[slot].enchant(enchantments);
    } else {
        Inventory.equips[slot].enchant(enchantments);
    }
    Inventory.refreshSlot(slot);
};
Inventory.contains = function contains(id, amount) {
    var count = 0;
    for (var i in Inventory.items) {
        if (Inventory.items[i].item && Inventory.items[i].item.id == id) count += Inventory.items[i].item.stackSize;
    }
    return count >= amount;
};
Inventory.loadTooltip = function loadTooltip(slot) {
    var item;
    if (typeof slot == 'number') item = Inventory.items[slot].item;
    else item = Inventory.equips[slot].item;
    tooltip.innerHTML = '<span style="font-size: 16px; ' + Inventory.getRarityColor(item.rarity) + '">' + item.name + '</span><br><span style="font-size: 14px;">' + item.slotType.charAt(0).toUpperCase()+item.slotType.slice(1) + '</span><br><div style="font-size: 12px; line-height: 14px;">' + item.description + '</div>' + Inventory.loadEffects(item);
};
Inventory.getRarityColor = function getRarityColor(rarity) {
    var str = '';
    switch (rarity) {
        case 'missing':
            str = 'color: red;';
            break;
        case 'coin':
            str = 'color: goldenrod;';
            break;
        case 'blucoin':
            str = 'color: #3C70FF;'
            break;
        case -1:
            str = 'animation: christmas 2s infinite;';
            break;
        case 0:
            str = 'color: white;';
            break;
        case 1:
            str = 'color: yellow;';
            break;
        case 2:
            str = 'color: gold;';
            break;
    }
    return str;
};
Inventory.loadEffects = function loadEffects(item) {
    var str = '<div style="font-size: 12px; line-height: 14px;">';
    if (typeof item === 'object') {
        if (item.slotType == 'weapon') {
            var damageType = 'Damage';
            switch (item.damageType) {
                case 'ranged':
                    damageType = ' Ranged damage';
                    break;
                case 'melee':
                    damageType = ' Melee damage';
                    break;
                case 'magic':
                    damageType = ' Purple damage';
                    break;
                default:
                    break;
            }
            str += '<span style="color: lime;">' + item.damage + damageType + '</span>';
            if (item.critChance != 0) {
                str += '<br><span style="color: lime;">' + Math.round(item.critChance*100) + '% Critical hit chance</span>';
            }
            if (item.critPower != 0) {
                str += '<br><span style="color: lime;">' + Math.round(item.critPower*100) + '% Critical hit power</span>';
            }
            str += '<br>';
        }
        for (var i in item.effects) {
            var color = '';
            var number = '+0';
            var effect = 'nothing';
            var localeffect = item.effects[i];
            if (localeffect.value < 0) {
                color = 'red';
                number = localeffect.value;
            } else {
                color = 'lime';
                number = '+' + localeffect.value;
            }
            switch (localeffect.id) {
                case 'health':
                    effect = 'HP';
                    if (localeffect.value-1 < 0) {
                        color = 'red';
                        number = Math.round(localeffect.value*100-100) + '%';
                    } else {
                        color = 'lime';
                        number = '+' + Math.round(localeffect.value*100-100) + '%';
                    }
                    break;
                case 'damage':
                    effect = 'Damage';
                    if (localeffect.value-1 < 0) {
                        color = 'red';
                        number = Math.round(localeffect.value*100-100) + '%';
                    } else {
                        color = 'lime';
                        number = '+' + Math.round(localeffect.value*100-100) + '%';
                    }
                    break;
                case 'rangedDamage':
                    effect = 'Ranged damage';
                    if (localeffect.value-1 < 0) {
                        color = 'red';
                        number = Math.round(localeffect.value*100-100) + '%';
                    } else {
                        color = 'lime';
                        number = '+' + Math.round(localeffect.value*100-100) + '%';
                    }
                    break;
                case 'meleeDamage':
                    effect = 'Melee damage';
                    if (localeffect.value-1 < 0) {
                        color = 'red';
                        number = Math.round(localeffect.value*100-100) + '%';
                    } else {
                        color = 'lime';
                        number = '+' + Math.round(localeffect.value*100-100) + '%';
                    }
                    break;
                case 'magicDamage':
                    effect = 'Purple damage';
                    if (localeffect.value-1 < 0) {
                        color = 'red';
                        number = Math.round(localeffect.value*100-100) + '%';
                    } else {
                        color = 'lime';
                        number = '+' + Math.round(localeffect.value*100-100) + '%';
                    }
                    break;
                case 'critChance':
                    effect = 'Critical hit chance';
                    if (localeffect.value < 0) {
                        color = 'red';
                        number = localeffect.value*100 + '%';
                    } else {
                        color = 'lime';
                        number = '+' + localeffect.value*100 + '%';
                    }
                    break;
                case 'critPower':
                    effect = 'Critical hit power';
                    if (localeffect.value < 0) {
                        color = 'red';
                        number = localeffect.value*100 + '%';
                    } else {
                        color = 'lime';
                        number = '+' + localeffect.value*100 + '%';
                    }
                    break;
                case 'damageReduction':
                    effect = 'Resistance';
                    if (localeffect.value < 0) {
                        color = 'red';
                        number = localeffect.value;
                    } else {
                        color = 'lime';
                        number = '+' + localeffect.value;
                    }
                    break;
                case 'defense':
                    effect = 'Defense';
                    if (localeffect.value < 0) {
                        color = 'red';
                        number = localeffect.value*100 + '%';
                    } else {
                        color = 'lime';
                        number = '+' + localeffect.value*100 + '%';
                    }
                    break;
                case 'speed':
                    effect = 'Move speed';
                    if (localeffect.value-1 < 0) {
                        color = 'red';
                        number = Math.round(localeffect.value*100-100) + '%';
                    } else {
                        color = 'lime';
                        number = '+' + Math.round(localeffect.value*100-100) + '%';
                    }
                    break;
                default:
                    console.error('Invalid effect id ' + localeffect.id);
                    break;
            }
            str += '<span style="color: ' + color + ';">' + number + ' ' + effect + '</span><br>';
        }
    }
    if (str == '<div style="font-size: 12px; line-height: 12px;">') str = '<br><div style="font-size: 12px; line-height: 12px;">No Effects';
    str += '</div>';
    return str;
};
document.addEventListener('mousedown', function(e) {
    if (loaded) {
        if (e.button == 0 || e.button == 2) {
            if (document.getElementById('inventory').contains(e.target)) {
                for (var i in Inventory.items) {
                    if (Inventory.items[i].mousedOver) {
                        if (Inventory.currentDrag) {
                            if (e.button == 0) Inventory.placeItem(parseInt(i), Inventory.currentDrag.stackSize);
                            else Inventory.placeItem(parseInt(i), 1);
                        } else if (Inventory.items[i].item) {
                            if (e.button == 0) Inventory.takeItem(parseInt(i), Inventory.items[i].item.stackSize);
                            else Inventory.takeItem(parseInt(i), 1);
                        }
                        return;
                    }
                }
                for (var i in Inventory.equips) {
                    if (Inventory.equips[i].mousedOver) {
                        if (Inventory.currentDrag) {
                            if (e.button == 0) Inventory.placeItem(i, Inventory.currentDrag.stackSize);
                            else Inventory.placeItem(i, 1);
                        } else if (Inventory.equips[i].item) {
                            if (e.button == 0) Inventory.takeItem(i, Inventory.equips[i].item.stackSize);
                            else Inventory.takeItem(i, 1);
                        }
                        return;
                    }
                }
            } else if (Inventory.currentDrag) {
                if (e.button == 0) Inventory.dropItem(null, Inventory.currentDrag.stackSize);
                else Inventory.dropItem(null, 1);
            }
        }
    }
});
document.addEventListener('mousemove', function(e) {
    if (loaded) {
        if (Inventory.currentDrag != null) {
            dragDiv.style.left = e.clientX-32 + 'px';
            dragDiv.style.top = e.clientY-32 + 'px';
        }
        if (Inventory.hovering && Inventory.currentDrag == null) {
            tooltip.style.opacity = 1;
            tooltip.style.left = e.clientX + 'px';
            tooltip.style.top = e.clientY + 'px';
        } else {
            tooltip.style.opacity = 0;
        }
    }
});
document.addEventListener('keydown', function(e) {
    if (loaded) {
        if (!inchat && !indebug) {
            if (e.key.toLowerCase() == keybinds.drop) {
                for (var i in Inventory.items) {
                    if (Inventory.items[i].item && Inventory.items[i].mousedOver) {
                        if (e.getModifierState('Control')) Inventory.dropItem(parseInt(i), Inventory.items[i].item.stackSize);
                        else Inventory.dropItem(parseInt(i), 1);
                        tooltip.style.opacity = 0;
                        Inventory.hovering = false;
                    }
                }
                for (var i in Inventory.equips) {
                    if (Inventory.equips[i].item && Inventory.equips[i].mousedOver) {
                        Inventory.dropItem(parseInt(i), Inventory.equips[i].item.stackSize);
                        tooltip.style.opacity = 0;
                        Inventory.hovering = false;
                    }
                }
            } else if (e.key.toLowerCase() == keybinds.swap) {
                socket.emit('item', {
                    action: 'swap'
                });
                e.preventDefault();
            }
        }
    }
});
Inventory.itemTypes = [];
Inventory.itemImages = [];
Inventory.itemHighlightImages = [];

// io
Inventory.takeItem = function takeItem(slot, amount) {
    socket.emit('item', {
        action: 'takeItem',
        slot: slot,
        amount: parseInt(amount)
    });
};
Inventory.placeItem = function placeItem(slot, amount) {
    socket.emit('item', {
        action: 'placeItem',
        slot: slot,
        amount: parseInt(amount)
    });
};
Inventory.dropItem = function dropItem(slot, amount) {
    socket.emit('item', {
        action: 'dropItem',
        slot: slot,
        amount: parseInt(amount)
    });
};
socket.on('dragging', function(data) {
    Inventory.currentDrag = data;
    if (data) {
        dragDiv.style.display = 'block';
        dragDiv.style.left = mouseX+window.innerWidth/2-32 + 'px';
        dragDiv.style.top = mouseY+window.innerHeight/2-32 + 'px';
        dragStackSize.innerText = '';
        if (data.stackSize != 1) dragStackSize.innerText = data.stackSize;
        dragImg.src = '/client/img/item/' + data.id + '.png';
        document.getElementById('gameContainer').style.cursor = 'grabbing';
    } else {
        dragDiv.style.display = 'none';
        dragStackSize.innerText = '';
        dragImg.src = '/client/img/item/empty.png';
        document.getElementById('gameContainer').style.cursor = '';
    }
});
socket.on('item', function(data) {
    switch (data.action) {
        case 'maxItems':
            Inventory.maxItems = data.slots;
            for (var i = 0; i < Inventory.maxItems; i++) {
                new Inventory.Slot();
            }
            break;
        case 'add':
            Inventory.addItem(data.data.id, data.data.slot, data.data.stackSize, data.data.enchantments);
            break;
        case 'remove':
            Inventory.removeItem(data.data.slot);
            break;
        case 'banner':
            var str = '<span style="' + Inventory.getRarityColor(Inventory.itemTypes[data.data.id].rarity) + ';">+' + data.data.amount + ' ' + Inventory.itemTypes[data.data.id].name + '</span>';
            new Banner(str, {
                type: 'time',
                time: 3000
            });
            break;
        default:
            console.error('Invalid item action ' + data.action);
            break;
    }
    if (Shop.currentShop) Shop.currentShop.updateAffordability();
    if (inventoryWindow.currentTab == 'inventoryCrafting') {
        for (var i in Crafting.slots) {
            Crafting.slots[i].updateMaterials();
        }
    }
});

// loading
async function getInventoryData() {
    await new Promise(function(resolve, reject) {
        totalassets++;
        var request = new XMLHttpRequest();
        request.open('GET', '/client/item.json', true);
        request.onload = async function() {
            if (this.status >= 200 && this.status < 400) {
                var json = JSON.parse(this.response);
                Inventory.itemTypes = json;
                loadedassets++;
                for (var i in Inventory.itemTypes) {
                    totalassets += 2;
                    Inventory.itemImages[i] = new Image();
                    Inventory.itemHighlightImages[i] = new Image();
                }
                totalassets++;
                Inventory.itemImages['empty'] = new Image();
                for (var i in Inventory.equips) {
                    totalassets++;
                    Inventory.itemImages[i] = new Image();
                }
                resolve();
            } else {
                console.error('Error: Server returned status ' + this.status);
                await sleep(1000);
                request.send();
            }
        };
        request.onerror = function() {
            console.error('There was a connection error. Please retry');
            reject();
        };
        request.send();
    });
};
async function loadInventoryData() {
    // The whole point of this is to get all the items into cache - unlike everything else the images will not be loaded from the array into the inventory window because of some wierd CSS issues.
    for (var i in Inventory.itemTypes) {
        await new Promise(function(resolve, reject) {
            Inventory.itemImages[i].onload = function() {
                loadedassets++;
                resolve();
            };
            Inventory.itemImages[i].src = '/client/img/item/' + i + '.png';
            Inventory.itemImages[i].className = 'invSlotImg noSelect';
        });
        await new Promise(function(resolve, reject) {
            Inventory.itemHighlightImages[i].onload = function() {
                loadedassets++;
                resolve();
            };
            Inventory.itemHighlightImages[i].src = '/client/img/item/highlighted/' + i + '.png';
            Inventory.itemHighlightImages[i].className = 'invSlotImg noSelect';
        });
    }
    await new Promise(function(resolve, reject) {
        Inventory.itemImages['empty'].onload = function() {
            loadedassets++;
            resolve();
        };
        Inventory.itemImages['empty'].src = '/client/img/item/empty.png';
        Inventory.itemImages['empty'].className = 'invSlotImgNoGrab noSelect';
    });
    for (var i in Inventory.equips) {
        await new Promise(function(resolve, reject) {
            Inventory.itemImages[i].onload = function() {
                loadedassets++;
                resolve();
            };
            Inventory.itemImages[i].src = '/client/img/item/emptySlot' + i + '.png';
            Inventory.itemImages[i].className = 'invSlotImgNoGrab noSelect';
        });
    }
    for (var i in Inventory.equips) {
        new Inventory.EquipSlot(i);
    }
};

// crafting
const inventoryCrafting = document.getElementById('inventoryCraftingBody');

// crafting
Crafting = {
    slots: [],
};
Crafting.slot = function(slot) {
    const craft = Crafting.slots[slot];
    const item = Object.assign({}, Inventory.itemTypes[craft.item]);
    item.stackSize = craft.amount;
    const tile = document.createElement('div');
    tile.classList.add('ui-block');
    tile.classList.add('craftingTile');
    const block = document.createElement('div');
    block.className = 'craftingImageBlock';
    const image = new Image();
    image.className = 'craftingImage';
    image.src = '/client/img/item/' + craft.item + '.png';
    block.appendChild(image);
    const amount = document.createElement('div');
    amount.className = 'craftingAmount';
    if (craft.amount != 1) amount.innerText = craft.amount;
    block.appendChild(amount);
    tile.appendChild(block);
    const popupItemText = '<span style="font-size: 16px; ' + Inventory.getRarityColor(item.rarity) + '">' + item.name + '</span><br><span style="font-size: 14px;">' + item.slotType.charAt(0).toUpperCase()+item.slotType.slice(1) + '</span><br><div style="font-size: 12px; line-height: 14px;">' + item.description + '</div>' + Inventory.loadEffects(item) + '<br>';
    inventoryCrafting.appendChild(tile);
    block.onmouseover = function onmouseover(e) {
        Inventory.hovering = true;
        tooltip.innerHTML = popupItemText + craft.updateMaterials();
    };
    block.onmouseout = function onmouseout(e) {
        Inventory.hovering = false;
        tooltip.innerHTML = '';
    };
    block.onclick = function onclick(e) {
        socket.emit('item', {
            action: 'craft',
            slot: parseInt(slot)
        });
    };
    craft.divs = {
        block: block,
        image: image
    };
    craft.updateMaterials = function updateMaterials() {
        var str = '<span style="font-size: 14px;">Requires:</span><br><div style="font-size: 12px; line-height: 12px;">';
        var hasAllResources = true;
        for (var i in craft.resources) {
            if (Inventory.contains(i, craft.resources[i])) {
                str += '<div style="color: lime;">x' + craft.resources[i] + ' ' + Inventory.itemTypes[i].name + '</div><br>';
            } else {
                str += '<div style="color: red;">x' + craft.resources[i] + ' ' + Inventory.itemTypes[i].name + '</div><br>';
                hasAllResources = false;
            }
        }
        if (craft.resources.length != 0) str = str.slice(0, -4);
        str += '</div>';
        if (hasAllResources) {
            image.style.filter = '';
            image.style.cursor = '';
        } else {
            image.style.filter = 'saturate(0)';
            image.style.cursor = 'not-allowed';
        }
        if (craft.showWhenCraftable) {
            if (hasAllResources) tile.style.display = '';
            else tile.style.display = 'none';
        }
        return str;
    }

    return craft;
};

// loading
async function getCraftingData() {
    await new Promise(function(resolve, reject) {
        totalassets++;
        var request = new XMLHttpRequest();
        request.open('GET', '/client/crafts.json', true);
        request.onload = async function() {
            if (this.status >= 200 && this.status < 400) {
                var json = JSON.parse(this.response);
                Crafting.slots = json.items;
                loadedassets++;
                for (var i in Crafting.slots) {
                    totalassets++;
                }
                resolve();
            } else {
                console.error('Error: Server returned status ' + this.status);
                await sleep(1000);
                request.send();
            }
        };
        request.onerror = function() {
            console.error('There was a connection error. Please retry');
            reject();
        };
        request.send();
    });
};
async function loadCraftingData() {
    for (var i in Crafting.slots) {
        new Crafting.slot(i);
        loadedassets++;
    }
};

// shops
const inventoryShop = document.getElementById('inventoryShopBody');
const shopName = document.getElementById('inventoryShopName');

// shops
Shop = function(id) {
    var self = Object.assign({}, Shop.shops[id]);
    self.id = id;
    self.divs = [];
    inventoryShop.innerHTML = '';
    shopName.innerText = self.name;
    for (var i in self.slots) {
        const block = document.createElement('div');
        block.className = 'shopBlock';
        const costs = document.createElement('div');
        costs.className = 'shopCosts';
        block.appendChild(costs);
        var counts = [];
        for (var j in self.slots[i].costs) {
            const costblock = document.createElement('div');
            costblock.className = 'costItemBlock';
            const cost = new Image();
            cost.className = 'costItemImg';
            cost.src = '/client/img/item/' + j + '.png';
            costblock.appendChild(cost);
            const costcount = document.createElement('div');
            costcount.className = 'shopCount';
            costcount.innerText = self.slots[i].costs[j] != 1 ? self.slots[i].costs[j] : '';
            costblock.appendChild(costcount);
            costs.appendChild(costblock);
            counts[j] = costcount;
        }
        const arrow = document.createElement('div');
        arrow.className = 'shopArrow';
        block.appendChild(arrow);
        const itemblock = document.createElement('div');
        itemblock.className = 'shopItemBlock';
        const item = new Image();
        item.className = 'shopItemImg';
        itemblock.appendChild(item);
        item.src = '/client/img/item/' + self.slots[i].item.id + '.png';
        const itemcount = document.createElement('div');
        itemcount.className = 'shopCount';
        itemcount.innerText = self.slots[i].item.amount != 1 ? self.slots[i].item.amount : '';
        itemblock.appendChild(itemcount);
        block.appendChild(itemblock);
        const slot = parseInt(i);
        itemblock.onclick = function() {
            socket.emit('shop', {
                action: 'buy',
                slot: slot
            });
        };
        inventoryShop.appendChild(block);
        self.divs[i] = {
            costcounts: counts,
            itemblock: itemblock,
            item: item,
        };
    }
    
    self.updateAffordability = function() {
        for (var i in self.slots) {
            var hasAll = true;
            for (var j in self.slots[i].costs) {
                if (Inventory.contains(j, self.slots[i].costs[j])) {
                    self.divs[i].costcounts[j].style.color = '';
                } else {
                    self.divs[i].costcounts[j].style.color = 'red';
                    hasAll = false;
                }
            }
            if (hasAll) {
                self.divs[i].item.style.filter = '';
                self.divs[i].itemblock.style.cursor = '';
            } else {
                self.divs[i].item.style.filter = 'saturate(0)';
                self.divs[i].itemblock.style.cursor = 'not-allowed';
            }
        }
    };
    self.close = function() {
        socket.emit('shop', {
            action: 'close'
        });
        inventoryShop.innerHTML = '';
        shopName.innerText = 'How Did You Get Here?';
        self = null;
        Shop.currentShop = null;
    }

    self.updateAffordability();
    
    inventoryWindow.changeTab('inventoryShop');
    inventoryWindow.show();
    Shop.currentShop = self;
    return self;
};
Shop.currentShop = null;
Shop.shops = [];

// io
socket.on('shop', function(data) {
    new Shop(data.id);
});

// loading
async function getShopData() {
    await new Promise(function(resolve, reject) {
        totalassets++;
        var request = new XMLHttpRequest();
        request.open('GET', '/client/shop.json', true);
        request.onload = async function() {
            if (this.status >= 200 && this.status < 400) {
                var json = JSON.parse(this.response);
                Shop.shops = json;
                loadedassets++;
                resolve();
            } else {
                console.error('Error: Server returned status ' + this.status);
                await sleep(1000);
                request.send();
            }
        };
        request.onerror = function() {
            console.error('There was a connection error. Please retry');
            reject();
        };
        request.send();
    });
};
async function loadShopData() {

};