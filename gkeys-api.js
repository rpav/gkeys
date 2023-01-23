const {say} = require('./lib/util.js');

let BUNDLE;

function _setBundle(b) {
    if(!BUNDLE)
        BUNDLE = b;
}

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
}

class ToggleLayer {
    constructor(name) {
        this.name = name;
    }

    exec(state) {
        const pm = BUNDLE.profileManager;

        if(!state) return;

        if(this.old) {
            pm.setLayer(pm.findLayer(this.old));
            this.old = null;
            return;
        }

        this.old = pm.currentLayer();
        pm.setLayer(pm.findLayer(this.name));
    }
}

function tog(name) {
    return new ToggleLayer(name);
}

module.exports = {
    _setBundle,
    gkeys : new GKeys(),
    tog,
};