// Copyright (C) 2022 Radioactive64
const {lock} = require('object-property-lock');

// node
lock(global, ['setInterval', 'setTimeout', 'setImmediate']);
// app.js
lock(ENV, ['ops', 'devs', 'useLocalDatabase', 'useDiscordWebhook', 'enableMGAPI', 'autoSaveInterval', 'isBetaServer']);
lock(io);
lock(s);
lock(global, ['forceQuit', 'cloneDeep']);
// database.js
lock(ACCOUNTS, ['connect', 'disconnect', 'signup', 'login', 'deleteAccount', 'changePassword', 'validateCredentials', 'loadProgress', 'saveProgress']);
// log.js
lock(global, ['insertChat', 'insertSinglechat', 'logColor', 'log', 'warn', 'error', 'appendLog']);
// collision.js
lock(global, ['Collision', 'Layer', 'Slowdown', 'Spawner', 'BossSpawner', 'Region', 'Teleporter', 'GaruderWarp', 'EventTrigger']);
lock(global.Collision, ['getColEntity']);
lock(global.Layer, ['getColEntity', 'getColDir', 'init', 'lazyInit', 'loadCache', 'writeCache', 'generateGraphs', 'generateLookupTables', 'graph', 'lookupTable', 'lazyInitQueue']);
lock(global.Slowdown, ['getColEntity']);
lock(global.Spawner, ['init']);
lock(global.GaruderWarp, ['locations', 'triggers', 'addPosition', 'addWarpAddTrigger']);
lock(global.EventTrigger, ['triggers']);
// inventory.js
lock(global, ['Inventory', 'Shop']);
lock(global.Inventory, ['Item', 'items']);
// entity.js
lock(global, ['Entity', 'Rig', 'Npc', 'Player', 'Monster', 'Projectile', 'Particle', 'DroppedItem']);
lock(global.Entity, ['update', 'getDebugData']);
lock(global.Npc, ['update', 'getDebugData', 'init', 'rawJson', 'dialogues']);
lock(global.Player, ['update', 'getDebugData', 'usePatterns']);
lock(global.Monster, ['update', 'getDebugData', 'types', 'attacks', 'bossData', 'bossAttacks']);
lock(global.Projectile, ['update', 'getDebugData', 'types', 'patterns', 'contactEvents']);
lock(global.Particle, ['update']);
lock(global.DroppedItem, ['update']);
// misc
lock(global, ['resetMaps']);