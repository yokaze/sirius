import { remote } from 'electron';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { sprintf } from 'sprintf-js';

const applicationModel = remote.require('./app').Model;

const WriteMode = {
  Overwrite: 0,
  Insert: 1
};

const content = [];
const addressStyle = {
    display: "inline-block",
    fontFamily: "Monaco, monospace",
    fontSize: "16px",
    height: "24px",
    lineHeight: "24px",
    textAlign: "right",
    width: "128px"
};
const style = {
    display: "inline-block",
    fontFamily: "Monaco, monospace",
    fontSize: "16px",
    height: "24px",
    lineHeight: "24px",
    textAlign: "center",
    width: "32px"
};

class BinaryTableViewModel {
    constructor() {
        this.fileData = [];
        this.focusAddress = 64;
        this.writeMode = WriteMode.Overwrite;
        for (let i = 0; i < 0x288; ++i)
        {
            this.fileData.push((i * 11) % 256);
        }
    }
    getValueAt(address) {
        return this.fileData[address];
    }
    setValueAt(address, value) {
        while (this.getFileSize() <= address)
        {
            this.fileData.push(0);
        }
        this.fileData[address] = value;
    }
    insertValueAt(address, value) {
        this.fileData.splice(address, 0, value);
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
};

class BinaryTableRow extends Component {
    constructor(props) {
        super(props);
    }
    render() {
        const address = this.props.address;
        const text = sprintf('%08X', address);
        return <span key={"BinaryTableRow:span:" + address} style={addressStyle}>{text}</span>;
    }
};

class BinaryTableCell extends Component {
    constructor(props) {
        super(props);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
    }
    render() {
        const address = this.props.address;
        const text = this.props.valid ? sprintf('%02X', this.props.value) : '--';
        return <span ref={this.props.inputRef} key={'span'} style={style} tabIndex={this.props.address} onKeyDown={this.handleKeyDown} onMouseDown={this.handleMouseDown}>{text}</span>;
    }
    handleKeyDown(e) {
        this.props.handleKeyDown(e);
    }
    handleMouseDown(e) {
        this.props.handleMouseDown(this, e);
    }
}

class BinaryTable extends Component {
    constructor(props) {
        super(props);
        this.state = {
            startAddress: 0,
            focusAddress: 64,
            columnCount: 16
        };
        this.reference = React.createRef();
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
    }
    componentDidUpdate() {
        this.reference.current.focus();
    }
    render() {
        const columnCount = this.state.columnCount;
        const items = [];
        items.push(<span key="address" style={addressStyle}>Address</span>);
        for (let i = 0; i < columnCount; ++i)
        {
            let title = i.toString(16).toUpperCase();
            title = (i < 16) ? ('+' + title) : title;
            items.push(<span key={i} style={style}>{title}</span>);
        }
        items.push(<br key="br-head" />);
        const viewModel = this.props.viewModel;
        const fileSize = viewModel.getFileSize();
        for (let j = 0; j < 20; ++j)
        {
            const rowAddress = this.state.startAddress + j * columnCount;
            const row = <BinaryTableRow key={"BinaryTableRow:" + rowAddress} address={rowAddress} />;
            items.push(row);
            for (let i = 0; i < columnCount; ++i)
            {
                const cellAddress = rowAddress + i;
                const valid = (cellAddress < fileSize);
                const value = valid ? viewModel.getValueAt(cellAddress) : 0;
                const reference = (cellAddress == viewModel.getFocusAddress()) ? this.reference : undefined;
                const cell = <BinaryTableCell inputRef={reference} key={"BinaryTableCell:" + cellAddress} address={cellAddress} value={value} valid={valid}
                  handleKeyDown={this.handleKeyDown} handleMouseDown={this.handleMouseDown}/>;
                items.push(cell);
            }
            items.push(<br key={"br" + j} />);
        }
        items.push(<div key={"write-mode"}>{(this.props.viewModel.getWriteMode() == WriteMode.Insert) ? 'Insert' : 'Overwrite'}</div>);
        return <div className="binary-table">{items}</div>;
    }
    handleKeyDown(e) {
        const keyCode = e.keyCode;
        const handler = function(state, props) {
            const viewModel = this.props.viewModel;
            const handleTypeHex = function(value) {
                if (viewModel.getWriteMode() == WriteMode.Overwrite)
                {
                    viewModel.setValueAt(viewModel.getFocusAddress(), value);
                }
                else
                {
                    viewModel.insertValueAt(viewModel.getFocusAddress(), value);
                }
            };

            const columnCount = state.columnCount;
            let addressMove = 0;
            if ((48 <= keyCode) && (keyCode <= 57))
            {
                handleTypeHex(keyCode - 48);
                addressMove = 1;
            }
            else if ((65 <= keyCode) && (keyCode <= 70))
            {
                handleTypeHex(keyCode - 55);
                addressMove = 1;
            }
            switch (keyCode)
            {
                case 8:   //  Delete
                {
                    const focusAddress = viewModel.getFocusAddress();
                    if (1 <= focusAddress)
                    {
                        viewModel.removeValueAt(focusAddress - 1);
                        addressMove = -1;
                    }
                    break;
                }
                case 37:  //  Left
                    addressMove = -1;
                    break;
                case 38:  //  Up
                    addressMove = -columnCount;
                    break;
                case 39:  //  Right
                    addressMove = 1;
                    break;
                case 40:  //  Down
                    addressMove = columnCount;
                    break;
                case 73:  //  i
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
            if (nextFocusAddress < nextAddress)
            {
                nextAddress -= Math.ceil((nextAddress - nextFocusAddress) / columnCount) * columnCount;
            }
            else if ((nextAddress + 20 * columnCount) <= nextFocusAddress)
            {
                nextAddress += (Math.floor((nextFocusAddress - nextAddress) / columnCount) - 19) * columnCount;
            }
            return { startAddress: nextAddress };
        };
        this.setState(handler);
    }
    handleMouseDown(sender, e)
    {
        const handler = function(state, props) {
            this.props.viewModel.setFocusAddress(sender.props.address);
            return { };
        };
        this.setState(handler);
    }
};

ReactDOM.render(<BinaryTable viewModel={new BinaryTableViewModel} />,
    document.getElementById('root')
);
