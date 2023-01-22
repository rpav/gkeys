const { say, str } = require("./util.js");
const ProfileManager = require('./ProfileManager.js');

const ps = require('process');
const path = require('path');

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
const exeBuffer   = Buffer.alloc(1024);

const psapi = ffi.Library("Psapi", {
    GetModuleFileNameExW: ["int", ["pointer", "pointer", "pointer", "int"]],
});

const user32ex = ffi.Library("user32", {
    GetWindowTextW: ["int", ["pointer", "pointer", "int"]],
    GetClassNameW: ["int", ["pointer", "pointer", "int"]],
});

const oleacc = ffi.Library("Oleacc", {
    GetProcessHandleFromHwnd: ["pointer", ["pointer"]],
});

const profileManager = new ProfileManager();
profileManager.loadMatchers();

function findProfileFor(w, c, exe) {
    const exePath = path.parse(exe);

    let query = {
        basename: exePath.base,
        fullPath: exe,
        windowClass: c,
        windowTitle: w,
    };
    
    const profile = profileManager.findProfile(query);
    if(profile) return profile.name;

    return "";
}

function sendMessage(msg) {
    if(ps.send) 
        ps.send(msg);
    else
        say(msg);
}

const cb = ffi.Callback("void", ["pointer", "int", "pointer", "long", "long", "int", "int"],
    function(hWinEventHook, event, hwnd, idObject, idChild, idEventThread, dwmsEventTime) {
        let hwndNum = hwnd.address();
        let titleLen = user32ex.GetWindowTextW(hwnd, titleBuffer, titleBuffer.length);
        let classLen = user32ex.GetClassNameW(hwnd, classBuffer, classBuffer.length);
        let winTitle = iconv.decode(titleBuffer.subarray(0, titleLen * 2), 'ucs2');
        let winClass = iconv.decode(classBuffer.subarray(0, classLen * 2), 'ucs2');

        let procHnd = oleacc.GetProcessHandleFromHwnd(hwnd);
        let exeLen  = psapi.GetModuleFileNameExW(procHnd, null, exeBuffer, exeBuffer.length);
        let exeName = iconv.decode(exeBuffer.subarray(0, exeLen * 2), 'ucs2');

        let profileName = findProfileFor(winTitle, winClass, exeName);
        let msg = {
            profile: profileName,
            hwnd: hwndNum,
            basename: exeName ? path.parse(exeName).base : "<unknown>",
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