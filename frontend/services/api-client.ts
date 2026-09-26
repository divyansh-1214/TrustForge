import axios from "axios";
const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL;
console.log(baseURL)
const instance = axios.create({
  baseURL: baseURL,
  timeout: 5000,
  headers: { "X-Custom-Header": "foobar" },
});

export default instance;
