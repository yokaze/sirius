import { create } from 'jss';
import preset from 'jss-preset-default';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

const jss = create(preset());
const styles = {
  default: {
    display: 'inline-block',
    fontFamily: 'Roboto Mono, monospace',
    fontSize: '16px',
    height: '24px',
    lineHeight: '24px',
    textAlign: 'center',
    width: '32px',
  },
  focused: {
    border: '2px',
    borderColor: 'silver',
    borderStyle: 'solid',
    display: 'inline-block',
    fontFamily: 'Roboto Mono, monospace',
    fontSize: '16px',
    height: '20px',
    lineHeight: '20px',
    outline: '0',
    textAlign: 'center',
    width: '28px',
  },
  selected: {
    backgroundColor: 'silver',
    display: 'inline-block',
    fontFamily: 'Roboto Mono, monospace',
    fontSize: '16px',
    height: '24px',
    lineHeight: '24px',
    outline: '0',
    textAlign: 'center',
    width: '32px',
  },
};
const sheet = jss.createStyleSheet(styles, { link: true });
const classes = sheet.attach().classes;

export default class BinaryTableDataCell extends Component {
  constructor(props) {
    super(props);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseEnter = this.handleMouseEnter.bind(this);
  }

  shouldComponentUpdate(nextProps) {
    let changed = (this.props.address !== nextProps.address);
    changed = changed || (this.props.value !== nextProps.value);
    changed = changed || (this.props.focused !== nextProps.focused);
    changed = changed || (this.props.selected !== nextProps.selected);
    return changed;
  }

  render() {
    let className = classes.default;
    if (this.props.selected) {
      className = classes.selected;
    } else if (this.props.focused) {
      className = classes.focused;
    }
    const valid = (this.props.value !== undefined);
    const text = valid ? sprintf('%02X', this.props.value) : '--';
    return (<span
      key={'span'}
      className={className}
      onMouseDown={this.handleMouseDown}
      onMouseEnter={this.handleMouseEnter}
    >{text}</span>);
  }

  handleMouseDown(e) {
    this.props.onMouseDown(this, e);
  }

  handleMouseEnter(e) {
    this.props.onMouseEnter(this, e);
  }
}

BinaryTableDataCell.propTypes = {
  address: PropTypes.number.isRequired,
  value: PropTypes.number,
  focused: PropTypes.bool.isRequired,
  selected: PropTypes.bool.isRequired,
  onMouseDown: PropTypes.func.isRequired,
  onMouseEnter: PropTypes.func.isRequired,
};