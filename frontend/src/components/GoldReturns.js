// src/components/GoldReturns.js
import React, { useEffect, useState } from 'react';
import './Returns.css';

const GoldReturns = () => {
    const [data, setData] = useState([]);  // State to hold fetched data
    const [loading, setLoading] = useState(true);  // State to handle loading state
    const [error, setError] = useState(null);  // State to handle errors

    // Fetch data from the Flask backend for Gold returns
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/returns/1`);  // Fetching gold data
                if (!response.ok) {
                    throw new Error(`Error: ${response.statusText}`);  // Handle response errors
                }
                const result = await response.json();
                setData(result);  // Set the fetched data to state
            } catch (error) {
                setError(error.message);  // Set error message if fetching fails
            } finally {
                setLoading(false);  // Set loading to false after data is fetched or if there's an error
            }
        };
        fetchData();
    }, []);  // Empty dependency array means this runs once on component mount

    if (loading) {
        return <div>Loading...</div>;  // Show loading indicator
    }

    if (error) {
        return <div>{`Error: ${error}`}</div>;  // Show error message
    }

    return (
        <div className="returns-container">
            <h1 className="returns-header">Annual Gold Price Returns</h1>
            <div className="returns-table-container">
                <table className="returns-table">
                    <thead>
                        <tr>
                            <th className="year-column">Year</th>
                            <th>EUR</th>
                            <th>GBP</th>
                            <th>NOK</th>
                            <th>JPY</th>
                            <th>CAD</th>
                            <th>AUD</th>
                            <th>NZD</th>
                            <th>CHF</th>
                            <th>BRL</th>
                            <th>MXN</th>
                            <th>ZAR</th>
                            <th>CNY</th>
                            <th>IDR</th>
                            <th>INR</th>
                            <th>KRW</th>
                            <th>MYR</th>
                            <th>SGD</th>
                            <th>CZK</th>
                            <th>PLN</th>
                            <th>HUF</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, index) => (
                            <tr key={index}>
                                <td className="year-column">{row.yr}</td>
                                <td className={row.EUR < 0 ? 'negative' : 'positive'}>
                                    {row.EUR !== null ? `${row.EUR}%` : ''}
                                </td>
                                <td className={row.GBP < 0 ? 'negative' : 'positive'}>
                                    {row.GBP !== null ? `${row.GBP}%` : ''}
                                </td>
                                <td className={row.NOK < 0 ? 'negative' : 'positive'}>
                                    {row.NOK !== null ? `${row.NOK}%` : ''}
                                </td>
                                <td className={row.JPY < 0 ? 'negative' : 'positive'}>
                                    {row.JPY !== null ? `${row.JPY}%` : ''}
                                </td>
                                <td className={row.CAD < 0 ? 'negative' : 'positive'}>
                                    {row.CAD !== null ? `${row.CAD}%` : ''}
                                </td>
                                <td className={row.AUD < 0 ? 'negative' : 'positive'}>
                                    {row.AUD !== null ? `${row.AUD}%` : ''}
                                </td>
                                <td className={row.NZD < 0 ? 'negative' : 'positive'}>
                                    {row.NZD !== null ? `${row.NZD}%` : ''}
                                </td>
                                <td className={row.CHF < 0 ? 'negative' : 'positive'}>
                                    {row.CHF !== null ? `${row.CHF}%` : ''}
                                </td>
                                <td className={row.BRL < 0 ? 'negative' : 'positive'}>
                                    {row.BRL !== null ? `${row.BRL}%` : ''}
                                </td>
                                <td className={row.MXN < 0 ? 'negative' : 'positive'}>
                                    {row.MXN !== null ? `${row.MXN}%` : ''}
                                </td>
                                <td className={row.ZAR < 0 ? 'negative' : 'positive'}>
                                    {row.ZAR !== null ? `${row.ZAR}%` : ''}
                                </td>
                                <td className={row.CNY < 0 ? 'negative' : 'positive'}>
                                    {row.CNY !== null ? `${row.CNY}%` : ''}
                                </td>
                                <td className={row.IDR < 0 ? 'negative' : 'positive'}>
                                    {row.IDR !== null ? `${row.IDR}%` : ''}
                                </td>
                                <td className={row.INR < 0 ? 'negative' : 'positive'}>
                                    {row.INR !== null ? `${row.INR}%` : ''}
                                </td>
                                <td className={row.KRW < 0 ? 'negative' : 'positive'}>
                                    {row.KRW !== null ? `${row.KRW}%` : ''}
                                </td>
                                <td className={row.MYR < 0 ? 'negative' : 'positive'}>
                                    {row.MYR !== null ? `${row.MYR}%` : ''}
                                </td>
                                <td className={row.SGD < 0 ? 'negative' : 'positive'}>
                                    {row.SGD !== null ? `${row.SGD}%` : ''}
                                </td>
                                <td className={row.CZK < 0 ? 'negative' : 'positive'}>
                                    {row.CZK !== null ? `${row.CZK}%` : ''}
                                </td>
                                <td className={row.PLN < 0 ? 'negative' : 'positive'}>
                                    {row.PLN !== null ? `${row.PLN}%` : ''}
                                </td>
                                <td className={row.HUF < 0 ? 'negative' : 'positive'}>
                                    {row.HUF !== null ? `${row.HUF}%` : ''}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default GoldReturns;
