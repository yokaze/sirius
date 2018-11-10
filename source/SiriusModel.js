import { BrowserWindow, dialog, ipcMain } from 'electron';
import fs from 'fs';
import path from 'path';
import url from 'url';

import SiriusIpcCommand from './ipc/SiriusIpcCommand';

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
        e.sender.send(SiriusIpcCommand.onRendererReceivedRenewalBinary, fileData);
      }
    });
  }

  createNew() {
    const browserWindow = new BrowserWindow({ width: 1600, height: 1024 });
    browserWindow.setTitle('Sirius');
    browserWindow.loadURL(this.getIndexUrl());
  }

  open() {
    const fileNames = dialog.showOpenDialog(null, {
      properties: ['openFile'],
    });
    if (fileNames !== undefined) {
      const fileName = fileNames[0];
      fs.readFile(fileName, (err, data) => {
        const windowId = this.openEditor();
        const windowModel = new SiriusWindowModel();
        BrowserWindow.fromId(windowId).setTitle(fileName);
        windowModel.setFileData(data);
        this.windowModels[windowId] = windowModel;
      });
    }
  }

  save() {
  }

  saveAs() {
  }

  openEditor() {
    const browserWindow = new BrowserWindow({ width: 1600, height: 1024 });
    browserWindow.setTitle('Sirius');
    browserWindow.loadURL(this.getIndexUrl());
    return browserWindow.id;
  }

  openAbout() {
    const browserWindow = new BrowserWindow({ width: 400, height: 256, resizable: false });
    browserWindow.setTitle('Sirius');
    browserWindow.loadURL(this.getUrlForFileName('renderer/about.html'));
  }

  getIndexUrl() {
    return this.getUrlForFileName('index.html');
  }

  getUrlForFileName(fileName) {
    return url.format({
      pathname: path.join(__dirname, fileName),
      protocol: 'file:',
      slashes: true,
    });
  }
}
