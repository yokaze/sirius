import assert from 'assert';
import SiriusDocumentCommand from '../common/SiriusDocumentCommand';

export default class SiriusDocument {
  constructor() {
    this.fileData = [];
    this.undoBuffer = [];
    this.redoBuffer = [];
  }

  applyCommand(command) {
    const undoCommand = this._runCommand(command);
    this.undoBuffer.push([undoCommand, command]);
  }

  undo() {
    if (this.undoBuffer.length > 0) {
      const commandPair = this.undoBuffer[this.undoBuffer.length - 1];
      this._runCommand(commandPair[0]);
      this.undoBuffer.splice(this.undoBuffer.length - 1, 1);
      this.redoBuffer.push(commandPair);
    }
  }

  redo() {
    if (this.redoBuffer.length > 0) {
      const commandPair = this.redoBuffer[this.redoBuffer.length - 1];
      this._runCommand(commandPair[1]);
      this.redoBuffer.splice(this.redoBuffer.length - 1, 1);
      this.undoBuffer.push(commandPair);
    }
  }

  getBuffer(address, length) {
    length = Math.max(0, Math.min(length, this.fileData.length - address));
    const buffer = new ArrayBuffer(length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < length; i += 1) {
      view[i] = this.fileData[address + i];
    }
    return view;
  }

  getFileData() {
    return this.fileData;
  }

  setFileData(fileData) {
    assert(Array.isArray(fileData));
    this.fileData = fileData;
  }

  isBlankDocument() {
    let ret = true;
    ret = ret && (this.fileData.length === 0);
    ret = ret && (this.undoBuffer.length === 0);
    ret = ret && (this.redoBuffer.length === 0);
    return ret;
  }

  _runCommand(command) {
    if (command.type === SiriusDocumentCommand.Insert.getType()) {
      if (command.address <= this.fileData.length) {
        this.fileData.splice(command.address, 0, ...command.data);
        const undoCommand = new SiriusDocumentCommand.Remove(command.address, command.data.length);
        return undoCommand;
      }
      const fillData = Array(command.address - this.fileData.length).fill(0);
      const fillCommand = new SiriusDocumentCommand.Insert(this.fileData.length, fillData);
      const undo1 = this._runCommand(fillCommand);
      const undo2 = this._runCommand(command);
      return new SiriusDocumentCommand.Composite([undo2, undo1]);
    } else if (command.type === SiriusDocumentCommand.Overwrite.getType()) {
      if ((command.address + command.data.length) <= this.fileData.length) {
        const backup = this.fileData.slice(command.address, command.address + command.data.length);
        this.fileData.splice(command.address, command.data.length, ...command.data);
        const undoCommand = new SiriusDocumentCommand.Overwrite(command.address, backup);
        return undoCommand;
      }
      const desiredLength = command.address + command.data.length;
      const fillData = Array(desiredLength - this.fileData.length).fill(0);
      const fillCommand = new SiriusDocumentCommand.Insert(this.fileData.length, fillData);
      const undo1 = this._runCommand(fillCommand);
      const undo2 = this._runCommand(command);
      return new SiriusDocumentCommand.Composite([undo2, undo1]);
    } else if (command.type === SiriusDocumentCommand.Remove.getType()) {
      assert((command.address + command.length) <= this.fileData.length);
      const backup = this.fileData.slice(command.address, command.address + command.length);
      const undoCommand = new SiriusDocumentCommand.Insert(command.address, backup);
      this.fileData.splice(command.address, command.length);
      return undoCommand;
    } else if (command.type === SiriusDocumentCommand.Composite.getType()) {
      command.items.forEach((item) => { this._runCommand(item); });
      return undefined;
    }
    return undefined;
  }
}
