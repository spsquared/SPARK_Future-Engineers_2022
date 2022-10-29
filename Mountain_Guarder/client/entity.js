// Copyright (C) 2022 Radioactive64

// entities
Entity = function(id, map, x, y) {
    const self = {
        id: id,
        map: map,
        x: x,
        y: y,
        x2: Math.round(x),
        y2: Math.round(x),
        layer: 0,
        xspeed: 0,
        yspeed: 0,
        chunkx: 0,
        chunky: 0,
        width: 0,
        height: 0,
        rotation: 0,
        interpolationStage: 0,
        animationImage: new Image(),
        animationImage2: null,
        updated: true
    };

    self.update = function update(data) {
        if (self.map != data.map) {
            self.x = data.x;
            self.y = data.y;
        }
        self.map = data.map;
        self.layer = data.layer;
        self.xspeed = (data.x-self.x)/tpsFpsRatio;
        self.yspeed = (data.y-self.y)/tpsFpsRatio;
        self.interpolationStage = 0;
        self.updated = true;
    };
    self.draw = function draw() {
        LAYERS.elayers[self.layer].fillText('MISSING TEXTURE', self.x2+OFFSETX, self.y2+OFFSETY);
        self.updateFrame();
    };
    self.updateFrame = function updateFrame() {
        if (self.interpolationStage < (settings.fps/20)) {
            self.x += self.xspeed;
            self.y += self.yspeed;
            self.chunkx = Math.floor(self.x/(64*MAPS[self.map].chunkwidth));
            self.chunky = Math.floor(self.y/(64*MAPS[self.map].chunkheight));
            self.x2 = Math.round(self.x);
            self.y2 = Math.round(self.y);
            self.interpolationStage++;
        }
    };

    return self;
};
Entity.update = function update(data) {
    Player.update(data.players);
    Monster.update(data.monsters);
    Projectile.update(data.projectiles);
    if (settings.particles) {
        Particle.update(data.particles);
    }
    DroppedItem.update(data.droppedItems);
};
Entity.draw = function draw() {
    if (settings.debug) entStart = performance.now();
    Light.draw();
    var entities = [];
    for (let i in Player.list) {
        entities.push(Player.list[i]);
    }
    for (let i in Monster.list) {
        entities.push(Monster.list[i]);
    }
    for (let i in Projectile.list) {
        entities.push(Projectile.list[i]);
    }
    for (let i in DroppedItem.list) {
        entities.push(DroppedItem.list[i]);
    }
    for (let i in entities) {
        entities[i].map != player.map && delete entities[i];
    }
    let translatex = (window.innerWidth/2)-player.x2;
    let translatey = (window.innerHeight/2)-player.y2;
    for (let i in LAYERS.elayers) {
        LAYERS.elayers[i].clearRect(0, 0, window.innerWidth, window.innerHeight);
        LAYERS.elayers[i].save();
        LAYERS.elayers[i].translate(translatex, translatey);
    }
    LAYERS.eupper.clearRect(0, 0, window.innerWidth, window.innerHeight);
    LAYERS.eupper.save();
    LAYERS.eupper.translate(translatex, translatey);
    entities = entities.sort(function(a, b) {return a.y-b.y;});
    for (let entity of entities) {
        entity && entity.draw();
    }
    settings.particles && Particle.draw();
    for (let i in LAYERS.elayers) {
        LAYERS.elayers[i].restore();
    }
    LAYERS.eupper.restore();
    if (settings.debug) {
        let current = performance.now();
        entTimeCounter = Math.round((current-entStart)*100)/100;
    }
};

// rigs
Rig = function(id, map, x, y) {
    const self = new Entity(id, map, x, y);
    self.characterStyle = {
        hair: 0,
        hairColor: '',
        bodyColor: '',
        shirtColor: '',
        pantsColor: '',
        texture: null
    };
    self.rawWidth = 0;
    self.rawHeight = 0;
    self.hp = 0;
    self.maxHP = 0;
    self.xp = 0;
    self.manaFull = false;
    
    const old_update = self.update;
    self.update = function update(data) {
        old_update(data);
        self.animationStage = data.animationStage;
        self.hp = data.hp;
        self.maxHP = data.maxHP;
        self.updated = true;
    };
    self.draw = function() {
        LAYERS.elayers[self.layer].drawImage(self.animationImage, self.x2-self.animationImage.width*2+OFFSETX, self.y2-self.animationImage.height*2+OFFSETY, self.animationImage.width*4, self.animationImage.height*4);
        LAYERS.eupper.drawImage(Rig.healthBarR, 0, 0, 42, 5, self.x2-63+OFFSETX, self.y2-52+OFFSETY, 126, 15);
        LAYERS.eupper.drawImage(Rig.healthBarR, 1, 5, (self.hp/self.maxHP)*40, 5, self.x2-60+OFFSETX, self.y2-52+OFFSETY, (self.hp/self.maxHP)*120, 15);
        self.updateFrame();
    };

    return self;
};
Rig.healthBarG = new Image();
Rig.healthBarR = new Image();

// players
Player = function(id, map, x, y, name, isNPC, npcId) {
    const self = new Rig(id, map, x, y);
    self.layer = 0;
    self.heldItem = {
        id: null,
        shieldId: null,
        angle: 0,
        usingShield: false,
    };
    self.isNPC = false;
    if (isNPC) self.isNPC = true;
    if (npcId) self.npcId = npcId;
    self.name = name;
    self.nameColor = '#FF9900';
    if (self.name == 'Sampleprovider(sp)') self.nameColor = '#3C70FF';
    if (self.name == 'sp') self.nameColor = '#FF0090';
    self.light = new Light(self.x, self.y, self.map, 320, 0, 0, 0, 1, self, false);

    const old_update = self.update;
    self.update = function update(data) {
        old_update(data);
        self.animationStage = data.animationStage;
        if (data.characterStyle.hair != self.characterStyle.hair || data.characterStyle.hairColor != self.characterStyle.hairColor || data.characterStyle.bodyColor != self.characterStyle.bodyColor || data.characterStyle.shirtColor != self.characterStyle.shirtColor || data.characterStyle.pantsColor != self.characterStyle.pantsColor || data.characterStyle.texture != self.characterStyle.texture) {
            self.characterStyle = data.characterStyle;
            if (self.characterStyle.texture != null) {
                self.animationImage.src = '/img' + self.characterStyle.texture;
            } else {
                self.updateAnimationImage();
            }
            if (self.id == playerid) {
                document.getElementById('playerHairType').value = self.characterStyle.hair;
                document.getElementById('playerHairColor').value = self.characterStyle.hairColor;
                document.getElementById('playerSkinColor').value = self.characterStyle.bodyColor;
                document.getElementById('playerShirtColor').value = self.characterStyle.shirtColor;
                document.getElementById('playerPantsColor').value = self.characterStyle.pantsColor;
            }
        }
        if (self.id == playerid && settingsWindow.open) {
            Player.previewCtx.clearRect(0, 0, 120, 200);
            if (self.characterStyle.texture) {
                let ratio = Math.min(200/self.animationImage.height, 120/self.animationImage.width);
                Player.previewCtx.drawImage(self.animationImage, 60-self.animationImage.width*ratio/2, 100-self.animationImage.height*ratio/2, self.animationImage.width*ratio, self.animationImage.height*ratio);
            }
            else Player.previewCtx.drawImage(self.animationImage, (self.animationStage % 6)*8, (~~(self.animationStage / 6))*16, 8, 16, 12, 4, 96, 192);
        }
        self.heldItem = data.heldItem;
        self.updated = true;
    };
    self.draw = function draw() {
        if (!self.isNPC && self.heldItem.angle <= 0) self.drawHeldItem();
        if (self.characterStyle.texture) LAYERS.elayers[self.layer].drawImage(self.animationImage, self.x2-self.animationImage.width*2+OFFSETX, self.y2-self.animationImage.height*2+OFFSETY, self.animationImage.width*4, self.animationImage.height*4);
        else LAYERS.elayers[self.layer].drawImage(self.animationImage, (self.animationStage % 6)*8, (~~(self.animationStage / 6))*16, 8, 16, self.x2-16+OFFSETX, self.y2-52+OFFSETY, 32, 64);
        if (!self.isNPC && self.heldItem.angle > 0) self.drawHeldItem();
        if (!self.isNPC) {
            LAYERS.eupper.drawImage(Rig.healthBarG, 0, 0, 42, 5, self.x2-63+OFFSETX, self.y2-72+OFFSETY, 126, 15);
            LAYERS.eupper.drawImage(Rig.healthBarG, 1, 5, (self.hp/self.maxHP)*40, 5, self.x2-60+OFFSETX, self.y2-72+OFFSETY, (self.hp/self.maxHP)*120, 15);
        }
        LAYERS.eupper.textAlign = 'center';
        LAYERS.eupper.font = '12px Pixel';
        LAYERS.eupper.fillStyle = self.nameColor;
        self.isNPC && LAYERS.eupper.fillText(self.name, self.x2+OFFSETX, self.y2-58+OFFSETY);
        !self.isNPC && LAYERS.eupper.fillText(self.name, self.x2+OFFSETX, self.y2-80+OFFSETY);
        self.updateFrame();
    };
    self.drawHeldItem = function drawHeldItem() {
        LAYERS.elayers[self.layer].save();
        LAYERS.elayers[self.layer].translate(self.x2+OFFSETX, self.y2-8+OFFSETY);
        LAYERS.elayers[self.layer].rotate(self.heldItem.angle);
        if (self.heldItem.id && !self.heldItem.usingShield) {
            LAYERS.elayers[self.layer].translate(Inventory.itemTypes[self.heldItem.id].heldDistance, 0);
            LAYERS.elayers[self.layer].rotate(Inventory.itemTypes[self.heldItem.id].heldAngle*(Math.PI/180));
            LAYERS.elayers[self.layer].drawImage(Inventory.itemImages[self.heldItem.id], -24, -24, 48, 48);
        } else if (self.heldItem.shield && self.heldItem.usingShield) {
            LAYERS.elayers[self.layer].translate(32, 0);
            LAYERS.elayers[self.layer].rotate(-90*(Math.PI/180));
            LAYERS.elayers[self.layer].drawImage(Inventory.itemImages[self.heldItem.shield], -32, -32, 64, 32);
        }
        LAYERS.elayers[self.layer].restore();
    };
    self.updateAnimationImage = function updateAnimationImage() {
        const canvas = document.createElement('canvas');
        canvas.width = 48;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(self.drawTintedCanvas('body'), 0, 0);
        ctx.drawImage(self.drawTintedCanvas('shirt'), 0, 0);
        ctx.drawImage(self.drawTintedCanvas('pants'), 0, 0);
        ctx.drawImage(self.drawTintedCanvas('hair'), 0, 0);
        self.animationImage.src = canvas.toDataURL('image/png');
    };
    self.drawTintedCanvas = function drawTintedCanvas(asset) {
        const buffer = createCanvas(48, 128);
        const btx = buffer.getContext('2d');
        if (asset == 'hair') btx.drawImage(Player.animations[asset][self.characterStyle.hair], 0, 0);
        else btx.drawImage(Player.animations[asset], 0, 0);
        btx.fillStyle = self.characterStyle[asset + 'Color'];
        btx.globalCompositeOperation = 'multiply';
        btx.fillRect(0, 0, 48, 128);
        btx.globalCompositeOperation = 'destination-in';
        if (asset == 'hair') btx.drawImage(Player.animations[asset][self.characterStyle.hair], 0, 0);
        else btx.drawImage(Player.animations[asset], 0, 0);
        return buffer;
    };
    self.remove = function remove() {
        self.light.remove();
        delete Player.list[self.id];
    };

    Player.list[self.id] = self;
    return self;
};
Player.update = function update(data) {
    for (let i in Player.list) {
        Player.list[i].updated = false;
    }
    for (let localplayer of data) {
        if (Player.list[localplayer.id]) {
            Player.list[localplayer.id].update(localplayer);
        } else {
            try {
                new Player(localplayer.id, localplayer.map, localplayer.x, localplayer.y, localplayer.name, localplayer.isNPC, localplayer.npcId);
                Player.list[localplayer.id].update(localplayer);
            } catch (err) {
                console.error(err);
            }
        }
    }
    for (let i in Player.list) {
        !Player.list[i].updated && Player.list[i].remove();
    }
};
Player.list = [];
Player.animations = {
    hair: [
        new Image(),
        new Image(),
        new Image(),
        new Image(),
        new Image(),
        new Image(),
        new Image()
    ],
    body: new Image(),
    shirt: new Image(),
    pants: new Image()
};
Player.previewCtx = document.getElementById('playerPreview').getContext('2d');

// monsters
Monster = function(id, map, x, y, type, boss) {
    const self = new Rig(id, map, x, y);
    let tempmonster = Monster.types[type];
    self.type = type;
    self.name = tempmonster.name;
    self.width = tempmonster.width;
    self.height = tempmonster.height;
    self.rawWidth = tempmonster.rawWidth;
    self.rawHeight = tempmonster.rawHeight;
    self.offsetX = tempmonster.offsetX;
    self.offsetY = tempmonster.offsetY;
    self.animationImage = Monster.images[type];
    self.isBoss = boss;
    if (self.isBoss || tempmonster.displayBossBar) {
        const outer = document.createElement('div');
        outer.classList.add('bossBarOuter');
        const inner = document.createElement('div');
        inner.classList.add('bossBarInner');
        inner.style.backgroundColor = tempmonster.bossBarColor ?? '#FF0000';
        const text = document.createElement('div');
        text.classList.add('bossBarText');
        text.innerText = self.name + ': ' + self.hp + '/' + self.maxHP;
        outer.appendChild(inner);
        outer.appendChild(text);
        document.getElementById('bossBars').appendChild(outer);
        self.bossBar = {
            outer: outer,
            inner: inner,
            text: text
        };
        const oldUpdate = self.update;
        self.update = function boss_update(data) {
            oldUpdate(data);
            self.bossBar.inner.style.width = Math.round(self.hp/self.maxHP*100) + '%';
            self.bossBar.text.innerText = self.name + ': ' + self.hp + '/' + self.maxHP;
        }
    }
    delete tempmonster;

    self.draw = function draw() {
        if (self.characterStyle.texture) LAYERS.elayers[self.layer].drawImage(self.animationImage, self.x2-self.animationImage.width*2+self.offsetX+OFFSETX, self.y2-self.animationImage.height*2+self.offsetY+OFFSETY, self.animationImage.width*4, self.animationImage.height*4);
        else LAYERS.elayers[self.layer].drawImage(self.animationImage, self.animationStage*self.rawWidth, 0, self.rawWidth, self.rawHeight, self.x2-self.width/2+self.offsetX+OFFSETX, self.y2-self.height/2+self.offsetY+OFFSETY, self.width, self.height);
        LAYERS.eupper.drawImage(Rig.healthBarR, 0, 0, 42, 5, self.x2-63+self.offsetX+OFFSETX, self.y2-self.height/2-20+self.offsetY+OFFSETY, 126, 15);
        LAYERS.eupper.drawImage(Rig.healthBarR, 1, 5, (self.hp/self.maxHP)*40, 5, self.x2-60+self.offsetX+OFFSETX, self.y2-self.height/2-20+self.offsetY+OFFSETY, (self.hp/self.maxHP)*120, 15);
        self.updateFrame();
    };
    self.remove = function remove() {
        delete Monster.list[self.id];
        self.isBoss && self.bossBar.outer.remove();
    };

    Monster.list[self.id] = self;
    return self;
};
Monster.update = function update(data) {
    for (let i in Monster.list) {
        Monster.list[i].updated = false;
    }
    for (let localmonster of data) {
        if (localmonster) {
            if (Monster.list[localmonster.id]) {
                Monster.list[localmonster.id].update(localmonster);
            } else {
                try {
                    new Monster(localmonster.id, localmonster.map, localmonster.x, localmonster.y, localmonster.type, localmonster.boss);
                    Monster.list[localmonster.id].update(localmonster);
                } catch (err) {
                    console.error(err);
                }
            }
        }
    }
    for (let i in Monster.list) {
        !Monster.list[i].updated && Monster.list[i].remove();
    }
};
Monster.list = [];
Monster.types = {};
Monster.images = {};

// projectiles
Projectile = function(id, map, x, y, angle, type) {
    const self = new Entity(id, map, x, y);
    self.angle = angle;
    self.rotationspeed = 0;
    let tempprojectile = Projectile.types[type];
    self.type = type;
    self.width = tempprojectile.width;
    self.height = tempprojectile.height;
    self.rawWidth = tempprojectile.rawWidth;
    self.rawHeight = tempprojectile.rawHeight;
    self.offsetX = tempprojectile.offsetX;
    self.offsetY = tempprojectile.offsetY;
    self.above = tempprojectile.above;
    self.animationImage = Projectile.images[type];
    self.animationStage = 0;
    if (tempprojectile.glow) self.light = new Light(self.x, self.y, self.map, tempprojectile.glow.radius, tempprojectile.glow.color.r, tempprojectile.glow.color.g, tempprojectile.glow.color.b, tempprojectile.glow.intensity, self, self.above);
    delete tempprojectile;

    const old_update = self.update;
    self.update = function update(data) {
        old_update(data);
        let diff = (data.angle-self.angle) % (2*Math.PI);
        self.rotationspeed = (2*diff) % (2*Math.PI) - diff;
        self.updated = true;
    };
    self.draw = function draw() {
        if (self.above) {
            LAYERS.eupper.save();
            LAYERS.eupper.translate(self.x2+OFFSETX, self.y2+OFFSETY);
            LAYERS.eupper.rotate(self.angle);
            LAYERS.eupper.drawImage(self.animationImage, self.animationStage*self.rawWidth, 0, self.rawWidth, self.rawHeight, -self.width/2+self.offsetX, -self.height/2+self.offsetY, self.width, self.height);
            LAYERS.eupper.restore();
        } else {
            LAYERS.elayers[self.layer].save();
            LAYERS.elayers[self.layer].translate(self.x2+OFFSETX, self.y2+OFFSETY);
            LAYERS.elayers[self.layer].rotate(self.angle);
            LAYERS.elayers[self.layer].drawImage(self.animationImage, self.animationStage*self.rawWidth, 0, self.rawWidth, self.rawHeight, -self.width/2+self.offsetX, -self.height/2+self.offsetY, self.width, self.height);
            LAYERS.elayers[self.layer].restore();
        }
        self.updateFrame();
    };
    const old_updateFrame = self.updateFrame;
    self.updateFrame = function updateFrame() {
        old_updateFrame();
        if (self.interpolationStage < (settings.fps/20)) self.angle += self.rotationspeed;
    }
    self.remove = function remove() {
        self.light && self.light.remove();
        delete Projectile.list[self.id];
    };

    Projectile.list[self.id] = self;
    return self;
};
Projectile.update = function update(data) {
    for (let i in Projectile.list) {
        Projectile.list[i].updated = false;
    }
    for (let localprojectile of data) {
        if (localprojectile) {
            if (Projectile.list[localprojectile.id]) {
                Projectile.list[localprojectile.id].update(localprojectile);
            } else {
                try {
                    new Projectile(localprojectile.id, localprojectile.map, localprojectile.x, localprojectile.y, localprojectile.angle, localprojectile.type);
                    Projectile.list[localprojectile.id].update(localprojectile);
                } catch (err) {
                    console.error(err);
                }
            }
        }
    }
    for (let i in Projectile.list) {
        !Projectile.list[i].updated && Projectile.list[i].remove();
    }
};
Projectile.list = [];
Projectile.types = {};
Projectile.images = {};

// particles
Particle = function(map, x, y, type, value) {
    const self = {
        id: null,
        map: map,
        x: x,
        y: y,
        xspeed: 0,
        yspeed: 0,
        opacity: 120,
        type: type,
        value: value,
        size: 20,
        chunkx: 0,
        chunky: 0,
        identifier: 0,
        particle: true
    };
    self.id = Math.random();
    switch (self.type) {
        case 'damage':
            self.xspeed = Math.random()*8-4;
            self.yspeed = -20;
            self.identifier = 1;
            break;
        case 'critdamage':
            self.xspeed = Math.random()*8-4;
            self.yspeed = -20;
            self.identifier = 2;
            break;
        case 'heal':
            self.xspeed = Math.random()*8-4;
            self.yspeed = -20;
            self.identifier = 3;
            break;
        case 'teleport':
            var angle = Math.random()*2*Math.PI;
            self.xspeed = Math.sin(angle)*Math.random()*3;
            self.yspeed = Math.cos(angle)*Math.random()*3;
            self.opacity = Math.round(Math.random()*50)+100;
            self.size = Math.random()*10+10;
            self.identifier = 4;
            break;
        case 'explosion':
            var random = Math.random();
            if (random <= 0.4) {
                self.color = 'rgba(250, 50, 50, ';
                self.opacity -= 60;
                self.identifier = 5.1;
            } else if (random <= 0.6) {
                self.color = 'rgba(255, 255, 255, ';
                self.identifier = 5.2;
            } else if (random <= 0.8) {
                self.color = 'rgba(150, 150, 150, ';
                self.identifier = 5.3;
            } else {
                self.color = 'rgba(50, 50, 50, ';
                self.identifier = 5.4;
            }
            var angle = Math.random()*2*Math.PI;
            var speed = Math.random()*20;
            self.xspeed = Math.sin(angle)*speed;
            self.yspeed = Math.cos(angle)*speed;
            self.opacity = Math.round(Math.random()*100)+100;
            self.size = Math.random()*10+20;
            break;
        case 'crater':
            self.identifier = 6;
            break;
        case 'spawn':
            self.angle = Math.random()*2*Math.PI;
            self.radius = Math.random()*80;
            self.rotationspeed = Math.random()*0.2;
            self.x = x+Math.cos(self.angle)*self.radius;
            self.y = y+Math.sin(self.angle)*self.radius;
            self.opacity = Math.round(Math.random()*50)+100;
            self.size = Math.random()*5+5;
            self.identifier = 7;
            break;
        case 'death':
            self.yspeed = -5;
            self.opacity = Math.round(Math.random()*50)+100;
            self.size = Math.random()*5+15;
            self.identifier = 8;
            break;
        case 'playerdeath':
            var angle = Math.random()*2*Math.PI;
            self.xspeed = Math.sin(angle)*Math.random()*6-3;
            self.yspeed = Math.cos(angle)*Math.random()*5-10;
            self.opacity = Math.round(Math.random()*50)+100;
            self.size = Math.random()*5+15;
            self.identifier = 9;
            break;
        case 'warning':
            self.size = 40;
            self.opacity = self.value*20+10;
            self.identifier = 10;
            break;
        case 'garuderWarp1':
            var random = Math.floor(Math.random()*3);
            if (random == 0) {
                self.color = 'rgba(60, 112, 255, ';
                self.opacity -= 60;
                self.identifier = 11.1;
            } else if (random == 1) {
                self.color = 'rgba(255, 0, 153, ';
                self.identifier = 11.2;
            } else {
                self.color = 'rgba(71, 216, 159, ';
                self.identifier = 11.3;
            }
            self.angle = Math.random()*2*Math.PI;
            self.radius = Math.random()*32+16;
            self.rotationspeed = Math.random()*0.2;
            self.x = x+Math.cos(self.angle)*self.radius;
            self.y = y+Math.sin(self.angle)*self.radius;
            self.opacity = 60;
            self.op2 = Math.random()*-50;
            self.size = Math.random()*5+10;
            break;
        case 'garuderWarp2':
        var random = Math.floor(Math.random()*3);
        if (random == 0) {
            self.color = 'rgba(60, 112, 255, ';
            self.opacity -= 60;
            self.identifier = 12.1;
        } else if (random == 1) {
            self.color = 'rgba(255, 0, 153, ';
            self.identifier = 12.2;
        } else {
            self.color = 'rgba(71, 216, 159, ';
            self.identifier = 12.3;
        }
        var angle = Math.random()*2*Math.PI;
        var speed = Math.random()*25;
        self.xspeed = Math.sin(angle)*speed;
        self.yspeed = Math.cos(angle)*speed;
        self.opacity = Math.round(Math.random()*50)+100;
        self.size = Math.random()*20+10;
        break;
        case 'cameraShake':
            startCameraShake(value.intensity, value.time);
            return self;
        default:
            console.error('invalid particle type ' + self.type);
            return;
    }

    self.update = function update() {
        self.x += self.xspeed/tpsFpsRatio;
        self.y += self.yspeed/tpsFpsRatio;
        self.chunkx = Math.floor(self.x/(64*MAPS[self.map].chunkwidth));
        self.chunky = Math.floor(self.y/(64*MAPS[self.map].chunkheight));
        if (self.opacity <= 0) {
            delete Particle.list.get(self.identifier)[self.id];
            return true;
        }
        switch (self.type) {
            case 'damage':
                self.xspeed *= 1-(0.03/tpsFpsRatio);
                self.yspeed += 2/tpsFpsRatio;
                self.opacity -= 6/tpsFpsRatio;
                break;
            case 'critdamage':
                self.xspeed *= 1-(0.02/tpsFpsRatio);
                self.yspeed += 1.5/tpsFpsRatio;
                self.opacity -= 4/tpsFpsRatio;
                break;
            case 'heal':
                self.xspeed *= 1-(0.03/tpsFpsRatio);
                self.yspeed += 2/tpsFpsRatio;
                self.opacity -= 6/tpsFpsRatio;
                break;
            case 'teleport':
                self.xspeed *= 1-(0.05/tpsFpsRatio);
                self.yspeed *= 1-(0.05/tpsFpsRatio);
                self.opacity -= 3/tpsFpsRatio;
                break;
            case 'explosion':
                self.xspeed *= 1-(0.15/tpsFpsRatio);
                self.yspeed *= 1-(0.15/tpsFpsRatio);
                self.opacity -= 4/tpsFpsRatio;
                break;
            case 'spawn':
                self.angle += self.rotationspeed/tpsFpsRatio;
                self.x = x+Math.cos(self.angle)*self.radius;
                self.y = y+Math.sin(self.angle)*self.radius;
                self.rotationspeed += 0.005/tpsFpsRatio;
                self.radius -= self.radius/30/tpsFpsRatio;
                self.size += 0.1/tpsFpsRatio;
                self.opacity -= 3/tpsFpsRatio;
                break;
            case 'death':
                self.yspeed *= 1-(0.1/tpsFpsRatio);
                self.opacity -= 4/tpsFpsRatio;
                break;
            case 'playerdeath':
                self.xspeed *= 1-(0.05/tpsFpsRatio);
                self.yspeed += 1/tpsFpsRatio;
                self.opacity -= 4/tpsFpsRatio;
                break;
            case 'warning':
                self.opacity -= 10/tpsFpsRatio;
                break;
            case 'garuderWarp1':
                self.radius += 0.5/tpsFpsRatio;
                self.angle += self.rotationspeed/tpsFpsRatio;
                self.x = x+Math.cos(self.angle)*self.radius;
                self.y = y+Math.sin(self.angle)*self.radius;
                self.rotationspeed += self.rotationspeed/20/tpsFpsRatio;
                self.opacity -= 1/tpsFpsRatio;
                self.op2 += 8/tpsFpsRatio;
                if (self.opacity < 5) {
                    self.radius -= self.radius/2/tpsFpsRatio;
                };
                break;
            case 'garuderWarp2':
                self.xspeed *= 1-(0.2/tpsFpsRatio);
                self.yspeed *= 1-(0.2/tpsFpsRatio);
                self.opacity -= 5/tpsFpsRatio;
                break;
            default:
                delete Particle.list.get(self.identifier)[self.id];
                break;
        }
    };
    self.draw = function draw() {
        if (self.update()) return;
        let type = 0;
        switch (self.type) {
            case 'damage':
                // #FF0000
                LAYERS.eupper.fillStyle = 'rgba(255, 0, 0, ' + self.opacity/100 + ')';
                type = 0;
                break;
            case 'critdamage':
                // #FF0000
                LAYERS.eupper.fillStyle = 'rgba(255, 0, 0, ' + self.opacity/100 + ')';
                type = 0;
                break;
            case 'heal':
                // #00FF00
                LAYERS.eupper.fillStyle = 'rgba(0, 255, 0, ' + self.opacity/100 + ')';
                type = 0;
                break;
            case 'teleport':
                // #9900CC
                LAYERS.eupper.fillStyle = 'rgba(153, 0, 204, ' + Math.min(self.opacity, 50)/100 + ')';
                type = 1;
                break;
            case 'explosion':
                LAYERS.eupper.fillStyle = self.color + Math.min(self.opacity, 50)/100 + ')';
                type = 1;
                break;
            case 'spawn':
                // #0000FF
                let opacity = self.opacity > 100 ? 50-self.opacity+100 : self.opacity;
                LAYERS.eupper.fillStyle = 'rgba(0, 0, 255, ' + Math.min(opacity, 50)/100 + ')';
                type = 1;
                break;
            case 'death':
                LAYERS.eupper.fillStyle = 'rgba(255, 0, 0, ' + Math.min(self.opacity, 50)/100 + ')';
                type = 1;
                break;
            case 'playerdeath':
                LAYERS.eupper.fillStyle = 'rgba(255, 0, 0, ' + Math.min(self.opacity, 50)/100 + ')';
                type = 1;
                break;
            case 'warning':
                LAYERS.eupper.fillStyle = 'rgba(255, 0, 0, ' + self.opacity/100 + ')';
                type = 1;
                break;
            case 'garuderWarp1':
                LAYERS.eupper.fillStyle = self.color + Math.max(self.op2, 0)/100 + ')';
                type = 1;
                break;
            case 'garuderWarp2':
                LAYERS.eupper.fillStyle = self.color + self.opacity/100 + ')';
                type = 1;
                break;
            default:
                delete Particle.list.get(self.identifier)[self.id];
                break;
        }
        switch (type) {
            case 0:
                LAYERS.eupper.fillText(self.value, self.x+OFFSETX, self.y+OFFSETY);
                break;
            case 1:
                LAYERS.eupper.fillRect(self.x-self.size/2+OFFSETX, self.y-self.size/2+OFFSETY, self.size, self.size);
                break;
            default:
                delete Particle.list.get(self.identifier)[self.id];
                break;
        }
    };
    self.drawFast = function drawFast() {
        if (self.update()) return;
        let type = 0;
        switch (self.type) {
            case 'damage':
                type = 0;
                break;
            case 'critdamage':
                type = 0;
                break;
            case 'heal':
                type = 0;
                break;
            case 'teleport':
                type = 1;
                break;
            case 'explosion':
                type = 1;
                break;
            case 'spawn':
                type = 1;
                break;
            case 'death':
                type = 1;
                break;
            case 'playerdeath':
                type = 1;
                break;
            case 'warning':
                type = 1;
                break;
            case 'garuderTeleport1':
                type = 1;
                break;
            case 'garuderTeleport2':
                type = 1;
                break;
            default:
                delete Particle.list.get(self.identifier)[self.id];
                return;
        }
        switch (type) {
            case 0:
                LAYERS.eupper.fillText(self.value, self.x+OFFSETX, self.y+OFFSETY);
                break;
            case 1:
                LAYERS.eupper.fillRect(self.x-self.size/2+OFFSETX, self.y-self.size/2+OFFSETY, self.size, self.size);
                break;
            default:
                delete Particle.list.get(self.identifier)[self.id];
                return;
        }
    };

    if (Particle.list.get(self.identifier) == null) Particle.list.set(self.identifier, []);
    Particle.list.get(self.identifier)[self.id] = self;
    return self;
};
Particle.update = function update(data) {
    for (let localparticle of data) {
        localparticle && new Particle(localparticle.map, localparticle.x, localparticle.y, localparticle.type, localparticle.value);
    }
};
Particle.draw = function draw() {
    Particle.list.forEach((arr, i) => {
        if (settings.fastParticles) {
            switch (i) {
                case 1:
                    // damage
                    LAYERS.eupper.fillStyle = '#FF0000';
                    LAYERS.eupper.textAlign = 'center';
                    LAYERS.eupper.font = '24px Pixel';
                    break;
                case 2:
                    // crit damage
                    LAYERS.eupper.fillStyle = '#FF0000';
                    LAYERS.eupper.textAlign = 'center';
                    LAYERS.eupper.font = 'bold 36px Pixel';
                    break;
                case 3:
                    // heal
                    LAYERS.eupper.fillStyle = '#00FF00';
                    LAYERS.eupper.textAlign = 'center';
                    LAYERS.eupper.font = '24px Pixel';
                    break;
                case 4:
                    // teleport
                    LAYERS.eupper.fillStyle = '#9900CC';
                    break;
                case 5.1:
                    // explosion 1
                    LAYERS.eupper.fillStyle = '#F03232';
                    break;
                case 5.2:
                    // explosion 2
                    LAYERS.eupper.fillStyle = '#FFFFFF';
                    break;
                case 5.3:
                    // explosion 3
                    LAYERS.eupper.fillStyle = '#969696';
                    break;
                case 5.4:
                    // explosion 4
                    LAYERS.eupper.fillStyle = '#323232';
                    break;
                case 6:
                    // crater
                    break;
                case 7:
                    // spawn
                    LAYERS.eupper.fillStyle = '#0000FF';
                    break;
                case 8:
                    // death
                    LAYERS.eupper.fillStyle = '#FF0000';
                    break;
                case 9:
                    // player death
                    LAYERS.eupper.fillStyle = '#FF0000';
                    break;
                case 10:
                    // warning
                    LAYERS.eupper.fillStyle = '#FF0000';
                    break;
                case 11.1:
                    // garuder warp 1
                    LAYERS.eupper.fillStyle = '#3C70FF';
                    break;
                case 11.2:
                    // garuder warp 1
                    LAYERS.eupper.fillStyle = '#FF0099';
                    break;
                case 11.3:
                    // garuder warp 1
                    LAYERS.eupper.fillStyle = '#47D89F';
                    break;
                case 12.1:
                    // garuder warp 2
                    LAYERS.eupper.fillStyle = '#3C70FF';
                    break;
                case 12.2:
                    // garuder warp 2
                    LAYERS.eupper.fillStyle = '#FF0099';
                    break;
                case 12.3:
                    // garuder warp 2
                    LAYERS.eupper.fillStyle = '#47D89F';
                    break;
                default:
                    return;
            }
            for (let j in arr) {
                var localparticle = arr[j];
                localparticle.map == player.map && localparticle.drawFast();
                localparticle.map != player.map && localparticle.update();
            }
        } else {
            switch (i) {
                case 1:
                    LAYERS.eupper.textAlign = 'center';
                    LAYERS.eupper.font = '24px Pixel';
                    break;
                case 2:
                    LAYERS.eupper.textAlign = 'center';
                    LAYERS.eupper.font = 'bold 36px Pixel';
                    break;
                case 3:
                    LAYERS.eupper.textAlign = 'center';
                    LAYERS.eupper.font = '24px Pixel';
                    break;
                case 4:
                    break;
                case 5.1:
                    break;
                case 5.2:
                    break;
                case 5.3:
                    break;
                case 5.4:
                    break;
                case 6:
                    break;
                case 7:
                    break;
                case 8:
                    break;
                case 8:
                    break;
            }
            for (let j in arr) {
                var localparticle = arr[j];
                localparticle.map == player.map && localparticle.draw();
                localparticle.map != player.map && localparticle.update();
            }
        }
    });
};
Particle.list = new Map();

// dropped items
DroppedItem = function(id, map, x, y, itemId, stackSize) {
    const self = {
        id: null,
        map: map,
        x: x,
        y: y,
        layer: 0,
        itemId: 'missing',
        stackSize: stackSize,
        updated: false
    };
    self.id = id;
    if (itemId) self.itemId = itemId;
    self.animationImage = Inventory.itemImages[itemId];

    self.draw = function draw() {
        LAYERS.elayers[self.layer].drawImage(self.animationImage, self.x-24+OFFSETX, self.y-24+OFFSETY, 48, 48);
        if (self.stackSize != 1) {
            LAYERS.elayers[self.layer].textAlign = 'right';
            LAYERS.elayers[self.layer].font = '14px Pixel';
            LAYERS.elayers[self.layer].fillStyle = '#FFFF00';
            LAYERS.elayers[self.layer].fillText(self.stackSize, self.x+24+OFFSETX-4, self.y+24+OFFSETY-4);
        }
    };

    DroppedItem.list[self.id] = self;
    return self;
};
DroppedItem.update = function update(data) {
    for (let i in DroppedItem.list) {
        DroppedItem.list[i].updated = false;
    }
    for (let i in data) {
        if (data[i]) {
            if (DroppedItem.list[data[i].id]) {
                DroppedItem.list[data[i].id].updated = true;
            } else {
                try {
                    new DroppedItem(data[i].id, data[i].map, data[i].x, data[i].y, data[i].itemId, data[i].stackSize);
                    DroppedItem.list[data[i].id].updated = true;
                } catch (err) {
                    console.error(err);
                }
            }
        }
    }
    for (let i in DroppedItem.list) {
        if (DroppedItem.list[i].updated == false) {
            delete DroppedItem.list[i];
        }
    }
};
DroppedItem.updateHighlight = function updateHighlight() {
    for (let i in DroppedItem.list) {
        DroppedItem.list[i].animationImage = Inventory.itemImages[DroppedItem.list[i].itemId];
    }
    let x = mouseX-OFFSETX;
    let y = mouseY-OFFSETY;
    if (settings.useController) {
        x = axes.aimx-OFFSETX;
        y = axes.aimy-OFFSETY;
    }
    for (let i in DroppedItem.list) {
        let localdroppeditem = DroppedItem.list[i];
        if (Math.sqrt(Math.pow(player.x2-localdroppeditem.x, 2) + Math.pow(player.y2-localdroppeditem.y, 2)) < 512) {
            let left = localdroppeditem.x-player.x2-24;
            let right = localdroppeditem.x-player.x2+24;
            let top = localdroppeditem.y-player.y2-24;
            let bottom = localdroppeditem.y-player.y2+24;
            if (x >= left && x <= right && y >= top && y <= bottom) {
                localdroppeditem.animationImage = Inventory.itemHighlightImages[localdroppeditem.itemId];
                break;
            }
        }
    }
};
DroppedItem.list = [];

// lights
Light = function(x, y, map, radius, r, g, b, a, parent, above) {
    const self = {
        id: Math.random(),
        x: x,
        y: y,
        map: map,
        radius: radius,
        radius2: radius,
        r: r,
        g: g,
        b: b,
        a: a,
        a2: a,
        hasColor: true,
        parent: parent,
        above: above
    };
    self.hasColor = self.r != 0 || self.g != 0 || self.b != 0;
    
    self.update = function update() {
        if (self.parent) {
            self.x = self.parent.x;
            self.y = self.parent.y;
            self.map = self.parent.map;
        }
        if (settings.flickeringLights && self.map == player.map) {
            self.radius = Math.round(Math.max(1, self.radius2-40, Math.min(self.radius+Math.random()*4-2, self.radius2+40)));
            self.a = Math.max(0, self.a2-0.1, Math.min(self.a+Math.random()*0.04-0.02, self.a2+0.1, 1));
        }
    };
    self.drawAlpha = function drawAlpha() {
        let gradient = LAYERS.lights.createRadialGradient(self.x+OFFSETX, self.y+OFFSETY, 0, self.x+OFFSETX, self.y+OFFSETY, self.radius);
        gradient.addColorStop(0, 'rgba(0, 0, 0, ' + self.a + ')');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        LAYERS.lights.fillStyle = gradient;
        LAYERS.lights.fillRect(self.x-self.radius+OFFSETX, self.y-self.radius+OFFSETY, self.radius*2, self.radius*2);
    };
    self.drawColor = function drawColor() {
        if (self.hasColor) {
            let gradient = LAYERS.lights.createRadialGradient(self.x+OFFSETX, self.y+OFFSETY, self.radius/5, self.x+OFFSETX, self.y+OFFSETY, self.radius);
            gradient.addColorStop(0, 'rgba(' + self.r + ', ' + self.g + ', ' + self.b + ', ' + self.a + ')');
            gradient.addColorStop(1, 'rgba(' + self.r + ', ' + self.g + ', ' + self.b + ', 0)');
            LAYERS.lights.fillStyle = gradient;
            LAYERS.lights.fillRect(self.x-self.radius+OFFSETX, self.y-self.radius+OFFSETY, self.radius*2, self.radius*2);
        }
    };
    self.remove = function remove() {
        delete Light.list[self.id];
    };

    Light.list[self.id] = self;
    return self;
};
Light.draw = function draw() {
    if (settings.debug) lightStart = performance.now();
    for (let i in Light.list) {
        Light.list[i].update();
    }
    let translatex = (window.innerWidth/2)-player.x2;
    let translatey = (window.innerHeight/2)-player.y2;
    LAYERS.lights.clearRect(0, 0, window.innerWidth, window.innerHeight);
    if (settings.lights) {
        LAYERS.lights.save();
        LAYERS.lights.translate(translatex, translatey);
        if (MAPS[player.map].isDark) {
            LAYERS.lights.globalCompositeOperation = 'darken';
            for (let i in Light.list) {
                Light.list[i].map == player.map && Light.list[i].drawAlpha();
            }
            LAYERS.lights.restore();
            LAYERS.lights.globalCompositeOperation = 'xor';
            LAYERS.lights.fillStyle = 'rgba(0, 0, 0, ' + MAPS[player.map].darknessOpacity + ')';
            LAYERS.lights.fillRect(0, 0, window.innerWidth, window.innerHeight);
            LAYERS.lights.save();
            LAYERS.lights.translate(translatex, translatey);
        }
        if (settings.coloredLights) {
            LAYERS.lights.globalCompositeOperation = 'source-over';
            for (let i in Light.list) {
                Light.list[i].map == player.map && Light.list[i].drawColor();
            }
        }
        LAYERS.lights.restore();
    }
    if (settings.debug) {
        let current = performance.now();
        lightTimeCounter = Math.round((current-lightStart)*100)/100;
    }
};
Light.list = [];

// load data
async function getEntityData() {
    await new Promise(async function(resolve, reject) {
        // health bars
        totalassets += 2;
        // players
        for (let i in Player.animations) {
            if (i == 'hair') {
                for (let j in Player.animations[i]) {
                    totalassets++;
                }
            } else {
                totalassets++;
            }
        }
        // monsters
        totalassets++;
        await new Promise(async function(resolve, reject) {
            var request = new XMLHttpRequest();
            request.open('GET', '/monster.json', true);
            request.onload = async function() {
                if (this.status >= 200 && this.status < 400) {
                    var json = JSON.parse(this.response);
                    Monster.types = json;
                    loadedassets++;
                    for (let i in Monster.types) {
                        totalassets++;
                        Monster.images[i] = new Image();
                    }
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
        // // projectiles
        totalassets++;
        await new Promise(async function(resolve, reject) {
            var request = new XMLHttpRequest();
            request.open('GET', '/projectile.json', true);
            request.onload = async function() {
                if (this.status >= 200 && this.status < 400) {
                    var json = JSON.parse(this.response);
                    Projectile.types = json;
                    loadedassets++;
                    for (let i in Projectile.types) {
                        totalassets++;
                        Projectile.images[i] = new Image();
                    }
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
        resolve();
    });
};
async function loadEntityData() {
    // health bars
    Rig.healthBarG.onload = function() {loadedassets++;};
    Rig.healthBarR.onload = function() {loadedassets++;};
    Rig.healthBarG.src = '/img/player/healthbar_green.png';
    Rig.healthBarR.src = '/img/monster/healthbar_red.png';
    // players
    for (let i in Player.animations) {
        if (i == 'hair') {
            for (let j in Player.animations[i]) {
                await new Promise(function(resolve, reject) {
                    Player.animations[i][j].onload = function() {
                        loadedassets++;
                        resolve();
                    };
                    Player.animations[i][j].src = '/img/player/playermap_' + i + j + '.png';
                });
            }
        } else {
            await new Promise(function(resolve, reject) {
                Player.animations[i].onload = function() {
                    loadedassets++;
                    resolve();
                };
                Player.animations[i].src = '/img/player/playermap_' + i + '.png';
            });
        }
    }
    // monsters
    for (let i in Monster.types) {
        await new Promise(function(resolve, reject) {
            Monster.images[i].onload = function() {
                loadedassets++;
                resolve();
            };
            Monster.images[i].src = '/img/monster/' + i + '.png';
        });
    }
    // projectiles
    for (let i in Projectile.types) {
        await new Promise(function(resolve, reject) {
            Projectile.images[i].onload = function() {
                loadedassets++;
                resolve();
            };
            Projectile.images[i].src = '/img/projectile/' + i + '.png';
        });
    }
};

// animated tiles
AnimatedTile = function(map, x, y, id, above) {
    const self = {
        id: id,
        index: 0,
        map: map,
        x: x*64,
        y: y*64,
        above: above,
        chunkx: 0,
        chunky: 0,
        animationImage: null
    };

    return self;
};
AnimatedTile.animations = [];

// load data
async function getAnimatedTileData() {
    // totalassets++;
    // var request = new XMLHttpRequest(); 
    // request.open('GET', '/maps/tiles.tsx', false);
    // request.onload = async function() {
    //     if (this.status >= 200 && this.status < 400) {
    //         var parser = new DOMParser();
    //         var raw = parser.parseFromString(this.response, 'text/xml');
    //         for (let i in raw) {
    //             if (raw[i])
    //             for (let j in raw) {
    //                 if (raw[i][j])console.log(raw[i][j])
    //             }
    //         }
    //         loadedassets++;
    //     } else {
    //         console.error('Error: Server returned status ' + this.status);
    //         await sleep(1000);
    //         request.send();
    //     }
    // };
    // request.onerror = function() {
    //     console.error('There was a connection error. Please retry');
    // };
    // request.send();
};
async function loadAnimatedTileData() {
    // // monsters
    // for (let i in Monster.types) {
    //     await new Promise(function(resolve, reject) {
    //         Monster.images[i].onload = function() {
    //             loadedassets++;
    //             resolve();
    //         };
    //         Monster.images[i].src = '/img/monster/' + i + '.png';
    //     });
    // }
};