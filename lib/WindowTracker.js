const path = require('path');
const {fork} = require('child_process');

const {user32ex} = require("./win32.js");
const {EventEmitter} = require('events');

const {say} = require('../lib/util.js');

class WindowTracker extends EventEmitter {
    constructor() {
        super();

        let hwnd = user32ex.GetForegroundWindow();
        this._curHwnd = hwnd.address();
        this._curPid = user32ex.GetWindowThreadProcessId(hwnd, null);

        const watchPath = path.resolve('./lib/windowWatcher.js');
        this.watchProcess = fork(watchPath, [], {stdio: ['pipe', 'pipe', 'pipe', 'ipc']});

        this.watchProcess.on('message', str => {
            const msg = JSON.parse(str);
            this._curHwnd = msg.hwnd;
            this._curPid = msg.pid;
            this._curExe = msg.basename;

            this.emit('window-changed', msg.hwnd, msg.basename, msg.pid);
            this.emit('profile-changed', msg.profile, msg.basename, msg.pid);
        });
    }

    curWinHandle() { return this._curHwnd; }
    curWinPid() { return this._curPid; }
    curWinExe() { return this._curExe; }
}

module.exports = WindowTracker;