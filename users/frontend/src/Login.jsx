import { useEffect, useState } from "react";

function Login() {
    const [users, setUsers] = useState([]);

    const [showCreate, setShowCreate] = useState(false);

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const [editingId, setEditingId] = useState(null);

    // Get all users
    function loadUsers() {
        fetch("http://localhost:5000/users")
            .then((response) => response.json())
            .then((data) => {
                setUsers(data);
            })
            .catch((error) => {
                console.log("Error loading users:", error);
            });
    }

    // Load users when page opens
    useEffect(() => {
        loadUsers();
    }, []);

    // Create user
    function handleCreate(e) {
        e.preventDefault();

        if (!username.trim() || !password.trim()) {
            alert("Username and password cannot be empty");
            return;
        }

        fetch("http://localhost:5000/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username: username.trim(),
                password: password,
            }),
        })
            .then((response) => response.text())
            .then((data) => {
                alert(data);

                setUsername("");
                setPassword("");
                setShowCreate(false);

                loadUsers();
            })
            .catch((error) => {
                console.log("Error creating user:", error);
            });
    }

    // Start update
    function startUpdate(user) {
        setEditingId(user.id);
        setUsername(user.username);
        setPassword(user.password);
    }

    // Update user
    function handleUpdate(id) {
        if (!username.trim() || !password.trim()) {
            alert("Username and password cannot be empty");
            return;
        }

        fetch(`http://localhost:5000/users/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username: username.trim(),
                password: password,
            }),
        })
            .then((response) => response.text())
            .then((data) => {
                alert(data);

                setEditingId(null);
                setUsername("");
                setPassword("");

                loadUsers();
            })
            .catch((error) => {
                console.log("Error updating user:", error);
            });
    }

    // Delete user
    function handleDelete(id) {
        if (!window.confirm("Are you sure you want to delete this user?")) {
            return;
        }

        fetch(`http://localhost:5000/users/${id}`, {
            method: "DELETE",
        })
            .then((response) => response.text())
            .then((data) => {
                alert(data);

                loadUsers();
            })
            .catch((error) => {
                console.log("Error deleting user:", error);
            });
    }

    return (
        <div>
            <h2>Users</h2>

            {/* Create User Button */}
            <button
                onClick={() => {
                    setShowCreate(!showCreate);

                    setEditingId(null);
                    setUsername("");
                    setPassword("");
                }}
            >
                + Create User
            </button>

            {/* Create User Form */}
            {showCreate && (
                <form onSubmit={handleCreate}>
                    <br />

                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />

                    <input
                        type="text"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <button type="submit">Create</button>

                    <button
                        type="button"
                        onClick={() => {
                            setShowCreate(false);
                            setUsername("");
                            setPassword("");
                        }}
                    >
                        Cancel
                    </button>
                </form>
            )}

            <br />

            <table border="1">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Username</th>
                        <th>Password</th>
                        <th>Actions</th>
                    </tr>
                </thead>

                <tbody>
                    {users.map((user) => (
                        <tr key={user.id}>
                            {/* ID */}
                            <td>{user.id}</td>

                            <td>
                                {editingId === user.id ? (
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) =>
                                            setUsername(e.target.value)
                                        }
                                    />
                                ) : (
                                    user.username
                                )}
                            </td>

                            {/* Password */}
                            <td>
                                {editingId === user.id ? (
                                    <input
                                        type="text"
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(e.target.value)
                                        }
                                    />
                                ) : (
                                    user.password
                                )}
                            </td>

                            {/* Actions */}
                            <td>
                                {editingId === user.id ? (
                                    <>
                                        <button
                                            onClick={() =>
                                                handleUpdate(user.id)
                                            }
                                        >
                                            Save
                                        </button>

                                        <button
                                            onClick={() => {
                                                setEditingId(null);
                                                setUsername("");
                                                setPassword("");
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => startUpdate(user)}
                                        >
                                            Update
                                        </button>

                                        <button
                                            onClick={() =>
                                                handleDelete(user.id)
                                            }
                                        >
                                            Delete
                                        </button>
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default Login;
