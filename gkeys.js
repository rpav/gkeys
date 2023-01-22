#!/usr/bin/env node

const { say, str } = require("./lib/util.js");

const path = require('path');
const ps = require('process');
const RL = require('readline')
const rl = RL.createInterface({ input: ps.stdin, output: null, terminal: true });


const GKeyUSB = require('./lib/GKeyUSB.js');
const ProfileManager = require('./lib/ProfileManager.js');
const EventManager = require('./lib/EventManager.js');

const eventManager = new EventManager();
const profileManager = new ProfileManager();
const usbdev = new GKeyUSB(0x03a8, 0xa649);

profileManager.loadProfiles();
let curProfile = profileManager.profileDefault;

eventManager.windowTracker.on('profile-changed', (profile, exe) => {
    curProfile = profileManager.findProfileByName(profile);
    say("Switched to '", exe, "', profile: '", curProfile.name, "'")
});

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
            if (curProfile && curProfile._curLayer) {
                let pos = profileManager.translate(kev);
                let layer = curProfile._curLayer;
                let row = layer[pos.y];
                let k = row && row[pos.x];

                if (k) eventManager.sendEvent(k, kev.state);
            }
        } catch (e) {
            say(e);
        }
    });
} else {
    say("No device found.");
}