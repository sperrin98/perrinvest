import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./Home.css";

const MiniAreaSparkline = ({ data = [], color = "#5f6d69" }) => {
  if (!data || data.length < 2) return <span>N/A</span>;

  const width = 96;
  const height = 24;
  const padding = 2;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = padding + (index * (width - padding * 2)) / (data.length - 1);
    const y =
      height - padding - ((value - min) / range) * (height - padding * 2);
    return [x, y];
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point[0]} ${point[1]}`)
    .join(" ");

  const areaPath = [
    `M ${points[0][0]} ${height - padding}`,
    ...points.map((point) => `L ${point[0]} ${point[1]}`),
    `L ${points[points.length - 1][0]} ${height - padding}`,
    "Z",
  ].join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <path d={areaPath} fill={color} opacity="0.18" />
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="7"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity="0.12"
      />
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="4.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity="0.2"
      />
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="2.4"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity="0.95"
      />
    </svg>
  );
};

const Home = () => {
  const [securities, setSecurities] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [news, setNews] = useState([]);

  const relevantIds = [
    36, 37, 38, 149, 81, 153, 154, 155, 156,
    1, 2, 3, 4, 6, 7, 8, 11, 12,
    16, 17, 18, 19, 20, 21, 22, 24, 29,
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
            const last5Prices = sorted
              .map((p) => p[2])
              .filter((p) => p != null)
              .slice(-5);

            return { ...sec, last5Prices };
          } catch (err) {
            return { ...sec, last5Prices: [] };
          }
        });

        const securitiesWithPrices = await Promise.all(pricePromises);
        setSecurities(securitiesWithPrices);
      } catch (err) {
        console.error("Error fetching securities:", err);
      }
    };

    const fetchBlogs = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/blog`);
        if (!res.ok) throw new Error(`Failed to fetch blogs: ${res.status}`);
        const data = await res.json();
        setBlogs(data.slice(0, 3));
      } catch (err) {
        console.error("Error fetching blogs:", err);
      }
    };

    const fetchNews = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/news`);
        if (!res.ok) throw new Error(`Failed to fetch news: ${res.status}`);
        const data = await res.json();
        setNews(data.slice(0, 15));
      } catch (err) {
        console.error("Error fetching news:", err);
      }
    };

    fetchSecurities();
    fetchBlogs();
    fetchNews();
  }, []);

  const renderTable = (ids, title) => {
    const filtered = securities.filter((sec) => ids.includes(sec.security_id));

    return (
      <section className="home-card">
        <div className="home-card-header">
          <div className="home-card-title">{title}</div>
          <div className="home-card-meta">
            {filtered.length} {filtered.length === 1 ? "market" : "markets"}
          </div>
        </div>

        <div className="home-table-wrapper">
          <table className="home-table">
            <colgroup>
              <col className="home-col-security" />
              <col className="home-col-price" />
              <col className="home-col-trend" />
            </colgroup>
            <thead>
              <tr>
                <th>Security</th>
                <th>Most Recent Price</th>
                <th>Trend (Last 5)</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((sec, idx) => {
                const prices = sec.last5Prices || [];
                const price = prices.length ? prices[prices.length - 1].toFixed(2) : "N/A";

                let sparkClass = "home-neutral";
                let sparkColor = "#5f6d69";

                if (prices.length >= 2) {
                  const first = prices[0];
                  const last = prices[prices.length - 1];

                  if (last > first) {
                    sparkClass = "home-positive";
                    sparkColor = "#1b8f53";
                  } else if (last < first) {
                    sparkClass = "home-negative";
                    sparkColor = "#d64545";
                  }
                }

                return (
                  <tr key={idx} className="home-row">
                    <td className="home-security-name">{sec.security_long_name}</td>
                    <td className={sparkClass}>{price}</td>
                    <td className="home-trend-cell">
                      {prices.length > 1 ? (
                        <div className="home-sparkline">
                          <MiniAreaSparkline data={prices} color={sparkColor} />
                        </div>
                      ) : (
                        "N/A"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    );
  };

  return (
    <div className="home-page">
      <div className="home-content-wrapper">
        <aside className="home-left-panel">
          <h2 className="section-header">Latest Markets</h2>

          {securities.length > 0 ? (
            <>
              {renderTable([36, 37, 38, 149, 81, 153, 154, 155, 156], "Precious Metals")}
              {renderTable([1, 2, 3, 4, 6, 7, 8, 11, 12], "Stock Markets")}
              {renderTable([16, 17, 18, 19, 20, 21, 22, 24, 29], "Currencies")}
            </>
          ) : (
            <div className="home-loading-card">Loading summary data...</div>
          )}
        </aside>

        <main className="home-main-area">
          <h2 className="section-header">Latest Feed</h2>

          {blogs.length > 0 ? (
            blogs.map((blog) => (
              <article key={blog.post_id} className="home-content-card">
                {blog.image && (
                  <div className="home-blog-image-side">
                    <div className="home-blog-image-frame">
                      <img
                        src={blog.image}
                        alt={blog.title}
                        className="home-blog-image"
                      />
                    </div>
                  </div>
                )}

                <div className="home-blog-content">
                  <h3 className="home-blog-title">{blog.title}</h3>
                  <p className="home-blog-meta">
                    <i>
                      by {blog.author} on {new Date(blog.created_at).toLocaleDateString()}
                    </i>
                  </p>
                  <p className="home-blog-excerpt">
                    {blog.content.substring(0, 120)}...
                  </p>
                  <Link to={`/blog/${blog.post_id}`} className="home-blog-readmore">
                    Read more
                  </Link>
                </div>
              </article>
            ))
          ) : (
            <div className="home-loading-card">Loading blogs...</div>
          )}
        </main>

        <aside className="home-right-panel">
          <h2 className="section-header">Latest News</h2>

          {news.length > 0 ? (
            news.map((item, idx) => (
              <article key={idx} className="home-news-card">
                <a href={item.url} target="_blank" rel="noopener noreferrer">
                  {item.title}
                </a>
                <p className="home-news-source">
                  <i>
                    {item.source} - {new Date(item.publishedAt).toLocaleDateString()}
                  </i>
                </p>
              </article>
            ))
          ) : (
            <div className="home-loading-card">Loading news...</div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default Home;