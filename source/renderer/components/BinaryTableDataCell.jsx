import { create } from 'jss';
import preset from 'jss-preset-default';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Measure from 'react-measure';
import { sprintf } from 'sprintf-js';

const jss = create(preset());
const styles = {
  default: {
    display: 'inline-block',
    paddingBottom: '2px',
    paddingLeft: '5px',
    paddingRight: '5px',
    paddingTop: '2px',
    textAlign: 'center',
  },
  focused: {
    border: '2px',
    borderColor: 'silver',
    borderStyle: 'solid',
    display: 'inline-block',
    paddingLeft: '3px',
    paddingRight: '3px',
    outline: '0',
    textAlign: 'center',
  },
  selected: {
    backgroundColor: 'silver',
    display: 'inline-block',
    paddingBottom: '2px',
    paddingLeft: '5px',
    paddingRight: '5px',
    paddingTop: '2px',
    outline: '0',
    textAlign: 'center',
  },
};
const sheet = jss.createStyleSheet(styles, { link: true });
const { classes } = sheet.attach();

export default class BinaryTableDataCell extends Component {
  constructor(props) {
    super(props);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseEnter = this.handleMouseEnter.bind(this);
    this.handleResize = this.handleResize.bind(this);
  }

  shouldComponentUpdate(nextProps) {
    const {
      address, value, focused, selected,
    } = this.props;
    let changed = (address !== nextProps.address);
    changed = changed || (value !== nextProps.value);
    changed = changed || (focused !== nextProps.focused);
    changed = changed || (selected !== nextProps.selected);
    return changed;
  }

  handleMouseDown(e) {
    const { listener, address } = this.props;
    listener.onDataCellMouseDown(address, e);
  }

  handleMouseEnter(e) {
    const { listener, address } = this.props;
    listener.onDataCellMouseEnter(address, e);
  }

  handleResize(contentRect) {
    const { width, height } = contentRect.entry;
    const { listener } = this.props;
    listener.onDataCellResized({ width, height });
  }

  render() {
    const {
      value, focused, selected, measured,
    } = this.props;
    let className = classes.default;
    if (selected) {
      className = classes.selected;
    } else if (focused) {
      className = classes.focused;
    }
    const valid = (value !== undefined);
    const text = valid ? sprintf('%02X', value) : '--';
    if (measured) {
      return (
        <Measure onResize={this.handleResize}>
          {({ measureRef }) => (
            <span ref={measureRef} style={{ display: 'inline-block' }}>
              <span
                key="span"
                className={className}
                onMouseDown={this.handleMouseDown}
                onMouseEnter={this.handleMouseEnter}
              >
                {text}
              </span>
            </span>
          )
        }
        </Measure>
      );
    }
    return (
      <span
        key="span"
        className={className}
        onMouseDown={this.handleMouseDown}
        onMouseEnter={this.handleMouseEnter}
      >
        {text}
      </span>
    );
  }
}

BinaryTableDataCell.setFontFamily = (fontFamily) => {
  const entry = `${fontFamily}, monospace`;
  sheet.getRule('default').prop('font-family', entry);
  sheet.getRule('focused').prop('font-family', entry);
  sheet.getRule('selected').prop('font-family', entry);
};

BinaryTableDataCell.setFontSize = (fontSize) => {
  sheet.getRule('default').prop('font-size', fontSize);
  sheet.getRule('focused').prop('font-size', fontSize);
  sheet.getRule('selected').prop('font-size', fontSize);
};

BinaryTableDataCell.propTypes = {
  listener: PropTypes.shape({
    onDataCellResized: PropTypes.function,
    onDataCellMouseDown: PropTypes.function,
    onDataCellMouseEnter: PropTypes.function,
  }).isRequired,
  address: PropTypes.number.isRequired,
  value: PropTypes.number,
  focused: PropTypes.bool.isRequired,
  selected: PropTypes.bool.isRequired,
  measured: PropTypes.bool.isRequired,
};

BinaryTableDataCell.defaultProps = {
  value: undefined,
};
