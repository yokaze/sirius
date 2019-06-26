/* eslint-env mocha */
import { expect } from 'chai';
import os from 'os';
import path from 'path';
import SiriusBinary from '../common/SiriusBinary';
import SiriusFileHandle from '../main/SiriusFileHandle';
import SiriusFileWriter from '../main/SiriusFileWriter';

describe('SiriusFileWriter', () => {
  it('write', () => {
    const filePath = path.join(os.tmpdir(), 'sirius_file_writer');
    const binary = new SiriusBinary();
    binary.insert(0, new Uint8Array([0, 1, 2, 3]));
    const writer = new SiriusFileWriter(filePath, binary);
    writer.write();
    const handle = new SiriusFileHandle(filePath);
    expect(handle.length()).to.equal(4);
    expect(handle.read(0, 4)).to.deep.equal(new Uint8Array([0, 1, 2, 3]));
  });
});
