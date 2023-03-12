const path = require('path');
const os = require('os');
const fs = require('fs');

const {prn, say, str} = require("./util.js");
const {qnotify} = require('./notify.js');

const {ValidEventMap} = require('./KeyData.js');
const {Key} = require('./Key.js');
const Hook = require('./Hook.js');

class ProfileManager {
    constructor() {
        this.profiles = {};
        this.profilesByBasename = {};
        this.documentDir = path.join(os.homedir(), "Documents", "GKeys");
        this.profileDir = path.join(this.documentDir, "profiles");

        this.autoSwitchHook = new Hook();

        fs.mkdirSync(this.profileDir, {recursive: true});

        this.loadSettings();
        this._remapHWMap();
    }

    setting(name, def) {
        const p = this._curProfile;
        if(p && (name in p)) return p[name];
        if(name in this.settings) return this.settings[name];
        return def;
    }

    setupHooks(em) {
        em.postEventHook.add((ev, state) => {
            if(state) return;
            if(em.keysDown) return;

            if(this._waitingProfile) { this.setCurrentProfile(this._waitingProfile); }
            this._waitingProfile = null;
        });

        this._em = em;
    }

    setupFileWatches() {
        if(this._fswatch) return;

        const options = {
            persistent: false,
            recursive: true,
        };
        this._fsfiles = {};
        this._fswatch = fs.watch(this.documentDir, options, (ev, file) => {
            this._fsfiles[file] = ev;

            // We can get multiple events about the same file/change in a row,
            // so queue them for a short period
            if(this._fstimer) clearTimeout(this._fstimer);
            this._fstimer = setTimeout(() => this.watchUpdate(), 200);
        });
    }

    watchUpdate() {
        for(const [file, ev] of Object.entries(this._fsfiles)) {
            const dir = path.dirname(file);
            if(dir == 'profiles') {
                let cur = this.currentProfile();
                let prof = this.loadProfile(path.join(this.documentDir, file), true);

                // E.g. editing the current profile
                if(prof && cur.name == prof.name) this.delayedSetCurrentProfile(prof);
            } else if(path.basename(file) == 'settings.js') this.loadSettings(true);
        }
        this._fsfiles = {};
    }

    loadSettings(isReload = false) {
        const settingsPath = path.join(this.documentDir, "settings.js");
        delete require.cache[settingsPath];
        this.settings = require(settingsPath);

        if(isReload) qnotify("Reloaded settings", settingsPath);
        else prn("Loaded settings: ", settingsPath);
    }

    loadProfile(profilePath, isReload = false) {
        try {
            delete require.cache[profilePath];

            this._curProfileData = {};
            let profile = require(profilePath);
            profile._path = profilePath;
            profile._data = this._curProfileData;
            this.addProfileMatcher(profile);
            this.addProfile(profile);
            if(isReload) qnotify('Reloaded profile', profilePath);
            else prn('Loaded profile', profilePath);

            return profile;
        } catch(e) { qnotify(str('Error loading profile: ', profilePath, ':'), e); }
    }

    loadProfiles() {
        let oldProfile = this._curProfile;
        this.setCurrentProfile(null);

        let files = fs.readdirSync(this.profileDir, {withFileTypes: true});
        for(const file of files) {
            let p = path.parse(file.name);
            if(p.ext == '.js' && file.isFile()) {
                let profilePath = path.join(this.profileDir, file.name);
                this.loadProfile(profilePath);
            }
        }

        if(!oldProfile) this.setCurrentProfile(this.profileDefault);
        else {
            // Restore to potentially a new version of the old profile
            this.delayedSetCurrentProfile(this.findProfileByName(oldProfile.name));
        }

        this.setupFileWatches();
    }

    loadMatchers() {
        let files = fs.readdirSync(this.profileDir, {withFileTypes: true});
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
        if(!profile.match) return;

        switch(profile.match.type) {
            case 'default': this.profileDefault = profile; break;
            case 'basename': this.profilesByBasename[profile.match.name] = profile; break;
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
            if(isNaN(row)) continue;

            layer[row] = data.map(k => this._validateKey(k));
        }

        layer.name = name;
        return layer;
    }

    findProfile(query) {
        if(query.basename) {
            let profile = this.profilesByBasename[query.basename];
            if(profile) return profile;
        }

        return this.profileDefault;
    }

    findProfileByName(name) { return this.profiles[name]; }

    listProfileNames() { return Object.keys(this.profiles); }

    translate(kev) { return this.hwmap[kev.y][kev.x]; }

    // Set the profile after all keys released (which may be immediately, if
    // there are no keys held); prevents swapping profiles during alt-tab which
    // in turn prevents alt-tab
    delayedSetCurrentProfile(profile, conf) {
        if(this._em.keysDown) {
            this._waitingProfile = profile;
            this._waitingConf = conf;
        } else {
            this.setCurrentProfile(profile, conf);
        }
    }

    setCurrentProfile(profile, conf = {}) {
        if(profile == this._curProfile) return;

        if(profile) {
            let lastProfile = this._curProfile;

            if(conf.autoSwitching) { this.autoSwitchHook.forEach(f => f(lastProfile, profile)); }
            this._curProfile = profile;
            this._curProfileData = this._curProfile._data;

            if(lastProfile && lastProfile.onDisable) lastProfile.onDisable();
            if(profile.onEnable) profile.onEnable();

            qnotify(profile.name, str(conf.autoSwitching ? 'Auto-switched' : 'Switched', ' profile'));
        }
    }
    currentProfile() { return this._curProfile; }
    currentProfileData() { return this._curProfileData; }

    findLayer(name) { return this._curProfile._layers[name]; }

    setLayer(layer) {
        if(layer) this._curProfile._curLayer = layer;
    }

    setProfileLayer(profile, layer) {
        if(profile && layer) profile._curLayer = layer;
    }

    currentLayer() { return this._curProfile._curLayer; }

    findMapping(pos) {
        let layer = this._curProfile._curLayer;
        let row = layer[pos.y];
        return row && row[pos.x];
    }

    findMappingFromKev(kev) {
        let pos = this.translate(kev);
        if(pos) return [this.findMapping(pos), pos];
    }

    _remapHWMap() {
        this.hwmap = this.settings.hwmap.map(row => { return row.map(cell => {return { x: cell[1], y: cell[0] }}); });
    }

    _validateKey(k) {
        if(!k || typeof k == 'number') return k;
        
        let ev = ValidEventMap[k];
        if(ev != undefined) return ev;

        if(typeof k == 'function') return k;

        if(Array.isArray(k)) {
            k.forEach((v, i) => { k[i] = this._validateKey(v); });
            return k;
        }

        if(typeof k == 'string') {
            try {
                let key = new Key(k);
                let seq = key.toSequence();
                return this._validateKey(key.toSequence());
            } catch(e) { prn(e); }
        } else if(typeof k.exec == 'function') {
            return k;
        }

        prn("Invalid key: ", k);
    }
}

module.exports = ProfileManager;