import { ipcRenderer } from 'electron';
import SiriusIpcCommand from './SiriusIpcCommand';

export default class {
  constructor() {
    ipcRenderer.on(SiriusIpcCommand.onRendererReceivedRenewalBinary, (e, renewalBinary) => {
      this.listener.onReceivedRenewalBinary(this, renewalBinary);
    });
  }

  setListener(listener) {
    this.listener = listener;
  }

  sendDocumentCommand(command) {
    ipcRenderer.send(SiriusIpcCommand.onDocumentCommand, command);
  }
}
