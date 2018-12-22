import PropTypes from 'prop-types';
import React, { Component } from 'react';

import BinaryTableDataCell from './BinaryTableDataCell';

export default class BinaryTableDataRow extends Component {
  shouldComponentUpdate(nextProps) {
    if (this.props.values.length !== nextProps.values.length) {
      return true;
    }
    let changed = (this.props.address !== nextProps.address);
    changed = changed || (this.props.length !== nextProps.length);
    changed = changed || (this.props.focusIndex !== nextProps.focusIndex);
    changed = changed || (this.props.selectedRange !== nextProps.selectedRange);
    for (let i = 0; i < this.props.values.length; i += 1) {
      changed = changed || (this.props.values[i] !== nextProps.values[i]);
    }
    return changed;
  }

  render() {
    const props = this.props;
    const values = props.values;
    const length = props.length;
    const rowAddress = props.address;
    const listener = props.listener;
    const focusIndex = props.focusIndex;
    let selectedRange = props.selectedRange;
    if (selectedRange === undefined) {
      selectedRange = [0, 0];
    }

    const children = [];
    for (let i = 0; i < length; i += 1) {
      const cellAddress = rowAddress + i;
      const value = values[i];
      const focused = (i === focusIndex);
      const selected = (selectedRange[0] <= i) && (i < selectedRange[1]);
      const cell = (<BinaryTableDataCell
        key={i}
        listener={listener}
        address={cellAddress}
        value={value}
        focused={focused}
        selected={selected}
      />);
      children.push(cell);
    }
    return <span key="span">{children}</span>;
  }
}

BinaryTableDataRow.setFontFamily = (fontFamily) => {
  BinaryTableDataCell.setFontFamily(fontFamily);
};

BinaryTableDataRow.setFontSize = (fontSize) => {
  BinaryTableDataCell.setFontSize(fontSize);
};

BinaryTableDataRow.propTypes = {
  listener: PropTypes.shape({
    onDataCellMouseDown: PropTypes.function,
    onDataCellMouseEnter: PropTypes.function,
  }).isRequired,
  address: PropTypes.number.isRequired,
  length: PropTypes.number.isRequired,
  values: PropTypes.instanceOf(Uint8Array).isRequired,
  focusIndex: PropTypes.number,
  selectedRange: PropTypes.arrayOf(PropTypes.number),
};

BinaryTableDataRow.defaultProps = {
  focusIndex: undefined,
  selectedRange: undefined,
};
