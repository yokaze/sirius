import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { sprintf } from 'sprintf-js';

export default class BinaryTableAddressCell extends Component {
  shouldComponentUpdate(nextProps) {
    return this.props.address !== nextProps.address;
  }

  render() {
    const address = this.props.address;
    const text = sprintf('%08X', address);
    return <span key={'BinaryTableAddressCell:span:' + address} className="binary-table-address">{text}</span>;
  }
}

BinaryTableAddressCell.propTypes = {
  address: PropTypes.number.isRequired,
};
