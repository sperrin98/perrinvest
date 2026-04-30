import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./UserWatchlist.css";

const API_URL = process.env.REACT_APP_API_URL;

function formatNumber(value, decimals = 2) {
  if (value === null || value === undefined || value === "") return "-";

  const num = Number(value);

  if (Number.isNaN(num)) return "-";

  return num.toLocaleString("en-GB", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatMoney(value) {
  if (value === null || value === undefined || value === "") return "-";

  const num = Number(value);

  if (Number.isNaN(num)) return "-";

  return num.toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatPercent(value) {
  if (value === null || value === undefined || value === "") return "-";

  const num = Number(value);

  if (Number.isNaN(num)) return "-";

  return `${num > 0 ? "+" : ""}${formatNumber(num, 2)}%`;
}

function formatDate(value) {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

function getToneClass(value) {
  const num = Number(value);

  if (Number.isNaN(num)) return "uw-neutral";
  if (num > 0) return "uw-positive";
  if (num < 0) return "uw-negative";

  return "uw-neutral";
}

function getValidUserId(userId, user) {
  const possibleUserId =
    userId ||
    user?.user_id ||
    user?.userId ||
    localStorage.getItem("userId");

  if (
    possibleUserId === null ||
    possibleUserId === undefined ||
    possibleUserId === "" ||
    possibleUserId === "null" ||
    possibleUserId === "undefined"
  ) {
    return null;
  }

  const numericUserId = Number(possibleUserId);

  if (Number.isNaN(numericUserId) || numericUserId <= 0) {
    return null;
  }

  return numericUserId;
}

function UserWatchlist({ user, userId, isLoggedIn }) {
  const loggedInUserId = getValidUserId(userId, user);

  const [watchlist, setWatchlist] = useState([]);
  const [securities, setSecurities] = useState([]);

  const [selectedSecurityId, setSelectedSecurityId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [buyDate, setBuyDate] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [notes, setNotes] = useState("");

  const [selectedRow, setSelectedRow] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingSecurityId, setDeletingSecurityId] = useState(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const resetForm = () => {
    setSelectedSecurityId("");
    setQuantity("");
    setBuyPrice("");
    setBuyDate("");
    setTargetPrice("");
    setNotes("");
  };

  const fetchWatchlist = async () => {
    if (!loggedInUserId) {
      setWatchlist([]);
      setSelectedRow(null);
      return [];
    }

    console.log("Fetching watchlist for user:", loggedInUserId);
    console.log("API URL:", API_URL);

    const response = await axios.get(
      `${API_URL}/user-watchlist-data/${loggedInUserId}`
    );

    const rows = Array.isArray(response.data) ? response.data : [];

    setWatchlist(rows);
    setSelectedRow(rows.length > 0 ? rows[0] : null);

    return rows;
  };

  const fetchSecurities = async () => {
    const response = await axios.get(`${API_URL}/securities`);
    setSecurities(Array.isArray(response.data) ? response.data : []);
  };

  useEffect(() => {
    async function loadPage() {
      setLoading(true);
      setError("");
      setMessage("");

      if (!isLoggedIn || !loggedInUserId) {
        setLoading(false);
        return;
      }

      try {
        await Promise.all([fetchWatchlist(), fetchSecurities()]);
      } catch (err) {
        console.error("Error loading user watchlist page:", err);
        setError(err.response?.data?.error || "Failed to load your watchlist.");
      } finally {
        setLoading(false);
      }
    }

    loadPage();
  }, [isLoggedIn, loggedInUserId]);

  const availableSecurities = useMemo(() => {
    const savedIds = new Set(watchlist.map((row) => Number(row.security_id)));

    return securities.filter(
      (security) => !savedIds.has(Number(security.security_id))
    );
  }, [securities, watchlist]);

  const summary = useMemo(() => {
    const totalValue = watchlist.reduce(
      (sum, row) => sum + Number(row.position_value || 0),
      0
    );

    const totalInvested = watchlist.reduce(
      (sum, row) => sum + Number(row.invested_value || 0),
      0
    );

    const totalProfitLoss = watchlist.reduce(
      (sum, row) => sum + Number(row.unrealised_profit_loss || 0),
      0
    );

    const totalProfitLossPct =
      totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : null;

    const bestPerformer = [...watchlist]
      .filter(
        (row) =>
          row.unrealised_profit_loss_pct !== null &&
          row.unrealised_profit_loss_pct !== undefined
      )
      .sort(
        (a, b) =>
          Number(b.unrealised_profit_loss_pct) -
          Number(a.unrealised_profit_loss_pct)
      )[0];

    const mostVolatile = [...watchlist]
      .filter((row) => row.VOL_90d !== null && row.VOL_90d !== undefined)
      .sort((a, b) => Number(b.VOL_90d) - Number(a.VOL_90d))[0];

    return {
      totalValue,
      totalInvested,
      totalProfitLoss,
      totalProfitLossPct,
      bestPerformer,
      mostVolatile,
    };
  }, [watchlist]);

  const handleAddSecurity = async (e) => {
    e.preventDefault();

    if (!loggedInUserId) {
      setError("You need to be logged in to save securities.");
      return;
    }

    if (!selectedSecurityId) {
      setError("Please select a security.");
      return;
    }

    const payload = {
      user_id: loggedInUserId,
      security_id: Number(selectedSecurityId),
      quantity: quantity === "" ? null : Number(quantity),
      buy_price: buyPrice === "" ? null : Number(buyPrice),
      buy_date: buyDate || null,
      target_price: targetPrice === "" ? null : Number(targetPrice),
      notes: notes || null,
    };

    console.log("Posting watchlist payload:", payload);
    console.log("Posting to:", `${API_URL}/user-watchlist-add`);

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await axios.post(`${API_URL}/user-watchlist-add`, payload);

      await fetchWatchlist();

      resetForm();
      setMessage("Security added to your watchlist.");
    } catch (err) {
      console.error("Error adding security:", err);
      setError(err.response?.data?.error || "Failed to add security.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSecurity = async (securityId) => {
    if (!loggedInUserId) {
      setError("You need to be logged in to remove securities.");
      return;
    }

    setDeletingSecurityId(securityId);
    setError("");
    setMessage("");

    try {
      await axios.delete(
        `${API_URL}/user-watchlist-delete/${loggedInUserId}/${securityId}`
      );

      const rows = await fetchWatchlist();

      if (selectedRow && Number(selectedRow.security_id) === Number(securityId)) {
        setSelectedRow(rows[0] || null);
      }

      setMessage("Security removed from your watchlist.");
    } catch (err) {
      console.error("Error deleting security:", err);
      setError(err.response?.data?.error || "Failed to remove security.");
    } finally {
      setDeletingSecurityId(null);
    }
  };

  if (!isLoggedIn || !loggedInUserId) {
    return (
      <div className="uw-page">
        <div className="uw-login-required">
          <div className="uw-login-icon">🔒</div>
          <h1>Login Required</h1>
          <p>You need to be logged in to view and manage your watchlist.</p>
          <a href="/login" className="uw-login-button">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="uw-page">
        <div className="uw-loading-card">
          <h2>Loading Watchlist...</h2>
          <p>Checking your saved securities.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="uw-page">
      <aside className="uw-sidebar">
        <div className="uw-sidebar-header">
          <h2>My Watchlist</h2>
          <p>Save securities and track returns, volatility, drawdowns and P/L.</p>
        </div>

        <form className="uw-form" onSubmit={handleAddSecurity}>
          <label className="uw-label">
            Security
            <select
              value={selectedSecurityId}
              onChange={(e) => setSelectedSecurityId(e.target.value)}
              className="uw-input"
            >
              <option value="">Select security...</option>
              {availableSecurities.map((security) => (
                <option key={security.security_id} value={security.security_id}>
                  {security.security_long_name}
                </option>
              ))}
            </select>
          </label>

          <div className="uw-form-grid">
            <label className="uw-label">
              Quantity
              <input
                type="number"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="uw-input"
                placeholder="Optional"
              />
            </label>

            <label className="uw-label">
              Buy Price
              <input
                type="number"
                step="any"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
                className="uw-input"
                placeholder="Optional"
              />
            </label>
          </div>

          <label className="uw-label">
            Buy Date
            <input
              type="date"
              value={buyDate}
              onChange={(e) => setBuyDate(e.target.value)}
              className="uw-input"
            />
          </label>

          <label className="uw-label">
            Target Price
            <input
              type="number"
              step="any"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              className="uw-input"
              placeholder="Optional"
            />
          </label>

          <label className="uw-label">
            Notes
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="uw-input uw-textarea"
              placeholder="Optional note..."
            />
          </label>

          <button className="uw-primary-button" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Add to Watchlist"}
          </button>
        </form>

        {message && <div className="uw-alert uw-alert-success">{message}</div>}
        {error && <div className="uw-alert uw-alert-error">{error}</div>}
      </aside>

      <main className="uw-main">
        <section className="uw-hero">
          <div>
            <h1>User Watchlist</h1>
            <p>
              Track saved securities, returns, moving averages, volatility,
              drawdowns and position-level profit/loss.
            </p>
          </div>

          <div className="uw-count-pill">
            {watchlist.length} saved{" "}
            {watchlist.length === 1 ? "security" : "securities"}
          </div>
        </section>

        <section className="uw-summary-grid">
          <div className="uw-summary-card">
            <span>Total Value</span>
            <strong>{formatMoney(summary.totalValue)}</strong>
          </div>

          <div className="uw-summary-card">
            <span>Total Invested</span>
            <strong>{formatMoney(summary.totalInvested)}</strong>
          </div>

          <div className="uw-summary-card">
            <span>Total P/L</span>
            <strong className={getToneClass(summary.totalProfitLoss)}>
              {formatMoney(summary.totalProfitLoss)}
            </strong>
            <small className={getToneClass(summary.totalProfitLossPct)}>
              {formatPercent(summary.totalProfitLossPct)}
            </small>
          </div>

          <div className="uw-summary-card">
            <span>Best Performer</span>
            <strong>
              {summary.bestPerformer
                ? summary.bestPerformer.security_short_name ||
                  summary.bestPerformer.security_long_name
                : "-"}
            </strong>
            <small
              className={getToneClass(
                summary.bestPerformer?.unrealised_profit_loss_pct
              )}
            >
              {formatPercent(summary.bestPerformer?.unrealised_profit_loss_pct)}
            </small>
          </div>

          <div className="uw-summary-card">
            <span>Most Volatile</span>
            <strong>
              {summary.mostVolatile
                ? summary.mostVolatile.security_short_name ||
                  summary.mostVolatile.security_long_name
                : "-"}
            </strong>
            <small>{formatPercent(summary.mostVolatile?.VOL_90d)}</small>
          </div>
        </section>

        {watchlist.length === 0 ? (
          <section className="uw-empty">
            <h2>No saved securities yet</h2>
            <p>
              Use the sidebar to add a security. Once saved, this page will show
              returns, volatility, drawdown, moving averages and profit/loss.
            </p>
          </section>
        ) : (
          <>
            <section className="uw-table-card">
              <div className="uw-table-header">
                <h2>Saved Securities</h2>
                <p>Click a row to view the detail panel below.</p>
              </div>

              <div className="uw-table-scroll">
                <table className="uw-table">
                  <thead>
                    <tr>
                      <th>Security</th>
                      <th>Latest</th>
                      <th>1D</th>
                      <th>1M</th>
                      <th>YTD</th>
                      <th>1Y</th>
                      <th>VOL 90D</th>
                      <th>Trend</th>
                      <th>Max DD</th>
                      <th>Buy Price</th>
                      <th>Qty</th>
                      <th>P/L</th>
                      <th>P/L %</th>
                      <th></th>
                    </tr>
                  </thead>

                  <tbody>
                    {watchlist.map((row) => (
                      <tr
                        key={row.user_saved_security_id}
                        onClick={() => setSelectedRow(row)}
                        className={
                          selectedRow?.user_saved_security_id ===
                          row.user_saved_security_id
                            ? "uw-selected-row"
                            : ""
                        }
                      >
                        <td>
                          <div className="uw-security-cell">
                            <strong>{row.security_long_name}</strong>
                            <span>
                              {row.ticker || row.security_short_name || "-"}
                            </span>
                          </div>
                        </td>

                        <td>{formatNumber(row.latest_price)}</td>

                        <td className={getToneClass(row.daily_return_pct)}>
                          {formatPercent(row.daily_return_pct)}
                        </td>

                        <td className={getToneClass(row.one_month_return_pct)}>
                          {formatPercent(row.one_month_return_pct)}
                        </td>

                        <td className={getToneClass(row.ytd_return_pct)}>
                          {formatPercent(row.ytd_return_pct)}
                        </td>

                        <td className={getToneClass(row.one_year_return_pct)}>
                          {formatPercent(row.one_year_return_pct)}
                        </td>

                        <td>{formatPercent(row.VOL_90d)}</td>

                        <td>
                          <span
                            className={`uw-trend-pill uw-trend-${String(
                              row.trend_status || "neutral"
                            ).toLowerCase()}`}
                          >
                            {row.trend_status || "Neutral"}
                          </span>
                        </td>

                        <td className={getToneClass(row.max_drawdown_pct)}>
                          {formatPercent(row.max_drawdown_pct)}
                        </td>

                        <td>{formatNumber(row.buy_price)}</td>
                        <td>{formatNumber(row.quantity, 4)}</td>

                        <td className={getToneClass(row.unrealised_profit_loss)}>
                          {formatMoney(row.unrealised_profit_loss)}
                        </td>

                        <td
                          className={getToneClass(
                            row.unrealised_profit_loss_pct
                          )}
                        >
                          {formatPercent(row.unrealised_profit_loss_pct)}
                        </td>

                        <td>
                          <button
                            className="uw-delete-button"
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSecurity(row.security_id);
                            }}
                            disabled={deletingSecurityId === row.security_id}
                          >
                            {deletingSecurityId === row.security_id
                              ? "..."
                              : "Remove"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {selectedRow && (
              <section className="uw-detail-card">
                <div className="uw-detail-header">
                  <div>
                    <h2>{selectedRow.security_long_name}</h2>
                    <p>
                      Latest data date:{" "}
                      <strong>{formatDate(selectedRow.latest_price_date)}</strong>
                    </p>
                  </div>

                  <span
                    className={`uw-trend-pill uw-trend-${String(
                      selectedRow.trend_status || "neutral"
                    ).toLowerCase()}`}
                  >
                    {selectedRow.trend_status || "Neutral"}
                  </span>
                </div>

                <div className="uw-detail-grid">
                  <div className="uw-metric">
                    <span>Latest Price</span>
                    <strong>{formatNumber(selectedRow.latest_price)}</strong>
                  </div>

                  <div className="uw-metric">
                    <span>Previous Price</span>
                    <strong>{formatNumber(selectedRow.previous_price)}</strong>
                  </div>

                  <div className="uw-metric">
                    <span>52W High</span>
                    <strong>{formatNumber(selectedRow.high_52w)}</strong>
                    <small
                      className={getToneClass(
                        selectedRow.distance_from_52w_high_pct
                      )}
                    >
                      {formatPercent(selectedRow.distance_from_52w_high_pct)}
                    </small>
                  </div>

                  <div className="uw-metric">
                    <span>52W Low</span>
                    <strong>{formatNumber(selectedRow.low_52w)}</strong>
                    <small
                      className={getToneClass(
                        selectedRow.distance_from_52w_low_pct
                      )}
                    >
                      {formatPercent(selectedRow.distance_from_52w_low_pct)}
                    </small>
                  </div>

                  <div className="uw-metric">
                    <span>5D MA</span>
                    <strong>{formatNumber(selectedRow.MA_5d)}</strong>
                  </div>

                  <div className="uw-metric">
                    <span>40D MA</span>
                    <strong>{formatNumber(selectedRow.MA_40d)}</strong>
                  </div>

                  <div className="uw-metric">
                    <span>200D MA</span>
                    <strong>{formatNumber(selectedRow.MA_200d)}</strong>
                    <small
                      className={getToneClass(
                        selectedRow.distance_from_200d_ma_pct
                      )}
                    >
                      {formatPercent(selectedRow.distance_from_200d_ma_pct)}
                    </small>
                  </div>

                  <div className="uw-metric">
                    <span>Target Distance</span>
                    <strong
                      className={getToneClass(
                        selectedRow.distance_to_target_price_pct
                      )}
                    >
                      {formatPercent(selectedRow.distance_to_target_price_pct)}
                    </strong>
                  </div>
                </div>

                {selectedRow.notes && (
                  <div className="uw-notes-box">
                    <span>Notes</span>
                    <p>{selectedRow.notes}</p>
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default UserWatchlist;