const {EventEmitter} = require('events');

const HID = require('node-hid');
const { say, str } = require("./util.js");

const RAW_PAGE_ID = 0xFF60;
const RAW_USAGE_ID = 0x61;

class GKeyUSB extends EventEmitter {
    constructor(vid, pid) {
        super();
        
        this.vid = vid;
        this.pid = pid;
        let devices = HID.devices();
        this.deviceInfo = devices.find(function (d) {
            return d.vendorId === vid && d.productId === pid &&
                d.usagePage === RAW_PAGE_ID && d.usage === RAW_USAGE_ID;
        });
    }

    open() {
        if(!this.deviceInfo) throw "Device not found"

        this.dev = new HID.HID(this.deviceInfo.path);
        this.dev.on('data', (data) => {
            this._decodeEmitEvent(data);
        });
    }

    close() {
        if(this.dev) this.dev.close();
    }

    setGKeysMode(enable = true) {
        // todo: real constants
        this.dev.write([0, 0, enable ? 1 : 0]);
    }

    _decodeEmitEvent(data) {
        let msgtype = data[0];

        switch(msgtype) {
            case 0:
                this.emit('key', {
                    x: data[1],
                    y: data[2],
                    state: (data[3] & 1) == 1,
                    bits: data[3],
                });
                break;
        }
    }
}

module.exports = GKeyUSB;