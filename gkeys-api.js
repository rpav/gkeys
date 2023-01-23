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

module.exports = {
    _setBundle,
    gkeys : new GKeys(),
};