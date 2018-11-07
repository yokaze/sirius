import electron from 'electron';
import { app, Menu } from 'electron';
import SiriusModel from './SiriusModel';

export const Model = new SiriusModel;

const menuTemplate = [
  {
    label: app.getName(),
    submenu: [
      {role: 'quit'}
    ]
  },
  {
    label: 'File',
    submenu: [
      { label: 'New', click: Model.createNew, accelerator:'CmdOrCtrl+N' },
      { label: 'Open', click: Model.open, accelerator:'CmdOrCtrl+O' },
      { label: 'Save', click: Model.save, accelerator:'CmdOrCtrl+S' },
      { label: 'Save As', click: Model.saveAs, accelerator:'CmdOrCtrl+Shift+S' }
    ]
  },
  {
    label: 'Edit',
    submenu: [
      {role: 'undo'},
      {role: 'redo'}
    ]
  },
];

app.on('ready', function() {
    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);
    Model.createNew();
});
