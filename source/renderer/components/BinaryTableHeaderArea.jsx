/* eslint-env browser */
import { create } from 'jss';
import preset from 'jss-preset-default';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Measure from 'react-measure';

import BinaryTableAddressCell from './BinaryTableAddressCell';
import BinaryTableHeaderRow from './BinaryTableHeaderRow';

const jss = create(preset());
const styles = {
  container: {
    backgroundColor: 'powderblue',
    borderBottom: '1px',
    borderBottomColor: 'lightsteelblue',
    borderBottomStyle: 'solid',
    display: 'inline-block',
    width: '100%',
  },
};
const sheet = jss.createStyleSheet(styles, { link: true });
const { classes } = sheet.attach();

export default class BinaryTableHeaderArea extends Component {
  constructor(props) {
    super(props);
    this.onResize = this.onResize.bind(this);
  }

  onResize(contentRect) {
    const { width, height } = contentRect.entry;
    const { listener } = this.props;
    listener.onAddressCellResized({ width, height });
  }

  render() {
    const { columnCount } = this.props;
    return (
      <span key="binary-table-header-row" className={classes.container}>
        <Measure onResize={this.onResize}>
          {({ measureRef }) => (
            <span ref={measureRef} style={{ display: 'inline-block' }} key="addressBox">
              <BinaryTableAddressCell key="address" value={'\xA0Address'} />
            </span>
          )}
        </Measure>
        <BinaryTableHeaderRow key="binary-table-header-row" columnCount={columnCount} />
      </span>
    );
  }
}

BinaryTableHeaderArea.propTypes = {
  listener: PropTypes.shape({
    onAddressCellResized: PropTypes.function,
  }).isRequired,
  columnCount: PropTypes.number.isRequired,
};
