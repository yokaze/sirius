import { dialog } from 'electron';

export default class {
  constructor() {
  }

  createNew() {
    console.log('Create New');
  }

  open() {
    const fileNames = dialog.showOpenDialog(null, {
      properties: ['openFile']
    });
    if (fileNames != undefined) {
      const fileName = fileNames[0];
      console.log(fileName);
    }
  }

  save() {
    console.log('Save');
  }

  saveAs() {
    console.log('Save As');
  }
}
