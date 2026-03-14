import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import DatePicker from "react-datepicker";
import { Line } from "react-chartjs-2";
import "react-datepicker/dist/react-datepicker.css";
import styles from "./MarketLeagues.module.css";

const MarketLeagues = () => {
  const [marketLeagues, setMarketLeagues] = useState([]);
  const [leagueTable, setLeagueTable] = useState([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState(null);
  const [selectedLeagueName, setSelectedLeagueName] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [constituentData, setConstituentData] = useState([]);
  const [selectedConstituentName, setSelectedConstituentName] = useState("");
  const [selectedConstituentRow, setSelectedConstituentRow] = useState(null);

  useEffect(() => {
    const fetchMarketLeagues = async () => {
      try {
        const apiUrl = process.env.REACT_APP_API_URL;
        const response = await axios.get(`${apiUrl}/market_leagues`);
        setMarketLeagues(response.data);

        if (response.data.length > 0) {
          const previousBusinessDay = await getPreviousBusinessDay();
          fetchLeagueTable(
            response.data[0][0],
            response.data[0][1],
            previousBusinessDay
          );
        }
      } catch (error) {
        console.error("Error fetching market leagues:", error);
        setErrorMessage("Error fetching market leagues");
      }
    };

    fetchMarketLeagues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getPreviousBusinessDay = async () => {
    let date = new Date();
    date.setDate(date.getDate() - 1);

    while (
      date.getDay() === 0 ||
      date.getDay() === 6 ||
      (await isBankHoliday(date))
    ) {
      date.setDate(date.getDate() - 1);
    }

    setSelectedDate(date);
    return date;
  };

  const isBankHoliday = async (date) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL;
      const formattedDate = date.toISOString().split("T")[0];
      const response = await axios.get(
        `${apiUrl}/is_bank_holiday/${formattedDate}`
      );
      return response.data.is_holiday;
    } catch (error) {
      console.error("Error checking bank holiday:", error);
      return false;
    }
  };

  const fetchLeagueTable = async (leagueId, leagueName, date) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL;
      const formattedDate = date.toISOString().split("T")[0];
      const response = await axios.get(
        `${apiUrl}/market_league_table/${leagueId}/${formattedDate}`
      );

      setLeagueTable(response.data);
      setSelectedLeagueId(leagueId);
      setSelectedLeagueName(leagueName);
      setConstituentData([]);
      setSelectedConstituentName("");
      setSelectedConstituentRow(null);
      setErrorMessage("");
    } catch (error) {
      console.error("Error fetching league table:", error);
      setErrorMessage("Error fetching league data");
    }
  };

  const fetchConstituentData = async (constituentId, constituentName, row) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL;
      const response = await axios.get(
        `${apiUrl}/get_market_league_data/${constituentId}`
      );

      if (response.data.error) {
        setErrorMessage(response.data.error);
        setConstituentData([]);
        setSelectedConstituentName("");
        setSelectedConstituentRow(null);
      } else {
        setConstituentData(response.data);
        setSelectedConstituentName(constituentName);
        setSelectedConstituentRow(row);
        setErrorMessage("");
      }
    } catch (error) {
      console.error("Error fetching constituent data:", error);
      setErrorMessage("Error fetching constituent data");
      setSelectedConstituentName("");
      setSelectedConstituentRow(null);
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    if (selectedLeagueId && date) {
      fetchLeagueTable(selectedLeagueId, selectedLeagueName, date);
    }
  };

  const formatPercentage = (value) => {
    return value || value === 0 ? `${(value * 100).toFixed(2)}%` : "0.00%";
  };

  const formatDecimal = (value) => {
    return value || value === 0 ? value.toFixed(2) : "0.00";
  };

  const scoreToneClass = (value) => {
    if (value > 0) return styles.mlgPositive;
    if (value < 0) return styles.mlgNegative;
    return styles.mlgNeutral;
  };

  const lineChartData = {
    labels: constituentData.map((row) =>
      new Date(row[0]).toISOString().split("T")[0]
    ),
    datasets: [
      {
        label: "Relative Index",
        data: constituentData.map((row) => row[1]),
        borderColor: "#00796b",
        backgroundColor: "transparent",
        borderWidth: 2,
        pointRadius: 0,
        pointHitRadius: 10,
        tension: 0.25,
      },
      {
        label: "Short EMA",
        data: constituentData.map((row) => row[2]),
        borderColor: "#1e88e5",
        backgroundColor: "transparent",
        borderWidth: 1.5,
        pointRadius: 0,
        pointHitRadius: 10,
        tension: 0.25,
      },
      {
        label: "Long EMA",
        data: constituentData.map((row) => row[3]),
        borderColor: "#fb8c00",
        backgroundColor: "transparent",
        borderWidth: 1.5,
        pointRadius: 0,
        pointHitRadius: 10,
        tension: 0.25,
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top", labels: { color: "#004d40" } },
      tooltip: { intersect: false, mode: "index" },
    },
    interaction: { intersect: false, mode: "index" },
    scales: {
      x: {
        title: { display: true, text: "Date", color: "#004d40" },
        ticks: { color: "#00796b", maxTicksLimit: 10 },
        grid: { color: "rgba(0,0,0,0.06)" },
      },
      y: {
        title: { display: true, text: "Values", color: "#004d40" },
        ticks: { color: "#00796b" },
        grid: { color: "rgba(0,0,0,0.06)" },
      },
    },
  };

  const tableRows = useMemo(() => leagueTable || [], [leagueTable]);

  return (
    <div className={styles.mlgContainer}>
      <aside className={styles.mlgSidebar}>
        <div className={styles.mlgDateFilter}>
          <label className={styles.mlgDateLabel} htmlFor="mlg-date-picker">
            Select Date
          </label>
          <DatePicker
            id="mlg-date-picker"
            selected={selectedDate}
            onChange={handleDateChange}
            dateFormat="yyyy-MM-dd"
            className={styles.mlgDateInput}
          />
        </div>

        <div className={styles.mlgSidebarTitle}>Market Leagues</div>

        <ul className={styles.mlgLeagueList}>
          {marketLeagues.length > 0 ? (
            marketLeagues.map((league) => (
              <li
                key={league[0]}
                className={`${styles.mlgLeagueItem} ${
                  selectedLeagueId === league[0]
                    ? styles.mlgLeagueItemSelected
                    : ""
                }`}
                onClick={() =>
                  selectedDate &&
                  fetchLeagueTable(league[0], league[1], selectedDate)
                }
              >
                {league[1]}
              </li>
            ))
          ) : (
            <li className={styles.mlgEmpty}>No market leagues available.</li>
          )}
        </ul>
      </aside>

      <main className={styles.mlgMain}>
        <div className={styles.mlgTitle}>
          League Table: {selectedLeagueName || "Loading..."}
        </div>

        {errorMessage && <div className={styles.mlgError}>{errorMessage}</div>}

        <div className={styles.mlgContentGrid}>
          <section className={styles.mlgTableCard}>
            <div className={styles.mlgTableCardHeader}>
              <div className={styles.mlgTableHeading}>Constituents</div>
              <div className={styles.mlgTableMeta}>
                {tableRows.length} {tableRows.length === 1 ? "name" : "names"}
              </div>
            </div>

            <div className={styles.mlgTableWrapper}>
              <table className={styles.mlgTable}>
                <thead>
                  <tr>
                    <th>Security</th>
                    <th>Price</th>
                    <th>Move</th>
                    <th>Score</th>
                    <th>Momentum</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.length > 0 ? (
                    tableRows.map((row, index) => (
                      <tr
                        key={index}
                        className={`${styles.mlgRow} ${
                          selectedConstituentRow &&
                          selectedConstituentRow[0] === row[0]
                            ? styles.mlgRowSelected
                            : ""
                        }`}
                        onClick={() => fetchConstituentData(row[0], row[1], row)}
                      >
                        <td className={styles.mlgSecurityCell}>
                          <span className={styles.mlgSecurityName}>{row[1]}</span>
                        </td>
                        <td>{formatDecimal(row[2])}</td>
                        <td className={scoreToneClass(row[3])}>
                          {formatPercentage(row[3])}
                        </td>
                        <td className={scoreToneClass(row[4])}>
                          {formatPercentage(row[4])}
                        </td>
                        <td>{formatDecimal(row[5])}</td>
                      </tr>
                    ))
                  ) : (
                    <tr className={styles.mlgRow}>
                      <td colSpan="5">{errorMessage || "No data available"}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className={styles.mlgVisualCard}>
            {constituentData.length > 0 && selectedConstituentName ? (
              <>
                <div className={styles.mlgChartHeader}>
                  <div>
                    <div className={styles.mlgSubtitle}>
                      {selectedConstituentName}
                    </div>
                    <div className={styles.mlgChartHint}>
                      Relative index with short and long EMA
                    </div>
                  </div>
                </div>

                <div className={styles.mlgChartWrapper}>
                  <Line data={lineChartData} options={lineChartOptions} />
                </div>

                {selectedConstituentRow && (
                  <div className={styles.mlgScorePanel}>
                    <div className={styles.mlgScoreItem}>
                      <span className={styles.mlgScoreLabel}>Price</span>
                      <span className={styles.mlgScoreValue}>
                        {formatDecimal(selectedConstituentRow[2])}
                      </span>
                    </div>
                    <div className={styles.mlgScoreItem}>
                      <span className={styles.mlgScoreLabel}>Daily Move</span>
                      <span
                        className={`${styles.mlgScoreValue} ${scoreToneClass(
                          selectedConstituentRow[3]
                        )}`}
                      >
                        {formatPercentage(selectedConstituentRow[3])}
                      </span>
                    </div>
                    <div className={styles.mlgScoreItem}>
                      <span className={styles.mlgScoreLabel}>Score</span>
                      <span
                        className={`${styles.mlgScoreValue} ${scoreToneClass(
                          selectedConstituentRow[4]
                        )}`}
                      >
                        {formatPercentage(selectedConstituentRow[4])}
                      </span>
                    </div>
                    <div className={styles.mlgScoreItem}>
                      <span className={styles.mlgScoreLabel}>
                        Relative Momentum
                      </span>
                      <span className={styles.mlgScoreValue}>
                        {formatDecimal(selectedConstituentRow[5])}
                      </span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className={styles.mlgEmptyVisual}>
                Select a name from the table to view the chart and score.
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default MarketLeagues;