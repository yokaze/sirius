import assert from 'assert';
import fs from 'fs';
import SiriusBinary from '../common/SiriusBinary';

export default class SiriusFileWriter {
  constructor(filePath, binary) {
    assert((typeof filePath) === 'string');
    assert(binary instanceof SiriusBinary);
    this._filePath = filePath;
    this._binary = binary;
  }

  write() {
    const binary = this._binary;
    fs.writeFileSync(this._filePath, binary.read(0, binary.length()));
  }
}
