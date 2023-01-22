const ValidKeyList = [
    'backspace',  'tab',    'enter',    'pause',    'capslock', 'escape',
    'space',      'pageup', 'pagedown', 'end',      'home',     'left',
    'up',         'right',  'down',     'prntscrn', 'insert',   'delete',
    '0',          '1',      '2',        '3',        '4',        '5',
    '6',          '7',      '8',        '9',        'a',        'b',
    'c',          'd',      'e',        'f',        'g',        'h',
    'i',          'j',      'k',        'l',        'm',        'n',
    'o',          'p',      'q',        'r',        's',        't',
    'u',          'v',      'w',        'x',        'y',        'z',
    'num0',       'num0',   'num1',     'num2',     'num3',     'num4',
    'num5',       'num6',   'num7',     'num8',     'num9',     'num*',
    'num+',       'num,',   'num-',     'num.',     'num/',     'f1',
    'f2',         'f3',     'f4',       'f5',       'f6',       'f7',
    'f8',         'f9',     'f10',      'f11',      'f12',      'f13',
    'f14',        'f15',    'f16',      'f17',      'f18',      'f19',
    'f20',        'f21',    'f22',      'f23',      'f24',      'numlock',
    'scrolllock', ';',      '=',        ',',        '-',        '.',
    '/',          '~',      '[',        '|',        ']',        '\'',
    "alt",        "ctrl",   "shift",    "lshift",   "rshift",   "lctrl",
    "rctrl",      "lalt",   "ralt",     "lwin",     "rwin"
];
const ValidKeyMap = Object.fromEntries(ValidKeyList.map(x => [x, true]));

const ValidShifted = [
    [ "A", "a" ], [ "B", "b" ], [ "C", "c" ], [ "D", "d" ], [ "E", "e" ],
    [ "F", "f" ], [ "G", "g" ], [ "H", "h" ], [ "I", "i" ], [ "J", "j" ],
    [ "K", "k" ], [ "L", "l" ], [ "M", "m" ], [ "N", "n" ], [ "O", "o" ],
    [ "P", "p" ], [ "Q", "q" ], [ "R", "r" ], [ "S", "s" ], [ "T", "t" ],
    [ "U", "u" ], [ "V", "v" ], [ "W", "w" ], [ "X", "x" ], [ "Y", "y" ],
    [ "Z", "z" ], [ "!", "1" ], [ "@", "2" ], [ "#", "3" ], [ "$", "4" ],
    [ "%", "5" ], [ "^", "6" ], [ "&", "7" ], [ "*", "8" ], [ "(", "9" ],
    [ ")", "0" ], [ "~", "`" ], [ "_", "-" ], [ "+", "=" ], [ "{", "[" ],
    [ "}", "]" ], [ ":", ";" ], [ '"', "'" ], [ "<", "," ], [ ">", "." ],
    [ "?", "/" ],
];
const ValidShiftedMap = Object.fromEntries(ValidShifted.map((e) => {return [e[0], ["shift", e[1]]]}));

const ValidMouseList = ["lmb", "rmb", "mmb"];
const ValidMouseMap = Object.fromEntries(ValidMouseList.map(x => [x, true]));

module.exports = {
    ValidKeyMap, ValidShiftedMap, ValidMouseMap,
}