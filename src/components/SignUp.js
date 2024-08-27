import React, { useState } from 'react';
import axios from 'axios';

const SignUp = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const getCsrfToken = () => {
    return document.querySelector('meta[name="csrf-token"]').getAttribute('content');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:9292/api/users', {
        user: {
          name,
          email,
          password
        }
      }, {
        headers: {
          'X-CSRF-Token': getCsrfToken(), // Include CSRF token
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
      setSuccess(response.data.status);
      setError(null);
    } catch (error) {
      if (error.response) {
        setError(error.response.data.errors);
      }
      setSuccess(null);
    }
  };

  return (
    <div>
      <h2>Sign Up</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Sign Up</button>
      </form>
      {error && <div style={{ color: 'red' }}>{error.join(', ')}</div>}
      {success && <div style={{ color: 'green' }}>Sign up successful!</div>}
    </div>
  );
};

export default SignUp;
