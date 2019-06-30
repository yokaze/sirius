import { BrowserWindow, dialog, ipcMain } from 'electron';
import path from 'path';
import url from 'url';

import SiriusApplicationModel from './SiriusApplicationModel';
import SiriusFileWriter from './SiriusFileWriter';
import SiriusIpcCommand from '../ipc/SiriusIpcCommand';

const isDebug = (process.env.NODE_ENV !== 'production');

export default class SiriusModel {
  constructor() {
    this._appModel = new SiriusApplicationModel();

    //  Window ID -> Data UUID
    this.handles = new Map();

    this._appModel.getClipboard().setListener(this);

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
      const doc = this._appModel.getDocument(fileHandle);
      e.returnValue = [...doc.read(address, length)];
    });

    ipcMain.on(SiriusIpcCommand.onEditorRequestFileSizeSync, (e) => {
      const windowId = e.sender.getOwnerBrowserWindow().id;
      const handle = this.handles.get(windowId);
      e.returnValue = this._appModel.getDocument(handle).length();
    });

    ipcMain.on(SiriusIpcCommand.onPreferenceCommand, (e, command) => {
      this.onPreferenceCommandReceived(e, command);
    });
  }

  createNew() {
    const windowId = this.openEditor();
    const key = this._appModel.createDocument();
    this.handles.set(windowId, key);
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
    const currentWindow = BrowserWindow.getFocusedWindow();
    const currentHandle = this.handles.get(currentWindow.id);
    const filePath = this._appModel.getDocumentPath(currentHandle);
    if (filePath) {
      this._appModel.saveFileAs(currentHandle, filePath);
    } else {
      this.saveAs();
    }
  }

  saveAs() {
    const currentWindow = BrowserWindow.getFocusedWindow();
    const currentHandle = this.handles.get(currentWindow.id);
    const filePath = dialog.showSaveDialog(null);
    if (filePath !== undefined) {
      this._appModel.saveFileAs(currentHandle, filePath);
      currentWindow.setTitle(filePath);
    }
  }

  undo() {
    const currentWindow = BrowserWindow.getFocusedWindow();
    const currentHandle = this.handles.get(currentWindow.id);
    const doc = this._appModel.getDocument(currentHandle);
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
    const doc = this._appModel.getDocument(currentHandle);
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
    const data = this._appModel.getClipboard().getValue();
    this.handles.forEach((handle, windowId) => {
      const window = BrowserWindow.fromId(windowId);
      window.webContents.send(SiriusIpcCommand.onAppUpdateClipboard, data);
    });
  }

  onDocumentCommandReceived(e, command) {
    const senderWindowId = e.sender.getOwnerBrowserWindow().id;
    const senderHandle = this.handles.get(senderWindowId);
    this._appModel.getDocument(senderHandle).applyCommand(command);

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
    let recycle = false;
    let key;
    let windowId;
    {
      //  If a blank document window is focused, open document in it.
      const currentWindow = BrowserWindow.fromId(this.activeDocumentWindowId);
      if (currentWindow) {
        const currentKey = this.handles.get(currentWindow.id);
        const doc = this._appModel.getDocument(currentKey);
        if (doc.isBlankDocument()) {
          recycle = true;
          key = currentKey;
          windowId = currentWindow.id;
        }
      }
    }
    key = this._appModel.createDocument();
    try {
      this._appModel.loadFile(key, filePath);
    } catch (e) {
      dialog.showErrorBox('Sirius', e.message);
      if (!recycle) {
        this._appModel.removeDocument(key);
        return;
      }
    }
    if (!recycle) {
      windowId = this.openEditor();
    }
    BrowserWindow.fromId(windowId).setTitle(filePath);
    this.handles.set(windowId, key);

    if (recycle) {
      this.updateWindowBinary(windowId);
    }
  }
}
