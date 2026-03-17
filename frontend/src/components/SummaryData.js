import React, { useEffect, useState } from "react";
import "./SummaryData.css";

function SummaryData() {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const [data1, setData1] = useState([]);
  const [loading1, setLoading1] = useState(false);

  const [data2, setData2] = useState([]);
  const [loading2, setLoading2] = useState(false);

  const getDefaultDate = () => {
    const d = new Date();
    const day = d.getDay();

    d.setDate(d.getDate() - 1);

    if (day === 0) d.setDate(d.getDate() - 1);
    if (day === 1) d.setDate(d.getDate() - 2);

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const [date, setDate] = useState(getDefaultDate());

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/summary-data-groups`,
          { cache: "no-store", headers: { "Cache-Control": "no-cache" } }
        );
        const json = await res.json();
        setGroups(Array.isArray(json) ? json : []);
      } catch (err) {
        console.error("Fetch groups error:", err);
        setGroups([]);
      }
    };

    fetchGroups();
  }, []);

  const fetchTable1 = async (groupId, selectedDate) => {
    setLoading1(true);
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/summary-data?table_id=${groupId}&date=${selectedDate}&_=${Date.now()}`,
        { cache: "no-store", headers: { "Cache-Control": "no-cache" } }
      );
      const json = await res.json();
      setData1(Array.isArray(json) ? json : []);
    } catch (err) {
      console.error("Fetch table 1 error:", err);
      setData1([]);
    } finally {
      setLoading1(false);
    }
  };

  const fetchTable2 = async (groupId, selectedDate) => {
    setLoading2(true);
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/summary-data-in-gold?table_id=${groupId}&date=${selectedDate}&_=${Date.now()}`,
        { cache: "no-store", headers: { "Cache-Control": "no-cache" } }
      );
      const json = await res.json();
      setData2(Array.isArray(json) ? json : []);
    } catch (err) {
      console.error("Fetch table 2 error:", err);
      setData2([]);
    } finally {
      setLoading2(false);
    }
  };

  const fetchBothTables = (groupId, selectedDate) => {
    setData1([]);
    setData2([]);
    fetchTable1(groupId, selectedDate);
    fetchTable2(groupId, selectedDate);
  };

  const formatValue = (val, colName) => {
    if (val === null || val === undefined) return "";

    if (colName === "security_long_name") return val;

    if (colName.toLowerCase().includes("date")) {
      const d = new Date(val);
      if (Number.isNaN(d.getTime())) return String(val);
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    }

    if (typeof val === "number") return `${(val * 100).toFixed(1)}%`;

    return val;
  };

  const toneClass = (raw, key) => {
    if (key === "security_long_name" || key === "price_date") return "";
    if (typeof raw !== "number") return "";
    if (raw > 0) return "sd-positive";
    if (raw < 0) return "sd-negative";
    return "sd-neutral";
  };

  const columnKeys1 = [
    "security_long_name",
    "price_date",
    "DAY_RETURN",
    "MTD_RETURN",
    "QTD_RETURN",
    "YTD_RETURN",
    "3YR_RETURN",
    "5YR_RETURN",
    "10YR_RETURN",
    "CTD_RETURN",
  ];

  const columnKeys2 = [
    "security_long_name",
    "price_date",
    "DAY_RETURN",
    "MTD_RETURN",
    "QTD_RETURN",
    "YTD_RETURN",
    "3YR_RETURN",
    "5YR_RETURN",
    "10YR_RETURN",
  ];

  const headerLabelForKey = (key, titleOverride) => {
    if (key === "security_long_name") {
      return titleOverride ? titleOverride.toUpperCase() : "NAME";
    }
    if (key === "price_date") return "Date";
    return key.replace("_RETURN", "").toUpperCase();
  };

  const renderTableCard = ({
    data,
    loading,
    columnKeys,
    titleOverride,
    metaLabel,
  }) => {
    return (
      <section className="sd-table-card">
        <div className="sd-table-card-header">
          <div className="sd-table-meta">
            {loading ? "Loading..." : `${data.length} ${metaLabel}`}
          </div>
        </div>

        {loading ? (
          <p className="sd-message">Loading...</p>
        ) : !data || data.length === 0 ? (
          <p className="sd-message">No data.</p>
        ) : (
          <div className="sd-table-wrapper">
            <table className="sd-table">
              <thead>
                <tr>
                  {columnKeys.map((key) => (
                    <th key={key}>{headerLabelForKey(key, titleOverride)}</th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {data.map((row, idx) => (
                  <tr key={idx} className="sd-row">
                    {columnKeys.map((key) => {
                      const raw = row?.[key];
                      const val = formatValue(raw, key);

                      return (
                        <td key={key} className={toneClass(raw, key)}>
                          {val}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    );
  };

  return (
    <div className="sd-container">
      <aside className="sd-sidebar">
        <div className="sd-date-section">
          <label className="sd-date-label" htmlFor="sd-date-picker">
            Select Date
          </label>
          <input
            id="sd-date-picker"
            type="date"
            value={date}
            className="sd-date-picker"
            onChange={(e) => {
              const newDate = e.target.value;
              setDate(newDate);

              if (selectedGroup) {
                fetchBothTables(selectedGroup.summary_data_group_ID, newDate);
              }
            }}
          />
        </div>

        <h2 className="sd-sidebar-title">Select Group</h2>

        <ul className="sd-group-list">
          {groups.map((group) => (
            <li
              key={group.summary_data_group_ID}
              className={`sd-group-item ${
                selectedGroup?.summary_data_group_ID ===
                group.summary_data_group_ID
                  ? "sd-selected-group"
                  : ""
              }`}
              onClick={() => {
                setSelectedGroup(group);
                fetchBothTables(group.summary_data_group_ID, date);
              }}
            >
              {group.summary_data_group_name}
            </li>
          ))}
        </ul>
      </aside>

      <main className="sd-main">
        <div className="sd-main-inner">
          {selectedGroup ? (
            <>
              <h1 className="sd-title">Returns in Local Fiat Currency</h1>

              {renderTableCard({
                data: data1,
                loading: loading1,
                columnKeys: columnKeys1,
                titleOverride: selectedGroup.summary_data_group_name,
                metaLabel: data1.length === 1 ? "row" : "rows",
              })}

              <h1 className="sd-title sd-second-title">Returns in Gold</h1>

              {renderTableCard({
                data: data2,
                loading: loading2,
                columnKeys: columnKeys2,
                titleOverride: selectedGroup.summary_data_group_name,
                metaLabel: data2.length === 1 ? "row" : "rows",
              })}
            </>
          ) : (
            <div className="sd-empty-state">
              Select a group from the sidebar to view summary data.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default SummaryData;