import { ipcRenderer } from 'electron';
import SiriusIpcCommand from './SiriusIpcCommand';

export default class {
  constructor() {
    ipcRenderer.on(SiriusIpcCommand.onRendererReceivedRenewalBinary, (e, renewalBinary) => {
      this.listener.onReceivedRenewalBinary(this, renewalBinary);
    });
    ipcRenderer.on(SiriusIpcCommand.onAppUpdatePreference, (e, preference) => {
      this.listener.onAppUpdatePreference(this, preference);
    });
    ipcRenderer.on(SiriusIpcCommand.onAppRequestSelectAll, (e) => {
      this.listener.onAppRequestSelectAll(this);
    })
  }

  setListener(listener) {
    this.listener = listener;
  }

  sendDocumentCommand(command) {
    ipcRenderer.send(SiriusIpcCommand.onDocumentCommand, command);
  }

  sendPreferenceCommand(command) {
    ipcRenderer.send(SiriusIpcCommand.onPreferenceCommand, command);
  }
}
