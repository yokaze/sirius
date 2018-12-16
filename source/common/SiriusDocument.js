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
    if (undoCommand !== undefined) {
      this.undoBuffer.push([undoCommand, command]);
    }
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
    const bufferLength = Math.max(0, Math.min(length, this.fileData.length - address));
    const view = new Uint8Array(bufferLength);
    for (let i = 0; i < bufferLength; i += 1) {
      view[i] = this.fileData[address + i];
    }
    return view;
  }

  getFileData() {
    return new Uint8Array(this.fileData);
  }

  setFileData(fileData) {
    assert(fileData instanceof Uint8Array);
    this.fileData = [...fileData];
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
      //  Fill zeros from file-end to insert address
      const fillData = new Uint8Array(command.address - this.fileData.length);
      const fillCommand = new SiriusDocumentCommand.Insert(this.fileData.length, fillData);
      const undo1 = this._runCommand(fillCommand);
      const undo2 = this._runCommand(command);
      return new SiriusDocumentCommand.Composite([undo2, undo1]);
    } else if (command.type === SiriusDocumentCommand.Overwrite.getType()) {
      if ((command.address + command.data.length) <= this.fileData.length) {
        const backup = this.getBuffer(command.address, command.data.length);
        this.fileData.splice(command.address, command.data.length, ...command.data);
        const undoCommand = new SiriusDocumentCommand.Overwrite(command.address, backup);
        return undoCommand;
      }
      //  Fill zeros from file-end to overwrite area
      const desiredLength = command.address + command.data.length;
      const fillData = new Uint8Array(desiredLength - this.fileData.length);
      const fillCommand = new SiriusDocumentCommand.Insert(this.fileData.length, fillData);
      const undo1 = this._runCommand(fillCommand);
      const undo2 = this._runCommand(command);
      return new SiriusDocumentCommand.Composite([undo2, undo1]);
    } else if (command.type === SiriusDocumentCommand.Remove.getType()) {
      assert((command.address + command.length) <= this.fileData.length);
      const backup = this.getBuffer(command.address, command.length);
      const undoCommand = new SiriusDocumentCommand.Insert(command.address, backup);
      this.fileData.splice(command.address, command.length);
      return undoCommand;
    } else if (command.type === SiriusDocumentCommand.Cut.getType()) {
      const copyCommand = new SiriusDocumentCommand.Copy(command.address, command.length);
      const removeCommand = new SiriusDocumentCommand.Remove(command.address, command.length);
      this._runCommand(copyCommand);
      return this._runCommand(removeCommand);
    } else if (command.type === SiriusDocumentCommand.Copy.getType()) {
      this.clipData = this.getBuffer(command.address, command.length);
    } else if (command.type === SiriusDocumentCommand.Paste.getType()) {
      if (this.clipData === undefined) {
        return undefined;
      }
      const insertCommand = new SiriusDocumentCommand.Insert(command.address, this.clipData);
      return this._runCommand(insertCommand);
    } else if (command.type === SiriusDocumentCommand.Composite.getType()) {
      const undoCommands = command.items.map(item => this._runCommand(item)).reverse();
      return new SiriusDocumentCommand.Composite(undoCommands);
    } else if (command.type === undefined) {
      assert(false);
    }
    return undefined;
  }
}
