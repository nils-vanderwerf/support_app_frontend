import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '../api/axiosConfig';


const SignUp = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [csrfToken, setCsrfToken] = useState(''); 

  const hasFetchcsrf = useRef(false)

  useEffect( () => {
    if (!hasFetchcsrf)
{    const fetchcsrf = async () => {
    try{
      const response = await axiosInstance.get('/csrf_token')
              console.log('Data Object:', response);
        console.log('CSRF Token fetched:', response.data.csrf_token);

        setCsrfToken(response.data.csrf_token);
        hasFetchcsrf.current = true
    } catch(error) {
        console.error('There was a problem fetching the CSRF token:', error);

    }
  }
  fetchcsrf()}
}
  , []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      console.log('CSRF Token used in request:', csrfToken);
      const response = await axiosInstance.post('/users', {
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
