// Copyright (C) 2022 Radioactive64

const bcrypt = require('bcrypt');
const salt = 10;
const Cryptr = require('cryptr');
const cryptr = new Cryptr('cachePasswordKey');
const {Client} = require('pg');
if (process.env.DATABASE_URL) {
    url = process.env.DATABASE_URL;
} else {
    require('./url.js');
}
const database = new Client({
    connectionString: url,
    ssl: {
        rejectUnauthorized: false
    }
});
url = null;

const chars = ['A', 'B', 'C',  'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N',  'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y',  'Z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j',  'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u',  'v', 'w', 'x', 'y', 'z', '1', '2', '3', '4', '5', '6',  '7', '8', '9', '0', '`', '-', '=', '!', '@', '#', '$',  '%', '^', '&', '*', '(', ')', '_', '+', '[', ']', '{', '}', '|', ';', "'", ':', '"', ',', '.', '/', '?'];

ACCOUNTS = {
    connected: false,
    connect: async function connect() {
        if (!ACCOUNTS.connected) {
            if (ENV.offlineMode) {
                ACCOUNTS.connected = true;
                warn('[!] Offline Mode is enabled! Accounts and progress will not load or save! [!]');
            } else {
                try {
                    await database.connect();
                    // 69.142.222.186
                    ACCOUNTS.connected = true;
                } catch (err) {
                    forceQuit(err, 2);
                }
            }
        } else {
            warn('Already connected!');
        }
    },
    disconnect: async function disconnect() {
        if (ACCOUNTS.connected) {
            try {
                if (!ENV.offlineMode) await database.end();
                ACCOUNTS.connected = false;
            } catch (err) {
                forceQuit(err, 2);
            }
        } else {
            warn('Not Connected!');
        }
    },
    signup: async function signup(username, password) {
        if (ENV.offlineMode) return 0;
        if (username == 'unavailable') return 3;
        if (await getCredentials(username) == false) {
            if (typeof username == 'string' && typeof password == 'string') {
                var status = await writeCredentials(username, password);
                if (status) {
                    return 0;
                }
            }
            warn('Failed to sign up!');
            return 2;
        }
        return 1;
    },
    login: async function login(username, password) {
        if (ENV.offlineMode) return 0;
        var cred = await getCredentials(username);
        if (cred) {
            if (bcrypt.compareSync(password, cred.password)) {
                if (await getBanned(username)) {
                    return 3;
                }
                return 0;
            }
            return 1;
        }
        return 2;
    },
    deleteAccount: async function deleteAccount(username, password) {
        if (ENV.offlineMode) return 0;
        var cred = await getCredentials(username);
        if (cred) {
            if (bcrypt.compareSync(password, cred.password)) {
                if (await getBanned(username)) return 1;
                var status = await deleteCredentials(username);
                if (status) {
                    return 0;
                }
                return 3;
            }
            return 1;
        }
        return 2;
    },
    changePassword: async function changePassword(username, oldpassword, password) {
        if (ENV.offlineMode) return 0;
        var cred = await getCredentials(username);
        if (cred) {
            if (bcrypt.compareSync(oldpassword, cred.password)) {
                var status = await updatePassword(username, password);
                if (status) {
                    return 0;
                } else {
                    return 3;
                }
            } else {
                return 1;
            }
        }
        return 2;
    },
    validateCredentials: function validateCredentials(username, password) {
        if (username != '' && username != null) {
            if (username.length > 3 || username == 'sp') {
                if (username.length <= 20) {
                    for (var i in username) {
                        if (chars.indexOf(username[i]) == -1) return 5;
                    }
                    if (password != '' && password != null) {
                        if (!password.includes(' ')) {
                            return 0;
                        } else {
                            return 5;
                        }
                    } else {
                        return 4;
                    }
                } else {
                    return 3;
                }
            } else {
                return 2;
            }
        } else {
            return 1;
        }
    },
    loadProgress: async function loadProgress(username, password) {
        if (ENV.offlineMode) return '{}';
        var progress = await getProgress(username, password);
        if (progress != false) {
            return progress;
        }
        warn('Failed to load progress!');
        return false;
    },
    saveProgress: async function saveProgress(username, password, data) {
        if (ENV.offlineMode) return true;
        var status = await updateProgress(username, password, data);
        if (status) {
            return true;
        }
        warn('Failed to save progress!');
        return false;
    },
    ban: async function ban(username) {
        if (ENV.offlineMode) return true;
        var status = await setBanned(username, true);
        if (status) {
            return true;
        }
        warn('Failed to ban user!');
        return false;
    },
    unban: async function unban(username) {
        if (ENV.offlineMode) return true;
        var status = await setBanned(username, false);
        if (status) {
            return true;
        }
        warn('Failed to ban user!');
        return false;
    },
    ipban: async function ban(ip) {
        if (ENV.offlineMode) return true;
        var status = await setIPBanned(ip, true);
        if (status) {
            return true;
        }
        warn('Failed to ban user!');
        return false;
    },
    ipunban: async function unban(ip) {
        if (ENV.offlineMode) return true;
        var status = await setIPBanned(ip, false);
        if (status) {
            return true;
        }
        warn('Failed to ban user!');
        return false;
    }
};
// /*
dbDebug = {
    list: function() {
        try {
            database.query('SELECT username FROM users;', async function(err, res) {
                if (err) forceQuit(err);
                for (var i in res.rows) {
                    console.log(res.rows[i].username);
                }
            });
        } catch (err) {
            forceQuit(err, 2);
        }
    },
    remove: function(username) {
        try {
            database.query('DELETE FROM users WHERE username=$1;', [username], function(err, res) {
                if (err) forceQuit(err);
            });
            return 'Removed "' + username + '" from accounts.';
        } catch (err) {
            forceQuit(err, 2);
        }
    },
    reset: function(username) {
        try {
            database.query('UPDATE users SET data=$2 WHERE username=$1;', [username, null], function(err, res) {
                if (err) forceQuit(err);
            });
            return 'Reset "' + username + '"\'s progress.';
        } catch (err) {
            forceQuit(err, 2);
        }
    },
    purge: function(repeat) {
        try {
            database.query('SELECT username, data FROM users;', async function(err, res) {
                logColor('Purging spam accounts... This may take a while.', '\x1b[33m', 'log');
                if (repeat) logColor('[!] Purge repeat is on [!]', '\x1b[33m', 'log');
                var purged = 0;
                if (err) forceQuit(err);
                var updates = setInterval(function() {
                    logColor('Purged ' + purged + ' accounts', '\x1b[33m', 'log');
                    purged = 0;
                }, 10000);
                for (var i in res.rows) {
                    var allnumbers = true;
                    for (var j in res.rows[i].username) {
                        if (res.rows[i].username[j] != '.' && res.rows[i].username[j] != '0' && res.rows[i].username[j] != '0' && res.rows[i].username[j] != '1' && res.rows[i].username[j] != '2' && res.rows[i].username[j] != '3' && res.rows[i].username[j] != '4' && res.rows[i].username[j] != '5' && res.rows[i].username[j] != '6' && res.rows[i].username[j] != '7' && res.rows[i].username[j] != '8' && res.rows[i].username[j] != '9') {
                            allnumbers = false;
                        }
                    }
                    if (res.rows[i].data === null || allnumbers || ACCOUNTS.validateCredentials(res.rows[i].username, 'hihiyesispassword') != 0) {
                        try {
                            await database.query('DELETE FROM users WHERE username=$1;', [res.rows[i].username]);
                            purged++;
                        } catch (err) {
                            error(err);
                        }
                    }
                    await new Promise(function(resolve, reject) {setTimeout(resolve, 10);});
                }
                logColor('Purged ' + purged + ' accounts', '\x1b[33m', 'log');
                clearInterval(updates);
                if (repeat) {
                    setTimeout(function() {
                        dbDebug.purge(true);
                    }, 300000);
                } else {
                    logColor('Done', '\x1b[33m', 'log');
                }
            });
        } catch (err) {
            forceQuit(err, 2);
        }
    },
    purgeViolent: function(repeat) {
        try {
            database.query('SELECT username, data FROM users;', async function(err, res) {
                logColor('Purging spam accounts... This may take a while.', '\x1b[33m', 'log');
                if (repeat) logColor('[!] Purge repeat is on [!]', '\x1b[33m', 'log');
                var purged = 0;
                if (err) forceQuit(err);
                var updates = setInterval(function() {
                    logColor('Purged ' + purged + ' accounts', '\x1b[33m', 'log');
                    purged = 0;
                }, 10000);
                for (var i in res.rows) {
                    var allnumbers = true;
                    for (var j in res.rows[i].username) {
                        if (res.rows[i].username[j] != '.' && res.rows[i].username[j] != '0' && res.rows[i].username[j] != '0' && res.rows[i].username[j] != '1' && res.rows[i].username[j] != '2' && res.rows[i].username[j] != '3' && res.rows[i].username[j] != '4' && res.rows[i].username[j] != '5' && res.rows[i].username[j] != '6' && res.rows[i].username[j] != '7' && res.rows[i].username[j] != '8' && res.rows[i].username[j] != '9') {
                            allnumbers = false;
                        }
                    }
                    if (res.rows[i].data === null || allnumbers || ACCOUNTS.validateCredentials(res.rows[i].username, 'hihiyesispassword') != 0) {
                        try {
                            await database.query('DELETE FROM users WHERE username=$1;', [res.rows[i].username]);
                            purged++;
                        } catch (err) {
                            error(err);
                        }
                    }
                }
                logColor('Purged ' + purged + ' accounts', '\x1b[33m', 'log');
                clearInterval(updates);
                if (repeat) {
                    setTimeout(function() {
                        dbDebug.purgeViolent(true);
                    }, 300000);
                } else {
                    logColor('Done', '\x1b[33m', 'log');
                }
            });
        } catch (err) {
            forceQuit(err, 2);
        }
    },
    removeOld: function() {
        try {
            database.query('SELECT username, data FROM users;', async function(err, res) {
                logColor('Purging old (>1 year no login) and unused (no data / <10 minutes playtime) accounts... This may take a while.', '\x1b[33m', 'log');
                var purged = 0;
                if (err) forceQuit(err);
                var updates = setInterval(function() {
                    logColor('Purged ' + purged + ' accounts', '\x1b[33m', 'log');
                    purged = 0;
                }, 10000);
                for (var i in res.rows) {
                    var toremove = false;
                    if (res.rows[i].data == null) toremove = true;
                    var data = JSON.parse(res.rows[i].data);
                    if (data) {
                        var lastLogin = data.lastLogin;
                        if (Date.now()-lastLogin > 31536000000) toremove = true;
                        if (data.playTime < 600000 || data.playTime == null) toremove = true;
                    }
                    if (toremove) {
                        purged++;
                        try {
                            // await database.query('DELETE FROM users WHERE username=$1;', [res.rows[i].username]);
                        } catch (err) {
                            error(err);
                        }
                    }
                    await new Promise(function(resolve, reject) {setTimeout(resolve, 10);});
                }
                logColor('Purged ' + purged + ' accounts', '\x1b[33m', 'log');
                clearInterval(updates);
                logColor('Done', '\x1b[33m', 'log');
            });
        } catch (err) {
            forceQuit(err, 2);
        }
    },
};
// */

// credential read/write
async function getCredentials(username) {
    try {
        var data = await database.query('SELECT username, password FROM users WHERE username=$1;', [username]);
        if (data.rows[0]) {
            return {username: data.rows[0].username, password: data.rows[0].password};
        }
    } catch (err) {
        forceQuit(err, 2);
    }
    return false;
};
async function writeCredentials(username, password) {
    try {
        var encryptedpassword = bcrypt.hashSync(password, salt);
    } catch (err) {
        forceQuit(err, 3);
    }
    try {
        await database.query('INSERT INTO users (username, password) VALUES ($1, $2);', [username, encryptedpassword]);
        return true;
    } catch (err) {
        forceQuit(err, 2);
    }
    return false;
};
async function deleteCredentials(username) {
    try {
        await database.query('DELETE FROM users WHERE username=$1;', [username]);
        return true;
    } catch (err) {
        forceQuit(err, 2);
    }
    return false;
};
async function updatePassword(username, password) {
    try {
        var encryptedpassword = bcrypt.hashSync(password, salt);
    } catch (err) {
        forceQuit(err, 3);
    }
    try {
        await database.query('UPDATE users SET password=$2 WHERE username=$1;', [username, encryptedpassword]);
        return true;
    } catch (err) {
        forceQuit(err, 2);
    }
    return false;
};
// progress read/write
async function getProgress(username, password) {
    var cred = await getCredentials(username);
    if (cred) {
        if (bcrypt.compareSync(cryptr.decrypt(password), cred.password)) {
            var data = await database.query('SELECT data FROM users WHERE username=$1;', [username]);
            if (data.rows[0]) {
                return data.rows[0].data;
            }
        } else {
            warn('WARNING: Unauthorized attempt to fetch user data!');
        }
    }
    return false;
};
async function updateProgress(username, password, data) {
    var cred = await getCredentials(username);
    if (cred) {
        if (bcrypt.compareSync(cryptr.decrypt(password), cred.password)) {
            try {
                await database.query('UPDATE users SET data=$2 WHERE username=$1;', [username, data]);
                return true;
            } catch (err) {
                forceQuit(err, 2);
            }
        } else {
            warn('WARNING: Unauthorized attempt to change user data!');
        }
    }
    return false;
};
async function getBanned(username) {
    try {
        var data = await database.query('SELECT banned FROM users WHERE username=$1;', [username]);
        if (data.rows[0]) {
            if (data.rows[0].banned) return true;
        }
    } catch (err) {
        forceQuit(err, 2);
    }
    return false;
};
async function setBanned(username, banned) {
    try {
        await database.query('UPDATE users SET banned=$2 WHERE username=$1;', [username, banned.toString()]);
        return true;
    } catch (err) {
        forceQuit(err, 2);
    }
    return false;
};
async function getIPBanned(ip) {
    try {
        var data = await database.query('SELECT banned FROM ipbans WHERE ip=$1;', [ip]);
        if (data.rows[0]) {
            if (data.rows[0].banned) return true;
        }
    } catch (err) {
        forceQuit(err, 2);
    }
    return false;
};
async function setIPBanned(ip, banned) {
    try {
        if (banned) {
            if (!getIPBanned(ip)) {
                await database.query('INSERT INTO ipbans (ip, banned) VALUES ($1, $2);', [ip, true]);
            }
        } else {
            await database.query('DELETE FROM ipbans WHERE ip=$1', [ip]);
        }
        return true;
    } catch (err) {
        forceQuit(err, 2);
    }
    return false;
};