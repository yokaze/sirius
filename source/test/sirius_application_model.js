/* eslint-env mocha */
import { expect } from 'chai';
import SiriusApplicationModel from '../main/SiriusApplicationModel';
import SiriusDocument from '../common/SiriusDocument';

describe('SiriusApplicationModel', () => {
  it('create document', () => {
    const model = new SiriusApplicationModel();
    const key = model.createDocument();
    const doc = model.getDocument(key);
    expect(doc).to.be.an.instanceof(SiriusDocument);
    expect(doc.getClipboard()).to.equal(model.getClipboard());
  });
  it('load file', () => {
    const path = 'test/sample';
    const model = new SiriusApplicationModel();
    const key = model.createDocument();
    const doc = model.getDocument(key);
    model.loadFile(key, path);
    expect(model.getDocumentPath(key)).to.equal(path);
    expect(doc.read(64, 4)).to.deep.equal(new Uint8Array([64, 65, 66, 67]));
  });
});
