import { useState, useEffect } from 'react';
import instance from '../services/api-client';

function authProvider() {
  const [user, setUser] = useState(null);

  const getUser = async () => {
    try {
      const response = await instance.get('user');
      setUser(response.data);
    } catch (error) {
      console.log(error)
      }
  }
}
