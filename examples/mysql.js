/**
  CREATE TABLE `token` (
    `access_token` varchar(107) COLLATE utf8_bin NOT NULL COMMENT '令牌',
    `expires_in` varchar(10) COLLATE utf8_bin NOT NULL COMMENT '有效期',
    `refresh_token` varchar(107) COLLATE utf8_bin NOT NULL COMMENT '刷新参数',
    `openid` varchar(28) COLLATE utf8_bin NOT NULL COMMENT '用户编号',
    `scope` varchar(50) COLLATE utf8_bin NOT NULL COMMENT '作用域',
    `create_at` varchar(20) COLLATE utf8_bin NOT NULL COMMENT '令牌建立时间'
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='微信令牌表';

  ALTER TABLE `token`
    ADD UNIQUE KEY `openid` (`openid`);
 */

const OAuth = require('node-wechat-oauth');

const client = new OAuth('your appid', 'your secret', async (openid) => {
  const sql = 'SELECT * FROM token WHERE openid = ?';
  const result = await db.query(sql, [openid]);
  return result[0];
}, async (openid, token) => {
  const sql = 'REPLACE INTO token(access_token, expires_in, refresh_token, openid, scope, create_at) VALUES(?, ?, ?, ?, ?, ?)';
  const fields = [token.access_token, token.expires_in, token.refresh_token, token.openid, token.scope, token.create_at];
  return db.query(sql, fields);
});
