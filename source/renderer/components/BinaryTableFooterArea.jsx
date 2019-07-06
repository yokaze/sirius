/* eslint-env browser */
import { create } from 'jss';
import preset from 'jss-preset-default';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Measure from 'react-measure';
import { sprintf } from 'sprintf-js';
import Input from '@material-ui/core/Input';

import BinaryTableAddressCell from './BinaryTableAddressCell';
import FooterMode from '../FooterMode';
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
    position: 'fixed',
    width: '100%',
  },
};
const sheet = jss.createStyleSheet(styles, { link: true });
const { classes } = sheet.attach();

export default class BinaryTableFooterArea extends Component {
  constructor(props) {
    super(props);
    this.onResize = this.onResize.bind(this);
  }

  onResize(contentRect) {
    const { width, height } = contentRect.entry;
    const { listener } = this.props;
    listener.onFooterResize({ width, height });
  }

  render() {
    const { footerMode, writeMode, fileSize } = this.props;
    const items = [];
    if ((footerMode === FooterMode.Find) || (footerMode === FooterMode.Replace)) {
      items.push(
        <span style={{ display: 'inline-block' }}>
          <BinaryTableAddressCell value={'\xA0\xA0\xA0\xA0Find'} />
        </span>,
        <Input />,
        <br />,
      );
    }
    if (footerMode === FooterMode.Replace) {
      items.push(
        <span style={{ display: 'inline-block' }}>
          <BinaryTableAddressCell value={'\xA0Replace'} />
        </span>,
        <Input />,
        <br />,
      );
    }
    items.push(
      '\xA0',
      <div key="file-size" style={{ display: 'inline-block' }}>{`File\xA0Size:\xA0${fileSize}\xA0(0x${sprintf('%X', fileSize)})`}</div>,
      '\xA0|\xA0',
      <div key="write-mode" style={{ display: 'inline-block' }}>{(writeMode === WriteMode.Insert) ? 'Insert' : 'Overwrite'}</div>,
      '\xA0|',
    );
    return (
      <Measure onResize={this.onResize}>
        {({ measureRef }) => (
          <span key="binary-table-footer-row" ref={measureRef} className={classes.container}>
            {items}
          </span>
        )}
      </Measure>
    );
  }
}

BinaryTableFooterArea.setFontFamily = (fontFamily) => {
  const entry = `${fontFamily}, monospace`;
  sheet.getRule('container').prop('font-family', entry);
};

BinaryTableFooterArea.setFontSize = (fontSize) => {
  sheet.getRule('container').prop('font-size', fontSize);
};

BinaryTableFooterArea.propTypes = {
  listener: PropTypes.shape({
    onFooterResize: PropTypes.function,
  }).isRequired,
  footerMode: PropTypes.number.isRequired,
  writeMode: PropTypes.number.isRequired,
  fileSize: PropTypes.number.isRequired,
};
