import { app, Menu } from 'electron';
import SiriusModel from './SiriusModel';

const model = new SiriusModel();

export default {
  Model: model,
};

const menuTemplate = [
  {
    label: app.getName(),
    submenu: [
      { label: 'About', click: () => { model.openAbout(); } },
      { label: 'Option', click: () => { } },
      { type: 'separator' },
      { role: 'quit' },
    ],
  },
  {
    label: 'File',
    submenu: [
      { label: 'New', click: () => { model.createNew(); }, accelerator: 'CmdOrCtrl+N' },
      { label: 'Open', click: () => { model.open(); }, accelerator: 'CmdOrCtrl+O' },
      { label: 'Save', click: () => { model.save(); }, accelerator: 'CmdOrCtrl+S' },
      { label: 'Save As', click: () => { model.saveAs(); }, accelerator: 'CmdOrCtrl+Shift+S' },
    ],
  },
  {
    label: 'Edit',
    submenu: [
      { label: 'Undo', click: () => { model.undo(); }, accelerator: 'CmdOrCtrl+Z' },
      { label: 'Redo', click: () => { model.redo(); }, accelerator: 'CmdOrCtrl+Shift+Z' },
      { type: 'separator' },
      { label: 'Cut', click: () => { }, accelerator: 'CmdOrCtrl+X' },
      { label: 'Copy', click: () => { }, accelerator: 'CmdOrCtrl+C' },
      { label: 'Paste', click: () => { }, accelerator: 'CmdOrCtrl+V' },
      { label: 'Select All', click: () => { }, accelerator: 'CmdOrCtrl+A' },
    ],
  },
  {
    label: 'View',
    submenu: [
      { label: 'Open in New Window', click: () => { model.duplicateActiveEditor(); } },
    ],
  },
];

app.on('ready', () => {
  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
  model.createNew();
});
