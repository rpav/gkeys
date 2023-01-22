#!/usr/bin/env node

const { say, str } = require("./lib/util.js");
const ffi = require('ffi-napi');

const path = require('path');
const ps = require('process');
const RL = require('readline')
const rl = RL.createInterface({ input: ps.stdin, output: null, terminal: true });

const { fork } = require('child_process');

const GKeyUSB = require('./lib/GKeyUSB.js');

const ProfileManager = require('./lib/ProfileManager.js');
const { Hardware } = require('keysender');

const profileManager = new ProfileManager();
profileManager.loadProfiles();

const user32ex = ffi.Library("user32", {
    GetForegroundWindow: ["pointer", []],
});

let usbdev = new GKeyUSB(0x03a8, 0xa649);

let curHwnd = user32ex.GetForegroundWindow().address();
let ww = new Hardware(curHwnd);
let curProfile = profileManager.profileDefault;

const watchPath = path.resolve('./lib/windowWatcher.js');
const watchProcess = fork(watchPath, [],
    { stdio: ['pipe', 'pipe', 'pipe', 'ipc'] });

watchProcess.on('message', str => {
    const msg = JSON.parse(str);
    ww.workwindow.set(msg.hwnd);
    curProfile = profileManager.findProfileByName(msg.profile);

    say("Switched to '", msg.basename, "', profile: '", curProfile.name, "'")
});

function sendEvent(name, state) {
    
    switch (name) {
        case 'lmb': ww.mouse.toggle('left', state); break;
        case 'mmb': ww.mouse.toggle('middle', state); break;
        case 'rmb': ww.mouse.toggle('right', state); break;

        default:
            ww.keyboard.toggleKey(name, state);
    }
}

if (usbdev.deviceInfo) {
    RL.emitKeypressEvents(ps.stdin);

    ps.stdin.setRawMode(true);
    ps.stdin.on('keypress', (str, key) => {
        if (key.name == 'c' && key.ctrl) {
            usbdev.setGKeysMode(false);
            usbdev.close();
            ps.exit();
        }
    });

    usbdev.open();
    usbdev.setGKeysMode();

    usbdev.on("key", (kev) => {
        try {
            if (ww && ww.workwindow.isForeground() && curProfile && curProfile._curLayer) {
                let pos = profileManager.translate(kev);
                let layer = curProfile._curLayer;
                let row = layer[pos.y];
                let k = row && row[pos.x];
                
                if (k) sendEvent(k, kev.state);
            }
        } catch (e) {
            say(e);
        }
    });
} else {
    say("No device found.");
}