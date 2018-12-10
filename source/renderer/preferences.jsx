import { remote } from 'electron';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormLabel from '@material-ui/core/FormLabel';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';

const appConsole = remote.getGlobal('console');

class PreferencesView extends Component {
  render() {
    return <div style={{margin: 8}}>
      <FormLabel component="legend">Number of Rows in Unit</FormLabel>
      <RadioGroup row={true} value='16'>
        <FormControlLabel value='1' control={<Radio />} label="1" />
        <FormControlLabel value='2' control={<Radio />} label="2" />
        <FormControlLabel value='4' control={<Radio />} label="4" />
        <FormControlLabel value='8' control={<Radio />} label="8" />
        <FormControlLabel value='16' control={<Radio />} label="16" />
      </RadioGroup>
    </div>;
  }
};

ReactDOM.render(
  <PreferencesView />,
  document.getElementById('root'),
);
