import './App.css';
import React, {useEffect, useState} from 'react';
import axios from 'axios';
import Charts from './components/Chart';
import LineChart from './components/LineChart';

// const formatChartData = (dates, values) =>
//   dates.map((date, i) => ({ time: date, value: values[i] })).filter(d => d.value !== null);

const formatChartData = (dates = [], values = []) =>
  dates.map((date, i) => ({
    time: date,
    value: values[i] !== undefined ? values[i] : null,
  })).filter(d => d.value !== null);


function App() {
  // const dataset = [
  //   { time: '2024-10-11', value: 93.24 },
  //   { time: '2024-10-12', value: 95.35 },
  //   { time: '2024-10-13', value: 98.84 },
  //   { time: '2024-10-14', value: 99.92 },
  //   { time: '2024-10-15', value: 99.80 },
  //   { time: '2024-10-16', value: 99.47 },
  // ];

  const [spreadLines, setSpreadLines] = useState([]);
  const [rsiLine, setRsiLine] = useState([]);
  const [currencyLines, setCurrencyLines] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5050/api/analytics')
      .then(res => {
        const data = res.data; // 👈 Axios uses res.data directly
        console.log("API Response:", data);

        if (!data.spread || !data.rsi || !data.currencies) {
          console.warn("One of the data blocks is missing.");
          return;
        }

        const { spread, rsi, currencies } = data;

        setSpreadLines([
          {
            name: 'Spread',
            data: formatChartData(spread.dates, spread.spread),
            color: '#00bfff',
          },
          {
            name: 'Upper Band',
            data: formatChartData(spread.dates, spread.upper),
            color: '#00ff88',
          },
          {
            name: 'Middle Band',
            data: formatChartData(spread.dates, spread.middle),
            color: '#ffaa00',
          },
          {
            name: 'Lower Band',
            data: formatChartData(spread.dates, spread.lower),
            color: '#ff0066',
          },
        ]);

        setRsiLine([
          {
            name: 'RSI',
            data: formatChartData(rsi.dates, rsi.rsi),
            color: '#f39c12',
          },
        ]);

        setCurrencyLines([
          {
            name: 'EUR-USD',
            data: formatChartData(currencies.dates, currencies["EUR-USD"]),
            color: '#3498db',
          },
          {
            name: 'GBP-USD',
            data: formatChartData(currencies.dates, currencies["GBP-USD"]),
            color: '#9b59b6',
          },
        ]);

      })
      .catch(err => {
        console.error('Error fetching analytics:', err);
      });
  }, []);

  return (
    <div className="App">
      <h1>Forex Dashboard</h1>
      <h2>Currencies</h2>
      {currencyLines.length > 0 ? <LineChart lines={currencyLines} /> : <p>Loading...</p>}
      {/* <LineChart data={dataset} /> */}
      {/* <Charts /> */}
      <h2>Spreads</h2>
      {spreadLines.length > 0 ? <LineChart lines={spreadLines} /> : <p>Loading...</p>}
      <h2>RSI</h2>
      {rsiLine.length > 0 ? <LineChart lines={rsiLine} /> : <p>Loading...</p>}
    </div>
  );
}

export default App;
