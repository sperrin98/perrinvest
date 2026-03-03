import React, { useState, useEffect } from 'react';
import './SummaryData.css';

function SummaryData() {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);

  // Table 1 (existing stored procedure)
  const [data1, setData1] = useState([]);
  const [loading1, setLoading1] = useState(false);

  // Table 2 (gold stored procedure)
  const [data2, setData2] = useState([]);
  const [loading2, setLoading2] = useState(false);

  // Default date: yesterday, unless Sunday/Monday -> previous Friday
  const getDefaultDate = () => {
    const d = new Date();
    const day = d.getDay(); // 0=Sun, 1=Mon, 2=Tue, ... 6=Sat

    // Start from yesterday
    d.setDate(d.getDate() - 1);

    // If today is Sunday, yesterday is Saturday -> use previous Friday
    if (day === 0) d.setDate(d.getDate() - 1);

    // If today is Monday, yesterday is Sunday -> use previous Friday
    if (day === 1) d.setDate(d.getDate() - 2);

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const [date, setDate] = useState(getDefaultDate());

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/summary-data-groups`,
          { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } }
        );
        const json = await res.json();
        setGroups(json);
      } catch (err) {
        console.error('Fetch groups error:', err);
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
        { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } }
      );
      const json = await res.json();
      setData1(Array.isArray(json) ? json : []);
    } catch (err) {
      console.error('Fetch table 1 error:', err);
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
        { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } }
      );
      const json = await res.json();
      setData2(Array.isArray(json) ? json : []);
    } catch (err) {
      console.error('Fetch table 2 error:', err);
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
    if (val === null || val === undefined) return '';

    if (colName === 'security_long_name') return val;

    if (colName.toLowerCase().includes('date')) {
      const d = new Date(val);
      if (Number.isNaN(d.getTime())) return String(val);
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    }

    if (typeof val === 'number') return (val * 100).toFixed(1) + '%';

    return val;
  };

  const columnKeys1 = [
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

  const columnKeys2 = [
    'security_long_name',
    'price_date',
    'DAY_RETURN',
    'MTD_RETURN',
    'QTD_RETURN',
    'YTD_RETURN',
    '3YR_RETURN',
    '5YR_RETURN',
    '10YR_RETURN',
  ];

  const renderTable = ({
    data,
    loading,
    columnKeys,
    titleOverride,
    formatter,
    headerLabelForKey,
  }) => {
    if (loading) return <p className="sd-error">Loading...</p>;
    if (!data || data.length === 0) return <p className="sd-error">No data.</p>;
    if (!columnKeys || columnKeys.length === 0) {
      return <p className="sd-error">No columns configured.</p>;
    }

    return (
      <table className="sd-table">
        <thead>
          <tr className="sd-table-header">
            {columnKeys.map((key) => (
              <th key={key}>
                {headerLabelForKey
                  ? headerLabelForKey(key)
                  : key === 'security_long_name'
                  ? titleOverride
                    ? titleOverride.toUpperCase()
                    : 'NAME'
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
                const raw = row?.[key];
                const val = formatter(raw, key);

                const isNumeric = typeof raw === 'number';
                const isNegative = isNumeric && raw < 0;
                const isPositive = isNumeric && raw >= 0;

                return (
                  <td
                    key={key}
                    className={
                      key !== 'security_long_name' && key !== 'price_date'
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
    );
  };

  return (
    <div className="sd-container">
      <div className="sd-sidebar">
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
                  ? 'sd-selected-group'
                  : ''
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
      </div>

      <div className="sd-main">
        {selectedGroup && (
          <>
            <h1 className="sd-title" style={{ textAlign: 'center' }}>
              Returns in Local Fiat Currency
            </h1>

            {renderTable({
              data: data1,
              loading: loading1,
              columnKeys: columnKeys1,
              titleOverride: selectedGroup.summary_data_group_name,
              formatter: formatValue,
            })}

            <h2
              className="sd-title"
              style={{ marginTop: '24px', textAlign: 'center' }}
            >
              Returns in Gold
            </h2>

            {renderTable({
              data: data2,
              loading: loading2,
              columnKeys: columnKeys2,
              titleOverride: selectedGroup.summary_data_group_name,
              formatter: formatValue,
            })}
          </>
        )}
      </div>
    </div>
  );
}

export default SummaryData;