import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, TextField, Typography, Alert } from '@mui/material';
import axiosInstance from '../api/axiosConfig';


const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);
  const [csrfToken, setCsrfToken] = useState(''); 

  const hasFetchcsrf = useRef(false)

  useEffect( () => {
    if (!hasFetchcsrf.current)
{    const fetchcsrf = async () => {
    try{
      const response = await axiosInstance.get('/csrf_token')
      setCsrfToken(response.data.csrf_token);
      hasFetchcsrf.current = true
    } catch(error) {
    }
  }
  fetchcsrf()}
}
  , []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const response = await axiosInstance.post('/users', {
        user: {
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        middle_name: middleName
      }
      }, {
        headers: {
          'X-CSRF-Token': csrfToken,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
      setSuccess(true);
      setErrors([]);
    } catch (err: any) {
      setErrors(err.response.data.errors || ['An error occurred']);
      setSuccess(false);
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
      <Box sx={{ width: 560 }}>
        <Typography variant="h4" fontWeight="bold" mb={1} color="#7B2FBE">
          Create account
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={4}>
          Sign up to get started
        </Typography>
        {errors.length > 0 &&
          errors.map((msg) => (
          <Alert severity="error" sx={{ mb: 3 }} key={msg}>
            {msg}
          </Alert>
          ))
        }
        {success && <Alert severity="success" sx={{ mb: 3 }}>Account created successfully!</Alert>}
        <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={3}>
          <TextField label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} fullWidth />
          <TextField label="Middle Name" value={middleName} onChange={(e) => setMiddleName(e.target.value)} fullWidth />
          <TextField label="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} fullWidth />
          <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
          <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} fullWidth />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{ backgroundColor: '#7B2FBE', py: 1.5, '&:hover': { backgroundColor: '#6a0dad' } }}
          >
            Sign Up
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
export default SignUp;
