import { create } from 'jss';
import preset from 'jss-preset-default';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

const jss = create(preset());
const styles = {
  default: {
    display: 'inline-block',
    fontFamily: 'Roboto Mono, monospace',
    height: '24px',
    lineHeight: '24px',
    textAlign: 'center',
    width: '14px',
  },
  focused: {
    border: '2px',
    borderColor: 'silver',
    borderStyle: 'solid',
    display: 'inline-block',
    fontFamily: 'Roboto Mono, monospace',
    height: '20px',
    lineHeight: '20px',
    textAlign: 'center',
    width: '10px',
  },
  selected: {
    backgroundColor: 'silver',
    display: 'inline-block',
    fontFamily: 'Roboto Mono, monospace',
    height: '24px',
    lineHeight: '24px',
    textAlign: 'center',
    width: '14px',
  },
};
const sheet = jss.createStyleSheet(styles, { link: true });
const classes = sheet.attach().classes;

export default class BinaryTableExpressionCell extends Component {
  constructor(props) {
    super(props);
    BinaryTableExpressionCell.setFontSize(16);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseEnter = this.onMouseEnter.bind(this);
  }

  shouldComponentUpdate(nextProps) {
    let changed = (this.props.focused !== nextProps.focused);
    changed = changed || (this.props.selected !== nextProps.selected);
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
    let className = classes.default;
    if (this.props.selected) {
      className = classes.selected;
    } else if (this.props.focused) {
      className = classes.focused;
    }
    return (<span
      key="span"
      className={className}
      onMouseDown={this.onMouseDown}
      onMouseEnter={this.onMouseEnter}
    >{this.props.value}</span>);
  }

  static setFontSize(fontSize) {
    sheet.getRule('default').prop('font-size', fontSize);
    sheet.getRule('focused').prop('font-size', fontSize);
    sheet.getRule('selected').prop('font-size', fontSize);
  }
}

BinaryTableExpressionCell.propTypes = {
  listener: PropTypes.shape({
    onExpressionCellMouseDown: PropTypes.function,
    onExpressionCellMouseEnter: PropTypes.function,
  }).isRequired,
  address: PropTypes.number.isRequired,
  focused: PropTypes.bool.isRequired,
  selected: PropTypes.bool.isRequired,
  value: PropTypes.string.isRequired,
};
