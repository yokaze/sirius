import fs from 'fs';

export default class SiriusFileHandle {
  constructor(filePath) {
    this.filePath = filePath;
    this.fileHandle = fs.openSync(filePath, 'r');
    this.fileData = new Uint8Array(this.getSize());
    fs.readSync(this.fileHandle, this.fileData, 0, this.getSize(), 0);
  }

  getBuffer(address, length) {
    return this.fileData.subarray(address, address + length);
  }

  getSize() {
    return fs.statSync(this.filePath).size;
  }
}
