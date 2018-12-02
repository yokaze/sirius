import { ipcRenderer, remote } from 'electron';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import Measure from 'react-measure';
import { sprintf } from 'sprintf-js';

import BinaryTableExpressionRow from './renderer/components/BinaryTableExpressionRow';
import SiriusDocument from './common/SiriusDocument';
import SiriusDocumentCommand from './common/SiriusDocumentCommand';
import SiriusIpcClient from './ipc/SiriusIpcClient';

const ipcClient = new SiriusIpcClient();

const applicationModel = remote.require('./app').Model;

const WriteMode = {
  Overwrite: 0,
  Insert: 1,
};

const whiteStyle = {
  display: 'inline-block',
  fontFamily: 'Monaco, monospace',
  fontSize: '16px',
  height: '24px',
  lineHeight: '24px',
  textAlign: 'center',
  width: '24px',
};

const containerStyle = {
  height: '100%',
  width: '100%',
};

class BinaryTableViewModel {
  constructor() {
    this.document = new SiriusDocument();
    this.focusAddress = 0;
    this.selectedRange = [0, 0];
    this.writeMode = WriteMode.Overwrite;
  }

  setListener(listener) {
    this.listener = listener;
  }

  getBuffer(address, length) {
    return this.document.getBuffer(address, length);
  }

  setValueAt(address, value) {
    const command = new SiriusDocumentCommand.Overwrite(address, [value]);
    this.document.applyCommand(command);
    ipcClient.sendDocumentCommand(command);
  }

  insertValueAt(address, value) {
    const command = new SiriusDocumentCommand.Insert(address, [value]);
    this.document.applyCommand(command);
    ipcClient.sendDocumentCommand(command);
  }

  removeValueAt(address, length) {
    const executable = ((address + length) <= this.document.getFileData().length);
    if (executable) {
      const command = new SiriusDocumentCommand.Remove(address, length);
      this.document.applyCommand(command);
      ipcClient.sendDocumentCommand(command);
    }
  }

  getFileSize() {
    return this.document.getFileData().length;
  }

  getFocusAddress() {
    return this.focusAddress;
  }

  setFocusAddress(address) {
    this.focusAddress = address;
  }

  getSelectedRange() {
    return this.selectedRange;
  }

  setSelectedRange(selectedRange) {
    this.selectedRange = selectedRange;
  }

  getWriteMode() {
    return this.writeMode;
  }

  setWriteMode(writeMode) {
    this.writeMode = writeMode;
  }

  setIpcClient(ipcClient) {
    this.ipcClient = ipcClient;
  }

  onReceivedRenewalBinary(sender, renewalBinary) {
    this.document.setFileData([...renewalBinary]);
    this.listener.onViewModelReloaded();
  }
}

class BinaryTableRow extends Component {
  shouldComponentUpdate(nextProps) {
    return this.props.address !== nextProps.address;
  }

  render() {
    const address = this.props.address;
    const text = sprintf('%08X', address);
    return <span key={'BinaryTableRow:span:' + address} className="binary-table-address">{text}</span>;
  }
}

class BinaryTableDataHeaderRow extends Component {
  shouldComponentUpdate(nextProps) {
    return false;
  }

  render() {
    const cells = [];
    for (let i = 0; i < this.props.columnCount; i += 1) {
      let title = i.toString(16).toUpperCase();
      title = (i < 16) ? ('+' + title) : title;
      cells.push(<li key={i}>{title}</li>);
    }
    return <span key="binary-table-data-header-row" className="binary-table-data-header-row">{cells}</span>;
  }
}

class BinaryTableDataCell extends Component {
  constructor(props) {
    super(props);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseEnter = this.handleMouseEnter.bind(this);
  }

  shouldComponentUpdate(nextProps) {
    let changed = (this.props.address !== nextProps.address);
    changed = changed || (this.props.value !== nextProps.value);
    changed = changed || (this.props.selected !== nextProps.selected);
    changed = changed || (this.props.inputRef !== nextProps.inputRef);
    return changed;
  }

  render() {
    const valid = (this.props.value !== undefined);
    const text = valid ? sprintf('%02X', this.props.value) : '--';
    return (<span
      ref={this.props.inputRef}
      key={'span'}
      className={this.props.selected ? "binary-table-data-cell-selected" : "binary-table-cell"}
      tabIndex={this.props.address}
      onKeyDown={this.handleKeyDown}
      onMouseDown={this.handleMouseDown}
      onMouseEnter={this.handleMouseEnter}
    >{text}</span>);
  }

  handleKeyDown(e) {
    this.props.onKeyDown(e);
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
  onKeyDown: PropTypes.func.isRequired,
  onMouseDown: PropTypes.func.isRequired,
};

class BinaryTableDataRow extends Component {
  shouldComponentUpdate(nextProps) {
    if (this.props.values.length !== nextProps.values.length) {
      return true;
    }
    let changed = (this.props.address !== nextProps.address);
    changed = changed || (this.props.selectedIndex !== nextProps.selectedIndex);
    changed = changed || (this.props.selectedRange[0] !== nextProps.selectedRange[0]);
    changed = changed || (this.props.selectedRange[1] !== nextProps.selectedRange[1]);
    for (let i = 0; i < this.props.values.length; i += 1) {
      changed = changed || (this.props.values[i] !== nextProps.values[i]);
    }
    return changed;
  }

  render() {
    const values = this.props.values;
    const length = values.length;
    const rowAddress = this.props.address;
    const selectedIndex = this.props.selectedIndex;

    const children = [];
    for (let i = 0; i < length; i += 1) {
      const cellAddress = rowAddress + i;
      const value = values[i];
      const selected = (this.props.selectedRange[0] <= i) && (i <= this.props.selectedRange[1]);
      const reference = (i === selectedIndex) ? this.props.inputRef : undefined;
      const cell = (<BinaryTableDataCell
        inputRef={reference}
        key={'BinaryTableCell:' + i}
        address={cellAddress}
        value={value}
        selected={selected}
        onKeyDown={this.props.onKeyDown}
        onMouseDown={this.props.onMouseDown}
        onMouseEnter={this.props.onMouseEnter}
      />);
      children.push(cell);
    }
    return <span key="span">{children}</span>;
  }
}

BinaryTableDataRow.propTypes = {
  address: PropTypes.number.isRequired,
  values: PropTypes.arrayOf(PropTypes.number).isRequired,
  selectedIndex: PropTypes.number.isRequired,
  onKeyDown: PropTypes.func.isRequired,
  onMouseDown: PropTypes.func.isRequired,
};

class BinaryTable extends Component {
  constructor(props) {
    super(props);
    this.props.viewModel.setListener(this);
    this.state = {
      row: 0,
      floatRow: 0,
      startAddress: 0,
      focusAddress: 64,
      columnCount: 16,
    };
    this.containerReference = React.createRef();
    this.reference = React.createRef();
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseEnter = this.handleMouseEnter.bind(this);
    this.handleWheel = this.handleWheel.bind(this);
  }

  componentDidUpdate() {
    if (this.reference.current !== null) {
      this.reference.current.focus();
    }
  }

  render() {
    const items = [];
    if (this.state.rowCount !== undefined) {
      const columnCount = this.state.columnCount;
      items.push(<span key="binary-table-header-row" className="binary-table-header-row">
        <span key="address" className="binary-table-address">&ensp;Address</span>
        <BinaryTableDataHeaderRow key="binary-table-data-header-row" columnCount={columnCount} />
      </span>);
      items.push(<br key="br-head" />);
      const viewModel = this.props.viewModel;
      const focusedAddress = viewModel.getFocusAddress();
      const selectedRange = viewModel.getSelectedRange();
      for (let j = 0; j < this.state.rowCount; j += 1) {
        const rowAddress = (j + this.state.row) * columnCount;
        const rowIndex = Math.floor(rowAddress / columnCount);
        const row = <BinaryTableRow key={'BinaryTableRow:' + (rowIndex % this.state.rowCount)} address={rowAddress} />;
        items.push(row);

        const values = viewModel.getBuffer(rowAddress, columnCount);
        let selectedIndex = (focusedAddress - rowAddress);
        if (selectedIndex < 0) {
          selectedIndex = -1;
        } else if (selectedIndex >= columnCount) {
          selectedIndex = -1;
        }
        const rowSelectedRange = [ selectedRange[0] - rowAddress, selectedRange[1] - rowAddress];
        items.push(<BinaryTableDataRow
          key={'DataRow:' + (rowIndex % this.state.rowCount)}
          inputRef={this.reference}
          values={values}
          address={rowAddress}
          selectedIndex={selectedIndex}
          selectedRange={rowSelectedRange}
          onKeyDown={this.handleKeyDown}
          onMouseDown={this.handleMouseDown}
          onMouseEnter={this.handleMouseEnter}
        />);
        items.push(<span key={'white:' + rowAddress} style={whiteStyle}>&ensp;</span>);
        items.push(<BinaryTableExpressionRow key={'ExpressionRow:' + (rowIndex % this.state.rowCount)} values={values} selectedIndex={selectedIndex} />);
        items.push(<br key={'br' + rowAddress} />);
      }
      items.push(<div key={'write-mode'}>{(this.props.viewModel.getWriteMode() === WriteMode.Insert) ? 'Insert' : 'Overwrite'}</div>);
    }
    return (<Measure onResize={contentRect => { this.onResized(contentRect); }}>
      {({ measureRef }) =>
        <div ref={measureRef} className="binary-table" style={containerStyle} onWheel={this.handleWheel}>{items}</div>
      }
    </Measure>);
  }

  handleKeyDown(e) {
    const keyCode = e.keyCode;
    const handler = (state, props) => {
      const viewModel = this.props.viewModel;
      const handleTypeHex = (value) => {
        if (viewModel.getWriteMode() === WriteMode.Overwrite) {
          viewModel.setValueAt(viewModel.getFocusAddress(), value);
        } else {
          viewModel.insertValueAt(viewModel.getFocusAddress(), value);
        }
      };

      const columnCount = state.columnCount;
      const displayAddress = 0;
      let addressMove = 0;
      if ((keyCode >= 48) && (keyCode <= 57)) {
        handleTypeHex(keyCode - 48);
        addressMove = 1;
      } else if ((keyCode >= 65) && (keyCode <= 70)) {
        handleTypeHex(keyCode - 55);
        addressMove = 1;
      }
      const selectedRange = viewModel.getSelectedRange();
      switch (keyCode) {
        case 8: // Delete
        {
          if (selectedRange[0] === selectedRange[1]) {
            if (selectedRange[0] >= 1) {
              viewModel.removeValueAt(selectedRange[0] - 1, 1);
              viewModel.setSelectedRange([selectedRange[0] - 1, selectedRange[0] - 1]);
              addressMove = -1;
            }
          } else {
            viewModel.removeValueAt(selectedRange[0], selectedRange[1] - selectedRange[0] + 1);
            viewModel.setSelectedRange([selectedRange[0], selectedRange[0]]);
            return { };
          }
          break;
        }
        case 37: // Left
        {
          const address = selectedRange[0] - 1;
          viewModel.setSelectedRange([address, address]);
          addressMove = -1;
          break;
        }
        case 38: // Up
        {
          const address = selectedRange[0] - columnCount;
          viewModel.setSelectedRange([address, address]);
          addressMove = -columnCount;
          break;
        }
        case 39: // Right
        {
          const address = selectedRange[1] + 1;
          viewModel.setSelectedRange([address, address]);
          addressMove = 1;
          break;
        }
        case 40: // Down
        {
          const address = selectedRange[1] + columnCount;
          viewModel.setSelectedRange([address, address]);
          addressMove = columnCount;
          break;
        }
        case 73: // i
          viewModel.setWriteMode(1 - viewModel.getWriteMode());
          break;
        default:
          console.log(keyCode);
          break;
      }
      const fileSize = viewModel.getFileSize();
      const maxAddress = Math.floor((fileSize - 1) / columnCount) * columnCount;
      const nextFocusAddress = Math.max(0, viewModel.getFocusAddress() + addressMove);
      viewModel.setFocusAddress(nextFocusAddress);
      let nextAddress = state.startAddress;
      if (nextFocusAddress < nextAddress) {
        nextAddress -= Math.ceil((nextAddress - nextFocusAddress) / columnCount) * columnCount;
      } else if ((nextAddress + (this.state.rowCount * columnCount)) <= nextFocusAddress) {
        nextAddress += (Math.floor((nextFocusAddress - nextAddress) / columnCount) - (this.state.rowCount - 1)) * columnCount;
      }
      return { startAddress: nextAddress };
    };
    this.setState(handler);
  }

  handleMouseDown(sender, e) {
    const handler = () => {
      const address = sender.props.address;
      this.props.viewModel.setFocusAddress(address);
      this.props.viewModel.setSelectedRange([address, address]);
      return { mouseDownAddress: address };
    };
    this.setState(handler);
  }

  handleMouseEnter(sender, e) {
    const buttons = e.buttons;
    const handler = () => {
      if (buttons === 1) {
        const mouseDownAddress = this.state.mouseDownAddress ? this.state.mouseDownAddress : 0;
        const startAddress = Math.min(mouseDownAddress, sender.props.address);
        const endAddress = Math.max(mouseDownAddress, sender.props.address);
        this.props.viewModel.setSelectedRange([startAddress, endAddress]);
      }
      return { };
    };
    this.setState(handler);
  }

  handleWheel(e) {
    const deltaRow = e.deltaY / 24;
    this.setState((state, props) => {
      let nextFloatRow = BinaryTable.limitRowNumber(state.floatRow + deltaRow, props.viewModel.getFileSize());
      return {
        floatRow: nextFloatRow,
        row: Math.floor(state.floatRow),
      };
    });
  }

  onResized(contentRect) {
    const rowCount = Math.floor((contentRect.entry.height / 24) - 3);
    if (this.state.rowCount !== rowCount) {
      this.setState({ rowCount });
    }
  }

  onViewModelReloaded() {
    this.forceUpdate();
  }

  static limitRowNumber(row, fileSize) {
    const maxRow = Math.max(0, Math.floor(fileSize - 1) / 16);
    row = Math.max(0, row);
    return Math.min(row, maxRow);
  }
}

const tableViewModel = new BinaryTableViewModel();
tableViewModel.setIpcClient(ipcClient);
ipcClient.setListener(tableViewModel);
ipcRenderer.send('editor-initialized');

ReactDOM.render(
  <BinaryTable viewModel={tableViewModel} />,
  document.getElementById('root'),
);
