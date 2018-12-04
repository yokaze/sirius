import PropTypes from 'prop-types';
import React, { Component } from 'react';

export default class BinaryTableExpressionCell extends Component {
  constructor(props) {
    super(props);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseEnter = this.onMouseEnter.bind(this);
  }

  shouldComponentUpdate(nextProps) {
    let changed = (this.props.selected !== nextProps.selected);
    changed = changed || (this.props.value !== nextProps.value);
    return changed;
  }

  onMouseDown(e) {
    this.props.listener.onExpressionCellMouseDown(this.props.address, e);
  }

  onMouseEnter(e) {
    this.props.listener.onExpressionCellMouseEnter(this.props.address, e);
  }

  render() {
    const className = this.props.selected ? 'binary-table-expression-selected' : 'binary-table-expression';
    return (<span
      key="span"
      className={className}
      onMouseDown={this.onMouseDown}
      onMouseEnter={this.onMouseEnter}
    >{this.props.value}</span>);
  }
}

BinaryTableExpressionCell.propTypes = {
  listener: PropTypes.shape({
    onExpressionCellMouseDown: PropTypes.function,
    onExpressionCellMouseEnter: PropTypes.function,
  }).isRequired,
  address: PropTypes.number.isRequired,
  selected: PropTypes.bool.isRequired,
  value: PropTypes.string.isRequired,
};
