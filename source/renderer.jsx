import assert from 'assert';
import { ipcRenderer, remote } from 'electron';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import Measure from 'react-measure';
import { sprintf } from 'sprintf-js';

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
    this.fileData = [];
    this.focusAddress = 0;
    this.writeMode = WriteMode.Overwrite;
  }

  setListener(listener) {
    this.listener = listener;
  }

  getValueAt(address) {
    return this.fileData[address];
  }

  setValueAt(address, value) {
    while (this.getFileSize() <= address) {
      this.fileData.push(0);
    }
    this.fileData[address] = value;
  }

  insertValueAt(address, value) {
    this.fileData.splice(address, 0, value);
    ipcClient.sendDocumentCommand(new SiriusDocumentCommand.Insert(address, [value]));
  }

  removeValueAt(address) {
    this.fileData.splice(address, 1);
  }

  getFileSize() {
    return this.fileData.length;
  }

  getFocusAddress() {
    return this.focusAddress;
  }

  setFocusAddress(address) {
    this.focusAddress = address;
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
    this.fileData = [...renewalBinary];
    this.listener.onViewModelReloaded();
  }
}

class BinaryTableRow extends Component {
  render() {
    const address = this.props.address;
    const text = sprintf('%08X', address);
    return <span key={'BinaryTableRow:span:' + address} className='binary-table-address'>{text}</span>;
  }
}

class BinaryTableCell extends Component {
  constructor(props) {
    super(props);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
  }

  render() {
    const address = this.props.address;
    const text = this.props.valid ? sprintf('%02X', this.props.value) : '--';
    return <span ref={this.props.inputRef} key={'span'} className='binary-table-cell' tabIndex={this.props.address} onKeyDown={this.handleKeyDown} onMouseDown={this.handleMouseDown}>{text}</span>;
  }

  handleKeyDown(e) {
    this.props.handleKeyDown(e);
  }

  handleMouseDown(e) {
    this.props.handleMouseDown(this, e);
  }
}

class BinaryTableExpressionCell extends Component {
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

class BinaryTableExpressionRow extends Component {
  shouldComponentUpdate(nextProps) {
    let changed = (this.props.selectedIndex !== nextProps.selectedIndex);
    changed = changed || nextProps.values.toString() !== this.props.values.toString();
    return changed;
  }

  render() {
    const selectedIndex = this.props.selectedIndex;
    const values = this.props.values;
    const length = values.length;
    assert((selectedIndex >= -1) && (selectedIndex < length));

    const children = [];
    for (let i = 0; i < length; i += 1) {
      const value = values[i];
      let text = '';
      if (value === undefined) {
        text = '-';
      } else if (value === 32) {
        text = '\u00A0';
      } else if ((value > 32) && (value < 127)) {
        text = String.fromCharCode(value);
      } else {
        text = '.';
      }
      const selected = (i === selectedIndex);
      children.push(<BinaryTableExpressionCell
        key={i.toString()}
        value={text}
        selected={selected}
      />);
    }
    return <span key="span">{children}</span>;
  }
}

BinaryTableExpressionRow.propTypes = {
  selectedIndex: PropTypes.number.isRequired,
  values: PropTypes.arrayOf(PropTypes.number).isRequired,
};

class BinaryTable extends Component {
  constructor(props) {
    super(props);
    this.props.viewModel.setListener(this);
    this.state = {
      startAddress: 0,
      focusAddress: 64,
      columnCount: 16,
    };
    this.containerReference = React.createRef();
    this.reference = React.createRef();
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
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
      items.push(<span key="address" className='binary-table-address'>Address</span>);
      for (let i = 0; i < columnCount; i += 1) {
        let title = i.toString(16).toUpperCase();
        title = (i < 16) ? ('+' + title) : title;
        items.push(<span key={i} className='binary-table-cell'>{title}</span>);
      }
      items.push(<br key="br-head" />);
      const viewModel = this.props.viewModel;
      const fileSize = viewModel.getFileSize();
      const focusedAddress = viewModel.getFocusAddress();
      for (let j = 0; j < this.state.rowCount; j += 1) {
        const rowAddress = this.state.startAddress + (j * columnCount);
        const row = <BinaryTableRow key={'BinaryTableRow:' + rowAddress} address={rowAddress} />;
        items.push(row);
        for (let i = 0; i < columnCount; i += 1) {
          const cellAddress = rowAddress + i;
          const valid = (cellAddress < fileSize);
          const value = valid ? viewModel.getValueAt(cellAddress) : 0;
          const reference = (cellAddress === focusedAddress) ? this.reference : undefined;
          const cell = <BinaryTableCell
            inputRef={reference}
            key={'BinaryTableCell:' + cellAddress}
            address={cellAddress}
            value={value}
            valid={valid}
            handleKeyDown={this.handleKeyDown}
            handleMouseDown={this.handleMouseDown} />;
          items.push(cell);
        }
        items.push(<span key={'white:' + rowAddress} style={whiteStyle}>&ensp;</span>);
        {
          const values = [];
          for (let i = 0; i < columnCount; i+= 1) {
            const cellAddress = rowAddress + i;
            const valid = (cellAddress < fileSize);
            const value = valid ? viewModel.getValueAt(cellAddress) : undefined;
            values.push(value);
          }
          let selectedIndex = (focusedAddress - rowAddress);
          if (selectedIndex < 0) {
            selectedIndex = -1;
          } else if (selectedIndex >= columnCount) {
            selectedIndex = -1;
          }
          items.push(<BinaryTableExpressionRow key={'row:' + rowAddress} values={values} selectedIndex={selectedIndex} />);
        }
        items.push(<br key={'br' + j} />);
      }
      items.push(<div key={'write-mode'}>{(this.props.viewModel.getWriteMode() === WriteMode.Insert) ? 'Insert' : 'Overwrite'}</div>);
    }
    return <Measure onResize={contentRect => { this.onResized(contentRect); }}>
      {({ measureRef }) =>
        <div ref={measureRef} className="binary-table" style={containerStyle}>{items}</div>
      }
    </Measure>;
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
      let addressMove = 0;
      if ((keyCode >= 48) && (keyCode <= 57)) {
        handleTypeHex(keyCode - 48);
        addressMove = 1;
      } else if ((keyCode >= 65) && (keyCode <= 70)) {
        handleTypeHex(keyCode - 55);
        addressMove = 1;
      }
      switch (keyCode) {
        case 8: // Delete
        {
          const focusAddress = viewModel.getFocusAddress();
          if (focusAddress >= 1) {
            viewModel.removeValueAt(focusAddress - 1);
            addressMove = -1;
          }
          break;
        }
        case 37: // Left
          addressMove = -1;
          break;
        case 38: // Up
          addressMove = -columnCount;
          break;
        case 39: // Right
          addressMove = 1;
          break;
        case 40: // Down
          addressMove = columnCount;
          break;
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
      this.props.viewModel.setFocusAddress(sender.props.address);
      return { };
    };
    this.setState(handler);
  }

  onResized(contentRect) {
    const rowCount = Math.floor(contentRect.entry.height / 24 - 3);
    if (this.state.rowCount !== rowCount) {
      this.setState({ rowCount });
    }
  }

  onViewModelReloaded() {
    this.forceUpdate();
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
