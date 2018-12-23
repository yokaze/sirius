import assert from 'assert';

const kMidiTrack = 'kMidiTrack';

export default class MidiParser {
  constructor(document) {
    this.document = document;
    this.tags = new Map();
  }

  parseBlock(address) {
    const ret = [];
    try {
      if (address === 0) {
        const header = this.document.getBuffer(0, 14);
        {
          const template = [0x4D, 0x54, 0x68, 0x64, 0x00, 0x00, 0x00, 0x06];
          assert(this._testArray(header.subarray(0, 8), template));
        }
        ret.push({ address: 0, value: 'MIDI Header' });
        const trackCount = header[10] * 256 + header[11];
        address = 14;
        for (let i = 0; i < trackCount; i += 1) {
          const trackHeader = this.document.getBuffer(address, 8);
          {
            const template = [0x4D, 0x54, 0x72, 0x6B];
            assert(this._testArray(trackHeader.subarray(0, 4), template));
          }
          let trackLength = trackHeader[4];
          trackLength = trackLength * 256 + trackHeader[5];
          trackLength = trackLength * 256 + trackHeader[6];
          trackLength = trackLength * 256 + trackHeader[7];
          this.tags.set(address, kMidiTrack);
          ret.push({ address, value: 'MIDI Track' });
          address += trackLength + 8;
        }
      } else if (this.tags.get(address) === kMidiTrack) {
        console.log('find track');
      } else {
        throw new Error();
      }
    } catch (e) {
      ret.push({ address, value: undefined });
    }
    return ret;
  }

  reset() {
  }

  _testArray(x, y) {
    if (x.length !== y.length) {
      return false;
    }
    for (let i = 0; i < x.length; i += 1) {
      if (x[i] !== y[i]) {
        return false;
      }
    }
    return true;
  }
}