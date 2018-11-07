import electron from 'electron';
import { app, Menu } from 'electron';
import SiriusModel from './SiriusModel';

const model = new SiriusModel;

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
      { label: 'New', click: model.createNew, accelerator:'CmdOrCtrl+N' },
      { label: 'Open', click: model.open, accelerator:'CmdOrCtrl+O' },
      { label: 'Save', click: model.save, accelerator:'CmdOrCtrl+S' },
      { label: 'Save As', click: model.saveAs, accelerator:'CmdOrCtrl+Shift+S' }
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
    model.createNew();
});
