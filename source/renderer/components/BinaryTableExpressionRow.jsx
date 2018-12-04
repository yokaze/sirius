import PropTypes from 'prop-types';
import React, { Component } from 'react';

import BinaryTableExpressionCell from './BinaryTableExpressionCell';

export default class BinaryTableExpressionRow extends Component {
  shouldComponentUpdate(nextProps) {
    let changed = (this.props.selectedRange.toString() !== nextProps.selectedRange.toString());
    changed = changed || nextProps.values.toString() !== this.props.values.toString();
    return changed;
  }

  render() {
    const listener = this.props.listener;
    const address = this.props.address;
    const values = this.props.values;
    const length = values.length;
    const selectedRange = this.props.selectedRange;

    const children = [];
    for (let i = 0; i < length; i += 1) {
      const value = values[i];
      let text = '';
      if (value === undefined) {
        text = '-';
      } else if (value === 32) {
        text = '\u00A0';
      } else if ((value > 32) && (value < 127)) {
        text = String.fromCharCode(value);
      } else {
        text = '.';
      }
      const selected = (selectedRange[0] <= i) && (i <= selectedRange[1]);
      children.push(<BinaryTableExpressionCell
        key={i.toString()}
        listener={listener}
        address={address + i}
        value={text}
        selected={selected}
      />);
    }
    return <span key="span">{children}</span>;
  }
}

BinaryTableExpressionRow.propTypes = {
  listener: PropTypes.shape({
    onExpressionCellMouseDown: PropTypes.function,
    onExpressionCellMouseEnter: PropTypes.function,
  }).isRequired,
  address: PropTypes.number.isRequired,
  selectedRange: PropTypes.arrayOf(PropTypes.number).isRequired,
  values: PropTypes.arrayOf(PropTypes.number).isRequired,
};
