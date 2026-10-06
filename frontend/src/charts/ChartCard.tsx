import { useState, type ReactNode } from "react";
import "./charts.css";

export interface TableView {
  columns: string[];
  rows: (string | number)[][];
}

interface ChartCardProps {
  title: string;
  subtitle?: string;
  legend?: { label: string; color: string }[];
  table: TableView;
  children: ReactNode;
  className?: string;
}

/** Chart container: title, legend, and the table-view twin every chart ships with. */
export function ChartCard({ title, subtitle, legend, table, children, className = "" }: ChartCardProps) {
  const [showTable, setShowTable] = useState(false);

  return (
    <figure className={`chart-card card ${className}`}>
      <figcaption className="chart-head">
        <div>
          <h3 className="chart-title">{title}</h3>
          {subtitle && <p className="chart-subtitle">{subtitle}</p>}
        </div>
        <button
          type="button"
          className="btn btn-pill chart-toggle"
          aria-pressed={showTable}
          onClick={() => setShowTable((v) => !v)}
        >
          {showTable ? "Chart" : "Table"}
        </button>
      </figcaption>

      {legend && legend.length > 1 && !showTable && (
        <ul className="chart-legend">
          {legend.map((item) => (
            <li key={item.label}>
              <span className="chart-swatch" style={{ background: item.color }} />
              {item.label}
            </li>
          ))}
        </ul>
      )}

      {showTable ? (
        <div className="chart-table-wrap">
          <table className="chart-table">
            <thead>
              <tr>
                {table.columns.map((c) => (
                  <th key={c}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        children
      )}
    </figure>
  );
}

export function Tooltip({ x, y, children, width }: { x: number; y: number; children: ReactNode; width: number }) {
  const flip = x > width - 180;
  return (
    <div
      className="chart-tooltip"
      role="status"
      style={{ left: flip ? undefined : x + 12, right: flip ? width - x + 12 : undefined, top: Math.max(0, y - 12) }}
    >
      {children}
    </div>
  );
}
