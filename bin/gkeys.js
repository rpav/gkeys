#!/usr/bin/env node

const {prn, say} = require('../lib/util.js');

const path = require('path');
const ps = require('process');
const RL = require('readline')
const rl =
    RL.createInterface({input : ps.stdin, output : null, terminal : true});

const GKeyUSB = require('../lib/GKeyUSB.js');
const ProfileManager = require('../lib/ProfileManager.js');
const EventManager = require('../lib/EventManager.js');

const { _setBundle } = require('../gkeys-api.js');

const eventManager = new EventManager();
const profileManager = new ProfileManager();
const usbdev = new GKeyUSB(0x03a8, 0xa649);

_setBundle({eventManager, profileManager, usbdev});

profileManager.loadProfiles();

eventManager.windowTracker.on('profile-changed', (profile, exe) => {
    profileManager.setCurrentProfile(profileManager.findProfileByName(profile));
    prn('Switched to \'', exe, '\', profile: \'',
        profileManager._curProfile.name, '\'')
});

if(usbdev.deviceInfo) {
    RL.emitKeypressEvents(ps.stdin);

    ps.stdin.setRawMode(true);
    ps.stdin.on('keypress', (str, key) => {
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
        } catch(e) {
            prn(e);
        }
    });
} else {
    prn('No device found.');
}