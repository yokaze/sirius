import uuid from 'uuid/v4';

import SiriusClipboard from '../common/SiriusClipboard';
import SiriusDocument from '../common/SiriusDocument';

export default class SiriusApplicationModel {
  constructor() {
    this._clipboard = new SiriusClipboard();
    this._documents = new Map();
  }

  getClipboard() {
    return this._clipboard;
  }

  createDocument() {
    const key = uuid();
    const document = new SiriusDocument();
    document.setClipboard(this._clipboard);
    this._documents.set(key, { document });
    return key;
  }

  getDocument(key) {
    return this._documents.get(key).document;
  }
}
