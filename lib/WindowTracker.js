const path = require('path');
const { fork } = require('child_process');

const { user32ex } = require("./win32.js");
const { EventEmitter } = require('events');

class WindowTracker extends EventEmitter {
    constructor() {
        super();

        this._curHwnd = user32ex.GetForegroundWindow().address();

        const watchPath = path.resolve('./lib/windowWatcher.js');
        this.watchProcess = fork(watchPath, [],
            { stdio: ['pipe', 'pipe', 'pipe', 'ipc'] });

        this.watchProcess.on('message', str => {
            const msg = JSON.parse(str);
            this._curHwnd = msg.hwnd;

            this.emit('window-changed', msg.hwnd, msg.basename);
            this.emit('profile-changed', msg.profile, msg.basename);
        });
    }

    handle() {
        return this._curHwnd;
    }
}


module.exports = WindowTracker;