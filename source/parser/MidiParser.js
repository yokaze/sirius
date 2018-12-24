import assert from 'assert';
import shallowEqualArrays from 'shallow-equal/arrays';

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
          assert(shallowEqualArrays(header.subarray(0, 8), template));
        }
        ret.push({ address: 0, text: 'MIDI Header' });
        const trackCount = header[10] * 256 + header[11];
        address = 14;
        for (let i = 0; i < trackCount; i += 1) {
          const trackHeader = this.document.getBuffer(address, 8);
          {
            const template = [0x4D, 0x54, 0x72, 0x6B];
            assert(shallowEqualArrays(trackHeader.subarray(0, 4), template));
          }
          let trackLength = trackHeader[4];
          trackLength = trackLength * 256 + trackHeader[5];
          trackLength = trackLength * 256 + trackHeader[6];
          trackLength = trackLength * 256 + trackHeader[7];
          this.tags.set(address, kMidiTrack);
          ret.push({ address, text: 'MIDI Track' });
          address += trackLength + 8;
        }
      } else if (this.tags.get(address) === kMidiTrack) {
        console.log('find track');
      } else {
        throw new Error();
      }
    } catch (e) {
      ret.push({ address, text: undefined });
    }
    return ret;
  }

  reset() {
  }
}
