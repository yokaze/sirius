import PropTypes from 'prop-types';
import React, { Component } from 'react';

import BinaryTableHeaderCell from './BinaryTableHeaderCell';

export default class BinaryTableHeaderRow extends Component {
  shouldComponentUpdate(nextProps) {
    const { columnCount } = this.props;
    return columnCount !== nextProps.columnCount;
  }

  render() {
    const { columnCount } = this.props;
    const cells = [];
    for (let i = 0; i < columnCount; i += 1) {
      let title = i.toString(16).toUpperCase();
      title = (i < 16) ? `+${title}` : title;
      cells.push(<BinaryTableHeaderCell key={i} value={title} />);
    }
    return <span key="binary-table-data-header-row">{cells}</span>;
  }
}

BinaryTableHeaderRow.setFontFamily = (fontFamily) => {
  BinaryTableHeaderCell.setFontFamily(fontFamily);
};

BinaryTableHeaderRow.setFontSize = (fontSize) => {
  BinaryTableHeaderCell.setFontSize(fontSize);
};

BinaryTableHeaderRow.propTypes = {
  columnCount: PropTypes.number.isRequired,
};
