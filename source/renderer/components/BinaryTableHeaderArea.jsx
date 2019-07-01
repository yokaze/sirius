/* eslint-env browser */
import Measure from 'react-measure';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import BinaryTableAddressCell from './BinaryTableAddressCell';
import BinaryTableHeaderRow from './BinaryTableHeaderRow';

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
      <span key="binary-table-header-row" className="binary-table-header-row">
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
