# Wechat OAuth

[![NPM version](https://badge.fury.io/js/node-wechat-oauth.svg)](http://badge.fury.io/js/node-wechat-oauth)
[![Build Status](https://travis-ci.org/samuraime/wechat-oauth.svg)](https://travis-ci.org/samuraime/wechat-oauth)
[![Dependencies Status](https://david-dm.org/samuraime/wechat-oauth.svg)](https://david-dm.org/samuraime/wechat-oauth)
[![Coverage Status](https://coveralls.io/repos/samuraime/wechat-oauth/badge.svg)](https://coveralls.io/r/samuraime/wechat-oauth)

微信公众平台OAuth

此repo用```async/await```重写了[node-webot/wechat-oauth](https://github.com/node-webot/wechat-oauth)

## Features

- OAuth授权
- 获取基本信息

## Installation

```sh
npm install node-node-wechat-oauth --save
```

## Docs

文档在[这里](docs)

## Usage

### 初始化

```js
const OAuth = require('node-wechat-oauth');
const client = new OAuth('your appid', 'your secret');
```

以上即可满足单进程使用  
当多进程时, token需要全局维护, 以下为保存token的接口

```js
const client = new OAuth('appid', 'secret', async (openid) => {
  // 传入一个根据openid获取对应的全局token的方法
  const txt = await fs.readFile(`${openid}:access_token.txt`, 'utf8');
  return JSON.parse(txt);
}, async (openid, token) => {
  // 请将token存储到全局, 跨进程、跨机器级别的全局, 比如写到数据库、redis等
  // 这样才能在cluster模式及多机情况下使用, 以下为写入到文件的示例
  // 持久化时请注意, 每个openid都对应一个唯一的token!
  await fs.writeFile(`${openid}:access_token.txt`, JSON.stringify(token));
});
```

全局维护AccessToken的示例代码:

[Mongoose](examples/mongoose.js) | [MySQL](examples/mysql.js)

### 引导用户

生成引导用户点击的URL

```js
const url = client.getAuthorizeURL('redirectUrl', 'state', 'scope');
```

如果是PC上的网页, 请使用以下方式生成

```js
const url = client.getAuthorizeURLForWebsite('redirectUrl');
```

### 获取OpenID和AccessToken

用户点击上步生成的URL后会被重定向到上步设置的 `redirectUrl`, 并且会带有`code`参数, 我们可以使用这个`code`换取`access_token`和用户的`openid`

```js
const result = await client.getAccessToken('code');
const accessToken = result.data.access_token;
const openid = result.data.openid;
```

### 获取用户信息

如果我们生成引导用户点击的URL中`scope`参数值为`snsapi_userinfo`, 接下来我们就可以使用`openid`换取用户详细信息 ( 必须在getAccessToken方法执行完成之后 ) 

```js
const userinfo = await client.getUser(openid);
```

## License

MIT
