import assert from 'assert';

export default class SiriusClipboard {
  constructor() {
    this.data = undefined;
    this.listener = undefined;
  }

  getData() {
    return this.data;
  }

  setData(data) {
    assert(data instanceof Uint8Array);
    this.data = data;
    if (this.listener) {
      this.listener.onClipboardDataChanged(this);
    }
  }

  isEmpty() {
    return this.data === undefined;
  }

  setListener(listener) {
    this.listener = listener;
  }
}
