import { create } from 'jss';
import preset from 'jss-preset-default';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

const jss = create(preset());
const styles = {
  default: {
    cursor: 'text',
    display: 'inline-block',
    paddingBottom: '2px',
    paddingLeft: '1px',
    paddingRight: '1px',
    paddingTop: '2px',
    textAlign: 'center',
  },
  focused: {
    border: '2px',
    borderColor: 'silver',
    borderStyle: 'solid',
    cursor: 'text',
    display: 'inline-block',
    marginLeft: '-1px',
    marginRight: '-1px',
    textAlign: 'center',
  },
  selected: {
    backgroundColor: 'silver',
    cursor: 'text',
    display: 'inline-block',
    paddingBottom: '2px',
    paddingLeft: '1px',
    paddingRight: '1px',
    paddingTop: '2px',
    textAlign: 'center',
  },
};
const sheet = jss.createStyleSheet(styles, { link: true });
const { classes } = sheet.attach();

export default class BinaryTableExpressionCell extends Component {
  constructor(props) {
    super(props);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseEnter = this.onMouseEnter.bind(this);
  }

  shouldComponentUpdate(nextProps) {
    const { focused, selected, value } = this.props;
    let changed = (focused !== nextProps.focused);
    changed = changed || (selected !== nextProps.selected);
    changed = changed || (value !== nextProps.value);
    return changed;
  }

  onMouseDown(e) {
    const { listener, address } = this.props;
    listener.onExpressionCellMouseDown(address, e);
  }

  onMouseEnter(e) {
    const { listener, address } = this.props;
    listener.onExpressionCellMouseEnter(address, e);
  }

  render() {
    const { focused, selected, value } = this.props;
    let className = classes.default;
    if (selected) {
      className = classes.selected;
    } else if (focused) {
      className = classes.focused;
    }
    return (
      <span
        key="span"
        className={className}
        onMouseDown={this.onMouseDown}
        onMouseEnter={this.onMouseEnter}
      >
        {value}
      </span>
    );
  }
}

BinaryTableExpressionCell.setFontFamily = (fontFamily) => {
  const entry = `${fontFamily}, monospace`;
  sheet.getRule('default').prop('font-family', entry);
  sheet.getRule('focused').prop('font-family', entry);
  sheet.getRule('selected').prop('font-family', entry);
};

BinaryTableExpressionCell.setFontSize = (fontSize) => {
  sheet.getRule('default').prop('font-size', fontSize);
  sheet.getRule('focused').prop('font-size', fontSize);
  sheet.getRule('selected').prop('font-size', fontSize);
};

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
