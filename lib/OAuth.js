const querystring = require('querystring');
const AccessToken = require('./AccessToken');
const http = require('./http');

class OAuth {
  /**
   * 根据appid和appsecret创建OAuth接口
   *
   * @param {String} appid 在公众平台上申请得到的appid
   * @param {String} appsecret 在公众平台上申请得到的app secret
   * @param {Function} getToken 用于获取token的方法 异步操作需返回Promise
   * @param {Function} saveToken 用于保存token的方法 异步操作需返回Promise
   */
  constructor(appid, appsecret, getToken, saveToken) {
    this.appid = appid;
    this.appsecret = appsecret;
    // token的获取和存储
    this.store = {};
    this.getToken = getToken || (openid => this.store[openid]);
    if (!saveToken && process.env.NODE_ENV === 'production') {
      console.warn('Please dont save oauth token into memory under production');
    }
    this.saveToken = saveToken || ((openid, token) => {
      this.store[openid] = token;
    });
    // 默认请求参数
    this.defaults = {};
  }

  /**
   * 用于设置urllib的默认options
   *
   * Examples:
   * ```
   * oauth.setOptions({ timeout: 15000 });
   * ```
   * @param {Object} options 默认选项
   */
  setOptions(options) {
    this.defaults = options;
  }

  /**
   * 通过urllib请求微信接口的封装
   *
   * 返回结果参见：http://mp.weixin.qq.com/wiki/index.php?title=返回码说明
   * @param {String} url 路径
   * @param {Object} opts urllib选项
   * @return {Promise} 对返回结果的一层封装，如果遇见微信返回的错误，将返回一个错误
   */
  async request(url, params) {
    try {
      const data = await http.get(`${url}?${querystring.stringify(params)}`, this.defaults);
      // const result = await urllib.request(url, options);
      // const { data } = result;
      if (data.errcode) {
        const error = new Error(data.errmsg);
        error.code = data.errcode;
        throw error;
      }
      return data;
    } catch (e) {
      if (e.name !== 'WeChatAPIError') {
        e.name = `WeChatAPI${e.name}`;
      }
      throw e;
    }
  }

  /**
   * 获取授权页面的URL地址
   *
   * @param {String} redirect 授权后要跳转的地址
   * @param {String} state 开发者可提供的数据
   * @param {String} scope 作用范围，值为snsapi_userinfo和snsapi_base，前者用于弹出，后者用于跳转
   * @return {String}
   */
  getAuthorizeURL(redirect, state, scope) {
    const url = 'https://open.weixin.qq.com/connect/oauth2/authorize';
    const info = {
      appid: this.appid,
      redirect_uri: redirect,
      response_type: 'code',
      scope: scope || 'snsapi_base',
      state: state || '',
    };

    return `${url}?${querystring.stringify(info)}#wechat_redirect`;
  }

  /**
   * 获取授权页面的URL地址
   * @param {String} redirect 授权后要跳转的地址
   * @param {String} state 开发者可提供的数据
   * @param {String} scope 作用范围，值为snsapi_login，前者用于弹出，后者用于跳转
   * @return {String}
   */
  getAuthorizeURLForWebsite(redirect, state, scope) {
    const url = 'https://open.weixin.qq.com/connect/qrconnect';
    const info = {
      appid: this.appid,
      redirect_uri: redirect,
      response_type: 'code',
      scope: scope || 'snsapi_login',
      state: state || '',
    };

    return `${url}?${querystring.stringify(info)}#wechat_redirect`;
  }

  /**
   * 请求／刷新token，并保存，更新过期时间
   * 
   * @param {Object} url 
   * @param {Object} args
   * @return {Promise} AccessToken实例|Error
   * @api private
   */
  async requestAndProcessAccessToken(url, args) {
    const createAt = Date.now();
    const data = await this.request(url, args);
    data.create_at = createAt;
    await this.saveToken(data.openid, data);

    return new AccessToken(data);
  }

  /**
   * 根据授权获取到的code，换取access token和openid
   * 获取openid之后，可以调用`wechat.API`来获取更多信息
   * Examples:
   * ```
   * const accessToken = await api.getAccessToken(code);
   * ```
   * resolved Promise:
   * ```
   * {
   *   "access_token": "ACCESS_TOKEN",
   *   "expires_in": 7200,
   *   "refresh_token": "REFRESH_TOKEN",
   *   "openid": "OPENID",
   *   "scope": "SCOPE"
   * }
   * ```
   * @param {String} code 授权获取到的code
   * @return {Promise} AccessToken实例|获取access token出现异常时的异常对象
   */
  async getAccessToken(code) {
    const url = 'https://api.weixin.qq.com/sns/oauth2/access_token';
    const params = {
      code,
      appid: this.appid,
      secret: this.appsecret,
      grant_type: 'authorization_code',
    };

    return this.requestAndProcessAccessToken(url, params);
  }

  /**
   * 根据refresh token，刷新access token，调用getAccessToken后才有效
   * Examples:
   * ```
   * const accessToken = await api.refreshAccessToken(refreshToken);
   * ```
   * resolved Promise:
   * ```
   * {
   *   "access_token": "ACCESS_TOKEN",
   *   "expires_in": 7200,
   *   "refresh_token": "REFRESH_TOKEN",
   *   "openid": "OPENID",
   *   "scope": "SCOPE"
   * }
   * ```
   * @param {String} refreshToken refreshToken
   * @return {Promise} 新的token|刷新access token出现异常时的异常对象
   */
  async refreshAccessToken(refreshToken) {
    const url = 'https://api.weixin.qq.com/sns/oauth2/refresh_token';
    const params = {
      appid: this.appid,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    };

    return this.requestAndProcessAccessToken(url, params);
  }

  /**
   * @param {Object} options
   * @param {String} accessToken 
   * @return {Promise}
   * @api private
   */
  getUserByToken(options, accessToken) {
    const url = 'https://api.weixin.qq.com/sns/userinfo';
    const { openid, lang = 'en' } = options;
    const params = {
      access_token: accessToken,
      openid,
      lang,
    };
    return this.request(url, params);
  }

  /**
   * 根据openid，获取用户信息
   * 当access token无效时，自动通过refresh token获取新的access token。然后再获取用户信息
   * Examples:
   * ```
   * const user = await api.getUser(options);
   * ```
   *
   * Options:
   * ```
   * openId
   * // 或
   * {
   *  "openid": "the open Id", // required
   *  "access_token": 'access token', // required
   *  "lang": "the lang code" // zh_CN 简体，zh_TW 繁体，en 英语
   * }
   * ```
   * resolved Promise:
   * ```
   * {
   *  "openid": "OPENID",
   *  "nickname": "NICKNAME",
   *  "sex": "1",
   *  "province": "PROVINCE"
   *  "city": "CITY",
   *  "country": "COUNTRY",
   *  "headimgurl": "http://wx.qlogo.cn/mmopen/g3MonUZtNHkdmzicIlibx6iaFqAc56vxLSUfpb6n5WKSYVY0ChQKkiaJSgQ1dZuTOgvLLrhJbERQQ4eMsv84eavHiaiceqxibJxCfHe/46",
   *  "privilege": [
   *    "PRIVILEGE1"
   *    "PRIVILEGE2"
   *  ]
   * }
   * ```
   * @param {Object|String} opts 传入openid或者参见opts
   * @return {Promise} 用户信息|获取用户信息出现异常时的异常对象
   */
  async getUser(opts) {
    let options = opts;
    if (typeof opts !== 'object') {
      options = { openid: opts };
    }

    const tokenData = await this.getToken(options.openid);
    // 没有token数据
    if (!tokenData) {
      const error = new Error(`No token for ${options.openid}, please authorize first.`);
      error.name = 'NoOAuthTokenError';
      throw error;
    }

    let token = new AccessToken(tokenData);
    if (!token.isValid()) {
      token = await this.refreshAccessToken(token.data.refresh_token);
    }
    const user = await this.getUserByToken(options, token.data.access_token);
    return user;
  }

  /**
   * 检验授权凭证（access_token）是否有效
   * Examples:
   * ```
   * const isValid = await api.verifyToken(openid, accessToken);
   * ```
   * @param {String} openid 传入openid
   * @param {String} accessToken 待校验的access token
   * @param {Promise}
   */
  verifyToken(openid, accessToken) {
    const url = 'https://api.weixin.qq.com/sns/auth';
    const params = {
      access_token: accessToken,
      openid,
    };

    return this.request(url, params);
  }

  /**
   * 根据code，获取用户信息
   * Examples:
   * ```
   * const user = await api.getUserByCode(code);
   * ```
   *
   * resolved Promise: 成功时得到的响应结果
   * ```
   * {
   *  "openid": "OPENID",
   *  "nickname": "NICKNAME",
   *  "sex": "1",
   *  "province": "PROVINCE"
   *  "city": "CITY",
   *  "country": "COUNTRY",
   *  "headimgurl": "http://wx.qlogo.cn/mmopen/g3MonUZtNHkdmzicIlibx6iaFqAc56vxLSUfpb6n5WKSYVY0ChQKkiaJSgQ1dZuTOgvLLrhJbERQQ4eMsv84eavHiaiceqxibJxCfHe/46",
   *  "privilege": [
   *    "PRIVILEGE1"
   *    "PRIVILEGE2"
   *  ]
   * }
   * ```
   * @param {Object|String} options {code, lang} | code 授权获取到的code
   * @return {Promise} 用户信息
   */
  async getUserByCode(options) {
    let lang;
    let code;
    if (typeof options === 'string') {
      code = options;
    } else {
      lang = options.lang;
      code = options.code;
    }

    const tokenData = await this.getAccessToken(code);
    const user = await this.getUser({ openid: tokenData.data.openid, lang });
    return user;
  }
}

module.exports = OAuth;
