import React from 'react';
import { CssBaseline } from '@mui/material';
import SupportWorkerList from './components/SupportWorkerList';
import ClientList from './components/ClientList.js';

const App = () => {
  return (
    <>
      <CssBaseline />
      <SupportWorkerList />
      <ClientList />
    </>
  );
};

export default App;
