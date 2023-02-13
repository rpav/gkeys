const ffi = require('ffi-napi');

const user32ex = ffi.Library('user32', {
    GetForegroundWindow : [ 'pointer', [] ],
    GetWindowTextW: ["int", ["pointer", "pointer", "int"]],
    GetClassNameW: ["int", ["pointer", "pointer", "int"]],
    GetWindowThreadProcessId: ["int", ["pointer", "pointer"]],
});

module.exports = {
    user32ex,
}