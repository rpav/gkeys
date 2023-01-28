const {say} = require('./lib/util.js');

let BUNDLE;

function _setBundle(b) {
    if(!BUNDLE)
        BUNDLE = b;
}

function data() { return BUNDLE.profileManager.currentProfileData(); }

class GKeys {
    setLayer(name) {
        const pm = BUNDLE.profileManager;

        let layer = pm.findLayer(name);
        if(layer) {
            pm.setLayer(layer);
            return true;
        }
        return false;
    }

    currentLayer() {
        const pm = BUNDLE.profileManager;
        return pm.currentLayer().name;
    }
}

const ToggleLayerS = Symbol.for("ToggleLayer");

function ToggleLayerSetup() {
    const d = data();
    if(!d[ToggleLayerS])
        d[ToggleLayerS] = {
            stack : [],
            togBack : new ToggleLayerBack(),
        };
}

class ToggleLayer {
    constructor(name) {
        this.name = name;
        ToggleLayerSetup();
    }

    exec(state) {
        if(!state)
            return;

        const pm = BUNDLE.profileManager;
        const d = data();

        d[ToggleLayerS].stack.push(pm.currentLayer().name);
        pm.setLayer(pm.findLayer(this.name));
    }
}

class ToggleLayerBack {
    exec(state) {
        if(!state)
            return;

        const pm = BUNDLE.profileManager;
        const d = data();
        const stack = d[ToggleLayerS].stack;

        if(stack.length == 0)
            return;

        let old = stack.pop();
        pm.setLayer(pm.findLayer(old));
    }
}

class ShiftLayer {
    constructor(name) {
        this.name = name;
    }

    exec(state) {
        const pm = BUNDLE.profileManager;
        if(state) {
            this.last = pm.currentLayer();
            pm.setLayer(pm.findLayer(this.name));
        } else {
            pm.setLayer(this.last);
            this.last = null;
        }
    }
}

function tog(name) { return new ToggleLayer(name); }
function togback() {
    const d = data();
    return d[ToggleLayerS].togBack;
}

function shft(name) {
    return new ShiftLayer(name);
}

module.exports = {
    _setBundle,
    gkeys : new GKeys(), tog, togback, shft,
};