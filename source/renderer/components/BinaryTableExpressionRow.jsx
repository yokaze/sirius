import assert from 'assert';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import BinaryTableExpressionCell from './BinaryTableExpressionCell';

export default class BinaryTableExpressionRow extends Component {
  shouldComponentUpdate(nextProps) {
    let changed = (this.props.selectedIndex !== nextProps.selectedIndex);
    changed = changed || nextProps.values.toString() !== this.props.values.toString();
    return changed;
  }

  render() {
    const values = this.props.values;
    const length = values.length;
    const selectedIndex = this.props.selectedIndex;
    assert((selectedIndex >= -1) && (selectedIndex < length));

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
      const selected = (i === selectedIndex);
      children.push(<BinaryTableExpressionCell
        key={i.toString()}
        value={text}
        selected={selected}
      />);
    }
    return <span key="span">{children}</span>;
  }
}

BinaryTableExpressionRow.propTypes = {
  selectedIndex: PropTypes.number.isRequired,
  values: PropTypes.arrayOf(PropTypes.number).isRequired,
};
