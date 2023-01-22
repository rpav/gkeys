const ffi = require('ffi-napi');

const user32ex = ffi.Library("user32", {
    GetForegroundWindow: ["pointer", []],
});

module.exports = {
    user32ex,
}