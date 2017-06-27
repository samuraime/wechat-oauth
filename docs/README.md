# Table of Contents

- [Class: AccessToken](#accesstoken)

  - [new AccessToken(data)](#new-accesstokendata)
  - [accessToken.isValid()](#accesstokenisvalid)

- [Class: OAuth](#oauth)

  - [new OAuth(appid, appsecret[, getToken[, saveToken]])](#new-oauthnew-oauthappid-appsecret-gettoken-savetoken)
  - [oauth.setOptions(options)](#oauthsetoptionsoptions)
  - [oauth.getAuthorizeURL(redirect[, state[, scope]])](#oauthgetauthorizeurlredirect-state-scope)
  - [oauth.getAuthorizeURLForWebsite(redirect[, state[, scope]])](#oauthgetauthorizeurlforwebsiteredirect-state-scope)
  - [oauth.getAccessToken(code)](#oauthgetaccesstokencode)
  - [oauth.refreshAccessToken(refreshToken)](#oauthrefreshaccesstokenrefreshtoken)
  - [oauth.getUser(openid[, lang])](#oauthgetuseropenid-lang)
  - [oauth.getUserByCode(code[, lang])](#oauthgetuserbycodecode-lang)
  - [oauth.verifyToken(openid, accessToken)](#oauthverifytokenopenid-accesstoken)

## AccessToken

### new AccessToken(data)

### accessToken.isValid()

accessToken是否有效

## OAuth

### new OAuth(new OAuth(appid, appsecret[, getToken[, saveToken]])

  - `appid` _(String)_ 在公众平台上申请得到的appid
  - `appsecret` _(String)_ 在公众平台上申请得到的app secret
  - `getToken` _(Function)_ 用于获取token的方法 异步操作需返回Promise
  - `saveToken` _(Function)_ 用于保存token的方法 异步操作需返回Promise

### oauth.setOptions(options)

  - `options` _(Object)_ `node-fetch`参数

设置授权请求的参数, 同`node-fetch`

```js
oauth.setOptions({ timeout: 15000 });
```

### oauth.getAuthorizeURL(redirect[, state[, scope]])
  - `redirect` _(String)_ 授权后要跳转的地址
  - `state` _(String)_ 开发者可提供的数据
  - `scope` _(String)_ 作用范围, 值为`snsapi_userinfo`和`snsapi_base`, 默认值为`snsapi_base`
  - **Returns** _(String)_ url

获取授权页面的URL地址

### oauth.getAuthorizeURLForWebsite(redirect[, state[, scope]])

  - `redirect` _(String)_ 授权后要跳转的地址
  - `state` _(String)_ 开发者可提供的数据
  - `scope` _(String)_ 作用范围, 默认值为`snsapi_login`
  - **Returns** _(String)_ url

获取授权页面的URL地址

### oauth.getAccessToken(code)

  - `code` _(String)_ 授权获取到的code
  - **Returns** `AccessToken`

根据授权获取到的code, 换取access token和openid  
获取openid之后, 可以调用`wechat.API`来获取更多信息

```js
const accessToken = await oauth.getAccessToken(code);
```
成功时结果:

```json
{
  "access_token": "ACCESS_TOKEN",
  "expires_in": 7200,
  "refresh_token": "REFRESH_TOKEN",
  "openid": "OPENID",
  "scope": "SCOPE"
}
```

### oauth.refreshAccessToken(refreshToken)

  - `refreshToken` _(String)_
  - **Returns** `AccessToken`

根据refresh token, 刷新access token, 调用getAccessToken后才有效, 结果同```oauth.getAccessToken```

```js
const accessToken = await oauth.refreshAccessToken(refreshToken);
```

### oauth.getUser(openid[, lang])

  - `openid` _(String)_
  - `lang` _(String)_ zh_CN 简体, zh_TW 繁体, en 英语
  - **Returns** 用户信息

根据openid, 获取用户信息  
当access token无效时, 自动通过refresh token获取新的access token, 然后再获取用户信息

```js
const user = await oauth.getUser('code');
```

成功时的结果如下:

```json
{
  "openid": "OPENID",
  "nickname": "NICKNAME",
  "sex": "1",
  "province": "PROVINCE",
  "city": "CITY",
  "country": "COUNTRY",
  "headimgurl": "http://wx.qlogo.cn/mmopen/g3MonUZtNHkdmzicIlibx6iaFqAc56vxLSUfpb6n5WKSYVY0ChQKkiaJSgQ1dZuTOgvLLrhJbERQQ4eMsv84eavHiaiceqxibJxCfHe/46",
  "privilege": [
    "PRIVILEGE1"
    "PRIVILEGE2"
  ]
}
```

### oauth.getUserByCode(code[, lang])

  - `code` _(String)_ 
  - `lang` _(String)_ zh_CN 简体, zh_TW 繁体, en 英语
  - **Returns** 用户信息

根据code, 获取用户信息, 结果同```oauth.getUser```

```js
const user = await oauth.getUserByCode(code);
```

### oauth.verifyToken(openid, accessToken)

检验授权凭证`access_token`是否有效

  - `openid` _(String)_
  - `accessToken` _(String)_
  - **Returns**

```js
const isValid = await oauth.verifyToken(openid, accessToken);
```