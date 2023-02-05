#!/usr/bin/env node

const {prn, say} = require('../lib/util.js');

const path = require('path');
const ps = require('process');
const RL = require('readline')
const rl = RL.createInterface({input: ps.stdin, output: null, terminal: true});

const {Key} = require('../lib/Key.js');
const GKeyUSB = require('../lib/GKeyUSB.js');
const ProfileManager = require('../lib/ProfileManager.js');
const EventManager = require('../lib/EventManager.js');

const eventManager = new EventManager();
const profileManager = new ProfileManager();
const usbdev = new GKeyUSB(0x03a8, 0xa649);

require('../lib/Bundle.js')._setBundle({eventManager, profileManager, usbdev});

profileManager.loadProfiles();
profileManager.setupHooks(eventManager);

eventManager.windowTracker.on('profile-changed', (profileName, exe) => {
    profileManager.delayedSetCurrentProfile(profileManager.findProfileByName(profileName), {autoSwitching: true});
    prn("Current exe: '", exe, "'");
});

if(usbdev.deviceInfo) {
    RL.emitKeypressEvents(ps.stdin);

    ps.stdin.setRawMode(true);
    ps.stdin.on('keypress', (str, key) => {
        if(key.name == 'return') prn();
        else ps.stdout.write(new Key(key).toString());

        if(key.name == 'c' && key.ctrl) {
            eventManager.releaseAll();
            usbdev.setGKeysMode(false);
            usbdev.close();
            ps.exit();
        }
    });

    usbdev.open();
    usbdev.setGKeysMode();

    usbdev.on('key', (kev) => {
        try {
            const [k, pos] = profileManager.findMappingFromKev(kev);
            eventManager.sendEvent(k, kev.state, pos);
        } catch(e) { prn(e); }
    });
} else {
    prn('No device found.');
}