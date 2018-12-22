import { create } from 'jss';
import preset from 'jss-preset-default';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

const jss = create(preset());
const styles = {
  default: {
    cursor: 'default',
    display: 'inline-block',
    fontFamily: 'Roboto Mono, monospace',
    fontSize: '16px',
    marginBottom: '2px',
    marginLeft: '5px',
    marginRight: '5px',
    marginTop: '2px',
    textAlign: 'center',
  },
};
const sheet = jss.createStyleSheet(styles, { link: true });
const { classes } = sheet.attach();

export default class BinaryTableHeaderCell extends Component {
  shouldComponentUpdate(nextProps) {
    const { value } = this.props;
    return (value !== nextProps.value);
  }

  render() {
    const { value } = this.props;
    return <span key="span" className={classes.default}>{value}</span>;
  }
}

BinaryTableHeaderCell.setFontFamily = (fontFamily) => {
  const entry = `${fontFamily}, monospace`;
  sheet.getRule('default').prop('font-family', entry);
};

BinaryTableHeaderCell.setFontSize = (fontSize) => {
  sheet.getRule('default').prop('font-size', fontSize);
};

BinaryTableHeaderCell.propTypes = {
  value: PropTypes.string.isRequired,
};
