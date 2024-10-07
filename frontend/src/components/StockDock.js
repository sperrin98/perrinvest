import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './StockDock.css'; // Ensure this imports your CSS

const StockDock = () => {
    const [stockPrices, setStockPrices] = useState([]);

    const fetchStockPrices = async () => {
        try {
            const response = await axios.get('http://127.0.0.1:5000/api/stock-prices');
            const data = response.data;

            // Map the stock data into an array for display
            const stocks = Object.entries(data).map(([name, { current_price, previous_price }]) => ({
                name,
                currentPrice: current_price,
                previousPrice: previous_price,
                trendClass: current_price > previous_price ? 'price-up' : 'price-down',
            }));
            
            setStockPrices(stocks);
        } catch (error) {
            console.error('Error fetching stock data:', error);
        }
    };

    useEffect(() => {
        fetchStockPrices();
        const interval = setInterval(fetchStockPrices, 30000); // Fetch every 30 seconds
        return () => clearInterval(interval);
    }, []);

    if (!stockPrices.length) return null; // Show nothing if no data

    return (
        <div className="stock-dock">
            <div className="scroll-wrapper">
                {[...stockPrices, ...stockPrices].map((stock, index) => (
                    <div className="stock-item" key={index}>
                        <div className={stock.trendClass + ' stock-name'}>
                            {stock.name.length > 10 ? `${stock.name.slice(0, 10)}...` : stock.name} {/* Truncate if longer than 10 characters */}
                        </div>
                        <div className={stock.trendClass}>${stock.currentPrice.toFixed(2)}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StockDock;
