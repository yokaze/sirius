import fs from 'fs';

export default class SiriusFileHandle {
  constructor(filePath) {
    this.filePath = filePath;
    this.fileHandle = fs.openSync(filePath, 'r');
    this.fileData = new Uint8Array(this.length());
    fs.readSync(this.fileHandle, this.fileData, 0, this.length(), 0);
  }

  read(address, length) {
    return this.fileData.subarray(address, address + length);
  }

  length() {
    return fs.statSync(this.filePath).size;
  }
}
