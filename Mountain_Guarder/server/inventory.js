// Copyright (C) 2022 Radioactive64

Inventory = function(socket, player) {
    const self = {
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
            sell: null
        },
        maxItems: 30,
        cachedItem: null
    };
    self.items.length = self.maxItems;
    for (let i in self.items) {
        self.items[i] = null;
    }

    socket.on('item', function(data) {
        let valid = false;
        if (typeof data == 'object' && data != null && data.action != null) valid = true;
        if (valid) {
            switch (data.action) {
                case 'takeItem':
                    self.takeItem(data.slot, data.amount);
                    break;
                case 'placeItem':
                    self.placeItem(data.slot, data.amount);
                    break;
                case 'dropItem':
                    self.dropItem(data.slot, data.amount);
                    break;
                case 'swap':
                    if (self.equips['weapon'] && self.equips['weapon2']) {
                        var temp = self.equips['weapon'];
                        self.equips['weapon'] = self.equips['weapon2'];
                        self.equips['weapon2'] = temp;
                        self.equips['weapon'].slot = 'weapon';
                        self.equips['weapon2'].slot = 'weapon2';
                        self.refreshItem('weapon');
                        self.refreshItem('weapon2');
                    }
                    break;
                case 'quickEquip':
                    self.quickEquipItem(data.slot);
                    break;
                case 'use':
                    self.useItem(data.slot);
                    break;
                case 'craft':
                    self.craftItem(data.slot);
                    break;
                default:
                    error('Invalid item action ' + data.action);
                    break;
            }
        } else {
            player.kick();
        }
    });
    self.addItem = function addItem(id, amount, enchantments, banner) {
        if (!self.full()) {
            var newitem = new Inventory.Item(id, self.items, amount ?? 1, enchantments ?? []);
            if (newitem.overflow) {
                var angle = Math.random()*2*Math.PI;
                var distance = Math.random()*32;
                var x = player.x+Math.cos(angle)*distance;
                var y = player.y+Math.sin(angle)*distance;
                new DroppedItem(player.map, x, y, id, enchantments ?? [], newitem.overflow);
            }
            for (let i in newitem.modifiedSlots) {
                self.refreshItem(newitem.modifiedSlots[i]);
            }
            if (banner) socket.emit('item', {
                action: 'banner',
                data: {
                    id: id,
                    amount: amount-(newitem.overflow ?? 0),
                }
            });
            if (newitem.overflow) return newitem.overflow;
            return newitem.modifiedSlots;
        } else {
            var angle = Math.random()*2*Math.PI;
            var distance = Math.random()*32;
            var x = player.x+Math.cos(angle)*distance;
            var y = player.y+Math.sin(angle)*distance;
            return new DroppedItem(player.map, x, y, id, enchantments ?? [], amount);
        }
    };
    self.removeItem = function removeItem(id, amount) {
        amount = amount ?? 1;
        var modifiedSlots = [];
        for (let i in self.items) {
            if (self.items[i] && self.items[i].id == id) {
                var removed = self.items[i].stackSize-Math.max(self.items[i].stackSize-amount);
                self.items[i].stackSize -= removed;
                amount -= removed;
                if (self.items[i].stackSize < 1) self.items[i] = null;
                modifiedSlots.push(parseInt(i));
                if (amount <= 0) break;
            }
        }
        for (let i in modifiedSlots) {
            self.refreshItem(modifiedSlots[i]);
        }
        return modifiedSlots;
    };
    self.removeItemSlot = function removeItemSlot(slot, amount) {
        amount = amount ?? 1;
        var size = 0;
        if (typeof slot == 'number') {
            if (self.items[slot]) {
                self.items[slot].stackSize -= amount;
                size = Math.max(self.items[slot].stackSize, 0);
                if (self.items[slot].stackSize < 1) self.items[slot] = null;
            }
        } else {
            if (self.equips[slot]) {
                self.equips[slot].stackSize -= amount;
                size = Math.max(self.equips[slot].stackSize, 0);
                if (self.equips[slot].stackSize < 1) self.equips[slot] = null;
            }
        }
        self.refreshItem(slot);
        return size;
    };
    self.full = function full() {
        for (let i = 0; i < self.maxItems; i++) {
            if (self.items[i] == null) return false;
            else if (self.items[i].stackSize < self.items[i].maxStackSize) return false;
        }
        return true;
    };
    self.contains = function contains(id, amount) {
        var count = 0;
        for (let i in self.items) {
            if (self.items[i] && self.items[i].id == id) count += self.items[i].stackSize;
        }
        return count >= amount;
    };
    self.refresh = function refresh() {
        for (let i = 0; i < self.maxItems; i++) {
            self.refreshItem(parseInt(i));
            if (self.items[i] == null) self.items[i] = null;
        }
        for (let i in self.items) {
            if (i >= self.maxItems) {
                self.dropItem(parseInt(i));
            }
        }
        for (let i in self.equips) {
            self.refreshItem(i);
        }
    };
    self.refreshItem = function refreshItem(slot) {
        if (typeof slot == 'number') {
            if (self.items[slot]) {
                self.items[slot].refresh();
                socket.emit('item', {
                    action: 'add',
                    data: self.items[slot].getData()
                });
            } else {
                socket.emit('item', {
                    action: 'remove',
                    data: {
                        slot: slot
                    }
                });
            }
        } else {
            if (self.equips[slot]) {
                self.equips[slot].refresh();
                socket.emit('item', {
                    action: 'add',
                    data: self.equips[slot].getData()
                });
            } else {
                socket.emit('item', {
                    action: 'remove',
                    data: {
                        slot: slot
                    }
                });
            }
            player.updateStats();
        }
    };
    self.enchantItem = function enchantItem(slot, enchantment) {
        if (typeof slot == 'number') {
            self.items[slot].enchant(enchantment);
        } else {
            self.equips[slot].enchant(enchantment);
        }
        self.refreshItem(slot);
    };
    self.refreshCached = function refreshCached() {
        if (self.cachedItem) {
            socket.emit('dragging', {
                id: self.cachedItem.id,
                stackSize: self.cachedItem.stackSize
            });
        } else {
            socket.emit('dragging', null);
        }
    };
    self.takeItem = function takeItem(slot, amount) {
        let item;
        if (typeof slot == 'number') {
            item = self.items[slot];
            let valid = false;
            for (let i in self.items) {
                if (slot === parseInt(i)) valid = true;
            }
            if (!valid) {
                player.kick();
                return;
            }
        }
        else if (typeof slot == 'string') {
            item = self.equips[slot];
            let valid = false;
            for (let i in self.equips) {
                if (slot === i) valid = true;
            }
            if (!valid) {
                player.kick();
                return;
            }
        }
        else player.kick();
        if (item) {
            if (amount > item.stackSize || amount < 1 || typeof amount != 'number') {
                player.kick();
                return;
            }
            self.cachedItem = cloneDeep(item);
            self.cachedItem.getData = function getData() {
                return {
                    id: self.cachedItem.id,
                    slot: self.cachedItem.slot,
                    enchantments: self.cachedItem.enchantments,
                    stackSize: self.cachedItem.stackSize
                };
            };
            self.cachedItem.slot = null;
            self.cachedItem.stackSize = amount;
            self.removeItemSlot(slot, amount);
            self.refreshItem(slot);
            self.refreshCached();
        }
    };
    self.placeItem = function placeItem(slot, amount) {
        let item;
        if (typeof slot == 'number') {
            item = self.items[slot];
            let valid = false;
            for (let i in self.items) {
                if (slot === parseInt(i)) valid = true;
            }
            if (!valid) {
                player.kick();
                return;
            }
        } else if (typeof slot == 'string') {
            item = self.equips[slot];
            let valid = false;
            for (let i in self.equips) {
                if (slot === i) valid = true;
            }
            if (!valid) {
                player.kick();
                return;
            }
        } else {
            player.kick();
            return;
        }
        if (self.cachedItem) {
            if (amount > self.cachedItem.stackSize || amount < 1 || typeof amount != 'number') {
                player.kick();
                return;
            }
            if (item) {
                if (self.isSameItem(self.cachedItem, item) && typeof slot == 'number') {
                    let old = item.stackSize;
                    item.stackSize = Math.min(item.maxStackSize, item.stackSize+amount);
                    self.cachedItem.stackSize -= item.stackSize-old;
                    if (self.cachedItem.stackSize < 1) self.cachedItem = null;
                } else {
                    let canSwap = true;
                    if (typeof slot == 'number') {
                        self.items[slot] = self.cachedItem;
                        const item = self.items[slot];
                        item.getData = function getData() {
                            return {
                                id: item.id,
                                slot: item.slot,
                                enchantments: item.enchantments,
                                stackSize: item.stackSize
                            };
                        };
                        self.items[slot].slot = slot;
                    } else {
                        canSwap = false;
                        if (self.cachedItem.stackSize == 1 && (self.cachedItem.slotType == slot || (slot == 'weapon2' && self.cachedItem.slotType == 'weapon'))) {
                            canSwap = true;
                            self.equips[slot] = self.cachedItem;
                            const item = self.equips[slot];
                            item.getData = function getData() {
                                return {
                                    id: item.id,
                                    slot: item.slot,
                                    enchantments: item.enchantments,
                                    stackSize: item.stackSize
                                };
                            };
                           item.slot = slot;
                        }
                    }
                    if (canSwap) {
                        self.cachedItem = item;
                        self.cachedItem.getData = function getData() {
                            return {
                                id: self.cachedItem.id,
                                slot: self.cachedItem.slot,
                                enchantments: self.cachedItem.enchantments,
                                stackSize: self.cachedItem.stackSize
                            };
                        };
                        self.cachedItem.slot = null;
                    }
                }
            } else {
                let canPlace = self.cachedItem.stackSize == 1 && (self.cachedItem.slotType == slot || (slot == 'weapon2' && self.cachedItem.slotType == 'weapon'));
                if (canPlace || typeof slot == 'number') {
                    item = cloneDeep(self.cachedItem);
                    item.getData = function getData() {
                        return {
                            id: item.id,
                            slot: item.slot,
                            enchantments: item.enchantments,
                            stackSize: item.stackSize
                        };
                    };
                    if (typeof slot == 'number') {
                        self.items[slot] = item;
                    } else {
                        self.equips[slot] = item;
                    }
                    item.stackSize = amount;
                    item.slot = slot;
                    self.cachedItem.stackSize -= amount;
                    if (self.cachedItem.stackSize <= 0) self.cachedItem = null;
                }
            }
            self.refreshItem(slot);
            self.refreshCached();
        }
    };
    self.dropItem = function dropItem(slot, amount) {
        let item;
        if (typeof slot == 'number') item = self.items[slot];
        else if (typeof slot == 'string') item = self.equips[slot];
        else item = self.cachedItem;
        if (item) {
            if (amount > item.stackSize || amount < 1 || typeof amount != 'number') {
                player.kick();
                return;
            }
            let attempts = 0;
            let dropx, dropy;
            while (attempts < 100) {
                let angle = Math.random()*2*Math.PI;
                let distance = Math.random()*32;
                let x = player.x+Math.cos(angle)*distance;
                let y = player.y+Math.sin(angle)*distance;
                let collisions = [];
                if (Collision.grid[self.map]) {
                    for (let checkx = self.gridx-1; checkx <= self.gridx+1; checkx++) {
                        for (let checky = self.gridy-1; checky <= self.gridy+1; checky++) {
                            if (Collision.grid[self.map][checky] && Collision.grid[self.map][checky][checkx])
                            collisions.push(Collision.getColEntity(self.map, checkx, checky));
                        }
                    }
                }
                let colliding = false;
                for (let i in collisions) {
                    for (let j in collisions[i]) {
                        let bound1left = x-24;
                        let bound1right = x+24;
                        let bound1top = y-24;
                        let bound1bottom = y+24;
                        let bound2left = collisions[i][j].x-(collisions[i][j].width/2);
                        let bound2right = collisions[i][j].x+(collisions[i][j].width/2);
                        let bound2top = collisions[i][j].y-(collisions[i][j].height/2);
                        let bound2bottom = collisions[i][j].y+(collisions[i][j].height/2);
                        if (bound1left < bound2right && bound1right > bound2left && bound1top < bound2bottom && bound1bottom > bound2top) {
                            colliding = true;
                        }
                    }
                }
                if (!colliding) {
                    dropx = x;
                    dropy = y;
                    break;
                }
                attempts++;
            }
            if (dropx) {
                new DroppedItem(player.map, dropx, dropy, item.id, item.enchantments, amount);
                if (slot == null) {
                    item.stackSize -= amount;
                    if (item.stackSize < 1) self.cachedItem = null;
                    self.refreshCached();
                }
                else self.removeItemSlot(item.slot, amount);
            }
        }
    };
    self.quickEquipItem = function quickEquipItem(slot) {
        let item;
        if (typeof slot == 'number') {
            item = self.items[slot];
            let valid = false;
            for (let i in self.items) {
                if (slot === parseInt(i)) valid = true;
            }
            if (!valid) {
                player.kick();
                return;
            }
        } else if (typeof slot == 'string') {
            return;
        } else {
            player.kick();
            return;
        }
        if (item) {
            let newSlot;
            for (let i in self.equips) {
                if (item.slotType === i) newSlot = i;
            }
            if (newSlot) {
                let slotItem = self.equips[newSlot];
                self.equips[newSlot] = item;
                self.items[slot] = slotItem;
                item.slot = newSlot;
                if (slotItem) slotItem.slot = slot;
                self.refreshItem(slot);
                self.refreshItem(newSlot);
            }
        }
    };
    self.useItem = function useItem(slot) {
        let item;
        if (typeof slot == 'number') {
            item = self.items[slot];
            let valid = false;
            for (let i in self.items) {
                if (slot === parseInt(i)) valid = true;
            }
            if (!valid) {
                player.kick();
                return;
            }
        } else if (typeof slot == 'string') {
            return;
        } else {
            player.kick();
            return;
        }
        if (item && item.usable) {
            new Function('return ' + item.useScript)()(player);
        }
    }
    self.craftItem = function craftItem(slot) {
        const craft = Inventory.craftingRecipies[slot];
        if (craft) {
            var canCraft = true;
            for (let i in craft.resources) {
                if (!self.contains(i, craft.resources[i])) canCraft = false;
            }
            if (canCraft) {
                if (self.cachedItem) {
                    if (self.isSameItem(self.cachedItem, new Inventory.Item(craft.item, [null], craft.amount, []))) {
                        self.cachedItem.stackSize += craft.amount;
                        if (self.cachedItem.stackSize > self.cachedItem.maxStackSize) {
                            self.cachedItem.stackSize -= craft.amount;
                            return;
                        }
                } else {
                        return;
                    }
                } else {
                    self.cachedItem = new Inventory.Item(craft.item, [null], craft.amount, []);
                }
                self.refreshCached();
                for (let i in craft.resources) {
                    self.removeItem(i, craft.resources[i]);
                }
            }
        } else {
            player.kick();
        }
    };
    self.isSameItem = function isSameItem(item1, item2) {
        if (item1 && item2) {
            if (item1.id == item2.id) {
                var enchantsSame = true;
                search: for (let i in item1.enchantments) {
                    for (let j in item2.enchantments) {
                        if (item1.enchantments[i].id == item2.enchantments[j].id && item1.enchantments[i].level == item2.enchantments[j].level) continue search;
                    }
                    enchantsSame = false;
                }
                if (enchantsSame) return true;
            }
        }
        return false;
    };
    self.getSaveData = function getSaveData() {
        try {
            if (self.cachedItem != null) self.addItem(self.cachedItem.id, self.cachedItem.amount, self.cachedItem.enchantments);
            const pack = {
                items: [],
                equips: []
            };
            for (let i in self.items) {
                if (self.items[i] != null) {
                    pack.items.push(self.items[i].getData());
                }
            }
            for (let i in self.equips) {
                if (self.equips[i] != null) {
                    pack.equips.push(self.equips[i].getData());
                }
            }
            return pack;
        } catch (err) {
            error(err);
        }
    };
    self.loadSaveData = function loadSaveData(items) {
        if (typeof items == 'object' && items != null) {
            try {
                socket.emit('item', {
                    action: 'maxItems',
                    slots: self.maxItems
                });
                for (let i in items.items) {
                    var localitem = items.items[i];
                    if (localitem) {
                        var newitem = new Inventory.Item(localitem.id, [null], localitem.stackSize, localitem.enchantments);
                        if (typeof newitem == 'object') {
                            newitem.slot = parseInt(localitem.slot);
                            self.items[newitem.slot] = newitem;
                        }
                    }
                }
                for (let i in items.equips) {
                    var localitem = items.equips[i];
                    if (localitem) {
                        var newitem = new Inventory.Item(localitem.id, [null], localitem.stackSize, localitem.enchantments);
                        if (typeof newitem == 'object') {
                            newitem.slot = localitem.slot;
                            self.equips[newitem.slot] = newitem;
                        }
                    }
                }
            } catch(err) {
                error(err);
            }
        }
    };

    return self;
};
Inventory.Item = function Item(id, list, amount, enchantments) {
    if (Inventory.items[id] == null) {
        id = 'missing';
    }
    const self = cloneDeep(Inventory.items[id]);
    self.id = id;
    self.slot = 0;
    self.stackSize = 0;
    self.overflow = amount ?? 1;
    while (true) {
        if (list[self.slot] == null) break;
        self.slot++;
    }
    self.modifiedSlots = [];
    for (let i in list) {
        if (list[i] && list[i].id == self.id && list[i].stackSize < list[i].maxStackSize) {
            var enchantsSame = true;
            for (let j in list[i].enchantments) {
                var enchantfound = false;
                for (let k in enchantments) {
                    if (list[i].enchantments[j].id == enchantments[k].id && list[i].enchantments[j].level == enchantments[k].level) enchantfound = true;
                }
                if (enchantfound == false) enchantsSame = false;
            }
            if (enchantsSame) {
                var size = list[i].stackSize;
                list[i].stackSize = Math.min(list[i].maxStackSize, list[i].stackSize+self.overflow);
                self.overflow = Math.max(0, self.overflow-(list[i].stackSize-size));
                self.modifiedSlots.push(parseInt(i));
                if (self.overflow == 0) return {
                    modifiedSlots: self.modifiedSlots
                };
            }
        }
    }
    if (self.slot >= list.length) {
        return {
            overflow: self.overflow,
            modifiedSlots: self.modifiedSlots
        };
    }
    self.modifiedSlots.push(self.slot);
    self.stackSize = Math.min(self.overflow, self.maxStackSize);
    self.overflow -= Math.min(self.overflow, self.maxStackSize);
    if (self.overflow) {
        try {
            list[self.slot] = self;
            var newitem = new Inventory.Item(id, list, self.overflow, enchantments);
            self.modifiedSlots = self.modifiedSlots.concat(newitem.modifiedSlots);
            self.overflow = newitem.overflow;
        } catch (err) {
            error(err);
            return {
                overflow: self.overflow,
                modifiedSlots: self.modifiedSlots
            };
        }
    }
    self.enchantments = enchantments ?? [];

    self.getData = function getData() {
        return {
            id: self.id,
            slot: self.slot,
            enchantments: self.enchantments,
            stackSize: self.stackSize
        };
    };
    self.refresh = function refresh() {
        if (self.stackSize > self.maxStackSize) error('Stack Overflow (no not that one)');
    };
    self.enchant = function enchant(enchantment) {
        self.enchantments.push(enchantment);
    };

    self.refresh();
    list[self.slot] = self;
    return self;
};
Inventory.items = require('./item.json');
Inventory.craftingRecipies = require('./../client/crafts.json').items;
Inventory.enchantments = null;

Shop = function(id, socket, inventory, player, npc) {
    const self = {
        id: id,
        slots: []
    };
    try {
        self.slots = Shop.shops[id].slots;
    } catch (err) {
        error(err);
        return false;
    }
    player.attacking = false;
    player.shield = false;
    player.heldItem.usingShield = false;
    player.canMove = false;
    player.invincible = true;
    player.controls = {
        up: false,
        down: false,
        left: false,
        right: false,
        xaxis: 0,
        yaxis: 0,
        x: 0,
        y: 0,
        heal: false
    };
    player.inShop = true;
    player.shop = self;
    player.animationDirection = 'facing';
    
    socket.on('shop', function listener(data) {
        let valid = false;
        if (typeof data == 'object' && data != null && data.action != null) valid = true;
        if (valid) {
            switch (data.action) {
                case 'close':
                    socket.off('shop', listener);
                    self.close();
                    break;
                case 'buy':
                    self.buy(data.slot);
                    break;
                default:
                    error('Invalid item action ' + data.action);
                    break;
            }
        } else {
            player.kick();
        }
    });
    self.buy = function buy(item) {
        if (self.slots[item] != null) {
            const slot = self.slots[item];
            var canBuy = true;
            for (let i in slot.costs) {
                if (!inventory.contains(i, slot.costs[i])) canBuy = false;
            }
            if (canBuy) {
                if (inventory.cachedItem) {
                    if (inventory.isSameItem(inventory.cachedItem, new Inventory.Item(slot.item.id, [null], slot.item.amount, slot.item.enchantments))) {
                        inventory.cachedItem.stackSize += slot.item.amount;
                        if (inventory.cachedItem.stackSize >= inventory.cachedItem.maxStackSize) {
                            inventory.cachedItem.stackSize -= slot.item.amount;
                            return;
                        }
                    } else {
                        return;
                    }
                } else {
                    inventory.cachedItem = new Inventory.Item(slot.item.id, [null], slot.item.amount, slot.item.enchantments);
                }
                inventory.refreshCached();
                for (let i in slot.costs) {
                    inventory.removeItem(i, slot.costs[i]);
                }
            }
        } else {
            player.kick();
        }
    };
    self.close = function close() {
        player.canMove = true;
        player.invincible = false;
        player.inShop = false;
        player.shop = null;
        socket.emit('shopClose');
        npc.closeShop();
    };
    socket.emit('shop', {
        id: self.id
    });

    return self;
};
Shop.shops = require('./../client/shop.json');

SellShop = function(socket, inventory, player, npc) {
    const self = {};
    player.attacking = false;
    player.shield = false;
    player.heldItem.usingShield = false;
    player.canMove = false;
    player.invincible = true;
    player.controls = {
        up: false,
        down: false,
        left: false,
        right: false,
        xaxis: 0,
        yaxis: 0,
        x: 0,
        y: 0,
        heal: false
    };
    player.inShop = true;
    player.animationDirection = 'facing';
    
    socket.on('sellshop', function listener(data) {
        let valid = false;
        if (typeof data == 'object' && data != null && data.action != null) valid = true;
        if (valid) {
            switch (data.action) {
                case 'close':
                    socket.off('sellshop', listener);
                    self.close();
                    break;
                case 'sell':
                    self.sell();
                    break;
                default:
                    error('Invalid item action ' + data.action);
                    break;
            }
        } else {
            player.kick();
        }
    });
    self.sell = function sell() {
        // 
    };
    self.close = function close() {
        player.canMove = true;
        player.invincible = false;
        player.inShop = false;
        npc.closeShop();
    };
    
    socket.emit('sellshop');
};