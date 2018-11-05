import React, { Component } from 'react';
import ReactDOM from 'react-dom';

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
    getFileSize() {
        return this.fileData.length;
    }
    getFocusAddress() {
        return this.focusAddress;
    }
    setFocusAddress(address) {
        this.focusAddress = address;
    }
};

class BinaryTableRow extends Component {
    constructor(props) {
        super(props);
    }
    render() {
        const address = this.props.address;
        const text = ('00000000' + address.toString(16)).slice(-8).toUpperCase();
        return <span key={"BinaryTableRow:span:" + address} style={addressStyle}>{text}</span>;
    }
};

class BinaryTableCell extends Component {
    constructor(props) {
        super(props);
        this.handleKeyDown = this.handleKeyDown.bind(this);
    }
    render() {
        const address = this.props.address;
        const text = ('00' + this.props.value.toString(16)).slice(-2).toUpperCase();
        return <span ref={this.props.inputRef} key={"BinaryTableCell:span:" + address} style={style} tabIndex={this.props.address} onKeyDown={this.handleKeyDown}>{text}</span>;
    }
    handleKeyDown(e) {
        this.props.handleKeyDown(e);
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
        const fileData = this.props.fileData;
        const fileSize = fileData.getFileSize();
        for (let j = 0; j < 20; ++j)
        {
            const rowAddress = this.state.startAddress + j * columnCount;
            const row = <BinaryTableRow key={"BinaryTableRow:" + rowAddress} address={rowAddress} />;
            items.push(row);
            for (let i = 0; i < columnCount; ++i)
            {
                const cellAddress = rowAddress + i;
                const value = (cellAddress < fileSize) ? fileData.getValueAt(cellAddress) : '--';
                const reference = (cellAddress == fileData.getFocusAddress()) ? this.reference : undefined;
                const cell = <BinaryTableCell inputRef={reference} key={"BinaryTableCell:" + cellAddress} address={cellAddress} value={value} handleKeyDown={this.handleKeyDown} />;
                items.push(cell);
            }
            items.push(<br key={"br" + j} />);
        }
        return <div className="binary-table">{items}</div>;
    }
    handleKeyDown(e) {
        const keyCodeUp = 38;
        const keyCodeRight = 39;
        const keyCodeDown = 40;
        let delta = 0;
        switch (e.keyCode)
        {
            case keyCodeUp:
                delta = -1;
                break;
            case keyCodeDown:
                delta = +1;
                break;
            case keyCodeRight:
                this.props.fileData.setValueAt(this.props.fileData.getFileSize(), 0);
                break;
        }
        if (delta != 0)
        {
            this.props.fileData.setFocusAddress(this.props.fileData.getFocusAddress() + delta * 16);
            const updateStartAddress = function(state, props) {
                const columnCount = state.columnCount;
                const fileSize = props.fileData.getFileSize();
                const maxAddress = Math.floor((fileSize - 1) / columnCount) * columnCount;
                const nextAddress = Math.min(Math.max(0, state.startAddress + delta * columnCount), maxAddress);
                return { startAddress: nextAddress };
            };
            this.setState(updateStartAddress);
        }
    }
};

ReactDOM.render(<BinaryTable fileData={new BinaryTableViewModel} />,
    document.getElementById('root')
);
