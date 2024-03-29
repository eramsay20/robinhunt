import React, { useEffect, useState, useRef } from "react";
import { createChart } from 'lightweight-charts';
import FlipNumbers from 'react-flip-numbers';

// INFORMATIONAL RESOURCES FOR RELATED COMPONENTS // 
// https://finnhub.io/docs/api/websocket-trades
// https://finnhub.io/docs/api/quote
// https://www.unixtimestamp.com/
// https://www.npmjs.com/package/react-flip-numbers

const StockChart = ({ ticker, companyName, lastPrice, setLastPrice }) => {
    const alphaKey = process.env.ALPHA_VANTAGE_API_KEY
    const chartContainer = useRef(null)
    const priceContainer = useRef(null)

    let lineSeries, priceSocket, pastData, prevClose;
    const initialize = async () => {
        // identify placement of chart in DOM
        let container = chartContainer.current
        // create chart 
        let chart = createChart(container, {
            width: 650,
            height: 300,
            layout: {
                backgroundColor: '#ffffff',
                textColor: 'green',
            },
            grid: {
                vertLines: { visible: false },
                horzLines: { visible: false },
            },
            localization: {
                dateFormat: 'MM/dd/yy',
                locale: 'en-US',
            },
            priceScale: {
                position: 'right',
                autoScale: true,
                invertScale: false,
                alignLabels: true,
                borderVisible: false,
                borderColor: 'rgba(197, 203, 206, 0.8)',
                scaleMargins: {
                    top: 0.3,
                    bottom: 0.4,
                },
            },
            timeScale: {
                rightOffset: 3,
                barSpacing: 3,
                fixLeftEdge: true,
                lockVisibleTimeRangeOnResize: true,
                rightBarStaysOnScroll: true,
                borderVisible: false,
                borderColor: '#fff000',
                visible: false,
                timeVisible: true,
            },
            crosshair: {
                vertLine: {
                    color: '#222b37',
                    width: 0.5,
                    style: 0,
                    visible: true,
                    labelVisible: true,
                },
                horzLine: {
                    color: '#6A5ACD',
                    width: 0.5,
                    style: 0,
                    visible: false,
                    labelVisible: true,
                },
                mode: 1,
            },
        });

        // add line-series or area type to initial chart || https://www.cssscript.com/financial-chart/
        lineSeries = chart.addAreaSeries({
            topColor: '#e5f9e6',
            bottomColor: '#f5f8fa',
            lineColor: '#40c802',
            lineStyle: 0,
            lineWidth: 2,
            crosshairMarkerVisible: true,
            crosshairMarkerRadius: 3,
        });
    }

    // grab historical chart data (1min) || API: https://www.alphavantage.co/documentation/
    const fetchHistoricalData = async (series) => {
        let key = alphaKey;
        let response = await fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${ticker}&interval=1min&outputsize=full&apikey=${key}`)
        if (response.ok) {
            let data = await response.json()
            let seriesData = data['Time Series (1min)']
            let historical = []
            for (let key in seriesData) {
                let datetime = new Date(key).getTime() / 1000; // convert to unix timestamp for lwChart
                let price = Number(seriesData[key]['4. close']) // grab close price, convert to num data type
                historical.push({ 'time': datetime, 'value': price }) // add new data point obj to historical array
            }
            let last360 = historical.slice(0, 360)
            prevClose = last360[0]['value']
            setLastPrice(prevClose)
            pastData = last360.reverse(); // historical data is sent most recent first... so need to reverse the order
            series.setData(pastData)
        }
    }


    // async function to fetch company stock price data from Finnhub
    const mountSocket = (series) => {
        // create websocket connection to finnhub using my API key
        priceSocket = new WebSocket(`wss://ws.finnhub.io?token=c27ut2aad3ic393ffql0`);

        // Connection opened -> subscribe to tick data websocket for given stock
        priceSocket.addEventListener('open', function (event) {
            priceSocket.send(JSON.stringify({ 'type': 'subscribe', 'symbol': ticker }))
        });

        let lastTime = null;
        // Listen for messages; only allow update when next time >> last time
        priceSocket.addEventListener('message', function (event) {
            let data = JSON.parse(event.data).data
            if (data) {
                let time = data[data.length - 1]['t'] / 1000; // unix timestamp in ms, convert to secs by dividing by 1000
                let price = data[data.length - 1]['p'];
                if (lastTime === null || lastTime < time) { // last time must always be << new time, else chart breaks
                    lastTime = time
                    let newPricePoint = { 'time': time, 'value': price }
                    series.update(newPricePoint);
                    setLastPrice(newPricePoint['value'])
                } 
            }
        });
    }

    // Function: Unsubscribe from price websocket and close so it doesn't continue to receive data after navigating away
    // review unmount working correctly *** react warning in console likely tied to this
    const unmountSocket = (socket) => {
            socket.send(JSON.stringify({ 'type': 'unsubscribe', 'symbol': ticker }))
            socket.close()
    }

    // remove existing container's chart content on stock selection change instantiated from Stock page
    const removeChart = () => chartContainer.current.innerHTML = '' 

    // Function: load pre-req async functions in order first
    const loadSeries = async () => {
        await removeChart()
        await initialize()
        await fetchHistoricalData(lineSeries)
    }

    // then create final load function to load initial series data, then establish the websocket connection
    const load = async () => {
        await loadSeries()
        mountSocket(lineSeries)
    }

    // run all functions on load in correct order via useEffect
    useEffect(() => {
        if(ticker) {
            load()
            return () => unmountSocket(priceSocket)
        }
    }, [ticker]) // added dependency for if ticker changes from search bar to unmount existing socket then reloading new data

    return (
        <div className="stock-chart">
            <h1 className='min-margin'>{companyName}</h1>
            <h3 className='num-flip' ref={priceContainer}>
                <FlipNumbers height={20} width={15} color="var(--GREEN_TEXT)" background="white" play perspective={200} duration={1} numbers={`$${lastPrice.toFixed(2)}`} />
            </h3>
            <div ref={chartContainer}></div>
        </div>
    )
}

export default StockChart;