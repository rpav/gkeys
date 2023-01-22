const { say, str } = require("./util.js");
const path = require('path');
const os = require('os');
const fs = require('fs');

class ProfileManager {
    constructor() {
        this.profilesByBasename = {};
        this.documentDir = path.join(os.homedir(), "Documents", "GKeys", "profiles");
        
        fs.mkdirSync(this.documentDir, { recursive: true });
    }

    loadMatchers() {
        let files = fs.readdirSync(this.documentDir, {withFileTypes: true});
        for(const file of files) {
            let p = path.parse(file.name);
            if(p.ext == '.js' && file.isFile()) {
                let profilePath = path.join(this.documentDir, file.name);
                let profile = require(profilePath);
                profile._path = profilePath;
                this.addProfileMatcher(profile)
            }
        }
    }

    addProfileMatcher(profile) {
        if(!profile.match) return;

        switch(profile.match.type) {
            case 'default': 
                this.profileDefault = profile;
                break;
            
            case 'basename':
                this.profilesByBasename[profile.match.name] = profile;
                break;
        }
    }

    findProfile(query) {
        if(query.basename) {
            let profile = this.profilesByBasename[query.basename];
            if(profile) return profile;
        }

        return this.profileDefault;
    }
}

module.exports = ProfileManager;