import React, { useEffect, useState } from "react";
import AssetHolding from './AssetHolding'
import NewsCard from '../NewsCard'
import PortfolioChart from './PortfolioChart'

const PortfolioContent = ({ cashBalance, holdings, news, refreshCount, setRefreshCount, prices }) => {
    const bolt = require('../../front-assets/bolt.png') // news bolt icon
    const upArrow = require('../../front-assets/up.png') // green up arrow
    const downArrow = require('../../front-assets/down.png') // red down arrow

    // state variables 
    const [portValue, setPortValue] = useState(0)
    const [holdingValue, setHoldingValue] = useState(0)
    const [capInvested, setCapInvested] = useState(0)
    const [totalReturn, setTotalReturn] = useState(0)
    const [equityValues, setEquityValues] = useState([])

    const [articles, setArticles] = useState(null)
    const [latestArticle, setLatestArticle] = useState(null)
    const [newsButtonText, setNewsButtonText] = useState('Show newer articles')

    const getPortfolioValue = (holdValue) => holdValue + cashBalance;    
    const currencyFormatter = (num) => Number(num).toFixed(2)

    let equityObj = {}; // store data necessary to populate
    const getHoldingValue = () => {
        let total = 0
        for (let key in equityObj){
            let value = equityObj[key];
            total += value;
        }
        return total
    }

    const getEquityValues = () => {
        let myEquity = [];
        for (let key in equityObj){
            let holding = {'ticker':key, 'equityValue': Number(equityObj[key]).toFixed(2)}
            myEquity.push(holding)
        }
        return myEquity
    }

    let capitalInvested, fCapInvested, myReturn;
    if(holdings) capitalInvested = holdings.reduce((sum, holding) => sum += (holding.cost*holding.volume), 0) // calc total initial costs for holdings
    if(capitalInvested) fCapInvested = currencyFormatter(capitalInvested) // format as currency
    if(fCapInvested && capInvested === 0) setCapInvested(fCapInvested) // set cap invested once on load
    
    useEffect(() => {
        let holdValue = getHoldingValue()
        let fHoldValue = currencyFormatter(holdValue)
        setHoldingValue(fHoldValue)

        let portfolioValue = getPortfolioValue(holdValue)
        let fPortValue = currencyFormatter(portfolioValue)
        setPortValue(fPortValue)

        if (holdingValue > 0 && capInvested > 0) {
            let myReturn = currencyFormatter(holdingValue - capInvested)
            setTotalReturn(myReturn)
        }
    }, [equityObj, myReturn])

    useEffect(() => {
        let myEquity = getEquityValues()
        setEquityValues(myEquity)
    }, [holdingValue])

    useEffect(() => {
        let lastNews = news[0];
        let otherArticles = news.slice(1)
        setLatestArticle(lastNews)
        setArticles(otherArticles)
    }, [news])

    const chartDisplay = (
        <div className='flex-container'>
            <PortfolioChart values={equityValues} />
        </div>
    )

    const updateNews = () => {
        setRefreshCount(refreshCount+1)
        setNewsButtonText(`All set! You're up to date`)
        setTimeout(() => {
            setNewsButtonText('Show newer articles')
        }, [10000])
    }
    
    return (
        <div className='portfolio-content-container'>
            <div className="chart-container">
                <div className='portfolio-summary'>
                    <div className='portfolio-item-div'>
                        <h3 style={{ 'paddingBottom': '20px', 'fontSize':'18px' }} className="indent-heading min-margin">Portfolio Value:</h3>
                        <h3 style={{ 'paddingBottom': '20px', 'fontSize': '16px', 'marginLeft': '10px' }} className="indent-heading min-margin">${portValue}</h3>
                    </div>
                    <div className='portfolio-item-div'>
                        <p className="portfolio-summary-item">Cash Balance:</p>
                        <p className="portfolio-summary-item">${Number(cashBalance).toFixed(2)}</p>
                    </div>
                    <div className='portfolio-item-div grey-underline'>
                        <p className="portfolio-summary-item">Est. Holdings Value: </p>
                        <p className="portfolio-summary-item">${holdingValue}</p>
                    </div>
                    
                    <div className='portfolio-item-div grey-underline'>
                        <p className="portfolio-summary-item">Capital Invested: </p>
                        <p className="portfolio-summary-item">${capInvested}</p>
                    </div>
    
                    <div className='portfolio-item-div'>
                        <p className="portfolio-summary-item bolder">Net Holdings Value: </p>
                        {totalReturn > 0 ? 
                            (<p className="portfolio-summary-item bolder"><img alt='up-arrow' style={{ 'width': '8px', 'height': '8px', 'marginRight': '5px' }} src={upArrow}></img>${totalReturn}</p>) :
                            (<p className="portfolio-summary-item bolder"><img alt='down-arrow' style={{ 'width': '8px', 'height': '8px', 'marginRight': '5px' }} src={downArrow}></img>${totalReturn}</p>)
                        }
                    </div>
                </div>
                {chartDisplay}
            </div>
            <div className="holdings-container">
                <h2 className="">Holdings</h2>
                <table className="holding-table">
                    <thead>
                        <tr className="holding-table-labels">
                            <td>Symbol</td>
                            <td>Shares</td>
                            <td>Price</td>
                            <td>Avg Cost</td>
                            <td>Equity Value</td>
                            <td>Net Value</td>
                        </tr>
                    </thead>
                    <tbody>
                        {holdings && prices && prices.length > 0 && holdings.map((holding, idx) => {
                            let price = prices[idx].c
                            return <AssetHolding key={holding.ticker} symbol={holding.ticker} shares={holding.volume} currentPrice={price} purchasePrice={holding.cost} equityObj={equityObj} currencyFormatter={currencyFormatter} />
                            })
                        }
                    </tbody>
                </table>
            </div>
            <div className="news-container">
                <h2 className="">News</h2>
                <div className='flex-container line-above'>
                    <p onClick={updateNews} className='fetch-news-button'> {newsButtonText}</p>
                </div>
                {latestArticle && 
                    (<a href={latestArticle.url} rel="noopener noreferrer" target="_blank">
                    <div className="news-header-container">
                        <div className='news-info-container'>
                            <p className='news-source boldest'>
                                <img alt='bolt' style={{ 'width': '10px', 'marginRight': '8px' }} src={bolt}></img>{latestArticle.source}
                            </p>
                            <div className="news-header-title boldest">
                                <p>{latestArticle.headline}</p>
                            </div>
                            <div className="news-header-summary">
                                <p>{latestArticle.summary}</p>
                            </div>
                            <div style={{ 'paddingBottom': '20px' }} className='news-source boldest capitalize'>
                                {latestArticle.category}
                            </div>
                        </div>
                        <div className='news-header-image-container'>
                            <img alt='article-pic' className="news-header-image" src={latestArticle.image}></img>
                        </div>
                    </div>
                </a>)
                }
                {articles && articles.map(article => (
                    <NewsCard key={article.id} article={article} />
                ))}
                <div className='project-links-row'>
                    <span>© Eric Ramsay. All rights reserved.</span> 
                    <a target="_blank" rel="noopener noreferrer" href="https://github.com/eramsay20/robinhunt#readme">View Project ReadMe</a>  
                    <a target="_blank" rel="noopener noreferrer" href="https://eramsay20.github.io/portfolio/">View Eric Ramsay's Portfolio</a>
                </div>
            </div>
        </div>
    )
}

export default PortfolioContent;