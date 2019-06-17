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
    const com = new SiriusDocumentCommand.Insert(100, new Uint8Array([1, 2, 3, 4]));
    doc.applyCommand(com);
    expect(doc.length()).to.equal(104);
    expect(doc.read(100, 4)).to.deep.equal(new Uint8Array([1, 2, 3, 4]));
    doc.undo();
    expect(doc.isBlankDocument()).to.equal(false);
    expect(doc.length()).to.equal(0);
  });
  it('overwrite', () => {
    const doc = new SiriusDocument();
    const com1 = new SiriusDocumentCommand.Insert(0, new Uint8Array([1, 2, 3, 4]));
    doc.applyCommand(com1);
    const com2 = new SiriusDocumentCommand.Overwrite(1, new Uint8Array([5, 6]));
    doc.applyCommand(com2);
    expect(doc.length()).to.equal(4);
    expect(doc.read(0, 4)).to.deep.equal(new Uint8Array([1, 5, 6, 4]));
    doc.undo();
    expect(doc.length()).to.equal(4);
    expect(doc.read(0, 4)).to.deep.equal(new Uint8Array([1, 2, 3, 4]));
  });
  it('overwrite beyond', () => {
    const doc = new SiriusDocument();
    const com = new SiriusDocumentCommand.Overwrite(100, new Uint8Array([1, 2, 3, 4]));
    doc.applyCommand(com);
    expect(doc.length()).to.equal(104);
    expect(doc.read(100, 4)).to.deep.equal(new Uint8Array([1, 2, 3, 4]));
    doc.undo();
    expect(doc.isBlankDocument()).to.equal(false);
    expect(doc.length()).to.equal(0);
  });
  it('cut', () => {
    const doc = new SiriusDocument();
    const com1 = new SiriusDocumentCommand.Insert(0, new Uint8Array([1, 2, 3, 4]));
    doc.applyCommand(com1);
    const com2 = new SiriusDocumentCommand.Cut(1, 2);
    doc.applyCommand(com2);
    expect(doc.length()).to.equal(2);
    expect(doc.read(0, 2)).to.deep.equal(new Uint8Array([1, 4]));
    expect(doc.getClipboard().getValue()).to.deep.equal(new Uint8Array([2, 3]));
  });
  it('copy', () => {
    const doc = new SiriusDocument();
    const com1 = new SiriusDocumentCommand.Insert(0, new Uint8Array([1, 2, 3, 4]));
    doc.applyCommand(com1);
    const com2 = new SiriusDocumentCommand.Copy(1, 2);
    doc.applyCommand(com2);
    expect(doc.length()).to.equal(4);
    expect(doc.read(0, 4)).to.deep.equal(new Uint8Array([1, 2, 3, 4]));
    expect(doc.getClipboard().getValue()).to.deep.equal(new Uint8Array([2, 3]));
  });
  it('paste', () => {
    const doc = new SiriusDocument();
    const com1 = new SiriusDocumentCommand.Insert(0, new Uint8Array([1, 2, 3, 4]));
    doc.applyCommand(com1);
    const com2 = new SiriusDocumentCommand.Copy(1, 2);
    doc.applyCommand(com2);
    const com3 = new SiriusDocumentCommand.Paste(1);
    doc.applyCommand(com3);
    expect(doc.length()).to.equal(6);
    expect(doc.read(0, 6)).to.deep.equal(new Uint8Array([1, 2, 3, 2, 3, 4]));
    doc.undo();
    expect(doc.length()).to.equal(4);
    expect(doc.read(0, 4)).to.deep.equal(new Uint8Array([1, 2, 3, 4]));
  });
});
