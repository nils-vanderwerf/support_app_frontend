import React, { useState, useEffect } from 'react';
import axios from 'axios';

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
      <div className="row">
        {clients.map(client => (
          <div key={client.id} className="col-sm-12 col-md-6 col-lg-4 mb-4">
            <div className="card">
              <div className="card-body">
                <h3 className="card-title">{client.name}</h3>
                <h4 className="card-subtitle mb-2 text-muted">Age: {client.age}</h4>
                <p className="card-text">Health Conditions: {client.health_conditions}</p>
                <p className="card-text">Medications: {client.medication}</p>
                <p className="card-text">Allergies: {client.allergies}</p>
                <p className="card-text">Phone: {client.phone}</p>
                <p className="card-text">Emergency Contact: {client.emergency_contact_name} ({client.emergency_contact_phone})</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClientList;
