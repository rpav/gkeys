// Taken from the editor I'm working on

const {say, str, seq, classof} = require('./util.js');

const util = require('util');

class Key {
    constructor(ks) {
        if(typeof ks == 'string')
            this.parseKey(Key.splitKey(ks));
        else if(typeof ks == 'object') {
            this.parseTermKey(ks);
        }
    }

    static parse(str) {
        let keys = str.split(/\s+/);
        return keys.map(k => new Key(k));
    }

    parseTermKey(tk) {
        this.key = tk.name || tk.sequence;
        this.ctrl = tk.ctrl;
        this.meta = tk.meta;
        this.shift = tk.shift;
    }

    static splitKey(str) {
        if(str.length <= 1)
            return [ str ];

        if(str[str.length - 1] == '-') {
            str = str.substr(0, str.length - 2);
            return [...str.split('-'), '-' ];
        }

        return str.split('-');
    }

    parseKey(ks) {
        if(!ks.length)
            throw `Invalid key sequence: ${ks}`;

        this.key = ks.pop().toLocaleLowerCase();
        ks.forEach(x => this.setModifier(x));
    }

    setModifier(m) {
        switch(m) {
        case 'C':
        case 'Ctrl':
            this.ctrl = true;
            break;
        case 'S':
        case 'Shift':
            this.shift = true;
            break;
        case 'A':
        case 'Alt':
        case 'M':
        case 'Meta':
            this.meta = true;
            break;
        case 'H':
        case 'Hyper':
            this.hyper = true;
            break;
        case 's':
        case 'Super':
            this.super = true;
            break;
        default:
            throw `Bad modifier: '${m}'`;
        }
    }

    anyModifier() {
        return this.ctrl || this.shift || this.meta || this.hyper || this.super;
    }

    anyNonshiftModifier() {
        return this.ctrl || this.meta || this.hyper || this.super;
    }

    toString() {
        let C = this.ctrl ? "C-" : "";
        let S = this.shift ? "S-" : "";
        let M = this.meta ? "M-" : "";
        let H = this.hyper ? "H-" : "";
        let s = this.super ? "s-" : "";
        return `${C}${S}${M}${H}${s}${this.key}`;
    }

    toSequence() {
        let seq = [];
        if(this.ctrl) seq.push('lctrl');
        if(this.meta) seq.push('lalt');
        if(this.super) seq.push('lwin');
        seq.push(this.key);

        return seq.length == 1 ? seq[0] : seq;
    }
}

module.exports = {
    Key,
};
