const {say, str, prn} = require('./lib/util.js');
const {bundle} = require('./lib/Bundle.js');

function data() { return bundle().profileManager.currentProfileData(); }
const D = {};

class GKeys {
    setLayer(name) {
        const pm = bundle().profileManager;

        let layer = pm.findLayer(name);
        if(layer) {
            pm.setLayer(layer);
            return true;
        }
        return false;
    }

    currentLayer() {
        const pm = bundle().profileManager;
        return pm.currentLayer().name;
    }
}

const ToggleLayerS = Symbol.for("ToggleLayer");

function ToggleLayerSetup() {
    if(D[ToggleLayerS]) return;

    try {
        const pm = bundle().profileManager;  // Why does this silently cause failure if it's not in a try block?
        
        D[ToggleLayerS] = {
            stack: [],
        };

        pm.autoSwitchHook.add(() => {
            D[ToggleLayerS].stack = [];
        });
    } catch(e) {
        prn(e);
    }
}

function ToggleBack(owner) {
    const pm = bundle().profileManager;
    const stack = D[ToggleLayerS].stack;

    if(stack.length == 0) return;

    let top = stack.at(-1);
    if(top.owner != owner) return false;

    stack.pop();
    if(top.profile) pm.setCurrentProfile(pm.findProfileByName(top.profile));
    if(top.layer) pm.setLayer(pm.findLayer(top.layer));
    prn('<= ', top.profile ? str(top.profile, ':', top.layer) : top.layer);

    return true;
}

class Toggle {
    constructor(config) {
        this.config = config || {};
        ToggleLayerSetup();

        if(this.config.isOneshot) {
            this._osf = (ev, state) => {
                if(!state) return;
                if(ToggleBack(this)) bundle().eventManager.postEventHook.delete(this._osf);
            };
        }
    }

    exec(state) {
        if(!state) return;

        const pm = bundle().profileManager;

        let frame = {
            profile: this.config.profile ? pm.currentProfile().name : undefined,
            layer: this.config.layer ? pm.currentLayer().name : undefined,
            owner: this.config.isOneshot ? this : undefined
        };

        if(this.config.profile) {
            let profile = pm.findProfileByName(this.config.profile);
            if(profile) {
                pm.setCurrentProfile(profile);
            } else {
                prn('Profile not found: ', this.config.profile);
                return;
            }
        }

        D[ToggleLayerS].stack.push(frame);
        prn('=> ', this.config.profile ? str(this.config.profile, ':', this.config.layer) : this.config.layer);

        if(this.config.layer) {
            let layer = pm.findLayer(this.config.layer);
            if(layer) pm.setLayer(layer);
            else prn('Layer not found: ', this.config.layer);
        }

        if(this.config.isOneshot) { bundle().eventManager.postEventHook.add(this._osf); }
    }
}

class ShiftLayer {
    constructor(name) { this.name = name; }

    exec(state) {
        const pm = bundle().profileManager;
        if(state) {
            this.profile = pm.currentProfile();
            this.last = pm.currentLayer();
            pm.setLayer(pm.findLayer(this.name));
            prn('-^ ', this.profile.name, ':', this.name);
        } else {
            pm.setProfileLayer(this.profile, this.last);
            prn('v- ', this.profile.name, ':', this.last.name);
            this.profile = null;
            this.last = null;
        }
    }
}

function tog(name) { return new Toggle({layer: name}); }
function one(name) { return new Toggle({layer: name, isOneshot: true}); }
function prof(name, layer) { return new Toggle({profile: name, layer: layer}); }

function togback(state) {
    if(!state) return;
    ToggleBack();
}

function shft(name) { return new ShiftLayer(name); }

module.exports = {
    keys : new GKeys(), tog, togback, shft, one, prof,
};