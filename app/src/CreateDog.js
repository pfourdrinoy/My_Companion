import React, { useState } from "react";
const API_URL = process.env.REACT_APP_API_URL;

function CreateDog() {
    const [dogname, setDogname] = useState("");
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${API_URL}/dogs/create_dog`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Authorization": `Bearer ${token}`
                },
                body: new URLSearchParams({
                    name: dogname,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || "Erreur création du chien");
            }

            setSuccess(true);
            setDogname("");
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="container mt-5">
            <h2>Créer un chien</h2>

            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">Chien créé avec succès !</div>}

            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label>Surnom</label>
                    <input
                        type="text"
                        className="form-control"
                        value={dogname}
                        onChange={(e) => setDogname(e.target.value)}
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

export default CreateDog;