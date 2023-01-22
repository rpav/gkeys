#!/usr/bin/env node

const ps = require('process');
const RL = require('readline')
const rl = RL.createInterface({ input: ps.stdin, output: null, terminal: true });

const { say, str } = require("./lib/util.js");
const GKeyUSB = require('./lib/GKeyUSB.js');

let usbdev = new GKeyUSB(0x03a8, 0xa649);

if (!usbdev.deviceInfo) {
    say("No device found.");
    ps.exit(1);
}

let rows = [];
let curRow = 0;
let curCol = 0;

function printMsg() {
    say("Press keys in row ", curRow, ", press Enter for next row or Ctrl+C to finish");
}

function printResults() {
    for(let i = 0; i < rows.length; i++)
        rows[i] = rows[i] || [];

    say("Copy the following into your settings.js:");
    say("mapping: ", rows, ",");
}

RL.emitKeypressEvents(ps.stdin);

ps.stdin.setRawMode(true);
ps.stdin.on('keypress', (str, key) => {
    if(key.name == 'c' && key.ctrl) {
        ps.stdout.write("\n");
        printResults();
        usbdev.setGKeysMode(false);
        usbdev.close();
        ps.exit();
    } else if(key.name == 'return') {
        curRow++;
        ps.stdout.write("\n");
        printMsg();
    }
});

usbdev.open();
usbdev.setGKeysMode();

usbdev.on("key", (kev) => {
    if(!kev.state) return;
    if(!rows[kev.y]) rows[kev.y] = [];

    rows[kev.y][kev.x] = [curRow, curCol];
    ps.stdout.write(curCol + " ");
    curCol++;
});
printMsg();
