/* eslint-env mocha */
import { expect } from 'chai';
import os from 'os';
import path from 'path';
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
    const input = 'test/sample';
    const model = new SiriusApplicationModel();
    const key = model.createDocument();
    const doc = model.getDocument(key);
    model.loadFile(key, input);
    expect(model.getDocumentPath(key)).to.equal(input);
    expect(doc.read(64, 4)).to.deep.equal(new Uint8Array([64, 65, 66, 67]));
  });
  it('save file as', () => {
    const input = 'test/sample';
    const output = path.join(os.tmpdir(), 'sirius_application_model_save_as');
    const model = new SiriusApplicationModel();
    const key = model.createDocument();
    model.loadFile(key, input);
    model.saveFileAs(key, output);
    expect(model.getDocumentPath(key)).to.equal(output);
    model.loadFile(key, output);
    const doc = model.getDocument(key);
    expect(doc.read(64, 4)).to.deep.equal(new Uint8Array([64, 65, 66, 67]));
  });
});
