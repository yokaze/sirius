import React from 'react';
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

function handleKeyDown(e)
{
    console.log(e);
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
        const title = ('00' + value.toString(16)).slice(-2).toUpperCase();
        content.push(<span key={(j + 1) * 100 + i} style={style} tabIndex={address} onKeyDown={handleKeyDown}>{title}</span>);
    }
    content.push(<br key={"br" + j} />);
}

ReactDOM.render(
    <div className="binary-table">{content}</div>,
    document.getElementById('root')
);
