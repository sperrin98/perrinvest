// CorrelationMatrix.js

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Select from "react-select";
import "./CorrelationMatrix.css";

function CorrelationMatrix() {
  const [matrices, setMatrices] = useState([]);
  const [selectedMatrix, setSelectedMatrix] = useState(null);
  const [selectedDate, setSelectedDate] = useState("2026-03-23");
  const [matrixColumns, setMatrixColumns] = useState([]);
  const [matrixRows, setMatrixRows] = useState([]);
  const [loadingMatrix, setLoadingMatrix] = useState(false);
  const [error, setError] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    async function fetchMatrices() {
      try {
        const response = await axios.get(`${API_URL}/correlation-matrices`);
        const data = response.data.data || [];

        setMatrices(data);

        if (data.length > 0) {
          const preciousMetalsMatrix =
            data.find((matrix) => Number(matrix.id) === 2) ||
            data.find(
              (matrix) =>
                String(matrix.name || "").trim().toLowerCase() ===
                "precious metals"
            ) ||
            data[0];

          setSelectedMatrix({
            value: preciousMetalsMatrix.id,
            label: preciousMetalsMatrix.name,
            description: preciousMetalsMatrix.description,
          });
        }

        setError(null);
      } catch (err) {
        console.error("Error fetching correlation matrices:", err);
        setError("Failed to load correlation matrices.");
      }
    }

    fetchMatrices();
  }, [API_URL]);

  useEffect(() => {
    if (!selectedMatrix || !selectedDate) return;

    async function fetchMatrixSquare() {
      try {
        setLoadingMatrix(true);

        const response = await axios.get(`${API_URL}/correlation-matrices/square`, {
          params: {
            matrix_id: selectedMatrix.value,
            as_of_date: selectedDate,
          },
        });

        const payload = response.data.data || {};
        setMatrixColumns(payload.columns || []);
        setMatrixRows(payload.rows || []);
        setError(null);
      } catch (err) {
        console.error("Error fetching correlation matrix square:", err);
        setMatrixColumns([]);
        setMatrixRows([]);
        setError("Failed to load correlation matrix.");
      } finally {
        setLoadingMatrix(false);
      }
    }

    fetchMatrixSquare();
  }, [selectedMatrix, selectedDate, API_URL]);

  const matrixOptions = useMemo(() => {
    return matrices.map((matrix) => ({
      value: matrix.id,
      label: matrix.name,
      description: matrix.description,
    }));
  }, [matrices]);

  const displayColumns = useMemo(() => {
    return matrixColumns.filter((col) => col !== "row_name");
  }, [matrixColumns]);

  const mobileGridStyle = useMemo(() => {
    const assetColumnWidth = 82;
    const dataColumnWidth = 58;
    const totalWidth = assetColumnWidth + displayColumns.length * dataColumnWidth;

    return {
      gridTemplateColumns: `${assetColumnWidth}px repeat(${displayColumns.length}, ${dataColumnWidth}px)`,
      width: `${totalWidth}px`,
      minWidth: `${totalWidth}px`,
    };
  }, [displayColumns.length]);

  const matrixStats = useMemo(() => {
    if (!matrixRows.length || !displayColumns.length) return null;

    const values = [];

    matrixRows.forEach((row) => {
      displayColumns.forEach((col) => {
        const value = Number(row[col]);
        if (Number.isFinite(value)) values.push(value);
      });
    });

    if (!values.length) return null;

    return {
      assets: matrixRows.length,
      cells: values.length,
      max: Math.max(...values),
      min: Math.min(...values),
    };
  }, [matrixRows, displayColumns]);

  const formatCorr = (value) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      return "-";
    }

    return Number(value).toFixed(2);
  };

  const corrToneClass = (value) => {
    const numberValue = Number(value);

    if (!Number.isFinite(numberValue)) return "cmxNeutral";
    if (numberValue >= 0.75) return "cmxPositiveStrong";
    if (numberValue >= 0.25) return "cmxPositive";
    if (numberValue <= -0.75) return "cmxNegativeStrong";
    if (numberValue <= -0.25) return "cmxNegative";

    return "cmxNeutral";
  };

  const handleMobileMatrixChange = (matrixId) => {
    const picked = matrixOptions.find(
      (matrix) => String(matrix.value) === String(matrixId)
    );

    if (picked) setSelectedMatrix(picked);
  };

  return (
    <div className="cmxContainer">
      <aside className="cmxSidebar">
        <div className="cmxSidebarScroll cmxDesktopSidebarScroll">
          <div className="cmxSidebarTop">
            <h2 className="cmxSidebarTitleMain">Correlation Matrix</h2>
            <div className="cmxSidebarSubtitle">
              Select a matrix and as-of date.
            </div>
          </div>

          <div className="cmxFilterBlock">
            <label className="cmxFilterLabel" htmlFor="cmx-date-input">
              Select Date
            </label>

            <input
              id="cmx-date-input"
              type="date"
              className="cmxDateInput"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          <div className="cmxFilterBlock">
            <label className="cmxFilterLabel" htmlFor="cmx-matrix-select">
              Select Matrix
            </label>

            <Select
              inputId="cmx-matrix-select"
              instanceId="cmx-matrix-select-instance"
              value={selectedMatrix}
              onChange={setSelectedMatrix}
              options={matrixOptions}
              className="cmxSelect"
              classNamePrefix="cmx-select"
              isSearchable={false}
            />
          </div>

          <h2 className="cmxSidebarTitle">Available Matrices</h2>

          <ul className="cmxMatrixList">
            {matrixOptions.length > 0 ? (
              matrixOptions.map((matrix) => (
                <li
                  key={matrix.value}
                  className={`cmxMatrixItem ${
                    selectedMatrix?.value === matrix.value
                      ? "cmxMatrixItemSelected"
                      : ""
                  }`}
                  onClick={() => setSelectedMatrix(matrix)}
                >
                  {matrix.label}
                </li>
              ))
            ) : (
              <li className="cmxEmpty">No matrices available.</li>
            )}
          </ul>

          <div className="cmxSidebarDetails">
            <div className="cmxDetailsTitle">Matrix Details</div>

            <div className="cmxDetailItem">
              <span className="cmxDetailLabel">Matrix</span>
              <span className="cmxDetailValue">
                {selectedMatrix ? selectedMatrix.label : "-"}
              </span>
            </div>

            <div className="cmxDetailItem">
              <span className="cmxDetailLabel">As Of Date</span>
              <span className="cmxDetailValue">{selectedDate || "-"}</span>
            </div>

            <div className="cmxDetailItem">
              <span className="cmxDetailLabel">Description</span>
              <span className="cmxDetailValue">
                {selectedMatrix?.description || "-"}
              </span>
            </div>
          </div>
        </div>

        <div className="cmxMobileControls">
          <div className="cmxMobileCard">
            <div className="cmxMobileSection">
              <div className="cmxMobileLabel">Matrix</div>

              <select
                className="cmxMobileSelect"
                value={selectedMatrix?.value || ""}
                onChange={(e) => handleMobileMatrixChange(e.target.value)}
              >
                {matrixOptions.map((matrix) => (
                  <option key={matrix.value} value={matrix.value}>
                    {matrix.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="cmxMobileSection">
              <div className="cmxMobileLabel">As Of Date</div>

              <input
                type="date"
                className="cmxMobileInput"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            {selectedMatrix?.description ? (
              <div className="cmxMobileDescription">
                {selectedMatrix.description}
              </div>
            ) : null}
          </div>
        </div>
      </aside>

      <main className="cmxMain">
        <h1 className="cmxTitle">
          Correlation Matrix: {selectedMatrix ? selectedMatrix.label : "Loading..."}
        </h1>

        {error && <div className="cmxError">{error}</div>}

        {matrixStats && (
          <div className="cmxStatsRow">
            <div className="cmxStatCard">
              <span className="cmxStatLabel">Assets</span>
              <span className="cmxStatValue">{matrixStats.assets}</span>
            </div>

            <div className="cmxStatCard">
              <span className="cmxStatLabel">Cells</span>
              <span className="cmxStatValue">{matrixStats.cells}</span>
            </div>

            <div className="cmxStatCard">
              <span className="cmxStatLabel">Max Corr</span>
              <span className="cmxStatValue">{matrixStats.max.toFixed(2)}</span>
            </div>

            <div className="cmxStatCard">
              <span className="cmxStatLabel">Min Corr</span>
              <span className="cmxStatValue">{matrixStats.min.toFixed(2)}</span>
            </div>
          </div>
        )}

        <section className="cmxTableCard">
          <div className="cmxTableCardHeader">
            <div>
              <div className="cmxTableHeading">Correlation Matrix</div>
              <div className="cmxTableSubheading">
                Values shown to 2 decimal places
              </div>
            </div>

            <div className="cmxTableMeta">
              {loadingMatrix
                ? "Loading..."
                : `${matrixRows.length} ${
                    matrixRows.length === 1 ? "row" : "rows"
                  }`}
            </div>
          </div>

          <div className="cmxTableScrollHint">
            Scroll sideways to view the full matrix
          </div>

          <div className="cmxTableWrapper">
            {loadingMatrix ? (
              <div className="cmxEmptyVisual">Loading correlation matrix...</div>
            ) : matrixRows.length > 0 && displayColumns.length > 0 ? (
              <>
                <table className="cmxTable cmxDesktopMatrixTable">
                  <thead>
                    <tr>
                      <th className="cmxStickyCol cmxAssetHeader" title="Asset">
                        Asset
                      </th>

                      {displayColumns.map((col) => (
                        <th key={col} className="cmxMatrixCell" title={col}>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {matrixRows.map((row, rowIndex) => (
                      <tr key={`${row.row_name}-${rowIndex}`} className="cmxRow">
                        <td
                          className="cmxRowHeader cmxStickyCol"
                          title={row.row_name}
                        >
                          {row.row_name}
                        </td>

                        {displayColumns.map((col) => (
                          <td
                            key={`${row.row_name}-${col}`}
                            className={`cmxMatrixCell ${corrToneClass(row[col])}`}
                            title={`${row.row_name} / ${col}: ${formatCorr(row[col])}`}
                          >
                            {formatCorr(row[col])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div
                  className="cmxMobileMatrixGrid"
                  style={mobileGridStyle}
                  role="table"
                  aria-label="Correlation matrix"
                >
                  <div
                    className="cmxGridCell cmxGridHeader cmxGridSticky cmxGridAsset"
                    role="columnheader"
                    title="Asset"
                  >
                    Asset
                  </div>

                  {displayColumns.map((col) => (
                    <div
                      key={`header-${col}`}
                      className="cmxGridCell cmxGridHeader"
                      role="columnheader"
                      title={col}
                    >
                      {col}
                    </div>
                  ))}

                  {matrixRows.map((row, rowIndex) => (
                    <React.Fragment key={`${row.row_name}-${rowIndex}`}>
                      <div
                        className="cmxGridCell cmxGridRowHeader cmxGridSticky cmxGridAsset"
                        role="rowheader"
                        title={row.row_name}
                      >
                        {row.row_name}
                      </div>

                      {displayColumns.map((col) => (
                        <div
                          key={`${row.row_name}-${col}`}
                          className={`cmxGridCell cmxGridValue ${corrToneClass(row[col])}`}
                          role="cell"
                          title={`${row.row_name} / ${col}: ${formatCorr(row[col])}`}
                        >
                          {formatCorr(row[col])}
                        </div>
                      ))}
                    </React.Fragment>
                  ))}
                </div>
              </>
            ) : (
              <div className="cmxEmptyVisual">
                {error || "No correlation matrix data available"}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default CorrelationMatrix;