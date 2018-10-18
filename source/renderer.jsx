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

class BinaryTableRow extends Component {
    constructor(props) {
        super(props);
        this.state = {
            address: props.address,
        };
    }
    render() {
        const address = this.state.address;
        const text = ('00000000' + address.toString(16)).slice(-8).toUpperCase();
        return <span key={"address" + address} style={addressStyle}>{text}</span>;
    }
};

class BinaryTableCell extends Component {
    constructor(props) {
        super(props);
        this.handleKeyDown = this.handleKeyDown.bind(this);
    }
    render() {
        const text = ('00' + this.props.value.toString(16)).slice(-2).toUpperCase();
        return <span key={this.props.address} style={style} tabIndex={this.props.address} onKeyDown={this.handleKeyDown}>{text}</span>;
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
        for (let j = 0; j < 20; ++j)
        {
            const row = <BinaryTableRow key={"btrow" + j + this.state.startAddress} address={j * 16 + this.state.startAddress} />;
            items.push(row);
            for (let i = 0; i < 16; ++i)
            {
                const address = i + j * 16 + this.state.startAddress;
                const value = (address) % 256;
                const cell = <BinaryTableCell key={"btcell" + address} address={address} value={value} handleKeyDown={this.handleKeyDown} />;
                items.push(cell);
            }
            items.push(<br key={"br" + j} />);
        }
        return <div className="binary-table">{items}</div>;
    }
    handleKeyDown(e) {
        this.setState((state, props) => ({ startAddress: state.startAddress + 0x10 }));
    }
};

ReactDOM.render(<BinaryTable />,
    document.getElementById('root')
);
