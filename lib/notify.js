const notifier = require('node-notifier');
const path = require('path');
const {prn, say, str} = require('./util.js');

let NotificationID = 42;
let NotificationUp = false;

function qnotify(title, ...msg) {
    prn('Notification: ', title, ' ', ...msg);

    if(NotificationUp) {
        NotificationUp();
        NotificationUp = false;
    }

    let curID = NotificationID;
    NotificationID++;

    let clear = () => {
        notifier.notify({close: curID});
    };
    NotificationUp = clear;

    let timer = setTimeout(() => {
        clear();
    }, 2000);

    notifier.notify({
        //
        title: title,
        message: str(...msg) || ' ',
        icon: '',
        appID: "GKeys",
        id: curID,
        icon: path.normalize(path.join(__dirname, '../res/g.png')),
        wait: false,
    }, function() {
        clearTimeout(timer);
    });
}

function notify(...args) { return notifier.notify(...args); }

module.exports = {
    notify,
    qnotify
};