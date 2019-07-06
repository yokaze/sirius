import SiriusDocument from '../common/SiriusDocument';
import SiriusDocumentCommand from '../common/SiriusDocumentCommand';
import SiriusIpcClient from '../ipc/SiriusIpcClient';
import SiriusIpcFileHandle from '../ipc/SiriusIpcFileHandle';
import WriteMode from './WriteMode';

const ipcClient = new SiriusIpcClient();

export default class SiriusEditorViewModel {
  constructor() {
    this.document = new SiriusDocument();
    this.selectionStartAddress = 0;
    this.selectionEndAddress = 0;
    this.writeMode = WriteMode.Overwrite;
    this.isEditing = false;
    this.editValue = 0;
    this.setIpcClient(ipcClient);
    ipcClient.setListener(this);
  }

  setListener(listener) {
    this.listener = listener;
  }

  getBuffer(address, length) {
    return this.document.read(address, length);
  }

  setValueAt(address, value) {
    const data = new Uint8Array([value]);
    const command = new SiriusDocumentCommand.Overwrite(address, data);
    this._applyCommand(command);
  }

  insertValueAt(address, value) {
    const data = new Uint8Array([value]);
    const command = new SiriusDocumentCommand.Insert(address, data);
    this._applyCommand(command);
  }

  removeValueAt(address, length) {
    const executable = ((address + length) <= this.document.length());
    if (executable) {
      const command = new SiriusDocumentCommand.Remove(address, length);
      this._applyCommand(command);
    }
  }

  processCharacter(value) {
    const selected = this.selectionStartAddress;
    if (this.isEditing) {
      const b = this.editValue + value;
      this.isEditing = false;
      this.editValue = 0;
      this.selectionStartAddress = selected + 1;
      this.selectionEndAddress = selected + 1;

      if (this.writeMode === WriteMode.Overwrite) {
        this.setValueAt(selected, b);
      } else {
        this.insertValueAt(selected, b);
      }
    } else {
      this.isEditing = true;
      this.editValue = value * 16;
    }
  }

  length() {
    return this.document.length();
  }

  getSelectedRange() {
    const left = Math.min(this.selectionStartAddress, this.selectionEndAddress);
    const right = Math.max(this.selectionStartAddress, this.selectionEndAddress);
    return [left, right];
  }

  getSelectionStartAddress() {
    return this.selectionStartAddress;
  }

  setSelectionStartAddress(address) {
    this.selectionStartAddress = address;
  }

  getSelectionEndAddress() {
    return this.selectionEndAddress;
  }

  setSelectionEndAddress(address) {
    this.selectionEndAddress = address;
  }

  getWriteMode() {
    return this.writeMode;
  }

  setWriteMode(writeMode) {
    this.writeMode = writeMode;
  }

  isEditing() {
    return this.isEditing;
  }

  setIpcClient(client) {
    this.ipcClient = client;
  }

  dropPath(filePath) {
    this.ipcClient.sendFileDropRequest(filePath);
  }

  onAppUpdateClipboard(sender, data) {
    this.document.getClipboard().setValue(data);
  }

  onAppUpdateFileHandle(sender, fileHandle) {
    const oldFileHandle = this.document.getFileHandle();
    if (oldFileHandle !== undefined) {
      oldFileHandle.destroy();
    }

    this.document.setFileHandle(new SiriusIpcFileHandle(fileHandle));
    this.listener.onViewModelReloaded();
  }

  onAppUpdatePreference(sender, preference) {
    this.listener.onViewModelUpdatePreference(this, preference);
  }

  onAppRequestCut() {
    const range = this.getSelectedRange();
    if (range[0] === range[1]) {
      return;
    }
    const address = range[0];
    const length = range[1] - range[0];
    const command = new SiriusDocumentCommand.Cut(address, length);
    this._applyCommand(command);
    this.selectionStartAddress = address;
    this.selectionEndAddress = address;
    this.listener.onViewModelReloaded();
  }

  onAppRequestCopy() {
    const range = this.getSelectedRange();
    if (range[0] === range[1]) {
      return;
    }
    const address = range[0];
    const length = range[1] - range[0];
    const command = new SiriusDocumentCommand.Copy(address, length);
    this._applyCommand(command);
  }

  onAppRequestPaste() {
    const range = this.getSelectedRange();
    let removeCommand;
    if (range[0] !== range[1]) {
      removeCommand = new SiriusDocumentCommand.Remove(range[0], range[1] - range[0]);
    }
    const address = range[0];
    const pasteCommand = new SiriusDocumentCommand.Paste(address);
    if (removeCommand === undefined) {
      this._applyCommand(pasteCommand);
    } else {
      const command = new SiriusDocumentCommand.Composite([removeCommand, pasteCommand]);
      this._applyCommand(command);
    }
    this.listener.onViewModelReloaded();
  }

  onAppRequestSelectAll() {
    this.selectionStartAddress = 0;
    this.selectionEndAddress = this.length();
    this.listener.onViewModelReloaded();
  }

  onAppRequestStructureView() {
    this.listener.useStructureView();
  }

  _applyCommand(command) {
    this.document.applyCommand(command);
    ipcClient.sendDocumentCommand(command);
  }
}
