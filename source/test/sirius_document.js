/* eslint-env mocha */
import { expect } from 'chai';
import SiriusDocument from '../common/SiriusDocument';
import SiriusDocumentCommand from '../common/SiriusDocumentCommand';

describe('SiriusDocument', () => {
  it('constructor', () => {
    const doc = new SiriusDocument();
    expect(doc.isBlankDocument()).to.equal(true);
    expect(doc.read(100, 100)).to.deep.equal(new Uint8Array());
    expect(doc.length()).to.equal(0);
  });
  it('insert', () => {
    const doc = new SiriusDocument();
    const com1 = new SiriusDocumentCommand.Insert(0, new Uint8Array([1, 2, 3, 4]));
    doc.applyCommand(com1);
    expect(doc.isBlankDocument()).to.equal(false);
    expect(doc.length()).to.equal(4);
    expect(doc.read(0, 4)).to.deep.equal(new Uint8Array([1, 2, 3, 4]));
    const com2 = new SiriusDocumentCommand.Insert(0, new Uint8Array([5, 6, 7, 8]));
    doc.applyCommand(com2);
    expect(doc.length()).to.equal(8);
    expect(doc.read(0, 8)).to.deep.equal(new Uint8Array([5, 6, 7, 8, 1, 2, 3, 4]));
    doc.undo();
    expect(doc.length()).to.equal(4);
    expect(doc.read(0, 4)).to.deep.equal(new Uint8Array([1, 2, 3, 4]));
  });
  it('insert beyond', () => {
    const doc = new SiriusDocument();
    const com1 = new SiriusDocumentCommand.Insert(100, new Uint8Array([1, 2, 3, 4]));
    doc.applyCommand(com1);
    expect(doc.length()).to.equal(104);
    expect(doc.read(100, 4)).to.deep.equal(new Uint8Array([1, 2, 3, 4]));
    doc.undo();
    expect(doc.isBlankDocument()).to.equal(false);
    expect(doc.length()).to.equal(0);
  });
});
