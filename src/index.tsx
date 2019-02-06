import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { App } from './App';
import registerServiceWorker from './registerServiceWorker';
import './index.css';

if (window.location.search) {
    localStorage.setItem("query", window.location.search)
    window.location.search = ""
}

ReactDOM.render(
    <App />,
    document.getElementById('root') as HTMLElement
);
registerServiceWorker();
