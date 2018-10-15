import React from 'react';
import ReactDOM from 'react-dom';

const cols = [];
for (let i = 0; i < 16; ++i)
{
    const style = {
        display: "inline-block",
        fontFamily: "Monaco, monospace",
        fontSize: "16px",
        height: "24px",
        lineHeight: "24px",
        textAlign: "center",
        width: "32px"
    };
    const title = '+' + i.toString(16).toUpperCase();
    cols.push(<span key={i} style={style}>{title}</span>);
}
const content = <div>{cols}</div>;

ReactDOM.render(
    content,
    document.getElementById('root')
);
