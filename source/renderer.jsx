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

class BinaryFileData {
    getValueAt(address) {
        return (address * 11) % 256;
    }
    getFileSize() {
        return 0x288;
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
        return <span key={"BinaryTableCell:span:" + address} style={style} tabIndex={this.props.address} onKeyDown={this.handleKeyDown}>{text}</span>;
    }
    handleKeyDown(e) {
        this.props.handleKeyDown(e);
    }
}

class BinaryTable extends Component {
    constructor(props) {
        super(props);
        this.state = {
            startAddress: 0
        };
        this.handleKeyDown = this.handleKeyDown.bind(this);
    }
    render() {
        const items = [];
        items.push(<span key="address" style={addressStyle}>Address</span>);
        for (let i = 0; i < 16; ++i)
        {
            const title = '+' + i.toString(16).toUpperCase();
            items.push(<span key={i} style={style}>{title}</span>);
        }
        items.push(<br key="br-head" />);
        const fileData = this.props.fileData;
        const fileSize = fileData.getFileSize();
        for (let j = 0; j < 20; ++j)
        {
            const rowAddress = this.state.startAddress + j * 16;
            const row = <BinaryTableRow key={"BinaryTableRow:" + rowAddress} address={rowAddress} />;
            items.push(row);
            for (let i = 0; i < 16; ++i)
            {
                const cellAddress = rowAddress + i;
                const value = (cellAddress < fileSize) ? fileData.getValueAt(cellAddress) : '--';
                const cell = <BinaryTableCell key={"BinaryTableCell:" + cellAddress} address={cellAddress} value={value} handleKeyDown={this.handleKeyDown} />;
                items.push(cell);
            }
            items.push(<br key={"br" + j} />);
        }
        return <div className="binary-table">{items}</div>;
    }
    handleKeyDown(e) {
        const keyCodeUp = 38;
        const keyCodeDown = 40;
        let delta = 0;
        switch (e.keyCode)
        {
            case keyCodeUp:
                delta = -0x10;
                break;
            case keyCodeDown:
                delta = +0x10;
                break;
        }
        if (delta != 0)
        {
            const updateStartAddress = function(state, props) {
                const fileSize = props.fileData.getFileSize();
                const maxAddress = Math.floor((fileSize - 1) / 16) * 16;
                const nextAddress = Math.min(Math.max(0, state.startAddress + delta), maxAddress);
                return { startAddress: nextAddress };
            };
            this.setState(updateStartAddress);
        }
    }
};

ReactDOM.render(<BinaryTable fileData={new BinaryFileData} />,
    document.getElementById('root')
);
