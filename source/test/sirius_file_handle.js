/* eslint-env mocha */
import { expect } from 'chai';
import SiriusFileHandle from '../main/SiriusFileHandle';

describe('SiriusFileHandle', () => {
  it('read', () => {
    const file = new SiriusFileHandle('test/sample');
    expect(file.length()).to.equal(256);
    expect(file.read(64, 4)).to.deep.equal(new Uint8Array([64, 65, 66, 67]));
  });
});
