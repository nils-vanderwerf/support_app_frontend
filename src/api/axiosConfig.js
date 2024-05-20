// src/api/axiosConfig.js
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:9292/api', // Set your Rails API base URL here
});

export default axiosInstance;
