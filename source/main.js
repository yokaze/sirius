const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const path = require('path');
const url = require('url');

app.on('ready', function() {
    const browserWindow = new BrowserWindow({ width: 1600, height: 1024 });
    const indexUrl = url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    });
    browserWindow.loadURL(indexUrl);
    browserWindow.webContents.openDevTools();
});
