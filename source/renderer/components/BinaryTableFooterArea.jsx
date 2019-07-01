/* eslint-env browser */
import { create } from 'jss';
import preset from 'jss-preset-default';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { sprintf } from 'sprintf-js';

import BinaryTableAddressCell from './BinaryTableAddressCell';
import WriteMode from '../WriteMode';

const jss = create(preset());
const styles = {
  container: {
    backgroundColor: 'powderblue',
    borderTop: '1px',
    borderTopColor: 'lightsteelblue',
    borderTopStyle: 'solid',
    bottom: '0px',
    display: 'inline-block',
    height: '24px',
    position: 'fixed',
    width: '100%',
  },
};
const sheet = jss.createStyleSheet(styles, { link: true });
const { classes } = sheet.attach();

export default class BinaryTableFooterArea extends Component {
  render() {
    const { writeMode, fileSize } = this.props;
    return (
      <span key="binary-table-footer-row" className={classes.container}>
        <span style={{ display: 'inline-block' }} key="addressBox-footer">
          <BinaryTableAddressCell key="address-footer" value={'\xA0\xA0\xA0\xA0\xA0\xA0\xA0\xA0'} />
        </span>
        <div key="write-mode" style={{ display: 'inline-block' }}>{(writeMode === WriteMode.Insert) ? 'Insert' : 'Overwrite'}</div>
        <div key="file-size" style={{ display: 'inline-block' }}>{`\xA0\xA0File\xA0Size:\xA0${fileSize}\xA0(0x${sprintf('%X', fileSize)})`}</div>
      </span>
    );
  }
}

BinaryTableFooterArea.propTypes = {
  writeMode: PropTypes.number.isRequired,
  fileSize: PropTypes.number.isRequired,
};
