import { ipcRenderer } from 'electron';
import SiriusIpcCommand from './SiriusIpcCommand';

export default class {
  constructor() {
    this._onAppRequestCopy = this._onAppRequestCopy.bind(this);
    this._onAppRequestCut = this._onAppRequestCut.bind(this);
    this._onAppRequestPaste = this._onAppRequestPaste.bind(this);
    this._onAppRequestSelectAll = this._onAppRequestSelectAll.bind(this);
    this._onAppRequestStructureView = this._onAppRequestStructureView.bind(this);
    this._onAppSendFileBuffer = this._onAppSendFileBuffer.bind(this);
    this._onAppUpdateClipboard = this._onAppUpdateClipboard.bind(this);
    this._onAppUpdateFileHandle = this._onAppUpdateFileHandle.bind(this);
    this._onAppUpdatePreference = this._onAppUpdatePreference.bind(this);
    ipcRenderer.on(SiriusIpcCommand.onAppRequestCopy, this._onAppRequestCopy);
    ipcRenderer.on(SiriusIpcCommand.onAppRequestCut, this._onAppRequestCut);
    ipcRenderer.on(SiriusIpcCommand.onAppRequestPaste, this._onAppRequestPaste);
    ipcRenderer.on(SiriusIpcCommand.onAppRequestSelectAll, this._onAppRequestSelectAll);
    ipcRenderer.on(SiriusIpcCommand.onAppRequestStructureView, this._onAppRequestStructureView);
    ipcRenderer.on(SiriusIpcCommand.onAppSendFileBuffer, this._onAppSendFileBuffer);
    ipcRenderer.on(SiriusIpcCommand.onAppUpdateClipboard, this._onAppUpdateClipboard);
    ipcRenderer.on(SiriusIpcCommand.onAppUpdateFileHandle, this._onAppUpdateFileHandle);
    ipcRenderer.on(SiriusIpcCommand.onAppUpdatePreference, this._onAppUpdatePreference);
  }

  destroy() {
    ipcRenderer.removeListener(SiriusIpcCommand.onAppRequestCopy, this._onAppRequestCopy);
    ipcRenderer.removeListener(SiriusIpcCommand.onAppRequestCut, this._onAppRequestCut);
    ipcRenderer.removeListener(SiriusIpcCommand.onAppRequestPaste, this._onAppRequestPaste);
    ipcRenderer.removeListener(SiriusIpcCommand.onAppRequestSelectAll, this._onAppRequestSelectAll);
    ipcRenderer.removeListener(SiriusIpcCommand.onAppRequestStructureView, this._onAppRequestStructureView);
    ipcRenderer.removeListener(SiriusIpcCommand.onAppSendFileBuffer, this._onAppSendFileBuffer);
    ipcRenderer.removeListener(SiriusIpcCommand.onAppUpdateClipboard, this._onAppUpdateClipboard);
    ipcRenderer.removeListener(SiriusIpcCommand.onAppUpdateFileHandle, this._onAppUpdateFileHandle);
    ipcRenderer.removeListener(SiriusIpcCommand.onAppUpdatePreference, this._onAppUpdatePreference);
  }

  setListener(listener) {
    this.listener = listener;
  }

  sendDocumentCommand(command) {
    ipcRenderer.send(SiriusIpcCommand.onDocumentCommand, command);
  }

  sendFileDropRequest(filePath) {
    ipcRenderer.send(SiriusIpcCommand.onEditorRequestFileDrop, filePath);
  }

  sendPreferenceCommand(command) {
    ipcRenderer.send(SiriusIpcCommand.onPreferenceCommand, command);
  }

  receiveFileBufferSync(fileHandle, address, length) {
    return ipcRenderer.sendSync(
      SiriusIpcCommand.onEditorRequestFileBufferSync, fileHandle, address, length,
    );
  }

  receiveFileSizeSync(fileHandle) {
    return ipcRenderer.sendSync(SiriusIpcCommand.onEditorRequestFileSizeSync, fileHandle);
  }

  _onAppRequestCopy() {
    if (this.listener && this.listener.onAppRequestCopy) {
      this.listener.onAppRequestCopy(this);
    }
  }

  _onAppRequestCut() {
    if (this.listener && this.listener.onAppRequestCut) {
      this.listener.onAppRequestCut(this);
    }
  }

  _onAppRequestPaste() {
    if (this.listener && this.listener.onAppRequestPaste) {
      this.listener.onAppRequestPaste(this);
    }
  }

  _onAppRequestSelectAll() {
    if (this.listener && this.listener.onAppRequestSelectAll) {
      this.listener.onAppRequestSelectAll(this);
    }
  }

  _onAppRequestStructureView() {
    if (this.listener && this.listener.onAppRequestStructureView) {
      this.listener.onAppRequestStructureView(this);
    }
  }

  _onAppSendFileBuffer(e, buffer) {
    if (this.listener && this.listener.onAppSendFileBuffer) {
      this.listener.onAppSendFileBuffer(this, buffer);
    }
  }

  _onAppUpdateClipboard(e, data) {
    if (this.listener && this.listener.onAppUpdateClipboard) {
      this.listener.onAppUpdateClipboard(this, data);
    }
  }

  _onAppUpdateFileHandle(e, fileHandle) {
    if (this.listener && this.listener.onAppUpdateFileHandle) {
      this.listener.onAppUpdateFileHandle(this, fileHandle);
    }
  }

  _onAppUpdatePreference(e, preference) {
    if (this.listener && this.listener.onAppUpdatePreference) {
      this.listener.onAppUpdatePreference(this, preference);
    }
  }
}
