import { useEffect, useState } from "react";
import "./App.css";

export default function App() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  // Runs once when the page loads: ask the Django API for the items.
  useEffect(() => {
    fetch("/api/items/")
      .then((res) => {
        if (!res.ok) throw new Error("Request failed");
        return res.json();
      })
      .then((data) => setItems(data))
      .catch(() => setError("Could not load items. Is the Django server running?"));
  }, []);

  return (
    <main className="container">
      <h1>Items</h1>
      <p className="subtitle">Data loaded from the Django REST API at /api/items/</p>

      {error && <p className="error">{error}</p>}
      {!error && items.length === 0 && <p>No items yet. Add some in the admin panel.</p>}

      <div className="grid">
        {items.map((item) => (
          <div className="card" key={item.id}>
            {item.image && <img src={item.image} alt={item.name} />}
            <h2>{item.name}</h2>
            <p>{item.description}</p>
            <p className="price">Rs. {item.price}</p>
            <p className="meta">
              Quantity: {item.quantity}
              <span className={item.is_available ? "badge ok" : "badge no"}>
                {item.is_available ? "Available" : "Unavailable"}
              </span>
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
