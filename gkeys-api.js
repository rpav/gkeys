const {say} = require('./lib/util.js');

let BUNDLE;

function _setBundle(b) {
    if(!BUNDLE) BUNDLE = b;
}

function data() { return BUNDLE.profileManager.currentProfileData(); }
const D = {};

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
    const d = D;
    if(!d[ToggleLayerS])
        d[ToggleLayerS] = {
            stack : [],
        };
}

function ToggleBack(owner) {
    const pm = BUNDLE.profileManager;
    const d = D;
    const stack = d[ToggleLayerS].stack;

    if(stack.length == 0) return;

    let top = stack.at(-1);
    if(top.owner != owner) return false;

    stack.pop();
    if(top.profile) pm.setCurrentProfile(pm.findProfileByName(top.profile));
    if(top.layer) pm.setLayer(pm.findLayer(top.layer));
    return true;
}

class Toggle {
    constructor(config) {
        this.config = config || {};
        ToggleLayerSetup();

        if(this.config.isOneshot) {
            this._osf = (ev, state) => {
                if(!state) return;
                if(ToggleBack(this)) BUNDLE.eventManager.postEventHook.delete(this._osf);
            };
        }
    }

    exec(state) {
        if(!state) return;

        const pm = BUNDLE.profileManager;
        const d = D;

        d[ToggleLayerS].stack.push({
            profile : this.config.profile ? pm.currentProfile().name : undefined,
            layer : pm.currentLayer().name, // We always want to return to the original layer
            owner : this.config.isOneshot ? this : undefined
        });
        if(this.config.profile) pm.setCurrentProfile(pm.findProfileByName(this.config.profile));
        if(this.config.layer) pm.setLayer(pm.findLayer(this.config.layer));

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

function tog(name) { return new Toggle({layer : name}); }
function one(name) { return new Toggle({layer : name, isOneshot : true}); }
function prof(name, layer) { return new Toggle({profile : name, layer : name}); }

function togback(state) {
    if(!state) return;
    ToggleBack();
}

function shft(name) { return new ShiftLayer(name); }

module.exports = {
    _setBundle,
    keys : new GKeys(), tog, togback, shft, one, prof,
};