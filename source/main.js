const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

app.on('ready', function()
{
    const browserWindow = new BrowserWindow();
    browserWindow.show();
});
