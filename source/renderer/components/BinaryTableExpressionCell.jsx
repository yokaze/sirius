import PropTypes from 'prop-types';
import React, { Component } from 'react';

export default class BinaryTableExpressionCell extends Component {
  shouldComponentUpdate(nextProps) {
    let changed = (this.props.selected !== nextProps.selected);
    changed = changed || (this.props.value !== nextProps.value);
    return changed;
  }

  render() {
    const className = this.props.selected ? 'binary-table-expression-selected' : 'binary-table-expression';
    return <span key="span" className={className}>{this.props.value}</span>;
  }
}

BinaryTableExpressionCell.propTypes = {
  selected: PropTypes.bool.isRequired,
  value: PropTypes.string.isRequired,
};
