/* eslint-env browser */
import { ipcRenderer } from 'electron';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import Measure from 'react-measure';
import { sprintf } from 'sprintf-js';

import BinaryTableAddressArea from './components/BinaryTableAddressArea';
import BinaryTableAddressCell from './components/BinaryTableAddressCell';
import BinaryTableDataRow from './components/BinaryTableDataRow';
import BinaryTableExpressionRow from './components/BinaryTableExpressionRow';
import BinaryTableHeaderRow from './components/BinaryTableHeaderRow';
import SiriusConstants from '../common/SiriusConstants';
import SiriusDocument from '../common/SiriusDocument';
import SiriusDocumentCommand from '../common/SiriusDocumentCommand';
import SiriusIpcClient from '../ipc/SiriusIpcClient';

const ipcClient = new SiriusIpcClient();

const WriteMode = {
  Overwrite: 0,
  Insert: 1,
};

const whiteStyle = {
  display: 'inline-block',
  fontFamily: 'Monaco, monospace',
  fontSize: '16px',
  height: '1px',
  lineHeight: '1px',
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
    const data = new Uint8Array([value]);
    const command = new SiriusDocumentCommand.Overwrite(address, data);
    this._applyCommand(command);
  }

  insertValueAt(address, value) {
    const data = new Uint8Array([value]);
    const command = new SiriusDocumentCommand.Insert(address, data);
    this._applyCommand(command);
  }

  removeValueAt(address, length) {
    const executable = ((address + length) <= this.document.getFileData().length);
    if (executable) {
      const command = new SiriusDocumentCommand.Remove(address, length);
      this._applyCommand(command);
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
    } else {
      this.isEditing = true;
      this.editValue = value * 16;
    }
  }

  getFileSize() {
    return this.document.getFileSize();
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

  setIpcClient(client) {
    this.ipcClient = client;
  }

  onReceivedRenewalBinary(sender, renewalBinary) {
    this.document.setFileData(renewalBinary);
    this.listener.onViewModelReloaded();
  }

  onAppUpdateClipboard(sender, data) {
    this.document.getClipboard().setData(data);
  }

  onAppUpdatePreference(sender, preference) {
    this.listener.onViewModelUpdatePreference(this, preference);
  }

  onAppRequestCut() {
    const range = this.getSelectedRange();
    if (range[0] === range[1]) {
      return;
    }
    const address = range[0];
    const length = range[1] - range[0];
    const command = new SiriusDocumentCommand.Cut(address, length);
    this._applyCommand(command);
    this.selectionStartAddress = address;
    this.selectionEndAddress = address;
    this.listener.onViewModelReloaded();
  }

  onAppRequestCopy() {
    const range = this.getSelectedRange();
    if (range[0] === range[1]) {
      return;
    }
    const address = range[0];
    const length = range[1] - range[0];
    const command = new SiriusDocumentCommand.Copy(address, length);
    this._applyCommand(command);
  }

  onAppRequestPaste() {
    const range = this.getSelectedRange();
    let removeCommand;
    if (range[0] !== range[1]) {
      removeCommand = new SiriusDocumentCommand.Remove(range[0], range[1] - range[0]);
    }
    const address = range[0];
    const pasteCommand = new SiriusDocumentCommand.Paste(address);
    if (removeCommand === undefined) {
      this._applyCommand(pasteCommand);
    } else {
      const command = new SiriusDocumentCommand.Composite([removeCommand, pasteCommand]);
      this._applyCommand(command);
    }
    this.listener.onViewModelReloaded();
  }

  onAppRequestSelectAll() {
    this.selectionStartAddress = 0;
    this.selectionEndAddress = this.getFileSize();
    this.listener.onViewModelReloaded();
  }

  _applyCommand(command) {
    this.document.applyCommand(command);
    ipcClient.sendDocumentCommand(command);
  }
}

class BinaryTable extends Component {
  constructor(props) {
    super(props);
    this.props.viewModel.setListener(this);
    this.state = {
      row: 0,
      startAddress: 0,
      focusAddress: 64,
      columnCount: 16,
      columnUnit: 4,
      addressWidth: 0,
      fontFamily: SiriusConstants.defaultFontFamily,
      fontSize: SiriusConstants.defaultFontSize,
    };
    this.cache = {
      floatRow: 0,
    };
    this.tableData = { };
    this.containerReference = React.createRef();
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleDragOver = this.handleDragOver.bind(this);
    this.handleDrop = this.handleDrop.bind(this);
    this.handleWheel = this.handleWheel.bind(this);
  }

  render() {
    {
      const fontFamily = this.state.fontFamily;
      const fontSize = this.state.fontSize;
      if (this.cache.fontFamily !== fontFamily) {
        this.cache.fontFamily = fontFamily;
        BinaryTableHeaderRow.setFontFamily(fontFamily);
        BinaryTableAddressCell.setFontFamily(fontFamily);
        BinaryTableDataRow.setFontFamily(fontFamily);
        BinaryTableExpressionRow.setFontFamily(fontFamily);
      }
      if (this.cache.fontSize !== fontSize) {
        this.cache.fontSize = fontSize;
        BinaryTableHeaderRow.setFontSize(fontSize);
        BinaryTableAddressCell.setFontSize(fontSize);
        BinaryTableDataRow.setFontSize(fontSize);
        BinaryTableExpressionRow.setFontSize(fontSize);
      }
    }
    const items = [];
    if (this.state.rowCount !== undefined) {
      const columnCount = this.state.columnCount;
      items.push(<span key="binary-table-header-row" className="binary-table-header-row">
        <Measure onResize={(contentRect) => { this.onAddressResized(contentRect); }}>
          {({ measureRef }) =>
            (<span ref={measureRef} style={{ display: 'inline-block' }} key="addressBox">
              <BinaryTableAddressCell key="address" value={'\xA0Address'} />
            </span>)
          }
        </Measure>
        <BinaryTableHeaderRow key="binary-table-header-row" columnCount={columnCount} />
      </span>);
      items.push(<br key="br-head" />);
      const viewModel = this.props.viewModel;
      const selectedRange = viewModel.getSelectedRange();
      const focusedAddress = selectedRange[0];
      {
        const addresses = new Float64Array(this.state.rowCount);
        for (let j = 0; j < this.state.rowCount; j += 1) {
          addresses[j] = (j + this.state.row) * columnCount;
        }
        items.push(<BinaryTableAddressArea key="BinaryTableAddressArea" addresses={addresses} />);
      }
      const tableCells = [];
      for (let j = 0; j < this.state.rowCount; j += 1) {
        const rowAddress = (j + this.state.row) * columnCount;
        const rowIndex = Math.floor(rowAddress / columnCount);
        const values = viewModel.getBuffer(rowAddress, columnCount);
        if (this.tableData[rowIndex] === undefined) {
          this.tableData[rowIndex] = values;
        } else if (this.tableData[rowIndex].length !== values.length) {
          this.tableData[rowIndex] = values;
        } else {
          let changed = false;
          for (let i = 0; i < columnCount; i += 1) {
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
        tableCells.push(<BinaryTableDataRow
          key={'DataRow:' + (rowIndex % this.state.rowCount)}
          listener={this}
          values={values}
          address={rowAddress}
          length={columnCount}
          focusIndex={rowFocusIndex}
          selectedRange={rowSelectedRange}
        />);
        tableCells.push(<span key={'white:' + rowAddress} style={whiteStyle}>&ensp;</span>);
        tableCells.push(<BinaryTableExpressionRow
          key={'ExpressionRow:' + (rowIndex % this.state.rowCount)}
          listener={this}
          address={rowAddress}
          length={columnCount}
          values={this.tableData[rowIndex]}
          focusIndex={rowFocusIndex}
          selectedRange={rowSelectedRange}
        />);
        tableCells.push(<br key={'br' + rowAddress} />);
      }
      items.push(<div key="table" style={{ display: 'inline-block' }}>{tableCells}</div>);
      items.push(<br key="br-footer" />);
      items.push(<span key="binary-table-footer-row" className="binary-table-footer-row">
        <span key="address" className="binary-table-address">&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;</span>
        <div key={'write-mode'} className="binary-table-address">{(this.props.viewModel.getWriteMode() === WriteMode.Insert) ? 'Insert' : 'Overwrite'}</div>
      </span>);
    }
    return (<Measure onResize={(contentRect) => { this.onResized(contentRect); }}>
      {({ measureRef }) =>
        (<div
          ref={measureRef}
          className="binary-table"
          style={containerStyle}
          onDragOver={this.handleDragOver}
          onDrop={this.handleDrop}
          onKeyDown={this.handleKeyDown}
          onWheel={this.handleWheel}
          tabIndex={100000}
        >{items}</div>)
      }
    </Measure>);
  }

  handleKeyDown(e) {
    const { keyCode, shiftKey } = e;
    const handler = (state) => {
      const { viewModel } = this.props;
      const handleTypeHex = (value) => {
        if (viewModel.getWriteMode() === WriteMode.Overwrite) {
          viewModel.processCharacter(value);
        } else {
          viewModel.processCharacter(value);
        }
      };

      const { columnCount } = state;
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
      this.cache.floatRow = row;
      return { row };
    };
    this.setState(handler);
  }

  onDataCellMouseDown(address, e) {
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

  onDataCellMouseEnter(address, e) {
    const buttons = e.buttons;
    if (buttons !== 1) {
      return;
    }

    const handler = () => {
      this.props.viewModel.setSelectionEndAddress(address);
      return { };
    };
    this.setState(handler);
  }

  handleDragOver(e) {
    e.preventDefault();
  }

  handleDrop(e) {
    e.preventDefault();
    ipcClient.sendFileDropRequest(e.dataTransfer.files[0].path);
  }

  handleWheel(e) {
    const deltaRow = e.deltaY / 24;
    this.setState((state, props) => {
      const nextFloatRow = BinaryTable.limitRowNumber(this.cache.floatRow + deltaRow, state.columnCount, props.viewModel.getFileSize());
      this.cache.floatRow = nextFloatRow;
      const nextRow = Math.floor(nextFloatRow);
      if (nextRow !== state.row) {
        return { row: nextRow };
      }
      return undefined;
    });
  }

  complementStateChange(state, diff) {
    if (diff.addressWidth || diff.totalWidth || diff.tableHeight || diff.columnUnit) {
      if ((diff.columnCount === undefined) || (diff.rowCount === undefined)) {
        const nextState = Object.assign(state, diff);
        if (nextState.addressWidth === undefined) {
          return diff;
        }
        const rowCount = Math.floor((nextState.tableHeight / 25) - 2);
        let columnCount = Math.floor(Math.max(nextState.columnUnit, (nextState.totalWidth - nextState.addressWidth - 24 - 22 - 1) / 46));
        columnCount = Math.floor(columnCount / nextState.columnUnit) * nextState.columnUnit;
        return Object.assign(diff, { rowCount, columnCount });
      }
    }
    return diff;
  }

  onResized(contentRect) {
    this.setState(state =>
      this.complementStateChange(state, { totalWidth: contentRect.entry.width, tableHeight: contentRect.entry.height }),
    );
  }

  onAddressResized(contentRect) {
    const addressWidth = contentRect.entry.width;
    this.setState(state => this.complementStateChange(state, { addressWidth }));
  }

  onViewModelReloaded() {
    this.forceUpdate();
  }

  onViewModelUpdatePreference(sender, preference) {
    this.setState(state =>
      this.complementStateChange(state, {
        fontFamily: preference.fontFamily,
        fontSize: preference.fontSize,
        columnUnit: preference.columnUnit,
      }),
    );
  }

  onExpressionCellMouseDown(address, e) {
    const { shiftKey } = e;

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
    const { buttons } = e;

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
