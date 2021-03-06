/* eslint-disable max-len */
/* eslint-disable no-console */

const axios = require('axios').default;
const pg = require('../../database/postgres_db.js');
const config = require('../../config.js');

module.exports = {
  getFundamentals: (req) => axios.get(`https://cloud.iexapis.com/stable/stock/${req}/company?token=${config.app.api}`)
    .then((res) => axios.get(`https://cloud.iexapis.com/stable/stock/${req}/earnings?last=4&token=${config.app.api}`)
      .then((response) => ({
        desInfo: res.data,
        earnInfo: response.data,
      }))
      .catch((err) => err))
    .catch((err) => err),

  getTimeSeries: (tickers) => axios.get(`https://cloud.iexapis.com/stable/stock/${tickers}/intraday-prices?token=${config.app.api}`)
    .then((response) => ({
      price: response.data.map((tick) => tick.close),
      time: response.data.map((tick) => tick.minute),
    }))
    .then((res) => res)
    .catch((err) => err),

  getQuote: (req) => axios.get(`https://cloud.iexapis.com/stable/stock/${req}/quote?token=${config.app.api}`)
    .then((res) => res.data)
    .catch((err) => err),

  getWatchlistTimeseries: (req) => axios.get(`https://cloud.iexapis.com/stable/stock/market/batch?symbols=${req.watchlist}&types=intraday-prices&token=${config.app.api}`)
    .then((response) => Object.values(response.data).map((company) => ({
      price: company['intraday-prices'].map((tick) => tick.close),
      time: company['intraday-prices'].map((tick) => tick.minute),
    })))
    .then((res) => res)
    .catch((err) => err),

  getWatchlist: (req) => {
    const queryString = 'SELECT securities.id, securities.name FROM watchlists_securities INNER JOIN securities ON watchlists_securities.security_id = securities.id WHERE (watchlist_id=$1)';
    const options = [req.query.watchlist_id];

    return pg.query(queryString, options)
      .then((res) => res.rows)
      .catch((err) => err);
  },

  addSecurity: (req) => {
    const queryString1 = 'INSERT INTO watchlists_securities (watchlist_id, security_id) VALUES ($1, $2) RETURNING *';
    const queryString2 = 'INSERT INTO securities (id, name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING';
    const options1 = [Number(req.body.watchlist_id), req.body.security_id];
    const options2 = [req.body.security_id, req.body.security_name];

    return pg.query(queryString2, options2)
      .then((res) => res)
      .then(() => pg.query(queryString1, options1)
        .then((response) => response.rows[0].id))
      .catch((err) => err);
  },

  deleteSecurity: (req) => {
    const queryString = 'DELETE FROM watchlists_securities WHERE (watchlist_id=$1 AND security_id=$2) RETURNING *';
    const options = [req.query.watchlist_id, req.query.ticker];

    return pg.query(queryString, options)
      .then((res) => res)
      .catch((err) => err);
  },

  getWatchlists: (req) => {
    const queryString = 'SELECT * FROM watchlists WHERE (user_id=$1)';
    const options = [req.query.user_id];

    return pg.query(queryString, options)
      .then((res) => res.rows)
      .catch((err) => err);
  },

  addWatchlist: (req) => {
    const queryString = 'INSERT INTO watchlists (name, user_id) VALUES ($1, $2) RETURNING *';
    const options = [req.body.watchlist_name, req.body.user_id];

    return pg.query(queryString, options)
      .then((res) => res.rows[0].id)
      .catch((err) => err);
  },

  deleteWatchlist: (req) => {
    const queryString1 = 'DELETE FROM watchlists_securities WHERE (watchlist_id=$1) RETURNING *';
    const queryString2 = 'DELETE FROM watchlists WHERE (id=$1) RETURNING *';
    const options = [req.query.watchlist_id];

    return pg.query(queryString1, options)
      .then(() => pg.query(queryString2, options))
      .then((res) => res)
      .catch((err) => err);
  },

  editWatchlist: (req) => {
    const queryString = 'UPDATE watchlists SET name = $2 WHERE (id=$1)';
    const options = [req.body.watchlist_id, req.body.watchlist_name];

    return pg.query(queryString, options)
      .then((res) => res)
      .catch((err) => err);
  },
};
