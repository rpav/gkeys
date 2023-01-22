const { say, str } = require("./util.js");
const ps = require('process');

const { User32 } = require('win32-api');
const ffi = require('ffi-napi');
const ref = require('ref-napi');
const iconv = require('iconv-lite');
const StructDi = require('ref-struct-di');
const { DModel: M, DStruct: DS, DTypes: W } = require('win32-api');

const Struct = StructDi(ref);

const user32 = User32.load();

const titleBuffer = Buffer.alloc(256);
const classBuffer = Buffer.alloc(256);

const user32ex = ffi.Library("user32", {
    GetWindowTextW: ["int", ["pointer", "pointer", "int"]],
    GetClassNameW: ["int", ["pointer", "pointer", "int"]],
});

function findProfileFor(w, c) {
    return str("profiles/", c);
}

function sendMessage(msg) {
    if(ps.send) ps.send(msg);
}

const cb = ffi.Callback("void", ["pointer", "int", "pointer", "long", "long", "int", "int"],
    function(hWinEventHook, event, hwnd, idObject, idChild, idEventThread, dwmsEventTime) {
        let hwndNum = hwnd.address();
        let titleLen = user32ex.GetWindowTextW(hwnd, titleBuffer, titleBuffer.length);
        let classLen = user32ex.GetClassNameW(hwnd, classBuffer, classBuffer.length);
        let winTitle = iconv.decode(titleBuffer.subarray(0, titleLen * 2), 'ucs2');
        let winClass = iconv.decode(classBuffer.subarray(0, classLen * 2), 'ucs2');

        let profileName = findProfileFor(winTitle, winClass);
        let msg = {
            profile: profileName,
            hwnd: hwndNum,
        };
        sendMessage(JSON.stringify(msg));
    },
);


function win32EventLoop() {
    const msg = new Struct(DS.MSG)();
    const pt = new Struct(DS.POINT)();

    msg.pt = pt.ref();

    user32.SetWinEventHook(3, 3, 0, cb, 0, 0, 2);
    while(user32.GetMessageW(msg.ref(), 0, 0, 0)) {
        user32.TranslateMessageEx(msg.ref());
        user32.DispatchMessageW(msg.ref());
    }
}
win32EventLoop();