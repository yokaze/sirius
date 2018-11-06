import electron from 'electron';
import { app, BrowserWindow, Menu } from 'electron';
import path from 'path';
import url from 'url';
import SiriusModel from './SiriusModel';

const model = new SiriusModel;

const menuTemplate = [
  {
    label: app.getName(),
    submenu: [
      {role: 'quit'}
    ]
  },
  {
    label: 'File',
    submenu: [
      { label: 'New', click: model.createNew, accelerator:'CmdOrCtrl+N' },
      { label: 'Open', click: model.open, accelerator:'CmdOrCtrl+O' },
      { label: 'Save', click: model.save, accelerator:'CmdOrCtrl+S' },
      { label: 'Save As', click: model.saveAs, accelerator:'CmdOrCtrl+Shift+S' }
    ]
  },
  {
    label: 'Edit',
    submenu: [
      {role: 'undo'},
      {role: 'redo'}
    ]
  },
];

app.on('ready', function() {
    const browserWindow = new BrowserWindow({ width: 1600, height: 1024 });
    const indexUrl = url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    });
    browserWindow.loadURL(indexUrl);
    browserWindow.webContents.openDevTools();

    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);
});
