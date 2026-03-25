import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Select from "react-select";
import "./CorrelationMatrix.css";

function CorrelationMatrix() {
  const [matrices, setMatrices] = useState([]);
  const [selectedMatrix, setSelectedMatrix] = useState(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
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
          setSelectedMatrix({
            value: data[0].id,
            label: data[0].name,
            description: data[0].description,
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

  const displayColumns = matrixColumns.filter((col) => col !== "row_name");

  const formatCorr = (value) => {
    if (value === null || value === undefined || Number.isNaN(value)) return "-";
    return Number(value).toFixed(2);
  };

  const corrToneClass = (value) => {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return "cmxNeutral";
    }
    if (value >= 0.75) return "cmxPositiveStrong";
    if (value >= 0.25) return "cmxPositive";
    if (value <= -0.75) return "cmxNegativeStrong";
    if (value <= -0.25) return "cmxNegative";
    return "cmxNeutral";
  };

  return (
    <div className="cmxContainer">
      <aside className="cmxSidebar">
        <div className="cmxFilterBlock">
          <label className="cmxFilterLabel">Select Date</label>
          <input
            type="date"
            className="cmxDateInput"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        <div className="cmxFilterBlock">
          <label className="cmxFilterLabel">Select Matrix</label>
          <Select
            value={selectedMatrix}
            onChange={setSelectedMatrix}
            options={matrixOptions}
            className="cmxSelect"
            classNamePrefix="cmx-select"
            isSearchable={false}
          />
        </div>

        <div className="cmxSidebarTitle">Correlation Matrices</div>

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

          <div className="cmxDetailItem cmxDetailDescription">
            <span className="cmxDetailLabel">Description</span>
            <span className="cmxDetailValue">
              {selectedMatrix?.description || "-"}
            </span>
          </div>
        </div>
      </aside>

      <main className="cmxMain">
        <div className="cmxTitle">
          Correlation Matrix: {selectedMatrix ? selectedMatrix.label : "Loading..."}
        </div>

        {error && <div className="cmxError">{error}</div>}

        <section className="cmxTableCard">
          <div className="cmxTableCardHeader">
            <div className="cmxTableHeading">Correlation Matrix</div>
            <div className="cmxTableMeta">
              {loadingMatrix
                ? "Loading..."
                : `${matrixRows.length} ${matrixRows.length === 1 ? "row" : "rows"}`}
            </div>
          </div>

          <div className="cmxTableWrapper">
            {loadingMatrix ? (
              <div className="cmxEmptyVisual">Loading correlation matrix...</div>
            ) : matrixRows.length > 0 && displayColumns.length > 0 ? (
              <table className="cmxTable">
                <thead>
                  <tr>
                    <th className="cmxStickyCol cmxAssetHeader">Asset</th>
                    {displayColumns.map((col) => (
                      <th key={col} className="cmxMatrixCell">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrixRows.map((row, rowIndex) => (
                    <tr key={`${row.row_name}-${rowIndex}`} className="cmxRow">
                      <td className="cmxRowHeader cmxStickyCol">{row.row_name}</td>
                      {displayColumns.map((col) => (
                        <td
                          key={`${row.row_name}-${col}`}
                          className={`cmxMatrixCell ${corrToneClass(row[col])}`}
                        >
                          {formatCorr(row[col])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
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