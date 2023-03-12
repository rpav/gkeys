const {say, str, prn} = require('./lib/util.js');
const {bundle} = require('./lib/Bundle.js');
const {Key} = require('./lib/Key.js');

function data() { return bundle().profileManager.currentProfileData(); }
const D = {};

/// --- API for functions ---
const GKeys = {
    setLayer(name) {
        const pm = bundle().profileManager;

        let layer = pm.findLayer(name);
        if(layer) {
            pm.setLayer(layer);
            return true;
        }
        return false;
    },

    currentLayer() {
        const pm = bundle().profileManager;
        return pm.currentLayer().name;
    },

    currentLayerStack() {
        return D[ToggleLayerS].stack;
    },

    currentExe() { return bundle().eventManager.windowTracker.curWinExe(); },

    currentPid() { return bundle().eventManager.windowTracker.curWinPid(); },

    send(k, state) { bundle().eventManager.sendEvent(k, state); },
    press(k) { this.send(k, true); },
    release(k) { this.send(k, false); },

    pressAndRelease(k, delay = 50) {
        this.send(k, true);
        setTimeout(() => { this.send(k, false); }, delay);
    },

    tap(k, delay = 50) { return this.pressAndRelease(k, delay); },
    tapIf(state, k, delay = 50) {
        if(state) return this.pressAndRelease(k, delay);
    },

    rapid(k, delay = 50) { return new Rapid(k, delay); },

    tog(name, config = {}) { return new ToggleKey(name, config); },

    evEqual(a, b) {
        if(a == b) return true;

        if(Array.isArray(a) && Array.isArray(b) && a.length == b.length) {
            return a.every((x, i) => this.evEqual(x, b[i]));
        }

        return false;
    },

    evParse(ev) {
        if(typeof (ev) == 'string') return (new Key(ev)).toSequence();
        return ev;
    },
}

/// --- Keys ---

// This is for "mashing" a key, vs simple key repeat
class Rapid {
    constructor(k, delay) {
        this.ev = GKeys.evParse(k);
        this.delay = delay;
    }

    exec(state) {
        if(state) this.start();
        else this.stop();
    }

    start() {
        let state = true;
        GKeys.send(this.ev, state);
        this._timer = setInterval(() => {
            if(!state && this._cancel) {
                clearInterval(this._timer);
                this._cancel = false;
                return;
            }

            state = !state;
            GKeys.send(this.ev, state);
        }, this.delay);

        return this;
    }

    stop() { this._cancel = true; }
};

class ToggleKey {
    constructor(k, config) {
        config ||= {};

        this.ev = GKeys.evParse(k);
        this.eventRunning = false;
        this.justEnabled = false;
        this.butWait = false;

        if(config.whileKeys) {
            this.whileKeys = new Set;
            this.holdKeys = new Set;

            for(const k of config.whileKeys) this.whileKeys.add(GKeys.evParse(k));
            for(const k of config.holdKeys || []) this.holdKeys.add(GKeys.evParse(k));

            this._whileHook = (ev, state) => {
                if(!state || ev == this) return;

                const parsed = GKeys.evParse(ev);

                if(parsed == this.ev || this._inCallback) return;
                this._inCallback = true;

                if(!this.whileKeys.has(parsed)) {
                    bundle().eventManager.preEventHook.delete(this._whileHook);
                    this.release();
                }

                // In the case we push a 'hold key' while the toggle key is still toggled,
                // we do _not_ untoggle; e.g. Run(Press), (ToggleOn), Run(Release); Run(Press), Horse, Run(Release),
                // (LeaveOn)
                this.butWait = this.holdKeys.has(parsed);
                this._inCallback = false;
            };
        }
    }

    exec(state) {
        // If we just pressed to enable and this is the release, do not toggle off
        if(!state && this.justEnabled) {
            this.justEnabled = false;
            return;
        }

        // If we're releasing to disable, but we pressed a hold key, do not toggle off
        if(!state && this.eventRunning && this.butWait) {
            this.butWait = false;
            return;
        }

        if(state == !this.eventRunning) {
            this.eventRunning = state;
            this.justEnabled = state;
            GKeys.send(this.ev, this.eventRunning);
        }

        if(this._whileHook) { bundle().eventManager.preEventHook.set(this._whileHook, this.eventRunning); }
    }

    press() {
        if(this.eventRunning) return;
        this.exec(true);
    }

    release() {
        if(this.eventRunning) {
            return this.exec(false);
        }
    }
}

/// --- Layers ---
const ToggleLayerS = Symbol.for("ToggleLayer");

function ToggleLayerSetup() {
    if(D[ToggleLayerS]) return;

    try {
        const pm = bundle().profileManager; // Why does this silently cause failure if it's not in a try block?

        D[ToggleLayerS] = {
            stack: [],
        };

        pm.autoSwitchHook.add(() => { D[ToggleLayerS].stack = []; });
    } catch(e) { prn(e); }
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

class ToggleLayer {
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

// Layer functions
function togLayer(name) { return new ToggleLayer({layer: name}); }
function one(name) { return new ToggleLayer({layer: name, isOneshot: true}); }
function prof(name, layer) { return new ToggleLayer({profile: name, layer: layer}); }

function togback(state) {
    if(!state) return;
    ToggleBack();
}

function shft(name) { return new ShiftLayer(name); }

module.exports = {
    keys : GKeys, togLayer, togback, shft, one, prof,
};