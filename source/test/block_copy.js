/* eslint-env mocha */
import { expect } from 'chai';
import blockCopy from '../common/utils/BlockCopy';

describe('BlockCopy', () => {
  it('src == dst', () => {
    const src = new Uint8Array([1, 2, 3]);
    const dst = new Uint8Array([0, 0, 0]);
    blockCopy(src, 0, dst, 0);
    expect(dst).to.deep.equal(new Uint8Array([1, 2, 3]));
  });
  it('src < dst', () => {
    const src = new Uint8Array([1, 2, 3]);
    const dst = new Uint8Array([0, 0, 0]);
    blockCopy(src, 0, dst, 6);
    expect(dst).to.deep.equal(new Uint8Array([0, 0, 0]));
  });
  it('src > dst', () => {
    const src = new Uint8Array([1, 2, 3]);
    const dst = new Uint8Array([0, 0, 0]);
    blockCopy(src, 6, dst, 0);
    expect(dst).to.deep.equal(new Uint8Array([0, 0, 0]));
  });
  it('src in dst', () => {
    const src = new Uint8Array([1]);
    const dst = new Uint8Array([0, 0, 0]);
    blockCopy(src, 1, dst, 0);
    expect(dst).to.deep.equal(new Uint8Array([0, 1, 0]));
  });
  it('dst in src', () => {
    const src = new Uint8Array([1, 2, 3]);
    const dst = new Uint8Array([0]);
    blockCopy(src, 0, dst, 1);
    expect(dst).to.deep.equal(new Uint8Array([2]));
  });
  it('src precedes dst', () => {
    const src = new Uint8Array([1, 2, 3]);
    const dst = new Uint8Array([0, 0, 0]);
    blockCopy(src, 0, dst, 1);
    expect(dst).to.deep.equal(new Uint8Array([2, 3, 0]));
  });
  it('dst precedes src', () => {
    const src = new Uint8Array([1, 2, 3]);
    const dst = new Uint8Array([0, 0, 0]);
    blockCopy(src, 1, dst, 0);
    expect(dst).to.deep.equal(new Uint8Array([0, 1, 2]));
  });
});
