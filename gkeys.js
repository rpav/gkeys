#!/usr/bin/env node

const HID        = require('node-hid');
const {say, str} = require("./util.js");

let devices    = HID.devices();
let deviceInfo = devices.find(function(d) {
    var isTeensy = d.vendorId === 0x03a8 && d.productId === 0xa649;
    return isTeensy && d.usagePage === 0xFF60 && d.usage === 0x61;
});

if(deviceInfo) {
    const kb = new HID.HID(deviceInfo.path);

    kb.on("data", function(data) { say(data); });
    kb.on("error", function(err) { say("error ", err); })
} else {
    say("No device found.");
}
