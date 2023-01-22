const ___ = null;

module.exports = {
    name: 'VSCode',
    match: { type: 'basename', name: 'Code.exe' },

    defaultLayer: 'base',
    
    layers: {
        base: {
            //    0    1    2    3    4    5             
            0: [ ___, ___, ___, ___, ___, ___ ],
            1: [ ___, ___, ___, "w", ___, ___ ],
            2: [ ___, ___, "a", "s", "d", ___ ],
            3: [ ___, ___, ___, ___, ___, ___ ],
            4: [ ___, ___, ___, ___, ___, ___ ],
        }                
    }
};