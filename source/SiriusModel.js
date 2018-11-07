import { BrowserWindow, dialog } from 'electron';
import fs from 'fs';
import path from 'path';
import url from 'url';

class SiriusWindowModel {
  constructor() {

  }
};

export default class {
  constructor() {
    this.windowModels = {};
  }

  createNew() {
    const browserWindow = new BrowserWindow({ width: 1600, height: 1024 });
    const indexUrl = url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    });
    browserWindow.loadURL(indexUrl);
    browserWindow.webContents.openDevTools();
    console.log(browserWindow.id);
  }

  open() {
    const fileNames = dialog.showOpenDialog(null, {
      properties: ['openFile']
    });
    if (fileNames != undefined) {
      const fileName = fileNames[0];
      const buffer = fs.readFileSync(fileName);
      console.log([...buffer]);
    }
  }

  save() {
    console.log('Save');
  }

  saveAs() {
    console.log('Save As');
  }
}
