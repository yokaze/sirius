import { create } from 'jss';
import preset from 'jss-preset-default';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { sprintf } from 'sprintf-js';

import BinaryTableAddressCell from './BinaryTableAddressCell';

const jss = create(preset());
const styles = {
  default: {
    display: 'inline-block',
  },
};
const sheet = jss.createStyleSheet(styles, { link: true });
const classes = sheet.attach().classes;

export default class BinaryTableAddressArea extends Component {
  shouldComponentUpdate(nextProps) {
    return this.props.addresses !== nextProps.addresses;
  }

  render() {
    const items = [];
    this.props.addresses.forEach((address) => {
      const text = sprintf('%08X', address);
      items.push(<BinaryTableAddressCell key={address} value={text} />);
    });
    return <div className={classes.default}>{items}</div>;
  }
}

BinaryTableAddressArea.propTypes = {
  addresses: PropTypes.instanceOf(Float64Array).isRequired,
};
