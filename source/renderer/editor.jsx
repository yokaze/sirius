/* eslint-env browser */
import { ipcRenderer } from 'electron';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import Measure from 'react-measure';
import shallowEqualArrays from 'shallow-equal/arrays';

import BinaryTableAddressArea from './components/BinaryTableAddressArea';
import BinaryTableAddressCell from './components/BinaryTableAddressCell';
import BinaryTableDataRow from './components/BinaryTableDataRow';
import BinaryTableExpressionRow from './components/BinaryTableExpressionRow';
import BinaryTableFooterArea from './components/BinaryTableFooterArea';
import BinaryTableHeaderArea from './components/BinaryTableHeaderArea';
import BinaryTableHeaderRow from './components/BinaryTableHeaderRow';
import FooterMode from './FooterMode';
import MidiParser from '../parser/MidiParser';
import SiriusConstants from '../common/SiriusConstants';
import SiriusDocument from '../common/SiriusDocument';
import SiriusDocumentCommand from '../common/SiriusDocumentCommand';
import SiriusIpcClient from '../ipc/SiriusIpcClient';
import SiriusIpcFileHandle from '../ipc/SiriusIpcFileHandle';
import WriteMode from './WriteMode';

const ipcClient = new SiriusIpcClient();

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
    return this.document.read(address, length);
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
    const executable = ((address + length) <= this.document.length());
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

  length() {
    return this.document.length();
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

  onAppUpdateClipboard(sender, data) {
    this.document.getClipboard().setValue(data);
  }

  onAppUpdateFileHandle(sender, fileHandle) {
    const oldFileHandle = this.document.getFileHandle();
    if (oldFileHandle !== undefined) {
      oldFileHandle.destroy();
    }

    this.document.setFileHandle(new SiriusIpcFileHandle(fileHandle));
    this.listener.onViewModelReloaded();
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
    this.selectionEndAddress = this.length();
    this.listener.onViewModelReloaded();
  }

  onAppRequestStructureView() {
    this.listener.useStructureView();
  }

  _applyCommand(command) {
    this.document.applyCommand(command);
    ipcClient.sendDocumentCommand(command);
  }
}

class BinaryStructureNode extends Component {
  constructor(props) {
    super(props);
    this.onMouseDown = this.onMouseDown.bind(this);
  }

  shouldComponentUpdate() {
    return true;
  }

  onMouseDown(e) {
    e.stopPropagation();
    const { listener, value } = this.props;
    listener.onStructureNodeMouseDown(value.address);
  }

  render() {
    const { listener, value } = this.props;
    let children;
    if (value.children) {
      children = value.children.map(child => <BinaryStructureNode listener={listener} value={child} />);
    }
    return (
      <span
        style={{
          cursor: 'default',
          display: 'inline-block',
          fontFamily: 'Roboto Mono',
          width: 600,
        }}
        onMouseDown={this.onMouseDown}
      >
        {`${value.text} (${value.address.toString(16).toUpperCase()})`}
        <br />
        <span style={{ display: 'inline-block', marginLeft: '16px' }}>{children}</span>
      </span>
    );
  }
}

class BinaryTable extends Component {
  static limitRowNumber(row, columnCount, fileSize) {
    const maxRow = Math.max(0, Math.floor(fileSize - 1) / columnCount);
    row = Math.max(0, row);
    return Math.min(row, maxRow);
  }

  constructor(props) {
    super(props);
    const { viewModel } = this.props;
    viewModel.setListener(this);
    this.state = {
      row: 0,
      columnCount: 16,
      columnUnit: 4,
      addressWidth: 0,
      fontFamily: SiriusConstants.defaultFontFamily,
      fontSize: SiriusConstants.defaultFontSize,
      dataCellWidth: 0,
      expressionCellWidth: 0,
      rowHeight: 0,
    };
    this.cache = {
      floatRow: 0,
    };
    this.renderCache = {
      address: undefined,
      values: new Map(),
      focusIndex: new Map(),
      selectedRange: new Map(),
    };
    this.containerReference = React.createRef();
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onDragOver = this.onDragOver.bind(this);
    this.onDrop = this.onDrop.bind(this);
    this.onWheel = this.onWheel.bind(this);
  }

  // Data Cell Events -----------------------------------------------------------------------------
  onDataCellMouseDown(address, e) {
    const { shiftKey } = e;
    const { viewModel } = this.props;

    this.setState(() => {
      if (shiftKey === false) {
        viewModel.setSelectionStartAddress(address);
      }
      viewModel.setSelectionEndAddress(address);
      return { };
    });
  }

  onDataCellMouseEnter(address, e) {
    const { buttons } = e;
    if (buttons !== 1) {
      return;
    }

    const { viewModel } = this.props;
    this.setState(() => {
      viewModel.setSelectionEndAddress(address);
      return { };
    });
  }

  onDataCellResized(size) {
    const diff = { dataCellWidth: size.width, rowHeight: size.height };
    this.setState(state => this.complementStateChange(state, diff));
  }

  // Expression Cell Events -----------------------------------------------------------------------
  onExpressionCellMouseDown(address, e) {
    const { shiftKey } = e;
    const { viewModel } = this.props;

    this.setState(() => {
      if (shiftKey === false) {
        viewModel.setSelectionStartAddress(address);
      }
      viewModel.setSelectionEndAddress(address);
      return { };
    });
  }

  onExpressionCellMouseEnter(address, e) {
    const { buttons } = e;
    const { viewModel } = this.props;

    this.setState(() => {
      if (buttons === 1) {
        viewModel.setSelectionEndAddress(address);
      }
      return { };
    });
  }

  onExpressionCellResized(size) {
    const diff = { expressionCellWidth: size.width };
    this.setState(state => this.complementStateChange(state, diff));
  }

  // ----------------------------------------------------------------------------------------------
  onDragOver(e) {
    e.preventDefault();
  }

  onDrop(e) {
    e.preventDefault();
    ipcClient.sendFileDropRequest(e.dataTransfer.files[0].path);
  }

  onKeyDown(e) {
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
            const address = Math.max(0, Math.min(selectedRange[0], selectedRange[1] - 1));
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
            const address = Math.max(0, Math.min(selectedRange[0], selectedRange[1] - columnCount));
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
          [displayAddress] = selectedRange;
        }
      }
      const displayRow = Math.floor(displayAddress / state.columnCount);
      let { row } = state;
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

  onWheel(e) {
    const deltaRow = e.deltaY / 24;
    this.setState((state, props) => {
      const nextFloatRow = BinaryTable.limitRowNumber(this.cache.floatRow + deltaRow, state.columnCount, props.viewModel.length());
      this.cache.floatRow = nextFloatRow;
      const nextRow = Math.floor(nextFloatRow);
      if (nextRow !== state.row) {
        return { row: nextRow };
      }
      return undefined;
    });
  }

  onResized(contentRect) {
    const { width, height } = contentRect.entry;
    const diff = { totalWidth: width, contentHeight: height };
    this.setState(state => this.complementStateChange(state, diff));
  }

  onFooterResize(size) {
    const { height } = size;
    const diff = { footerHeight: height };
    this.setState(state => this.complementStateChange(state, diff));
  }

  onAddressCellResized(size) {
    const addressWidth = size.width;
    this.setState(state => this.complementStateChange(state, { addressWidth }));
  }

  onViewModelReloaded() {
    this.forceUpdate();
  }

  onViewModelUpdatePreference(sender, preference) {
    const diff = {
      fontFamily: preference.fontFamily,
      fontSize: preference.fontSize,
      columnUnit: preference.columnUnit,
    };
    this.setState(state => this.complementStateChange(state, diff));
  }

  onStructureNodeMouseDown(address) {
    const { columnCount } = this.state;
    const diff = { row: Math.floor(address / columnCount) };
    this.setState(() => diff);
  }

  complementStateChange(state, diff) {
    if (diff.addressWidth
      || diff.totalWidth
      || diff.contentHeight
      || diff.footerHeight
      || diff.columnUnit
      || diff.rowHeight
      || diff.dataCellWidth
      || diff.expressionCellWidth
      || diff.useStructureView) {
      if ((diff.columnCount === undefined) || (diff.rowCount === undefined)) {
        const nextState = Object.assign(state, diff);
        if (nextState.addressWidth === undefined) {
          return diff;
        }
        let rowCount = 1;
        if (nextState.rowHeight !== 0) {
          //  2 for excluding header and footer
          rowCount = Math.floor(((nextState.contentHeight - nextState.footerHeight) / nextState.rowHeight) - 1);
        }
        let columnCount = 1;
        if ((nextState.dataCellWidth !== 0) && (nextState.expressionCellWidth !== 0)) {
          const cellWidth = nextState.dataCellWidth + nextState.expressionCellWidth;
          columnCount = Math.floor(Math.max(nextState.columnUnit, (nextState.totalWidth - nextState.addressWidth - cellWidth - 1) / cellWidth));
        }
        columnCount = Math.max(1, Math.floor(columnCount / nextState.columnUnit) * nextState.columnUnit);
        if (nextState.useStructureView) {
          columnCount = Math.min(columnCount, 16);
        }
        return Object.assign(diff, { rowCount, columnCount });
      }
    }
    return diff;
  }

  useStructureView() {
    const diff = { useStructureView: true };
    this.setState(state => this.complementStateChange(state, diff));
  }

  generateTableLayout() {
    const { columnCount, row, rowCount } = this.state;
    const partition = [];
    const ret = [];
    let address = 0;
    let partitionIndex = 0;
    for (let i = 0; i <= (row + rowCount); i += 1) {
      let rowAddress = 0;
      if (partitionIndex >= partition.length) {
        rowAddress = address;
        address += columnCount;
      } else {
        const partitionAddress = partition[partitionIndex];
        if (address < partitionAddress) {
          rowAddress = address;
          address += columnCount;
        } else {
          rowAddress = partitionAddress;
          partitionIndex += 1;
          address = partitionAddress + columnCount;
        }
      }
      if (i >= row) {
        ret.push(rowAddress);
      }
    }
    return ret;
  }

  updateRenderCache() {
    const { viewModel } = this.props;
    const { columnCount, rowCount } = this.state;
    const { address, values, selectedRange } = this.renderCache;
    const focusIndex = viewModel.getSelectedRange()[0];
    const selection = viewModel.getSelectedRange();
    let nextAddress = new Float64Array(rowCount);
    const nextValues = new Map();
    const nextFocusIndex = new Map();
    const nextSelectedRange = new Map();
    const tableLayout = this.generateTableLayout();
    for (let i = 0; i < rowCount; i += 1) {
      const rowAddress = tableLayout[i];
      const rowLength = tableLayout[i + 1] - tableLayout[i];
      nextAddress[i] = rowAddress;
      {
        const rowValues = values.get(rowAddress);
        let nextRowValues = viewModel.getBuffer(rowAddress, rowLength);
        if (
          (rowValues !== undefined)
          && (nextRowValues !== undefined)
          && shallowEqualArrays(rowValues, nextRowValues)
        ) {
          nextRowValues = rowValues;
        }
        nextValues.set(rowAddress, nextRowValues);
      }
      {
        let rowFocusIndex = focusIndex - rowAddress;
        if ((rowFocusIndex < 0) || (rowFocusIndex >= columnCount)) {
          rowFocusIndex = undefined;
        }
        nextFocusIndex.set(rowAddress, rowFocusIndex);
      }
      {
        const rowSelectedRange = selectedRange.get(rowAddress);
        const rowSelectionStart = Math.min(Math.max(0, selection[0] - rowAddress), columnCount);
        const rowSelectionEnd = Math.min(Math.max(0, selection[1] - rowAddress), columnCount);
        let nextRowSelectedRange = [rowSelectionStart, rowSelectionEnd];
        if (rowSelectionStart === rowSelectionEnd) {
          nextRowSelectedRange = undefined;
        }
        if (
          (rowSelectedRange !== undefined)
          && (nextRowSelectedRange !== undefined)
          && shallowEqualArrays(rowSelectedRange, nextRowSelectedRange)
        ) {
          nextRowSelectedRange = rowSelectedRange;
        }
        nextSelectedRange.set(rowAddress, nextRowSelectedRange);
      }
    }
    if (
      (address !== undefined)
      && (nextAddress !== undefined)
      && shallowEqualArrays(address, nextAddress)
    ) {
      nextAddress = this.renderCache.address;
    }
    this.renderCache.layout = tableLayout;
    this.renderCache.address = nextAddress;
    this.renderCache.values = nextValues;
    this.renderCache.focusIndex = nextFocusIndex;
    this.renderCache.selectedRange = nextSelectedRange;
  }

  renderStyle() {
    const { fontFamily, fontSize } = this.state;
    if (this.cache.fontFamily !== fontFamily) {
      this.cache.fontFamily = fontFamily;
      BinaryTableHeaderRow.setFontFamily(fontFamily);
      BinaryTableAddressCell.setFontFamily(fontFamily);
      BinaryTableDataRow.setFontFamily(fontFamily);
      BinaryTableExpressionRow.setFontFamily(fontFamily);
      BinaryTableFooterArea.setFontFamily(fontFamily);
    }
    if (this.cache.fontSize !== fontSize) {
      this.cache.fontSize = fontSize;
      BinaryTableHeaderRow.setFontSize(fontSize);
      BinaryTableAddressCell.setFontSize(fontSize);
      BinaryTableDataRow.setFontSize(fontSize);
      BinaryTableExpressionRow.setFontSize(fontSize);
      BinaryTableFooterArea.setFontSize(fontSize);
    }
  }

  render() {
    this.updateRenderCache();
    this.renderStyle();

    const { rowCount, columnCount } = this.state;
    const items = [];
    if (rowCount !== undefined) {
      items.push(<BinaryTableHeaderArea key="binary-table-header-area" listener={this} columnCount={columnCount} />);
      items.push(<br key="br-head" />);
      const { viewModel } = this.props;
      items.push(<BinaryTableAddressArea key="BinaryTableAddressArea" addresses={this.renderCache.address} />);
      const tableCells = [];
      for (let j = 0; j < rowCount; j += 1) {
        const rowAddress = this.renderCache.layout[j];
        const rowValue = this.renderCache.values.get(rowAddress);
        const rowFocusIndex = this.renderCache.focusIndex.get(rowAddress);
        const rowSelectedRange = this.renderCache.selectedRange.get(rowAddress);
        tableCells.push(<BinaryTableDataRow
          key={`data:${rowAddress}`}
          listener={this}
          values={rowValue}
          address={rowAddress}
          length={columnCount}
          focusIndex={rowFocusIndex}
          selectedRange={rowSelectedRange}
          measured={j === 0}
        />);
        tableCells.push(<span key={`white:${rowAddress}`} style={whiteStyle}>&ensp;</span>);
        tableCells.push(<BinaryTableExpressionRow
          key={`express:${rowAddress}`}
          listener={this}
          address={rowAddress}
          length={columnCount}
          values={rowValue}
          focusIndex={rowFocusIndex}
          selectedRange={rowSelectedRange}
          measured={j === 0}
        />);
        tableCells.push(<br key={`br:${rowAddress}`} />);
      }
      items.push(<div key="table" style={{ display: 'inline-block' }}>{tableCells}</div>);
      const { useStructureView } = this.state;
      if (useStructureView) {
        const parser = new MidiParser(viewModel.document);
        const subValue = parser.parseBlock(0, viewModel.length());
        const value = {
          address: 0,
          children: subValue,
          text: 'Root',
        };
        items.push(<BinaryStructureNode listener={this} value={value} />);
      }
      items.push(<br key="br-footer" />);
      items.push(
        <BinaryTableFooterArea
          key="binary-table-footer-area"
          listener={this}
          footerMode={FooterMode.Default}
          writeMode={viewModel.getWriteMode()}
          fileSize={viewModel.length()}
        />,
      );
    }
    return (
      <Measure onResize={(contentRect) => { this.onResized(contentRect); }}>
        {({ measureRef }) => (
          <div
            ref={measureRef}
            className="binary-table"
            style={containerStyle}
            onDragOver={this.onDragOver}
            onDrop={this.onDrop}
            onKeyDown={this.onKeyDown}
            onWheel={this.onWheel}
            tabIndex={100000}
          >
            {items}
          </div>
        )
      }
      </Measure>
    );
  }
}

BinaryTable.propTypes = {
  viewModel: PropTypes.shape({}).isRequired,
};

const tableViewModel = new BinaryTableViewModel();
tableViewModel.setIpcClient(ipcClient);
ipcClient.setListener(tableViewModel);
ipcRenderer.send('editor-initialized');

ReactDOM.render(
  <BinaryTable viewModel={tableViewModel} />,
  document.getElementById('root'),
);
