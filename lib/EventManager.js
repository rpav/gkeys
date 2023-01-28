const {prn, say} = require('./util.js');
const {Hardware} = require('keysender');
const WindowTracker = require('./WindowTracker.js');
const {ValidKeyMap} = require('./KeyData.js');
const Hook = require('./Hook.js');

class EventManager {
    constructor() {
        this.windowTracker = new WindowTracker;
        this.sendkey = new Hardware(this.windowTracker.handle());

        this.windowTracker.on(
            'window-changed',
            (hwnd, exe) => { this.sendkey.workwindow.set(hwnd); });

        this._releaseTracker = [];

        this.preEventHook = new Hook();
        this.postEventHook = new Hook();
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

        this.preEventHook.forEach(f => f(ev, state, pos));
        this.postEventHook.withAddsDelayed(() => {
            this._sendDispatch(ev, state, pos);
            this.postEventHook.forEach(f => f(ev, state, pos));
        });
    }

    _sendDispatch(ev, state, pos) {
        if(!ev) return;

        if(typeof ev == 'string') this._sendSingle(ev, state);
        else if(Array.isArray(ev)) this._sendArray(ev, state);
        else if(typeof ev == 'function') this._sendFunction(ev, state, pos);
        else if(typeof ev.exec == 'function') ev.exec(state, pos);
        else prn("Don't know how to send: ", ev);
    }

    _sendArray(ev, state) {
        if(state) {
            for(let i = 0; i < ev.length; ++i) this._sendDispatch(ev[i], state);
        } else {
            for(let i = ev.length; i > 0; --i)
                this._sendDispatch(ev[i - 1], state);
        }
    }

    _sendFunction(ev, state, pos) { ev(state, pos); }

    _sendSingle(ev, state) {
        switch(ev) {
        case 'lmb': this.sendkey.mouse.toggle('left', state); break;
        case 'mmb': this.sendkey.mouse.toggle('middle', state); break;
        case 'rmb': this.sendkey.mouse.toggle('right', state); break;

        default:
            if(!ValidKeyMap[ev]) {
                prn("Invalid key: ", ev);
                break;
            }
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
        if(this._repeatKey)
            this._timer = setTimeout(() => {
                this._timer = null;
                this.repeatFunc()
            }, 300);
    }

    repeatFunc() {
        this.sendkey.keyboard.toggleKey(this._repeatKey, true);
        if(!this._timer) this._timer = setInterval(() => this.repeatFunc(), 50);
    }
}

module.exports = EventManager;