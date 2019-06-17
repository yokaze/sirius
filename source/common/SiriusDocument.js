import assert from 'assert';

import SiriusBinary from './SiriusBinary';
import SiriusClipboard from './SiriusClipboard';
import SiriusDocumentCommand from './SiriusDocumentCommand';
import SiriusConstants from './SiriusConstants';

const { maxBlockSize, minBlockSize } = SiriusConstants;

export default class SiriusDocument {
  constructor() {
    this.clipboard = new SiriusClipboard();
    this._binary = new SiriusBinary();
    this._initialize();
  }

  isBlankDocument() {
    let ret = true;
    ret = ret && (this._binary.length() === 0);
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

  read(address, length) {
    return this._binary.read(address, length);
  }

  length() {
    return this._binary.length();
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
    this._binary.setFileHandle(fileHandle);
  }

  _initialize() {
    this.undoBuffer = [];
    this.redoBuffer = [];
  }

  _blockIterator(startAddress, endAddress) {
    //  returns [{ address: number, block: object }, ...]
    const ret = [];
    const blockCount = this.blocks.length;
    let blockAddress = 0;
    for (let i = 0; i < blockCount; i += 1) {
      const block = this.blocks[i];
      const blockSize = block.size;
      if ((blockAddress + blockSize) <= startAddress) {
        blockAddress += blockSize;
        continue;
      }
      if (endAddress <= blockAddress) {
        break;
      }
      ret.push({ address: blockAddress, block });
      blockAddress += blockSize;
    }
    return ret;
  }

  _swapBlocks(blocks, nextBlocks) {
    const index = this.blocks.findIndex(b => (b === blocks[0]));
    assert(index >= 0);
    this.blocks.splice(index, blocks.length, ...nextBlocks);
  }

  _runCommand(command) {
    if (command.type === SiriusDocumentCommand.Insert.getType()) {
      return this._runInsertCommand(command);
    }
    if (command.type === SiriusDocumentCommand.Overwrite.getType()) {
      return this._runOverwriteCommand(command);
    }
    if (command.type === SiriusDocumentCommand.Remove.getType()) {
      return this._runRemoveCommand(command);
    }
    if (command.type === SiriusDocumentCommand.Cut.getType()) {
      return this._runCutCommand(command);
    }
    if (command.type === SiriusDocumentCommand.Copy.getType()) {
      return this._runCopyCommand(command);
    }
    if (command.type === SiriusDocumentCommand.Paste.getType()) {
      return this._runPasteCommand(command);
    }
    if (command.type === SiriusDocumentCommand.Composite.getType()) {
      const undoCommands = command.items.map(item => this._runCommand(item)).reverse();
      return new SiriusDocumentCommand.Composite(undoCommands);
    }
    assert(false);
    return undefined;
  }

  _extendFileLength(nextFileSize) {
    const fillData = new Uint8Array(nextFileSize - this.length());
    const fillCommand = new SiriusDocumentCommand.Insert(this.length(), fillData);
    return this._runCommand(fillCommand);
  }

  _runInsertCommand(command) {
    const { address } = command;
    if (address <= this.length()) {
      return this._runInsertCommandWithinBound(command);
    }
    return this._runInsertCommandExceedsBound(command);
  }

  _runInsertCommandWithinBound(command) {
    const { address, data } = command;
    const { length } = command.data;
    this._binary.insert(address, data);
    return new SiriusDocumentCommand.Remove(address, length);
  }

  _runInsertCommandExceedsBound(command) {
    const { address } = command;
    const undo1 = this._extendFileLength(address);
    const undo2 = this._runInsertCommandWithinBound(command);
    return new SiriusDocumentCommand.Composite([undo2, undo1]);
  }

  _runOverwriteCommand(command) {
    const { address } = command;
    const { length } = command.data;
    if ((address + length) <= this.length()) {
      return this._runOverwriteCommandWithinBound(command);
    }
    return this._runOverwriteCommandExceedsBound(command);
  }

  _runOverwriteCommandWithinBound(command) {
    const { address } = command;
    const { length } = command.data;
    const backup = this.read(address, length);
    {
      const blocks = this._blockIterator(address, address + length);
      const nextBlocks = [];
      for (let i = 0; i < blocks.length; i += 1) {
        const { address: blockAddress, block } = blocks[i];
        const blockSize = block.size;
        const blockOverwriteStart = Math.max(0, address - blockAddress);
        const blockOverwriteEnd = Math.min(blockSize, address + length - blockAddress);
        if (block.data === undefined) {
          block.data = this.fileHandle.getBuffer(block.address, block.size);
        }
        block.file = false;
        block.data.set(
          command.data.subarray(0, blockOverwriteEnd - blockOverwriteStart), blockOverwriteStart,
        );
        nextBlocks.push(block);
      }
      this._swapBlocks(blocks.map(b => b.block), nextBlocks);
    }
    return new SiriusDocumentCommand.Overwrite(address, backup);
  }

  _runOverwriteCommandExceedsBound(command) {
    const { address } = command;
    const { length } = command.data;
    const undo1 = this._extendFileLength(address + length);
    const undo2 = this._runOverwriteCommandWithinBound(command);
    return new SiriusDocumentCommand.Composite([undo2, undo1]);
  }

  _runRemoveCommand(command) {
    const { address, length } = command;
    assert((address + length) <= this.length());
    const backup = this._binary.read(address, length);
    this._binary.remove(address, length);
    return new SiriusDocumentCommand.Insert(address, backup);
  }

  _runCutCommand(command) {
    const copyCommand = new SiriusDocumentCommand.Copy(command.address, command.length);
    const removeCommand = new SiriusDocumentCommand.Remove(command.address, command.length);
    this._runCommand(copyCommand);
    return this._runCommand(removeCommand);
  }

  _runCopyCommand(command) {
    this.clipboard.setData(this.read(command.address, command.length));
    return undefined;
  }

  _runPasteCommand(command) {
    if (this.clipboard.isEmpty()) {
      return undefined;
    }
    const data = this.clipboard.getData();
    const insertCommand = new SiriusDocumentCommand.Insert(command.address, data);
    return this._runCommand(insertCommand);
  }
}
