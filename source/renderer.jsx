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

class BinaryTableCell extends Component {
    constructor(props, context, updater) {
        super(props, context, updater);
        this.address = props.address;
        this.value = props.value;
    }
    render() {
        const text = ('00' + this.value.toString(16)).slice(-2).toUpperCase();
        return <span key={this.address} style={style} tabIndex={this.address} onKeyDown={this.handleKeyDown}>{text}</span>;
    }
    handleKeyDown(e) {
        console.log(e);
    }
}

content.push(<span key="address" style={addressStyle}>Address</span>);
for (let i = 0; i < 16; ++i)
{
    const title = '+' + i.toString(16).toUpperCase();
    content.push(<span key={i} style={style}>{title}</span>);
}
content.push(<br key={"br"} />);
for (let j = 0; j < 20; ++j)
{
    const address = j * 16;
    const title = ('00000000' + address.toString(16)).slice(-8).toUpperCase();
    content.push(<span key={"address" + j} style={addressStyle}>{title}</span>);
    for (let i = 0; i < 16; ++i)
    {
        const address = i + j * 16;
        const value = (i + j * 16) % 256;
        content.push(<BinaryTableCell key={"btcell" + address} address={address} value={value} />);
    }
    content.push(<br key={"br" + j} />);
}

ReactDOM.render(
    <div className="binary-table">{content}</div>,
    document.getElementById('root')
);
