import { remote } from 'electron';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormLabel from '@material-ui/core/FormLabel';
import Input from '@material-ui/core/Input';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';

import SiriusIpcClient from '../ipc/SiriusIpcClient';

const appConsole = remote.getGlobal('console');
const ipcClient = new SiriusIpcClient();

class PreferencesView extends Component {
  constructor(props) {
    super(props);
    this.columnUnitGroupChanged = this.columnUnitGroupChanged.bind(this);
    this.state = { columnUnit: 16 };
  }

  columnUnitGroupChanged(e) {
    const value = e.target.value;
    this.setState(() => {
      ipcClient.sendPreferenceCommand({
        columnUnit: value,
      });
      return { columnUnit: value };
    });
  }

  render() {
    return (<div style={{ margin: 8 }}>
      <FormControl>
        <FormLabel component="legend">Font Family</FormLabel>
        <Input placeholder="Roboto Mono" />
      </FormControl>
      <FormControl>
        <FormLabel component="legend">Font Size</FormLabel>
        <Input placeholder="16" />
      </FormControl>
      <FormControl>
        <FormLabel component="legend">Column Unit</FormLabel>
        <RadioGroup
          row
          value={this.state.columnUnit.toString(10)}
          onChange={this.columnUnitGroupChanged}
        >
          <FormControlLabel value="1" control={<Radio />} label="1" />
          <FormControlLabel value="2" control={<Radio />} label="2" />
          <FormControlLabel value="4" control={<Radio />} label="4" />
          <FormControlLabel value="8" control={<Radio />} label="8" />
          <FormControlLabel value="16" control={<Radio />} label="16" />
        </RadioGroup>
      </FormControl>
    </div>);
  }
}

ReactDOM.render(
  <PreferencesView />,
  document.getElementById('root'),
);
