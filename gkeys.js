#!/usr/bin/env node

const { say, str } = require("./lib/util.js");
const ffi = require('ffi-napi');

const path = require('path');
const ps = require('process');
const rl = require('readline');
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

    say("Switched to '", msg.basename,"', profile: '", curProfile.name, "'")
});

function sendEvent(name, state) {
    switch(name) {
        case 'lmb': ww.mouse.toggle('left', state); break;
        case 'mmb': ww.mouse.toggle('middle', state); break;
        case 'rmb': ww.mouse.toggle('right', state); break;

        default:
            ww.keyboard.toggleKey(name, state);
    }
}

if (usbdev.deviceInfo) {
    usbdev.open();

    rl.createInterface({ input: ps.stdin, output: ps.stdout }).on('SIGINT', () => {
        usbdev.setGKeysMode(false);
        usbdev.close();
        ps.exit();
    });
    usbdev.setGKeysMode();

    usbdev.on("key", (kev) => {
        if (ww && ww.workwindow.isForeground() && curProfile && curProfile._curLayer) {
            let layer = curProfile._curLayer;
            let row = layer[kev.y];
            let k = row && row[kev.x];

            if (k) sendEvent(k, kev.state);
        }
    });
} else {
    say("No device found.");
}