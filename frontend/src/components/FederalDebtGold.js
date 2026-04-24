import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import './FederalDebtGold.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function FederalDebtGold() {
  const [chartRows, setChartRows] = useState([]);
  const [error, setError] = useState(null);

  const chartScrollRef = useRef(null);
  const API_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    async function fetchChartData() {
      try {
        const response = await axios.get(
          `${API_URL}/charts/us-federal-debt-priced-in-gold`
        );

        setChartRows(response.data.data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching US federal debt chart data:', err);
        setChartRows([]);
        setError('Failed to load chart data.');
      }
    }

    fetchChartData();
  }, [API_URL]);

  useEffect(() => {
    if (!chartScrollRef.current) return;
    if (window.innerWidth > 650) return;
    if (!chartRows.length) return;

    const scrollToEnd = () => {
      if (!chartScrollRef.current) return;
      chartScrollRef.current.scrollLeft = chartScrollRef.current.scrollWidth;
    };

    requestAnimationFrame(() => {
      scrollToEnd();
      setTimeout(scrollToEnd, 0);
    });
  }, [chartRows.length]);

  const chartData = useMemo(() => {
    return {
      labels: chartRows.map((row) => row.price_date),
      datasets: [
        {
          label: 'US Federal Debt',
          data: chartRows.map((row) => row.us_federal_debt),
          borderColor: '#00796b',
          backgroundColor: 'rgba(0, 121, 107, 0.15)',
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0.15,
          yAxisID: 'y'
        },
        {
          label: 'US Federal Debt Priced in Gold',
          data: chartRows.map((row) => row.us_federal_debt_priced_in_gold),
          borderColor: '#d4af37',
          backgroundColor: 'rgba(212, 175, 55, 0.15)',
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0.15,
          yAxisID: 'y1'
        }
      ]
    };
  }, [chartRows]);

  const chartOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: '#263b37',
            boxWidth: 18,
            boxHeight: 10,
            padding: 14,
            font: {
              size: 12,
              weight: '600'
            }
          }
        },
        title: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0, 77, 64, 0.94)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: 'rgba(255, 255, 255, 0.18)',
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: function (context) {
              const value = context.raw;

              if (value === null || value === undefined) {
                return `${context.dataset.label}: -`;
              }

              return `${context.dataset.label}: ${Number(value).toLocaleString()}`;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: {
            maxTicksLimit: 12,
            color: '#40514e',
            autoSkip: true,
            maxRotation: 0,
            minRotation: 0,
            font: {
              size: 11
            }
          },
          grid: {
            color: 'rgba(0,0,0,0.06)'
          }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          ticks: {
            color: '#00796b',
            font: {
              size: 11
            },
            callback: function (value) {
              return Number(value).toLocaleString();
            }
          },
          title: {
            display: true,
            text: 'US Federal Debt',
            color: '#00796b',
            font: {
              size: 12,
              weight: 'bold'
            }
          },
          grid: {
            color: 'rgba(0,0,0,0.06)'
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          ticks: {
            color: '#b8860b',
            font: {
              size: 11
            },
            callback: function (value) {
              return Number(value).toLocaleString();
            }
          },
          title: {
            display: true,
            text: 'Priced in Gold',
            color: '#b8860b',
            font: {
              size: 12,
              weight: 'bold'
            }
          },
          grid: {
            drawOnChartArea: false
          }
        }
      }
    };
  }, []);

  return (
    <div className="fdg-page">
      <div className="fdg-page-inner">
        <h1 className="fdg-title">US Federal Debt / Gold Chart</h1>

        {error && <p className="fdg-error">{error}</p>}

        <section className="fdg-chart-card">
          <div className="fdg-card-header">
            <div>
              <div className="fdg-card-heading">US Federal Debt and Priced in Gold</div>
              <div className="fdg-card-subheading">
                Dual-axis comparison of nominal US federal debt and debt priced in gold
              </div>
            </div>

            <div className="fdg-card-meta">
              {chartRows.length} {chartRows.length === 1 ? 'point' : 'points'}
            </div>
          </div>

          <div className="fdg-chart-scroll-hint">
            Swipe sideways to view the full chart
          </div>

          <div className="fdg-chart-scroll-area" ref={chartScrollRef}>
            <div className="fdg-chart-container">
              {chartRows.length > 0 ? (
                <Line data={chartData} options={chartOptions} />
              ) : (
                <div className="fdg-no-data">
                  {error || 'No chart data available'}
                </div>
              )}
            </div>
          </div>
        </section>

        {chartRows.length > 0 && (
          <section className="fdg-table-card">
            <div className="fdg-card-header fdg-table-header">
              <div>
                <div className="fdg-card-heading">Underlying Data</div>
                <div className="fdg-card-subheading">Latest 24 rows</div>
              </div>
            </div>

            <div className="fdg-table-wrapper">
              <table className="fdg-table">
                <colgroup>
                  <col className="fdg-col-date" />
                  <col className="fdg-col-debt" />
                  <col className="fdg-col-gold" />
                </colgroup>

                <thead>
                  <tr>
                    <th>Date</th>
                    <th>US Federal Debt</th>
                    <th>Priced in Gold</th>
                  </tr>
                </thead>

                <tbody>
                  {[...chartRows].reverse().slice(0, 24).map((row, idx) => (
                    <tr key={`${row.price_date}-${idx}`}>
                      <td>{row.price_date}</td>
                      <td>
                        {row.us_federal_debt !== null &&
                        row.us_federal_debt !== undefined
                          ? Number(row.us_federal_debt).toLocaleString()
                          : '-'}
                      </td>
                      <td>
                        {row.us_federal_debt_priced_in_gold !== null &&
                        row.us_federal_debt_priced_in_gold !== undefined
                          ? Number(row.us_federal_debt_priced_in_gold).toLocaleString()
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default FederalDebtGold;