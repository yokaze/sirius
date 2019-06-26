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
});
