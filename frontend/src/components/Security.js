// frontend/src/components/Security.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Security({ securityId }) {
  const [security, setSecurity] = useState(null);

  useEffect(() => {
    axios.get(`http://localhost:5000/securities/${securityId}`)
      .then(response => {
        setSecurity(response.data);
      })
      .catch(error => {
        console.error('Error fetching security:', error);
      });
  }, [securityId]);

  if (!security) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>{security.security_long_name}</h1>
      <p>Security ID: {security.security_id}</p>
      <p>Short Name: {security.security_short_name}</p>
      {/* Add more details as needed */}
    </div>
  );
}

export default Security;
