import { BrowserWindow, dialog, ipcMain } from 'electron';
import fs from 'fs';
import path from 'path';
import url from 'url';
import uuid from 'uuid/v4';

import SiriusClipboard from '../common/SiriusClipboard';
import SiriusDocument from '../common/SiriusDocument';
import SiriusFileHandle from './SiriusFileHandle';
import SiriusIpcCommand from '../ipc/SiriusIpcCommand';

const isDebug = (process.env.NODE_ENV !== 'production');

export default class SiriusModel {
  constructor() {
    //  Window ID -> Data UUID
    this.handles = new Map();

    //  Data UUID -> SiriusDocument
    this.documents = new Map();

    this.clipboard = new SiriusClipboard();
    this.clipboard.setListener(this);

    this.activeDocumentWindowId = undefined;
    this.preferencesWindow = undefined;

    ipcMain.on('editor-initialized', (e) => {
      const windowId = e.sender.getOwnerBrowserWindow().id;
      if (this.handles.get(windowId) !== undefined) {
        this.updateWindowBinary(windowId);
      }
    });

    ipcMain.on(SiriusIpcCommand.onDocumentCommand, (e, command) => {
      this.onDocumentCommandReceived(e, command);
    });

    ipcMain.on(SiriusIpcCommand.onEditorRequestFileDrop, (e, filePath) => {
      this.onEditorRequestFileDrop(e, filePath);
    });

    ipcMain.on(SiriusIpcCommand.onEditorRequestFileBufferSync, (e, fileHandle, address, length) => {
      const doc = this.documents.get(fileHandle);
      e.returnValue = [...doc.getBuffer(address, length)];
    });

    ipcMain.on(SiriusIpcCommand.onEditorRequestFileSizeSync, (e) => {
      const windowId = e.sender.getOwnerBrowserWindow().id;
      const handle = this.handles.get(windowId);
      e.returnValue = this.documents.get(handle).getFileSize();
    });

    ipcMain.on(SiriusIpcCommand.onPreferenceCommand, (e, command) => {
      this.onPreferenceCommandReceived(e, command);
    });
  }

  createNew() {
    const windowId = this.openEditor();
    const handle = uuid();
    this.handles.set(windowId, handle);

    const doc = new SiriusDocument();
    doc.setClipboard(this.clipboard);
    this.documents.set(handle, doc);
  }

  open() {
    const filePaths = dialog.showOpenDialog(null, {
      properties: ['openFile'],
    });
    if (filePaths !== undefined) {
      this._openFile(filePaths[0]);
    }
  }

  save() {
  }

  saveAs() {
    const currentWindow = BrowserWindow.getFocusedWindow();
    const currentHandle = this.handles.get(currentWindow.id);
    const doc = this.documents.get(currentHandle);
    const filePath = dialog.showSaveDialog(null);
    if (filePath !== undefined) {
      const fileHandle = fs.openSync(filePath, 'w');
      const blockCount = Math.floor((doc.getFileSize() + 4095) / 4096);
      for (let i = 0; i < blockCount; i += 1) {
        const block = doc.getBuffer(i * 4096, 4096);
        fs.writeSync(fileHandle, block);
      }
    }
  }

  undo() {
    const currentWindow = BrowserWindow.getFocusedWindow();
    const currentHandle = this.handles.get(currentWindow.id);
    const doc = this.documents.get(currentHandle);
    doc.undo();

    this.handles.forEach((handle, windowId) => {
      if (currentHandle === handle) {
        this.updateWindowBinary(windowId);
      }
    });
  }

  redo() {
    const currentWindow = BrowserWindow.getFocusedWindow();
    const currentHandle = this.handles.get(currentWindow);
    const doc = this.documents.get(currentHandle);
    doc.redo();

    this.handles.forEach((handle, windowId) => {
      if (currentHandle === handle) {
        this.updateWindowBinary(windowId);
      }
    });
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
    const browserWindow = new BrowserWindow({
      width: 1600,
      height: 1024,
      webPreferences: { nodeIntegration: true },
    });
    browserWindow.setTitle('Sirius');
    browserWindow.loadURL(this.getIndexUrl());
    browserWindow.on('focus', () => { this.activeDocumentWindowId = browserWindow.id; });
    if (isDebug) {
      browserWindow.openDevTools();
    }
    return browserWindow.id;
  }

  displayStructureView() {
    const window = BrowserWindow.getFocusedWindow();
    window.webContents.send(SiriusIpcCommand.onAppRequestStructureView);
  }

  duplicateActiveEditor() {
    const currentWindow = BrowserWindow.getFocusedWindow();
    const nextWindowId = this.openEditor();
    this.handles.set(nextWindowId, this.handles.get(currentWindow.id));
  }

  openAbout() {
    const browserWindow = new BrowserWindow({
      width: 400,
      height: 256,
      resizable: false,
      webPreferences: { nodeIntegration: true },
    });
    browserWindow.loadURL(this.getUrlForFileName('../renderer/about.html'));
  }

  openPreferences() {
    if (this.preferencesWindow === undefined) {
      this.preferencesWindow = new BrowserWindow({
        width: 400,
        height: 256,
        resizable: isDebug,
        webPreferences: { nodeIntegration: true },
      });
      this.preferencesWindow.loadURL(this.getUrlForFileName('../renderer/preferences.html'));
      this.preferencesWindow.on('closed', () => {
        this.preferencesWindow = undefined;
      });
      if (isDebug) {
        this.preferencesWindow.openDevTools();
      }
    } else {
      this.preferencesWindow.focus();
    }
  }

  getIndexUrl() {
    return this.getUrlForFileName('../renderer/editor.html');
  }

  getUrlForFileName(fileName) {
    return url.format({
      pathname: path.join(__dirname, fileName),
      protocol: 'file:',
      slashes: true,
    });
  }

  updateWindowBinary(windowId) {
    const handle = this.handles.get(windowId);
    const window = BrowserWindow.fromId(windowId);
    window.webContents.send(SiriusIpcCommand.onAppUpdateFileHandle, handle);
  }

  onClipboardDataChanged() {
    const data = this.clipboard.getData();
    this.handles.forEach((handle, windowId) => {
      const window = BrowserWindow.fromId(windowId);
      window.webContents.send(SiriusIpcCommand.onAppUpdateClipboard, data);
    });
  }

  onDocumentCommandReceived(e, command) {
    const senderWindowId = e.sender.getOwnerBrowserWindow().id;
    const senderHandle = this.handles.get(senderWindowId);
    this.documents.get(senderHandle).applyCommand(command);

    this.handles.forEach((handle, windowId) => {
      if ((senderWindowId !== windowId) && (senderHandle === handle)) {
        this.updateWindowBinary(windowId);
      }
    });
  }

  onEditorRequestFileDrop(e, filePath) {
    this._openFile(filePath);
  }

  onPreferenceCommandReceived(e, command) {
    this.handles.forEach((handle, windowId) => {
      const window = BrowserWindow.fromId(windowId);
      window.webContents.send(SiriusIpcCommand.onAppUpdatePreference, command);
    });
  }

  _openFile(filePath) {
    let fileHandle;
    try {
      fileHandle = new SiriusFileHandle(filePath);
    } catch (e) {
      dialog.showErrorBox('Sirius', e.message);
      return;
    }
    let windowId;
    let initialized = false;
    {
      //  If a blank document window is focused, open document in it.
      const currentWindow = BrowserWindow.fromId(this.activeDocumentWindowId);
      if (currentWindow) {
        const currentHandle = this.handles.get(currentWindow.id);
        const doc = this.documents.get(currentHandle);
        if (doc.isBlankDocument()) {
          windowId = currentWindow.id;
          initialized = true;
        }
      }
    }
    if (windowId === undefined) {
      windowId = this.openEditor();
    }
    const doc = new SiriusDocument();
    doc.setClipboard(this.clipboard);
    doc.setFileHandle(fileHandle);
    BrowserWindow.fromId(windowId).setTitle(filePath);
    const handle = uuid();
    this.handles.set(windowId, handle);
    this.documents.set(handle, doc);

    if (initialized) {
      this.updateWindowBinary(windowId);
    }
  }
}
