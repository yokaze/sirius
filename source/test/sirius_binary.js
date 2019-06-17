/* eslint-env mocha */
import { expect } from 'chai';
import SiriusBinary from '../common/SiriusBinary';

describe('SiriusBinary', () => {
  it('constructor', () => {
    const binary = new SiriusBinary();
    expect(binary.length()).to.equal(0);
    const buffer = binary.read(100, 100);
    expect(buffer.length).to.equal(0);
  });
  it('insert one', () => {
    const binary = new SiriusBinary();
    binary.insert(0, new Uint8Array([1, 2, 3, 4]));
    expect(binary.length()).to.equal(4);
    expect(binary.read(0, 4)).to.deep.equal(new Uint8Array([1, 2, 3, 4]));
  });
  it('insert front', () => {
    const binary = new SiriusBinary();
    binary.insert(0, new Uint8Array([1, 2, 3, 4]));
    binary.insert(0, new Uint8Array([5, 6, 7, 8]));
    expect(binary.length()).to.equal(8);
    expect(binary.read(0, 8)).to.deep.equal(new Uint8Array([5, 6, 7, 8, 1, 2, 3, 4]));
  });
  it('insert middle', () => {
    const binary = new SiriusBinary();
    binary.insert(0, new Uint8Array([1, 2, 3, 4]));
    binary.insert(2, new Uint8Array([5, 6, 7, 8]));
    expect(binary.length()).to.equal(8);
    expect(binary.read(0, 8)).to.deep.equal(new Uint8Array([1, 2, 5, 6, 7, 8, 3, 4]));
  });
  it('insert back', () => {
    const binary = new SiriusBinary();
    binary.insert(0, new Uint8Array([1, 2, 3, 4]));
    binary.insert(4, new Uint8Array([5, 6, 7, 8]));
    expect(binary.length()).to.equal(8);
    expect(binary.read(0, 8)).to.deep.equal(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]));
  });
  it('remove one', () => {
    const binary = new SiriusBinary();
    binary.insert(0, new Uint8Array([1, 2, 3, 4]));
    binary.remove(0, 4);
    expect(binary.length()).to.equal(0);
  });
  it('remove front', () => {
    const binary = new SiriusBinary();
    binary.insert(0, new Uint8Array([1, 2, 3, 4]));
    binary.insert(4, new Uint8Array([5, 6, 7, 8]));
    binary.remove(0, 4);
    expect(binary.length()).to.equal(4);
    expect(binary.read(0, 4)).to.deep.equal(new Uint8Array([5, 6, 7, 8]));
  });
  it('remove middle', () => {
    const binary = new SiriusBinary();
    binary.insert(0, new Uint8Array([1, 2, 3, 4]));
    binary.insert(4, new Uint8Array([0, 0, 0, 0]));
    binary.insert(8, new Uint8Array([5, 6, 7, 8]));
    binary.remove(4, 4);
    expect(binary.length()).to.equal(8);
    expect(binary.read(0, 8)).to.deep.equal(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]));
  });
  it('remove back', () => {
    const binary = new SiriusBinary();
    binary.insert(0, new Uint8Array([1, 2, 3, 4]));
    binary.insert(4, new Uint8Array([5, 6, 7, 8]));
    binary.remove(4, 4);
    expect(binary.length()).to.equal(4);
    expect(binary.read(0, 4)).to.deep.equal(new Uint8Array([1, 2, 3, 4]));
  });
  it('remove left', () => {
    const binary = new SiriusBinary();
    binary.insert(0, new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]));
    binary.remove(0, 3);
    expect(binary.length()).to.equal(5);
    expect(binary.read(0, 5)).to.deep.equal(new Uint8Array([4, 5, 6, 7, 8]));
  });
  it('remove right', () => {
    const binary = new SiriusBinary();
    binary.insert(0, new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]));
    binary.remove(5, 3);
    expect(binary.length()).to.equal(5);
    expect(binary.read(0, 5)).to.deep.equal(new Uint8Array([1, 2, 3, 4, 5]));
  });
  it('remove in-block', () => {
    const binary = new SiriusBinary();
    binary.insert(0, new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]));
    binary.remove(2, 4);
    expect(binary.length()).to.equal(4);
    expect(binary.read(0, 4)).to.deep.equal(new Uint8Array([1, 2, 7, 8]));
  });
  it('remove multi-block bordered', () => {
    const binary = new SiriusBinary();
    binary.insert(0, new Uint8Array([1, 2, 3, 4]));
    binary.insert(4, new Uint8Array([0, 0, 0, 0]));
    binary.insert(8, new Uint8Array([9, 9, 9, 9]));
    binary.insert(12, new Uint8Array([5, 6, 7, 8]));
    binary.remove(4, 8);
    expect(binary.blockCount()).to.equal(2);
    expect(binary.length()).to.equal(8);
    expect(binary.read(0, 8)).to.deep.equal(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]));
  });
  it('remove multi-block in-block', () => {
    const binary = new SiriusBinary();
    binary.insert(0, new Uint8Array([1, 2, 3, 4]));
    binary.insert(4, new Uint8Array([5, 6, 7, 8]));
    binary.remove(2, 4);
    expect(binary.length()).to.equal(4);
    expect(binary.read(0, 4)).to.deep.equal(new Uint8Array([1, 2, 7, 8]));
  });
  it('overwrite', () => {
    const binary = new SiriusBinary();
    binary.insert(0, new Uint8Array([1, 2, 3, 4]));
    binary.overwrite(1, new Uint8Array([5, 6]));
    expect(binary.length()).to.equal(4);
    expect(binary.read(0, 4)).to.deep.equal(new Uint8Array([1, 5, 6, 4]));
  });
});
