#!/usr/bin/env node

const {Hardware} = require('keysender');
const {user32ex} = require("../lib/win32.js");

let hwnd = user32ex.GetForegroundWindow().address();
let sendkey = new Hardware(hwnd);

const keys = [
    'alt', 'ctrl', 'lAlt', 'rAlt', 'lCtrl', 'rCtrl', 'lShift', 'rShift', 'capsLock'
];

for(const k of keys) sendkey.keyboard.toggleKey(k, false);