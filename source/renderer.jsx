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
    this.selectionStartAddress = 0;
    this.selectionEndAddress = 0;
    this.writeMode = WriteMode.Overwrite;
    this.isEditing = false;
    this.editValue = 0;
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

  processCharacter(value) {
    const selected = this.selectionStartAddress;
    if (this.isEditing) {
      const b = this.editValue + value;
      this.isEditing = false;
      this.editValue = 0;
      this.selectionStartAddress = selected + 1;
      this.selectionEndAddress = selected + 1;

      if (this.writeMode === WriteMode.Overwrite) {
        this.setValueAt(selected, b);
      } else {
        this.insertValueAt(selected, b);
      }
    }
    else {
      this.isEditing = true;
      this.editValue = value << 4;
    }
  }

  getFileSize() {
    return this.document.getFileData().length;
  }

  getSelectedRange() {
    const left = Math.min(this.selectionStartAddress, this.selectionEndAddress);
    const right = Math.max(this.selectionStartAddress, this.selectionEndAddress);
    return [left, right];
  }

  getSelectionStartAddress() {
    return this.selectionStartAddress;
  }

  setSelectionStartAddress(address) {
    this.selectionStartAddress = address;
  }

  getSelectionEndAddress() {
    return this.selectionEndAddress;
  }

  setSelectionEndAddress(address) {
    this.selectionEndAddress = address;
  }

  getWriteMode() {
    return this.writeMode;
  }

  setWriteMode(writeMode) {
    this.writeMode = writeMode;
  }

  isEditing() {
    return this.isEditing;
  }

  setIpcClient(ipcClient) {
    this.ipcClient = ipcClient;
  }

  onReceivedRenewalBinary(sender, renewalBinary) {
    this.document.setFileData([...renewalBinary]);
    this.listener.onViewModelReloaded();
  }

  onAppUpdatePreference(sender, preference) {
    console.log(preference);
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

BinaryTableRow.propTypes = {
  address: PropTypes.number.isRequired,
};

class BinaryTableDataHeaderRow extends Component {
  shouldComponentUpdate(nextProps) {
    return this.props.columnCount !== nextProps.columnCount;
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

BinaryTableDataHeaderRow.propTypes = {
  columnCount: PropTypes.number.isRequired,
};

class BinaryTableDataCell extends Component {
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
    let className = 'binary-table-cell';
    if (this.props.selected) {
      className = 'binary-table-data-cell-selected';
    } else if (this.props.focused) {
      className = 'binary-table-data-cell-focused';
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
  value: PropTypes.number.isRequired,
  focused: PropTypes.bool.isRequired,
  selected: PropTypes.bool.isRequired,
  onMouseDown: PropTypes.func.isRequired,
  onMouseEnter: PropTypes.func.isRequired,
};

class BinaryTableDataRow extends Component {
  shouldComponentUpdate(nextProps) {
    if (this.props.values.length !== nextProps.values.length) {
      return true;
    }
    let changed = (this.props.address !== nextProps.address);
    changed = changed || (this.props.focusIndex !== nextProps.focusIndex);
    changed = changed || (this.props.selectedRange !== nextProps.selectedRange);
    for (let i = 0; i < this.props.values.length; i += 1) {
      changed = changed || (this.props.values[i] !== nextProps.values[i]);
    }
    return changed;
  }

  render() {
    const values = this.props.values;
    const length = values.length;
    const rowAddress = this.props.address;
    const onMouseDown = this.props.onMouseDown;
    const onMouseEnter = this.props.onMouseEnter;
    const focusIndex = this.props.focusIndex;
    let selectedRange = this.props.selectedRange;
    if (selectedRange === undefined) {
      selectedRange = [0, 0];
    }

    const children = [];
    for (let i = 0; i < length; i += 1) {
      const cellAddress = rowAddress + i;
      const value = values[i];
      const focused = (i === focusIndex);
      const selected = (selectedRange[0] <= i) && (i < selectedRange[1]);
      const cell = (<BinaryTableDataCell
        key={'BinaryTableCell:' + i}
        address={cellAddress}
        value={value}
        focused={focused}
        selected={selected}
        onMouseDown={onMouseDown}
        onMouseEnter={onMouseEnter}
      />);
      children.push(cell);
    }
    return <span key="span">{children}</span>;
  }
}

BinaryTableDataRow.propTypes = {
  address: PropTypes.number.isRequired,
  values: PropTypes.arrayOf(PropTypes.number).isRequired,
  focusIndex: PropTypes.number,
  selectedRange: PropTypes.arrayOf(PropTypes.number).isRequired,
  onMouseDown: PropTypes.func.isRequired,
  onMouseEnter: PropTypes.func.isRequired,
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
      columnUnit: 4,
      addressWidth: 0,
    };
    this.tableData = { };
    this.containerReference = React.createRef();
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseEnter = this.handleMouseEnter.bind(this);
    this.handleWheel = this.handleWheel.bind(this);
  }

  render() {
    const items = [];
    if (this.state.rowCount !== undefined) {
      const columnCount = this.state.columnCount;
      items.push(<span key="binary-table-header-row" className="binary-table-header-row">
        <Measure onResize={contentRect => { this.onAddressResized(contentRect); }}>
          {({ measureRef }) =>
            (<span ref={measureRef} style={{ display: 'inline-block' }} key="addressBox">
              <span key="address" className="binary-table-address">&ensp;Address</span>
            </span>)
          }
        </Measure>
        <BinaryTableDataHeaderRow key="binary-table-data-header-row" columnCount={columnCount} />
      </span>);
      items.push(<br key="br-head" />);
      const viewModel = this.props.viewModel;
      const selectedRange = viewModel.getSelectedRange();
      const focusedAddress = selectedRange[0];
      for (let j = 0; j < this.state.rowCount; j += 1) {
        const rowAddress = (j + this.state.row) * columnCount;
        const rowIndex = Math.floor(rowAddress / columnCount);
        const row = <BinaryTableRow key={'BinaryTableRow:' + (rowIndex % this.state.rowCount)} address={rowAddress} />;
        items.push(row);

        const values = viewModel.getBuffer(rowAddress, columnCount);
        if (this.tableData[rowIndex] === undefined) {
          this.tableData[rowIndex] = values;
        } else if (this.tableData[rowIndex].length !== values.length) {
          this.tableData[rowIndex] = values;
        } else {
          let changed = false;
          for (let i = 0; i < columnCount; ++i) {
            if (this.tableData[rowIndex][i] !== values[i]) {
              changed = true;
              break;
            }
          }
          if (changed) {
            this.tableData[rowIndex] = values;
          }
        }

        let selectedIndex = (focusedAddress - rowAddress);
        if (selectedIndex < 0) {
          selectedIndex = -1;
        } else if (selectedIndex >= columnCount) {
          selectedIndex = -1;
        }
        let rowFocusIndex = focusedAddress - rowAddress;
        if ((rowFocusIndex < 0) || (columnCount <= rowFocusIndex)) {
          rowFocusIndex = undefined;
        }
        let rowSelectedRange = [selectedRange[0] - rowAddress, selectedRange[1] - rowAddress];
        rowSelectedRange[0] = Math.min(Math.max(0, rowSelectedRange[0]), columnCount);
        rowSelectedRange[1] = Math.min(Math.max(0, rowSelectedRange[1]), columnCount);
        if (rowSelectedRange[0] === rowSelectedRange[1]) {
          rowSelectedRange = undefined;
        }
        items.push(<BinaryTableDataRow
          key={'DataRow:' + (rowIndex % this.state.rowCount)}
          values={values}
          address={rowAddress}
          focusIndex={rowFocusIndex}
          selectedRange={rowSelectedRange}
          onMouseDown={this.handleMouseDown}
          onMouseEnter={this.handleMouseEnter}
        />);
        items.push(<span key={'white:' + rowAddress} style={whiteStyle}>&ensp;</span>);
        items.push(<BinaryTableExpressionRow key={'ExpressionRow:' + (rowIndex % this.state.rowCount)} listener={this}
        address={rowAddress} values={this.tableData[rowIndex]} focusIndex={rowFocusIndex} selectedRange={rowSelectedRange} />);
        items.push(<br key={'br' + rowAddress} />);
      }
      items.push(<span key="binary-table-footer-row" className="binary-table-footer-row">
        <span key="address" className="binary-table-address">&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;</span>
        <div key={'write-mode'} className="binary-table-address">{(this.props.viewModel.getWriteMode() === WriteMode.Insert) ? 'Insert' : 'Overwrite'}</div>
      </span>);
    }
    return (<Measure onResize={contentRect => { this.onResized(contentRect); }}>
      {({ measureRef }) =>
        (<div
          ref={measureRef}
          className="binary-table"
          style={containerStyle}
          onKeyDown={this.handleKeyDown}
          onWheel={this.handleWheel}
          tabIndex={100000}
        >{items}</div>)
      }
    </Measure>);
  }

  handleKeyDown(e) {
    const keyCode = e.keyCode;
    const shiftKey = e.shiftKey;
    const handler = (state, props) => {
      const viewModel = this.props.viewModel;
      const handleTypeHex = (value) => {
        if (viewModel.getWriteMode() === WriteMode.Overwrite) {
          viewModel.processCharacter(value);
        } else {
          viewModel.processCharacter(value);
        }
      };

      const columnCount = state.columnCount;
      if ((keyCode >= 48) && (keyCode <= 57)) {
        handleTypeHex(keyCode - 48);
      } else if ((keyCode >= 65) && (keyCode <= 70)) {
        handleTypeHex(keyCode - 55);
      }
      let selectedRange = viewModel.getSelectedRange();
      switch (keyCode) {
        case 8: // Delete
        {
          if (selectedRange[0] === selectedRange[1]) {
            if (selectedRange[0] >= 1) {
              viewModel.removeValueAt(selectedRange[0] - 1, 1);
              viewModel.setSelectionStartAddress(selectedRange[0] - 1);
              viewModel.setSelectionEndAddress(selectedRange[0] - 1);
            }
          } else {
            viewModel.removeValueAt(selectedRange[0], selectedRange[1] - selectedRange[0]);
            viewModel.setSelectionStartAddress(selectedRange[0]);
            viewModel.setSelectionEndAddress(selectedRange[0]);
            return { };
          }
          break;
        }
        case 16: // Shift
        {
          return { };
        }
        case 37: // Left
        {
          if (shiftKey === false) {
            const address = Math.min(selectedRange[0], selectedRange[1] - 1);
            viewModel.setSelectionStartAddress(address);
            viewModel.setSelectionEndAddress(address);
          } else {
            const address = viewModel.getSelectionEndAddress() - 1;
            viewModel.setSelectionEndAddress(address);
          }
          break;
        }
        case 38: // Up
        {
          if (shiftKey === false) {
            const address = Math.min(selectedRange[0], selectedRange[1] - columnCount);
            viewModel.setSelectionStartAddress(address);
            viewModel.setSelectionEndAddress(address);
          } else {
            const address = viewModel.getSelectionEndAddress() - columnCount;
            viewModel.setSelectionEndAddress(address);
          }
          break;
        }
        case 39: // Right
        {
          if (shiftKey === false) {
            const address = Math.max(selectedRange[0] + 1, selectedRange[1]);
            viewModel.setSelectionStartAddress(address);
            viewModel.setSelectionEndAddress(address);
          } else {
            const address = viewModel.getSelectionEndAddress() + 1;
            viewModel.setSelectionEndAddress(address);
          }
          break;
        }
        case 40: // Down
        {
          if (shiftKey === false) {
            const address = Math.max(selectedRange[0] + columnCount, selectedRange[1]);
            viewModel.setSelectionStartAddress(address);
            viewModel.setSelectionEndAddress(address);
          } else {
            const address = viewModel.getSelectionEndAddress() + columnCount;
            viewModel.setSelectionEndAddress(address);
          }
          break;
        }
        case 73: // i
          viewModel.setWriteMode(1 - viewModel.getWriteMode());
          break;
        default:
          console.log(keyCode);
          break;
      }

      selectedRange = viewModel.getSelectedRange();
      let displayAddress = viewModel.getSelectionStartAddress();
      if (selectedRange[0] !== selectedRange[1]) {
        if (viewModel.getSelectionStartAddress() < viewModel.getSelectionEndAddress()) {
          displayAddress = selectedRange[1] - 1;
        } else {
          displayAddress = selectedRange[0];
        }
      }
      const displayRow = Math.floor(displayAddress / state.columnCount);
      let row = state.row;
      if (displayRow < row) {
        row = displayRow;
      } else if (displayRow >= (row + state.rowCount)) {
        row = displayRow - state.rowCount + 1;
      }
      return { floatRow: row, row: row };
    };
    this.setState(handler);
  }

  handleMouseDown(sender, e) {
    const address = sender.props.address;
    const shiftKey = e.shiftKey;

    const handler = () => {
      if (shiftKey === false) {
        this.props.viewModel.setSelectionStartAddress(address);
      }
      this.props.viewModel.setSelectionEndAddress(address);
      return { };
    };
    this.setState(handler);
  }

  handleMouseEnter(sender, e) {
    const address = sender.props.address;
    const buttons = e.buttons;

    const handler = () => {
      if (buttons === 1) {
        this.props.viewModel.setSelectionEndAddress(address);
      }
      return { };
    };
    this.setState(handler);
  }

  handleWheel(e) {
    const deltaRow = e.deltaY / 24;
    this.setState((state, props) => {
      let nextFloatRow = BinaryTable.limitRowNumber(state.floatRow + deltaRow, state.columnCount, props.viewModel.getFileSize());
      return {
        floatRow: nextFloatRow,
        row: Math.floor(state.floatRow),
      };
    });
  }

  onResized(contentRect) {
    const rowCount = Math.floor((contentRect.entry.height / 24) - 2);
    let columnCount = Math.floor(Math.max(this.state.columnUnit, (contentRect.entry.width - this.state.addressWidth - 24 - 22 - 1) / 46));
    columnCount = Math.floor(columnCount / this.state.columnUnit) * this.state.columnUnit;
    if ((this.state.columnCount !== columnCount) || (this.state.rowCount !== rowCount)) {
      this.setState({ columnCount, rowCount });
    }
  }

  onAddressResized(contentRect) {
    const addressWidth = contentRect.entry.width;
    this.setState({ addressWidth });
  }

  onViewModelReloaded() {
    this.forceUpdate();
  }

  onExpressionCellMouseDown(address, e) {
    const shiftKey = e.shiftKey;

    const handler = () => {
      if (shiftKey === false) {
        this.props.viewModel.setSelectionStartAddress(address);
      }
      this.props.viewModel.setSelectionEndAddress(address);
      return { };
    };
    this.setState(handler);
  }

  onExpressionCellMouseEnter(address, e) {
    const buttons = e.buttons;

    const handler = () => {
      if (buttons === 1) {
        this.props.viewModel.setSelectionEndAddress(address);
      }
      return { };
    };
    this.setState(handler);
  }

  static limitRowNumber(row, columnCount, fileSize) {
    const maxRow = Math.max(0, Math.floor(fileSize - 1) / columnCount);
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
