import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
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
import './BondYields.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const bondYieldOptions = [
  { value: 15, label: 'UK Short' },
  { value: 16, label: 'UK Long' },
  { value: 17, label: 'US Short' },
  { value: 18, label: 'US Long' }
];

const BondYields = () => {
  const [selectedBondYield, setSelectedBondYield] = useState(bondYieldOptions[0]);
  const [historyData, setHistoryData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBondYieldHistory = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/long-term-interest-rates/${selectedBondYield.value}`
        );
        setHistoryData(response.data || []);
        setError(null);
      } catch (error) {
        console.error('Error fetching bond yield history:', error);
        setHistoryData([]);
        setError('Failed to load bond yield history');
      }
    };

    fetchBondYieldHistory();
  }, [selectedBondYield]);

  const sortedData = useMemo(() => {
    return [...historyData].sort((a, b) => {
      return new Date(a.price_date) - new Date(b.price_date);
    });
  }, [historyData]);

  const chartData = {
    labels: sortedData.map(item => new Date(item.price_date).getFullYear()),
    datasets: [
      {
        label: selectedBondYield.label,
        data: sortedData.map(item => Number(item.price)),
        borderColor: '#00796b',
        backgroundColor: 'rgba(0, 121, 107, 0.08)',
        borderWidth: 2.2,
        pointRadius: 0,
        pointHoverRadius: 4,
        fill: false,
        tension: 0.18
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      legend: {
        display: true,
        labels: {
          color: '#1f3f3a',
          boxWidth: 18,
          boxHeight: 2,
          padding: 18,
          font: {
            size: 13,
            weight: '600'
          }
        }
      },
      title: {
        display: true,
        text: `${selectedBondYield.label} Bond Yield History`,
        color: '#123c36',
        padding: {
          top: 8,
          bottom: 22
        },
        font: {
          size: 20,
          weight: '600'
        }
      },
      tooltip: {
        backgroundColor: '#ffffff',
        titleColor: '#123c36',
        bodyColor: '#123c36',
        borderColor: 'rgba(0, 121, 107, 0.18)',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          title: function(context) {
            return `Year: ${context[0].label}`;
          },
          label: function(context) {
            return `${selectedBondYield.label}: ${context.raw}`;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#46615c',
          maxTicksLimit: 14,
          autoSkip: true,
          maxRotation: 0,
          minRotation: 0,
          font: {
            size: 11
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.06)',
          drawBorder: false
        },
        title: {
          display: true,
          text: 'Year',
          color: '#1f3f3a',
          font: {
            size: 13,
            weight: '600'
          },
          padding: {
            top: 12
          }
        }
      },
      y: {
        ticks: {
          color: '#46615c',
          font: {
            size: 11
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.06)',
          drawBorder: false
        },
        title: {
          display: true,
          text: 'Yield',
          color: '#1f3f3a',
          font: {
            size: 13,
            weight: '600'
          }
        }
      }
    },
    elements: {
      line: {
        capBezierPoints: true
      }
    }
  };

  return (
    <div className="bond-yields-container">
      <div className="bond-yields-sidebar">
        <h3>Bond Yields</h3>

        <div className="bond-yield-card-list">
          {bondYieldOptions.map(option => (
            <button
              key={option.value}
              onClick={() => setSelectedBondYield(option)}
              className={`bond-yield-card ${selectedBondYield.value === option.value ? 'selected' : ''}`}
            >
              <span className="bond-yield-card-title">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bond-yields-main-content">
        <h2 className="bond-yields-hdr">{selectedBondYield.label}</h2>

        {error ? (
          <div className="bond-yields-error">{error}</div>
        ) : (
          <div className="bond-yields-chart-wrapper">
            <div className="bond-yields-chart-card">
              <div className="bond-yields-chart-canvas">
                <Line data={chartData} options={chartOptions} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BondYields;