const axios = require("axios");

module.exports = axios.create({
  baseURL: "https://petstore.swagger.io/v2",
  timeout: 12000,
  headers: { "Content-Type": "application/json", Accept: "application/json", api_key: "special-key" },
  validateStatus: null
});
