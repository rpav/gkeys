#!/usr/bin/env node

const HID = require('node-hid');
const { say, str } = require("./lib/util.js");
const { Hardware } = require('keysender');
const ffi = require('ffi-napi');

const path = require('path');
const ps = require('process');
const { fork } = require('child_process');

const user32ex = ffi.Library("user32", {
    GetForegroundWindow: ["pointer", []],
});

let devices = HID.devices();
let deviceInfo = devices.find(function (d) {
    return d.vendorId === 0x03a8 && d.productId === 0xa649 &&
        d.usagePage === 0xFF60 && d.usage === 0x61;
});

let curHwnd = user32ex.GetForegroundWindow().address();
let ww = new Hardware(curHwnd);

const watchPath = path.resolve('./lib/windowWatcher.js');
const watchProcess = fork(watchPath, [],
    { stdio: ['pipe', 'pipe', 'pipe', 'ipc'] });

watchProcess.on('message', str => {
    const msg = JSON.parse(str);
    ww.workwindow.set(msg.hwnd);
    say("msg: ", msg);
});

if (deviceInfo) {
    const kb = new HID.HID(deviceInfo.path);

    kb.on("data", function (data) {
        let kx = data[0];
        let ky = data[1];
        let bits = data[2];

        if (ww && ww.workwindow.isForeground()) {
            ww.keyboard.toggleKey("x", !!(bits & 1));
        }
    });
    kb.on("error", function (err) { say("error ", err); })
} else {
    say("No device found.");
}