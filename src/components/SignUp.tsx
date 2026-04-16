import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, TextField, Typography, Alert, Card, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import ChipSelector from './ChipSelector';
import AvailabilitySelector from './AvailabilitySelector';
import { MEDICATIONS, ALLERGIES, SPECIALIZATIONS } from '../constants/selectorOptions';
import { PersonPin, Work } from '@mui/icons-material';
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

        {step === 1 && (
          <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={3}>
            <TextField label="First Name" value={userFormData.first_name} onChange={(e) => setUserFormData({ ...userFormData, first_name: e.target.value })} fullWidth />
            <TextField label="Middle Name" value={userFormData.middle_name} onChange={(e) => setUserFormData({ ...userFormData, middle_name: e.target.value })} fullWidth />
            <TextField label="Last Name" value={userFormData.last_name} onChange={(e) => setUserFormData({ ...userFormData, last_name: e.target.value })} fullWidth />
            <TextField label="Email" type="email" value={userFormData.email} onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })} fullWidth />
            <TextField label="Password" type="password" value={userFormData.password} onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })} fullWidth />
            <Button
              type="button"
              onClick={() => setStep(2)}
              variant="contained"
              fullWidth
              sx={{ backgroundColor: '#7B2FBE', py: 1.5, '&:hover': { backgroundColor: '#6a0dad' } }}
            >
              Next
            </Button>
          </Box>
        )}

        {step === 2 && (
          <>
            <Box display="flex" gap={3} justifyContent="center" mt={3}>
              <Card
                onClick={() => { setRole('client'); setStep(3); }}
                sx={{ width: 200, p: 3, cursor: 'pointer', textAlign: 'center', border: role === 'client' ? '2px solid #7B2FBE' : '2px solid transparent' }}
              >
                <PersonPin sx={{ fontSize: 60, color: '#7B2FBE' }} />
                <Typography variant="h6">Client</Typography>
              </Card>
              <Card
                onClick={() => { setRole('support_worker'); setStep(3); }}
                sx={{ width: 200, p: 3, cursor: 'pointer', textAlign: 'center', border: role === 'support_worker' ? '2px solid #7B2FBE' : '2px solid transparent' }}
              >
                <Work sx={{ fontSize: 60, color: '#7B2FBE' }} />
                <Typography variant="h6">Support Worker</Typography>
              </Card>
            </Box>
            <Box display="flex" justifyContent="center" mt={4}>
              <Button
                type="button"
                variant="outlined"
                onClick={() => setStep(1)}
                sx={{ px: 9, color: '#7B2FBE', borderColor: '#7B2FBE' }}
              >
                Back
              </Button>
            </Box>
          </>
        )}

        {step === 3 && (
          <Box display="flex" flexDirection="column" gap={3} mt={3}>
            {role === 'client' && (
              <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={3}>
                <TextField label="Age" type="number" value={profileData.age} onChange={(e) => setProfileData({ ...profileData, age: e.target.value })} fullWidth />
                {genderSelect}
                <TextField label="Phone" value={profileData.phone} onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })} fullWidth />
                <TextField label="Location" value={profileData.location} onChange={(e) => setProfileData({ ...profileData, location: e.target.value })} fullWidth />
                <TextField label="Bio" multiline rows={3} value={profileData.bio} onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })} fullWidth />
                <TextField label="Health Conditions" value={profileData.health_conditions} onChange={(e) => setProfileData({ ...profileData, health_conditions: e.target.value })} fullWidth />
                <ChipSelector label="Medication" options={MEDICATIONS} value={selectedMedications} onChange={setSelectedMedications} />
                <ChipSelector label="Allergies" options={ALLERGIES} value={selectedAllergies} onChange={setSelectedAllergies} />
                <TextField label="Emergency Contact First Name" value={profileData.emergency_contact_first_name} onChange={(e) => setProfileData({ ...profileData, emergency_contact_first_name: e.target.value })} fullWidth />
                <TextField label="Emergency Contact Last Name" value={profileData.emergency_contact_last_name} onChange={(e) => setProfileData({ ...profileData, emergency_contact_last_name: e.target.value })} fullWidth />
                <TextField label="Emergency Contact Phone" value={profileData.emergency_contact_phone} onChange={(e) => setProfileData({ ...profileData, emergency_contact_phone: e.target.value })} fullWidth />
                {backAndSubmitButtons}
              </Box>
            )}
            {role === 'support_worker' && (
              <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={3}>
                <TextField label="Age" type="number" value={profileData.age} onChange={(e) => setProfileData({ ...profileData, age: e.target.value })} fullWidth />
                {genderSelect}
                <TextField label="Phone" value={profileData.phone} onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })} fullWidth />
                <TextField label="Location" value={profileData.location} onChange={(e) => setProfileData({ ...profileData, location: e.target.value })} fullWidth />
                <TextField label="Bio" multiline rows={3} value={profileData.bio} onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })} fullWidth />
                <TextField label="Experience" multiline rows={3} value={profileData.experience} onChange={(e) => setProfileData({ ...profileData, experience: e.target.value })} fullWidth />
                <AvailabilitySelector value={profileData.availability} onChange={(v) => setProfileData({ ...profileData, availability: v })} />
                <ChipSelector label="Specializations" options={SPECIALIZATIONS} value={selectedSpecializations} onChange={setSelectedSpecializations} />
                <TextField label="Emergency Contact First Name" value={profileData.emergency_contact_first_name} onChange={(e) => setProfileData({ ...profileData, emergency_contact_first_name: e.target.value })} fullWidth />
                <TextField label="Emergency Contact Last Name" value={profileData.emergency_contact_last_name} onChange={(e) => setProfileData({ ...profileData, emergency_contact_last_name: e.target.value })} fullWidth />
                <TextField label="Emergency Contact Phone" value={profileData.emergency_contact_phone} onChange={(e) => setProfileData({ ...profileData, emergency_contact_phone: e.target.value })} fullWidth />
                {backAndSubmitButtons}
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}
export default SignUp;
