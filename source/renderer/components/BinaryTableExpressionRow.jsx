import PropTypes from 'prop-types';
import React, { Component } from 'react';

import BinaryTableExpressionCell from './BinaryTableExpressionCell';

export default class BinaryTableExpressionRow extends Component {
  shouldComponentUpdate(nextProps) {
    let changed = this.props.focusIndex !== nextProps.focusIndex;
    changed = changed || (this.props.selectedRange !== nextProps.selectedRange);
    changed = changed || (nextProps.values !== this.props.values);
    return changed;
  }

  render() {
    const listener = this.props.listener;
    const address = this.props.address;
    const values = this.props.values;
    const length = values.length;
    const focusIndex = this.props.focusIndex;
    let selectedRange = this.props.selectedRange;
    if (selectedRange === undefined) {
      selectedRange = [0, 0];
    }

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
      const focused = (i === focusIndex);
      const selected = (selectedRange[0] <= i) && (i < selectedRange[1]);
      children.push(<BinaryTableExpressionCell
        key={i.toString()}
        listener={listener}
        address={address + i}
        value={text}
        focused={focused}
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
  focusIndex: PropTypes.number,
  selectedRange: PropTypes.arrayOf(PropTypes.number),
  values: PropTypes.arrayOf(PropTypes.number).isRequired,
};

BinaryTableExpressionRow.defaultProps = {
  focusIndex: undefined,
  selectedRange: undefined,
};
