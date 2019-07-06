/* eslint-env browser */
import { create } from 'jss';
import preset from 'jss-preset-default';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Measure from 'react-measure';
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
    const { writeMode, fileSize } = this.props;
    return (
      <Measure onResize={this.onResize}>
        {({ measureRef }) => (
          <span key="binary-table-footer-row" ref={measureRef} className={classes.container}>
            &nbsp;
            <div key="file-size" style={{ display: 'inline-block' }}>{`File\xA0Size:\xA0${fileSize}\xA0(0x${sprintf('%X', fileSize)})`}</div>
            &nbsp;|&nbsp;
            <div key="write-mode" style={{ display: 'inline-block' }}>{(writeMode === WriteMode.Insert) ? 'Insert' : 'Overwrite'}</div>
            &nbsp;|
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
  writeMode: PropTypes.number.isRequired,
  fileSize: PropTypes.number.isRequired,
};
