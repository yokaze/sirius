import assert from 'assert';

import SiriusClipboard from './SiriusClipboard';
import SiriusDocumentCommand from './SiriusDocumentCommand';
import SiriusConstants from './SiriusConstants';

const { maxBlockSize, minBlockSize } = SiriusConstants;

export default class SiriusDocument {
  constructor() {
    this.fileData = [];
    this.undoBuffer = [];
    this.redoBuffer = [];
    this.clipboard = new SiriusClipboard();
  }

  isBlankDocument() {
    let ret = true;
    ret = ret && (this.fileData.length === 0);
    ret = ret && (this.undoBuffer.length === 0);
    ret = ret && (this.redoBuffer.length === 0);
    return ret;
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
    const fileSize = this.getFileSize();
    const actualLength = Math.max(0, Math.min(length, fileSize - address));
    const buffer = new Uint8Array(actualLength);
    if (actualLength === 0) {
      return buffer;
    }

    let blockAddress = 0;
    let writeOffset = 0;
    for (let i = 0; i < this.fileData.length; i += 1) {
      const block = this.fileData[i];
      const blockLength = block.size;
      if ((blockAddress + blockLength) <= address) {
        blockAddress += block.size;
        continue;
      }
      if ((address + length) <= blockAddress) {
        break;
      }
      const readOffset = address + writeOffset - blockAddress;
      const writeLength = Math.min(length - writeOffset, blockLength - readOffset);

      if (block.data === undefined) {
        block.data = this.fileHandle.getBuffer(blockAddress, block.size);
      }
      buffer.set(block.data.subarray(readOffset, readOffset + writeLength), writeOffset);
      blockAddress += block.size;
      writeOffset += block.size;
    }
    return buffer;
  }

  getFileSize() {
    let fileSize = 0;
    for (let i = 0; i < this.fileData.length; i += 1) {
      fileSize += this.fileData[i].size;
    }
    return fileSize;
  }

  getClipboard() {
    return this.clipboard;
  }

  setClipboard(clipboard) {
    assert(clipboard instanceof SiriusClipboard);
    this.clipboard = clipboard;
  }

  getFileHandle() {
    return this.fileHandle;
  }

  setFileHandle(fileHandle) {
    this.fileHandle = fileHandle;
    this.fileData = [];
    const fileSize = fileHandle.getSize();
    const blockCount = Math.ceil(fileSize / maxBlockSize);
    for (let i = 0; i < blockCount; i += 1) {
      const blockSize = Math.min(maxBlockSize, fileSize - i * maxBlockSize);
      this.fileData.push({
        file: true, size: blockSize, data: undefined, storage: undefined,
      });
    }
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
    }
    if (command.type === SiriusDocumentCommand.Overwrite.getType()) {
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
    }
    if (command.type === SiriusDocumentCommand.Remove.getType()) {
      assert((command.address + command.length) <= this.fileData.length);
      const backup = this.getBuffer(command.address, command.length);
      const undoCommand = new SiriusDocumentCommand.Insert(command.address, backup);
      this.fileData.splice(command.address, command.length);
      return undoCommand;
    }
    if (command.type === SiriusDocumentCommand.Cut.getType()) {
      const copyCommand = new SiriusDocumentCommand.Copy(command.address, command.length);
      const removeCommand = new SiriusDocumentCommand.Remove(command.address, command.length);
      this._runCommand(copyCommand);
      return this._runCommand(removeCommand);
    }
    if (command.type === SiriusDocumentCommand.Copy.getType()) {
      this.clipboard.setData(this.getBuffer(command.address, command.length));
      return undefined;
    }
    if (command.type === SiriusDocumentCommand.Paste.getType()) {
      if (this.clipboard.isEmpty()) {
        return undefined;
      }
      const data = this.clipboard.getData();
      const insertCommand = new SiriusDocumentCommand.Insert(command.address, data);
      return this._runCommand(insertCommand);
    }
    if (command.type === SiriusDocumentCommand.Composite.getType()) {
      const undoCommands = command.items.map(item => this._runCommand(item)).reverse();
      return new SiriusDocumentCommand.Composite(undoCommands);
    }
    if (command.type === undefined) {
      assert(false);
    }
    return undefined;
  }
}
