const fetch = require('node-fetch');

const get = async (url, options) => {
  const res = await fetch(url, options);
  const data = await res.json();
  return data;
};

module.exports = {
  get,
};
