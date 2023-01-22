#!/usr/bin/env node

const HID = require('node-hid');
const { say, str } = require("./util.js");
const { Hardware } = require('keysender');

const path = require('path');
const ps = require('process');
const { fork } = require('child_process');

let devices = HID.devices();
let deviceInfo = devices.find(function (d) {
    return d.vendorId === 0x03a8 && d.productId === 0xa649 &&
        d.usagePage === 0xFF60 && d.usage === 0x61;
});

let ww;

const watchPath = path.resolve('windowWatcher.js');
const watchProcess = fork(watchPath, [], 
    {stdio: ['pipe', 'pipe', 'pipe', 'ipc']});

watchProcess.on('message', msg => {
    say("msg: ", JSON.parse(msg));
});

if (deviceInfo) {
    const kb = new HID.HID(deviceInfo.path);

    kb.on("data", function (data) {
        let kx   = data[0];
        let ky   = data[1];
        let bits = data[2];

        if(ww && ww.workwindow.isForeground()) {
            ww.keyboard.toggleKey("left", !!(bits & 1));
        }
        say(data); 
    });
    kb.on("error", function (err) { say("error ", err); })
} else {
    say("No device found.");
}