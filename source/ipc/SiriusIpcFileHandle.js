import SiriusIpcClient from './SiriusIpcClient';

export default class SiriusIpcFileHandle {
  constructor(fileHandle) {
    this.client = new SiriusIpcClient();
    this.client.setListener(this);
    this.fileHandle = fileHandle;
    this.fileSize = this.client.receiveFileSizeSync(fileHandle);
  }

  destroy() {
    this.client.destroy();
  }

  getBuffer(address, length) {
    const buffer = this.client.receiveFileBufferSync(this.fileHandle, address, length);
    return new Uint8Array(buffer);
  }

  getSize() {
    return this.fileSize;
  }
}
