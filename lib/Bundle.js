let BUNDLE;

function _setBundle(b) {
    if(!BUNDLE) BUNDLE = b;
}

function bundle() { return BUNDLE; }

module.exports = {bundle, _setBundle};