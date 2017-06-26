class AccessToken {
  constructor(data) {
    this.data = data;
  }

  /**
   * 检查AccessToken是否有效，检查规则为当前时间和过期时间进行对比
   *
   * @return {Bool}
   */
  isValid() {
    return !!this.data.access_token
      && Date.now() < (this.data.create_at + (this.data.expires_in * 1000));
  }
}

module.exports = AccessToken;
