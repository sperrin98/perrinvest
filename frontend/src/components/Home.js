import React, { useState, useEffect } from 'react';
import StockDock from './StockDock';
import { Sparklines, SparklinesLine } from 'react-sparklines';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const [securities, setSecurities] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [news, setNews] = useState([]); // state for news articles

  const relevantIds = [
    36, 37, 38, 149, 81, 153, 154, 155, 156,
    1, 2, 3, 4, 6, 7, 8, 11, 12,
    16, 17, 18, 19, 20, 21, 22, 24, 29
  ];

  useEffect(() => {
    const fetchSecurities = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/securities`);
        const allSecurities = response.data;

        const filteredSecurities = allSecurities.filter((sec) =>
          relevantIds.includes(sec.security_id)
        );

        const pricePromises = filteredSecurities.map(async (sec) => {
          try {
            const priceResponse = await axios.get(
              `${process.env.REACT_APP_API_URL}/securities/${sec.security_id}/price-histories`
            );
            const rawData = priceResponse.data;
            const sorted = Array.isArray(rawData)
              ? rawData.sort((a, b) => new Date(a[1]) - new Date(b[1]))
              : [];
            const last5Prices = sorted.map(p => p[2]).filter(p => p != null).slice(-5);
            return { ...sec, last5Prices };
          } catch (err) {
            return { ...sec, last5Prices: [] };
          }
        });

        const securitiesWithPrices = await Promise.all(pricePromises);
        setSecurities(securitiesWithPrices);
      } catch (err) {
        console.error('Error fetching securities:', err);
      }
    };

    const fetchBlogs = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/blog`);
        if (!res.ok) throw new Error(`Failed to fetch blogs: ${res.status}`);
        const data = await res.json();
        setBlogs(data.slice(0, 3));
      } catch (err) {
        console.error('Error fetching blogs:', err);
      }
    };

    const fetchNews = async () => {
      try {
        // Pointing directly to local Flask backend
        const res = await fetch(`${process.env.REACT_APP_API_URL}/news`);

        if (!res.ok) throw new Error(`Failed to fetch news: ${res.status}`);
        const data = await res.json();
        setNews(data.slice(0, 15)); // latest 5 news articles
      } catch (err) {
        console.error('Error fetching news:', err);
      }
    };

    fetchSecurities();
    fetchBlogs();
    fetchNews();
  }, []);

  const renderTable = (ids, title) => {
    const filtered = securities.filter(sec => ids.includes(sec.security_id));
    return (
      <div className="summary-table-block">
        <h3 className="summary-table-title">{title}</h3>
        <table className="summary-table-wrapper">
          <thead>
            <tr className="summary-table-row-header">
              <th className="summary-table-header-security">Security</th>
              <th className="summary-table-header-value">Most Recent Price</th>
              <th className="summary-table-header-value">Trend (Last 5)</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((sec, idx) => {
              const prices = sec.last5Prices || [];
              const price = prices.length ? prices[prices.length - 1].toFixed(2) : 'N/A';
              let sparkColor = '#00FFB3';
              if (prices.length >= 2) {
                const first = prices[0];
                const last = prices[prices.length - 1];
                sparkColor = last > first ? '#00FFB3' : last < first ? '#FF4C4C' : '#CCCCCC';
              }
              return (
                <tr key={idx} className="summary-table-row-data">
                  <td className="summary-table-data-security">{sec.security_long_name}</td>
                  <td className="summary-table-data-value" style={{ color: sparkColor }}>{price}</td>
                  <td className="summary-table-data-value">
                    {prices.length > 0 ? (
                      <Sparklines data={prices} width={80} height={20}>
                        <SparklinesLine color={sparkColor} />
                      </Sparklines>
                    ) : 'N/A'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div>
      <div className="section section1">

      <div className="home-content-wrapper">
        {/* Left tables with Latest Markets header */}
        <div className="home-left-panel">
          <h2 className="section-header">Latest Markets</h2>
          {securities.length > 0 ? (
            <>
              {renderTable([36, 37, 38, 149, 81, 153, 154, 155, 156], 'Precious Metals')}
              {renderTable([1, 2, 3, 4, 6, 7, 8, 11, 12], 'Stock Markets')}
              {renderTable([16, 17, 18, 19, 20, 21, 22, 24, 29], 'Currencies')}
            </>
          ) : (
            <p>Loading summary data...</p>
          )}
        </div>

        {/* Middle blogs */}
        <div className="home-main-area">
          <h2 className="section-header">Latest Feed</h2>
          {blogs.length > 0 ? blogs.map(blog => (
            <div key={blog.post_id} className="home-blog-entry">
              <h3>{blog.title}</h3>
              <p className="home-blog-meta">
                <i>by {blog.author} on {new Date(blog.created_at).toLocaleDateString()}</i>
              </p>
              {blog.image && <img src={blog.image} alt={blog.title} />}
              <p className="home-blog-excerpt">{blog.content.substring(0, 100)}...</p>
              <Link to={`/blog/${blog.post_id}`} className="home-blog-readmore">Read more</Link>
            </div>
          )) : <p>Loading blogs...</p>}
        </div>

        {/* Right news sidebar */}
        <div className="home-right-panel">
          <h2 className="section-header">Latest News</h2>
          {news.length > 0 ? news.map((item, idx) => (
            <div key={idx} className="home-news-entry">
              <a href={item.url} target="_blank" rel="noopener noreferrer">{item.title}</a>
              <p className="home-news-source"><i>{item.source} - {new Date(item.publishedAt).toLocaleDateString()}</i></p>
            </div>
          )) : <p>Loading news...</p>}
        </div>
      </div>

      </div>
    </div>
  );
};

export default Home;
