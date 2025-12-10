import "./App.css";
import React, { useState } from "react";
import { DogRunner, ProgressBars } from "./DogRunner";
import Login from "./Login";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));

  const handleLogin = (jwt) => {
    setToken(jwt);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  return (
    <>
      <header className="p-3 bg-dark text-white">My Companion</header>

      {!token ? (
        <Login onLogin={handleLogin} />
      ) : (
        <>
          <div className="container mt-3 text-end">
            <button className="btn btn-danger" onClick={handleLogout}>
              Déconnexion
            </button>
          </div>

          <DogRunner />
          <ProgressBars />
        </>
      )}
    </>
  );
}

export default App;