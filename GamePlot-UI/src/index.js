// const path = require('path');
// const dotenv = require('dotenv'); // Import the dotenv package
// require('dotenv').config();

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
// import 'mdb-react-ui-kit/dist/css/mdb.min.css';
// import "@fortawesome/fontawesome-free/css/all.min.css";
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import 'mdb-react-ui-kit/dist/css/mdb.min.css';
import "@fortawesome/fontawesome-free/css/all.min.css";


// require('dotenv').config();

// Load environment variables from .env file
// dotenv.config({ path: path.join(__dirname, '../.env') });?

const root = ReactDOM.createRoot(document.getElementById('container_id'));
root.render(
    <App/>

);
