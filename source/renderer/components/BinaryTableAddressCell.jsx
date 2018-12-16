import { create } from 'jss';
import preset from 'jss-preset-default';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { sprintf } from 'sprintf-js';

const jss = create(preset());
const styles = {
  default: {
    display: 'inline-block',
    height: '24px',
    lineHeight: '24px',
    marginLeft: '16px',
    marginRight: '6px',
    textAlign: 'right',
  },
};
const sheet = jss.createStyleSheet(styles, { link: true });
const classes = sheet.attach().classes;

export default class BinaryTableAddressCell extends Component {
  shouldComponentUpdate(nextProps) {
    return this.props.address !== nextProps.address;
  }

  render() {
    const address = this.props.address;
    const text = sprintf('%08X', address);
    return <span key="span" className={classes.default}>{text}</span>;
  }
}

BinaryTableAddressCell.setFontFamily = (fontFamily) => {
  const entry = `${fontFamily}, monospace`;
  sheet.getRule('default').prop('font-family', entry);
};

BinaryTableAddressCell.setFontSize = (fontSize) => {
  sheet.getRule('default').prop('font-size', fontSize);
};

BinaryTableAddressCell.propTypes = {
  address: PropTypes.number.isRequired,
};
