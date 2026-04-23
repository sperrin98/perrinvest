import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./Home.css";

const MiniLineChart = ({
  data = [],
  color = "#5f6d69",
  width = 140,
  height = 44,
  showArea = true,
  showDot = true,
}) => {
  if (!data || data.length < 2) return <span>N/A</span>;

  const cleaned = data.filter((v) => v !== null && v !== undefined && Number.isFinite(v));
  if (cleaned.length < 2) return <span>N/A</span>;

  const padding = 4;
  const min = Math.min(...cleaned);
  const max = Math.max(...cleaned);
  const range = max - min || 1;

  const points = cleaned.map((value, index) => {
    const x = padding + (index * (width - padding * 2)) / (cleaned.length - 1);
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

  const lastPoint = points[points.length - 1];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <line
        x1={padding}
        y1={height - padding}
        x2={width - padding}
        y2={height - padding}
        stroke="rgba(0,0,0,0.08)"
        strokeWidth="1"
      />
      <line
        x1={padding}
        y1={height / 2}
        x2={width - padding}
        y2={height / 2}
        stroke="rgba(0,0,0,0.05)"
        strokeWidth="1"
        strokeDasharray="2 3"
      />

      {showArea && <path d={areaPath} fill={color} opacity="0.14" />}

      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {showDot && (
        <>
          <circle
            cx={lastPoint[0]}
            cy={lastPoint[1]}
            r="4.2"
            fill={color}
            opacity="0.18"
          />
          <circle
            cx={lastPoint[0]}
            cy={lastPoint[1]}
            r="2.4"
            fill={color}
          />
        </>
      )}
    </svg>
  );
};

const keywordMatch = (value = "", keywords = []) => {
  const lower = value.toLowerCase();
  return keywords.every((keyword) => lower.includes(keyword.toLowerCase()));
};

const Home = () => {
  const [securities, setSecurities] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [news, setNews] = useState([]);
  const [ecoDataPoints, setEcoDataPoints] = useState([]);
  const [ecoSeriesCache, setEcoSeriesCache] = useState({});

  const relevantIds = [
    36, 37, 38, 44, 80, 149, 81, 153, 154, 155, 156,
    1, 2, 3, 4, 6, 7, 8, 11, 12,
    16, 17, 18, 19, 20, 21, 22, 24, 29,
  ];

  useEffect(() => {
    const fetchSecurities = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/homepage-market-summary`
        );

        const summaryData = Array.isArray(response.data) ? response.data : [];

        const cleaned = summaryData.map((sec) => ({
          ...sec,
          trendPrices: Array.isArray(sec.trendPrices)
            ? sec.trendPrices
                .map((v) => Number(v))
                .filter((v) => Number.isFinite(v))
            : [],
          latestPrice:
            sec.latestPrice !== null &&
            sec.latestPrice !== undefined &&
            Number.isFinite(Number(sec.latestPrice))
              ? Number(sec.latestPrice)
              : null,
          previousPrice:
            sec.previousPrice !== null &&
            sec.previousPrice !== undefined &&
            Number.isFinite(Number(sec.previousPrice))
              ? Number(sec.previousPrice)
              : null,
        }));

        setSecurities(cleaned);
      } catch (err) {
        console.error("Error fetching securities:", err);
      }
    };

    const fetchBlogs = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/blog`);
        if (!res.ok) throw new Error(`Failed to fetch blogs: ${res.status}`);
        const data = await res.json();
        setBlogs((data || []).slice(0, 10));
      } catch (err) {
        console.error("Error fetching blogs:", err);
      }
    };

    const fetchNews = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/news`);
        if (!res.ok) throw new Error(`Failed to fetch news: ${res.status}`);
        const data = await res.json();
        setNews((data || []).slice(0, 15));
      } catch (err) {
        console.error("Error fetching news:", err);
      }
    };

    const fetchEcoDataPoints = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/eco-data-points`);
        setEcoDataPoints(response.data || []);
      } catch (err) {
        console.error("Error fetching eco data points:", err);
      }
    };

    fetchSecurities();
    fetchBlogs();
    fetchNews();
    fetchEcoDataPoints();
  }, []);

  useEffect(() => {
    const fetchEcoSeries = async () => {
      const targetNames = [
        "uk hpi",
        "nationwide",
        "cpi",
        "inflation",
        "consumer price",
      ];

      const candidates = ecoDataPoints.filter((point) =>
        targetNames.some((name) =>
          (point.eco_data_point_name || "").toLowerCase().includes(name)
        )
      );

      const uncached = candidates.filter(
        (point) => ecoSeriesCache[point.eco_data_point_id] === undefined
      );

      if (!uncached.length) return;

      const updates = {};

      await Promise.all(
        uncached.map(async (point) => {
          try {
            const response = await axios.get(
              `${process.env.REACT_APP_API_URL}/hpi-and-priced-in-gold-rebased-to-100`,
              { params: { data_point_id: point.eco_data_point_id } }
            );

            updates[point.eco_data_point_id] = Array.isArray(response.data)
              ? response.data
              : [];
          } catch (err) {
            updates[point.eco_data_point_id] = [];
          }
        })
      );

      setEcoSeriesCache((prev) => ({ ...prev, ...updates }));
    };

    if (ecoDataPoints.length) fetchEcoSeries();
  }, [ecoDataPoints, ecoSeriesCache]);

  const formatNumber = (value, digits = 2) => {
    if (value === null || value === undefined || !Number.isFinite(value)) return "N/A";
    return Number(value).toLocaleString(undefined, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  };

  const formatDelta = (current, previous) => {
    if (
      current === null ||
      previous === null ||
      !Number.isFinite(current) ||
      !Number.isFinite(previous)
    ) {
      return null;
    }

    const change = current - previous;
    const pct = previous !== 0 ? (change / previous) * 100 : null;

    return {
      change,
      pct,
      direction: change > 0 ? "up" : change < 0 ? "down" : "flat",
    };
  };

  const getSecurityById = (id) => securities.find((sec) => sec.security_id === id);

  const getEcoSeriesByKeywords = (...keywords) => {
    const match = ecoDataPoints.find((point) =>
      keywordMatch(point.eco_data_point_name || "", keywords)
    );

    if (!match) return null;

    const rawSeries = ecoSeriesCache[match.eco_data_point_id] || [];
    if (!rawSeries.length) return null;

    return {
      point: match,
      series: rawSeries,
    };
  };

  const latestFromEcoSeries = (seriesObj, candidateKeys = []) => {
    if (!seriesObj || !seriesObj.series || !seriesObj.series.length) return null;

    const sorted = [...seriesObj.series].sort(
      (a, b) => new Date(a.price_date) - new Date(b.price_date)
    );
    const latest = sorted[sorted.length - 1];

    for (const key of candidateKeys) {
      if (latest[key] !== undefined && latest[key] !== null && latest[key] !== "") {
        const parsed = Number(latest[key]);
        if (Number.isFinite(parsed)) return parsed;
      }
    }

    return null;
  };

  const goldSecurity = useMemo(() => getSecurityById(36), [securities]);
  const silverSecurity = useMemo(() => getSecurityById(37), [securities]);
  const usdGbpSecurity = useMemo(() => getSecurityById(17), [securities]);
  const crudeOilSecurity = useMemo(() => getSecurityById(44), [securities]);
  const naturalGasSecurity = useMemo(() => getSecurityById(80), [securities]);
  const palladiumSecurity = useMemo(() => getSecurityById(149), [securities]);

  const spSecurity = useMemo(
    () =>
      securities.find((sec) =>
        keywordMatch(sec.security_long_name || "", ["s&p"]) ||
        keywordMatch(sec.security_long_name || "", ["s&p", "500"]) ||
        keywordMatch(sec.security_long_name || "", ["sp500"])
      ),
    [securities]
  );

  const ukHpiSeries = useMemo(
    () =>
      getEcoSeriesByKeywords("uk", "hpi") ||
      getEcoSeriesByKeywords("nationwide") ||
      getEcoSeriesByKeywords("house", "price"),
    [ecoDataPoints, ecoSeriesCache]
  );

  const cpiSeries = useMemo(
    () =>
      getEcoSeriesByKeywords("uk", "inflation") ||
      getEcoSeriesByKeywords("uk", "cpi") ||
      getEcoSeriesByKeywords("consumer", "price"),
    [ecoDataPoints, ecoSeriesCache]
  );

  const dashboardCards = useMemo(() => {
    const cards = [];

    const buildSecurityCard = (title, security, options = {}) => {
      const latest = security?.latestPrice ?? null;
      const previous = security?.previousPrice ?? null;
      const delta = formatDelta(latest, previous);

      cards.push({
        type: "metric",
        title,
        value: formatNumber(latest, options.digits ?? 2),
        subvalue:
          delta && delta.pct !== null
            ? `${delta.change >= 0 ? "+" : ""}${formatNumber(delta.change, 2)} (${delta.pct >= 0 ? "+" : ""}${formatNumber(delta.pct, 2)}%)`
            : "No recent change",
        trendClass:
          delta?.direction === "up"
            ? "dashboard-up"
            : delta?.direction === "down"
              ? "dashboard-down"
              : "dashboard-flat",
        chartData: security?.trendPrices || [],
      });
    };

    buildSecurityCard("Gold today", goldSecurity);
    buildSecurityCard("Silver today", silverSecurity);
    buildSecurityCard("Palladium today", palladiumSecurity);
    buildSecurityCard("Natural Gas today", naturalGasSecurity);
    buildSecurityCard("Crude Oil today", crudeOilSecurity);
    buildSecurityCard("USD/GBP today", usdGbpSecurity);

    const goldLatest = goldSecurity?.latestPrice ?? null;
    const silverLatest = silverSecurity?.latestPrice ?? null;
    const spLatest = spSecurity?.latestPrice ?? null;
    const ukHpiLatest = latestFromEcoSeries(ukHpiSeries, [
      "HPI_index_real",
      "HPI_index",
      "hpi_index",
    ]);
    const cpiLatest = latestFromEcoSeries(cpiSeries, ["price", "HPI_index", "hpi_index"]);

    cards.push({
      type: "metric",
      title: "Gold/Silver ratio",
      value:
        goldLatest !== null && silverLatest !== null && silverLatest !== 0
          ? formatNumber(goldLatest / silverLatest, 2)
          : "N/A",
      subvalue: "Gold divided by silver",
      trendClass: "dashboard-flat",
      chartData:
        goldSecurity?.trendPrices?.length && silverSecurity?.trendPrices?.length
          ? goldSecurity.trendPrices
              .map((gold, idx) => {
                const silver = silverSecurity.trendPrices[idx];
                return silver ? gold / silver : null;
              })
              .filter((v) => v !== null)
          : [],
    });

    cards.push({
      type: "metric",
      title: "S&P/Gold ratio",
      value:
        spLatest !== null && goldLatest !== null && goldLatest !== 0
          ? formatNumber(spLatest / goldLatest, 2)
          : "N/A",
      subvalue: "Equities relative to gold",
      trendClass: "dashboard-flat",
      chartData:
        spSecurity?.trendPrices?.length && goldSecurity?.trendPrices?.length
          ? spSecurity.trendPrices
              .map((sp, idx) => {
                const gold = goldSecurity.trendPrices[idx];
                return gold ? sp / gold : null;
              })
              .filter((v) => v !== null)
          : [],
    });

    cards.push({
      type: "metric",
      title: "UK HPI/gold",
      value:
        ukHpiLatest !== null && goldLatest !== null && goldLatest !== 0
          ? formatNumber(ukHpiLatest / goldLatest, 2)
          : "N/A",
      subvalue: "Housing vs gold",
      trendClass: "dashboard-flat",
      chartData: [],
    });

    cards.push({
      type: "metric",
      title: "CPI latest",
      value: cpiLatest !== null ? formatNumber(cpiLatest, 2) : "N/A",
      subvalue: "Latest inflation print",
      trendClass: "dashboard-flat",
      chartData: [],
    });

    return cards;
  }, [
    goldSecurity,
    silverSecurity,
    palladiumSecurity,
    naturalGasSecurity,
    crudeOilSecurity,
    usdGbpSecurity,
    spSecurity,
    ukHpiSeries,
    cpiSeries,
  ]);

  const topMovers = useMemo(() => {
    return securities
      .map((sec) => {
        const latest = sec.latestPrice;
        const previous = sec.previousPrice;
        if (
          latest === null ||
          previous === null ||
          !Number.isFinite(latest) ||
          !Number.isFinite(previous) ||
          previous === 0
        ) {
          return null;
        }

        const pctMove = ((latest - previous) / previous) * 100;

        return {
          ...sec,
          pctMove,
        };
      })
      .filter(Boolean)
      .sort((a, b) => Math.abs(b.pctMove) - Math.abs(a.pctMove))
      .slice(0, 5);
  }, [securities]);

  const chartsOfWeek = useMemo(() => {
    return [
      { key: "gold", item: goldSecurity, label: "Gold" },
      { key: "silver", item: silverSecurity, label: "Silver" },
      { key: "palladium", item: palladiumSecurity, label: "Palladium" },
      { key: "natural-gas", item: naturalGasSecurity, label: "Natural Gas" },
      { key: "crude-oil", item: crudeOilSecurity, label: "Crude Oil" },
      { key: "usd-gbp", item: usdGbpSecurity, label: "USD/GBP" },
    ];
  }, [
    goldSecurity,
    silverSecurity,
    palladiumSecurity,
    naturalGasSecurity,
    crudeOilSecurity,
    usdGbpSecurity,
  ]);

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
                <th>Trend (30)</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((sec, idx) => {
                const prices = sec.trendPrices || [];
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
                          <MiniLineChart data={prices} color={sparkColor} width={126} height={34} />
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
              {renderTable([36, 37, 38, 44, 80, 149, 81, 153, 154, 155, 156], "Precious Metals & Commodities")}
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

      <div className="home-dashboard-shell">
        <div className="home-dashboard-header">
          <h2 className="section-header home-dashboard-title">Live Dashboard</h2>
          <p className="home-dashboard-subtitle">
            Daily pulse, cross-market ratios, movers and quick charts.
          </p>
        </div>

        <section className="home-dashboard-grid">
          {dashboardCards.map((card, idx) => (
            <article key={idx} className="home-dashboard-card">
              <div className="home-dashboard-card-top">
                <span className="home-dashboard-card-label">{card.title}</span>
              </div>

              <div className="home-dashboard-card-value">{card.value}</div>

              <div className={`home-dashboard-card-subvalue ${card.trendClass}`}>
                {card.subvalue}
              </div>

              <div className="home-dashboard-card-chart">
                {card.chartData && card.chartData.length > 1 ? (
                  <MiniLineChart
                    data={card.chartData}
                    color={
                      card.trendClass === "dashboard-up"
                        ? "#1b8f53"
                        : card.trendClass === "dashboard-down"
                          ? "#d64545"
                          : "#5f6d69"
                    }
                    width={180}
                    height={54}
                  />
                ) : (
                  <span className="home-dashboard-muted">No chart</span>
                )}
              </div>
            </article>
          ))}
        </section>

        <div className="home-dashboard-lower">
          <section className="home-card home-dashboard-panel">
            <div className="home-card-header">
              <div className="home-card-title">Top Movers</div>
              <div className="home-card-meta">Latest move vs previous print</div>
            </div>

            {topMovers.length ? (
              <div className="home-movers-list">
                {topMovers.map((sec) => (
                  <div key={sec.security_id} className="home-mover-row">
                    <div className="home-mover-info">
                      <div className="home-mover-name">{sec.security_long_name}</div>
                      <div className="home-mover-price">{formatNumber(sec.latestPrice, 2)}</div>
                    </div>
                    <div
                      className={`home-mover-move ${
                        sec.pctMove > 0
                          ? "home-positive"
                          : sec.pctMove < 0
                            ? "home-negative"
                            : "home-neutral"
                      }`}
                    >
                      {sec.pctMove > 0 ? "+" : ""}
                      {formatNumber(sec.pctMove, 2)}%
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="home-loading-card">No mover data yet.</div>
            )}
          </section>

          <section className="home-card home-dashboard-panel">
            <div className="home-card-header">
              <div className="home-card-title">Charts of the Week</div>
              <div className="home-card-meta">Last 30 observations</div>
            </div>

            <div className="home-weekly-charts">
              {chartsOfWeek.map(({ key, item, label }) => {
                const prices = item?.trendPrices || [];
                const latest = item?.latestPrice ?? null;
                const first = prices[0];
                const last = prices[prices.length - 1];

                let chartColor = "#5f6d69";
                if (prices.length >= 2) {
                  if (last > first) chartColor = "#1b8f53";
                  else if (last < first) chartColor = "#d64545";
                }

                return (
                  <div key={key} className="home-week-chart-card">
                    <div className="home-week-chart-name">{label}</div>
                    <div className="home-week-chart-price">
                      {formatNumber(latest, 2)}
                    </div>
                    <div className="home-week-chart-visual">
                      {prices.length > 1 ? (
                        <MiniLineChart data={prices} color={chartColor} width={220} height={64} />
                      ) : (
                        <span className="home-dashboard-muted">No chart</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Home;