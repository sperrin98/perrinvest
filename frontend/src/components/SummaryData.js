import React, { useState, useEffect } from 'react';
import './SummaryData.css';

function SummaryData() {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [data, setData] = useState([]);
  const [date, setDate] = useState('2026-02-11');

  useEffect(() => {
    const fetchGroups = async () => {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/summary-data-groups`,
        {
          cache: 'no-store'
        }
      );
      const json = await res.json();
      setGroups(json);
    };

    fetchGroups();
  }, []);

  const fetchTableData = async (groupId, selectedDate) => {
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/summary-data?table_id=${groupId}&date=${selectedDate}&_=${Date.now()}`,
        {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        }
      );

      const json = await res.json();
      setData(json);

    } catch (err) {
      console.error('Fetch error:', err);
      setData([]);
    }
  };

  const formatValue = (val, colName) => {
    if (colName === 'security_long_name') return val;

    if (colName.toLowerCase().includes('date')) {
      const d = new Date(val);
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    }

    if (typeof val === 'number') return (val * 100).toFixed(1) + '%';

    return val;
  };

  const columnKeys = [
    'security_long_name',
    'price_date',
    'DAY_RETURN',
    'MTD_RETURN',
    'QTD_RETURN',
    'YTD_RETURN',
    '3YR_RETURN',
    '5YR_RETURN',
    '10YR_RETURN',
    'CTD_RETURN',
  ];

  return (
    <div className="sd-container">
      <div className="sd-sidebar">

        {/* DATE PICKER AT TOP OF SIDEBAR */}
        <div className="sd-date-section">
          <h3>Select Date</h3>
          <input
            type="date"
            value={date}
            className="sd-date-picker"
            onChange={(e) => {
              const newDate = e.target.value;
              setDate(newDate);

              if (selectedGroup) {
                setData([]);
                fetchTableData(
                  selectedGroup.summary_data_group_ID,
                  newDate
                );
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
                selectedGroup?.summary_data_group_ID === group.summary_data_group_ID
                  ? 'sd-selected-group'
                  : ''
              }`}
              onClick={() => {
                setSelectedGroup(group);
                setData([]);
                fetchTableData(group.summary_data_group_ID, date);
              }}
            >
              {group.summary_data_group_name}
            </li>
          ))}
        </ul>
      </div>

      <div className="sd-main">
        {selectedGroup && (
          <>
            <h1 className="sd-title">
              {selectedGroup.summary_data_group_name} Data
            </h1>

            {data.length > 0 ? (
              <table className="sd-table">
                <thead>
                  <tr className="sd-table-header">
                    {columnKeys.map((key) => (
                      <th key={key}>
                        {key === 'security_long_name'
                          ? selectedGroup.summary_data_group_name.toUpperCase()
                          : key === 'price_date'
                          ? 'Date'
                          : key.replace('_RETURN', '').toUpperCase()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, idx) => (
                    <tr key={idx}>
                      {columnKeys.map((key) => {
                        const val = formatValue(row[key], key);
                        const isNegative =
                          typeof row[key] === 'number' && row[key] < 0;
                        const isPositive =
                          typeof row[key] === 'number' && row[key] >= 0;

                        return (
                          <td
                            key={key}
                            className={
                              key !== 'security_long_name' &&
                              key !== 'price_date'
                                ? isNegative
                                  ? 'negative'
                                  : isPositive
                                  ? 'positive'
                                  : ''
                                : ''
                            }
                          >
                            {val}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="sd-error">Loading...</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default SummaryData;
