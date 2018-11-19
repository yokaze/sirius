import assert from 'assert';
import SiriusDocumentCommand from '../common/SiriusDocumentCommand';

export default class SiriusDocument {
  constructor() {
    this.fileData = [];
  }

  applyCommand(command) {
    if (command.type === SiriusDocumentCommand.Insert.getType()) {
      assert(command.address <= this.fileData.length);
      this.fileData.splice(command.address, 0, command.data[0]);
    } else if (command.type === SiriusDocumentCommand.Overwrite.getType()) {
      assert(command.address <= this.fileData.length);
      this.fileData.splice(command.address, command.data.length, ...command.data);
    } else if (command.type === SiriusDocumentCommand.Remove.getType()) {
      this.fileData.splice(command.address, command.length);
    }
  }

  getFileData() {
    return this.fileData;
  }

  setFileData(fileData) {
    assert(Array.isArray(fileData));
    this.fileData = fileData;
  }
}
