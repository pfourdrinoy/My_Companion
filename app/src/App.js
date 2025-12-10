import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { DogRunner, ProgressBars } from "./DogRunner";
import Login from "./Login";
import CreateDog from "./CreateDog";
import "bootstrap/dist/css/bootstrap.min.css";

function Dashboard({ onLogout }) {
  const navigate = useNavigate();
  return (
    <div className="container mt-3">
      <div className="text-end mb-3">
        <button className="btn btn-danger" onClick={onLogout}>
          Déconnexion
        </button>
        <button className="btn btn-primary" onClick={() => navigate("/create-dog")}>
          Créer mon chien
        </button>
      </div>
      <DogRunner />
      <ProgressBars />
    </div>
  );
}

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));

  const handleLogin = (jwt) => {
    localStorage.setItem("token", jwt);
    setToken(jwt);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  const isLoggedIn = !!token;

  return (
    <Router>
      <header className="p-3 bg-dark text-white">My Companion</header>

      <Routes>
        {/* Route login */}
        <Route
          path="/login"
          element={isLoggedIn ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />}
        />

        {/* Route dashboard protégée */}
        <Route
          path="/dashboard"
          element={isLoggedIn ? <Dashboard onLogout={handleLogout} /> : <Navigate to="/login" />}
        />

        {/* Route création de chien protégée */}
        <Route
          path="/create-dog"
          element={isLoggedIn ? <CreateDog /> : <Navigate to="/login" />}
        />

        {/* Redirection par défaut */}
        <Route path="*" element={<Navigate to={isLoggedIn ? "/dashboard" : "/login"} />} />
      </Routes>
    </Router>
  );
}

export default App;
