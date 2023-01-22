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

        this._releaseTracker = [];
    }

    sendEvent(ev, state, pos) {
        if(!this._releaseTracker[pos.y]) this._releaseTracker[pos.y] = [];

        if(state) {    
            this._releaseTracker[pos.y][pos.x] = ev;
        } else {
            let actual = this._releaseTracker[pos.y][pos.x];
            ev = actual || ev;
            this._releaseTracker[pos.y][pos.x] = null;
        }
    
        switch (ev) {
            case 'lmb': this.sendkey.mouse.toggle('left', state); break;
            case 'mmb': this.sendkey.mouse.toggle('middle', state); break;
            case 'rmb': this.sendkey.mouse.toggle('right', state); break;
    
            default:
                this.sendkey.keyboard.toggleKey(ev, state);
        }
    }
}

module.exports = EventManager;