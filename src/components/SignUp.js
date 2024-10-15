import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SignUp = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [csrfToken, setCsrfToken] = useState(''); 

  useEffect(() => {
    axios.get('/api/csrf_token')
      .then(response => {
        console.log('CSRF Token fetched:', response.data.csrf_token);
        setCsrfToken(response.data.csrf_token);
      })
      .catch(error => {
        console.error('There was a problem fetching the CSRF token:', error);
      });
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      console.log('CSRF Token used in request:', csrfToken);
      const response = await axios.post('http://localhost:9292/api/users', {
        user: {
          name,
          email,
          password
        }
      }, {
        headers: {
          'X-CSRF-Token': csrfToken,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
      console.log('User created successfully:', response.data);
      setSuccess(true);
      setError(null);
    } catch (error) {
      console.error('There was a problem with the sign-up request:', error);
      setError(error.response.data.errors || ['An error occurred']);
      setSuccess(false);
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
}
export default SignUp;
