// Copyright (C) 2022 Radioactive64

// sign in
var deleteaccountconfirmed = false;
var changePasswordActive = false;
const signInError = document.getElementById('signInError');
var signedIn = false;
var awaitingResponse = false;
var publicKey;
async function signIn() {
    if (!signedIn && !awaitingResponse) {
        socket.emit('signIn', {
            state: 'signIn',
            username: document.getElementById('username').value,
            password: await RSAencode(document.getElementById('password').value)
        });
        awaitingResponse = true;
    }
};
async function createAccount() {
    if (!signedIn && !awaitingResponse) {
        socket.emit('signIn', {
            state: 'signUp',
            username: document.getElementById('username').value,
            password: await RSAencode(document.getElementById('password').value)
        });
        awaitingResponse = true;
    }
};
async function deleteAccount() {
    if (!signedIn && !awaitingResponse) {
        if (deleteaccountconfirmed) {
            var input = window.prompt('Please enter your password to continue:');
            socket.emit('signIn', {
                state: 'deleteAccount',
                username: document.getElementById('username').value,
                password: await RSAencode(document.getElementById('password').value)
            });
            awaitingResponse = true;
        } else {
            document.getElementById('deleteAccount').innerText = 'Are you Sure?';
            deleteaccountconfirmed = true;
        }
    }
};
async function changePassword() {
    if (!signedIn && !awaitingResponse) {
        if (changePasswordActive) {
            socket.emit('signIn', {
                state: 'changePassword',
                username: document.getElementById('username').value,
                oldPassword: await RSAencode(document.getElementById('password').value),
                password: await RSAencode(document.getElementById('newpassword').value)
            });
            awaitingResponse = true;
        } else {
            document.getElementById('newpassword').style.display = 'block';
            document.getElementById('newpasswordLabel').style.display = 'block';
            changePasswordActive = true;
        }
    }
};
socket.on('signInState', async function(state) {
    switch (state) {
        case 'signedIn':
            document.getElementById('loadingContainer').onanimationend = function() {
                document.getElementById('loadingContainer').style.display = 'none';
            };
            document.getElementById('loadingContainer').style.animationName = 'fadeOut';
            document.getElementById('menuContainer').style.display = 'none';
            document.getElementById('gameContainer').style.display = 'block';
            insertChat({style:'color: #00FF00; font-weight: bold;', text: 'Mountain Guarder ' + version});
            signedIn = true;
            if (document.getElementById('username').value == 'suvanth') {
                if (Math.random() < 0.1) UltraSecretFilters('lsd');
                else UltraSecretFilters('oversaturated');
            }
            break;
        case 'signedUp':
            signInError.style.color = '#00FF00';
            signInError.innerText = 'Successfully signed up!';
            break;
        case 'deletedAccount':
            document.getElementById('deleteAccount').innerText = 'Delete Account';
            deleteaccountconfirmed = false;
            signInError.style.color = '#00FF00';
            signInError.innerText = 'Account successfully deleted.';
            await sleep(1000);
            window.location.reload();
            break;
        case 'changedPassword':
            document.getElementById('newpassword').style.display = 'none';
            document.getElementById('newpasswordLabel').style.display = 'none';
            document.getElementById('newpassword').value = '';
            changePasswordActive = false;
            signInError.style.color = '#00FF00';
            signInError.innerText = 'Password successfully changed.';
            await sleep(1000);
            window.location.reload();
            break;
        case 'incorrectPassword':
            document.getElementById('deleteAccount').innerText = 'Delete Account';
            deleteaccountconfirmed = false;
            document.getElementById('newpassword').style.display = 'none';
            document.getElementById('newpasswordLabel').style.display = 'none';
            document.getElementById('newpassword').value = '';
            changePasswordActive = false;
            signInError.style.color = '#FF0000';
            signInError.innerText = 'Incorrect password.';
            break;
        case 'accountExists':
            signInError.style.color = '#FF0000';
            signInError.innerText = 'Account already exists, try a different username.';
            break;
        case 'noAccount':
            document.getElementById('deleteAccount').innerText = 'Delete Account';
            deleteaccountconfirmed = false;
            document.getElementById('newpassword').style.display = 'none';
            document.getElementById('newpasswordLabel').style.display = 'none';
            document.getElementById('newpassword').value = '';
            changePasswordActive = false;
            signInError.style.color = '#FF0000';
            signInError.innerText = 'Account not found!';
            break;
        case 'alreadySignedIn':
            signInError.style.color = '#FF0000';
            signInError.innerText = 'Already signed in, you may not sign in again!';
            break;
        case 'invalidCharacters':
            document.getElementById('deleteAccount').innerText = 'Delete Account';
            deleteaccountconfirmed = false;
            document.getElementById('newpassword').style.display = 'none';
            document.getElementById('newpasswordLabel').style.display = 'none';
            document.getElementById('newpassword').value = '';
            changePasswordActive = false;
            signInError.style.color = '#FF0000';
            signInError.innerText = 'Invalid characters.';
            break;
        case 'shortUsername':
            document.getElementById('deleteAccount').innerText = 'Delete Account';
            deleteaccountconfirmed = false;
            document.getElementById('newpassword').style.display = 'none';
            document.getElementById('newpasswordLabel').style.display = 'none';
            document.getElementById('newpassword').value = '';
            changePasswordActive = false;
            signInError.style.color = '#FF0000';
            signInError.innerText = 'Your username has to be longer than 3 characters.';
            break;
        case 'longUsername':
            document.getElementById('deleteAccount').innerText = 'Delete Account';
            deleteaccountconfirmed = false;
            document.getElementById('newpassword').style.display = 'none';
            document.getElementById('newpasswordLabel').style.display = 'none';
            document.getElementById('newpassword').value = '';
            changePasswordActive = false;
            signInError.style.color = '#FF0000';
            signInError.innerText = 'Your username has to be 20 characters or less.';
            break;
        case 'noUsername':
            document.getElementById('deleteAccount').innerText = 'Delete Account';
            deleteaccountconfirmed = false;
            document.getElementById('newpassword').style.display = 'none';
            document.getElementById('newpasswordLabel').style.display = 'none';
            document.getElementById('newpassword').value = '';
            changePasswordActive = false;
            signInError.style.color = '#FF0000';
            signInError.innerText = 'Please enter a username.';
            break;
        case 'noPassword':
            document.getElementById('deleteAccount').innerText = 'Delete Account';
            deleteaccountconfirmed = false;
            document.getElementById('newpassword').style.display = 'none';
            document.getElementById('newpasswordLabel').style.display = 'none';
            document.getElementById('newpassword').value = '';
            changePasswordActive = false;
            signInError.style.color = '#FF0000';
            signInError.innerText = 'Please enter a password.';
            break;
        case 'invalidSignIn':
            signInError.style.color = '#FF0000';
            signInError.innerText = 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            signInError.style.color = '#FF0000';
            signInError.innerText += 'You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!';
            window.alert('You did NOT just try to exploit that! You thought you could bypass the sign in??? EVERYTHING for the database is password protected! You can\'t even load progress if you don\'t have the password!')
            break;
        case 'databaseError':
            document.getElementById('deleteAccount').innerText = 'Delete Account';
            deleteaccountconfirmed = false;
            document.getElementById('newpassword').style.display = 'none';
            document.getElementById('newpasswordLabel').style.display = 'none';
            document.getElementById('newpassword').value = '';
            changePasswordActive = false;
            signInError.style.color = '#FF0000';
            signInError.innerText = 'DATABASE ERROR. SERVER STOP. YOU SHOULD NOT SEE THIS.';
            console.error('DATABASE ERROR. SERVER STOP. YOU SHOULD NOT SEE THIS.');
            window.alert('DATABASE ERROR. SERVER STOP. YOU SHOULD NOT SEE THIS.');
            break;
        case 'unavailable':
            signInError.style.color = '#FF0000';
            signInError.innerText = 'This username is unavailable.';
            break;
        case 'banned':
            signInError.style.color = '#FF0000';
            signInError.innerText = 'This account is currently banned.';
            break;
        case 'disabled':
            signInError.style.color = '#FF0000';
            signInError.innerText = 'You cannot create or delete accounts on beta servers.';
            break;
        default: 
            signInError.style.color = '#FF0000';
            signInError.innerText = 'Invalid signInState: ' + state;
            console.error('Invalid signInState: ' + state);
            break;
    }
    awaitingResponse = false;
});
async function RSAencode(text) {
    return await window.crypto.subtle.encrypt({name: 'RSA-OAEP'}, publicKey, new TextEncoder().encode(text));
};
socket.once('publicKey', async function(key) {
    publicKey = await window.crypto.subtle.importKey('jwk', key, {name: "RSA-OAEP", hash: "SHA-256"}, false, ['encrypt']);
});
socket.emit('requestPublicKey');

// window creator
DraggableWindow = function(id) {
    const self = {
        x: 0,
        y: 0,
        width: 900,
        height: 600,
        open: false,
        offsetX: 0,
        offsetY: 0,
        dragging: false,
        window: document.getElementById(id),
        windowBar: document.getElementById(id + 'Bar'),
        windowClose: document.getElementById(id + 'Close'),
        tabs: [],
        currentTab: null
    };
    self.renderWindow = function renderWindow() {
        self.x = Math.min(Math.max(self.x, 0), window.innerWidth-self.width-2);
        self.y = Math.min(Math.max(self.y, 0), window.innerHeight-self.height-3);
        self.window.style.left = self.x + 'px';
        self.window.style.top = self.y + 'px';
    };
    self.windowBar.onmousedown = function(e) {
        self.offsetX = e.pageX-self.x;
        self.offsetY = e.pageY-self.y;
        self.dragging = true;
        resetZIndex();
        self.window.style.zIndex = 6;
    };
    document.addEventListener('mousemove', function(e) {
        if (self.dragging) {
            self.x = e.pageX-self.offsetX;
            self.y = e.pageY-self.offsetY;
            self.renderWindow();
        }
    });
    document.addEventListener('mouseup', function() {
        self.dragging = false;
    });
    self.windowClose.onclick = function() {
        self.hide();
    };

    self.hide = function hide() {
        self.window.style.display = 'none';
        self.open = false;
    };
    self.show = function show() {
        self.window.style.display = 'block';
        resetZIndex();
        self.window.style.zIndex = 6;
        self.open = true;
    };
    self.toggle = function toggle() {
        if (self.open) {
            self.hide();
        } else {
            self.show();
        }
    }
    self.changeTab = function changeTab(tab) {
        for (let i in self.tabs) {
            document.getElementById(self.tabs[i]).style.display = 'none';
        }
        document.getElementById(tab).style.display = '';
        self.currentTab = tab;
    };
    const children = document.getElementById(id + 'Select').children;
    if (children[0]) {
        for (let i in children) {
            const id = children[i].id;
            if (id) {
                self.tabs.push(id.replace('Select', ''));
                children[i].onclick = function() {
                    self.changeTab(id.replace('Select', ''));
                };
            }
        }
        self.changeTab(self.tabs[0]);
    };

    return self;
};
function resetZIndex() {
    document.getElementById('inventory').style.zIndex = 5;
    document.getElementById('settings').style.zIndex = 5;
    document.getElementById('debugConsole').style.zIndex = 5;
};

// menu buttons
var menuopen = false;
function toggleDropdown() {
    if (menuopen) {
        document.getElementById('dropdownMenuItems').style.display = 'none';
        menuopen = false;
    } else {
        document.getElementById('dropdownMenuItems').style.display = 'block';
        menuopen = true;
    }
};
const inventoryWindow = new DraggableWindow('inventory');
const mapWindow = new DraggableWindow('map');
const settingsWindow = new DraggableWindow('settings');
const debugConsoleWindow = new DraggableWindow('debugConsole');
inventoryWindow.hide = function hide() {
    inventoryWindow.window.style.display = 'none';
    inventoryWindow.open = false;
    document.getElementById('invHoverTooltip').style.opacity = 0;
    for (let i in Inventory.items) {
        Inventory.items[i].mousedOver = false;
    }
    for (let i in Inventory.equips) {
        Inventory.equips[i].mousedOver = false;
    }
    if (Inventory.currentDrag) Inventory.dropItem(null, Inventory.currentDrag.stackSize);
    Inventory.currentDrag = null;
    Inventory.currentHover = null;
    if (Shop.currentShop) {
        Shop.currentShop.close();
        inventoryWindow.changeTab('inventoryEquips');
    }
};
inventoryWindow.changeTab = function changeTab(tab) {
    for (let i in inventoryWindow.tabs) {
        document.getElementById(inventoryWindow.tabs[i]).style.display = 'none';
    }
    document.getElementById(tab).style.display = '';
    inventoryWindow.currentTab = tab;
    if (Shop.currentShop) Shop.currentShop.close();
    if (tab == 'inventoryCrafting') {
        for (let i in Crafting.slots) {
            Crafting.slots[i].updateMaterials();
        }
    }
};
mapWindow.width = mapWindow.height;
settingsWindow.width = 500;
settingsWindow.height = 300;
debugConsoleWindow.width = 400;
function openInventory() {
    inventoryWindow.show();
    toggleDropdown();
};
function toggleInventory() {
    inventoryWindow.toggle();
};
function toggleToEquips() {
    if (inventoryWindow.currentTab == 'inventoryEquips') {
        inventoryWindow.toggle();
    } else {
        inventoryWindow.show();
        inventoryWindow.changeTab('inventoryEquips');
    }
};
function toggleToCrafting() {
    if (inventoryWindow.currentTab == 'inventoryCrafting') {
        inventoryWindow.toggle();
    } else {
        inventoryWindow.show();
        inventoryWindow.changeTab('inventoryCrafting');
    }
};
function openMap() {
    mapWindow.show();
    toggleDropdown();
};
function toggleMap() {
    mapWindow.toggle();
};
function openSettings() {
    settingsWindow.show();
    toggleDropdown();
};
function toggleSettings() {
    settingsWindow.toggle();
};
function openDebugConsole() {
    debugConsoleWindow.show();
    toggleDropdown();
};
function toggleDebugConsole() {
    debugConsoleWindow.toggle();
};
function snapWindows() {
    inventoryWindow.renderWindow();
    settingsWindow.renderWindow();
    debugConsoleWindow.renderWindow();
};

// settings
function toggle(setting) {
    settings[setting] = !settings[setting];
    updateSetting(setting);
    saveSettings();
};
function slider(setting) {
    settings[setting] = parseInt(document.getElementById(setting + 'Slider').value);
    updateSetting(setting);
    saveSettings();
};
function updateSetting(setting) {
    var indicatorText = settings[setting];
    switch (setting) {
        case 'fps':
            resetFPS();
            tpsFpsRatio = settings.fps/20;
            indicatorText += 'fps';
            break;
        case 'renderDistance':
            if (player) {
                updateRenderedChunks();
                socket.emit('renderDistance', settings.renderDistance);
            }
            break;
        case 'renderQuality':
            resetCanvases();
            drawFrame();
            indicatorText += '%';
            break;
        case 'fastParticles':
            if (settings.fastParticles) {
                if (settings.particles) {
                    indicatorText = 'on';
                    document.getElementById('fastParticlesToggle').checked = true;
                } else {
                    indicatorText = 'off';
                    document.getElementById('fastParticlesToggle').checked = false;
                }
            } else {
                indicatorText = 'off';
                settings.fastParticles = false;
                document.getElementById('fastParticlesToggle').checked = false;
            }
            break;
        case 'particles':
            if (settings.particles) {
                indicatorText = 'on';
                updateSetting('fastParticles');
            } else {
                indicatorText = 'off';
                var optP = settings.fastParticles;
                settings.fastParticles = false;
                document.getElementById('fastParticlesToggle').checked = false;
                updateSetting('fastParticles');
                settings.fastParticles = optP;
            }
            break;
        case 'coloredLights':
            if (settings.coloredLights) {
                if (settings.lights) {
                    indicatorText = 'on';
                    document.getElementById('coloredLightsToggle').checked = true;
                } else {
                    indicatorText = 'off';
                    document.getElementById('coloredLightsToggle').checked = false;
                }
            } else {
                indicatorText = 'off';
                settings.coloredLights = false;
                document.getElementById('coloredLightsToggle').checked = false;
            }
            break;
        case 'flickeringLights':
            if (settings.flickeringLights) {
                if (settings.lights) {
                    indicatorText = 'on';
                    document.getElementById('flickeringLightsToggle').checked = true;
                } else {
                    indicatorText = 'off';
                    document.getElementById('flickeringLightsToggle').checked = false;
                }
            } else {
                indicatorText = 'off';
                settings.flickeringLights = false;
                document.getElementById('flickeringLightsToggle').checked = false;
            }
            break;
        case 'lights':
            if (settings.lights) {
                indicatorText = 'on';
                updateSetting('coloredLights');
                updateSetting('flickeringLights');
            } else {
                indicatorText = 'off';
                var optP = settings.coloredLights;
                var optP2 = settings.flickeringLights;
                settings.coloredLights = false;
                settings.flickeringLights = false;
                document.getElementById('coloredLightsToggle').checked = false;
                updateSetting('coloredLights');
                document.getElementById('flickeringLightsToggle').checked = false;
                updateSetting('flickeringLights');
                settings.coloredLights = optP;
                settings.flickeringLights = optP2;
            }
            break;
        case 'dialogueSpeed':
            document.getElementById('promptContainer').style.setProperty('--transitionSpeed', ((11-settings.dialogueSpeed)*5) + 'ms');
            break;
        case 'pointerLock':
            return;
            if (settings.pointerLock) {
                indicatorText = 'on';
                document.getElementById('crossHair').style.display = 'block';
            } else {
                indicatorText = 'off';
                document.getElementById('crossHair').style.display = '';
                document.exitPointerLock();
            }
            break;
        case 'useController':
            if (settings.useController) {
                indicatorText = 'on';
                document.getElementById('settingsControllerSelect').style.display = 'block';
                // document.getElementById('keybindsControllerSelect').style.display = 'block';
            } else {
                indicatorText = 'off';
                socket.emit('controllerAxes', {
                    movex: 0,
                    movey: 0,
                    aimx: 0,
                    aimy: 0
                });
                document.getElementById('settingsControllerSelect').style.display = 'none';
                document.getElementById('keybindsControllerSelect').style.display = 'none';
            }
            break;
        case 'chatBackground':
            if (settings.chatBackground) {
                document.getElementById('chatText').style.backgroundColor = '#00000055';
                indicatorText = 'on';
            } else {
                document.getElementById('chatText').style.backgroundColor = '';
                indicatorText = 'off';
            }
            break;
        case 'chatSize':
            document.getElementById('chat').style.width = 20+settings.chatSize*5 + 'vw';
            document.getElementById('chat').style.height = 120+settings.chatSize*20 + 'px';
            document.getElementById('chatText').style.width = 20+settings.chatSize*5 + 'vw';
            document.getElementById('chatText').style.height = 100+settings.chatSize*20 + 'px';
            document.getElementById('chatInput').style.width = 20+settings.chatSize*5 + 'vw';
            indicatorText = settings.chatSize;
            break;
        case 'highContrast':
            if (settings.highContrast) {
                CANVAS.style.filter = 'brightness(90%) saturate(130%) contrast(120%)';
                indicatorText = 'on';
            } else {
                CANVAS.style.filter = '';
                indicatorText = 'off';
            }
            break;
        case 'debug':
            socket.emit('debug', settings.debug);
            if (settings.debug) {
                indicatorText = 'on';
            } else {
                indicatorText = 'off';
            }
            break;
        case 'fullscreen':
            if (settings.fullscreen) {
                if (document.hasFocus()) document.getElementById('gameContainer').requestFullscreen();
                indicatorText = 'on';
            } else {
                if (document.hasFocus()) document.exitFullscreen();
                indicatorText = 'off';
            }
            break;
        default:
            console.error('Invalid setting ' + setting);
            break;
    }
    document.getElementById(setting + 'Indicator').innerText = indicatorText;
};
function controllerToggle(setting) {
    controllerSettings[setting] = !controllerSettings[setting];
    updateControllerSetting(setting);
    saveSettings();
};
function controllerSlider(setting) {
    controllerSettings[setting] = parseInt(document.getElementById(setting + 'Slider').value);
    updateControllerSetting(setting);
    saveSettings();
};
function updateControllerSetting(setting) {
    var indicatorText = controllerSettings[setting];
    switch (setting) {
        case 'sensitivity':
            indicatorText += '%';
            break;
        case 'quadraticSensitivity':
            if (controllerSettings.quadraticSensitivity) {
                indicatorText = 'on';
            } else {
                indicatorText = 'off';
            }
            break;
        case 'driftX':
            indicatorText += '%';
            break;
        case 'driftY':
            indicatorText += '%';
            break;
        default:
            console.error('Invalid setting ' + setting);
            break;
    }
    document.getElementById(setting + 'Indicator').innerText = indicatorText;
};
function saveSettings() {
    var cookiestring = JSON.stringify(settings);
    var cookiestring2 = JSON.stringify(controllerSettings);
    var date = new Date();
    date.setUTCFullYear(date.getUTCFullYear()+10, date.getUTCMonth(), date.getUTCDate());
    document.cookie = 'settings=' + cookiestring + '; expires=' + date + ';';
    document.cookie = 'controllerSettings=' + cookiestring2 + '; expires=' + date + ';';
};
try {
    document.cookie.split('; ').forEach(function(cookie) {
        if (cookie.startsWith('settings=')) {
            cookiesettings = JSON.parse(cookie.replace('settings=', ''));
            for (let i in cookiesettings) {
                if (settings[i] != null) settings[i] = cookiesettings[i];
            }
            settings.debug = false;
            settings.fullscreen = false;
            document.getElementById('fpsSlider').value = settings.fps;
            document.getElementById('renderDistanceSlider').value = settings.renderDistance;
            document.getElementById('renderQualitySlider').value = settings.renderQuality;
            document.getElementById('fastParticlesToggle').checked = settings.fastParticles;
            document.getElementById('particlesToggle').checked = settings.particles;
            document.getElementById('coloredLightsToggle').checked = settings.coloredLights;
            document.getElementById('lightsToggle').checked = settings.lights;
            document.getElementById('dialogueSpeedSlider').value = settings.dialogueSpeed;
            // document.getElementById('pointerLockToggle').checked = settings.pointerLock;
            document.getElementById('useControllerToggle').checked = settings.useController;
            document.getElementById('chatBackgroundToggle').checked = settings.chatBackground;
            document.getElementById('chatSizeSlider').value = settings.chatSize;
            document.getElementById('highContrastToggle').checked = settings.highContrast;
            for (let i in settings) {
                if (i != 'fullscreen') try {updateSetting(i);} catch (err) {console.error(err);}
            }
        } else if (cookie.startsWith('controllerSettings=')) {
            cookiesettings = JSON.parse(cookie.replace('controllerSettings=', ''));
            for (let i in cookiesettings) {
                if (controllerSettings[i] != null) controllerSettings[i] = cookiesettings[i];
            }
            document.getElementById('sensitivitySlider').value = controllerSettings.sensitivity;
            document.getElementById('driftXSlider').value = controllerSettings.driftX;
            document.getElementById('driftYSlider').value = controllerSettings.driftY;
            for (let i in controllerSettings) {
                updateControllerSetting(i);
            }
        }
    });
} catch (err) {
    console.error(err);
}

// customization
document.getElementById('playerHairType').onfocus = function(e) {
    releaseAll();
};
document.getElementById('playerHairColor').onfocus = function(e) {
    releaseAll();
};
document.getElementById('playerSkinColor').onfocus = function(e) {
    releaseAll();
};
document.getElementById('playerShirtColor').onfocus = function(e) {
    releaseAll();
};
document.getElementById('playerPantsColor').onfocus = function(e) {
    releaseAll();
};
document.getElementById('playerHairType').oninput = function(e) {
    socket.emit('playerStyle', {hair: this.value});
};
document.getElementById('playerHairColor').oninput = function(e) {
    socket.emit('playerStyle', {hairColor: this.value});
};
document.getElementById('playerSkinColor').oninput = function(e) {
    socket.emit('playerStyle', {bodyColor: this.value});
};
document.getElementById('playerShirtColor').oninput = function(e) {
    socket.emit('playerStyle', {shirtColor: this.value});
};
document.getElementById('playerPantsColor').oninput = function(e) {
    socket.emit('playerStyle', {pantsColor: this.value});
};

// keybinds
changingKeyBind = false;
function changeKeybind(keybind) {
    if (changingKeyBind == false) {
        changingKeyBind = keybind;
        for (let i in keybinds) {
            updateKeybind(i);
            document.getElementById('keybind_' + i).style.color = '';
        }
        document.getElementById('keybind_' + keybind).style.color = 'yellow';
    }
};
document.addEventListener('keydown', function(e) {
    if (changingKeyBind) {
        if (e.key != 'Meta' && e.key != 'Alt' && e.key != 'Control' && e.key != 'Shift') {
            for (let i in keybinds) {
                document.getElementById('keybind_' + i).style.color = '';
            }
            var oldKeyBind = keybinds[changingKeyBind];
            if (e.key == 'Escape') keybinds[changingKeyBind] = null;
            else keybinds[changingKeyBind] = e.key.toLowerCase();
            e.preventDefault();
            updateKeybind(changingKeyBind);
            if (e.key != 'Escape') {
                for (let i in keybinds) {
                    if (e.key.toLowerCase() == keybinds[i] && typeof e.key.toLowerCase() == typeof keybinds[i] && i != changingKeyBind) {
                        document.getElementById('keybind_' + i).style.color = 'red';
                        document.getElementById('keybind_' + changingKeyBind).style.color = 'red';
                        keybinds[changingKeyBind] = oldKeyBind;
                        return;
                    }
                }
            }
            saveKeybinds();
            changingKeyBind = false;
        }
    }
});
document.addEventListener('mousedown', function(e) {
    if (changingKeyBind) {
        for (let i in keybinds) {
            document.getElementById('keybind_' + i).style.color = '';
        }
        var oldKeyBind = keybinds[changingKeyBind];
        keybinds[changingKeyBind] = e.button;
        e.preventDefault();
        updateKeybind(changingKeyBind);
        for (let i in keybinds) {
            if (e.button == keybinds[i] && typeof e.button == typeof keybinds[i] && i != changingKeyBind) {
                document.getElementById('keybind_' + i).style.color = 'red';
                document.getElementById('keybind_' + changingKeyBind).style.color = 'red';
                keybinds[changingKeyBind] = oldKeyBind;
                return;
            }
        }
        saveKeybinds();
        changingKeyBind = false;
    }
});
function updateKeybind(keybind) {
    var str = keybinds[keybind];
    if (typeof str == 'number') {
        switch (str) {
            case 0:
                str = 'LMB';
                break;
            case 1:
                str = 'CMB';
                break;
            case 2:
                str = 'RMB';
                break;
            default:
                str = 'MB' + str;
                break;
        }
    }
    if (str === ' ') str = 'SPACE';
    if (str === null) str = '&emsp;';
    else str = str.toUpperCase();
    document.getElementById('keybind_' + keybind).innerHTML = str;
    document.getElementById('keybind_' + keybind).style.color = '';
};
function saveKeybinds() {
    var cookiestring = JSON.stringify(keybinds);
    var date = new Date();
    date.setUTCFullYear(date.getUTCFullYear()+10, date.getUTCMonth(), date.getUTCDate());
    document.cookie = 'keybinds=' + cookiestring + '; expires=' + date + ';';
}
try {
    document.cookie.split('; ').forEach(function(cookie) {if (cookie.startsWith('keybinds=')) {
        cookiekeybinds = JSON.parse(cookie.replace('keybinds=', ''));
        for (let i in cookiekeybinds) {
            keybinds[i] = cookiekeybinds[i];
        }
        for (let i in keybinds) {
            updateKeybind(i);
        }
    }});
} catch (err) {
    console.error(err);
}

// fun
var spinnyhuething;
var lsd;
lsdX = 0;
lsdY = 0;
function UltraSecretFilters(filter) {
    document.body.style.filter = '';
    document.body.style.transform = '';
    if (spinnyhuething) clearInterval(spinnyhuething);
    if (lsd) clearInterval(lsd);
    spinnyhuething = null;
    lsd = null;
    switch (filter) {
        case 'deepfried':
            document.body.style.filter = 'url()';
            break;
        case 'oversaturated':
            document.body.style.filter = 'saturate(10)';
            break;
        case 'contrasty':
            document.body.style.filter = 'contrast(3)';
            break;
        case 'bright':
            document.body.style.filter = 'brightness(2)';
            break;
        case 'blurry':
            document.body.style.filter = 'blur(1px)';
            break;
        case 'inverted':
            document.body.style.filter = 'invert(100%)';
            break;
        case 'colors':
            var hue = 0;
            spinnyhuething = setInterval(function() {
                hue++;
                document.body.style.filter = 'hue-rotate(' + hue + 'deg)';
            }, 5);
            break;
        case 'lsd':
            var hue = 0;
            var brightness = 1;
            var brightnessdir = 1;
            var contrast = 1;
            var contrastdir = -1;
            var saturation = 1;
            var saturationdir = 1;
            var blur = 0;
            var invert = 0;
            var scale = 1;
            var scaledir = 1;
            var angle1 = 0;
            var angle2 = 0;
            var angle3 = 0;
            document.body.style.transformOrigin = 'center center';
            lsd = setInterval(function() {
                hue += Math.random()*2;
                if (brightnessdir == 1) brightness += Math.random()*0.01;
                else brightness -= Math.random()*0.01;
                if (contrastdir == 1) contrast += Math.random()*0.01;
                else contrast -= Math.random()*0.01;
                if (saturationdir == 1) saturation += Math.random()*0.01;
                else saturation -= Math.random()*0.01;
                if (scaledir == 1) scale += Math.random()*0.001;
                else scale -= Math.random()*0.001;
                if (brightness > Math.random()*0.5+1) brightnessdir = -1;
                if (brightness < Math.random()*0.5+0.5) brightnessdir = 1;
                if (contrast > Math.random()*0.5+1) contrastdir = -1;
                if (contrast < Math.random()*0.2+0.8) contrastdir = 1;
                if (saturation > Math.random()*0.5+2) saturationdir = -1;
                if (saturation < Math.random()*0.2+0.8) saturationdir = 1;
                if (scale > Math.random()*0.2+1) scaledir = -1;
                if (scale < Math.random()*0.2+0.8) scaledir = 1;
                blur = Math.random();
                if (Math.random() < 0.5) invert = Math.min(1, invert+0.05); 
                else invert = Math.max(0, invert-0.05); 
                document.body.style.filter = 'hue-rotate(' + hue + 'deg) brightness(' + brightness + ') contrast(' + contrast + ') saturate(' + saturation + ') invert(' + Math.round(invert) + ') blur(' + blur + 'px)';
                document.body.style.transform = 'scale(' + scale + ')';
                lsdX = Math.random()*10-5;
                lsdY = Math.random()*10-5;
                angle1 += Math.random()*0.05;
                angle2 += Math.random()*0.1;
                angle3 += Math.random()*0.15;
                lsdX += Math.cos(angle1)*25;
                lsdY += Math.sin(angle1)*25;
                lsdX += Math.cos(angle2)*15;
                lsdY += Math.sin(angle2)*15;
                lsdX += Math.cos(angle3)*10;
                lsdY += Math.sin(angle3)*10;
            }, 5);
            break;
        default:
            break;
    }
};