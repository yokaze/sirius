const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const path = require('path');
const url = require('url');

app.on('ready', function() {
    const browserWindow = new BrowserWindow();
    const indexUrl = url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    });
    browserWindow.loadURL(indexUrl);
});
