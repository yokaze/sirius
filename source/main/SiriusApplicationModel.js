import uuid from 'uuid/v4';

import SiriusClipboard from '../common/SiriusClipboard';
import SiriusDocument from '../common/SiriusDocument';
import SiriusFileHandle from './SiriusFileHandle';

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

  removeDocument(key) {

  }

  loadFile(key, path) {
    const handle = new SiriusFileHandle(path);
    const doc = this.getDocument(key);
    doc.setFileHandle(handle);
    this._documents.get(key).path = path;
  }

  getDocument(key) {
    return this._documents.get(key).document;
  }

  getDocumentPath(key) {
    return this._documents.get(key).path;
  }
}
