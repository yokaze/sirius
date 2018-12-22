import PropTypes from 'prop-types';
import React, { Component } from 'react';

import BinaryTableDataCell from './BinaryTableDataCell';

export default class BinaryTableDataRow extends Component {
  shouldComponentUpdate(nextProps) {
    const {
      address, length, values, focusIndex, selectedRange,
    } = this.props;
    if (values.length !== nextProps.values.length) {
      return true;
    }
    let changed = (address !== nextProps.address);
    changed = changed || (length !== nextProps.length);
    changed = changed || (focusIndex !== nextProps.focusIndex);
    changed = changed || (selectedRange !== nextProps.selectedRange);
    for (let i = 0; i < values.length; i += 1) {
      changed = changed || (values[i] !== nextProps.values[i]);
    }
    return changed;
  }

  render() {
    const {
      listener, length, values, focusIndex, measured,
    } = this.props;
    const { address: rowAddress } = this.props;
    let { selectedRange } = this.props;
    if (selectedRange === undefined) {
      selectedRange = [0, 0];
    }

    const children = [];
    for (let i = 0; i < length; i += 1) {
      const cellAddress = rowAddress + i;
      const cellMesaured = measured && (i === 0);
      const value = values[i];
      const focused = (i === focusIndex);
      const selected = (selectedRange[0] <= i) && (i < selectedRange[1]);
      const cell = (
        <BinaryTableDataCell
          key={i}
          listener={listener}
          address={cellAddress}
          value={value}
          focused={focused}
          selected={selected}
          measured={cellMesaured}
        />
      );
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
  measured: PropTypes.bool.isRequired,
};

BinaryTableDataRow.defaultProps = {
  focusIndex: undefined,
  selectedRange: undefined,
};
