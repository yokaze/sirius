/* eslint-env browser */
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormLabel from '@material-ui/core/FormLabel';
import Input from '@material-ui/core/Input';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';

import SiriusConstants from '../common/SiriusConstants';
import SiriusIpcClient from '../ipc/SiriusIpcClient';

const defaultFontFamily = SiriusConstants.defaultFontFamily;
const defaultFontSize = SiriusConstants.defaultFontSize;
const defaultColumnUnit = 4;
const ipcClient = new SiriusIpcClient();

function sendPreference(state) {
  let fontFamily = state.fontFamily;
  let fontSize = Math.min(Math.max(8, parseInt(state.fontSize, 10)), 96);
  const columnUnit = state.columnUnit;
  if (fontFamily === '') {
    fontFamily = defaultFontFamily;
  }
  if (isNaN(fontSize)) {
    fontSize = defaultFontSize;
  }
  ipcClient.sendPreferenceCommand({
    fontFamily,
    fontSize,
    columnUnit,
  });
}

class PreferencesView extends Component {
  constructor(props) {
    super(props);
    this.fontFamilyInputChanged = this.fontFamilyInputChanged.bind(this);
    this.fontSizeInputChanged = this.fontSizeInputChanged.bind(this);
    this.columnUnitGroupChanged = this.columnUnitGroupChanged.bind(this);
    this.state = {
      fontFamily: '',
      fontSize: '',
      columnUnit: defaultColumnUnit,
    };
  }

  fontFamilyInputChanged(e) {
    const value = e.target.value;
    this.setState((state) => {
      const diff = { fontFamily: value };
      sendPreference(Object.assign(state, diff));
      return diff;
    });
  }

  fontSizeInputChanged(e) {
    const value = e.target.value;
    this.setState((state) => {
      const diff = { fontSize: value };
      sendPreference(Object.assign(state, diff));
      return diff;
    });
  }

  columnUnitGroupChanged(e) {
    const value = parseInt(e.target.value, 10);
    this.setState((state) => {
      const diff = { columnUnit: value };
      sendPreference(Object.assign(state, diff));
      return diff;
    });
  }

  render() {
    return (<div style={{ margin: 8 }}>
      <FormControl>
        <FormLabel component="legend">Font Family</FormLabel>
        <Input placeholder={defaultFontFamily} onChange={this.fontFamilyInputChanged} />
      </FormControl>
      <FormControl>
        <FormLabel component="legend">Font Size</FormLabel>
        <Input placeholder={`${defaultFontSize}`} onChange={this.fontSizeInputChanged} />
      </FormControl>
      <FormControl>
        <FormLabel component="legend">Column Unit</FormLabel>
        <RadioGroup
          row
          value={`${this.state.columnUnit}`}
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
