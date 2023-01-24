const path = require('path');
const os = require('os');
const fs = require('fs');

const {prn, say, str} = require("./util.js");

const {ValidKeyMap, ValidShiftedMap, ValidMouseMap} = require('./KeyData.js');
const {Key} = require('./Key.js');

class ProfileManager {
    constructor() {
        this.profiles = {};
        this.profilesByBasename = {};
        this.documentDir = path.join(os.homedir(), "Documents", "GKeys");
        this.profileDir = path.join(this.documentDir, "profiles");

        fs.mkdirSync(this.profileDir, {recursive : true});

        this.settings = require(path.join(this.documentDir, "settings.js"));
        this._remapHWMap();
    }

    loadProfiles() {
        let oldProfile = this._curProfile;
        this.setCurrentProfile(null);

        let files = fs.readdirSync(this.profileDir, {withFileTypes : true});
        for(const file of files) {
            let p = path.parse(file.name);
            if(p.ext == '.js' && file.isFile()) {
                this._curProfileData = {};

                let profilePath = path.join(this.profileDir, file.name);
                let profile = require(profilePath);
                profile._path = profilePath;
                profile._data = this._curProfileData;
                this.addProfileMatcher(profile);
                this.addProfile(profile);
            }
        }

        if(!oldProfile)
            this.setCurrentProfile(this.profileDefault);
        else
            this.setCurrentProfile(oldProfile); // Restore
    }

    loadMatchers() {
        let files = fs.readdirSync(this.profileDir, {withFileTypes : true});
        for(const file of files) {
            let p = path.parse(file.name);
            if(p.ext == '.js' && file.isFile()) {
                let profilePath = path.join(this.profileDir, file.name);
                let profile = require(profilePath);
                profile._path = profilePath;
                this.addProfileMatcher(profile)
            }
        }
    }

    addProfileMatcher(profile) {
        if(!profile.match)
            return;

        switch(profile.match.type) {
        case 'default':
            this.profileDefault = profile;
            break;

        case 'basename':
            this.profilesByBasename[profile.match.name] = profile;
            break;
        }
    }

    addProfile(profile) {
        this.profiles[profile.name] = profile;

        if(profile.layers) {
            profile._layers = {};
            for(const [name, layer] of Object.entries(profile.layers)) {
                profile._layers[name] = this.parseLayer(layer, name);
            }
            profile._curLayer = profile._layers[profile.defaultLayer];
        }
    }

    parseLayer(layerIn, name) {
        let layer = [];
        for(const [rowStr, data] of Object.entries(layerIn)) {
            let row = parseInt(rowStr);
            if(isNaN(row))
                continue;

            layer[row] = data.map(k => this._validateKey(k));
        }

        layer.name = name;
        return layer;
    }

    findProfile(query) {
        if(query.basename) {
            let profile = this.profilesByBasename[query.basename];
            if(profile)
                return profile;
        }

        return this.profileDefault;
    }

    findProfileByName(name) { return this.profiles[name]; }

    listProfileNames() { return Object.keys(this.profiles); }

    translate(kev) { return this.hwmap[kev.y][kev.x]; }

    setCurrentProfile(profile) {
        if(profile) {
            this._curProfile = profile;
            this._curProfileData = this._curProfile._data;
        } else {
            this._curProfile = null;
            this._curProfileData = null;
        }
    }
    currentProfile() { return this._curProfile; }
    currentProfileData() { return this._curProfileData; }

    findLayer(name) { return this._curProfile._layers[name]; }

    setLayer(layer) {
        if(layer)
            this._curProfile._curLayer = layer;
    }

    currentLayer() { return this._curProfile._curLayer; }

    findMapping(pos) {
        let layer = this._curProfile._curLayer;
        let row = layer[pos.y];
        return row && row[pos.x];
    }

    findMappingFromKev(kev) {
        let pos = this.translate(kev);
        if(pos)
            return [ this.findMapping(pos), pos ];
    }

    _remapHWMap() {
        this.hwmap = this.settings.hwmap.map(row => {
            return row.map(cell => {return { x: cell[1], y: cell[0] }});
        });
    }

    _validateKey(k) {
        if(!k || ValidKeyMap[k] || ValidMouseMap[k])
            return k;
        if(typeof k == 'function')
            return k;
        if(Array.isArray(k))
            return k.map(k1 => this._validateKey(k1));

        const shifted = ValidShiftedMap[k];
        if(shifted)
            return shifted;

        if(typeof k == 'string') {
            try {
                let key = new Key(k);
                let seq = key.toSequence();
                return this._validateKey(key.toSequence());
            } catch(e) {
                prn(e);
            }
        } else if(typeof k.exec == 'function') {
            return k;
        }

        prn("Invalid key: ", k);
    }
}

module.exports = ProfileManager;