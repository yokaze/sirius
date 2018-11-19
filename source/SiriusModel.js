import { BrowserWindow, dialog, ipcMain } from 'electron';
import fs from 'fs';
import path from 'path';
import url from 'url';
import uuid from 'uuid/v4';

import SiriusIpcCommand from './ipc/SiriusIpcCommand';

class SiriusFileModel {
  constructor() {
    this.fileData = [];
  }

  getFileData() {
    return this.fileData;
  }

  setFileData(fileData) {
    this.fileData = fileData;
  }
}

export default class SiriusModel {
  constructor() {
    //  Window ID -> Data UUID
    this.handles = {};

    //  Data UUID -> SiriusFileModel
    this.fileModels = {};

    ipcMain.on('editor-initialized', (e) => {
      const windowId = e.sender.getOwnerBrowserWindow().id;
      if (this.handles[windowId] !== undefined) {
        const handle = this.handles[windowId];
        const fileData = this.fileModels[handle].getFileData();
        e.sender.send(SiriusIpcCommand.onRendererReceivedRenewalBinary, fileData);
      }
    });
  }

  createNew() {
    const windowId = this.openEditor();
    const handle = uuid();
    this.handles[windowId] = handle;
    this.fileModels[handle] = new SiriusFileModel();
  }

  open() {
    const fileNames = dialog.showOpenDialog(null, {
      properties: ['openFile'],
    });
    if (fileNames !== undefined) {
      const fileName = fileNames[0];
      fs.readFile(fileName, (err, data) => {
        const windowId = this.openEditor();
        const fileModel = new SiriusFileModel();
        BrowserWindow.fromId(windowId).setTitle(fileName);
        fileModel.setFileData(data);
        const handle = uuid();
        this.handles[windowId] = handle;
        this.fileModels[handle] = fileModel;
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
    browserWindow.openDevTools();
    return browserWindow.id;
  }

  duplicateActiveEditor() {
    const currentWindow = BrowserWindow.getFocusedWindow();
    const nextWindowId = this.openEditor();
    this.handles[nextWindowId] = this.handles[currentWindow.id];
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
