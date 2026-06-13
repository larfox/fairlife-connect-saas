import { format } from "date-fns";

export interface DemographicRow {
  band: string;
  male: number;
  female: number;
  other: number;
  total: number;
}

export interface DemographicSummary {
  totalPatients: number;
  totalMale: number;
  totalFemale: number;
  totalOther: number;
  averageAge: number | null;
}

interface PrintableDemographicReportProps {
  title: string;
  subtitle?: string;
  scopeName?: string;
  rows: DemographicRow[];
  summary: DemographicSummary;
}

export const PrintableDemographicReport = ({
  title,
  subtitle,
  scopeName,
  rows,
  summary,
}: PrintableDemographicReportProps) => {
  const pct = (n: number) =>
    summary.totalPatients > 0
      ? `${((n / summary.totalPatients) * 100).toFixed(1)}%`
      : "0.0%";

  return (
    <div className="print-report">
      <style>
        {`
          .print-report {
            font-family: Arial, sans-serif;
            max-width: 100%;
            margin: 0;
            padding: 20px;
            background: white;
            color: black;
          }
          .print-header {
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          .print-title { font-size: 18px; font-weight: bold; margin: 0 0 5px 0; }
          .print-subtitle { font-size: 14px; margin: 0 0 10px 0; color: #666; }
          .print-meta { font-size: 12px; color: #666; }
          .print-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .print-table th, .print-table td {
            border: 1px solid #ccc;
            padding: 8px;
            text-align: center;
            font-size: 12px;
          }
          .print-table th { background-color: #f5f5f5; font-weight: bold; }
          .print-table td:first-child, .print-table th:first-child { text-align: left; }
          .print-table tr:nth-child(even) { background-color: #f9f9f9; }
          .totals-row td { font-weight: bold; background-color: #f0f0f0 !important; }
          .summary-box {
            padding: 12px;
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
          }
          @media screen {
            .print-report {
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
              margin: 20px auto;
              max-width: 8.5in;
            }
          }
        `}
      </style>

      <div className="print-header">
        <h1 className="print-title">{title}</h1>
        {subtitle && <p className="print-subtitle">{subtitle}</p>}
        <div className="print-meta">
          {scopeName && <p>{scopeName}</p>}
          <p>Generated: {format(new Date(), "MMMM dd, yyyy 'at' h:mm a")}</p>
        </div>
      </div>

      <table className="print-table">
        <thead>
          <tr>
            <th>Age Band</th>
            <th>Male</th>
            <th>Female</th>
            <th>Other/Unspecified</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.band}>
              <td>{row.band}</td>
              <td>{row.male}</td>
              <td>{row.female}</td>
              <td>{row.other}</td>
              <td>{row.total}</td>
            </tr>
          ))}
          <tr className="totals-row">
            <td>Total</td>
            <td>{summary.totalMale}</td>
            <td>{summary.totalFemale}</td>
            <td>{summary.totalOther}</td>
            <td>{summary.totalPatients}</td>
          </tr>
        </tbody>
      </table>

      <div className="summary-box">
        <p style={{ margin: "4px 0", fontWeight: "bold" }}>
          Total Patients: {summary.totalPatients}
        </p>
        <p style={{ margin: "4px 0" }}>
          Male: {summary.totalMale} ({pct(summary.totalMale)}) • Female:{" "}
          {summary.totalFemale} ({pct(summary.totalFemale)}) • Other/Unspecified:{" "}
          {summary.totalOther} ({pct(summary.totalOther)})
        </p>
        <p style={{ margin: "4px 0" }}>
          Average Age:{" "}
          {summary.averageAge !== null ? `${summary.averageAge.toFixed(1)} years` : "N/A"}
        </p>
      </div>
    </div>
  );
};
