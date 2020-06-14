import React from 'react';
import Chart from './Chart.jsx';
import Description from './Description.jsx';
import ChartCarousel from './ChartCarousel.jsx'
import Header from './Header.jsx'
import Earnings from './Earnings.jsx'
import Quote from './Quote.jsx'

const axios = require('axios').default;

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      user_id: '1',
      ticker: 'AAPL',
      cName: '',
      currentWatchlist: 0,
      desInfo: {},
      earnInfo: {},
      quote: {},
      chartData: {
        labels: [],
        prices: [],
      },
      watchlistData: {
        watchlistTickers: [],
        watchlistNames: [],
        isTemp: [],
      },
    }

    this.getFundamentals = this.getFundamentals.bind(this);
    this.getIntraday = this.getIntraday.bind(this);
    this.updateTicker = this.updateTicker.bind(this);
    this.getQuote = this.getQuote.bind(this);
    this.getCurrentWatchlist = this.getCurrentWatchlist.bind(this);
    this.getWatchlistData = this.getWatchlistData.bind(this);
    this.deleteSecurity = this.deleteSecurity.bind(this);
    this.checkWatchlist = this.checkWatchlist.bind(this);
    this.addSecurity = this.addSecurity.bind(this);
  }

  componentDidMount() {
    this.getFundamentals()
    this.getIntraday()
    this.getQuote()
  }

  getCurrentWatchlist(newWatchlist) {
    this.setState({
      currentWatchlist: newWatchlist,
    }, () => { this.getWatchlistData() })
  }

  updateTicker(newticker) {
    const newState = {
      ticker: newticker
    }
    const setAsyncState = (newState) => new Promise((resolve) => this.setState(newState, resolve))

    return setAsyncState(newState)
      .then(() => { this.getFundamentals() })
      .then(() => { this.getQuote() })
      .then(() => { this.getIntraday() })
      .catch((err) => err);
  }

  checkWatchlist(searchTicker) {
    const checkTicker = (searchTicker) => new Promise((resolve) => {
      if (this.state.watchlistData.isTemp[0] === true) {
        this.state.watchlistData.watchlistTickers.shift()
        this.state.watchlistData.watchlistNames.shift()
        this.state.watchlistData.isTemp.shift()
      }
      const isPresent = this.state.watchlistData.watchlistTickers.indexOf(searchTicker)
      const newTickers = this.state.watchlistData.watchlistTickers.slice()
      const newCname = this.state.watchlistData.watchlistNames.slice()
      const newIsTemp = this.state.watchlistData.isTemp.slice()

      if (isPresent === -1) {
        newTickers.unshift(searchTicker)
        newCname.unshift(this.state.cName)
        newIsTemp.unshift(true)
        this.setState({
          watchlistData: {
            watchlistTickers: newTickers,
            watchlistNames: newCname,
            isTemp: newIsTemp,
          },
        })
      }
    })

    const newState = { ticker: searchTicker }
    const setAsyncState = (newState) => new Promise((resolve) => this.setState(newState, resolve))

    return setAsyncState(newState)
      .then(() => {return this.getFundamentals()})
      .then(() => {checkTicker(searchTicker)})
      .then(() => { this.getQuote() })
      .then(() => { this.getIntraday() })
  }

  addSecurity(ticker) {
    const options = {
      watchlist_id: this.state.currentWatchlist,
      security_id: ticker,
      security_name: this.state.cName,
    }

    return axios.post(`/data/watchlist/security`, options)
      .then((res) => res)
      .catch((err) => err);
  }

  deleteSecurity(ticker) {
    return axios.delete(`/data/watchlist/security?ticker=${ticker}&watchlist_id=${this.state.currentWatchlist}`)
      .then((res) => {
        const newTickers = this.state.watchlistData.watchlistTickers.slice()
        const newCname = this.state.watchlistData.watchlistNames.slice()
        const newIsTemp = this.state.watchlistData.isTemp.slice()
        const tickerIndex = this.state.watchlistData.watchlistTickers.indexOf(res.data.rows[0].security_id)

        newTickers.splice(tickerIndex, 1)
        newCname.splice(tickerIndex, 1)
        newIsTemp.splice(tickerIndex, 1)

        this.setState({
          watchlistData: {
            watchlistTickers: newTickers,
            watchlistNames: newCname,
            isTemp: newIsTemp,
          }
        })
      })
      .catch((err) => err);
  }

  getWatchlistData() {
    return axios.get(`/data/watchlist/security?watchlist_id=${this.state.currentWatchlist}`)
      .then((response) => {
        this.setState({
          watchlistData: {
            watchlistTickers: response.data.map((comp) => { return comp.id }),
            watchlistNames: response.data.map((comp) => { return comp.name }),
            isTemp: response.data.map((comp) => { return false }),
          }
        }, () => {
          if (this.state.watchlistData.watchlistTickers[0]) {
            this.updateTicker(this.state.watchlistData.watchlistTickers[0])
          }
        })
      })
      .catch((err) => err);
  }

  getFundamentals() {
    return axios.get(`/data/fundamentals?ticker=${this.state.ticker}`)
      .then((response) => {
        this.setState({
          cName: response.data.desInfo.companyName,
          desInfo: response.data.desInfo,
          earnInfo: response.data.earnInfo,
        })
      })
      .catch((err) => err);
  }

  getQuote() {
    return axios.get(`/data/quote?ticker=${this.state.ticker}`)
      .then((response) => {
        this.setState({ quote: response.data })
      })
      .catch((err) => err);
  }

  getIntraday() {
    return axios.get(`/data/timeseries?ticker=${this.state.ticker}`)
      .then((response) => {
        this.setState({
          chartData: {
            prices: response.data.price,
            labels: response.data.time,
          }
        })
      })
      .catch((err) => err);
  }

  render() {
    return (
      <div className='master-grid'>
        <Header updateTicker={this.updateTicker} getWatchlistData={this.getWatchlistData} watchlists={this.state.watchlists} getCurrentWatchlist={this.getCurrentWatchlist} checkWatchlist={this.checkWatchlist} user_id={this.state.user_id}/>
        <ChartCarousel updateTicker={this.updateTicker} addSecurity={this.addSecurity} watchlistData={this.state.watchlistData} deleteSecurity={this.deleteSecurity}/>

        <div className='static-grid'>
          <div className='chart-main'>
            <Chart chartData={this.state.chartData} ticker={this.state.ticker} cName={this.state.cName} isMini={false}/>
          </div>
          <Quote quote={this.state.quote}/>
        </div>

        <div className='collapse-grid'>
          <Description desInfo={this.state.desInfo}/>
          <Earnings earnInfo={this.state.earnInfo}/>
        </div>
        <div className='iex-cloud'>
        <a href="https://iexcloud.io">Data provided by IEX Cloud</a>
        </div>

      </div>
    );
  }
}

export default App;