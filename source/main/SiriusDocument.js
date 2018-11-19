import SiriusDocumentCommand from '../common/SiriusDocumentCommand';

export default class SiriusDocument {
  constructor() {
    this.fileData = [];
  }

  applyCommand(command) {
    if (command.type === SiriusDocumentCommand.Insert.getType()) {
      this.fileData.splice(command.address, 0, command.data[0]);
    }
  }

  getFileData() {
    return this.fileData;
  }

  setFileData(fileData) {
    this.fileData = fileData;
  }
}
