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
    const values = this.props.values;
    const length = this.props.length;
    const rowAddress = this.props.address;
    const onMouseDown = this.props.onMouseDown;
    const onMouseEnter = this.props.onMouseEnter;
    const focusIndex = this.props.focusIndex;
    let selectedRange = this.props.selectedRange;
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
        address={cellAddress}
        value={value}
        focused={focused}
        selected={selected}
        onMouseDown={onMouseDown}
        onMouseEnter={onMouseEnter}
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
  address: PropTypes.number.isRequired,
  length: PropTypes.number.isRequired,
  values: PropTypes.instanceOf(Uint8Array).isRequired,
  focusIndex: PropTypes.number,
  selectedRange: PropTypes.arrayOf(PropTypes.number),
  onMouseDown: PropTypes.func.isRequired,
  onMouseEnter: PropTypes.func.isRequired,
};

BinaryTableDataRow.defaultProps = {
  focusIndex: undefined,
  selectedRange: undefined,
};
