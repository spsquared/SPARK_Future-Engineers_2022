// Copyright (C) 2022 Radioactive64

const PF = require('pathfinding');
const { subtle } = require('crypto').webcrypto;
const { cloneDeep } = require('lodash');
const { lock } = require('object-property-lock');
const { v1: uuidv1 } = require('uuid');
const keys = subtle.generateKey({
    name: "RSA-OAEP",
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: "SHA-256"
}, false, ['encrypt', 'decrypt']);

// entities
Entity = function() {
    const self = {
        entType: 'entity',
        id: null,
        x: 0,
        y: 0,
        map: 'World',
        layer: 0,
        xspeed: 0,
        yspeed: 0,
        lastx: 0,
        lasty: 0,
        gridx: 0,
        gridy: 0,
        chunkx: 0,
        chunky: 0,
        moveSpeed: 0,
        slowedDown: false,
        frozen: false,
        width: 0,
        height: 0,
        noCollision: false,
        physicsInaccuracy: 1,
        collisionBoxSize: 0,
        chunkLocation: {
            map: 'World',
            layer: 0,
            chunkx: 0,
            chunky: 0
        }
    };
    self.id = uuidv1();
    lock(self, ['id']);

    self.update = function update() {
        self.updatePos();
    };
    self.updatePos = function updatePos() {
        self.collide();
    };
    self.collide = function collide() {
        try {
            if (!self.frozen && (self.xspeed != 0 || self.yspeed != 0)) {
                var max = Math.max(Math.abs(self.xspeed), Math.abs(self.yspeed))/(self.physicsInaccuracy*ENV.physicsInaccuracy);
                for (let i = 0; i < max; i += max/Math.ceil(max)) {
                    self.lastx = self.x;
                    self.lasty = self.y;
                    self.x += self.xspeed/max || 0;
                    self.y += self.yspeed/max || 0;
                    self.gridx = Math.floor(self.x/64);
                    self.gridy = Math.floor(self.y/64);
                    if (!self.noCollision && self.doPointCollision()) break;
                    self.checkLayer();
                    self.checkSlowdown();
                }
                self.x = Math.round(self.x);
                self.y = Math.round(self.y);
                self.gridx = Math.floor(self.x/64);
                self.gridy = Math.floor(self.y/64);
                self.chunkx = Math.floor(self.gridx/Collision.grid[self.map].chunkWidth);
                self.chunky = Math.floor(self.gridy/Collision.grid[self.map].chunkHeight);
            }
        } catch (err) {
            error(err);
        }
    };
    self.checkCollisionLine = function checkCollisionLine(x1, y1, x2, y2) {
        if (Math.floor((x2-x1)/64)) {
            var slope = (y2-y1)/(x2-x1);
            for (let x = Math.floor(Math.min(x1, x2)/64); x <= Math.floor(Math.max(x1, x2)/64); x++) {
                var y = Math.floor((slope*(x*64)+y1)/64);
                if (Collision.getColEntity(self.map, x, y, self.layer)[0]) return true;
            }
        } else {
            var x = Math.floor(x1/64);
            for (let y = Math.floor(Math.min(y1, y2)/64); y <= Math.floor(Math.max(y1, y2)/64); y++) {
                if (Collision.getColEntity(self.map, x, y, self.layer)[0]) return true;
            }
        }
        return false;
    };
    self.checkSpannedCollision = function checkSpannedCollision() {
        var x = self.x;
        var y = self.y;
        var width = self.width;
        var height = self.height;
        self.width += Math.abs(self.x-self.lastx);
        self.height += Math.abs(self.y-self.lasty);
        self.x = (self.x+self.lastx)/2;
        self.y = (self.y+self.lasty)/2;
        self.gridx = Math.floor(self.x/64);
        self.gridy = Math.floor(self.y/64);
        self.collisionBoxSize = Math.max(self.width, self.height);
        var colliding = self.checkPointCollision();
        self.x = x;
        self.y = y;
        self.width = width;
        self.height = height;
        self.collisionBoxSize = Math.max(self.width, self.height);
        self.gridx = Math.floor(self.x/64);
        self.gridy = Math.floor(self.y/64);
        return colliding;
    };
    self.checkLargeSpannedCollision = function checkLargeSpannedCollision() {
        var colliding = false;
        if (self.checkPointCollision()) colliding = true;
        if (self.checkCollisionLine(self.lastx-self.width/2, self.lasty-self.height/2, self.x-self.width/2, self.y-self.height/2)) colliding = true;
        if (self.checkCollisionLine(self.lastx-self.width/2, self.lasty+self.height/2, self.x-self.width/2, self.y+self.height/2)) colliding = true;
        if (self.checkCollisionLine(self.lastx+self.width/2, self.lasty+self.height/2, self.x+self.width/2, self.y+self.height/2)) colliding = true;
        if (self.checkCollisionLine(self.lastx+self.width/2, self.lasty-self.height/2, self.x+self.width/2, self.y-self.height/2)) colliding = true;
        if (self.checkCollisionLine(self.lastx, self.lasty, self.x, self.y)) colliding = true;
        return colliding;
    };
    self.checkPointCollision = function checkPointCollision() {
        var collisions = [];
        let range = Math.ceil(self.collisionBoxSize/128);
        for (let x = self.gridx-range; x <= self.gridx+range; x++) {
            for (let y = self.gridy-range; y <= self.gridy+range; y++) {
                collisions.push(Collision.getColEntity(self.map, x, y, self.layer));
            }
        }
        for (let i in collisions) {
            for (let j in collisions[i]) {
                if (self.collideWith(collisions[i][j])) return true;
            }
        }
        return false;
    };
    self.doPointCollision = function doPointCollision() {
        var collisions = [];
        let range = Math.ceil(self.collisionBoxSize/128);
        for (let x = self.gridx-range; x <= self.gridx+range; x++) {
            for (let y = self.gridy-range; y <= self.gridy+range; y++) {
                collisions.push(Collision.getColEntity(self.map, x, y, self.layer));
            }
        }
        var colliding = false;
        for (let i in collisions) {
            for (let j in collisions[i]) {
                if (self.collideWith(collisions[i][j])) {
                    colliding = true;
                    break;
                }
            }
        }
        if (colliding) {
            colliding = false;
            var x = self.x;
            self.x = self.lastx;
            for (let i in collisions) {
                for (let j in collisions[i]) {
                    if (self.collideWith(collisions[i][j])) {
                        colliding = true;
                        break;
                    }
                }
            }
            if (colliding) {
                colliding = false;
                self.x = x;
                self.y = self.lasty;
                for (let i in collisions) {
                    for (let j in collisions[i]) {
                        if (self.collideWith(collisions[i][j])) {
                            colliding = true;
                            break;
                        }
                    }
                }
                if (colliding) {
                    colliding = false;
                    self.x = self.lastx;
                    self.y = self.lasty;
                    for (let i in collisions) {
                        for (let j in collisions[i]) {
                            if (self.collideWith(collisions[i][j])) {
                                colliding = true;
                                break;
                            }
                        }
                    }
                }
            }
        }
        return colliding;
    };
    self.checkLayer = function checkLayer() {
        var collisions = [];
        let range = Math.ceil(self.collisionBoxSize/128);
        for (let x = self.gridx-range; x <= self.gridx+range; x++) {
            for (let y = self.gridy-range; y <= self.gridy+range; y++) {
                collisions.push(Layer.getColEntity(self.map, x, y, self.layer));
            }
        }
        var dir = 0;
        for (let i in collisions) {
            for (let j in collisions[i]) {
                if (self.collideWith(collisions[i][j])) dir += collisions[i][j].dir;
            }
        }
        self.layer += Math.max(-1, Math.min(dir, 1));
    };
    self.checkSlowdown = function checkSlowdown() {
        var collisions = [];
            for (let y = self.gridy-1; y <= self.gridy+1; y++) {
                for (let x = self.gridx-1; x <= self.gridx+1; x++) {
                    collisions.push(Slowdown.getColEntity(self.map, x, y, self.layer));
                }
            }
        var colliding = false;
        for (let i in collisions) {
            for (let j in collisions[i]) {
                if (self.collideWith(collisions[i][j])) colliding = true;
            }
        }
        self.slowedDown = colliding;
    };
    self.collideWith = function collideWith(entity) {
        if (self.getSquareDistance(entity) <= self.collisionBoxSize/2 + entity.collisionBoxSize/2) {
            var bound1left = self.x-(self.width/2);
            var bound1right = self.x+(self.width/2);
            var bound1top = self.y-(self.height/2);
            var bound1bottom = self.y+(self.height/2);
            var bound2left = entity.x-(entity.width/2);
            var bound2right = entity.x+(entity.width/2);
            var bound2top = entity.y-(entity.height/2);
            var bound2bottom = entity.y+(entity.height/2);
            if (entity.map == self.map && bound1left < bound2right && bound1right > bound2left && bound1top < bound2bottom && bound1bottom > bound2top) {
                return true;
            }
        }
        return false;
    };
    self.getDistance = function getDistance(entity) {
        return Math.sqrt((self.x-entity.x)**2+(self.y-entity.y)**2);
    };
    self.getSquareDistance = function getSquareDistance(entity) {
        return Math.max(Math.abs(self.x-entity.x), Math.abs(self.y-entity.y));
    };
    self.getGridDistance = function getGridDistance(entity) {
        if (entity.gridx != null) {
            return Math.sqrt((self.gridx-entity.gridx)**2+(self.gridy-entity.gridy)**2);
        } else {
            return Math.sqrt((self.gridx-entity.x)**2+(self.gridy-entity.y)**2);
        }
    };
    self.getSquareGridDistance = function getSquareGridDistance(entity) {
        if (entity.gridx != null) {
            return Math.max(Math.abs(self.gridx-entity.gridx), Math.abs(self.gridy-entity.gridy));
        } else {
            return Math.max(Math.abs(self.gridx-entity.x), Math.abs(self.gridy-entity.y));
        }
    };
    self.getAngle = function getAngle(entity) {
        return Math.atan2(entity.y-self.y, entity.x-self.x);
    };
    self.rayCast = function rayCast(entity) {
        try {
            var ray = {
                x: self.x,
                y: self.y,
                angle: 0,
                xspeed: 0,
                yspeed: 0
            };
            ray.angle = self.getAngle(entity);
            ray.xspeed = Math.cos(ray.angle)*15;
            ray.yspeed = Math.sin(ray.angle)*15;
            let distance = Math.ceil(self.getDistance(entity)/15);
            for (let i = 0; i < distance; i++) {
                ray.x += ray.xspeed;
                ray.y += ray.yspeed;
                if (Collision.grid[self.map][self.layer][Math.floor(ray.y/64)] && Collision.grid[self.map][self.layer][Math.floor(ray.y/64)][Math.floor(ray.x/64)] != null && Collision.grid[self.map][self.layer][Math.floor(ray.y/64)][Math.floor(ray.x/64)] < 15 && Collision.grid[self.map][self.layer][Math.floor(ray.y/64)][Math.floor(ray.x/64)] != 0) {
                    return true;
                }
            }
        } catch (err) {
            error(err);
        }
        return false;
    };
    self.updateChunkLocation = function updateChunkLocation() {};
    self.searchChunks = function searchChunks(chunks, range, cb) {
        if (typeof chunks == 'object' && typeof range == 'number' && typeof cb == 'function') {
            for (let z in chunks) {
                if (chunks[z]) for (let y = self.chunky-range; y <= self.chunky+range; y++) {
                    if (chunks[z][y]) for (let x = self.chunkx-range; x <= self.chunkx+range; x++) {
                        if (chunks[z][y][x]) {
                            let entities = chunks[z][y][x];
                            for (let i in entities) {
                                if (cb(entities[i], i)) return;
                            }
                        }
                    }
                }
            }
        }
    };

    return self;
};
Entity.update = function update() {
    const pack = {
        players: Player.update().concat(Npc.update()),
        monsters: Monster.update(),
        projectiles: Projectile.update(),
        particles: Particle.update(),
        droppedItems: DroppedItem.update()
    };

    return pack;
};
Entity.getDebugData = function getDebugData() {
    const pack = {
        players: Player.getDebugData().concat(Npc.getDebugData()),
        monsters: Monster.getDebugData(),
        projectiles: Projectile.getDebugData(),
    };

    return pack;
};

// rigs
Rig = function() {
    const self = new Entity();
    self.entType = 'Rig';
    self.width = 32;
    self.height = 32;
    self.controls = {
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
    self.xmove = 0;
    self.ymove = 0;
    self.xknockback = 0;
    self.yknockback = 0;
    self.animationStage = 0;
    self.animationLength = 0;
    self.lastFrameUpdate = 0;
    self.animationSpeed = 150;
    self.animationDirection = 'facing';
    self.facingDirection = 'down';
    self.moveSpeed = 15;
    self.stats = {
        damageType: null,
        projectileSpeed: 1,
        attack: 1,
        defense: 0,
        damageReduction: 0,
        knockbackResistance: 0,
        heal: 0,
        speed: 1,
        range: 1,
        accuracy: 0,
        critChance: 0,
        critPower: 1,
        knockback: 0
    };
    self.shieldStats = {
        knockbackResistance: 0,
        blockAngle: 0,
        reflectProjectileChance: 0
    };
    self.shield = false;
    self.shieldAngle = 0;
    self.invincibilityFrames = {};
    self.hp = 100;
    self.maxHP = 100;
    self.lastHeal = 0;
    self.lastAutoHeal = 0;
    self.xp = 0;
    self.maxXP = 0;
    self.xpLevel = 0;
    self.mana = 200;
    self.maxMana = 200;
    self.lastManaUse = 0;
    self.lastManaRegen = 0;
    self.effectTimers = {};
    self.team = Math.random();
    self.alive = true;
    self.invincible = false;
    self.bcDeath = false;
    self.canMove = true;
    self.stunned = false;
    self.teleporting = false;
    self.name = 'empty Rig';
    self.lastAttack = 0;
    self.region = {
        name: 'The Wilderness',
        noattack: false,
        nomonster: false
    };
    self.ai = {
        entityTarget: null,
        posTarget: {
            x: null,
            y: null
        },
        charge: {
            x: 0,
            y: 0,
            time: 0
        },
        idleMove: 'none',
        idleRandom: {
            walking: false,
            waitTime: 4,
            lastPathEnd: 0
        },
        idleWaypoints: {
            walking: false,
            lastWaypoints: [],
            waypoints: [],
            pos: {
                x: null,
                y: null
            },
            waitTime: 20,
            lastPathEnd: 0
        },
        frozen: false,
        path: [],
        pathfinder: new PF.JumpPointFinder(PF.JPFMoveDiagonallyIfNoObstacles),
        grid: new PF.Grid(),
        lastPath: 0,
        maxRange: 100
    };
    self.aiControlled = true;
    self.characterStyle = {
        hair: 1,
        hairColor: '#000000',
        bodyColor: '#FFF0B4',
        shirtColor: '#FF3232',
        pantsColor: '#6464FF',
        texture: null
    };
    self.collisionBoxSize = Math.max(self.width, self.height);

    self.update = function update() {
        self.updatePos();
        self.lastAutoHeal++;
        self.lastHeal++;
        if (self.stats.heal != 0 && self.lastAutoHeal >= self.stats.heal && self.hp < self.maxHP && self.alive) {
            self.hp = Math.min(self.hp+1, self.maxHP);
            self.lastAutoHeal = 0;
        }
        if (self.controls.heal && self.hp < self.maxHP && self.lastHeal >= seconds(0.5) && self.mana >= 10) {
            var oldhp = self.hp;
            self.lastHeal = 0;
            self.hp = Math.min(self.hp+20, self.maxHP);
            self.mana -= 10;
            self.lastManaUse = 0;
            new Particle(self.map, self.x, self.y, 'heal', '+' + self.hp-oldhp);
        }
        self.lastManaRegen++;
        self.lastManaUse++;
        if (self.lastManaUse >= seconds(1.5) && self.alive) {
            self.mana = Math.min(self.mana+1, self.maxMana);
            self.lastManaRegen = 0;
        } else if (self.lastManaRegen >= seconds(0.5) && self.alive) {
            self.mana = Math.min(self.mana+1, self.maxMana);
            self.lastManaRegen = 0;
        }
        for (let i in self.invincibilityFrames) {
            self.invincibilityFrames[i]--;
            self.invincibilityFrames[i] < 1 && delete self.invincibilityFrames[i];
        }
        self.updateAnimation();
        self.updateEffects();
    };
    self.updatePos = function updatePos() {
        if (self.aiControlled) {
            self.ai.lastPath++;
            if (self.ai.lastPath >= seconds(0.5)) {
                self.ai.lastPath = 0;
                if (self.ai.entityTarget) self.ai.pathtoEntity();
                else if (self.ai.posTarget.x) self.ai.pathtoPos();
                else if (self.ai.idleMove != 'none') self.ai.pathIdle();
                else self.ai.path = [];
            }
        } else {
            if (self.slowedDown || self.shield) self.moveSpeed *= 0.5;
            self.controls.x = self.controls.xaxis;
            self.controls.y = self.controls.yaxis;
            if (self.controls.up) self.controls.y = Math.max(-1, Math.min(self.controls.y-1, 1));
            if (self.controls.down) self.controls.y = Math.max(-1, Math.min(self.controls.y+1, 1));
            if (self.controls.left) self.controls.x = Math.max(-1, Math.min(self.controls.x-1, 1));
            if (self.controls.right) self.controls.x = Math.max(-1, Math.min(self.controls.x+1, 1));
            self.xmove = self.controls.x*self.moveSpeed;
            self.ymove = self.controls.y*self.moveSpeed;
            if (self.slowedDown || self.shield) self.moveSpeed *= 2;
        }
        if (!self.canMove || self.stunned) {
            self.xmove = 0;
            self.ymove = 0;
        }
        self.xspeed = Math.round(self.xmove+self.xknockback);
        self.yspeed = Math.round(self.ymove+self.yknockback);
        self.collide();
        self.updateChunkLocation();
        self.xknockback *= 0.25;
        self.yknockback *= 0.25;
        if (Math.abs(self.xknockback) < 0.5) self.xknockback = 0;
        if (Math.abs(self.yknockback) < 0.5) self.yknockback = 0;
        if (self.ai.chargeTime != -1) {
            self.ai.charge.time -= 1;
            if (self.ai.charge.time < 0) {
                self.ai.charge.time = 0;
                self.ai.charge.x *= 0.5;
                self.ai.charge.y *= 0.5;
                if (Math.abs(self.ai.charge.x) < 0.5 || Math.abs(self.ai.charge.y) < 0.5) {
                    self.ai.charge.x = 0;
                    self.ai.charge.y = 0;
                    self.ai.charge.time = -1;
                }
            }
        }
        self.animationDirection = 'facing';
        if (self.controls.x || self.controls.y) {
            var dir = Math.round(radians(Math.atan2(self.controls.y, self.controls.x))/45);
            if (dir <= 0) dir = 8-Math.abs(dir);
            if (dir == 8) dir = 0;
            switch (dir) {
                case 0:
                    self.animationDirection = 'right';
                    break;
                case 1:
                    self.animationDirection = 'downright';
                    break;
                case 2:
                    self.animationDirection = 'down';
                    break;
                case 3:
                    self.animationDirection = 'downleft';
                    break;
                case 4:
                    self.animationDirection = 'left';
                    break;
                case 5:
                    self.animationDirection = 'upleft';
                    break;
                case 6:
                    self.animationDirection = 'up';
                    break;
                case 7:
                    self.animationDirection = 'upright';
                    break;
            }
        }
        if (self.animationDirection != 'facing') self.facingDirection = self.animationDirection;
        let foundregion = false;
        if (Region.grid[self.map][self.gridy] && Region.grid[self.map][self.gridy][self.gridx] && Region.grid[self.map][self.gridy][self.gridx].name != self.region.name) {
            self.region = Region.grid[self.map][self.gridy][self.gridx];
            self.onRegionChange();
        }
        if (Region.grid[self.map][self.gridy] && Region.grid[self.map][self.gridy][self.gridx]) foundregion = true;
        if (!foundregion && self.region.name != 'The Wilderness') {
            self.region = {
                name: 'The Wilderness',
                noattack: false,
                nomonster: false
            };
            self.onRegionChange();
        }
        if (Teleporter.grid[self.map][self.gridy] && Teleporter.grid[self.map][self.gridy][self.gridx] && Teleporter.grid[self.map][self.gridy][self.gridx]) {
            if (self.yspeed != 0 || self.xspeed != 0) {
                let direction = Teleporter.grid[self.map][self.gridy][self.gridx].direction;
                if ((direction == 'up' && self.yspeed < 0) || (direction == 'down' && self.yspeed > 0) || (direction == 'left' && self.xspeed < 0) || (direction == 'right' && self.xspeed > 0)) {
                    self.teleport(Teleporter.grid[self.map][self.gridy][self.gridx].map, Teleporter.grid[self.map][self.gridy][self.gridx].x, Teleporter.grid[self.map][self.gridy][self.gridx].y, Teleporter.grid[self.map][self.gridy][self.gridx].layer);
                }
            }
        }
    };
    self.collide = function collide() {
        try {
            if (!self.frozen && (self.xspeed != 0 || self.yspeed != 0 || self.aiControlled)) {
                self.aiControlled && self.aiControl();
                var max = Math.max(Math.abs(self.xspeed), Math.abs(self.yspeed))/(self.physicsInaccuracy*ENV.physicsInaccuracy);
                for (let i = 0; i < max; i += max/Math.ceil(max)) {
                    if (self.aiControlled && self.aiControl()) max = Math.max(Math.abs(self.xspeed), Math.abs(self.yspeed))/(self.physicsInaccuracy*ENV.physicsInaccuracy);
                    self.lastx = self.x;
                    self.lasty = self.y;
                    self.x += self.xspeed/max || 0;
                    self.y += self.yspeed/max || 0;
                    self.gridx = Math.floor(self.x/64);
                    self.gridy = Math.floor(self.y/64);
                    !self.noCollision && self.doPointCollision();
                    self.checkLayer();
                    self.checkSlowdown();
                }
                if (Collision.grid[self.map]) {
                    if (self.x-self.width/2 < Collision.grid[self.map].offsetX*64) self.x = Collision.grid[self.map].offsetX*64+self.width/2;
                    if (self.x+self.width/2 > Collision.grid[self.map].offsetX*64+Collision.grid[self.map].width*64) self.x = Collision.grid[self.map].offsetX*64+Collision.grid[self.map].width*64-self.width/2;
                    if (self.y-self.height/2 < Collision.grid[self.map].offsetY*64) self.y = Collision.grid[self.map].offsetY*64+self.height/2;
                    if (self.y+self.height/2 > Collision.grid[self.map].offsetY*64+Collision.grid[self.map].height*64) self.y = Collision.grid[self.map].offsetY*64+Collision.grid[self.map].height*64-self.height/2;
                }
                self.x = Math.round(self.x);
                self.y = Math.round(self.y);
                self.gridx = Math.floor(self.x/64);
                self.gridy = Math.floor(self.y/64);
                self.chunkx = Math.floor(self.gridx/Collision.grid[self.map].chunkWidth);
                self.chunky = Math.floor(self.gridy/Collision.grid[self.map].chunkHeight);
            }
        } catch (err) {
            error(err);
        }
    };
    self.aiControl = function aiControl() {
        var oldcontrols = cloneDeep(self.controls);
        self.controls = {
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
        self.xmove = 0;
        self.ymove = 0;
        if (!self.ai.frozen && self.canMove) {
            if (self.ai.charge.time != -1) {
                self.controls.x = self.ai.charge.x;
                self.controls.y = self.ai.charge.y;
            } else if (self.ai.path[0]) {
                var angle = Math.atan2(self.ai.path[0][1]*64+32-self.y, self.ai.path[0][0]*64+32-self.x);
                self.controls.xaxis = Math.cos(angle);
                self.controls.yaxis = Math.sin(angle);
                // if (self.ai.path[0][0]*64+32 < self.x) self.controls.left = true;
                // else if (self.ai.path[0][0]*64+32 > self.x) self.controls.right = true;
                // if (self.ai.path[0][1]*64+32 < self.y) self.controls.up = true;
                // else if (self.ai.path[0][1]*64+32 > self.y) self.controls.down = true;
                if (Math.round(self.x) == self.ai.path[0][0]*64+32 && Math.round(self.y) == self.ai.path[0][1]*64+32) {
                    self.ai.path.shift();
                }
                if (self.slowedDown) self.moveSpeed *= 0.5;
                self.controls.x = self.controls.xaxis;
                self.controls.y = self.controls.yaxis;
                // if (self.controls.up) self.controls.y = Math.max(-1, Math.min(self.controls.y-1, 1));
                // if (self.controls.down) self.controls.y = Math.max(-1, Math.min(self.controls.y+1, 1));
                // if (self.controls.left) self.controls.x = Math.max(-1, Math.min(self.controls.x-1, 1));
                // if (self.controls.right) self.controls.x = Math.max(-1, Math.min(self.controls.x+1, 1));
            }
            self.xmove = Math.round(self.controls.x*self.moveSpeed);
            self.ymove = Math.round(self.controls.y*self.moveSpeed);
            if (self.slowedDown) self.moveSpeed *= 2;
            self.xspeed = Math.round(self.xmove+self.xknockback);
            self.yspeed = Math.round(self.ymove+self.yknockback);
        }
        for (let i in self.controls) {
            if (self.controls[i] != oldcontrols[i]) return true;
        }
        return false;
    };
    self.updateEffects = function updateEffects() {
        for (let i in self.effectTimers) {
            self.effectTimers[i]--;
            self.effectTimers[i] <= 0 && delete self.effectTimers[i];
        }
        self.stunned = self.effectTimers['stun'] != undefined;
    };
    self.updateAnimation = function updateAnimation() {
        self.lastFrameUpdate++;
        if (self.animationDirection == 'none') {
            self.animationStage = 0;
        } else if (self.animationDirection == 'loop') {
            if (self.lastFrameUpdate >= seconds(self.animationSpeed/1000)) {
                self.lastFrameUpdate = 0;
                self.animationStage++;
                if (self.animationStage > self.animationLength) self.animationStage = 0;
            }
        } else if (self.animationDirection == 'facing') {
            switch (self.facingDirection) {
                case 'up':
                    self.animationStage = 24;
                    break;
                case 'down':
                    self.animationStage = 0;
                    break;
                case 'left':
                    self.animationStage = 36;
                    break;
                case 'right':
                    self.animationStage = 12;
                    break;
                case 'upleft':
                    self.animationStage = 30;
                    break;
                case 'downleft':
                    self.animationStage = 42;
                    break;
                case 'upright':
                    self.animationStage = 18;
                    break;
                case 'downright':
                    self.animationStage = 6;
                    break;
                default:
                    error('Invalid facingDirection ' + self.facingDirection);
                    break;
            }
        } else {
            if (self.lastFrameUpdate >= seconds(self.animationSpeed/1000)) {
                self.lastFrameUpdate = 0;
                self.animationStage++;
                switch (self.animationDirection) {
                    case 'up':
                        if (self.animationStage < 24) self.animationStage = 24;
                        if (self.animationStage > 29) self.animationStage = 24;
                        break;
                    case 'down':
                        if (self.animationStage < 0) self.animationStage = 0;
                        if (self.animationStage > 5) self.animationStage = 0;
                        break;
                    case 'left':;
                        if (self.animationStage < 36) self.animationStage = 36;
                        if (self.animationStage > 41) self.animationStage = 36;
                        break;
                    case 'right':
                        if (self.animationStage < 12) self.animationStage = 12;
                        if (self.animationStage > 17) self.animationStage = 12;
                        break;
                    case 'upleft':
                        if (self.animationStage < 30) self.animationStage = 30;
                        if (self.animationStage > 35) self.animationStage = 30;
                        break;
                    case 'downleft':
                        if (self.animationStage < 42) self.animationStage = 42;
                        if (self.animationStage > 47) self.animationStage = 42;
                        break;
                    case 'upright':
                        if (self.animationStage < 18) self.animationStage = 18;
                        if (self.animationStage > 23) self.animationStage = 18;
                        break;
                    case 'downright':
                        if (self.animationStage < 6) self.animationStage = 6;
                        if (self.animationStage > 11) self.animationStage = 6;
                        break;
                    default:
                        error('Invalid animationDirection ' + self.animationDirection);
                        break;
                }
            }
        }
    };
    self.ai.pathtoEntity = function pathtoEntity() {
        if (self.ai.entityTarget) {
            self.ai.path = [];
            try {
                self.ai.posTarget = {
                    x: self.ai.entityTarget.gridx,
                    y: self.ai.entityTarget.gridy
                };
                self.ai.pathtoPos();
            } catch (err) {
                error(err);
            }
        }
        return self.ai.path;
    };
    self.ai.pathtoPos = function pathtoPos() {
        if (self.ai.posTarget) {
            self.ai.path = [];
            try {
                if (self.getSquareGridDistance({x: self.ai.posTarget.x, y: self.ai.posTarget.y}) < ENV.maxPathfindRange) {
                    self.ai.path = self.ai.pathtoTarget(self.ai.posTarget.x, self.ai.posTarget.y);
                    if (self.ai.path[0] == null) {
                        // const graph = cloneDeep(Layer.graph[self.map]);
                        // // add node for end point
                        // var openlist = [];
                        // openlist.push({
                        //     x: self.gridx,
                        //     y: self.gridy,
                        //     layer: self.layer,
                        //     dir: 0,
                        //     parent: null,
                        //     connections: [
                        //         {
                        //             x: Layer.lookupTable[self.map][self.layer][self.gridy][self.gridx].x,
                        //             y: Layer.lookupTable[self.map][self.layer][self.gridy][self.gridx].y,
                        //             distance: Layer.lookupTable[self.map][self.layer][self.gridy][self.gridx].distance
                        //         }
                        //     ],
                        //     f: 1,
                        //     g: 0,
                        //     h: 0
                        // });
                        // var curr;
                        // var lastcurr = null;
                        // while (openlist.length) {
                        //     curr = openlist[0];
                        //     for (let i in openlist) {
                        //         if (openlist[i].f < curr.f) curr = openlist[i];
                        //     }
                        //     curr.closed = true;
                        //     openlist.splice(openlist.indexOf(curr), 1);
                            
                        //     for (let i in curr.connections) {
                        //         errors for some reason
                        //         var neighbor = graph[curr.layer+curr.dir][curr.connections[i].y][curr.connections[i].x];
                        //         if (neighbor.closed) continue;
                        //         if (!neighbor.visited || curr.g+curr.connections[i].distance < neighbor.g) {
                        //             neighbor.visited = true;
                        //             neighbor.parent = curr;
                        //             neighbor.g = curr.g+curr.connections[i].distance;
                        //             neighbor.h = Math.abs(neighbor.x-curr.x)+Math.abs(neighbor.y-curr.y);
                        //             neighbor.f = neighbor.g+neighbor.h;
                        //         }
                        //         openlist.push(neighbor);
                        //     }
                            
                        //     lastcurr = curr;
                        // }
                    }
                }
            } catch (err) {
                error(err);
            }
        }
        return self.ai.path;
    };
    self.ai.pathtoTarget = function pathtoTarget(x, y) {
        if (typeof x == 'number' && typeof y == 'number') {
            try {
                var retpath = [];
                if (self.getSquareGridDistance({x: x, y: y}) < ENV.maxPathfindRange) {
                    var left = Math.min(self.gridx-ENV.pathfindBuffer, x-ENV.pathfindBuffer);
                    var right = Math.max(self.gridx+ENV.pathfindBuffer, x+ENV.pathfindBuffer);
                    var top = Math.min(self.gridy-ENV.pathfindBuffer, y-ENV.pathfindBuffer);
                    var bottom = Math.max(self.gridy+ENV.pathfindBuffer, y+ENV.pathfindBuffer);
                    self.ai.grid = new PF.Grid(right-left, bottom-top);
                    if (Collision.grid[self.map] && Collision.grid[self.map][self.layer]) {
                        for (let writey = 0; writey < bottom-top; writey++) {
                            for (let writex = 0; writex < right-left; writex++) {
                                var checkx = writex+left;
                                var checky = writey+top;
                                Collision.grid[self.map][self.layer][checky] && Collision.grid[self.map][self.layer][checky][checkx] && self.ai.grid.setWalkableAt(writex, writey, false);
                            }
                        }
                    }
                    var path = self.ai.pathfinder.findPath(self.gridx-left, self.gridy-top, x-left, y-top, self.ai.grid);
                    path.shift();
                    retpath = PF.Util.compressPath(path);
                    for (let i in retpath) {
                        retpath[i][0] += left;
                        retpath[i][1] += top;
                    }
                }
                self.ai.path = retpath;
                return retpath;
            } catch (err) {
                error(err);
            }
        }
        return [];
    };
    self.ai.pathIdle = function pathIdle() {
        if (self.ai.idleMove == 'waypoints') {
            try {
                if (self.ai.idleWaypoints.lastPathEnd >= randomRange(0, seconds(self.ai.idleWaypoints.waitTime))) {
                    self.ai.idleWaypoints.lastPathEnd = 0;
                    var waypoints = Array.from(self.ai.idleWaypoints.waypoints);
                    var lastWaypoints = self.ai.idleWaypoints.lastWaypoints;
                    if (waypoints) {
                        for (let i in waypoints) {
                            var waypoint = waypoints[i];
                            if (waypoint.map != self.map) delete waypoints[i];
                            if (waypoint.x == self.gridx && waypoint.y == self.gridy && waypoint.map == self.map) {
                                let alreadyExists = false;
                                for (let lastWaypoint of lastWaypoints) {
                                    if (waypoint.x == lastWaypoint.x && waypoint.y == lastWaypoint.y && waypoint.map == lastWaypoint.map) alreadyExists = true;
                                }
                                if (alreadyExists) delete waypoints[i];
                                else self.ai.idleWaypoints.lastWaypoints.unshift(waypoint);
                            }
                        }
                        var waypointCount = 0;
                        for (let waypoint of waypoints) {
                            if (waypoint && waypoint.map == self.map) waypointCount++;
                        }
                        if (lastWaypoints.length > Math.min(4, waypointCount-1)) lastWaypoints.pop();
                        // for (let i in waypoints) {
                        //     var waypoint = waypoints[i];
                        //     for (let lastWaypoint of lastWaypoints) {
                        //         if (waypoint.x == lastWaypoints[j].x && waypoint.y == lastWaypoints[j].y && waypoint.map == lastWaypoints[j].map) delete waypoints[i];
                        //     }
                        // }
                        let lowest;
                        for (let i in waypoints) {
                            if (lowest == null) lowest = i;
                            if (lowest && self.getGridDistance(waypoints[i]) < self.getGridDistance(waypoints[lowest])) {
                                lowest = i;
                            }
                        }
                        if (lowest) {
                            self.ai.posTarget.x = waypoints[lowest].x;
                            self.ai.posTarget.y = waypoints[lowest].y;
                            self.ai.idleWaypoints.pos = waypoints[lowest];
                            self.ai.idleWaypoints.lastWaypoints.unshift(self.ai.idleWaypoints.pos);
                            self.ai.pathtoPos();
                            self.ai.idleWaypoints.walking = true;
                            self.ai.posTarget = {
                                x: null,
                                y: null
                            };
                        }
                    }
                }
                if (self.x == self.ai.idleWaypoints.pos.x*64+32 && self.y == self.ai.idleWaypoints.pos.y*64+32) self.ai.idleWaypoints.walking = false;
                if (!self.ai.idleWaypoints.walking) {
                    self.ai.idleWaypoints.lastPathEnd += seconds(0.1);
                    self.ai.path = [];
                }
            } catch (err) {
                error(err);
            }
        } else if (self.ai.idleMove == 'random') {
            try {
                if (self.ai.idleRandom.lastPathEnd >= randomRange(seconds(self.ai.idleRandom.waitTime))) {
                    self.ai.idleRandom.lastPathEnd = 0;
                    var pathAttempts = 0;
                    while (true) {
                        pathAttempts++;
                        var attempts = 0;
                        var pos = {
                            x: 0,
                            y: 0
                        };
                        while (true) {
                            attempts++;
                            pos.x = Math.round(self.gridx+randomRange(-1, 1));
                            pos.y = Math.round(self.gridy+randomRange(-1, 1));
                            if (Collision.grid[self.map][self.layer][pos.y] && Collision.grid[self.map][self.layer][pos.y][pos.x]) {}
                            else break;
                            if (attempts >= 10) break;
                        }
                        self.ai.posTarget.x = pos.x;
                        self.ai.posTarget.y = pos.y;
                        self.ai.idleWaypoints.pos = self.ai.posTarget;
                        self.ai.pathtoPos();
                        self.ai.idleWaypoints.walking = true;
                        self.ai.posTarget = {
                            x: null,
                            y: null
                        };
                        if (self.ai.path != []) break;
                        if (pathAttempts >= 10) break;
                    }
                    if (self.ai.path[0]) {
                        self.ai.idleRandom.walking = true;
                    }
                }
                if (self.gridx == self.ai.idleWaypoints.pos.x && self.gridy == self.ai.idleWaypoints.pos.y) self.ai.idleRandom.walking = false;
                if (!self.ai.idleRandom.walking) {
                    self.ai.idleRandom.lastPathEnd += seconds(0.1);
                    self.ai.path = [];
                }
            } catch (err) {
                error(err);
            }
        }
        return self.ai.path;
    };
    self.onHit = function onHit(entity, type) {
        let oldhp = self.hp;
        let critHp = 0;
        let parent = Monster.list[entity.parentID] ?? Player.list[entity.parentID] ?? entity;
        if (entity.critChance && Math.random() < entity.critChance) critHp = entity.damage*entity.critPower;
        let spawnParticles = true;
        let ret = false;
        if (!self.invincible) {
            switch (type) {
                case 'projectile':
                    var reflected = false;
                    var blocked = self.shield && Math.abs(self.shieldAngle-Math.atan2(-entity.yspeed, -entity.xspeed)) < degrees(self.shieldStats.blockAngle/2);
                    if (self.invincibilityFrames[entity.type] == null && !blocked) {
                        self.hp -= Math.max(Math.round(((entity.damage+critHp)*(1-self.stats.defense))-self.stats.damageReduction), 0);
                        self.invincibilityFrames[entity.type] = entity.invincibilityFrame+1;
                    } else {
                        spawnParticles = false;
                        if (entity.reflectable && Math.random() < self.shieldStats.reflectProjectileChance) {
                            reflected = true;
                            ret = true;
                        }
                    }
                    var rand = randomRange(0.5, 1.5);
                    var multiplier = entity.knockback*rand*Math.max(0, 1-self.stats.knockbackResistance-(blocked?self.shieldStats.knockbackResistance:0));
                    self.xknockback += entity.xspeed*multiplier;
                    self.yknockback += entity.yspeed*multiplier;
                    for (let event of entity.contactEvents) {
                        if (Projectile.contactEvents[event.type]) {
                            Projectile.contactEvents[event.type](entity, self, event.data);
                        }
                    }
                    if (reflected) {
                        entity.parentID = self.id;
                        entity.angle = self.shieldAngle-Math.atan2(-entity.yspeed, -entity.xspeed)+self.shieldAngle;
                        entity.travelTime = ticks(entity.maxRange)-30;
                        entity.sinAngle = Math.sin(entity.angle);
                        entity.cosAngle = Math.cos(entity.angle);
                        entity.xspeed = entity.cosAngle*entity.moveSpeed;
                        entity.yspeed = entity.sinAngle*entity.moveSpeed;
                        entity.collisionBoxSize = Math.max(Math.abs(entity.sinAngle*entity.height)+Math.abs(entity.cosAngle*entity.width), Math.abs(entity.cosAngle*entity.height)+Math.abs(entity.sinAngle*entity.width));
                        entity.deathMessage += ' by ' + parent.name + '\'s ' + entity.type + ' reflected';
                    }
                    if (self.hp < 0) self.onDeath(parent, 'killed', entity.deathMessage);
                    break;
                case 'touch':
                    var blocked = self.shield && Math.abs(self.shieldAngle-self.getAngle(entity)) < degrees(self.shieldStats.blockAngle);
                    if (self.invincibilityFrames['touch'] == null && !blocked) {
                        self.hp -= Math.max(Math.round(Math.floor(randomRange(entity.touchDamage/2+1, entity.touchDamage))*(1-self.stats.defense)-self.stats.damageReduction), 0);
                        self.invincibilityFrames['touch'] = 5;
                    } else spawnParticles = false;
                    var rand = randomRange(0.5, 1.5);
                    var angle = Math.atan2(self.y-entity.y-entity.yspeed, self.x-entity.x-entity.xspeed);
                    var multiplier = Math.max(0, 1-self.stats.knockbackResistance-(blocked?self.shieldStats.knockbackResistance:0));
                    self.xknockback += (Math.cos(angle)*rand*10+entity.xspeed*rand)*multiplier;
                    self.yknockback += (Math.sin(angle)*rand*10+entity.yspeed*rand)*multiplier;
                    if (self.hp < 0) self.onDeath(entity, entity.deathMessage ?? 'killed');
                    break;
                case 'explosion':
                    var blocked = self.shield && Math.abs(self.shieldAngle-self.getAngle(entity)) < degrees(self.shieldStats.blockAngle);
                    if (!blocked) self.hp -= Math.max(Math.round((40*entity.explosionSize*(1/(self.getDistance(entity)/64*entity.explosionSize))*(1-self.stats.defense))-self.stats.damageReduction), 0);
                    var rand = randomRange(0.5, 1.5);
                    var angle = Math.atan2(self.y-entity.y-entity.yspeed, self.x-entity.x-entity.xspeed);
                    self.xknockback += Math.cos(angle)*rand*10*entity.explosionSize*(1-self.stats.knockbackResistance);
                    self.yknockback += Math.sin(angle)*rand*10*entity.explosionSize*(1-self.stats.knockbackResistance);
                    if (self.hp < 0) self.onDeath(parent, 'explosion');
                    break;
                default:
                    error('Invalid Entity type: ' + type);
                    break;
            }
        }
        spawnParticles && critHp && new Particle(self.map, self.x, self.y, 'critdamage', self.hp-oldhp);
        spawnParticles && !critHp &&  new Particle(self.map, self.x, self.y, 'damage', self.hp-oldhp);
        if (parent && parent.entType == 'player') parent.trackedData.damageDealt += oldhp-self.hp;
        return ret;
    };
    self.onDeath = function onDeath(entity, type, message) {
        if (!self.invincible) {
            let oldhp = self.hp;
            self.hp = 0;
            self.alive = false;
            if (entity && entity.entType == 'player') {
                entity.trackedData.kills++;
            }
            for (let i = 0; i < self.width*self.height/200; i++) {
                new Particle(self.map, self.x+randomRange(-self.width/2, self.width/2), self.y+randomRange(-self.height/2, self.height/2), 'death');
            }
            if (self.bcDeath) switch (type) {
                case 'killed':
                    if (entity) insertChat(self.name + ' was ' + (message ?? 'killed') + ' by ' + entity.name, 'death');
                    else insertChat(self.name + ' was ' + (message ?? 'killed'), 'death');
                    break;
                case 'explosion':
                    if (entity) insertChat(self.name + ' was blown up by ' + entity.name, 'death');
                    else insertChat(self.name + ' blew up', 'death');
                    break;
                case 'fire':
                    insertChat(self.name + ' caught fire', 'death');
                    break;
                case 'debug':
                    insertChat(self.name + ' was debugged', 'death');
                    break;
                default:
                    insertChat(self.name + ' died', 'death');
                    break;
            }
            if (entity && entity.entType == 'player') entity.trackedData.damageDealt += oldhp-self.hp;
        }
    };
    self.onRegionChange = function onRegionChange() {};
    self.teleport = function teleport(map, x, y, layer) {
        if (!self.teleporting) {
            self.teleporting = true;
            for (let i = 0; i < 20; i++) {
                new Particle(self.map, self.x, self.y, 'teleport');
            }
            self.map = map;
            self.x = x*64+32;
            self.y = y*64+32;
            self.layer = layer;
            self.gridx = Math.floor(self.x/64);
            self.gridy = Math.floor(self.y/64);
            self.chunkx = Math.floor(self.gridx/Collision.grid[self.map].chunkWidth);
            self.chunky = Math.floor(self.gridy/Collision.grid[self.map].chunkHeight);
            self.ai.path = [];
            self.ai.entityTarget = null;
            self.ai.posTarget = {
                x: null,
                y: null
            };
            self.ai.idleRandom.walking = false;
            self.ai.idleWaypoints.walking = false;
            self.ai.idleWaypoints.lastWaypoints = [];
            for (let i = 0; i < 20; i++) {
                new Particle(self.map, self.x, self.y, 'teleport');
            }
            self.teleporting = false;
        }
    };

    return self;
};

// npcs
Npc = function(id, x, y, map) {
    const self = new Rig();
    self.entType = 'npc';
    self.animationSpeed = 100;
    self.animationDirection = 'facing';
    self.facingDirection = 'down';
    self.npcId = id;
    self.invincible = true;
    self.name = 'Npc';
    self.stats = {
        damageType: null,
        projectileSpeed: 1,
        attack: 1,
        defense: 0,
        damageReduction: 0,
        knockbackResistance: 0,
        heal: 0,
        speed: 1,
        range: 1,
        critChance: 0,
        critPower: 1,
        knockback: 0
    };
    self.moveSpeed = 5;
    try {
        var tempnpc = Npc.rawJson[id];
        self.x = x*64+32;
        self.y = y*64+32;
        self.map = map;
        self.gridx = Math.floor(self.x/64);
        self.gridy = Math.floor(self.y/64);
        self.chunkx = Math.floor(self.gridx/Collision.grid[self.map].chunkWidth);
        self.chunky = Math.floor(self.gridy/Collision.grid[self.map].chunkHeight);
        switch (tempnpc.type) {
            case 'static':
                self.moveSpeed = 0;
                break;
            case 'waypoint':
                self.ai.idleMove = 'waypoints';
                break;
            case 'random':
                self.ai.idleMove = 'random';
                break;
            default:
                error('Invalid npc type ' + tempnpc.type);
                break;
        }
        self.rightClickEvent = new Function('return ' + tempnpc.rightClickEvent)();
        self.rightClickEvents = [];
        for (let event of tempnpc.rightClickEvents) {
            self.rightClickEvents.push({
                condition: event.condition,
                event: new Function('return ' + event.event)(),
                breakSearch: event.breakSearch
            });
        }
        for (let i in tempnpc.data) {
            self[i] = tempnpc.data[i];
        }
        if (tempnpc.width) self.width = tempnpc.width;
        if (tempnpc.height) self.height = tempnpc.height;
        delete tempnpc;
    } catch (err) {
        error(err);
        return false;
    }
    self.conversationCount = 0;
    self.shopCount = 0;
    self.aiControlled = true;
    self.collisionBoxSize = Math.max(self.width, self.height);

    self.update = function update() {
        self.updatePos();
        self.animationSpeed = 15/Math.sqrt((self.xmove)**2+(self.ymove))**2*100 || 100;
        self.updateAnimation();
    };
    self.clickEvents = function clickEvents(player) {
        self.rightClickEvent(player, self);
        clickLoop: for (let event of self.rightClickEvents) {
            let args = event.condition.split(':');
            switch (args[0]) {
                case 'quest':
                    if (player.quests.isInQuest(args[1]) === parseInt(args[2])) {
                        event.event(player, self);
                        if (event.breakSearch) break clickLoop;
                    }
                    break;
                case 'xp':
                    break;
                case 'any':
                    event.event(player, self);
                    if (event.breakSearch) break clickLoop;
                    break;
                default:
                    warn('Invalid rightClickEvent condition type "' + args[0] + '", interpreting as "any".');
                    event.event(player, self);
                    if (event.breakSearch) break clickLoop;
                    break;
            }
        }
    };
    self.startConversation = function startConversation(player, id) {
        if (!player.talking) {
            self.ai.frozen = true;
            self.conversationCount++;
            player.prompt(id, self.id);
        }
    };
    self.endConversation = function endConversation() {
        self.conversationCount--;
        if (self.conversationCount <= 0 && self.shopCount <= 0) self.ai.frozen = false;
    };
    self.openShop = function openShop(id, player) {
        if (!player.inShop) {
            self.ai.frozen = true;
            self.shopCount++;
            new Shop(id, player.socket, player.inventory, player, self);
        }
    };
    self.openSellShop = function openSellShop(player) {
        if (!player.inShop) {
            self.ai.frozen = true;
            self.shopCount++;
            new SellShop(player.socket, player.inventory, player, self);
        }
    };
    self.closeShop = function closeShop() {
        self.shopCount--;
        if (self.conversationCount <= 0 && self.shopCount <= 0) self.ai.frozen = false;
    };
    self.onDeath = function onDeath() {};

    Npc.list[self.id] = self;
    return self;
};
Npc.update = function update() {
    const pack = [];
    for (let i in Npc.list) {
        let localnpc = Npc.list[i];
        localnpc.update();
        pack.push({
            id: localnpc.id,
            map: localnpc.map,
            x: localnpc.x,
            y: localnpc.y,
            layer: localnpc.layer,
            name: localnpc.name,
            npcId: localnpc.npcId,
            animationStage: localnpc.animationStage,
            characterStyle: localnpc.characterStyle,
            isNPC: true
        });
    }
    
    return pack;
};
Npc.getDebugData = function getDebugData() {
    const pack = [];
    for (let i in Npc.list) {
        let localnpc = Npc.list[i];
        pack.push({
            map: localnpc.map,
            x: localnpc.x,
            y: localnpc.y,
            width: localnpc.width,
            height: localnpc.height,
            name: localnpc.name,
            collisionBoxSize: localnpc.collisionBoxSize,
            path: localnpc.ai.path,
            idleWaypoints: localnpc.ai.idleWaypoints,
            controls: localnpc.controls,
        });
    }

    return pack;
};
Npc.init = function init() {
    for (let i in Npc.dialogues) {
        for (let j in Npc.dialogues[i]) {
            for (let k in Npc.dialogues[i][j].options) {
                if (Npc.dialogues[i][j].options[k].action.includes('script_')) {
                    Npc.dialogues[i][j].options[k].script = new Function('return ' + Npc.dialogues[i][j].options[k].action.replace('script_', ''))();
                } else if (Npc.dialogues[i][j].options[k].action.includes('script-end_')) {
                    Npc.dialogues[i][j].options[k].script = new Function('return ' + Npc.dialogues[i][j].options[k].action.replace('script-end_', ''))();
                }
            }
        }
    }
};
Npc.rawJson = require('./npc.json');
Npc.dialogues = require('./../client/prompts.json');
Npc.list = [];

// players
Player = function(socket) {
    const self = new Rig();
    self.entType = 'player';
    self.socket = socket;
    self.ip = socket.handshake.headers['x-forwarded-for'];
    self.fingerprint = {fpjs: Math.random(), webgl: Math.random()};
    self.map = ENV.spawnpoint.map;
    self.x = ENV.spawnpoint.x*64+32;
    self.y = ENV.spawnpoint.y*64+32;
    self.layer = ENV.spawnpoint.layer;
    self.gridx = Math.floor(self.x/64);
    self.gridy = Math.floor(self.y/64);
    self.chunkx = Math.floor(self.gridx/Collision.grid[self.map].chunkWidth);
    self.chunky = Math.floor(self.gridy/Collision.grid[self.map].chunkHeight);
    self.animationSpeed = 100;
    self.animationDirection = 'facing';
    self.facingDirection = 'down';
    self.attacking = false;
    self.disableSecond = false;
    self.lastHeal = 0;
    self.stats.heal = 8;
    self.stats.maxPierce = 0;
    self.crystalStats = {
        damageType: null,
        projectileSpeed: 1,
        attack: 1,
        speed: 1,
        range: 1,
        accuracy: 1,
        critChance: 0,
        critPower: 1,
        knockback: 0,
        maxPierce: 0
    };
    self.manaRegenStats = [];
    self.mouseX = 0;
    self.mouseY = 0;
    self.name = null;
    self.aiControlled = false;
    self.inventory = new Inventory(socket, self);
    self.attack = {
        projectile: null,
        projectilePattern: 'single',
        useTime: 0,
        manaCost: 0,
        lastUse: 0,
        second: false
    };
    self.crystal = {
        projectile: null,
        projectilePattern: 'single',
        useTime: 0,
        manaCost: 0,
        lastUse: 0,
        second: true
    };
    self.heldItem = {
        id: null,
        shield: null,
        usingShield: false,
        angle: 0
    };
    self.teleportLocation = {
        map: 'World',
        x: 0,
        y: 0,
        layer: 0
    };
    self.invincible = true;
    self.bcDeath = true;
    self.canMove = false;
    self.talking = false;
    self.inShop = false;
    self.shop = null;
    self.currentConversation = {
        id: null,
        i: 0
    };
    self.talkingWith = null;
    self.talkedWith = null;
    self.spectating = null;
    self.quests = new QuestHandler(socket, self);
    self.trackedData = {
        monstersKilled: [],
        kills: 0,
        deaths: 0,
        damageDealt: 0,
        damageTaken: 0,
        dps: 0,
        maxDPS: 0,
        bossesSlain: 0,
        obtained: {},
        last: {},
        updateTrackers: function() {
            var delta = {
                monstersKilled: [],
                playerKills: 0,
                kills: self.trackedData.kills-self.trackedData.last.kills,
                deaths: self.trackedData.deaths-self.trackedData.last.deaths,
                damageDealt: self.trackedData.damageDealt-self.trackedData.last.damageDealt,
                damageTaken: self.trackedData.damageTaken-self.trackedData.last.damageTaken,
                dps: self.trackedData.dps,
                maxDPS: self.trackedData.maxDPS,
                bossesSlain: self.trackedData.bossesSlain-self.trackedData.last.bossesSlain,
            };
            for (let i in self.trackedData.monstersKilled) {
                var temp = self.trackedData.monstersKilled[i];
                var found = false;
                for (let j in self.trackedData.last.monstersKilled) {
                    var temp2 = self.trackedData.last.monstersKilled[j];
                    if (temp.id == temp2.id) {
                        if (temp.count-temp2.count != 0) delta.monstersKilled.push({
                            id: temp.id,
                            count: temp.count-temp2.count
                        });
                        found = true;
                    }
                }
                if (!found) delta.monstersKilled.push({
                    id: temp.id,
                    count: temp.count
                });
            }
            var data = {
                trackedData: delta,
                aqquiredItems: self.trackedData.obtained,
                pos: {
                    x: self.gridx,
                    y: self.gridy
                },
                talkedWith: self.talkedWith
            };
            self.quests.updateQuestRequirements(data);
            self.talkedWith = null;
            self.trackedData.obtained = {};
            self.trackedData.last = {};
            self.trackedData.last = cloneDeep(self.trackedData);
        }
    };
    self.trackedData.last = cloneDeep(self.trackedData);
    self.garuderWarpPositions = [];
    self.playTime = 0;
    self.loginTime = null;
    self.alive = false;
    self.debugEnabled = false;
    self.creds = {
        username: null,
        password: null
    };
    self.chatStyle = '';
    self.signUpAttempts = 0;
    const signupspamcheck = setInterval(async function() {
        self.signUpAttempts = Math.max(self.signUpAttempts-1, 0);
        if (!self.disconnected && self.signUpAttempts >= 1) {
            log('User was kicked for sign up spam: IP:' + self.ip + ' FPJS Fingerprint:' + self.fingerprint.fpjs + ' WebGL Fingerprint:' + self.fingerprint.webgl);
            await self.leave();
        }
    }, 10000);
    self.signedIn = false;
    self.collisionBoxSize = Math.max(self.width, self.height);
    self.chunkLocation.map = 'menu';
    self.renderDistance = 1;
    self.toDisconnect = false;
    self.toKick = false;
    self.disconnected = false;

    socket.once('requestPublicKey', async function() {
        socket.emit('publicKey', await subtle.exportKey('jwk', (await keys).publicKey));
    });
    socket.on('signIn', async function(cred) {
        if (typeof cred == 'object' && cred != null && typeof cred.username == 'string' && cred.password instanceof Buffer) {
            if (ENV.isBetaServer && (cred.state == 'deleteAccount' || cred.state == 'signUp')) {
                socket.emit('signInState', 'disabled');
                return;
            }
            const decryptPassword = await RSAdecode(cred.password);
            let valid = ACCOUNTS.validateCredentials(cred.username, decryptPassword);
            switch (valid) {
                case 0:
                    if (Filter.check(cred.username)) {
                        self.leave();
                        return;
                    }
                    switch (cred.state) {
                        case 'signIn':
                            if (!self.signedIn) {
                                let status = await ACCOUNTS.login(cred.username, decryptPassword);
                                switch (status) {
                                    case 0:
                                        let signedIn = false;
                                        for (let i in Player.list) {
                                            if (Player.list[i].creds.username == cred.username) {
                                                signedIn = true;
                                            }
                                        }
                                        if (!signedIn) {
                                            self.creds.username = cred.username;
                                            self.creds.password = cred.password;
                                            Object.freeze(self.creds);
                                            let maps = [];
                                            for (let i in Collision.grid) {
                                                maps.push(i);
                                            }
                                            socket.emit('mapData', {
                                                maps: maps,
                                                self: {
                                                    map: self.map,
                                                    x: self.x,
                                                    y: self.y,
                                                    chunkx: self.chunkx,
                                                    chunky: self.chunky
                                                }
                                            });
                                            self.signedIn = true;
                                        } else {
                                            socket.emit('signInState', 'alreadySignedIn');
                                        }
                                        break;
                                    case 1:
                                        socket.emit('signInState', 'incorrectPassword');
                                        break;
                                    case 2:
                                        socket.emit('signInState', 'noAccount');
                                        break;
                                    case 3:
                                        socket.emit('signInState', 'banned');
                                        break;
                                }
                            }
                            break;
                        case 'loaded':
                            if (cred.username == self.creds.username && decryptPassword == await RSAdecode(self.creds.password)) {
                                self.name = self.creds.username;
                                self.loginTime = Date.now();
                                await self.loadData();
                                socket.emit('signInState', 'signedIn');
                                self.updateClient();
                                insertChat(self.name + ' joined the game', 'server');
                                self.invincible = false;
                                self.canMove = true;
                                self.alive = true;
                            } else {
                                socket.emit('signInState', 'invalidSignIn');
                            }
                            break;
                        case 'signUp':
                            for (let i in Player.list) {
                                if (Player.list[i].ip == self.ip || Player.list[i].fingerprint.fpjs == self.fingerprint.fpjs || Player.list[i].fingerprint.webgl == self.fingerprint.webgl) Player.list[i].signUpAttempts++;
                            }
                            if (self.signUpAttempts > 1) {
                                log('User was kicked for sign up spam: IP:' + self.ip + ' FPJS Fingerprint:' + self.fingerprint.fpjs + ' WebGL Fingerprint:' + self.fingerprint.webgl);
                                await self.leave();
                                return;
                            }
                            var highest = 0;
                            for (let i in Player.list) {
                                if (Player.list[i].ip == self.ip) highest = Math.max(highest, Player.list[i].signUpAttempts);
                            }
                            for (let i in Player.list) {
                                if (Player.list[i].ip == self.ip) Player.list[i].signUpAttempts = highest;
                            }
                            var status = await ACCOUNTS.signup(cred.username, decryptPassword);
                            switch (status) {
                                case 0:
                                    socket.emit('signInState', 'signedUp');
                                    break;
                                case 1:
                                    socket.emit('signInState', 'accountExists');
                                    break;
                                case 2:
                                    socket.emit('signInState', 'databaseError');
                                    break;
                                case 3:
                                    socket.emit('signInState', 'unavailable');
                            }
                            break;
                        case 'deleteAccount':
                            var status = await ACCOUNTS.deleteAccount(cred.username, decryptPassword);
                            switch (status) {
                                case 0:
                                    self.name = cred.username;
                                    socket.emit('signInState', 'deletedAccount');
                                    break;
                                case 1:
                                    socket.emit('signInState', 'incorrectPassword');
                                    break;
                                case 2:
                                    socket.emit('signInState', 'noAccount');
                                    break;
                                case 3:
                                    socket.emit('signInState', 'databaseError');
                                    break;
                            }
                            break;
                        case 'changePassword':
                            if (cred.oldPassword) {
                                var status = await ACCOUNTS.changePassword(cred.username, cred.oldPassword, decryptPassword);
                                switch (status) {
                                    case 0:
                                        self.name = cred.username;
                                        socket.emit('signInState', 'changedPassword');
                                        break;
                                    case 1:
                                        socket.emit('signInState', 'incorrectPassword');
                                        break;
                                    case 2:
                                        socket.emit('signInState', 'noAccount');
                                        break;
                                    case 3:
                                        socket.emit('signInState', 'databaseError');
                                        break;
                                }
                            } else {
                                self.kick();
                            }
                            break;
                        default:
                            error('Invalid sign in state ' + cred.state);
                            break;
                    }
                break;
                case 1:
                    socket.emit('signInState', 'noUsername');
                    break;
                case 2:
                    socket.emit('signInState', 'shortUsername');
                    break;
                case 3:
                    socket.emit('signInState', 'longUsername');
                    break;
                case 4:
                    socket.emit('signInState', 'noPassword');
                    break;
                case 5:
                    socket.emit('signInState', 'invalidCharacters');
                    break;
            }
        } else {
            self.kick();
        }
    });
    socket.on('keyPress', async function(data) {
        if (typeof data == 'object' && data != null) {
            if (self.alive) {
                if (data.key == 'disableSecond') self.disableSecond = data.state;
                else self.controls[data.key] = data.state;
            }
        } else {
            self.kick();
        }
    });
    socket.on('click', async function(data) {
        if (typeof data == 'object' && data != null) {
            if (self.alive && self.currentConversation.id == null) {
                if (data.button == 'left') {
                    self.attacking = data.state;
                    self.mouseX = data.x;
                    self.mouseY = data.y; 
                } else if (data.button == 'right') {
                    data.state && self.interact(data.x, data.y);
                    self.shield = data.state && self.inventory.equips.shield && !self.talking && !self.inShop;
                    self.heldItem.usingShield = data.state && self.inventory.equips.shield && !self.talking && !self.inShop;
                    self.mouseX = data.x;
                    self.mouseY = data.y; 
                }
            }
        } else {
            self.kick();
        }
    });
    socket.on('mouseMove', async function(data) {
        if (typeof data == 'object' && data != null) {
            self.mouseX = data.x;
            self.mouseY = data.y;
        } else {
            self.kick();
        }
    });
    socket.on('controllerInput', async function(inputs) {
        if (typeof inputs == 'object' && inputs != null) {
            if (self.alive) {
                if (Math.abs(inputs.movex) > 1 || Math.abs(inputs.movey) > 1) self.kick();
                self.controls.xaxis = Math.round(inputs.movex*10)/10;
                self.controls.yaxis = Math.round(inputs.movey*10)/10;
                if (Math.abs(self.controls.xaxis) == 0.1) self.controls.xaxis = 0;
                if (Math.abs(self.controls.yaxis) == 0.1) self.controls.yaxis = 0;
                self.mouseX = inputs.aimx;
                self.mouseY = inputs.aimy;
                self.attacking = inputs.attack;
                self.shield = inputs.second;
                self.disableSecond = inputs.disableSecond;
                if (inputs.interacting) self.interact(self.mouseX, self.mouseY);
            }
        } else {
            self.kick();
        }
    });
    socket.on('renderDistance', function(chunks) {
        if (chunks != null) {
            self.renderDistance = chunks;
        } else {
            self.kick();
        }
    });
    socket.on('debug', function(state) {
        if (state != null) {
            self.debugEnabled = state;
        } else {
            self.kick();
        }
    });
    let charCount = 0;
    let msgCount = 0;
    socket.on('chat', function(msg) {
        if (self.signedIn) {
            if (typeof msg == 'string') {
                msg = msg.replaceAll('<', '&lt');
                msg = msg.replaceAll('>', '&gt');
                try {
                    if (msg.indexOf('/') == 0) {
                        var cmd = '';
                        var arg = msg.replace('/', '');
                        while (true) {
                            cmd += arg[0];
                            arg = arg.replace(arg[0], '');
                            if (arg[0] == ' ') {
                                arg = arg.replace(arg[0], '');
                                break;
                            }
                            if (arg == '') break;
                        }
                        var args = [];
                        var i = 0;
                        while (true) {
                            if (args[i]) args[i] += arg[0];
                            else args[i] = arg[0];
                            arg = arg.replace(arg[0], '');
                            if (arg[0] == ' ') {
                                if (!(cmd == 'msg' && i == 1)) {
                                    arg = arg.replace(arg[0], '');
                                    i++;
                                }
                            }
                            if (arg == '') break;
                        }
                        switch (cmd) {
                            case 'help':
                                insertSingleChat('COMMAND HELP:\n/help -Returns all commands available\n/msg <username> <message> -Private message a player\n/waypoint <location> -Teleport to a waypoint\n', 'deepskyblue', self.name, false);
                                break;
                            case 'msg':
                                if (args[0] == null) {
                                    insertSingleChat('No recipient!', 'error', self.name, false);
                                    return;
                                }
                                if (args[0] == self.name) {
                                    insertSingleChat('You can\'t message yourself!', 'error', self.name, false);
                                    return;
                                }
                                var valid = false;
                                for (let i in Player.list) {
                                    if (Player.list[i].name == args[0]) valid = true;
                                }
                                if (!valid) {
                                    insertSingleChat('No player found with name ' + args[0], 'error', self.name, false);
                                    break;
                                }
                                if (args[1] == null || args[1] == ' ') {
                                    insertSingleChat('Empty message!', 'error', self.name, false);
                                    return;
                                }
                                if (valid) {
                                    if (!Filter.check(args[1])) {
                                        insertSingleChat(self.name + '->' + args[0] + ': ' + args[1], '', self.name, true);
                                        insertSingleChat(self.name + '->' + args[0] + ': ' + args[1], '', args[0], false);
                                    } else insertSingleChat('Hey! Don\'t do that!', 'error', self.name, false);
                                }
                                break;
                            case 'waypoint':
                                insertSingleChat('No waypoints unlocked yet.', 'error', self.name, false);
                                break;
                            default:
                                insertSingleChat('Command not found ' + cmd, 'error', self.name, false);
                                break;
                        }
                    } else {
                        var valid = false;
                        for (let i in msg) {
                            if (msg[i] != ' ') valid = true;
                        }
                        if (valid) {
                            if (Filter.check(msg)) insertSingleChat('Hey! Don\'t do that!', 'error', self.name, false);
                            else insertChat(self.name + ': ' + msg, self.chatStyle);
                            charCount += msg.length;
                            msgCount++;
                        }
                    }
                } catch (err) {
                    error(err);
                }
            } else {
                self.kick();
            }
        }
    });
    const spamcheck = setInterval(async function() {
        charCount = Math.max(charCount-128, 0);
        msgCount = Math.max(msgCount-2, 0);
        if (!self.disconnected && (charCount > 0 || msgCount > 0)) {
            if (self.name) insertChat(self.name + ' was kicked for spamming', 'anticheat');
            await self.leave();
        }
    }, 1000);
    socket.on('playerStyle', function(style) {
        for (let i in style) {
            self.characterStyle[i] = style[i];
        }
    });

    self.update = function update() {
        self.updatePos();
        self.updateUse(self.attack, self.stats);
        self.updateUse(self.crystal, self.crystalStats);
        self.lastAutoHeal++;
        self.lastHeal++;
        self.lastManaRegen++;
        self.lastManaUse++;
        if (self.alive) {
            if (self.stats.heal != 0 && self.lastAutoHeal >= self.stats.heal && self.hp < self.maxHP) {
                self.hp = Math.min(self.hp+1, self.maxHP);
                self.lastAutoHeal = 0;
            }
            if (self.controls.heal && self.hp < self.maxHP && self.lastHeal >= seconds(1) && self.mana >= 20) {
                var oldhp = self.hp;
                self.lastHeal = 0;
                self.hp = Math.min(self.hp+20, self.maxHP);
                self.mana -= 20;
                self.lastManaUse = 0;
                new Particle(self.map, self.x, self.y, 'heal', '+' + self.hp-oldhp);
            }
            if (self.lastManaUse >= seconds(1.5)) {
                self.mana = Math.min(self.mana+1, self.maxMana);
                self.lastManaRegen = 0;
            } else if (self.lastManaRegen >= seconds(0.5)) {
                self.mana = Math.min(self.mana+1, self.maxMana);
                self.lastManaRegen = 0;
            }
            for (let regen of self.manaRegenStats) {
                regen.lastRegen++;
                if (regen.lastRegen > regen.time) {
                    self.mana = Math.min(self.mana+regen.amount, self.maxMana);
                    regen.lastRegen = 0;
                }
            }
        }
        for (let i in self.invincibilityFrames) {
            self.invincibilityFrames[i]--;
            self.invincibilityFrames[i] < 1 && delete self.invincibilityFrames[i];
        }
        self.updateEffects();
        self.animationSpeed = 15/Math.sqrt((self.xmove)**2+(self.ymove)**2)*100 || 50;
        self.updateAnimation();
        var mouseangle = Math.atan2(self.mouseY, self.mouseX);
        self.shieldAngle = mouseangle;
        self.heldItem.angle = mouseangle;
        var mouseddir = Math.round(radians(mouseangle)/45);
        if (mouseddir <= 0) mouseddir = 8-Math.abs(mouseddir);
        if (mouseddir == 8) mouseddir = 0;
        var dir = 'up';
        switch (mouseddir) {
            case 0:
                dir = 'right';
                break;
            case 1:
                dir = 'downright';
                break;
            case 2:
                dir = 'down';
                break;
            case 3:
                dir = 'downleft';
                break;
            case 4:
                dir = 'left';
                break;
            case 5:
                dir = 'upleft';
                break;
            case 6:
                dir = 'up';
                break;
            case 7:
                dir = 'upright';
                break;
        }
        self.facingDirection = dir;
        self.updateClient();
        self.trackedData.updateTrackers();
        if (self.gridx == 3 && self.gridy == 9 && self.map == 'World' && self.alive) self.onDeath(self, 'fire');
    };
    self.updateUse = function updateUse(attack, stats) {
        attack.lastUse++;
        if (self.attacking && !self.shield && !(attack.second && self.disableSecond) && attack.lastUse > attack.useTime && !self.region.noattack && attack.projectile != null && self.mana >= attack.manaCost && self.alive) {
            attack.lastUse = 0;
            var angle = Math.atan2(self.mouseY, self.mouseX);
            typeof Player.usePatterns[attack.projectilePattern] == 'function' && Player.usePatterns[attack.projectilePattern](self, attack, stats, angle);
            typeof Player.usePatterns[attack.projectilePattern] != 'function' && error('Invalid projectilePattern ' + attack.projectilePattern);
            self.mana -= attack.manaCost;
            if (attack.manaCost != 0) self.lastManaUse = 0;
        }
    };
    self.updateClient = function updateClient() {
        if (Player.list[self.spectating] == undefined) self.spectating = null;
        const pack = {
            id: self.spectating ?? self.id,
            hp: self.hp,
            maxHP: self.maxHP,
            xp: self.xp,
            maxXP: self.maxXP,
            mana: self.mana,
            maxMana: self.maxMana,
        }
        socket.emit('updateSelf', pack);
        self.quests.updateClient();
    };
    self.onRegionChange = function onRegionChange() {
        socket.emit('region', self.region.name);
    };
    self.teleport = function teleport(map, x, y, layer) {
        if (!self.teleporting) {
            self.teleporting = true;
            if (self.inShop) self.shop.close();
            self.canMove = false;
            self.teleportLocation.map = map;
            self.teleportLocation.x = x*64+32;
            self.teleportLocation.y = y*64+32;
            self.teleportLocation.layer = layer;
            socket.emit('teleport1');
        }
    };
    socket.on('teleport1', function() {
        if (self.teleporting) {
            for (let i = 0; i < 20; i++) {
                new Particle(self.map, self.x, self.y, 'teleport');
            }
            self.map = self.teleportLocation.map;
            self.x = self.teleportLocation.x;
            self.y = self.teleportLocation.y;
            self.layer = self.teleportLocation.layer;
            self.gridx = Math.floor(self.x/64);
            self.gridy = Math.floor(self.y/64);
            self.chunkx = Math.floor(self.gridx/Collision.grid[self.map].chunkWidth);
            self.chunky = Math.floor(self.gridy/Collision.grid[self.map].chunkHeight);
            self.canMove = true;
            for (let i = 0; i < 20; i++) {
                new Particle(self.map, self.x, self.y, 'teleport');
            }
            socket.emit('teleport2', {map: self.map, x: self.x, y: self.y});
        }
    });
    socket.on('teleport2', function() {
        self.teleporting = false;
    });
    const oldonHit = self.onHit;
    self.onHit = function onHit(entity, type) {
        let oldhp = self.hp;
        let ret = oldonHit(entity, type);
        self.trackedData.damageTaken += oldhp-self.hp;
        return ret;
    };
    const oldonDeath = self.onDeath;
    self.onDeath = function onDeath(entity, type, message) {
        oldonDeath(entity, type, message);
        for (let i = 0; i < self.width*self.height/200; i++) {
            new Particle(self.map, self.x+randomRange(-self.width/2, self.width/2), self.y+randomRange(-self.height/2, self.height/2), 'playerdeath');
        }
        self.quests.failQuests('death');
        if (self.currentConversation.id) {
            self.canMove = true;
            self.invincible = false;
            self.currentConversation.id = null;
            if (Npc.list[self.talkingWith]) Npc.list[self.talkingWith].endConversation();
            self.talkingWith = null;
        }
        if (!self.invincible) {
            socket.emit('playerDied');
            self.controls = {
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
            self.attacking = false;
            self.trackedData.deaths++;
        }
    };
    self.respawn = function respawn() {
        self.teleport(ENV.spawnpoint.map, ENV.spawnpoint.x, ENV.spawnpoint.y, ENV.spawnpoint.layer);
        socket.once('teleport2', function() {
            self.hp = self.maxHP;
            self.alive = true;
        });
    };
    socket.on('respawn', function() {
        if (self.alive) {
            self.onDeath();
            insertChat(self.name + ' respawn cheated.', 'anticheat');
            self.leave();
        } else self.respawn();
    });
    self.updateStats = function updateStats() {
        self.stats = {
            damageType: null,
            projectileSpeed: 1,
            attack: 1,
            defense: 0,
            damageReduction: 0,
            knockbackResistance: 0,
            heal: 8,
            speed: 1,
            range: 1,
            accuracy: 0,
            critChance: 0,
            critPower: 1,
            knockback: 0,
            maxPierce: 0
        };
        self.crystalStats = {
            damageType: null,
            projectileSpeed: 1,
            attack: 1,
            speed: 1,
            range: 1,
            accuracy: 1,
            critChance: 0,
            critPower: 1,
            knockback: 0,
            maxPierce: 0
        };
        self.shieldStats = {
            knockbackResistance: 0,
            blockAngle: 0,
            reflectProjectileChance: 0
        };
        self.manaRegenStats = [];
        self.attack = {
            projectile: null,
            projectilePattern: 'single',
            useTime: 0,
            manaCost: 0,
            lastUse: 0,
            second: false
        };
        self.crystal = {
            projectile: null,
            projectilePattern: 'single',
            useTime: 0,
            manaCost: 0,
            lastUse: 0,
            second: true
        };
        self.heldItem.id = null;
        self.heldItem.shield = null;
        self.maxHP = 100;
        self.maxMana = 200;
        self.moveSpeed = 15;
        if (self.inventory.equips.weapon) {
            const item = self.inventory.equips.weapon;
            self.stats.damageType = item.damageType;
            self.stats.attack *= item.damage;
            self.stats.critChance += item.critChance;
            self.stats.critPower += item.critPower;
            self.stats.knockback += item.knockback;
            self.stats.maxPierce = item.maxPierce;
            self.attack.projectile = item.projectile;
            self.attack.projectilePattern = item.projectilePattern;
            self.stats.projectileSpeed = item.projectileSpeed;
            self.stats.range = item.projectileRange;
            self.stats.accuracy = item.accuracy;
            self.attack.useTime = item.useTime;
            self.attack.manaCost = item.manaCost;
            self.heldItem.id = item.id;
        }
        if (self.inventory.equips.crystal) {
            const item = self.inventory.equips.crystal;
            self.crystalStats.damageType = item.damageType;
            self.crystalStats.attack *= item.damage;
            self.crystalStats.critChance += item.critChance;
            self.crystalStats.critPower += item.critPower;
            self.crystalStats.knockback += item.knockback;
            self.crystalStats.maxPierce = item.maxPierce;
            self.crystal.projectile = item.projectile;
            self.crystal.projectilePattern = item.projectilePattern;
            self.crystalStats.projectileSpeed = item.projectileSpeed;
            self.crystalStats.range = item.projectileRange;
            self.crystal.useTime = item.useTime;
            self.crystal.manaCost = item.manaCost;
        }
        if (self.inventory.equips.shield) {
            const item = self.inventory.equips.shield;
            self.shieldStats.knockbackResistance = item.knockbackResistance;
            self.shieldStats.blockAngle = item.blockAngle;
            self.shieldStats.reflectProjectileChance = item.projectileReflectChance;
            self.heldItem.shield = item.id;
        }
        if (self.inventory.equips.key) {
            const item = self.inventory.equips.key;
            self.manaRegenStats.push({
                lastRegen: 0,
                time: item.manaRegenerationSpeed,
                amount: item.manaRegenerationAmount
            });
            self.maxMana += item.manaIncrease;
        }
        for (let i in self.inventory.equips) {
            const localitem = self.inventory.equips[i];
            if (i != 'weapon2' && localitem) {
                for (let j in localitem.effects) {
                    var effect = localitem.effects[j];
                    switch (effect.id) {
                        case 'health':
                            self.maxHP = Math.round(self.maxHP*effect.value);
                            self.hp = Math.min(self.maxHP, self.hp);
                            break;
                        case 'damage':
                            self.stats.attack *= effect.value;
                            self.crystalStats.attack *= effect.value;
                            break;
                        case 'rangedDamage':
                            if (self.stats.damageType == 'ranged') self.stats.attack *= effect.value;
                            if (self.crystalStats.damageType == 'ranged') self.crystalStats.attack *= effect.value;
                            break;
                        case 'meleeDamage':
                            if (self.stats.damageType == 'melee') self.stats.attack *= effect.value;
                            if (self.crystalStats.damageType == 'melee') self.crystalStats.attack *= effect.value;
                            break;
                        case 'magicDamage':
                            if (self.stats.damageType == 'magic') self.stats.attack *= effect.value;
                            if (self.crystalStats.damageType == 'magic') self.crystalStats.attack *= effect.value;
                            break;
                        case 'range':
                            self.stats.range *= effect.value;
                            self.crystalStats.range *= effect.value;
                            break;
                        case 'critChance':
                            self.stats.critChance += effect.value;
                            self.crystalStats.critChance += effect.value;
                            break;
                        case 'critPower':
                            self.stats.critPower *= effect.value;
                            self.crystalStats.critPower *= effect.value;
                            break;
                        case 'damageReduction':
                            self.stats.damageReduction += effect.value;
                            self.crystalStats.damageReduction += effect.value;
                            break;
                        case 'defense':
                            self.stats.defense += effect.value;
                            self.stats.defense = Math.min(self.stats.defense, 1);
                            self.crystalStats.defense += effect.value;
                            self.crystalStats.defense = Math.min(self.crystalStats.defense, 1);
                            break;
                        case 'speed':
                            self.moveSpeed *= effect.value;
                            break;
                        default:
                            error('Invalid item effect ' + effect.id);
                            break;
                    }
                }
            }
        }
        self.moveSpeed = Math.round(self.moveSpeed);
        self.stats.accuracy = 5/(self.stats.accuracy+4)-1;
    };
    self.interact = function interact(x, y) {
        for (let i in DroppedItem.list) {
            var localdroppeditem = DroppedItem.list[i];
            if (self.map == localdroppeditem.map && self.getDistance(localdroppeditem) < 512) {
                if (localdroppeditem.playerId == self.id || localdroppeditem.playerId == null) {
                    var cx = self.x+x;
                    var cy = self.y+y;
                    var left = localdroppeditem.x-localdroppeditem.width/2;
                    var right = localdroppeditem.x+localdroppeditem.width/2;
                    var top = localdroppeditem.y-localdroppeditem.height/2;
                    var bottom = localdroppeditem.y+localdroppeditem.height/2;
                    if (cx >= left && cx <= right && cy >= top && cy <= bottom) {
                        if (!self.inventory.full()) {
                            var res = self.inventory.addItem(localdroppeditem.itemId, localdroppeditem.stackSize, localdroppeditem.enchantments, true);
                            if (typeof res == 'object') {
                                if (localdroppeditem.isLoot) self.trackedData.obtained[localdroppeditem.itemId] = (self.trackedData.obtained[localdroppeditem.itemId] ?? 0) + localdroppeditem.stackSize;
                                delete DroppedItem.list[i];
                            }
                        }
                        return;
                    }
                }
            }
        }
        if (!self.talkingWith) {
            for (let i in Npc.list) {
                var localnpc = Npc.list[i];
                if (self.map == localnpc.map && self.getDistance(localnpc) < 512) {
                    var cx = self.x+x;
                    var cy = self.y+y;
                    var left = localnpc.x-localnpc.width/2;
                    var right = localnpc.x+localnpc.width/2;
                    var top = localnpc.y-localnpc.height/2;
                    var bottom = localnpc.y+localnpc.height/2;
                    if (cx >= left && cx <= right && cy >= top && cy <= bottom) {
                        try {
                            localnpc.clickEvents(self);
                        } catch (err) {
                            error(err);
                        }
                        return;
                    }
                }
            }
        }
    };
    self.prompt = function prompt(id, npcId) {
        self.attacking = false;
        self.shield = false;
        self.heldItem.usingShield = false;
        self.canMove = false;
        self.invincible = true;
        self.controls = {
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
        self.animationDirection = 'facing';
        self.currentConversation.id = id;
        socket.emit('prompt', self.currentConversation);
        self.talkingWith = npcId;
        self.talking = true;
    };
    socket.on('promptChoose', function promptChoose(choice) {
        if (self.currentConversation.id) {
            var option = Npc.dialogues[self.currentConversation.id][self.currentConversation.i].options[choice];
            if (option) {
                var action = option.action;
                if (action == 'continue') {
                    self.currentConversation.i++;
                    self.prompt(self.currentConversation.id, self.talkingWith);
                } else if (action == 'close') {
                    self.canMove = true;
                    self.invincible = false;
                    self.currentConversation.id = null;
                    self.currentConversation.i = 0;
                    if (Npc.list[self.talkingWith]) Npc.list[self.talkingWith].endConversation();
                    self.talkingWith = null;
                    self.talking = false;
                } else if (action.startsWith('prompt_')) {
                    self.currentConversation.i = 0;
                    self.prompt(action.replace('prompt_', ''), self.talkingWith);
                } else if (action.startsWith('quest_')) {
                    self.canMove = true;
                    self.invincible = false;
                    self.currentConversation.id = null;
                    self.currentConversation.i = 0;
                    let id = action.replace('quest_', '');
                    if (self.quests.qualifiesFor(id)) self.quests.startQuest(id);
                    if (Npc.list[self.talkingWith]) Npc.list[self.talkingWith].endConversation();
                    self.talkingWith = null;
                    self.talking = false;
                } else if (action.startsWith('item_')) {
                    self.inventory.addItem(action.replace('item_', '').replace(action.substring(action.indexOf(':'), action.length), ''), action.substring(action.indexOf(':')+1, action.length));
                    self.currentConversation.i++;
                    self.prompt(self.currentConversation.id, self.talkingWith);
                } else if (action.startsWith('shop_')) {
                    self.canMove = true;
                    self.invincible = false;
                    self.currentConversation.id = null;
                    self.currentConversation.i = 0;
                    let params = action.replace('shop_', '').split(':');
                    let npc;
                    for (let i in Npc.list) {
                        if (Npc.list[i].npcId == params[0]) {
                            npc = Npc.list[i];
                            break;
                        }
                    }
                    if (npc) npc.openShop(params[1], self);
                    if (Npc.list[self.talkingWith]) Npc.list[self.talkingWith].endConversation();
                    self.talkingWith = null;
                    self.talking = false;
                } else if (action.startsWith('sellshop_')) {
                    self.canMove = true;
                    self.invincible = false;
                    self.currentConversation.id = null;
                    self.currentConversation.i = 0;
                    let id = action.replace('sellshop_', '');
                    let npc;
                    for (let i in Npc.list) {
                        if (Npc.list[i].npcId == id) {
                            npc = Npc.list[i];
                            break;
                        }
                    }
                    if (npc) npc.openSellShop(self);
                    if (Npc.list[self.talkingWith]) Npc.list[self.talkingWith].endConversation();
                    self.talkingWith = null;
                    self.talking = false;
                } else if (action.startsWith('script_')) {
                    option.script(self);
                    self.currentConversation.i++;
                    self.prompt(self.currentConversation.id, self.talkingWith);
                } else if (action.startsWith('script-end_')) {
                    option.script(self);
                    self.canMove = true;
                    self.invincible = false;
                    self.currentConversation.id = null;
                    self.currentConversation.i = 0;
                    if (Npc.list[self.talkingWith]) Npc.list[self.talkingWith].endConversation();
                    self.talkingWith = null;
                    self.talking = false;
                } else if (action.startsWith('talkedwith_')) {
                    self.canMove = true;
                    self.invincible = false;
                    self.currentConversation.id = null;
                    self.currentConversation.i = 0;
                    self.talkedWith = action.replace('talkedwith_', '');
                    self.talkingWith = null;
                    self.talking = false;
                }
            } else {
                self.kick();
            }
        }
    });
    self.openGaruderWarpMenu = function openGaruderWarpMenu() {
        if (self.alive) socket.emit('openGWSelect', self.garuderWarpPositions);
    };
    socket.on('GWChoose', function(location) {
        if (self.garuderWarpPositions.indexOf(location) != -1) {
            self.garuderTeleport(location);
        } else {
            insertChat(self.name + ' Garuder Warp cheated.', 'anticheat');
            self.kick();
        }
    });
    self.garuderTeleport = function garuderTeleport(location) {
        if (!self.teleporting) {
            self.teleporting = true;
            if (self.inShop) self.shop.close();
            self.canMove = false;
            let warp = GaruderWarp.locations[location];
            self.teleportLocation.map = warp.map;
            self.teleportLocation.x = warp.x;
            self.teleportLocation.y = warp.y;
            self.teleportLocation.layer = warp.layer;
            for (let i = 0; i < 40; i++) {
                new Particle(self.map, self.x, self.y, 'garuderWarp1');
            }
            socket.emit('gteleport1');
        }
    };
    socket.on('gteleport1', function() {
        if (self.teleporting) {
            for (let i = 0; i < 20; i++) {
                new Particle(self.map, self.x, self.y, 'garuderWarp2');
            }
            self.map = self.teleportLocation.map;
            self.x = self.teleportLocation.x;
            self.y = self.teleportLocation.y;
            self.layer = self.teleportLocation.layer;
            self.gridx = Math.floor(self.x/64);
            self.gridy = Math.floor(self.y/64);
            self.chunkx = Math.floor(self.gridx/Collision.grid[self.map].chunkWidth);
            self.chunky = Math.floor(self.gridy/Collision.grid[self.map].chunkHeight);
            self.canMove = true;
            setTimeout(function() {
                for (let i = 0; i < 40; i++) {
                    new Particle(self.map, self.x, self.y, 'garuderWarp2');
                }
                socket.emit('teleport2', {map: self.map, x: self.x, y: self.y});
            }, 500);
        }
    });
    self.spectate = function spectate(name) {
        self.spectating = null;
        for (let i in Player.list) {
            if (Player.list[i].name === name) self.spectating = i; 
        }
        return self.spectating;
    };
    self.saveData = async function saveData() {
        self.playTime += Date.now()-self.loginTime;
        const trackedData = cloneDeep(self.trackedData);
        delete trackedData.last;
        let progress = {
            inventory: self.inventory.getSaveData(),
            characterStyle: self.characterStyle,
            progress: {
                level: self.xpLevel,
                xp: self.xp
            },
            quests: self.quests.getSaveData(),
            trackedData: trackedData,
            spawnpoint: 0,
            garuderWarpPositions: self.garuderWarpPositions,
            lastLogin: Date.now(),
            playTime: self.playTime,
            saveFormat: 3
        };
        const data = JSON.stringify(progress);
        await ACCOUNTS.saveProgress(self.creds.username, await RSAdecode(self.creds.password), data);
    };
    self.loadData = async function loadData() {
        const data = await ACCOUNTS.loadProgress(self.creds.username, await RSAdecode(self.creds.password));
        const progress = JSON.parse(data);
        if (progress) {
            if (progress.saveFormat == null) { // support for accounts < v0.10.0
                self.inventory.loadSaveData(progress);
                self.inventory.refresh();
            } else if (progress.saveFormat == 1) {
                try {
                    self.inventory.loadSaveData(progress.inventory);
                    self.inventory.refresh();
                    self.characterStyle = progress.characterStyle;
                    self.characterStyle.texture = null;
                    self.xpLevel = progress.progress.xpLevel;
                    self.xp = progress.progress.xp;
                    self.quests.loadSaveData(progress.quests);
                    for (let i in progress.trackedData) {
                        self.trackedData[i] = progress.trackedData[i];
                    }
                    self.trackedData.monstersKilled = Array.from(self.trackedData.monstersKilled);
                    self.trackedData.last = {};
                    self.trackedData.last = cloneDeep(self.trackedData);
                    self.trackedData.updateTrackers();
                } catch (err) {
                    error(err);
                }
            } else if (progress.saveFormat == 2) {
                try {
                    self.inventory.loadSaveData(progress.inventory);
                    self.inventory.refresh();
                    self.characterStyle = progress.characterStyle;
                    self.characterStyle.texture = null;
                    self.xpLevel = progress.progress.xpLevel;
                    self.xp = progress.progress.xp;
                    self.quests.loadSaveData(progress.quests);
                    for (let i in progress.trackedData) {
                        self.trackedData[i] = progress.trackedData[i];
                    }
                    self.trackedData.monstersKilled = Array.from(self.trackedData.monstersKilled);
                    self.trackedData.last = {};
                    self.trackedData.last = cloneDeep(self.trackedData);
                    self.trackedData.updateTrackers();
                    self.playTime = progress.playTime;
                } catch (err) {
                    error(err);
                }
            } else if (progress.saveFormat == 3) {
                try {
                    self.inventory.loadSaveData(progress.inventory);
                    self.inventory.refresh();
                    self.characterStyle = progress.characterStyle;
                    self.characterStyle.texture = null;
                    self.xpLevel = progress.progress.xpLevel;
                    self.xp = progress.progress.xp;
                    self.quests.loadSaveData(progress.quests);
                    for (let i in progress.trackedData) {
                        self.trackedData[i] = progress.trackedData[i];
                    }
                    self.trackedData.monstersKilled = Array.from(self.trackedData.monstersKilled);
                    self.trackedData.last = {};
                    self.trackedData.last = cloneDeep(self.trackedData);
                    self.trackedData.updateTrackers();
                    self.garuderWarpPositions = progress.garuderWarpPositions;
                    self.playTime = progress.playTime;
                } catch (err) {
                    error(err);
                }
            } else {
                warn('Unknown save format ' + progress.saveFormat + '! Data loss imminent!');
            }
        } else {
            socket.emit('item', {
                action: 'maxItems',
                slots: self.inventory.maxItems
            });
            self.inventory.refresh();
        }
        for (let i in ENV.ops) {
            if (self.name == ENV.ops[i]) self.chatStyle = 'color: #28EB57;';
        }
        for (let i in ENV.devs) {
            if (self.name == ENV.devs[i]) self.chatStyle = 'color: #6BFF00;';
        }
        if (self.name == 'Sampleprovider(sp)') self.chatStyle = 'color: #3C70FF;';
        if (self.name == 'sp') self.chatStyle = 'color: #FF0090;';
        self.updateStats();
        var noWeapon = true;
        for (let i in self.inventory.items) {
            if (self.inventory.items[i] && self.inventory.items[i].slotType == 'weapon') noWeapon = false;
        }
        if (self.inventory.equips['weapon']) noWeapon = false;
        if (self.inventory.equips['weapon2']) noWeapon = false;
        if (noWeapon) {
            self.inventory.addItem('simplewoodenbow');
        }
    };
    socket.on('disconnect', function() {
        clearInterval(signupspamcheck);
        clearInterval(spamcheck);
    });
    socket.on('disconnected', function() {
        clearInterval(signupspamcheck);
        clearInterval(spamcheck);
    });
    socket.on('timeout', function() {
        clearInterval(signupspamcheck);
        clearInterval(spamcheck);
    });
    socket.on('error', function() {
        clearInterval(signupspamcheck);
        clearInterval(spamcheck);
    });
    self.updateChunkLocation = function updateChunkLocation() {
        if (self.map != self.chunkLocation.map || self.layer != self.chunkLocation.layer || self.chunkx != self.chunkLocation.chunkx || self.chunky != self.chunkLocation.chunky) {
            if (Player.chunks[self.chunkLocation.map] && Player.chunks[self.chunkLocation.map][self.chunkLocation.layer] && Player.chunks[self.chunkLocation.map][self.chunkLocation.layer][self.chunkLocation.chunky] && Player.chunks[self.chunkLocation.map][self.chunkLocation.layer][self.chunkLocation.chunky][self.chunkLocation.chunkx]) delete Player.chunks[self.chunkLocation.map][self.chunkLocation.layer][self.chunkLocation.chunky][self.chunkLocation.chunkx][self.id];
            self.chunkLocation = {
                map: self.map,
                layer: self.layer,
                chunkx: self.chunkx,
                chunky: self.chunky
            };
            if (Player.chunks[self.chunkLocation.map] == null) Player.chunks[self.chunkLocation.map] = [];
            if (Player.chunks[self.chunkLocation.map][self.chunkLocation.layer] == null) Player.chunks[self.chunkLocation.map][self.chunkLocation.layer] = [];
            if (Player.chunks[self.chunkLocation.map][self.chunkLocation.layer][self.chunkLocation.chunky] == null) Player.chunks[self.chunkLocation.map][self.chunkLocation.layer][self.chunkLocation.chunky] = [];
            if (Player.chunks[self.chunkLocation.map][self.chunkLocation.layer][self.chunkLocation.chunky][self.chunkLocation.chunkx] == null) Player.chunks[self.chunkLocation.map][self.chunkLocation.layer][self.chunkLocation.chunky][self.chunkLocation.chunkx] = [];
            Player.chunks[self.chunkLocation.map][self.chunkLocation.layer][self.chunkLocation.chunky][self.chunkLocation.chunkx][self.id] = self;
        }
    };
    self.disconnect = async function disconnect() {
        if (self && !self.disconnected) {
            self.disconnected = true;
            clearInterval(signupspamcheck);
            clearInterval(spamcheck);
            if (self.name) {
                await self.saveData();
                insertChat(self.name + ' left the game', 'server');
            }
            delete Player.list[self.id];
            if (Player.chunks[self.chunkLocation.map] && Player.chunks[self.chunkLocation.map][self.chunkLocation.layer] && Player.chunks[self.chunkLocation.map][self.chunkLocation.layer][self.chunkLocation.chunky] && Player.chunks[self.chunkLocation.map][self.chunkLocation.layer][self.chunkLocation.chunky][self.chunkLocation.chunkx]) delete Player.chunks[self.chunkLocation.map][self.chunkLocation.layer][self.chunkLocation.chunky][self.chunkLocation.chunkx][self.id];
            else error('Could not delete player from chunks!');
            socket.emit('disconnected');
            socket.removeAllListeners();
            socket.onevent = function(packet) {};
            socket.disconnect();
        }
    };
    self.socketKick = async function socketKick() {
        if (self && !self.disconnected) {
            self.disconnected = true;
            clearInterval(signupspamcheck);
            clearInterval(spamcheck);
            if (self.name) {
                await self.saveData();
                insertChat(self.name + ' was kicked for socket.emit', 'anticheat');
            }
            delete Player.list[self.id];
            if (Player.chunks[self.chunkLocation.map] && Player.chunks[self.chunkLocation.map][self.chunkLocation.layer] && Player.chunks[self.chunkLocation.map][self.chunkLocation.layer][self.chunkLocation.chunky] && Player.chunks[self.chunkLocation.map][self.chunkLocation.layer][self.chunkLocation.chunky][self.chunkLocation.chunkx]) delete Player.chunks[self.chunkLocation.map][self.chunkLocation.layer][self.chunkLocation.chunky][self.chunkLocation.chunkx][self.id];
            else error('Could not delete player from chunks!');
            socket.emit('disconnected');
            socket.removeAllListeners();
            socket.onevent = function(packet) {};
            socket.disconnect();
        }
    };
    self.leave = function leave() {
        if (self && !self.disconnected) {
            self.toDisconnect = true;
            socket.emit('disconnected');
            socket.removeAllListeners();
            socket.onevent = function(packet) {};
            socket.disconnect();
        }
    };
    self.kick = function kick() {
        if (self && !self.disconnected) {
            self.toKick = true;
            socket.emit('disconnected');
            socket.removeAllListeners();
            socket.onevent = function(packet) {};
            socket.disconnect();
        }
    };

    Player.list[self.id] = self;
    self.updateChunkLocation();
    return self;
};
Player.update = function update() {
    const pack = [];
    for (let i in Player.list) {
        let localplayer = Player.list[i];
        if (localplayer.toDisconnect) {
            localplayer.disconnect();
            continue;
        }
        if (localplayer.toKick) {
            localplayer.socketKick();
            continue;
        }
        if (localplayer.name) {
            localplayer.update();
            pack.push({
                id: localplayer.id,
                map: localplayer.map,
                x: localplayer.x,
                y: localplayer.y,
                layer: localplayer.layer,
                name: localplayer.name,
                animationStage: localplayer.animationStage,
                characterStyle: localplayer.characterStyle,
                hp: localplayer.hp,
                maxHP: localplayer.maxHP,
                heldItem: localplayer.heldItem,
                isNPC: false
            });
        }
    }

    return pack;
};
Player.getDebugData = function getDebugData() {
    const pack = [];
    for (let i in Player.list) {
        let localplayer = Player.list[i];
        if (localplayer.name) {
            pack.push({
                map: localplayer.map,
                x: localplayer.x,
                y: localplayer.y,
                width: localplayer.width,
                height: localplayer.height,
                collisionBoxSize: localplayer.collisionBoxSize,
                controls: localplayer.controls,
            });
        }
    }

    return pack;
};
Player.list = [];
Player.chunks = [];
Player.usePatterns = {
    single: function usePattern_single(self, attack, stats, angle) {
        new Projectile(attack.projectile, angle+randomRange(-stats.accuracy/2, stats.accuracy/2), stats, self.id);
    },
    triple: function usePattern_triple(self, attack, stats, angle) {
        let angle2 = angle+randomRange(-stats.accuracy/2, stats.accuracy/2);
        new Projectile(attack.projectile, angle2-degrees(20), stats, self.id);
        new Projectile(attack.projectile, angle2, stats, self.id);
        new Projectile(attack.projectile, angle2+degrees(20), stats, self.id);
    },
    spray: function usePattern_spray(self, attack, stats, angle) {
        for (let i = 0; i < 3; i++) {
            new Projectile(attack.projectile, angle+randomRange(degrees(-15), degrees(15)), stats, self.id);
        }
    },
    spray2: function usePattern_spray2(self, attack, stats, angle) {
        for (let i = 0; i < 5; i++) {
            new Projectile(attack.projectile, angle+randomRange(degrees(-25), degrees(25)), stats, self.id);
        }
    },
    line: function usePattern_line(self, attack, stats, angle) {
        let angle2 = angle+randomRange(-stats.accuracy/2, stats.accuracy/2);
        new Projectile(attack.projectile, angle2, stats, self.id);
        new Projectile(attack.projectile, angle2-degrees(180), stats, self.id);
    },
    triangle: function usePattern_triangle(self, attack, stats, angle) {
        let angle2 = angle+randomRange(-stats.accuracy/2, stats.accuracy/2);
        new Projectile(attack.projectile, angle2-degrees(120), stats, self.id);
        new Projectile(attack.projectile, angle2, stats, self.id);
        new Projectile(attack.projectile, angle2+degrees(120), stats, self.id);
    },
    ring: function usePattern_ring(self, attack, stats, angle) {
        let angle2 = angle+randomRange(-stats.accuracy/2, stats.accuracy/2);
        new Projectile(attack.projectile, angle2, stats, self.id);
        new Projectile(attack.projectile, angle2-degrees(36), stats, self.id);
        new Projectile(attack.projectile, angle2-degrees(72), stats, self.id);
        new Projectile(attack.projectile, angle2-degrees(108), stats, self.id);
        new Projectile(attack.projectile, angle2-degrees(144), stats, self.id);
        new Projectile(attack.projectile, angle2-degrees(180), stats, self.id);
        new Projectile(attack.projectile, angle2-degrees(216), stats, self.id);
        new Projectile(attack.projectile, angle2-degrees(252), stats, self.id);
        new Projectile(attack.projectile, angle2-degrees(288), stats, self.id);
        new Projectile(attack.projectile, angle2-degrees(324), stats, self.id);
    },
    nearest: function usePattern_nearest(self, attack, stats, angle) {
        let lowest, target;
        self.searchChunks(Monster.chunks[self.map], 1, function(monster, id) {
            if (lowest == null || (self.getGridDistance(monster) < 20 && self.getGridDistance(monster) < self.getGridDistance(Monster.list[lowest]) && monster.alive)) lowest = id;
        });
        target = Monster.list[lowest];
        target && new Projectile(attack.projectile, 0, stats, self.id, target.x, target.y);
    },
    mouse: function usePattern_mouse(self, attack, stats, angle) {
        new Projectile(attack.projectile, 0, stats, self.id, self.x+self.mouseX, self.y+self.mouseY);
    }
};

// monsters
Monster = function(type, x, y, map, layer, params) {
    const self = new Rig();
    self.entType = 'monster';
    self.x = x;
    self.y = y;
    self.map = map;
    if (layer != null) self.layer = layer;
    self.gridx = Math.floor(self.x/64);
    self.gridy = Math.floor(self.y/64);
    self.chunkx = Math.floor(self.gridx/Collision.grid[self.map].chunkWidth);
    self.chunky = Math.floor(self.gridy/Collision.grid[self.map].chunkHeight);
    self.updateChunkLocation();
    self.animationDirection = 'loop';
    self.ai.attackType = 'none';
    self.ai.lastAttack = 0;
    self.ai.attackStage = 0;
    self.ai.attackTime = 0;
    self.ai.fleeing = false;
    self.ai.fleeThreshold = 0;
    self.ai.inNomonsterRegion = false;
    self.ai.lastTracked = 0;
    self.targetMonsters = false;
    self.dropItems = true;
    try {
        let tempmonster = Monster.types[type];
        self.type = type;
        self.name = tempmonster.name;
        self.stats = cloneDeep(tempmonster.stats);
        self.stats.accuracy = 5/(self.stats.accuracy+4)-1;
        self.moveSpeed = tempmonster.moveSpeed;
        self.width = tempmonster.width;
        self.height = tempmonster.height;
        self.ai.attackType = tempmonster.attackType;
        self.ai.attackTime = 0;
        self.ai.maxRange = tempmonster.aggroRange;
        self.ai.targetHold = tempmonster.deaggroTime;
        self.ai.chaseTarget = tempmonster.chaseTarget;
        self.ai.circleTarget = tempmonster.circleTarget;
        self.ai.circleDistance = tempmonster.circleDistance;
        self.ai.circleDirection = -0.2;
        self.ai.idleMove = tempmonster.idleMove;
        self.hp = tempmonster.hp;
        self.ai.fleeThreshold = tempmonster.fleeThreshold;
        self.ai.swarmBehavior = tempmonster.swarm;
        self.maxHP = tempmonster.hp;
        self.touchDamage = tempmonster.touchDamage;
        self.xpDrop = tempmonster.xpDrop;
        self.drops = tempmonster.drops;
        self.animationLength = tempmonster.animationLength;
        self.animationSpeed = tempmonster.animationSpeed;
        self.boss = tempmonster.boss;
        if (self.boss) {
            self.ai.boss = {
                data: tempmonster.bossData,
                currentStage: 0,
                currentAttack: 0,
                attackTimer: 0,
                attackTime: 0,
                pendingEvents: [],
                stageTimer: 0
            };
            self.bcDeath = true;
        }
        else if (typeof Monster.attacks[self.ai.attackType] != 'function') {
            error('Invalid monster attack type "' + self.ai.attackType + '"');
            return;
        }
        delete tempmonster;
    } catch (err) {
        error(err);
        return false;
    }
    self.characterStyle = {
        texture: null
    };
    self.collisionBoxSize = Math.max(self.width, self.height);
    self.active = false;
    if (params) {
        for (let i in params) {
            self[i] = params[i];
        }
    }

    self.update = function update() {
        self.active = false;
        self.searchChunks(Player.chunks[self.map], 2, function(player, id) {
            self.active = true;
            return true;
        });
        if (self.stats.heal != 0) {
            self.lastAutoHeal++;
            if (self.lastAutoHeal >= self.stats.heal && self.hp < self.maxHP && self.alive) {
                self.hp = Math.min(self.hp+1, self.maxHP);
                self.lastAutoHeal = 0;
            }
        }
        if (self.active) {
            self.updateAggro();
            if (self.canMove) self.updatePos();
            if (self.alive && Player.chunks[self.map] && Player.chunks[self.map][self.layer]) {
                let range = Math.ceil(self.collisionBoxSize/(128*Math.max(Collision.grid[self.map].chunkWidth, Collision.grid[self.map].chunkHeight)));
                for (let y = self.chunky-range; y <= self.chunky+range; y++) {
                    for (let x = self.chunkx-range; x <= self.chunkx+range; x++) {
                        if (Player.chunks[self.map][self.layer][y] && Player.chunks[self.map][self.layer][y][x]) {
                            for (let i in Player.chunks[self.map][self.layer][y][x]) {
                                Player.chunks[self.map][self.layer][y][x][i].alive && self.collideWith(Player.chunks[self.map][self.layer][y][x][i]) && Player.chunks[self.map][self.layer][y][x][i].onHit(self, 'touch');
                            }
                        }
                    }
                }
            }
            if (self.boss) {
                const stage = self.ai.boss.data.stages[self.ai.boss.currentStage]
                switch (stage.endTrigger.type) {
                    case 'hp':
                        if (self.hp < stage.endTrigger.data.min) {
                            self.ai.boss.currentStage = Math.min(self.ai.boss.currentStage+1, self.ai.boss.data.stages.length-1);
                        }
                        break;
                    case 'step':
                        if (self.ai.boss.stageTimer == 0) {
                            for (let attack of stage.attacks) {
                                typeof Monster.bossAttacks[attack.action.formation] == 'function' && Monster.bossAttacks[attack.action.formation](self, attack.action.type, attack.action.data);
                                typeof Monster.bossAttacks[attack.action.formation] != 'function' && error('Invalid boss attack type "' + attack.action.formation + '"');
                            }
                        }
                        self.ai.boss.stageTimer++;
                        self.ai.boss.attackTimer = -1;
                        if (self.ai.boss.stageTimer >= stage.endTrigger.data.time) {
                            self.ai.boss.stageTimer = 0;
                            self.ai.boss.currentStage = Math.min(self.ai.boss.currentStage+1, self.ai.boss.data.stages.length-1);
                        }
                        break;
                    default:
                        error('Invalid boss stage trigger "' + stage.endTrigger.type + '" for boss "' + self.type + '"');
                        self.onDeath(self, 'debug');
                }
            }
            self.attack();
            self.updateEffects();
            self.updateAnimation();
        }
        for (let i in self.invincibilityFrames) {
            self.invincibilityFrames[i]--;
            self.invincibilityFrames[i] < 1 && delete self.invincibilityFrames[i];
        }
    };
    self.updatePos = function updatePos() {
        self.ai.lastPath++;
        if (self.ai.lastPath >= seconds(1/ENV.pathfindUpdateSpeed)) {
            self.ai.lastPath = 0;
            self.ai.path = [];
            if (self.ai.inNomonsterRegion) {
                var closest = {
                    x: null,
                    y: null
                };
                let range = self.ai.maxRange/2;
                for (let x = self.gridx-range; x < self.gridx+range; x++) {
                    for (let y = self.gridy-range; y < self.gridy+range; y++) {
                        if (Region.grid[self.map][y] && Region.grid[self.map][y][x] && Region.grid[self.map][y][x].nomonster == false) {
                            if (closest.x == null || self.getGridDistance({x: x, y: y}) < self.getGridDistance(closest)) closest = {
                                x: x,
                                y: y
                            };
                        }
                    }
                }
                if (closest) {
                    self.ai.posTarget = closest;
                    self.ai.pathtoPos();
                }
            } else if (self.ai.entityTarget) {
                if (self.ai.fleeing) {
                    try {
                        var offsetx = self.gridx-self.ai.maxRange-1;
                        var offsety = self.gridy-self.ai.maxRange-1;
                        var size = self.ai.maxRange*2+1;
                        var grid = [];
                        for (let y = 0; y < size; y++) {
                            grid[y] = [];
                            for (let x = 0; x < size; x++) {
                                grid[y][x] = {
                                    g: 0,
                                    h: 0,
                                    f: 0,
                                    x: x+offsetx,
                                    y: y+offsety
                                };
                            }
                        }
                        for (let y = 0; y < size; y++) {
                            for (let x = 0; x < size; x++) {
                                var checkx = x+offsetx;
                                var checky = y+offsety;
                                grid[y][x].h = Math.sqrt((self.gridx-checkx)**2+(self.gridy-checky)**2);
                                grid[y][x].g = Math.sqrt((self.ai.entityTarget.gridx-checkx)**2+(self.ai.entityTarget.gridy-checky)**2);
                                if (Collision.grid[self.map][self.layer][checky] && Collision.grid[self.map][self.layer][checky][checkx]) {
                                    grid[y][x].g = 999;
                                }
                                if (Region.grid[self.map] && Region.grid[self.map][Math.floor(y)] && Region.grid[self.map][Math.floor(y)][Math.floor(x)] && Region.grid[self.map][Math.floor(y)][Math.floor(x)].nomonster) {
                                    grid[y][x].g = 999;
                                }
                                grid[y][x].f = grid[y][x].h-grid[y][x].g;
                            }
                        }
                        var best = null;
                        for (let y in grid) {
                            for (let x in grid) {
                                if (best == null || grid[y][x].f < best.f) best = grid[y][x];
                            }
                        }
                        if (best) {
                            self.ai.posTarget.x = best.x;
                            self.ai.posTarget.y = best.y;
                            self.ai.pathtoPos();
                        }
                    } catch (err) {
                        error(err);
                    }
                } else if (self.ai.circleTarget && self.getGridDistance(self.ai.entityTarget) < (self.ai.circleDistance+1)*64 && !self.rayCast(self.ai.entityTarget)) {
                    try {
                        var target = self.ai.entityTarget;
                        var angle = target.getAngle(self);
                        var x = target.gridx*64+Math.round((Math.cos(angle)*self.ai.circleDistance)*64);
                        var y = target.gridy*64+Math.round((Math.sin(angle)*self.ai.circleDistance)*64);
                        angle = target.getAngle({x: x, y: y});
                        var oldangle = angle;
                        angle += self.ai.circleDirection;
                        x = target.gridx*64+Math.round((Math.cos(angle)*self.ai.circleDistance)*64);
                        y = target.gridy*64+Math.round((Math.sin(angle)*self.ai.circleDistance)*64);
                        var invalid = false;
                        if (self.rayCast({x: x, y: y})) invalid = true; 
                        if (Math.random() <= 0.02) invalid = true;
                        if (invalid) {
                            angle = oldangle;
                            self.ai.circleDirection *= -1;
                            angle += self.ai.circleDirection;
                            x = target.gridx*64+Math.round((Math.cos(angle)*self.ai.circleDistance)*64);
                            y = target.gridy*64+Math.round((Math.sin(angle)*self.ai.circleDistance)*64);
                        }
                        self.ai.posTarget.x = target.gridx+Math.round(Math.cos(angle)*self.ai.circleDistance);
                        self.ai.posTarget.y = target.gridy+Math.round(Math.sin(angle)*self.ai.circleDistance);
                        self.ai.pathtoPos();
                    } catch (err) {
                        error(err);
                    }
                } else if (self.ai.chaseTarget) {
                    self.ai.pathtoEntity();
                }
            } else if (self.ai.idleMove != 'none') {
                self.ai.pathIdle();
            } else {
                self.ai.path = [];
            }
        }
        if (!self.canMove || self.stunned) {
            self.xmove = 0;
            self.ymove = 0;
        }
        self.xspeed = Math.round(self.xmove+self.xknockback);
        self.yspeed = Math.round(self.ymove+self.yknockback);
        self.collide();
        self.xknockback *= 0.25;
        self.yknockback *= 0.25;
        if (0-Math.abs(self.xknockback) > -0.5) self.xknockback = 0;
        if (0-Math.abs(self.yknockback) > -0.5) self.yknockback = 0;
        if (self.ai.chargeTime != -1) {
            self.ai.charge.time -= 1;
            if (self.ai.charge.time < 0) {
                self.ai.charge.time = 0;
                self.ai.charge.x *= 0.5;
                self.ai.charge.y *= 0.5;
                if (Math.abs(self.ai.charge.x) < 0.5 || Math.abs(self.ai.charge.y) < 0.5) {
                    self.ai.charge.x = 0;
                    self.ai.charge.y = 0;
                    self.ai.charge.time = -1;
                }
            }
        }
        let foundregion = false;
        if (Region.grid[self.map][self.gridy] && Region.grid[self.map][self.gridy][self.gridx] && Region.grid[self.map][self.gridy][self.gridx].name != self.region.name) {
            self.region = Region.grid[self.map][self.gridy][self.gridx];
            self.onRegionChange();
        }
        if (Region.grid[self.map][self.gridy] && Region.grid[self.map][self.gridy][self.gridx]) foundregion = true;
        if (!foundregion && self.region.name != 'The Wilderness') {
            self.region = {
                name: 'The Wilderness',
                noattack: false,
                nomonster: false
            };
            self.onRegionChange();
        }
        if (Teleporter.grid[self.map][self.gridy] && Teleporter.grid[self.map][self.gridy][self.gridx] && Teleporter.grid[self.map][self.gridy][self.gridx]) {
            if (self.yspeed != 0 || self.xspeed != 0) {
                let direction = Teleporter.grid[self.map][self.gridy][self.gridx].direction;
                if ((direction == 'up' && self.yspeed < 0) || (direction == 'down' && self.yspeed > 0) || (direction == 'left' && self.xspeed < 0) || (direction == 'right' && self.xspeed > 0)) {
                    self.teleport(Teleporter.grid[self.map][self.gridy][self.gridx].map, Teleporter.grid[self.map][self.gridy][self.gridx].x, Teleporter.grid[self.map][self.gridy][self.gridx].y, Teleporter.grid[self.map][self.gridy][self.gridx].layer);
                }
            }
        }
    };
    self.updateAggro = function updateAggro() {
        self.ai.lastTracked++;
        if (self.targetMonsters) {
            let lowest;
            self.searchChunks(Monster.chunks[self.map], Math.ceil(self.ai.maxRange/(64*Math.max(Collision.grid[self.map].chunkWidth, Collision.grid[self.map].chunkHeight))), function(monster, id) {
                if (self.getGridDistance(monster) < self.ai.maxRange && (!self.rayCast(monster) || self.getGridDistance(monster) < 4) && !monster.region.nomonster && monster.alive && (lowest == null || self.getGridDistance(monster) < self.getGridDistance(Monster.list[lowest]))) lowest = id;
            });
            if (lowest && !self.ai.fleeing) {
                self.ai.entityTarget = Monster.list[lowest];
                self.ai.lastTracked = 0;
            }
            if (self.ai.lastTracked > seconds(self.ai.targetHold)) {
                self.ai.entityTarget = null;
            }
            if (self.ai.entityTarget && !self.ai.entityTarget.alive) self.ai.entityTarget = null;
        } else {
            let lowest;
            self.searchChunks(Player.chunks[self.map], Math.ceil(self.ai.maxRange/(64*Math.max(Collision.grid[self.map].chunkWidth, Collision.grid[self.map].chunkHeight))), function(player, id) {
                if (self.getGridDistance(player) < self.ai.maxRange  && (!self.rayCast(player) || self.getGridDistance(player) < 4) && !player.region.nomonster && player.alive && (lowest == null || self.getGridDistance(player) < self.getGridDistance(Player.list[lowest]))) lowest = id;
            });
            if (lowest && !self.ai.fleeing) {
                self.ai.entityTarget = Player.list[lowest];
                self.ai.lastTracked = 0;
            }
            if (self.ai.lastTracked > seconds(self.ai.targetHold)) {
                self.ai.entityTarget = null;
            }
            if (self.ai.entityTarget && !self.ai.entityTarget.alive) self.ai.entityTarget = null;
        }
        !self.ai.entityTarget && self.searchChunks(Monster.chunks[self.map], 1, function(monster, id) {
            if (monster.type == self.type && self.getGridDistance(monster) < 16) {
                self.ai.entityTarget = monster.ai.entityTarget;
                return true;
            }
        });
    };
    self.attack = function attack() {
        if (self.boss) {
            for (let event of self.ai.boss.pendingEvents) {
                event.timer--;
                if (event.timer <= 0) {
                    event.callback();
                    self.ai.boss.pendingEvents.splice(self.ai.boss.pendingEvents.indexOf(event), 1);
                }
            }
            self.ai.boss.attackTimer++;
            if (self.ai.boss.attackTimer > self.ai.boss.attackTime && self.ai.entityTarget) {
                self.ai.boss.attackTimer = 0;
                const stage = self.ai.boss.data.stages[self.ai.boss.currentStage];
                let multiplier = 0;
                for (let attack of stage.attacks) multiplier += attack.chance;
                let random = randomRange(0, multiplier);
                let min = 0;
                let max = 0;
                let index;
                for (let i in stage.attacks) {
                    max += stage.attacks[i].chance;
                    if (random >= min && random <= max) {
                        index = i;
                        break;
                    }
                    min += stage.attacks[i].chance;
                }
                let attack = stage.attacks[index];
                self.ai.boss.attackTime = attack.time;
                typeof Monster.bossAttacks[attack.action.formation] == 'function' && Monster.bossAttacks[attack.action.formation](self, attack.action.type, attack.action.data);
                typeof Monster.bossAttacks[attack.action.formation] != 'function' && error('Invalid boss attack type "' + attack.action.formation + '"');
            }
        } else {
            self.ai.lastAttack++;
            Monster.attacks[self.ai.attackType](self);
        }
    };
    const oldOnHit = self.onHit;
    self.onHit = function onHit(entity, type) {
        let ret = oldOnHit(entity, type);
        var parent;
        if (entity.parentIsPlayer) parent = Player.list[entity.parentID];
        else parent = Monster.list[entity.parentID];
        if (parent && !self.invincible) {
            self.ai.entityTarget = parent;
            self.ai.lastTracked = 0;
        }
        if (self.hp < self.ai.fleeThreshold) self.ai.fleeing = true;
        return ret;
    };
    const oldOnDeath = self.onDeath;
    self.onDeath = function onDeath(entity, type, message) {
        self.bcDeath = ENV.broadcastMonsterDeaths;
        oldOnDeath(entity, type, message);
        if (entity && entity.entType == 'player') {
            entity.xp += self.xpDrop;
            let found = false;
            for (let i in entity.trackedData.monstersKilled) {
                if (entity.trackedData.monstersKilled[i].id == self.type) {
                    entity.trackedData.monstersKilled[i].count++;
                    found = true;
                }
            }
            if (!found) {
                entity.trackedData.monstersKilled.push({
                    id: self.type,
                    count: 1
                });
            }
            if (self.boss) entity.trackedData.bossesSlain++;
        }
        if (self.dropItems) {
            try {
                let multiplier = 0;
                for (let chance of Array.from(self.drops.chance)) multiplier += chance;
                let random = randomRange(0, multiplier);
                let min = 0;
                let max = 0;
                var items = [];
                for (let i in self.drops.chance) {
                    max += self.drops.chance[i];
                    if (random >= min && random <= max) {
                        items[i] = 1;
                        break;
                    }
                    min += self.drops.chance[i];
                }
                for (let i in self.drops.amount) {
                    items[i] = Math.round(Math.random()**1.2*self.drops.amount[i]);
                }
                for (let i in self.drops.constant) {
                    items[i] = self.drops.constant[i];
                }
                var id;
                if (entity) id = entity.id;
                for (let i in items) {
                    if (i != 'nothing' && items[i] != 0) {
                        let attempts = 0;
                        let dropx, dropy;
                        let collisions = [];
                        if (Collision.grid[self.map]) {
                            for (let checkx = self.gridx-1; checkx <= self.gridx+1; checkx++) {
                                for (let checky = self.gridy-1; checky <= self.gridy+1; checky++) {
                                    if (Collision.grid[self.map][checky] && Collision.grid[self.map][checky][checkx])
                                    collisions.push(Collision.getColEntity(self.map, checkx, checky));
                                }
                            }
                        }
                        while (attempts < 100) {
                            let angle = randomRange(-Math.PI, Math.PI);
                            let distance = randomRange(0, 32);
                            let x = self.x+Math.cos(angle)*distance;
                            let y = self.y+Math.sin(angle)*distance;
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
                        if (dropx) new DroppedItem(self.map, dropx, dropy, i, [], items[i], id, true);
                    }
                }
            } catch (err) {
                error(err);
            }
        }
        delete Monster.list[self.id];
        if (Monster.chunks[self.chunkLocation.map] && Monster.chunks[self.chunkLocation.map][self.chunkLocation.layer] && Monster.chunks[self.chunkLocation.map][self.chunkLocation.layer][self.chunkLocation.chunky] && Monster.chunks[self.chunkLocation.map][self.chunkLocation.layer][self.chunkLocation.chunky][self.chunkLocation.chunkx]) delete Monster.chunks[self.chunkLocation.map][self.chunkLocation.layer][self.chunkLocation.chunky][self.chunkLocation.chunkx][self.id];
        else error('Could not delete monster from chunks!');
    };
    self.onRegionChange = function onRegionChange() {
        if (self.region.nomonster) {
            self.ai.inNomonsterRegion = true;
            self.ai.entityTarget = null;
            self.ai.posTarget = null;
            self.ai.path = [];
        } else {
            self.ai.inNomonsterRegion = false;
        }
    };
    self.updateChunkLocation = function updateChunkLocation() {
        if (self.map != self.chunkLocation.map || self.layer != self.chunkLocation.layer || self.chunkx != self.chunkLocation.chunkx || self.chunky != self.chunkLocation.chunky) {
            if (Monster.chunks[self.chunkLocation.map] && Monster.chunks[self.chunkLocation.map][self.chunkLocation.layer] && Monster.chunks[self.chunkLocation.map][self.chunkLocation.layer][self.chunkLocation.chunky] && Monster.chunks[self.chunkLocation.map][self.chunkLocation.layer][self.chunkLocation.chunky][self.chunkLocation.chunkx]) delete Monster.chunks[self.chunkLocation.map][self.chunkLocation.layer][self.chunkLocation.chunky][self.chunkLocation.chunkx][self.id];
            self.chunkLocation = {
                map: self.map,
                layer: self.layer,
                chunkx: self.chunkx,
                chunky: self.chunky
            };
            if (Monster.chunks[self.chunkLocation.map] == null) Monster.chunks[self.chunkLocation.map] = [];
            if (Monster.chunks[self.chunkLocation.map][self.chunkLocation.layer] == null) Monster.chunks[self.chunkLocation.map][self.chunkLocation.layer] = [];
            if (Monster.chunks[self.chunkLocation.map][self.chunkLocation.layer][self.chunkLocation.chunky] == null) Monster.chunks[self.chunkLocation.map][self.chunkLocation.layer][self.chunkLocation.chunky] = [];
            if (Monster.chunks[self.chunkLocation.map][self.chunkLocation.layer][self.chunkLocation.chunky][self.chunkLocation.chunkx] == null) Monster.chunks[self.chunkLocation.map][self.chunkLocation.layer][self.chunkLocation.chunky][self.chunkLocation.chunkx] = [];
            Monster.chunks[self.chunkLocation.map][self.chunkLocation.layer][self.chunkLocation.chunky][self.chunkLocation.chunkx][self.id] = self;
        }
    };

    Monster.list[self.id] = self;
    self.updateChunkLocation();
    return self;
};
Monster.update = function update() {
    const pack = [];
    for (let i in Monster.list) {
        let localmonster = Monster.list[i];
        localmonster.update();
        if (pack[localmonster.map] == null) pack[localmonster.map] = [];
        if (pack[localmonster.map][localmonster.chunky] == null) pack[localmonster.map][localmonster.chunky] = [];
        if (pack[localmonster.map][localmonster.chunky][localmonster.chunkx] == null) pack[localmonster.map][localmonster.chunky][localmonster.chunkx] = [];
        pack[localmonster.map][localmonster.chunky][localmonster.chunkx].push({
            id: localmonster.id,
            map: localmonster.map,
            x: localmonster.x,
            y: localmonster.y,
            layer: localmonster.layer,
            type: localmonster.type,
            animationStage: localmonster.animationStage,
            hp: localmonster.hp,
            maxHP: localmonster.maxHP,
            boss: localmonster.boss
        });
    }

    return pack;
};
Monster.getDebugData = function getDebugData() {
    const pack = [];
    for (let i in Monster.list) {
        let localmonster = Monster.list[i];
        if (localmonster.active) {
            if (pack[localmonster.map] == null) pack[localmonster.map] = [];
            if (pack[localmonster.map][localmonster.chunky] == null) pack[localmonster.map][localmonster.chunky] = [];
            if (pack[localmonster.map][localmonster.chunky][localmonster.chunkx] == null) pack[localmonster.map][localmonster.chunky][localmonster.chunkx] = [];
            pack[localmonster.map][localmonster.chunky][localmonster.chunkx].push({
                map: localmonster.map,
                x: localmonster.x,
                y: localmonster.y,
                width: localmonster.width,
                height: localmonster.height,
                collisionBoxSize: localmonster.collisionBoxSize,
                animationStage: localmonster.animationStage,
                path: localmonster.ai.path,
                controls: localmonster.controls,
                aggroTarget: (localmonster.ai.entityTarget ?? {}).id,
                aggroRange: localmonster.ai.maxRange
            });
        }
    }

    return pack;
};
Monster.types = require('./monster.json');
Monster.list = [];
Monster.chunks = [];
Monster.attacks = {
    generic_throw: function attack_generic_throw(self, timeout, stages, projectile) {
        if (self.ai.entityTarget && !self.region.noattack) {
            if (self.ai.lastAttack > seconds(timeout)) {
                if (stages.indexOf(self.ai.attackStage) != -1) {
                    let angle = self.getAngle(self.ai.entityTarget);
                    new Projectile(projectile, angle+randomRange(-self.stats.accuracy/2, self.stats.accuracy/2), self.stats, self.id);
                }
                self.ai.attackStage++;
                if (self.ai.attackStage > stages[stages.length-1]) {
                    self.ai.attackStage = 0;
                    self.ai.lastAttack = 0;
                }
            }
        }
    },
    bird: function attack_bird(self) {
        Monster.attacks.generic_throw(self, 1, [1, 5], 'ninjastar');
    },
    snowbird: function attack_snowbird(self) {
        Monster.attacks.generic_throw(self, 1, [1, 5], 'fastsnowball');
    },
    cherrybomb: function attack_cherrybomb(self) {
        if (self.ai.entityTarget && !self.region.noattack) {
            if (self.getDistance(self.ai.entityTarget) < 64) {
                self.ai.attackType = 'triggeredcherrybomb';
                self.ai.attackTime = 0;
                self.explosionSize = 10;
            }
        }
    },
    triggeredcherrybomb: function attack_triggeredcherrybomb(self) {
        if (self.ai.attackTime == 0) {
            self.moveSpeed = 0;
            self.invincible = true;
            self.alive = false;
            self.animationStage = 0;
            self.animationLength = 10;
            self.onDeath = function onDeath() {};
        }
        self.ai.attackTime++;
        if (self.ai.attackTime >= seconds(0.3)) {
            self.ai.attackType = 'exploding';
            for (let i = 0; i < 100; i++) {
                new Particle(self.map, self.x, self.y, 'explosion');
            }
            self.searchChunks(Monster.chunks[self.map], 1, function(monster, id) {
                if (parseFloat(id) != self.id && self.getDistance(monster) < 200 && monster.alive && monster.ai.attackType != 'triggeredcherrybomb') {
                    if (monster.ai.attackType == 'cherrybomb') {
                        monster.ai.attackType = 'triggeredcherrybomb';
                        monster.ai.attackTime = 0;
                    } else {
                        monster.onHit(self, 'explosion');
                    }
                }
            });
            self.searchChunks(Player.chunks[self.map], 1, function(player, id) {
                if (self.getDistance(player) < 200 && player.alive) {
                    player.onHit(self, 'explosion');
                }
            });
        }
    },
    exploding: function attack_exploding(self) {
        if (self.animationStage >= 10) {
            delete Monster.list[self.id];
            if (Monster.chunks[self.chunkLocation.map] && Monster.chunks[self.chunkLocation.map][self.chunkLocation.layer] && Monster.chunks[self.chunkLocation.map][self.chunkLocation.layer][self.chunkLocation.chunky] && Monster.chunks[self.chunkLocation.map][self.chunkLocation.layer][self.chunkLocation.chunky][self.chunkLocation.chunkx]) delete Monster.chunks[self.chunkLocation.map][self.chunkLocation.layer][self.chunkLocation.chunky][self.chunkLocation.chunkx][self.id];
            else error('Could not delete monster from chunks!');
        }
    },
    snowball: function attack_snowball(self) {
        if (self.ai.lastAttack >= seconds(4)) {
            self.ai.attackStage++;
            if (self.ai.attackStage == 20) {
                self.ai.attackStage = 0;
                self.ai.lastAttack = 0;
                self.animationLength = 0;
                self.moveSpeed = 10;
            }
        }
        if (self.ai.entityTarget && !self.region.noattack) {
            if (self.ai.lastAttack >= seconds(4)) {
                if (self.ai.attackStage == 1) {
                    self.animationLength = 7;
                    self.animationSpeed = 100;
                    self.moveSpeed = 16;
                }
                var angle = 16*self.ai.attackStage;
                new Projectile('snowball', degrees(angle), self.stats, self.id);
                new Projectile('snowball', degrees(angle-90), self.stats, self.id);
                new Projectile('snowball', degrees(angle-180), self.stats, self.id);
                new Projectile('snowball', degrees(angle-270), self.stats, self.id);
            }
        }
    },
    cavebird: function attack_cavebird(self) {
        Monster.attacks.generic_throw(self, 1.5, [1, 3, 5], 'rock');
    },
    ram: function attack_ram(self) {
        if (self.ai.entityTarget && !self.region.noattack) {
            if ((self.ai.lastAttack > seconds(2) && self.getGridDistance(self.ai.entityTarget) < 2) || self.ai.attackStage != 0) {
                self.ai.lastAttack = 0;
                let angle = self.getAngle(self.ai.entityTarget);
                self.ai.charge = {
                    x: Math.cos(angle)*20,
                    y: Math.sin(angle)*20,
                    time: 2
                };
            }
        }
    },
    rockturret: function attack_rockturret(self) {
        if (self.ai.entityTarget && !self.region.noattack) {
            let t = self.getDistance(self.ai.entityTarget)/Projectile.types['explodingrock'].speed;
            let future = {
                x: self.ai.entityTarget.x + self.ai.entityTarget.xspeed*t,
                y: self.ai.entityTarget.y + self.ai.entityTarget.yspeed*t
            };
            let diff = (self.getAngle(future)-self.ai.attackStage) % (2*Math.PI);
            self.ai.attackStage += ((2*diff) % (2*Math.PI) - diff)*0.2;
            if (self.ai.lastAttack > seconds(1.5)) {
                self.ai.lastAttack = 0;
                new Projectile('explodingrock', self.ai.attackStage, self.stats, self.id);
                new Projectile('aiminglaser', self.ai.attackStage, self.stats, self.id);
            }
        }
    }
};
Monster.bossData = {};
Monster.bossAttacks = {
    map: function bossAttack_map(self, type, data) {
        if (type == 'monsters') {
            for (let location of Monster.bossData[data.name]) {
                new Monster(data.id, location.x*64+32, location.y*64+32, self.map, location.z, {dropItems: false, team: self.team});
            }
        } else if (type == 'projectiles') {
            for (let location of Monster.bossData[data.name]) {
                new Projectile(data.id, 0, self.stats, self.id, location.x*64+32, location.y*64+32);
            }
        }
    },
    surround: function bossAttack_surround(self, type, data) {
        var increment = 2*Math.PI/data.amount; // oh no radians
        if (type == 'monsters') {
            let radius = self.collisionBoxSize/2*Math.sqrt(2);
            for (let i = 0; i < data.amount; i++) {
                new Monster(data.id, self.x+Math.cos(increment*i)*radius, self.y+Math.sin(increment*i)*radius, self.map, self.layer, {dropItems: false, team: self.team});
            }
        } else if (type == 'projectiles') {
            for (let i = 0; i < data.amount; i++) {
                new Projectile(data.id, increment*i, self.stats, self.id);
            }
        }
    },
    player: function bossAttack_player(self, type, data) {
        if (type == 'monsters') {
            self.searchChunks(Player.chunks[self.map], Math.ceil(self.ai.maxRange/(64*Math.max(Collision.grid[self.map].chunkWidth, Collision.grid[self.map].chunkHeight))), function(player, id) {
                if (self.getGridDistance(player) < self.ai.maxRange  && (!self.rayCast(player) || self.getGridDistance(player) < 4) && player.alive) {
                    let id = data.id;
                    let x = player.x+randomRange(-64, 64);
                    let y = player.y+randomRange(-64, 64);
                    let map = self.map;
                    let layer = z;
                    new Particle(map, x, y, 'warning', data.warning);
                    self.ai.boss.pendingEvents.push({
                        timer: data.warning,
                        callback: function() {
                            new Monster(id, x, y, map, layer, {dropItems: false, team: self.team});
                        }
                    });
                }
            });
        } else if (type == 'projectiles') {
            self.searchChunks(Player.chunks[self.map], Math.ceil(self.ai.maxRange/(64*Math.max(Collision.grid[self.map].chunkWidth, Collision.grid[self.map].chunkHeight))), function(player, id) {
                if (self.getGridDistance(player) < self.ai.maxRange  && (!self.rayCast(player.x) || self.getGridDistance(player) < 4) && player.alive) {
                    let id = data.id;
                    let stats = data.stats;
                    let selfID = self.id;
                    let x = player.x+randomRange(-16, 16);
                    let y = player.y+randomRange(-16, 16);
                    new Particle(self.map, x, y, 'warning', data.warning);
                    self.ai.boss.pendingEvents.push({
                        timer: data.warning,
                        callback: function() {
                            new Projectile(id, 0, stats, selfID, x, y);
                        }
                    });
                }
            });
        }
    },
    random: function bossAttack_random(self, type, data) {
        for (let i = 0; i < data.amount; i++) {
            let attempts = 0;
            let x, y;
            while (attempts < 20) {
                x = self.gridx+Math.round(randomRange(-24, 24));
                y = self.gridy+Math.round(randomRange(-24, 24));
                if (Collision.grid[self.map] && Collision.grid[self.map][self.layer] && Collision.grid[self.map][self.layer][y] && Collision.grid[self.map][self.layer][y][x] == 0) break;
                attempts++;
            }
            x = x*64+32;
            y = y*64+32;
            new Particle(self.map, x, y, 'warning', data.warning);
            if (type == 'monsters') {
                let id = data.id;
                let map = self.map;
                let layer = self.layer;
                self.ai.boss.pendingEvents.push({
                    timer: data.warning,
                    callback: function() {
                        new Monster(id, x, y, map, layer, {dropItems: false, team: self.team});
                    }
                });
            } else if (type == 'projectiles') {
                let id = data.id;
                let stats = data.stats;
                let selfID = self.id;
                self.ai.boss.pendingEvents.push({
                    timer: data.warning,
                    callback: function() {
                        new Projectile(id, 0, stats, selfID, x, y);
                    }
                });
            }

        }
    },
    cameraShake: function bossAttack_cameraShake(self, type, data) {
        new Particle(self.map, self.x, self.y, type, data);
    }
};

// projectiles
Projectile = function(type, angle, stats, parentID, x, y) {
    const self = new Entity();
    self.entType = 'projectile';
    self.type = type;
    self.pierced = 0;
    self.lastPatternUpdate = 0;
    try {
        let tempprojectile = Projectile.types[type];
        self.type = type;
        self.width = tempprojectile.width;
        self.height = tempprojectile.height;
        self.moveSpeed = tempprojectile.speed;
        self.damage = tempprojectile.damage;
        self.noCollision = tempprojectile.noCollision;
        self.maxRange = tempprojectile.range;
        self.knockback = tempprojectile.knockback;
        self.contactEvents = tempprojectile.contactEvents;
        self.damageType = tempprojectile.damageType;
        self.invincibilityFrame = tempprojectile.invincibilityFrame;
        self.deathMessage = tempprojectile.deathMessage;
        self.pattern = Projectile.patterns[tempprojectile.pattern] ?? function() {error('Invalid projectile pattern "' + tempprojectile.pattern + '"');};
        self.piercing = tempprojectile.piercing;
        self.maxPierce = tempprojectile.maxPierce;
        self.patternUpdateSpeed = tempprojectile.patternUpdateSpeed;
        self.reflectable = tempprojectile.reflectable;
        delete tempprojectile;
    } catch (err) {
        error(err);
        return false;
    }
    self.angle = angle;
    self.parentID = parentID;
    self.parentIsPlayer = true;
    if (Monster.list[self.parentID]) self.parentIsPlayer = false;
    const parent = Player.list[self.parentID] ?? Monster.list[self.parentID] ?? self;
    try {
        self.x = x ?? parent.x;
        self.y = y ?? parent.y;
        self.map = parent.map;
        self.layer = parent.layer;
        self.damage *= stats.attack;
        self.maxRange *= stats.range;
        self.moveSpeed *= stats.projectileSpeed;
        self.knockback *= stats.knockback;
        self.critChance = stats.critChance;
        self.critPower = stats.critPower;
        self.maxPierce += stats.maxPierce;
        self.team = parent.team;
    } catch (err) {
        error(err);
        return false;
    }
    if (!self.piercing) self.maxPierce = 0;
    self.traveltime = 0;
    self.sinAngle = Math.sin(self.angle);
    self.cosAngle = Math.cos(self.angle);
    self.xspeed = self.cosAngle*self.moveSpeed;
    self.yspeed = self.sinAngle*self.moveSpeed;
    self.vertices = [
        {x: ((self.width/2)*self.cosAngle)-((self.height/2)*self.sinAngle)+self.x, y: ((self.width/2)*self.sinAngle)+((self.height/2)*self.cosAngle)+self.y},
        {x: ((self.width/2)*self.cosAngle)-((-self.height/2)*self.sinAngle)+self.x, y: ((self.width/2)*self.sinAngle)+((-self.height/2)*self.cosAngle)+self.y},
        {x: ((-self.width/2)*self.cosAngle)-((-self.height/2)*self.sinAngle)+self.x, y: ((-self.width/2)*self.sinAngle)+((-self.height/2)*self.cosAngle)+self.y},
        {x: ((-self.width/2)*self.cosAngle)-((self.height/2)*self.sinAngle)+self.x, y: ((-self.width/2)*self.sinAngle)+((self.height/2)*self.cosAngle)+self.y},
        {x: self.x, y: self.y}
    ];
    self.lastvertices = self.vertices;
    self.physicsInaccuracy = 5;
    self.collisionBoxSize = Math.max(Math.abs(self.sinAngle*self.height)+Math.abs(self.cosAngle*self.width), Math.abs(self.cosAngle*self.height)+Math.abs(self.sinAngle*self.width));
    if (self.moveSpeed) {
        self.x += self.cosAngle*self.width/2;
        self.y += self.sinAngle*self.width/2;
    }
    self.gridx = Math.floor(self.x/64);
    self.gridy = Math.floor(self.y/64);
    self.chunkx = Math.floor(self.gridx/Collision.grid[self.map].chunkWidth);
    self.chunky = Math.floor(self.gridy/Collision.grid[self.map].chunkHeight);
    self.updateChunkLocation();
    self.toDelete = false;

    self.update = function update() {
        if (self.toDelete) {
            delete Projectile.list[self.id];
            if (Projectile.chunks[self.chunkLocation.map] && Projectile.chunks[self.chunkLocation.map][self.chunkLocation.layer] && Projectile.chunks[self.chunkLocation.map][self.chunkLocation.layer][self.chunkLocation.chunky] && Projectile.chunks[self.chunkLocation.map][self.chunkLocation.layer][self.chunkLocation.chunky][self.chunkLocation.chunkx]) delete Projectile.chunks[self.chunkLocation.map][self.chunkLocation.layer][self.chunkLocation.chunky][self.chunkLocation.chunkx][self.id];
            else {
                error('Could not delete projectile from chunks!');
                error('Location: map:' + self.chunkLocation.map + ' layer:' + self.chunkLocation.layer + ' x:' + self.chunkLocation.chunkx + ' y:' + self.chunkLocation.chunky);
            }
            return;
        }
        if (Player.list[self.parentID] == null && Monster.list[self.parentID] == null) {
            delete Projectile.list[self.id];
            if (Projectile.chunks[self.chunkLocation.map] && Projectile.chunks[self.chunkLocation.map][self.chunkLocation.layer] && Projectile.chunks[self.chunkLocation.map][self.chunkLocation.layer][self.chunkLocation.chunky] && Projectile.chunks[self.chunkLocation.map][self.chunkLocation.layer][self.chunkLocation.chunky][self.chunkLocation.chunkx]) delete Projectile.chunks[self.chunkLocation.map][self.chunkLocation.layer][self.chunkLocation.chunky][self.chunkLocation.chunkx][self.id];
            else {
                error('Could not delete projectile from chunks!');
                error('Location: map:' + self.chunkLocation.map + ' layer:' + self.chunkLocation.layer + ' x:' + self.chunkLocation.chunkx + ' y:' + self.chunkLocation.chunky);
            }
            return;
        }
        self.traveltime++;
        if (self.traveltime > seconds(self.maxRange)) {
            self.toDelete = true;
            return;
        }
        if (self.updatePos()) return;
        if (!self.parentIsPlayer || ENV.pvp) {
            self.searchChunks(Player.chunks[self.map], Math.ceil(self.collisionBoxSize/(128*Math.max(Collision.grid[self.map].chunkWidth, Collision.grid[self.map].chunkHeight))), function(player, id) {
                if (player && player.alive && id != self.parentID && player.team != self.team && self.collideWith(player) ) {
                    let noDelete = player.onHit(self, 'projectile');
                    self.layer = player.layer;
                    self.pierced++;
                    self.damage *= 0.7;
                    if (self.pierced > self.maxPierce && !noDelete) self.toDelete = true;
                    return true;
                }
            });
        }
        if (self.parentIsPlayer || ENV.monsterFriendlyFire) {
            self.searchChunks(Monster.chunks[self.map], Math.ceil(self.collisionBoxSize/(128*Math.max(Collision.grid[self.map].chunkWidth, Collision.grid[self.map].chunkHeight))), function(monster, id) {
                if (monster && monster.alive && id != self.parentID && monster.team != self.team && self.collideWith(monster)) {
                    let noDelete = monster.onHit(self, 'projectile');
                    self.layer = monster.layer;
                    self.pierced++;
                    self.damage *= 0.7;
                    if (self.pierced > self.maxPierce && !noDelete) self.toDelete = true;
                    return;
                }
            });
        }
    };
    self.updatePos = function updatePos() {
        self.lastPatternUpdate++;
        self.lastPatternUpdate > self.patternUpdateSpeed && self.pattern(self);
        self.collide();
        self.updateChunkLocation();
        return self.checkPointCollision() && !self.noCollision;
    };
    self.checkSpannedCollision = function checkSpannedCollision() {
        var colliding = false;
        var width = self.width;
        var height = self.height
        self.width += Math.abs(self.x-self.lastx);
        self.height += Math.abs(self.y-self.lasty);
        var x = self.x;
        var y = self.y;
        self.x = self.lastx;
        self.y = self.lasty;
        if (self.checkPointCollision()) colliding = true;
        self.x = x;
        self.y = y;
        self.width = width;
        self.height = height;
        if (colliding) self.toDelete = true;
        return colliding;
    };
    self.checkLargeSpannedCollision = function checkLargeSpannedCollision() {
        var colliding = false;
        if (self.checkPointCollision()) colliding = true;
        if (self.checkCollisionLine(self.lastvertices[0].x, self.lastvertices[0].y, self.vertices[0].x, self.vertices[0].y)) colliding = true;
        if (self.checkCollisionLine(self.lastvertices[1].x, self.lastvertices[1].y, self.vertices[1].x, self.vertices[1].y)) colliding = true;
        if (self.checkCollisionLine(self.lastvertices[2].x, self.lastvertices[2].y, self.vertices[2].x, self.vertices[2].y)) colliding = true;
        if (self.checkCollisionLine(self.lastvertices[3].x, self.lastvertices[3].y, self.vertices[3].x, self.vertices[3].y)) colliding = true;
        if (self.checkCollisionLine(self.lastx, self.lasty, self.x, self.y)) colliding = true;
        if (colliding) self.toDelete = true;
        return colliding;
    };
    self.checkPointCollision = function checkPointCollision() {
        var collisions = [];
        let range = Math.ceil(self.collisionBoxSize/128);
        for (let x = self.gridx-range; x <= self.gridx+range; x++) {
            for (let y = self.gridy-range; y <= self.gridy+range; y++) {
                collisions.push(Collision.getColEntity(self.map, x, y, self.layer));
            }
        }
        self.lastvertices = self.vertices;
        self.vertices = [
            {x: ((self.width/2)*self.cosAngle)-((self.height/2)*self.sinAngle)+self.x, y: ((self.width/2)*self.sinAngle)+((self.height/2)*self.cosAngle)+self.y},
            {x: ((self.width/2)*self.cosAngle)-((-self.height/2)*self.sinAngle)+self.x, y: ((self.width/2)*self.sinAngle)+((-self.height/2)*self.cosAngle)+self.y},
            {x: ((-self.width/2)*self.cosAngle)-((-self.height/2)*self.sinAngle)+self.x, y: ((-self.width/2)*self.sinAngle)+((-self.height/2)*self.cosAngle)+self.y},
            {x: ((-self.width/2)*self.cosAngle)-((self.height/2)*self.sinAngle)+self.x, y: ((-self.width/2)*self.sinAngle)+((self.height/2)*self.cosAngle)+self.y},
            {x: self.x, y: self.y}
        ];
        for (let i in collisions) {
            for (let j in collisions[i]) {
                if (self.collideWith(collisions[i][j])) {
                    return true;
                }
            }
        }
        return false;
    };
    self.doPointCollision = function doPointCollision() {
        var colliding = self.checkPointCollision();
        if (colliding) {
            self.toDelete = true;
            for (let event of self.contactEvents) {
                if (Projectile.contactEvents[event.type]) {
                    Projectile.contactEvents[event.type](self, null, event.data);
                }
            }
        }
        return colliding;
    };
    self.checkLayer = function checkLayer() {};
    self.checkSlowdown = function checkSlowdown() {};
    self.collideWith = function collideWith(entity) {
        if (entity.map == self.map) {
            if (entity.noProjectile == null || !entity.noProjectile) {
                if (self.getSquareDistance(entity) <= self.collisionBoxSize/2 + entity.collisionBoxSize/2) {
                    var vertices2 = [
                        {x: entity.x+entity.width/2, y: entity.y+entity.height/2},
                        {x: entity.x+entity.width/2, y: entity.y-entity.height/2},
                        {x: entity.x-entity.width/2, y: entity.y-entity.height/2},
                        {x: entity.x-entity.width/2, y: entity.y+entity.height/2}
                    ];
                    for (let i = 0; i < 4; i++) {
                        if (vertices2[i].y-self.vertices[0].y < (getSlope(self.vertices[0], self.vertices[1])*(vertices2[i].x-self.vertices[0].x))) {
                            if (vertices2[i].y-self.vertices[1].y > (getSlope(self.vertices[1], self.vertices[2])*(vertices2[i].x-self.vertices[1].x))) {
                                if (vertices2[i].y-self.vertices[2].y > (getSlope(self.vertices[2], self.vertices[3])*(vertices2[i].x-self.vertices[2].x))) {
                                    if (vertices2[i].y-self.vertices[3].y < (getSlope(self.vertices[3], self.vertices[0])*(vertices2[i].x-self.vertices[3].x))) {
                                        return true;
                                    }
                                }
                            }
                        }
                        if (self.vertices[i].x > vertices2[2].x && self.vertices[i].x < vertices2[0].x && self.vertices[i].y > vertices2[2].y && self.vertices[i].y < vertices2[0].y) {
                            return true;
                        }
                    }
                    if (self.vertices[4].x > vertices2[2].x && self.vertices[4].x < vertices2[0].x && self.vertices[4].y > vertices2[2].y && self.vertices[4].y < vertices2[0].y) {
                        return true;
                    }
                }
            }
            return false;
        }
    };
    self.updateChunkLocation = function updateChunkLocation() {
        if (self.map != self.chunkLocation.map || self.layer != self.chunkLocation.layer || self.chunkx != self.chunkLocation.chunkx || self.chunky != self.chunkLocation.chunky) {
            if (Projectile.chunks[self.chunkLocation.map] && Projectile.chunks[self.chunkLocation.map][self.chunkLocation.layer] && Projectile.chunks[self.chunkLocation.map][self.chunkLocation.layer][self.chunkLocation.chunky] && Projectile.chunks[self.chunkLocation.map][self.chunkLocation.layer][self.chunkLocation.chunky][self.chunkLocation.chunkx]) delete Projectile.chunks[self.chunkLocation.map][self.chunkLocation.layer][self.chunkLocation.chunky][self.chunkLocation.chunkx][self.id];
            self.chunkLocation = {
                map: self.map,
                layer: self.layer,
                chunkx: self.chunkx,
                chunky: self.chunky
            };
            if (Projectile.chunks[self.chunkLocation.map] == null) Projectile.chunks[self.chunkLocation.map] = [];
            if (Projectile.chunks[self.chunkLocation.map][self.chunkLocation.layer] == null) Projectile.chunks[self.chunkLocation.map][self.chunkLocation.layer] = [];
            if (Projectile.chunks[self.chunkLocation.map][self.chunkLocation.layer][self.chunkLocation.chunky] == null) Projectile.chunks[self.chunkLocation.map][self.chunkLocation.layer][self.chunkLocation.chunky] = [];
            if (Projectile.chunks[self.chunkLocation.map][self.chunkLocation.layer][self.chunkLocation.chunky][self.chunkLocation.chunkx] == null) Projectile.chunks[self.chunkLocation.map][self.chunkLocation.layer][self.chunkLocation.chunky][self.chunkLocation.chunkx] = [];
            Projectile.chunks[self.chunkLocation.map][self.chunkLocation.layer][self.chunkLocation.chunky][self.chunkLocation.chunkx][self.id] = self;
        }
    };

    Projectile.list[self.id] = self;
    self.updateChunkLocation();
    return self;
};
Projectile.update = function update() {
    const pack = [];
    for (let i in Projectile.list) {
        let localprojectile = Projectile.list[i];
        localprojectile.update();
        if (pack[localprojectile.map] == null) pack[localprojectile.map] = [];
        if (pack[localprojectile.map][localprojectile.chunky] == null) pack[localprojectile.map][localprojectile.chunky] = [];
        if (pack[localprojectile.map][localprojectile.chunky][localprojectile.chunkx] == null) pack[localprojectile.map][localprojectile.chunky][localprojectile.chunkx] = [];
        pack[localprojectile.map][localprojectile.chunky][localprojectile.chunkx].push({
            id: localprojectile.id,
            map: localprojectile.map,
            x: localprojectile.x,
            y: localprojectile.y,
            layer: localprojectile.layer,
            angle: localprojectile.angle,
            type: localprojectile.type
        });
    }

    return pack;
};
Projectile.getDebugData = function getDebugData() {
    const pack = [];
    for (let i in Projectile.list) {
        let localprojectile = Projectile.list[i];
        if (pack[localprojectile.map] == null) pack[localprojectile.map] = [];
        if (pack[localprojectile.map][localprojectile.chunky] == null) pack[localprojectile.map][localprojectile.chunky] = [];
        if (pack[localprojectile.map][localprojectile.chunky][localprojectile.chunkx] == null) pack[localprojectile.map][localprojectile.chunky][localprojectile.chunkx] = [];
        pack[localprojectile.map][localprojectile.chunky][localprojectile.chunkx].push({
            map: localprojectile.map,
            x: localprojectile.x,
            y: localprojectile.y,
            width: localprojectile.width,
            height: localprojectile.height,
            angle: localprojectile.angle,
            collisionBoxSize: localprojectile.collisionBoxSize,
            parentIsPlayer: localprojectile.parentIsPlayer,
            parent: localprojectile.parent
        });
    }
    
    return pack;
};
Projectile.types = require('./projectile.json');
Projectile.list = [];
Projectile.chunks = [];
Projectile.patterns = {
    none: function pattern_none(self) {
        self.lastPatternUpdate = 0;
    },
    spin: function pattern_spin(self) {
        self.angle += degrees(25);
        self.sinAngle = Math.sin(self.angle);
        self.cosAngle = Math.cos(self.angle);
        self.collisionBoxSize = Math.max(Math.abs(self.sinAngle*self.height)+Math.abs(self.cosAngle*self.width), Math.abs(self.cosAngle*self.height)+Math.abs(self.sinAngle*self.width));
        self.lastPatternUpdate = 0;
    },
    homing: function pattern_homing(self) {
        self.angle += degrees(25);
        self.sinAngle = Math.sin(self.angle);
        self.cosAngle = Math.cos(self.angle);
        self.collisionBoxSize = Math.max(Math.abs(self.sinAngle*self.height)+Math.abs(self.cosAngle*self.width), Math.abs(self.cosAngle*self.height)+Math.abs(self.sinAngle*self.width));
        let lowest, target;
        if (self.parentIsPlayer) {
            self.searchChunks(Monster.chunks[self.map], 2, function(monster, id) {
                if (lowest == null || (self.getGridDistance(monster) < self.getGridDistance(Monster.list[lowest]) && monster.alive)) lowest = id;
            });
            target = Monster.list[lowest];
        } else {
            self.searchChunks(Player.chunks[self.map], 2, function(player, id) {
                if (lowest == null || (self.getGridDistance(player) < self.getGridDistance(Player.list[lowest]) && player.alive)) lowest = id;
            });
            target = Player.list[lowest];
        }
        if (target) {
            var angle = self.getAngle(target);
            self.xspeed = Math.cos(angle)*self.moveSpeed;
            self.yspeed = Math.sin(angle)*self.moveSpeed;
        }
        self.sinAngle = Math.sin(self.angle);
        self.cosAngle = Math.cos(self.angle);
        self.collisionBoxSize = Math.max(Math.abs(self.sinAngle*self.height)+Math.abs(self.cosAngle*self.width), Math.abs(self.cosAngle*self.height)+Math.abs(self.sinAngle*self.width));
        self.lastPatternUpdate = 0;
    },
    homing2: function pattern_homing2(self) {
        let lowest, target;
        if (self.parentIsPlayer) {
            self.searchChunks(Monster.chunks[self.map], 2, function(monster, id) {
                if (lowest == null || (self.getGridDistance(monster) < self.getGridDistance(Monster.list[lowest]) && monster.alive)) lowest = id;
            });
            target = Monster.list[lowest];
        } else {
            self.searchChunks(Player.chunks[self.map], 2, function(player, id) {
                if (lowest == null || (self.getGridDistance(player) < self.getGridDistance(Player.list[lowest]) && player.alive)) lowest = id;
            });
            target = Player.list[lowest];
        }
        if (target) {
            let diff = (self.getAngle(target)-self.angle) % (2*Math.PI);
            self.angle += ((2*diff) % (2*Math.PI) - diff)*0.5;
            self.xspeed = Math.cos(self.angle)*self.moveSpeed;
            self.yspeed = Math.sin(self.angle)*self.moveSpeed;
            self.sinAngle = Math.sin(self.angle);
            self.cosAngle = Math.cos(self.angle);
            self.collisionBoxSize = Math.max(Math.abs(self.sinAngle*self.height)+Math.abs(self.cosAngle*self.width), Math.abs(self.cosAngle*self.height)+Math.abs(self.sinAngle*self.width));
        }
        self.lastPatternUpdate = 0;
    },
    enchantHoming: function pattern_enchantHoming(self) {
        let lowest, target;
        self.searchChunks(Monster.chunks[self.map], 2, function(monster, id) {
            if (lowest == null || (self.getGridDistance(monster) < self.getGridDistance(Monster.list[lowest]) && monster.alive)) lowest = id;
        });
        target = Monster.list[lowest];
        if (target) {
            var angle = self.getAngle(target);
            self.angle += Math.min(0.05, Math.max(angle-self.angle, -0.05));
            self.xspeed = Math.cos(self.angle)*self.moveSpeed;
            self.yspeed = Math.sin(self.angle)*self.moveSpeed;
            self.sinAngle = Math.sin(self.angle);
            self.cosAngle = Math.cos(self.angle);
            self.collisionBoxSize = Math.max(Math.abs(self.sinAngle*self.height)+Math.abs(self.cosAngle*self.width), Math.abs(self.cosAngle*self.height)+Math.abs(self.sinAngle*self.width));
        }
        self.lastPatternUpdate = 0;
    },
    follow: function pattern_follow(self) {
        var parent = Player.list[self.parentID] ?? Monster.list[self.parentID];
        if (parent != null) {
            self.x = parent.x;
            self.y = parent.y;
            self.x += self.cosAngle*(self.width/2+4);
            self.y += self.sinAngle*(self.width/2+4);
            self.xspeed = self.cosAngle;
            self.yspeed = self.sinAngle;
            self.frozen = true;
        }
        self.lastPatternUpdate = 0;
    },
    followDir: function pattern_followDir(self) {
        var parent = Player.list[self.parentID] ?? Monster.list[self.parentID];
        if (parent != null) {
            self.x = parent.x;
            self.y = parent.y;
            if (parent.heldItem) self.angle = parent.heldItem.angle;
            else self.angle = parent.ai.attackStage;
            self.sinAngle = Math.sin(self.angle);
            self.cosAngle = Math.cos(self.angle);
            self.collisionBoxSize = Math.max(Math.abs(self.sinAngle*self.height)+Math.abs(self.cosAngle*self.width), Math.abs(self.cosAngle*self.height)+Math.abs(self.sinAngle*self.width));
            self.x += self.cosAngle*(self.width/2+4);
            self.y += self.sinAngle*(self.width/2+4);
            self.xspeed = self.cosAngle;
            self.yspeed = self.sinAngle;
            self.frozen = true;
        }
        self.lastPatternUpdate = 0;
    },
    orbit: function pattern_orbit(self) {
        var parent = Player.list[self.parentID] ?? Monster.list[self.parentID];
        if (parent) {
            self.x = parent.x;
            self.y = parent.y;
            self.angle += degrees(18);
            self.sinAngle = Math.sin(self.angle);
            self.cosAngle = Math.cos(self.angle);
            self.collisionBoxSize = Math.max(Math.abs(self.sinAngle*self.height)+Math.abs(self.cosAngle*self.width), Math.abs(self.cosAngle*self.height)+Math.abs(self.sinAngle*self.width));
            self.x += Math.cos(self.angle)*(self.width/2+4);
            self.y += Math.sin(self.angle)*(self.width/2+4);
            self.xspeed = self.cosAngle;
            self.yspeed = self.sinAngle;
            self.frozen = true;
        }
        self.lastPatternUpdate = 0;
    }
};
Projectile.contactEvents = {
    explosion: function contactEvent_explosion(self, entity, data) {
        for (let i = 0; i < data.size*15; i++) {
            new Particle(self.map, self.x, self.y, 'explosion');
        }
        self.explosionSize = data.size;
        self.searchChunks(Monster.chunks[self.map], 1, function(monster, id) {
            if (self.getDistance(monster) <= 64*data.size && !self.rayCast(monster) && monster.ai.attackType != 'triggeredcherrybomb' && monster.alive) {
                if (monster.ai.attackType == 'cherrybomb') {
                    monster.ai.attackType = 'triggeredcherrybomb';
                    monster.ai.attackTime = 0;
                } else {
                    monster.onHit(self, 'explosion');
                }
            }
        });
        self.searchChunks(Player.chunks[self.map], 1, function(player, id) {
            if (self.getDistance(player) <= 64*data.size && !self.rayCast(player) && player.alive) {
                player.onHit(self, 'explosion');
            }
        });
    },
    effect: function contactEvent_effect(self, entity, data) {
        if (entity) {
            entity.effectTimers[data.id] = data.time;
        }
    },
    areaeffect: function contactEvent_areaeffect(self, entity, data) {
        self.searchChunks(Monster.chunks[self.map], 1, function(monster, id) {
            if (self.getDistance(monster) <= 64*data.size && monster.alive) {
                monster.effectTimers[data.effect] = data.time;
            }
        });
        self.searchChunks(Player.chunks[self.map], 1, function(player, id) {
            if (self.getDistance(player) <= 64*data.size && player.alive) {
                player.effectTimers[data.effect] = data.time;
            }
        });
    }
};

// particles
Particle = function(map, x, y, type, value) {
    const self = {
        map: map,
        x: x,
        y: y,
        chunkx: Math.floor(x/(Collision.grid[map].chunkWidth*64)),
        chunky: Math.floor(y/(Collision.grid[map].chunkHeight*64)),
        type: type,
        value: value
    };

    Particle.list.push(self);
    return self;
};
Particle.update = function update() {
    const pack = [];
    for (let i in Particle.list) {
        pack.push(Particle.list[i]);
    }
    Particle.list = [];

    return pack;
};
Particle.list = [];

// dropped items
DroppedItem = function(map, x, y, itemId, enchantments, stackSize, playerId, isLoot) {
    const self = {
        id: null,
        x: x,
        y: y,
        map: map,
        chunkx: Math.floor(x/(Collision.grid[map].chunkWidth*64)),
        chunky: Math.floor(y/(Collision.grid[map].chunkHeight*64)),
        width: 48,
        height: 48,
        itemId: itemId,
        enchantments: enchantments,
        stackSize: stackSize,
        playerId: playerId,
        isLoot: isLoot,
        entType: 'item'
    };
    self.id = uuidv1();
    var valid = false;
    for (let i in Inventory.items) {
        if (itemId == i) {
            valid = true;
            break;
        }
    }
    if (!valid) self.itemId = 'missing';
    self.time = 0;

    self.update = function update() {
        self.time++;
        if (self.time >= seconds(ENV.itemDespawnTime*60)) delete DroppedItem.list[self.id];
    };

    DroppedItem.list[self.id] = self;
    return self;
};
DroppedItem.update = function update() {
    const pack = [];
    for (let i in DroppedItem.list) {
        let localdroppeditem = DroppedItem.list[i];
        localdroppeditem.update();
        if (pack[localdroppeditem.map] == null) pack[localdroppeditem.map] = [];
        if (pack[localdroppeditem.map][localdroppeditem.chunky] == null) pack[localdroppeditem.map][localdroppeditem.chunky] = [];
        if (pack[localdroppeditem.map][localdroppeditem.chunky][localdroppeditem.chunkx] == null) pack[localdroppeditem.map][localdroppeditem.chunky][localdroppeditem.chunkx] = [];
        pack[localdroppeditem.map][localdroppeditem.chunky][localdroppeditem.chunkx].push({
            id: localdroppeditem.id,
            map: localdroppeditem.map,
            x: localdroppeditem.x,
            y: localdroppeditem.y,
            itemId: localdroppeditem.itemId,
            stackSize: localdroppeditem.stackSize,
            playerId: localdroppeditem.playerId
        });
    }

    return pack;
};
DroppedItem.list = [];

// utility functions
function getSlope(pos1, pos2) {
    return (pos2.y - pos1.y) / (pos2.x - pos1.x);
};
function seconds(s) {
    return s*20;
};
function ticks(t) {
    return Math.round(t/20);
};
function degrees(d) {
    return d*Math.PI/180;
};
function radians(r) {
    return r*180/Math.PI;
};
function randomRange(lower, upper) {
    return Math.random()*(upper-lower)+lower;
};
RSAencode = async function RSAencode(str) {
    return await subtle.encrypt({name: "RSA-OAEP"}, (await keys).publicKey, new TextEncoder().encode(str));
};
RSAdecode = async function RSAdecode(buf) {
    return new TextDecoder().decode(await subtle.decrypt({name: "RSA-OAEP"}, (await keys).privateKey, buf));
};