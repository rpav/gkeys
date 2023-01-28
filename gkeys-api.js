const {say} = require('./lib/util.js');

let BUNDLE;

function _setBundle(b) {
    if(!BUNDLE) BUNDLE = b;
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
        };
}

function ToggleBack(owner) {
    const pm = BUNDLE.profileManager;
    const d = data();
    const stack = d[ToggleLayerS].stack;

    if(stack.length == 0) return;

    let top = stack.at(-1);
    if(top.owner != owner) return false;

    stack.pop();
    pm.setLayer(pm.findLayer(top.layer));
    return true;
}

class Toggle {
    constructor(config) {
        this.config = config || {};
        ToggleLayerSetup();

        if(this.config.isOneshot) {
            this._osf = (ev, state) => {
                if(!state) return;
                if(ToggleBack(this))
                    BUNDLE.eventManager.postEventHook.delete(this._osf);
            };
        }
    }

    exec(state) {
        if(!state) return;

        const pm = BUNDLE.profileManager;
        const d = data();

        d[ToggleLayerS].stack.push({
            layer : pm.currentLayer().name,
            owner : this.config.isOneshot ? this : undefined
        });
        pm.setLayer(pm.findLayer(this.config.layer));

        if(this.config.isOneshot) { BUNDLE.eventManager.postEventHook.add(this._osf); }
    }
}

class ShiftLayer {
    constructor(name) { this.name = name; }

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

function tog(name) { return new Toggle({layer: name}); }
function one(name) { return new Toggle({layer: name, isOneshot: true}); }
function togback(state) {
    if(!state) return;
    ToggleBack();
}

function shft(name) { return new ShiftLayer(name); }

module.exports = {
    _setBundle,
    gkeys : new GKeys(), tog, togback, shft, one,
};