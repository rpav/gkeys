const { say, str } = require("./util.js");
const { Hardware } = require('keysender');
const WindowTracker = require('./WindowTracker.js');

class EventManager {
    constructor() {
        this.windowTracker = new WindowTracker;
        this.sendkey = new Hardware(this.windowTracker.handle());

        this.windowTracker.on('window-changed', (hwnd, exe) => {
            this.sendkey.workwindow.set(hwnd);
        });
    }

    sendEvent(name, state) {
        switch (name) {
            case 'lmb': this.sendkey.mouse.toggle('left', state); break;
            case 'mmb': this.sendkey.mouse.toggle('middle', state); break;
            case 'rmb': this.sendkey.mouse.toggle('right', state); break;
    
            default:
                this.sendkey.keyboard.toggleKey(name, state);
        }
    }
}

module.exports = EventManager;