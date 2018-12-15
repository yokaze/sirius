import { BrowserWindow, dialog, ipcMain } from 'electron';
import fs from 'fs';
import path from 'path';
import url from 'url';
import uuid from 'uuid/v4';

import SiriusDocument from '../common/SiriusDocument';
import SiriusIpcCommand from '../ipc/SiriusIpcCommand';

export default class SiriusModel {
  constructor() {
    //  Window ID -> Data UUID
    this.handles = {};

    //  Data UUID -> SiriusDocument
    this.documents = {};

    this.preferencesWindow = undefined;

    ipcMain.on('editor-initialized', (e) => {
      const windowId = e.sender.getOwnerBrowserWindow().id;
      if (this.handles[windowId] !== undefined) {
        this.updateWindowBinary(windowId);
      }
    });

    ipcMain.on(SiriusIpcCommand.onDocumentCommand, (e, command) => {
      this.onDocumentCommandReceived(e, command);
    });

    ipcMain.on(SiriusIpcCommand.onPreferenceCommand, (e, command) => {
      this.onPreferenceCommandReceived(e, command);
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
        let windowId;
        let initialized = false;
        {
          //  If a blank document window is focused, open document in it.
          const currentWindow = BrowserWindow.getFocusedWindow();
          const currentHandle = this.handles[currentWindow.id];
          const doc = this.documents[currentHandle];
          if (doc.isBlankDocument()) {
            windowId = currentWindow.id;
            initialized = true;
          }
        }
        if (windowId === undefined) {
          windowId = this.openEditor();
        }
        const doc = new SiriusDocument();
        BrowserWindow.fromId(windowId).setTitle(fileName);
        doc.setFileData(data);
        const handle = uuid();
        this.handles[windowId] = handle;
        this.documents[handle] = doc;

        if (initialized) {
          this.updateWindowBinary(windowId);
        }
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
        this.updateWindowBinary(windowId);
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
        this.updateWindowBinary(windowId);
      }
    }
  }

  cut() {
    const window = BrowserWindow.getFocusedWindow();
    window.webContents.send(SiriusIpcCommand.onAppRequestCut);
  }

  copy() {
    const window = BrowserWindow.getFocusedWindow();
    window.webContents.send(SiriusIpcCommand.onAppRequestCopy);
  }

  paste() {
    const window = BrowserWindow.getFocusedWindow();
    window.webContents.send(SiriusIpcCommand.onAppRequestPaste);
  }

  selectAll() {
    const window = BrowserWindow.getFocusedWindow();
    window.webContents.send(SiriusIpcCommand.onAppRequestSelectAll);
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
    browserWindow.loadURL(this.getUrlForFileName('../renderer/about.html'));
  }

  openPreferences() {
    if (this.preferencesWindow === undefined) {
      this.preferencesWindow = new BrowserWindow({ width: 400, height: 256, resizable: true });
      this.preferencesWindow.loadURL(this.getUrlForFileName('../renderer/preferences.html'));
      this.preferencesWindow.openDevTools();
      this.preferencesWindow.on('closed', () => {
        this.preferencesWindow = undefined;
      });
    } else {
      this.preferencesWindow.focus();
    }
  }

  getIndexUrl() {
    return this.getUrlForFileName('../renderer/index.html');
  }

  getUrlForFileName(fileName) {
    return url.format({
      pathname: path.join(__dirname, fileName),
      protocol: 'file:',
      slashes: true,
    });
  }

  updateWindowBinary(windowId) {
    const handle = this.handles[windowId];
    const doc = this.documents[handle].getFileData();
    const window = BrowserWindow.fromId(windowId);
    window.webContents.send(SiriusIpcCommand.onRendererReceivedRenewalBinary, doc);
  }

  onDocumentCommandReceived(e, command) {
    const senderWindowId = e.sender.getOwnerBrowserWindow().id;
    const senderHandle = this.handles[senderWindowId];
    this.documents[senderHandle].applyCommand(command);

    for (const key in this.handles) {
      const windowId = parseInt(key, 10);
      const handle = this.handles[windowId];
      if ((senderWindowId !== windowId) && (senderHandle === handle)) {
        this.updateWindowBinary(windowId);
      }
    }
  }

  onPreferenceCommandReceived(e, command) {
    for (const key in this.handles) {
      const windowId = parseInt(key, 10);
      const window = BrowserWindow.fromId(windowId);
      window.webContents.send(SiriusIpcCommand.onAppUpdatePreference, command);
    }
  }
}
