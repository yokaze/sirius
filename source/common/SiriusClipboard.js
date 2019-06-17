import assert from 'assert';

export default class SiriusClipboard {
  constructor() {
    this._value = undefined;
    this._listener = undefined;
  }

  getValue() {
    return this._value;
  }

  setValue(value) {
    assert(value instanceof Uint8Array);
    this._value = value;
    if (this._listener) {
      this._listener.onClipboardDataChanged(this);
    }
  }

  isEmpty() {
    return (this._value === undefined);
  }

  setListener(listener) {
    this._listener = listener;
  }
}
