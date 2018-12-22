import { create } from 'jss';
import preset from 'jss-preset-default';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

const jss = create(preset());
const styles = {
  default: {
    cursor: 'default',
    paddingBottom: '2px',
    paddingLeft: '16px',
    paddingRight: '6px',
    paddingTop: '2px',
    textAlign: 'right',
  },
};
const sheet = jss.createStyleSheet(styles, { link: true });
const { classes } = sheet.attach();

export default class BinaryTableAddressCell extends Component {
  shouldComponentUpdate(nextProps) {
    const { value } = this.props;
    return value !== nextProps.value;
  }

  render() {
    const { value } = this.props;
    return <div key="div" className={classes.default}>{value}</div>;
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
