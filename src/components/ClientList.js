// src/components/ClientList.js
import React, { useState, useEffect } from 'react';
import axios from '../api/axiosConfig';

function ClientList() {
  const [clients, setClients] = useState([]);

  useEffect(() => {
    axios.get('/clients')
      .then(response => {
        setClients(response.data);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
  }, []);

  return (
    <div>
      <h1>Clients</h1>
      <ul>
        {clients.map(client => (
          <li key={client.id}>{client.name}</li>
        ))}
      </ul>
    </div>
  );
}

export default ClientList;
