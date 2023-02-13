const {prn, say} = require('./util.js');
const {Hardware} = require('keysender');
const WindowTracker = require('./WindowTracker.js');
const {ValidKeyMap} = require('./KeyData.js');
const Hook = require('./Hook.js');
const {bundle} = require('./Bundle.js');

const DELAY_DEFAULT = 350;
const REPEAT_DEFAULT = 50;

class EventManager {
    constructor() {
        this.windowTracker = new WindowTracker;
        this.sendkey = new Hardware(this.windowTracker.curWinHandle());

        this.windowTracker.on('window-changed', (hwnd, exe) => { this.sendkey.workwindow.set(hwnd); });

        this._releaseTracker = [];
        this._fdata = [];

        this.preEventHook = new Hook();
        this.postEventHook = new Hook();

        this.keysDown = 0;
    }

    _keyTrack(ev, state, pos) {
        if(!this._releaseTracker[pos.y]) this._releaseTracker[pos.y] = [];

        if(state) {
            if(!this._releaseTracker[pos.y][pos.x]) this.keysDown++;

            this._releaseTracker[pos.y][pos.x] = ev;
        } else {
            let actual = this._releaseTracker[pos.y][pos.x];
            ev = actual || ev;
            this._releaseTracker[pos.y][pos.x] = null;
            this.keysDown--;
        }

        return ev;
    }

    sendEvent(ev, state, pos) {
        // keyTrack should only be called for the _top level_ event, which is responsible for the key release
        if(pos) ev = this._keyTrack(ev, state, pos);

        this.preEventHook.forEach(f => f(ev, state, pos));
        this.postEventHook.withAddsDelayed(() => {
            this._sendDispatch(ev, state, pos);
            this.postEventHook.forEach(f => f(ev, state, pos));
        });
    }

    _sendDispatch(ev, state, pos) {
        if(!ev) return;

        if(typeof ev == 'string' || typeof ev == 'number') this._sendSingle(ev, state);
        else if(Array.isArray(ev)) this._sendArray(ev, state, pos);
        else if(typeof ev == 'function') this._sendFunction(ev, state, pos);
        else if(typeof ev.exec == 'function') ev.exec(state, pos);
        else prn("Don't know how to send: ", ev);
    }

    _sendArray(ev, state, pos) {
        if(state) {
            for(let i = 0; i < ev.length; ++i) this._sendDispatch(ev[i], state, pos);
        } else {
            for(let i = ev.length; i > 0; --i) this._sendDispatch(ev[i - 1], state, pos);
        }
    }

    _sendFunction(ev, state, pos) {
        if(!this._fdata[pos.y]) this._fdata[pos.y] = [];
        let data = state ? (this._fdata[pos.y][pos.x] = {}) : this._fdata[pos.y][pos.x];
        
        ev(state, data, pos);
        
        if(!state) this._fdata[pos.y][pos.x] = null;
    }

    _sendSingle(ev, state) {
        switch(ev) {
        case 'lmb': this.sendkey.mouse.toggle('left', state); break;
        case 'mmb': this.sendkey.mouse.toggle('middle', state); break;
        case 'rmb': this.sendkey.mouse.toggle('right', state); break;

        default:
            this.sendkey.keyboard.toggleKey(ev, state);
            this._repeatKey = state ? ev : null;
            this.updateRepeatTimer();

            break;
        }
    }

    releaseAll() {
        for(let y = 0; y < this._releaseTracker.length; ++y) {
            let row = this._releaseTracker[y];
            if(!row) continue;

            for(let x = 0; x < row.length; ++x) {
                let ev = row[x];
                if(!ev) continue;

                this.sendEvent(ev, false, {x, y});
            }
        }
    }

    updateRepeatTimer() {
        if(this._timer) clearInterval(this._timer);
        if(this._repeatKey) {
            const pm = bundle().profileManager;
            this._timer = setTimeout(() => {
                this._timer = null;
                this.repeatFunc()
            }, pm.setting('delay', DELAY_DEFAULT));
        }
    }

    repeatFunc() {
        this.sendkey.keyboard.toggleKey(this._repeatKey, true);
        if(!this._timer) {
            const pm = bundle().profileManager;
            this._timer = setInterval(() => this.repeatFunc(), pm.setting('repeat', REPEAT_DEFAULT));
        }
    }
}

module.exports = EventManager;