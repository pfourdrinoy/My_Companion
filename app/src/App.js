import './App.css';
import React from 'react';
import { DogRunner, ProgressBars  } from './DogRunner';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  return (
    <>
      <header>My Companion</header>
      <DogRunner />
      <ProgressBars />
    </>
  );
}

export default App;
