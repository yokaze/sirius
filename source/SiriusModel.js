import { BrowserWindow, dialog, ipcMain } from 'electron';
import fs from 'fs';
import path from 'path';
import url from 'url';

class SiriusWindowModel {
  constructor() {
    this.fileData = undefined;
  }

  setFileData(fileData) {
    this.fileData = fileData;
  }

  getFileData() {
    return this.fileData;
  }
}

export default class {
  constructor() {
    this.windowModels = {};
    ipcMain.on('editor-initialized', (e) => {
      const windowId = e.sender.getOwnerBrowserWindow().id;
      if (this.windowModels[windowId] !== undefined) {
        const fileData = this.windowModels[windowId].getFileData();
        e.sender.send('file-data', fileData);
      }
    });
  }

  createNew() {
    const browserWindow = new BrowserWindow({ width: 1600, height: 1024 });
    browserWindow.loadURL(this.getIndexUrl());
    browserWindow.webContents.openDevTools();
    console.log(browserWindow.id);
  }

  open() {
    const fileNames = dialog.showOpenDialog(null, {
      properties: ['openFile'],
    });
    if (fileNames !== undefined) {
      const fileName = fileNames[0];
      fs.readFile(fileName, (err, data) => {
        console.log([...data]);
        const windowId = this.openEditor();
        const windowModel = new SiriusWindowModel();
        windowModel.setFileData(data);
        this.windowModels[windowId] = windowModel;
      });
    }
  }

  save() {
    console.log('Save');
  }

  saveAs() {
    console.log('Save As');
  }

  openEditor() {
    console.log('Open Editor');
    const browserWindow = new BrowserWindow({ width: 1600, height: 1024 });
    browserWindow.loadURL(this.getIndexUrl());
    browserWindow.webContents.openDevTools();
    return browserWindow.id;
  }

  getIndexUrl() {
    return url.format({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file:',
      slashes: true,
    });
  }
}
