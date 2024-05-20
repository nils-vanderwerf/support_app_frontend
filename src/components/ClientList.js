import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

const ClientList = () => {
  const [clients, setClients] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:9292/api/clients');
        setClients(response.data);
      } catch (error) {
        console.error('Error fetching data: ', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="container mt-5">
      <h1 className="text-center mb-5">Clients</h1>
      <div className="row">
        {clients.map(client => (
          <div key={client.id} className="col-sm-12 col-md-6 col-lg-3 mb-4">
            <div className="card h-100">
              <div className="card-body">
                <h5 className="card-title">{client.name}</h5>
                <h6 className="card-subtitle mb-2 text-muted">Age: {client.age}</h6>
                <p className="card-text"><strong>Health Conditions:</strong> {client.health_conditions}</p>
                <p className="card-text"><strong>Medications:</strong> {client.medication}</p>
                <p className="card-text"><strong>Allergies:</strong> {client.allergies}</p>
                <p className="card-text"><strong>Phone:</strong> {client.phone}</p>
                <p className="card-text"><strong>Emergency Contact:</strong> {client.emergency_contact_name} ({client.emergency_contact_phone})</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClientList;
