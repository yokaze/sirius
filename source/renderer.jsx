import React from 'react';
import ReactDOM from 'react-dom';

const cols = [];
for (let i = 0; i < 16; ++i)
{
  cols.push(<p key={i}>{i}</p>);
}
const content = <div>{cols}</div>;

ReactDOM.render(
    content,
    document.getElementById('root')
);
