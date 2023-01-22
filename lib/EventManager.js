const {say, str} = require('./util.js');
const {Hardware} = require('keysender');
const WindowTracker = require('./WindowTracker.js');

class EventManager {
    constructor() {
        this.windowTracker = new WindowTracker;
        this.sendkey = new Hardware(this.windowTracker.handle());

        this.windowTracker.on(
            'window-changed',
            (hwnd, exe) => { this.sendkey.workwindow.set(hwnd); });

        this._releaseTracker = [];
    }

    sendEvent(ev, state, pos) {
        if(!this._releaseTracker[pos.y])
            this._releaseTracker[pos.y] = [];

        if(state) {
            this._releaseTracker[pos.y][pos.x] = ev;
        } else {
            let actual = this._releaseTracker[pos.y][pos.x];
            ev = actual, ev;
            this._releaseTracker[pos.y][pos.x] = null;
        }

        switch(ev) {
        case 'lmb':
            this.sendkey.mouse.toggle('left', state);
            break;
        case 'mmb':
            this.sendkey.mouse.toggle('middle', state);
            break;
        case 'rmb':
            this.sendkey.mouse.toggle('right', state);
            break;

        default:
            if(!ValidKeyMap[ev]) {
                say("Invalid key: ", ev);
                break;
            }
            this.sendkey.keyboard.toggleKey(ev, state);
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
}

const ValidKeyList = [
    'backspace',  'tab',    'enter',    'pause',    'capslock', 'escape',
    'space',      'pageup', 'pagedown', 'end',      'home',     'left',
    'up',         'right',  'down',     'prntscrn', 'insert',   'delete',
    '0',          '1',      '2',        '3',        '4',        '5',
    '6',          '7',      '8',        '9',        'a',        'b',
    'c',          'd',      'e',        'f',        'g',        'h',
    'i',          'j',      'k',        'l',        'm',        'n',
    'o',          'p',      'q',        'r',        's',        't',
    'u',          'v',      'w',        'x',        'y',        'z',
    'num0',       'num0',   'num1',     'num2',     'num3',     'num4',
    'num5',       'num6',   'num7',     'num8',     'num9',     'num*',
    'num+',       'num,',   'num-',     'num.',     'num/',     'f1',
    'f2',         'f3',     'f4',       'f5',       'f6',       'f7',
    'f8',         'f9',     'f10',      'f11',      'f12',      'f13',
    'f14',        'f15',    'f16',      'f17',      'f18',      'f19',
    'f20',        'f21',    'f22',      'f23',      'f24',      'numlock',
    'scrolllock', ';',      '=',        ',',        '-',        '.',
    '/',          '~',      '[',        '|',        ']',        '\'',
    "alt",        "ctrl",   "shift",    "lshift",   "rshift",   "lctrl",
    "rctrl",      "lalt",   "ralt",     "lwin",     "rwin"
];
const ValidKeyMap = Object.fromEntries(ValidKeyList.map(x => [x, true]));

module.exports = EventManager;