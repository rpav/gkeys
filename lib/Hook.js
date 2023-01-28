const {prn, say} = require('./util.js');

class Hook {
    constructor() {
        this._entries = new Set;
        this._adds = new Set;
        this._removals = new Set;
    }

    add(f) {
        if(this.delayAdds) {
            this._adds.add(f);
            return;
        } 

        this._entries.add(f); 
    }

    delete(f) { this._removals.add(f); }

    forEach(f) {
        this.doRemovals();
        this._entries.forEach(f);
    }

    entries() {
        this.doRemovals()
        return this._entries.entries();
    }

    doAdds() {
        this._adds.forEach(f => this._entries.add(f));
        this._adds.clear();        
    }

    doRemovals() {
        this._removals.forEach(f => this._entries.delete(f));
        this._removals.clear();
    }

    withAddsDelayed(f) {
        let delay = this.delayAdds;
        this.delayAdds = true;
        f();
        this.doAdds();
        this.delayAdds = delay;
    }
}

module.exports = Hook;