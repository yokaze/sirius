import { ipcRenderer } from 'electron';
import SiriusIpcCommand from './SiriusIpcCommand';

export default class {
  constructor() {
    ipcRenderer.on(SiriusIpcCommand.onAppSendFileBuffer, (e, renewalBinary) => {
    });
    ipcRenderer.on(SiriusIpcCommand.onAppUpdateClipboard, (e, data) => {
      this.listener.onAppUpdateClipboard(this, data);
    });
    ipcRenderer.on(SiriusIpcCommand.onAppUpdateFileHandle, (e, fileHandle) => {
      this.listener.onAppUpdateFileHandle(this, fileHandle);
    });
    ipcRenderer.on(SiriusIpcCommand.onAppUpdatePreference, (e, preference) => {
      this.listener.onAppUpdatePreference(this, preference);
    });
    ipcRenderer.on(SiriusIpcCommand.onAppRequestCut, () => {
      this.listener.onAppRequestCut(this);
    });
    ipcRenderer.on(SiriusIpcCommand.onAppRequestCopy, () => {
      this.listener.onAppRequestCopy(this);
    });
    ipcRenderer.on(SiriusIpcCommand.onAppRequestPaste, () => {
      this.listener.onAppRequestPaste(this);
    });
    ipcRenderer.on(SiriusIpcCommand.onAppRequestSelectAll, () => {
      this.listener.onAppRequestSelectAll(this);
    });
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
}
