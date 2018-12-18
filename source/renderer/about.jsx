/* eslint-env browser */
import React from 'react';
import ReactDOM from 'react-dom';

function handleDragOver(e) {
  e.preventDefault();
}

function handleDrop(e) {
  e.preventDefault();
}

function AboutView() {
  return (<div style={{ display: 'inline-block', width: '100%', height: '100%' }} onDragOver={handleDragOver} onDrop={handleDrop}>
    <div style={{ margin: 16 }}>
      <h1>Sirius</h1>
      <p>(C) 2018 Rue Yokaze.</p>
      <p>Distributed under the MIT License.</p>
    </div>
  </div>);
}

ReactDOM.render(
  <AboutView />,
  document.getElementById('root'),
);
