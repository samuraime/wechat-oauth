/* eslint prefer-arrow-callback: 0 */
/* eslint no-undef: 0 */

const expect = require('expect.js');
const muk = require('muk');
const OAuth = require('../');
const http = require('../lib/http');
const config = require('./config');

describe('oauth.js', function () {
  describe('getAuthorizeURL', function () {
    const auth = new OAuth('appid', 'appsecret');
    it('should ok', function () {
      const url = auth.getAuthorizeURL('http://diveintonode.org/');
      expect(url).to.be.equal('https://open.weixin.qq.com/connect/oauth2/authorize?appid=appid&redirect_uri=http%3A%2F%2Fdiveintonode.org%2F&response_type=code&scope=snsapi_base&state=#wechat_redirect');
    });

    it('should ok with state', function () {
      const url = auth.getAuthorizeURL('http://diveintonode.org/', 'hehe');
      expect(url).to.be.equal('https://open.weixin.qq.com/connect/oauth2/authorize?appid=appid&redirect_uri=http%3A%2F%2Fdiveintonode.org%2F&response_type=code&scope=snsapi_base&state=hehe#wechat_redirect');
    });

    it('should ok with state and scope', function () {
      const url = auth.getAuthorizeURL('http://diveintonode.org/', 'hehe', 'snsapi_userinfo');
      expect(url).to.be.equal('https://open.weixin.qq.com/connect/oauth2/authorize?appid=appid&redirect_uri=http%3A%2F%2Fdiveintonode.org%2F&response_type=code&scope=snsapi_userinfo&state=hehe#wechat_redirect');
    });
  });

  describe('getAuthorizeURLForWebsite', function () {
    const auth = new OAuth('appid', 'appsecret');
    it('should ok', function () {
      const url = auth.getAuthorizeURLForWebsite('http://diveintonode.org/');
      expect(url).to.be.equal('https://open.weixin.qq.com/connect/qrconnect?appid=appid&redirect_uri=http%3A%2F%2Fdiveintonode.org%2F&response_type=code&scope=snsapi_login&state=#wechat_redirect');
    });

    it('should ok with state', function () {
      const url = auth.getAuthorizeURLForWebsite('http://diveintonode.org/', 'hehe');
      expect(url).to.be.equal('https://open.weixin.qq.com/connect/qrconnect?appid=appid&redirect_uri=http%3A%2F%2Fdiveintonode.org%2F&response_type=code&scope=snsapi_login&state=hehe#wechat_redirect');
    });

    it('should ok with state and scope', function () {
      const url = auth.getAuthorizeURLForWebsite('http://diveintonode.org/', 'hehe', 'snsapi_userinfo');
      expect(url).to.be.equal('https://open.weixin.qq.com/connect/qrconnect?appid=appid&redirect_uri=http%3A%2F%2Fdiveintonode.org%2F&response_type=code&scope=snsapi_userinfo&state=hehe#wechat_redirect');
    });
  });

  describe('getAccessToken', function () {
    const api = new OAuth(config.appid, config.appsecret);
    it('should invalid', function (done) {
      api.getAccessToken('code')
        .catch((e) => {
          expect(e).to.be.ok();
          expect(e.name).to.be.equal('WeChatAPIError');
          expect(e.message).to.contain('invalid code');
          done();
        });
    });

    describe('should ok', function () {
      before(function () {
        muk(http, 'get', function () {
          const resp = {
            access_token: 'ACCESS_TOKEN',
            expires_in: 7200,
            refresh_token: 'REFRESH_TOKEN',
            openid: 'OPENID',
            scope: 'SCOPE',
          };
          return Promise.resolve(resp);
        });
      });

      after(function () {
        muk.restore();
      });

      it('should ok', function (done) {
        api.getAccessToken('code')
          .then((token) => {
            expect(token).to.have.property('data');
            expect(token.data).to.have.keys('access_token', 'expires_in', 'refresh_token', 'openid', 'scope', 'create_at');
            done();
          })
          .catch((e) => {
            expect(e).not.to.be.ok();
            done();
          });
      });
    });

    describe('should not ok', function () {
      before(function () {
        muk(http, 'get', () => {
          const resp = {
            access_token: 'ACCESS_TOKEN',
            expires_in: 0.1,
            refresh_token: 'REFRESH_TOKEN',
            openid: 'OPENID',
            scope: 'SCOPE',
          };
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve(resp);
            }, 100);
          });
        });
      });

      after(function () {
        muk.restore();
      });

      it('should not ok', function (done) {
        api.getAccessToken('code')
          .then((token) => {
            expect(token.isValid()).not.to.be.ok();
            done();
          });
      });
    });
  });

  describe('refreshAccessToken', function () {
    const api = new OAuth('appid', 'secret');

    it('should invalid', function (done) {
      api.refreshAccessToken('refresh_token')
        .catch((e) => {
          expect(e).to.be.ok();
          expect(e.name).to.be.equal('WeChatAPIError');
          expect(e.message).to.contain('invalid appid');
          done();
        });
    });

    describe('should ok', function () {
      before(function () {
        muk(http, 'get', function () {
          const resp = {
            access_token: 'ACCESS_TOKEN',
            expires_in: 7200,
            refresh_token: 'REFRESH_TOKEN',
            openid: 'OPENID',
            scope: 'SCOPE',
          };
          return Promise.resolve(resp);
        });
      });

      after(function () {
        muk.restore();
      });

      it('should ok', function (done) {
        api.refreshAccessToken('refresh_token')
          .then((token) => {
            expect(token.data).to.have.keys('access_token', 'expires_in', 'refresh_token', 'openid', 'scope', 'create_at');
            done();
          })
          .catch((e) => {
            expect(e).not.to.be.ok();
            done();
          });
      });
    });
  });

  describe('getUserByToken', function () {
    it('should invalid', function (done) {
      const api = new OAuth('appid', 'secret');
      api.getUserByToken('openid', 'access_token')
        .catch((e) => {
          expect(e).to.be.ok();
          expect(e.name).to.be.equal('WeChatAPIError');
          expect(e.message).to.contain('invalid credential, access_token is invalid or not latest');
          done();
        });
    });

    describe('mock get user ok', function () {
      const api = new OAuth('appid', 'secret');
      before(function () {
        muk(http, 'get', function () {
          const resp = {
            openid: 'OPENID',
            nickname: 'NICKNAME',
            sex: '1',
            province: 'PROVINCE',
            city: 'CITY',
            country: 'COUNTRY',
            headimgurl: 'http://wx.qlogo.cn/mmopen/g3MonUZtNHkdmzicIlibx6iaFqAc56vxLSUfpb6n5WKSYVY0ChQKkiaJSgQ1dZuTOgvLLrhJbERQQ4eMsv84eavHiaiceqxibJxCfHe/46',
            privilege: [
              'PRIVILEGE1',
              'PRIVILEGE2',
            ],
          };
          return Promise.resolve(resp);
        });
      });

      after(function () {
        muk.restore();
      });

      it('should ok', function (done) {
        api.getUserByToken('openid', 'access_token')
          .then((data) => {
            expect(data).to.have.keys('openid', 'nickname', 'sex', 'province', 'city',
              'country', 'headimgurl', 'privilege');
            done();
          })
          .catch((e) => {
            expect(e).not.to.be.ok();
            done();
          });
      });
    });
  });

  describe('getUser', function () {
    it('can not get token', function (done) {
      const api = new OAuth('appid', 'secret');
      api.getUser('openid')
        .catch((e) => {
          expect(e).to.be.ok();
          expect(e.message).to.be.equal('No token for openid, please authorize first.');
          done();
        });
    });

    describe('mock get token error', function () {
      const api = new OAuth('appid', 'secret');
      before(function () {
        muk(api, 'getToken', function () {
          return Promise.reject(new Error('get token error'));
        });
      });

      after(function () {
        muk.restore();
      });

      it('should ok', function (done) {
        api.getUser('openid')
          .catch((e) => {
            expect(e).to.be.ok();
            expect(e.message).to.be.equal('get token error');
            done();
          });
      });
    });

    describe('mock get null data', function () {
      const api = new OAuth('appid', 'secret');
      before(function () {
        muk(api, 'getToken', function () {
          return Promise.resolve(null);
        });
      });

      after(function () {
        muk.restore();
      });

      it('should ok', function (done) {
        api.getUser('openid')
          .catch((e) => {
            expect(e).to.be.ok();
            expect(e).to.have.property('name', 'NoOAuthTokenError');
            expect(e).to.have.property('message', 'No token for openid, please authorize first.');
            done();
          });
      });
    });

    describe('mock get valid token', function () {
      const api = new OAuth('appid', 'secret');
      before(function () {
        muk(api, 'getToken', function () {
          return Promise.resolve({
            access_token: 'access_token',
            create_at: Date.now(),
            expires_in: 60,
          });
        });
        muk(api, 'getUserByToken', function () {
          return Promise.resolve({
            openid: 'OPENID',
            nickname: 'NICKNAME',
            sex: '1',
            province: 'PROVINCE',
            city: 'CITY',
            country: 'COUNTRY',
            headimgurl: 'http://wx.qlogo.cn/mmopen/g3MonUZtNHkdmzicIlibx6iaFqAc56vxLSUfpb6n5WKSYVY0ChQKkiaJSgQ1dZuTOgvLLrhJbERQQ4eMsv84eavHiaiceqxibJxCfHe/46',
            privilege: [
              'PRIVILEGE1',
              'PRIVILEGE2',
            ],
          });
        });
      });

      after(function () {
        muk.restore();
      });

      it('should ok with openid', function (done) {
        api.getUser('openid')
          .then((data) => {
            expect(data).to.have.keys('openid', 'nickname', 'sex', 'province', 'city',
              'country', 'headimgurl', 'privilege');
            done();
          })
          .catch((e) => {
            expect(e).not.to.be.ok();
            done();
          });
      });

      it('should ok with options', function (done) {
        api.getUser({ openid: 'openid', lang: 'en' })
          .then((data) => {
            expect(data).to.have.keys('openid', 'nickname', 'sex', 'province', 'city',
              'country', 'headimgurl', 'privilege');
            done();
          })
          .catch((e) => {
            expect(e).not.to.be.ok();
            done();
          });
      });

      it('should ok with options', function (done) {
        api.getUser({ openid: 'openid' })
          .then((data) => {
            expect(data).to.have.keys('openid', 'nickname', 'sex', 'province', 'city',
              'country', 'headimgurl', 'privilege');
            done();
          })
          .catch((e) => {
            expect(e).not.to.be.ok();
            done();
          });
      });
    });

    describe('mock get invalid token', function () {
      const api = new OAuth('appid', 'secret');
      before(function () {
        muk(api, 'getToken', function () {
          return Promise.resolve({
            access_token: 'access_token',
            create_at: Date.now() - (70 * 1000),
            expires_in: 60,
          });
        });
      });

      after(function () {
        muk.restore();
      });

      it('should ok', function (done) {
        api.getUser('openid')
          .catch((e) => {
            expect(e).to.be.ok();
            expect(e).to.have.property('name', 'WeChatAPIError');
            expect(e.message).to.contain('refresh_token missing');
            done();
          });
      });
    });

    describe('mock get invalid token and refresh_token', function () {
      const api = new OAuth('appid', 'secret');
      before(function () {
        muk(api, 'getToken', function () {
          return Promise.resolve({
            access_token: 'access_token',
            refresh_token: 'refresh_token',
            create_at: Date.now() - (70 * 1000),
            expires_in: 60,
          });
        });

        muk(api, 'refreshAccessToken', function () {
          const resp = {
            data: {
              access_token: 'ACCESS_TOKEN',
              expires_in: 7200,
              refresh_token: 'REFRESH_TOKEN',
              openid: 'OPENID',
              scope: 'SCOPE',
            },
          };
          return Promise.resolve(resp);
        });

        muk(api, 'getUserByToken', function () {
          return Promise.resolve({
            openid: 'OPENID',
            nickname: 'NICKNAME',
            sex: '1',
            province: 'PROVINCE',
            city: 'CITY',
            country: 'COUNTRY',
            headimgurl: 'http://wx.qlogo.cn/mmopen/g3MonUZtNHkdmzicIlibx6iaFqAc56vxLSUfpb6n5WKSYVY0ChQKkiaJSgQ1dZuTOgvLLrhJbERQQ4eMsv84eavHiaiceqxibJxCfHe/46',
            privilege: [
              'PRIVILEGE1',
              'PRIVILEGE2',
            ],
          });
        });
      });

      after(function () {
        muk.restore();
      });

      it('should ok', function (done) {
        api.getUser('openid')
          .then((data) => {
            expect(data).to.have.keys('openid', 'nickname', 'sex', 'province', 'city', 'country', 'headimgurl', 'privilege');
            done();
          })
          .catch((e) => {
            expect(e).not.to.be.ok();
            done();
          });
      });
    });
  });

  describe('mock getUserByCode', function () {
    const api = new OAuth('appid', 'secret');
    before(function () {
      muk(http, 'get', function () {
        const resp = {
          access_token: 'ACCESS_TOKEN',
          expires_in: 7200,
          refresh_token: 'REFRESH_TOKEN',
          openid: 'OPENID',
          scope: 'SCOPE',
        };
        return Promise.resolve(resp);
      });

      muk(api, 'getUserByToken', function () {
        return Promise.resolve({
          openid: 'OPENID',
          nickname: 'NICKNAME',
          sex: '1',
          province: 'PROVINCE',
          city: 'CITY',
          country: 'COUNTRY',
          headimgurl: 'http://wx.qlogo.cn/mmopen/g3MonUZtNHkdmzicIlibx6iaFqAc56vxLSUfpb6n5WKSYVY0ChQKkiaJSgQ1dZuTOgvLLrhJbERQQ4eMsv84eavHiaiceqxibJxCfHe/46',
          privilege: [
            'PRIVILEGE1',
            'PRIVILEGE2',
          ],
        });
      });
    });

    after(function () {
      muk.restore();
    });

    it('should ok with getUserByCode', function (done) {
      api.getUserByCode('code')
        .then((data) => {
          expect(data).to.have.keys('openid', 'nickname', 'sex', 'province', 'city',
            'country', 'headimgurl', 'privilege');
          done();
        })
        .catch((e) => {
          expect(e).not.to.be.ok();
          done();
        });
    });

    it('should ok with getUserByCode', function (done) {
      const options = { code: 'code', lang: 'en' };
      api.getUserByCode(options)
        .then((data) => {
          expect(data).to.have.keys('openid', 'nickname', 'sex', 'province', 'city',
            'country', 'headimgurl', 'privilege');
          done();
        })
        .catch((e) => {
          expect(e).not.to.be.ok();
          done();
        });
    });
  });

  describe('verifyToken', function () {
    const api = new OAuth('appid', 'secret');
    it('should ok with verifyToken', function (done) {
      api.verifyToken('openid', 'access_token')
        .catch((e) => {
          expect(e).to.be.ok();
          expect(e.message).to.contain('access_token is invalid');
          done();
        });
    });
  });
});
