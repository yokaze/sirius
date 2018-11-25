import { BrowserWindow, dialog, ipcMain } from 'electron';
import fs from 'fs';
import path from 'path';
import url from 'url';
import uuid from 'uuid/v4';

import SiriusDocument from './main/SiriusDocument';
import SiriusIpcCommand from './ipc/SiriusIpcCommand';

export default class SiriusModel {
  constructor() {
    //  Window ID -> Data UUID
    this.handles = {};

    //  Data UUID -> SiriusDocument
    this.documents = {};

    ipcMain.on('editor-initialized', (e) => {
      const windowId = e.sender.getOwnerBrowserWindow().id;
      if (this.handles[windowId] !== undefined) {
        const handle = this.handles[windowId];
        const doc = this.documents[handle].getFileData();
        e.sender.send(SiriusIpcCommand.onRendererReceivedRenewalBinary, doc);
      }
    });

    ipcMain.on(SiriusIpcCommand.onDocumentCommand, (e, command) => {
      this.onDocumentCommandReceived(e, command);
    });
  }

  createNew() {
    const windowId = this.openEditor();
    const handle = uuid();
    this.handles[windowId] = handle;
    this.documents[handle] = new SiriusDocument();
  }

  open() {
    const fileNames = dialog.showOpenDialog(null, {
      properties: ['openFile'],
    });
    if (fileNames !== undefined) {
      const fileName = fileNames[0];
      fs.readFile(fileName, (err, data) => {
        const windowId = this.openEditor();
        const doc = new SiriusDocument();
        BrowserWindow.fromId(windowId).setTitle(fileName);
        doc.setFileData([...data]);
        const handle = uuid();
        this.handles[windowId] = handle;
        this.documents[handle] = doc;
      });
    }
  }

  save() {
  }

  saveAs() {
  }

  undo() {
    const currentWindow = BrowserWindow.getFocusedWindow();
    const handle = this.handles[currentWindow.id];
    const doc = this.documents[handle];
    doc.undo();

    const fileData = doc.getFileData();
    for (const key in this.handles) {
      const windowId = parseInt(key, 10);
      const windowHandle = this.handles[windowId];
      if (handle === windowHandle) {
        const window = BrowserWindow.fromId(windowId);
        window.webContents.send(SiriusIpcCommand.onRendererReceivedRenewalBinary, fileData);
      }
    }
  }

  redo() {
    const currentWindow = BrowserWindow.getFocusedWindow();
    const handle = this.handles[currentWindow];
    const doc = this.documents[handle];
    doc.redo();

    const fileData = doc.getFileData();
    for (const key in this.handles) {
      const windowId = parseInt(key, 10);
      const windowHandle = this.handles[windowId];
      if (handle === windowHandle) {
        const window = BrowserWindow.fromId(windowId);
        window.webContents.send(SiriusIpcCommand.onRendererReceivedRenewalBinary, fileData);
      }
    }
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

  onDocumentCommandReceived(e, command) {
    const senderWindowId = e.sender.getOwnerBrowserWindow().id;
    const senderHandle = this.handles[senderWindowId];
    this.documents[senderHandle].applyCommand(command);

    for (const key in this.handles) {
      const windowId = parseInt(key, 10);
      const handle = this.handles[windowId];

      if ((senderWindowId !== windowId) && (senderHandle === handle)) {
        const doc = this.documents[handle].getFileData();
        const window = BrowserWindow.fromId(windowId);
        window.webContents.send(SiriusIpcCommand.onRendererReceivedRenewalBinary, doc);
      }
    }
  }
}
