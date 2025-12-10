import React, { useState } from "react";
const API_URL = process.env.REACT_APP_API_URL;

function CreateDog({ onLogin }) {
  const [dogname, setUsername] = useState("");
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_URL}/dogs/create_dog`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          name: dogname,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur création");
      }

      const data = await response.json();
      localStorage.setItem("token", data.access_token);
      onLogin(data.access_token);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="container mt-5">
      <h2>Connexion</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label>Surnom</label>
          <input
            type="text"
            className="form-control"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary">
          Créer
        </button>
      </form>
    </div>
  );
}

export default Login;
