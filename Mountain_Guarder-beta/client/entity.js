// Copyright (C) 2022 Radioactive64

// entities
Entity = function(id, map, x, y) {
    var self = {
        id: id,
        map: map,
        x: x,
        y: y,
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
        LAYERS.elayers[self.layer].fillText('MISSING TEXTURE', self.x+OFFSETX, self.y+OFFSETY);
        if (self.interpolationStage < (settings.fps/20)) {
            self.x += self.xspeed;
            self.y += self.yspeed;
            self.chunkx = Math.floor(self.x/(64*MAPS[self.map].chunkwidth));
            self.chunky = Math.floor(self.y/(64*MAPS[self.map].chunkheight));
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
    if (!settings.particles) {
        Particle.list = [];
    }
    Light.draw();
    var entities = [];
    for (var i in Player.list) {
        entities.push(Player.list[i]);
    }
    for (var i in Monster.list) {
        entities.push(Monster.list[i]);
    }
    for (var i in Projectile.list) {
        entities.push(Projectile.list[i]);
    }
    for (var i in DroppedItem.list) {
        entities.push(DroppedItem.list[i]);
    }
    entities = entities.filter(function(entity) {
        return entity.map == player.map;
    });
    var translatex = (window.innerWidth/2)-player.x;
    var translatey = (window.innerHeight/2)-player.y;
    for (var i in LAYERS.elayers) {
        LAYERS.elayers[i].clearRect(0, 0, window.innerWidth, window.innerHeight);
        LAYERS.elayers[i].save();
        LAYERS.elayers[i].translate(translatex, translatey);
    }
    LAYERS.eupper.clearRect(0, 0, window.innerWidth, window.innerHeight);
    LAYERS.eupper.save();
    LAYERS.eupper.translate(translatex, translatey);
    entities = entities.sort(function(a, b) {return a.y-b.y;});
    for (var i in entities) {
        entities[i].draw();
    }
    for (var i in Particle.list) {
        Particle.list[i] && Particle.list[i].map == player.map && Particle.list[i].draw();
        Particle.list[i] && Particle.list[i].map != player.map && Particle.list[i].draw(true);
    }
    for (var i in LAYERS.elayers) {
        LAYERS.elayers[i].restore();
    }
    LAYERS.eupper.restore();
    if (settings.debug) {
        var current = performance.now();
        entTimeCounter = Math.round((current-entStart)*100)/100;
    }
};

// rigs
Rig = function(id, map, x, y) {
    var self = new Entity(id, map, x, y);
    self.characterStyle = {
        hair: 1,
        hairColor: '#000000',
        bodyColor: '#FFF0B4',
        shirtColor: '#FF3232',
        pantsColor: '#6464FF',
        texture: null
    };
    self.rawWidth = 0;
    self.rawHeight = 0;
    self.hp = 0;
    self.maxHP = 0;
    self.xp = 0;
    self.manaFull = false;
    
    self.update = function(data) {
        if (self.map != data.map) {
            self.x = data.x;
            self.y = data.y;
        }
        self.map = data.map;
        self.layer = data.layer;
        self.xspeed = (data.x-self.x)/tpsFpsRatio;
        self.yspeed = (data.y-self.y)/tpsFpsRatio;
        self.interpolationStage = 0;
        self.animationStage = data.animationStage;
        if (data.characterStyle.hair != self.characterStyle.hair || data.characterStyle.hairColor != self.characterStyle.hairColor || data.characterStyle.bodyColor != self.characterStyle.bodyColor || data.characterStyle.shirtColor != self.characterStyle.shirtColor || data.characterStyle.pantsColor != self.characterStyle.pantsColor || data.characterStyle.texture != self.characterStyle.texture) {
            self.characterStyle = data.characterStyle;
            if (self.characterStyle.texture) {
                self.animationImage2 = self.animationImage;
                self.animationImage = new Image();
                self.animationImage.src = '/client/img' + self.characterStyle.texture;
            } else {
                if (self.animationImage2) self.animationImage = self.animationImage2;
                self.animationImage2 = null;
            }
        }
        self.hp = data.hp;
        self.maxHP = data.maxHP;
        self.updated = true;
    };
    self.draw = function() {
        LAYERS.elayers[self.layer].drawImage(self.animationImage, self.x-self.animationImage.width*2+OFFSETX, self.y-self.animationImage.height*2+OFFSETY, self.animationImage.width*4, self.animationImage.height*4);
        LAYERS.eupper.drawImage(Rig.healthBarR, 0, 0, 42, 5, self.x-63+OFFSETX, self.y-52+OFFSETY, 126, 15);
        LAYERS.eupper.drawImage(Rig.healthBarR, 1, 5, (self.hp/self.maxHP)*40, 5, self.x-60+OFFSETX, self.y-52+OFFSETY, (self.hp/self.maxHP)*120, 15);
        if (self.interpolationStage < (settings.fps/20)) {
            self.x += self.xspeed;
            self.y += self.yspeed;
            self.chunkx = Math.floor(self.x/(64*MAPS[self.map].chunkwidth));
            self.chunky = Math.floor(self.y/(64*MAPS[self.map].chunkheight));
            self.interpolationStage++;
        }
    };

    return self;
};
Rig.healthBarG = new Image();
Rig.healthBarR = new Image();

// players
Player = function(id, map, x, y, name, isNPC, npcId) {
    var self = new Rig(id, map, x, y);
    self.layer = 0;
    self.heldItem = {
        id: null,
        angle: 0,
        image: new Image()
    };
    self.isNPC = false;
    if (isNPC) self.isNPC = true;
    if (npcId) self.npcId = npcId;
    self.name = name;
    self.nameColor = '#FF9900';
    if (self.name == 'Sampleprovider(sp)') self.nameColor = '#3C70FF';
    self.light = new Light(self.x, self.y, self.map, 320, 0, 0, 0, 1, self, false);

    self.update = function update(data) {
        if (self.map != data.map) {
            self.x = data.x;
            self.y = data.y;
        }
        self.map = data.map;
        self.xspeed = (data.x-self.x)/tpsFpsRatio;
        self.yspeed = (data.y-self.y)/tpsFpsRatio;
        self.layer = data.layer;
        self.interpolationStage = 0;
        self.animationStage = data.animationStage;
        if (data.characterStyle.hair != self.characterStyle.hair || data.characterStyle.hairColor != self.characterStyle.hairColor || data.characterStyle.bodyColor != self.characterStyle.bodyColor || data.characterStyle.shirtColor != self.characterStyle.shirtColor || data.characterStyle.pantsColor != self.characterStyle.pantsColor || data.characterStyle.texture != self.characterStyle.texture) {
            self.characterStyle = data.characterStyle;
            if (self.characterStyle.texture) {
                self.animationImage.src = '/client/img' + self.characterStyle.texture;
            } else {
                self.updateAnimationImage();
            }
            
        }
        self.hp = data.hp;
        self.maxHP = data.maxHP;
        self.heldItem = data.heldItem;
        if (self.heldItem) self.heldItem.image = Inventory.itemImages[self.heldItem.id];
        self.updated = true;
    };
    self.draw = function draw() {
        if (!self.isNPC && self.heldItem && self.heldItem.image) {
            LAYERS.elayers[self.layer].save();
            LAYERS.elayers[self.layer].translate(self.x+OFFSETX, self.y+OFFSETY);
            LAYERS.elayers[self.layer].rotate(self.heldItem.angle);
            LAYERS.elayers[self.layer].translate(Inventory.itemTypes[self.heldItem.id].heldDistance, 0);
            LAYERS.elayers[self.layer].rotate(Inventory.itemTypes[self.heldItem.id].heldAngle*(Math.PI/180));
            LAYERS.elayers[self.layer].drawImage(self.heldItem.image, -32, -32, 64, 64);
            LAYERS.elayers[self.layer].restore();
        }
        if (self.characterStyle.texture) LAYERS.elayers[self.layer].drawImage(self.animationImage, self.x-self.animationImage.width*2+OFFSETX, self.y-self.animationImage.height*2+OFFSETY, self.animationImage.width*4, self.animationImage.height*4);
        else LAYERS.elayers[self.layer].drawImage(self.animationImage, (self.animationStage % 6)*8, (~~(self.animationStage / 6))*16, 8, 16, self.x-16+OFFSETX, self.y-52+OFFSETY, 32, 64);
        if (!self.isNPC) {
            LAYERS.eupper.drawImage(Rig.healthBarG, 0, 0, 42, 5, self.x-63+OFFSETX, self.y-72+OFFSETY, 126, 15);
            LAYERS.eupper.drawImage(Rig.healthBarG, 1, 5, (self.hp/self.maxHP)*40, 5, self.x-60+OFFSETX, self.y-72+OFFSETY, (self.hp/self.maxHP)*120, 15);
        }
        LAYERS.eupper.textAlign = 'center';
        LAYERS.eupper.font = '12px Pixel';
        LAYERS.eupper.fillStyle = self.nameColor;
        self.isNPC && LAYERS.eupper.fillText(self.name, self.x+OFFSETX, self.y-58+OFFSETY);
        !self.isNPC && LAYERS.eupper.fillText(self.name, self.x+OFFSETX, self.y-80+OFFSETY);
        if (self.interpolationStage < (settings.fps/20)) {
            self.x += self.xspeed;
            self.y += self.yspeed;
            self.chunkx = Math.floor(self.x/(64*MAPS[self.map].chunkwidth));
            self.chunky = Math.floor(self.y/(64*MAPS[self.map].chunkheight));
            self.interpolationStage++;
        }
    };
    self.updateAnimationImage = async function updateAnimationImage() {
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
    for (var i in Player.list) {
        Player.list[i].updated = false;
    }
    for (var i in data) {
        if (Player.list[data[i].id]) {
            Player.list[data[i].id].update(data[i]);
        } else {
            try {
                new Player(data[i].id, data[i].map, data[i].x, data[i].y, data[i].name, data[i].isNPC, data[i].npcId);
                Player.list[data[i].id].updateAnimationImage();
                Player.list[data[i].id].update(data[i]);
            } catch (err) {
                console.error(err);
            }
        }
    }
    for (var i in Player.list) {
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

// monsters
Monster = function(id, map, x, y, type) {
    var self = new Rig(id, map, x, y);
    var tempmonster = Monster.types[type];
    self.type = type;
    self.width = tempmonster.width;
    self.height = tempmonster.height;
    self.rawWidth = tempmonster.rawWidth;
    self.rawHeight = tempmonster.rawHeight;
    self.animationImage = Monster.images[type];

    self.draw = function draw() {
        if (self.characterStyle.texture) LAYERS.elayers[self.layer].drawImage(self.animationImage, self.x-self.animationImage.width*2+OFFSETX, self.y-self.animationImage.height*2+OFFSETY, self.animationImage.width*4, self.animationImage.height*4);
        else LAYERS.elayers[self.layer].drawImage(self.animationImage, self.animationStage*self.rawWidth, 0, self.rawWidth, self.rawHeight, self.x-self.width/2+OFFSETX, self.y-self.height/2+OFFSETY, self.width, self.height);
        LAYERS.eupper.drawImage(Rig.healthBarR, 0, 0, 42, 5, self.x-63+OFFSETX, self.y-self.height/2-20+OFFSETY, 126, 15);
        LAYERS.eupper.drawImage(Rig.healthBarR, 1, 5, (self.hp/self.maxHP)*40, 5, self.x-60+OFFSETX, self.y-self.height/2-20+OFFSETY, (self.hp/self.maxHP)*120, 15);
        if (self.interpolationStage < (settings.fps/20)) {
            self.x += self.xspeed;
            self.y += self.yspeed;
            self.chunkx = Math.floor(self.x/(64*MAPS[self.map].chunkwidth));
            self.chunky = Math.floor(self.y/(64*MAPS[self.map].chunkheight));
            self.interpolationStage++;
        }
    };
    self.remove = function remove() {
        delete Monster.list[self.id];
    };

    Monster.list[self.id] = self;
    return self;
};
Monster.update = function update(data) {
    for (var i in Monster.list) {
        Monster.list[i].updated = false;
    }
    for (var i in data) {
        if (data[i]) {
            if (Monster.list[data[i].id]) {
                Monster.list[data[i].id].update(data[i]);
            } else {
                try {
                    new Monster(data[i].id, data[i].map, data[i].x, data[i].y, data[i].type);
                    Monster.list[data[i].id].update(data[i]);
                } catch (err) {
                    console.error(err);
                }
            }
        }
    }
    for (var i in Monster.list) {
        !Monster.list[i].updated && Monster.list[i].remove();
    }
};
Monster.list = [];
Monster.types = [];
Monster.images = [];

// projectiles
Projectile = function(id, map, x, y, angle, type) {
    var self = new Entity(id, map, x, y);
    self.angle = angle;
    self.rotationspeed = 0;
    var tempprojectile = Projectile.types[type];
    self.type = type;
    self.width = tempprojectile.width;
    self.height = tempprojectile.height;
    self.rawWidth = tempprojectile.rawWidth;
    self.rawHeight = tempprojectile.rawHeight;
    self.above = tempprojectile.above;
    self.animationImage = Projectile.images[type];
    self.animationStage = 0;
    if (tempprojectile.glow) self.light = new Light(self.x, self.y, self.map, tempprojectile.glow.radius, tempprojectile.glow.color.r, tempprojectile.glow.color.g, tempprojectile.glow.color.b, tempprojectile.glow.intensity, self, self.above);

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
        self.rotationspeed = (data.angle-self.angle)/tpsFpsRatio;
        self.updated = true;
    };
    self.draw = function draw() {
        if (self.above) {
            LAYERS.eupper.save();
            LAYERS.eupper.translate(self.x+OFFSETX, self.y+OFFSETY);
            LAYERS.eupper.rotate(self.angle);
            LAYERS.eupper.drawImage(self.animationImage, self.animationStage*self.rawWidth, 0, self.rawWidth, self.rawHeight, -self.width/2, -self.height/2, self.width, self.height);
            LAYERS.eupper.restore();
        } else {
            LAYERS.elayers[self.layer].save();
            LAYERS.elayers[self.layer].translate(self.x+OFFSETX, self.y+OFFSETY);
            LAYERS.elayers[self.layer].rotate(self.angle);
            LAYERS.elayers[self.layer].drawImage(self.animationImage, self.animationStage*self.rawWidth, 0, self.rawWidth, self.rawHeight, -self.width/2, -self.height/2, self.width, self.height);
            LAYERS.elayers[self.layer].restore();
        }
        if (self.interpolationStage < (settings.fps/20)) {
            self.x += self.xspeed;
            self.y += self.yspeed;
            self.chunkx = Math.floor(self.x/(64*MAPS[self.map].chunkwidth));
            self.chunky = Math.floor(self.y/(64*MAPS[self.map].chunkheight));
            self.angle += self.rotationspeed;
            self.interpolationStage++;
        }
    };
    self.remove = function remove() {
        self.light && self.light.remove();
        delete Projectile.list[self.id];
    };

    Projectile.list[self.id] = self;
    return self;
};
Projectile.update = function update(data) {
    for (var i in Projectile.list) {
        Projectile.list[i].updated = false;
    }
    for (var i in data) {
        if (data[i]) {
            if (Projectile.list[data[i].id]) {
                Projectile.list[data[i].id].update(data[i]);
            } else {
                try {
                    new Projectile(data[i].id, data[i].map, data[i].x, data[i].y, data[i].angle, data[i].type);
                    Projectile.list[data[i].id].update(data[i]);
                } catch (err) {
                    console.error(err);
                }
            }
        }
    }
    for (var i in Projectile.list) {
        !Projectile.list[i].updated && Projectile.list[i].remove();
    }
};
Projectile.list = [];
Projectile.types = [];
Projectile.images = [];

// particles
Particle = function(map, x, y, type, value) {
    var self = {
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
            self.xspeed = Math.random()*4-2;
            self.yspeed = -10;
            self.identifier = 1;
            break;
        case 'critdamage':
            self.xspeed = Math.random()*4-2;
            self.yspeed = -6;
            self.identifier = 2;
            break;
        case 'heal':
            self.xspeed = Math.random()*4-2;
            self.yspeed = -10;
            self.identifier = 3;
            break;
        case 'teleport':
            var angle = Math.random()*360*(Math.PI/180);
            self.xspeed = Math.sin(angle)*Math.random()*2;
            self.yspeed = Math.cos(angle)*Math.random()*2;
            self.opacity = Math.round(Math.random()*50)+100;
            self.size = Math.random()*10+10;
            self.identifier = 4;
            break;
        case 'explosion':
            var random = Math.random();
            if (random <= 0.2) {
                self.color = 'rgba(255, 255, 255, ';
            } else if (random <= 0.4) {
                self.color = 'rgba(150, 150, 150, ';
            } else {
                self.color = 'rgba(50, 50, 50, ';
            }
            var angle = Math.random()*360*(Math.PI/180);
            var speed = Math.random()*10;
            self.xspeed = Math.sin(angle)*speed;
            self.yspeed = Math.cos(angle)*speed;
            self.opacity = Math.round(Math.random()*100)+100;
            self.size = Math.random()*10+20;
            self.identifier = 5;
            break;
        case 'spawn':
            self.angle = Math.random()*360*(Math.PI/180);
            self.radius = Math.random()*80;
            self.rotationspeed = Math.random()*0.1;
            self.x = x+Math.cos(self.angle)*self.radius;
            self.y = y+Math.sin(self.angle)*self.radius;
            self.opacity = Math.round(Math.random()*50)+100;
            self.size = Math.random()*10+10;
            self.identifier = 6;
            break;
        case 'death':
            self.yspeed = -5;
            self.opacity = Math.round(Math.random()*50)+100;
            self.size = Math.random()*5+15;
            self.identifier = 7;
            break;
        case 'playerdeath':
            var angle = Math.random()*360*(Math.PI/180);
            self.xspeed = Math.sin(angle)*Math.random()*3;
            self.yspeed = Math.cos(angle)*Math.random()*3-5;
            self.opacity = Math.round(Math.random()*50)+100;
            self.size = Math.random()*5+15;
            self.identifier = 8;
            break;
        default:
            console.error('invalid particle type ' + self.type);
            return;
    }

    self.draw = function draw(nodraw) {
        self.x += self.xspeed;
        self.y += self.yspeed;
        self.chunkx = Math.floor(self.x/(64*MAPS[self.map].chunkwidth));
        self.chunky = Math.floor(self.y/(64*MAPS[self.map].chunkheight));
        if (self.opacity <= 0) {
            delete Particle.list[self.id];
            return;
        }
        switch (self.type) {
            case 'damage':
                if (!nodraw) {
                    // #FF0000
                    LAYERS.eupper.fillStyle = 'rgba(255, 0, 0, ' + Math.max(settings.optimizedParticles, Math.min(self.opacity, 100)/100) + ')';
                    LAYERS.eupper.textAlign = 'center';
                    LAYERS.eupper.font = '24px Pixel';
                    LAYERS.eupper.fillText(self.value, self.x+OFFSETX, self.y+OFFSETY);
                }
                self.xspeed *= 0.98;
                self.yspeed += 0.5;
                self.opacity -= 2;
                break;
            case 'critdamage':
                if (!nodraw) {
                    // #FF0000
                    LAYERS.eupper.fillStyle = 'rgba(255, 0, 0, ' + Math.max(settings.optimizedParticles, Math.min(self.opacity, 100)/100) + ')';
                    LAYERS.eupper.textAlign = 'center';
                    LAYERS.eupper.font = 'bold 36px Pixel';
                    LAYERS.eupper.fillText(self.value, self.x+OFFSETX, self.y+OFFSETY);
                }
                self.xspeed *= 0.98;
                self.yspeed += 0.3;
                self.opacity -= 2;
                break;
            case 'heal':
                if (!nodraw) {
                    // #00FF00
                    LAYERS.eupper.fillStyle = 'rgba(0, 255, 0, ' + Math.max(settings.optimizedParticles, Math.min(self.opacity, 100)/100) + ')';
                    LAYERS.eupper.textAlign = 'center';
                    LAYERS.eupper.font = '24px Pixel';
                    LAYERS.eupper.fillText(self.value, self.x+OFFSETX, self.y+OFFSETY);
                }
                self.xspeed *= 0.98;
                self.yspeed += 0.5;
                self.opacity -= 2;
                break;
            case 'teleport':
                if (!nodraw) {
                    // #9900CC
                    LAYERS.eupper.fillStyle = 'rgba(153, 0, 204, ' + Math.max(settings.optimizedParticles, Math.min(self.opacity, 50)/100) + ')';
                    LAYERS.eupper.fillRect(self.x-self.size/2+OFFSETX, self.y-self.size/2+OFFSETY, self.size, self.size);
                }
                self.xspeed *= 0.95;
                self.yspeed *= 0.95;
                self.opacity -= 1;
                break;
            case 'explosion':
                if (!nodraw) {
                    LAYERS.eupper.fillStyle = self.color + Math.max(settings.optimizedParticles, Math.min(self.opacity, 50)/100) + ')';
                    LAYERS.eupper.fillRect(self.x-self.size/2+OFFSETX, self.y-self.size/2+OFFSETY, self.size, self.size);
                }
                self.xspeed *= 0.9;
                self.yspeed *= 0.9;
                self.opacity -= 1;
                break;
            case 'spawn':
                if (!nodraw) {
                    // #0000FF
                    LAYERS.eupper.fillStyle = 'rgba(0, 0, 255, ' + Math.max(settings.optimizedParticles, Math.min(self.opacity, 50)/100) + ')';
                    LAYERS.eupper.fillRect(self.x-self.size/2+OFFSETX, self.y-self.size/2+OFFSETY, self.size, self.size);
                }
                self.angle += self.rotationspeed;
                self.x = x+Math.cos(self.angle)*self.radius;
                self.y = y+Math.sin(self.angle)*self.radius;
                self.rotationspeed += 0.005;
                self.radius -= self.radius/40;
                self.size += 0.1
                self.opacity -= 1;
                break;
            case 'death':
                if (!nodraw) {
                    LAYERS.eupper.fillStyle = 'rgba(255, 0, 0, ' + Math.max(settings.optimizedParticles, Math.min(self.opacity, 50)/100) + ')';
                    LAYERS.eupper.fillRect(self.x-self.size/2+OFFSETX, self.y-self.size/2+OFFSETY, self.size, self.size);
                }
                self.yspeed *= 0.95;
                self.opacity -= 2;
                break;
            case 'playerdeath':
                if (!nodraw) {
                    LAYERS.eupper.fillStyle = 'rgba(255, 0, 0, ' + Math.max(settings.optimizedParticles, Math.min(self.opacity, 50)/100) + ')';
                    LAYERS.eupper.fillRect(self.x-self.size/2+OFFSETX, self.y-self.size/2+OFFSETY, self.size, self.size);
                }
                self.xspeed *= 0.98;
                self.yspeed += 0.2;
                self.opacity -= 2;
                break;
            default:
                delete Particle.list[self.id];
                break;
        }
    };

    Particle.list[self.id] = self;
    return self;
};
Particle.update = function update(data) {
    for (var i in data) {
        if (data[i]) new Particle(data[i].map, data[i].x, data[i].y, data[i].type, data[i].value);
    }
};
Particle.list = [];

// dropped items
DroppedItem = function(id, map, x, y, itemId, stackSize) {
    var self = {
        id: null,
        map: map,
        x: x,
        y: y,
        layer: 0,
        width: 48,
        height: 48,
        itemId: 'missing',
        stackSize: stackSize,
        updated: false
    };
    self.id = id;
    if (itemId) self.itemId = itemId;
    self.animationImage = Inventory.itemImages[itemId];

    self.draw = function draw() {
        LAYERS.elayers[self.layer].drawImage(self.animationImage, self.x-self.width/2+OFFSETX, self.y-self.height/2+OFFSETY, self.width, self.height);
        if (self.stackSize != 1) {
            LAYERS.elayers[self.layer].textAlign = 'right';
            LAYERS.elayers[self.layer].font = '14px Pixel';
            LAYERS.elayers[self.layer].fillStyle = '#FFFF00';
            LAYERS.elayers[self.layer].fillText(self.stackSize, self.x+self.width/2+OFFSETX-4, self.y+self.height/2+OFFSETY-4);
        }
    };

    DroppedItem.list[self.id] = self;
    return self;
};
DroppedItem.update = function update(data) {
    for (var i in DroppedItem.list) {
        DroppedItem.list[i].updated = false;
    }
    for (var i in data) {
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
    for (var i in DroppedItem.list) {
        if (DroppedItem.list[i].updated == false) {
            delete DroppedItem.list[i];
        }
    }
};
DroppedItem.updateHighlight = function updateHighlight() {
    for (var i in DroppedItem.list) {
        DroppedItem.list[i].animationImage = Inventory.itemImages[DroppedItem.list[i].itemId];
    }
    var x = mouseX-OFFSETX;
    var y = mouseY-OFFSETY;
    if (settings.useController) {
        x = axes.aimx-OFFSETX;
        y = axes.aimy-OFFSETY;
    }
    for (var i in DroppedItem.list) {
        var localdroppeditem = DroppedItem.list[i];
        if (Math.sqrt(Math.pow(player.x-localdroppeditem.x, 2) + Math.pow(player.y-localdroppeditem.y, 2)) < 512) {
            var left = localdroppeditem.x-player.x-localdroppeditem.width/2;
            var right = localdroppeditem.x-player.x+localdroppeditem.width/2;
            var top = localdroppeditem.y-player.y-localdroppeditem.height/2;
            var bottom = localdroppeditem.y-player.y+localdroppeditem.height/2;
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
    var self = {
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
        if (self.map == player.map) self.radius = Math.round(Math.max(self.radius2-20, Math.min(self.radius+Math.random()*2-1, self.radius2+20)));
    };
    self.drawAlpha = function drawAlpha() {
        var gradient = LAYERS.lights.createRadialGradient(self.x+OFFSETX, self.y+OFFSETY, 0, self.x+OFFSETX, self.y+OFFSETY, self.radius);
        gradient.addColorStop(0, 'rgba(0, 0, 0, ' + self.a + ')');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        LAYERS.lights.fillStyle = gradient;
        LAYERS.lights.fillRect(self.x-self.radius+OFFSETX, self.y-self.radius+OFFSETY, self.radius*2, self.radius*2);
    };
    self.drawColor = function drawColor() {
        if (self.hasColor) {
            var gradient = LAYERS.lights.createRadialGradient(self.x+OFFSETX, self.y+OFFSETY, self.radius/5, self.x+OFFSETX, self.y+OFFSETY, self.radius);
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
    for (var i in Light.list) {
        Light.list[i].update();
    }
    var translatex = (window.innerWidth/2)-player.x;
    var translatey = (window.innerHeight/2)-player.y;
    LAYERS.lights.clearRect(0, 0, window.innerWidth, window.innerHeight);
    if (settings.lights) {
        LAYERS.lights.save();
        LAYERS.lights.translate(translatex, translatey);
        if (MAPS[player.map].lights) {
            LAYERS.lights.globalCompositeOperation = 'darken';
            for (var i in Light.list) {
                Light.list[i].map == player.map && Light.list[i].drawAlpha();
            }
            LAYERS.lights.restore();
            LAYERS.lights.globalCompositeOperation = 'xor';
            LAYERS.lights.fillStyle = 'rgba(0, 0, 0, 1)';
            LAYERS.lights.fillRect(0, 0, window.innerWidth, window.innerHeight);
            LAYERS.lights.save();
            LAYERS.lights.translate(translatex, translatey);
        }
        if (settings.coloredLights) {
            LAYERS.lights.globalCompositeOperation = 'source-over';
            for (var i in Light.list) {
                Light.list[i].map == player.map && Light.list[i].drawColor();
            }
        }
        LAYERS.lights.restore();
    }
    if (settings.debug) {
        var current = performance.now();
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
        for (var i in Player.animations) {
            if (i == 'hair') {
                for (var j in Player.animations[i]) {
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
            request.open('GET', '/client/monster.json', true);
            request.onload = async function() {
                if (this.status >= 200 && this.status < 400) {
                    var json = JSON.parse(this.response);
                    Monster.types = json;
                    loadedassets++;
                    for (var i in Monster.types) {
                        totalassets++;
                        Monster.images[i] = new Image();
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
        // // projectiles
        totalassets++;
        await new Promise(async function(resolve, reject) {
            var request = new XMLHttpRequest();
            request.open('GET', '/client/projectile.json', true);
            request.onload = async function() {
                if (this.status >= 200 && this.status < 400) {
                    var json = JSON.parse(this.response);
                    Projectile.types = json;
                    loadedassets++;
                    for (var i in Projectile.types) {
                        totalassets++;
                        Projectile.images[i] = new Image();
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
        resolve();
    });
};
async function loadEntityData() {
    // health bars
    Rig.healthBarG.onload = function() {loadedassets++;};
    Rig.healthBarR.onload = function() {loadedassets++;};
    Rig.healthBarG.src = '/client/img/player/healthbar_green.png';
    Rig.healthBarR.src = '/client/img/monster/healthbar_red.png';
    // players
    for (var i in Player.animations) {
        if (i == 'hair') {
            for (var j in Player.animations[i]) {
                await new Promise(function(resolve, reject) {
                    Player.animations[i][j].onload = function() {
                        loadedassets++;
                        resolve();
                    };
                    Player.animations[i][j].src = '/client/img/player/playermap_' + i + j + '.png';
                });
            }
        } else {
            await new Promise(function(resolve, reject) {
                Player.animations[i].onload = function() {
                    loadedassets++;
                    resolve();
                };
                Player.animations[i].src = '/client/img/player/playermap_' + i + '.png';
            });
        }
    }
    // monsters
    for (var i in Monster.types) {
        await new Promise(function(resolve, reject) {
            Monster.images[i].onload = function() {
                loadedassets++;
                resolve();
            };
            Monster.images[i].src = '/client/img/monster/' + i + '.png';
        });
    }
    // projectiles
    for (var i in Projectile.types) {
        await new Promise(function(resolve, reject) {
            Projectile.images[i].onload = function() {
                loadedassets++;
                resolve();
            };
            Projectile.images[i].src = '/client/img/projectile/' + i + '.png';
        });
    }
};

// animated tiles
AnimatedTile = function(map, x, y, id, above) {
    var self = {
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
    // request.open('GET', '/client/maps/tiles.tsx', false);
    // request.onload = async function() {
    //     if (this.status >= 200 && this.status < 400) {
    //         var parser = new DOMParser();
    //         var raw = parser.parseFromString(this.response, 'text/xml');
    //         for (var i in raw) {
    //             if (raw[i])
    //             for (var j in raw) {
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
    // for (var i in Monster.types) {
    //     await new Promise(function(resolve, reject) {
    //         Monster.images[i].onload = function() {
    //             loadedassets++;
    //             resolve();
    //         };
    //         Monster.images[i].src = '/client/img/monster/' + i + '.png';
    //     });
    // }
};