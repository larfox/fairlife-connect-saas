import { format } from "date-fns";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  patient_number: string | null;
  phone: string | null;
  email: string | null;
  parish?: { name: string } | null;
  town?: { name: string } | null;
  services?: string[]; // For registration reports
}

interface PrintableReportProps {
  title: string;
  subtitle?: string;
  data: {
    section_name: string;
    patient_count: number;
    patients: Patient[];
  }[];
  eventName?: string;
  locationName?: string;
  eventDate?: string;
}

export const PrintableReport = ({ 
  title, 
  subtitle, 
  data, 
  eventName, 
  locationName, 
  eventDate 
}: PrintableReportProps) => {
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
          
          @media print {
            .print-report {
              padding: 15px;
              font-size: 12px;
              line-height: 1.4;
            }
            
            .print-header {
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
              margin-bottom: 20px;
            }
            
            .print-title {
              font-size: 18px;
              font-weight: bold;
              margin: 0 0 5px 0;
            }
            
            .print-subtitle {
              font-size: 14px;
              margin: 0 0 10px 0;
              color: #666;
            }
            
            .print-meta {
              font-size: 12px;
              color: #666;
            }
            
            .print-section {
              margin-bottom: 25px;
              page-break-inside: avoid;
            }
            
            .print-section-title {
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 10px;
              padding: 5px;
              background-color: #f0f0f0;
              border-left: 4px solid #000;
            }
            
            .print-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
            }
            
            .print-table th,
            .print-table td {
              border: 1px solid #ccc;
              padding: 6px;
              text-align: left;
              font-size: 11px;
            }
            
            .print-table th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            
            .print-table tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            
            .page-break {
              page-break-before: always;
            }
            
            .print-footer {
              position: fixed;
              bottom: 10px;
              right: 10px;
              font-size: 10px;
              color: #666;
            }
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
          {eventName && <p>Event: {eventName}</p>}
          {locationName && <p>Location: {locationName}</p>}
          {eventDate && <p>Date: {format(new Date(eventDate), "MMMM dd, yyyy")}</p>}
          <p>Generated: {format(new Date(), "MMMM dd, yyyy 'at' h:mm a")}</p>
        </div>
      </div>

      {data.map((section, sectionIndex) => {
        // Check if this is a registration report by looking for services in the first patient
        const isRegistrationReport = section.patients.length > 0 && section.patients[0].services !== undefined;
        
        return (
          <div key={sectionIndex} className={`print-section ${sectionIndex > 0 ? 'page-break' : ''}`}>
            <h2 className="print-section-title">
              {section.section_name} ({section.patient_count} patients)
            </h2>
            
            <table className="print-table">
              <thead>
                <tr>
                  <th style={{ width: '8%' }}>#</th>
                  <th style={{ width: '25%' }}>Name</th>
                  <th style={{ width: '15%' }}>Patient #</th>
                  <th style={{ width: '17%' }}>Phone</th>
                  <th style={{ width: isRegistrationReport ? '15%' : '20%' }}>Parish</th>
                  {!isRegistrationReport && <th style={{ width: '15%' }}>Town</th>}
                  {isRegistrationReport && <th style={{ width: '20%' }}>Services</th>}
                </tr>
              </thead>
              <tbody>
                {section.patients.map((patient, patientIndex) => (
                  <tr key={patient.id || patientIndex}>
                    <td>{patientIndex + 1}</td>
                    <td>{patient.first_name} {patient.last_name}</td>
                    <td>{patient.patient_number || 'N/A'}</td>
                    <td>{patient.phone || 'N/A'}</td>
                    <td>{patient.parish?.name || 'N/A'}</td>
                    {!isRegistrationReport && <td>{patient.town?.name || 'N/A'}</td>}
                    {isRegistrationReport && (
                      <td style={{ fontSize: '10px' }}>
                        {patient.services && patient.services.length > 0 
                          ? patient.services.join(', ') 
                          : 'No services'
                        }
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            
            {section.patients.length === 0 && (
              <p style={{ textAlign: 'center', color: '#666', fontStyle: 'italic', padding: '20px' }}>
                No patients found for this section.
              </p>
            )}
          </div>
        );
      })}
      
      <div className="print-footer">
        Page {data.length > 1 ? 'Multiple Pages' : '1 of 1'}
      </div>
    </div>
  );
};