import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, BookOpen } from "lucide-react";

interface HelpManualProps {
  onBack: () => void;
}

const HelpManual: React.FC<HelpManualProps> = ({ onBack }) => {
  const helpContent = `# HealthFair Pro User Manual

## Table of Contents
1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Foundation Management](#foundation-management)
4. [Event Management](#event-management)
5. [Queue Management](#queue-management)
6. [Patient Management](#patient-management)
7. [Reports and Analytics](#reports-and-analytics)
8. [Medical Services](#medical-services)
9. [User Permissions](#user-permissions)
10. [Import/Export Features](#importexport-features)
11. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Account Setup
- The system uses role-based access control
- Contact your administrator for account setup and permission assignment
- Ensure you have the necessary permissions for the features you need to access

### Initial Setup Requirements
Before conducting a health fair, ensure the following are configured:
1. **Foundation Setup** (Admin required):
   - Locations
   - Services
   - Staff (Doctors, Nurses, General Staff)
2. **Event Creation**: Create and configure the health fair event
3. **User Permissions**: Assign appropriate roles to staff members

---

## Dashboard Overview

The dashboard provides:
- **Real-time Statistics**: Current patient counts, service status
- **Quick Navigation**: Access to all major system components
- **Event Management**: View and manage active health fair events
- **System Status**: Overview of current operations

### Key Features:
- **Total Patients**: Shows registered patients for active events
- **In Progress**: Patients currently receiving services
- **Completed**: Patients who have finished all services
- **Waiting Services**: Number of pending service requests

---

## Foundation Management

### Locations Manager
**Purpose**: Define physical locations where services are provided

**Features**:
- Add/Edit/Delete locations
- Set capacity limits
- Assign services to specific locations
- Track location utilization

**Best Practices**:
- Use clear, descriptive location names
- Set realistic capacity limits
- Consider patient flow when organizing locations

### Services Manager
**Purpose**: Define available medical services

**Supported Services**:
- Basic Screening (BMI, Blood Pressure, etc.)
- Dental Examination
- ECG
- Optician Services
- Pap Smear
- Back to School Checkup
- Prescriptions
- Prognosis and Complaints

**Configuration Options**:
- Service duration estimates
- Required equipment/resources
- Prerequisite services
- Age/gender restrictions

### Staff Manager
**Purpose**: Manage staff assignments and permissions

**Staff Categories**:
1. **Doctors**: Full medical service access
2. **Nurses**: Medical services, patient care
3. **General Staff**: Registration, basic services

**Permission Levels**:
- **Admin**: Full system access, foundation management
- **Medical Staff**: Patient records, service management
- **Registration Staff**: Patient registration, basic queue management

### Doctors Manager
**Features**:
- Doctor profiles and specializations
- Service assignments
- Schedule management
- Performance tracking

### Nurses Manager
**Features**:
- Nurse profiles and certifications
- Service assignments
- Patient care responsibilities
- Workload distribution

---

## Event Management

### Creating Events
1. Navigate to **Events** section
2. Click **Create New Event**
3. Fill in event details:
   - Event name and description
   - Location selection
   - Date and time
   - Services to be offered
4. Assign staff to the event
5. Set event status (Open/Closed)

### Managing Event Status
- **Open Events**: Active events accepting new patients
- **Closed Events**: Events that are completed or temporarily suspended

### Event Configuration
- **Service Selection**: Choose which services will be available
- **Staff Assignment**: Assign doctors, nurses, and support staff
- **Location Setup**: Configure service locations within the venue
- **Capacity Planning**: Set patient limits and time slots

---

## Queue Management

### Registration Tab
**Purpose**: Register new patients and manage patient information

**Features**:
- **Patient Registration Form**:
  - Personal information (Name, Age, Gender, ID)
  - Contact details
  - Medical history basics
  - Emergency contact information

- **Service Selection**:
  - Choose required services for the patient
  - Set service priorities
  - Special requirements or notes

- **Quick Registration**:
  - Streamlined process for repeat patients
  - Auto-complete based on previous visits
  - Bulk registration capabilities

### Patient Search Tab
**Purpose**: Find and manage existing patient records

**Search Capabilities**:
- Search by name, ID, phone number
- Filter by service status
- Advanced search with multiple criteria
- Recent patient list

**Patient Management**:
- View complete patient profiles
- Edit patient information
- Transfer patients between services
- Print patient summaries

### Service Queue Tab
**Purpose**: Manage patient flow through various services

**Queue Features**:
- **Real-time Status Tracking**: See patient progress through services
- **Priority Management**: Handle urgent cases and VIP patients
- **Service Assignment**: Assign patients to specific service providers
- **Wait Time Monitoring**: Track and optimize patient wait times

**Service Status Options**:
- **Waiting**: Patient is queued for service
- **In Progress**: Patient is currently receiving service
- **Completed**: Service has been finished
- **No Show**: Patient did not appear for service
- **Cancelled**: Service was cancelled

### Special Features
- **Bulk Operations**: Move multiple patients at once
- **Service Dependencies**: Automatic sequencing of related services
- **Real-time Updates**: Live status updates across all stations
- **Mobile-Friendly**: Access queue management from tablets/phones

---

## Patient Management

### Patient Records
**Comprehensive Patient Profiles**:
- Personal and demographic information
- Complete medical history
- Service records across all visits
- Emergency contact information
- Insurance and payment information

### Medical Records Tabs

#### Basic Screening Tab
- Height, Weight, BMI calculation
- Blood Pressure measurement
- Temperature and pulse
- General physical observations
- Health risk assessments

#### Dental Tab
- Oral health examination
- Dental condition documentation
- Treatment recommendations
- Referral requirements
- Preventive care advice

#### ECG Tab
- Electrocardiogram results
- Heart rhythm analysis
- Abnormality documentation
- Cardiologist referrals
- Follow-up recommendations

#### Optician Tab
- Vision testing results
- Eye health examination
- Prescription requirements
- Lens recommendations
- Referral to specialists

#### Pap Smear Tab
- Cervical screening results
- Specimen collection details
- Laboratory requisitions
- Follow-up scheduling
- Patient education materials

#### Back to School Tab
- School health requirements
- Immunization records
- Physical fitness assessment
- Form completion for schools
- Parent/guardian communication

#### Prescriptions Tab
- Medication prescriptions
- Dosage and instructions
- Drug interactions
- Pharmacy information
- Prescription history

#### Prognosis and Complaints Tab
- Patient-reported symptoms
- Clinical assessments
- Diagnosis and prognosis
- Treatment plans
- Follow-up care instructions

### Patient History
- **Visit Timeline**: Chronological record of all visits
- **Service History**: Complete log of all services received
- **Medical Notes**: Cumulative medical observations
- **Referrals**: Track referrals to specialists
- **Outcomes**: Follow-up results and patient progress

---

## Reports and Analytics

### Registration Report
**Purpose**: Analyze patient registration patterns and demographics

**Available Data**:
- Total registrations by date/time
- Demographic breakdown (age, gender)
- Service request patterns
- Peak registration times
- No-show analysis

**Export Options**:
- PDF reports
- Excel spreadsheets
- CSV data files
- Custom date ranges

### Service Statistics
**Purpose**: Monitor service delivery and efficiency

**Metrics Included**:
- Service completion rates
- Average service times
- Staff productivity
- Patient satisfaction scores
- Resource utilization

**Performance Indicators**:
- Wait time analysis
- Service throughput
- Staff workload distribution
- Equipment usage rates

### Import/Export Features
- **Patient Data Export**: Bulk export of patient records
- **Service Records**: Export service completion data
- **Statistical Reports**: Export analytics and metrics
- **Data Import**: Import patient lists from external systems
- **Backup/Restore**: System data backup capabilities

---

## Medical Services

### Supported Service Types
The system supports comprehensive medical services typically offered at health fairs:

1. **Basic Screening Services**
   - Vital signs monitoring
   - BMI calculation and assessment
   - General health screening
   - Risk factor identification

2. **Specialized Medical Services**
   - Dental examinations
   - Vision/hearing tests
   - Cardiovascular assessments (ECG)
   - Women's health screening (Pap smear)

3. **Preventive Care Services**
   - Immunizations
   - Health education
   - Wellness counseling
   - Referral coordination

### Service Workflow
1. **Patient Check-in**: Registration and service selection
2. **Queue Assignment**: Automated queue management
3. **Service Delivery**: Medical service provision
4. **Documentation**: Record keeping and notes
5. **Follow-up**: Referrals and recommendations
6. **Check-out**: Final review and discharge

### Data Recording
Each service maintains comprehensive records:
- **Clinical Data**: Medical findings and measurements
- **Provider Notes**: Professional observations and recommendations
- **Patient Feedback**: Patient-reported information
- **Quality Metrics**: Service delivery assessment
- **Follow-up Requirements**: Next steps and referrals

---

## User Permissions

### Permission Levels

#### Admin Level
- **Full System Access**: All features and configurations
- **Foundation Management**: Setup locations, services, staff
- **User Management**: Assign roles and permissions
- **System Configuration**: Advanced settings and preferences
- **Data Management**: Backup, export, system maintenance

#### Medical Staff Level
- **Patient Records**: Full access to medical information
- **Service Management**: Conduct and document medical services
- **Queue Management**: Manage patient flow in assigned services
- **Reporting**: Generate service-specific reports
- **Patient Communication**: Direct patient interaction capabilities

#### Registration Staff Level
- **Patient Registration**: Add and edit patient information
- **Basic Queue Management**: Assign patients to services
- **Limited Reporting**: Basic registration statistics
- **Patient Search**: Find and verify patient information

### Service-Specific Permissions
Permissions can be customized for specific medical services:
- **Dental Services**: Access to dental examination tools
- **ECG Services**: Cardiovascular assessment capabilities
- **Prescription Services**: Medication prescribing authority
- **Screening Services**: General health assessment tools

### Permission Assignment
- **Role-Based Access**: Assign permissions by job function
- **Service-Based Access**: Limit access to specific services
- **Location-Based Access**: Restrict access to certain locations
- **Time-Based Access**: Temporary permission assignments

---

## Troubleshooting

### Common Issues and Solutions

#### Login Problems
- **Issue**: Cannot access the system
- **Solution**: 
  - Verify credentials with administrator
  - Check internet connection
  - Clear browser cache and cookies
  - Try different browser

#### Patient Registration Issues
- **Issue**: Cannot register new patients
- **Solutions**:
  - Verify event is open and active
  - Check registration permissions
  - Ensure all required fields are completed
  - Verify patient is not already registered

#### Queue Management Problems
- **Issue**: Patients not appearing in service queues
- **Solutions**:
  - Refresh the page
  - Check patient service assignments
  - Verify service is active for the event
  - Contact system administrator

#### Data Not Saving
- **Issue**: Information is not being saved
- **Solutions**:
  - Check internet connection
  - Verify you have appropriate permissions
  - Ensure all required fields are completed
  - Try logging out and back in

#### Printing Issues
- **Issue**: Reports or patient information won't print
- **Solutions**:
  - Check printer connection and status
  - Verify browser print settings
  - Try printing from different browser
  - Export to PDF if direct printing fails

### Getting Help
- **Technical Support**: Contact your system administrator
- **Training Resources**: Refer to this manual and training materials
- **User Community**: Connect with other users for tips and best practices
- **System Updates**: Stay informed about new features and improvements

---

## Best Practices

### Event Planning
- **Advance Setup**: Configure foundation elements well before events
- **Staff Training**: Ensure all staff are familiar with their assigned roles
- **Equipment Testing**: Verify all systems and equipment before events
- **Contingency Planning**: Prepare for technical issues and high patient volumes

### Patient Flow Management
- **Efficient Registration**: Streamline the check-in process
- **Queue Monitoring**: Regularly check and manage service queues
- **Staff Communication**: Maintain clear communication between service areas
- **Patient Communication**: Keep patients informed of wait times and procedures

### Data Management
- **Regular Backups**: Ensure patient data is regularly backed up
- **Data Accuracy**: Verify and double-check all entered information
- **Privacy Protection**: Follow all patient privacy and confidentiality protocols
- **Record Keeping**: Maintain comprehensive documentation for all services

### Quality Assurance
- **Regular Reviews**: Periodically review processes and procedures
- **Feedback Collection**: Gather feedback from staff and patients
- **Continuous Improvement**: Implement improvements based on experience
- **Compliance Monitoring**: Ensure all activities meet regulatory requirements

---

## Document Information
- **Document Version**: 1.0
- **Last Updated**: $(date)
- **System Version**: HealthFair Pro v1.0
- **Contact**: System Administrator

This manual serves as a comprehensive guide to using the HealthFair Pro system effectively. For additional support or clarification on any topics covered in this manual, please contact your system administrator.`;

  // Convert markdown-style content to JSX for better rendering
  const renderContent = (content: string) => {
    return content.split('\n').map((line, index) => {
      // Handle headers
      if (line.startsWith('# ')) {
        return <h1 key={index} className="text-3xl font-bold text-foreground mb-6 mt-8">{line.substring(2)}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={index} className="text-2xl font-semibold text-foreground mb-4 mt-6">{line.substring(3)}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={index} className="text-xl font-medium text-foreground mb-3 mt-4">{line.substring(4)}</h3>;
      }
      if (line.startsWith('#### ')) {
        return <h4 key={index} className="text-lg font-medium text-foreground mb-2 mt-3">{line.substring(5)}</h4>;
      }
      
      // Handle bold text
      if (line.includes('**')) {
        const parts = line.split('**');
        return (
          <p key={index} className="mb-2 text-muted-foreground leading-relaxed">
            {parts.map((part, i) => 
              i % 2 === 1 ? <strong key={i} className="font-semibold text-foreground">{part}</strong> : part
            )}
          </p>
        );
      }
      
      // Handle list items
      if (line.startsWith('- ')) {
        return <li key={index} className="mb-1 text-muted-foreground ml-4">{line.substring(2)}</li>;
      }
      if (line.match(/^\d+\. /)) {
        return <li key={index} className="mb-1 text-muted-foreground ml-4">{line.replace(/^\d+\. /, '')}</li>;
      }
      
      // Handle horizontal rules
      if (line === '---') {
        return <hr key={index} className="my-6 border-border" />;
      }
      
      // Handle empty lines
      if (line.trim() === '') {
        return <div key={index} className="mb-2" />;
      }
      
      // Regular paragraphs
      return <p key={index} className="mb-2 text-muted-foreground leading-relaxed">{line}</p>;
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="lg" 
              onClick={onBack}
              className="gap-2"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold text-foreground">Help Manual</h1>
                <p className="text-muted-foreground mt-1">
                  Complete guide to using HealthFair Pro
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <Card className="max-w-none">
          <CardContent className="p-8">
            <div className="prose prose-slate max-w-none">
              {renderContent(helpContent)}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HelpManual;