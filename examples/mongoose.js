const OAuth = require('node-wechat-oauth');
const Token = require('./token.model');

const client = new OAuth('your appid', 'your secret', Token.getToken, Token.setToken);
