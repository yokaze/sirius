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

  getFileData() {
    return this.fileData;
  }

  setFileData(fileData) {
    assert(Array.isArray(fileData));
    this.fileData = fileData;
  }

  _runCommand(command) {
    if (command.type === SiriusDocumentCommand.Insert.getType()) {
      assert(command.address <= this.fileData.length);
      this.fileData.splice(command.address, 0, command.data[0]);
      const undoCommand = new SiriusDocumentCommand.Remove(command.address, 1);
      return undoCommand;
    } else if (command.type === SiriusDocumentCommand.Overwrite.getType()) {
      assert(command.address <= this.fileData.length);
      this.fileData.splice(command.address, command.data.length, ...command.data);
      return undefined;
    } else if (command.type === SiriusDocumentCommand.Remove.getType()) {
      assert((command.address + command.length) <= this.fileData.length);
      const backup = this.fileData.slice(command.address, command.address + command.length);
      const undoCommand = new SiriusDocumentCommand.Insert(command.address, backup);
      this.fileData.splice(command.address, command.length);
      return undoCommand;
    }
    return undefined;
  }
}
