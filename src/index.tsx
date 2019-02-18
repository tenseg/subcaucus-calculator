/**
 * index.tsx
 *
 * The entry point for the Subcacucus Calculator.
 *
 * See public/index.html for regular headers and such.
 *
 * Copyright 2019 by Tenseg LLC
 * Made available under the MIT License
 */

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { App } from './App';
import registerServiceWorker from './registerServiceWorker';
import './index.css';

// if a query is found, only store it and restart
// this will allow the query to be pulled and deleted
// from local storage by our components
if (window.location.search) {

    localStorage.setItem("query", window.location.search)
    window.location.search = ""

} else {

    ReactDOM.render(
        <App />,
        document.getElementById('root') as HTMLElement
    );
    // skip the service worker in the iOS app
    if (!process.env.REACT_APP_IOS_VERSION) {
        registerServiceWorker();
    }

}