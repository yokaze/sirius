import { create } from 'jss';
import preset from 'jss-preset-default';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

const jss = create(preset());
const styles = {
  default: {
    display: 'inline-block',
    marginBottom: '2px',
    marginLeft: '16px',
    marginRight: '6px',
    marginTop: '2px',
    textAlign: 'right',
  },
};
const sheet = jss.createStyleSheet(styles, { link: true });
const classes = sheet.attach().classes;

export default class BinaryTableAddressCell extends Component {
  shouldComponentUpdate(nextProps) {
    return this.props.value !== nextProps.value;
  }

  render() {
    return <span key="span" className={classes.default}>{this.props.value}</span>;
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
  value: PropTypes.string.isRequired,
};
