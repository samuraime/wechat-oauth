const mongoose = require('mongoose');

const { Schema } = mongoose;

const TokenSchema = new Schema({
  access_token: String,
  expires_in: Number,
  refresh_token: String,
  openid: String,
  scope: String,
  create_at: String,
});

TokenSchema.statics = {
  getToken(openid) {
    return this.findOne({ openid });
  },
  setToken(openid, token) {
    const query = { openid };
    const options = { upsert: true };
    return this.update(query, token, options);
  },
};

module.exports = mongoose.model('Token', TokenSchema);
