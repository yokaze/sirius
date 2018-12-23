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
    length = Math.max(0, Math.min(length, fileSize - address));
    const buffer = new Uint8Array(length);

    const blocks = this._blockIterator(address, address + length);
    for (let i = 0; i < blocks.length; i += 1) {
      const { address: blockAddress, block } = blocks[i];
      const blockSize = block.size;
      const writeOffset = Math.max(0, blockAddress - address);
      const readOffset = address + writeOffset - blockAddress;
      const writeLength = Math.min(length - writeOffset, blockSize - readOffset);

      if (block.data === undefined) {
        block.data = this.fileHandle.getBuffer(block.address, block.size);
      }
      buffer.set(block.data.subarray(readOffset, readOffset + writeLength), writeOffset);
    }
    return buffer;
  }

  getFileSize() {
    return this.fileData.reduce((size, block) => size + block.size, 0);
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
        file: true, address: i * blockSize, size: blockSize, data: undefined, storage: undefined,
      });
    }
  }

  _blockIterator(startAddress, endAddress) {
    const items = [];
    const blockCount = this.fileData.length;
    let blockAddress = 0;
    for (let i = 0; i < blockCount; i += 1) {
      const block = this.fileData[i];
      const blockSize = block.size;
      if ((blockAddress + blockSize) <= startAddress) {
        blockAddress += blockSize;
        continue;
      }
      if (endAddress <= blockAddress) {
        break;
      }
      items.push({ address: blockAddress, block });
      blockAddress += blockSize;
    }
    return items;
  }

  _swapBlocks(blocks, nextBlocks) {
    const index = this.fileData.findIndex(b => (b === blocks[0]));
    assert(index >= 0);
    this.fileData.splice(index, blocks.length, ...nextBlocks);
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
    if (command.type === undefined) {
      assert(false);
    }
    return undefined;
  }

  _runInsertCommand(command) {
    if (command.address <= this.getFileSize()) {
      this.fileData.splice(command.address, 0, ...command.data);
      const undoCommand = new SiriusDocumentCommand.Remove(command.address, command.data.length);
      return undoCommand;
    }
    //  Fill zeros from file-end to insert address
    const fillData = new Uint8Array(command.address - this.getFileSize());
    const fillCommand = new SiriusDocumentCommand.Insert(this.getFileSize(), fillData);
    const undo1 = this._runCommand(fillCommand);
    const undo2 = this._runCommand(command);
    return new SiriusDocumentCommand.Composite([undo2, undo1]);
  }

  _runOverwriteCommand(command) {
    const { address } = command;
    const { length } = command.data;
    if ((address + length) <= this.getFileSize()) {
      const backup = this.getBuffer(address, length);
      const undoCommand = new SiriusDocumentCommand.Overwrite(address, backup);

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
      return undoCommand;
    }
    //  Fill zeros from file-end to overwrite area
    const desiredLength = address + length;
    const fillData = new Uint8Array(desiredLength - this.getFileSize());
    const fillCommand = new SiriusDocumentCommand.Insert(this.getFileSize(), fillData);
    const undo1 = this._runCommand(fillCommand);
    const undo2 = this._runCommand(command);
    return new SiriusDocumentCommand.Composite([undo2, undo1]);
  }

  _runRemoveCommand(command) {
    const { address, length } = command;
    assert((address + length) <= this.getFileSize());
    const backup = this.getBuffer(address, length);
    const undoCommand = new SiriusDocumentCommand.Insert(address, backup);

    const blocks = this._blockIterator(address, address + length);
    const nextBlocks = [];
    for (let i = 0; i < blocks.length; i += 1) {
      const { address: blockAddress, block } = blocks[i];
      const blockSize = block.size;
      const blockRemoveStart = Math.max(0, address - blockAddress);
      const blockRemoveEnd = Math.min(blockSize, address + length - blockAddress);
      if ((blockRemoveStart === 0) && (blockRemoveEnd === blockSize)) {
        continue;
      } else if (blockRemoveStart === 0) {
        block.address += blockRemoveEnd;
        if (block.data) {
          block.data = block.data.subarray(blockRemoveEnd);
        }
        nextBlocks.push(block);
      } else if (blockRemoveEnd === blockSize) {
        block.size = blockRemoveStart;
        nextBlocks.push(block);
      } else {
        block.size = blockRemoveStart;
        nextBlocks.push(block);
        const rightBlock = {
          file: true,
          address: block.address + blockRemoveEnd,
          size: blockSize - blockRemoveEnd,
          data: undefined,
          storage: undefined,
        };
        nextBlocks.push(rightBlock);
      }
    }
    this._swapBlocks(blocks.map(b => b.block), nextBlocks);
    return undoCommand;
  }

  _runCutCommand(command) {
    const copyCommand = new SiriusDocumentCommand.Copy(command.address, command.length);
    const removeCommand = new SiriusDocumentCommand.Remove(command.address, command.length);
    this._runCommand(copyCommand);
    return this._runCommand(removeCommand);
  }

  _runCopyCommand(command) {
    this.clipboard.setData(this.getBuffer(command.address, command.length));
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
