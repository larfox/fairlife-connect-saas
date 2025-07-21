# HealthFair Pro - User Manual

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
1. **Registration**: Create your account using the "Start Free Trial" button on the homepage
2. **Sign In**: Use your email and password to access the system
3. **Profile Setup**: Complete your profile with organization details

### Initial Setup Requirements
Before conducting your first health fair, ensure you have:
- ✅ Locations configured
- ✅ Services defined
- ✅ Staff members added
- ✅ Doctors and nurses registered
- ✅ At least one event created

---

## Dashboard Overview

The Dashboard is your central command center, providing:

### Key Statistics
- **Total Patients**: Number of registered patients across all open events
- **In Progress**: Services currently being provided
- **Completed**: Finished services
- **Waiting**: Patients waiting for services

### Quick Actions
- **Foundation Setup**: Configure locations, services, and staff (Admin only)
- **Patient Management**: View and manage patient records
- **Events**: Create and manage health fair events
- **Reports**: Generate analytics and export data
- **Queue System**: Access patient flow management

---

## Foundation Management

*Access: Admin users only*

### Locations Manager
**Purpose**: Define where health fairs will be held

**Features**:
- Add new locations with name, address, phone, email
- Set capacity limits
- Activate/deactivate locations
- Edit location details

**How to Use**:
1. Navigate to Dashboard → Foundation Setup → Locations
2. Click "Add New Location"
3. Fill in required details (name is mandatory)
4. Set capacity if needed
5. Save the location

### Services Manager
**Purpose**: Define medical services offered at health fairs

**Features**:
- Create service types (e.g., Blood Pressure Check, Dental Screening)
- Set duration estimates
- Add service descriptions
- Manage service availability

**Best Practices**:
- Create a "Know Your Numbers" service first (special automated features)
- Include common services: Basic Screening, Dental, Vision, ECG
- Set realistic duration estimates for scheduling

### Staff Manager
**Purpose**: Manage system users and their permissions

**Features**:
- Add staff members with contact information
- Assign professional capacities (Doctor, Nurse, Administration, etc.)
- Set access permissions for different system areas
- Configure service-specific permissions

**Permission Types**:
- **Admin**: Full system access
- **Services Tab**: Can access service records
- **Prognosis Tab**: Can add diagnoses and treatment plans
- **Prescriptions Tab**: Can prescribe medications

### Doctors Manager
**Purpose**: Register medical doctors for events

**Features**:
- Add doctor profiles with credentials
- Include specializations and license numbers
- Assign doctors to specific events
- Set doctor roles (attending, consulting, etc.)

### Nurses Manager
**Purpose**: Register nursing staff

**Features**:
- Add nurse profiles with certification levels
- Track license numbers
- Assign nurses to events
- Define nursing roles and responsibilities

---

## Event Management

### Creating Events
1. Navigate to Dashboard → Events
2. Click "Create New Event"
3. Fill in event details:
   - **Name**: Descriptive event title
   - **Date**: When the event occurs
   - **Location**: Select from configured locations
   - **Start/End Times**: Event duration
   - **Description**: Additional details
4. Assign services to the event
5. Assign medical staff (doctors and nurses)

### Event Status Management
- **Open**: Event is active and accepting patients
- **Closed**: Event is finished, no new registrations
- **Cancelled**: Event was cancelled

### Event Configuration
**Services Assignment**:
- Select which medical services will be available
- Services can be shared across multiple events
- Ensure adequate staffing for selected services

**Staff Assignment**:
- Assign doctors and nurses to events
- Define roles and responsibilities
- Ensure proper coverage for all services

---

## Queue Management

*Access after selecting an event from the Dashboard*

### Registration Tab
**Purpose**: Register patients for the selected event

**Patient Information Required**:
- **Basic Info**: Name, date of birth, gender, contact details
- **Address**: Parish and town
- **Medical Info**: Conditions, allergies, current medications
- **Emergency Contact**: Name and phone number
- **Insurance**: Provider and number (optional)

**Service Selection**:
- Choose which services the patient needs
- Multiple services can be selected
- Some services may be automatically added based on screening results

**Features**:
- **Autocomplete Search**: Find existing patients quickly
- **Automatic Patient Numbers**: System assigns unique identifiers (P000001, P000002, etc.)
- **Duplicate Prevention**: System checks for existing patients

### Patient Search Tab
**Purpose**: Find registered patients and manage their services

**Search Options**:
- Search by name, patient number, or phone
- Filter by service type
- View patient details and history

**Actions Available**:
- Add patients to service queues
- View complete patient profiles
- Access medical history
- Assign to specific services

### Service Queue Tabs
**Purpose**: Manage patient flow through each medical service

**Queue Management Features**:
- **Status Tracking**: Waiting → In Progress → Completed
- **Real-time Updates**: See current queue positions
- **Staff Assignment**: Assign specific doctors/nurses
- **Time Tracking**: Monitor service duration
- **Notes**: Add service-specific observations

**Service Status Options**:
- **Waiting**: Patient in queue
- **In Progress**: Currently receiving service
- **Completed**: Service finished
- **Skipped**: Patient declined service
- **No Show**: Patient didn't appear

### Special Features

**"Know Your Numbers" Automation**:
When a patient completes the "Know Your Numbers" service, they are automatically added to ALL other event services with "waiting" status.

**Queue Position Management**:
- Automatic position assignment
- Manual reordering capabilities
- Priority handling for urgent cases

---

## Patient Management

*Access: Requires appropriate permissions*

### Patient Records
**View and Edit**:
- Complete patient profiles
- Medical history across all events
- Service records and outcomes
- Contact information updates

### Medical Records Tabs

#### Basic Screening
- Vital signs (BP, heart rate, temperature)
- Measurements (height, weight, BMI)
- Basic health indicators
- Screening notes

#### Dental Assessment
- Oral health evaluation
- Teeth and gum condition
- Dental recommendations
- Professional notes

#### Vision/Optician
- Eye pressure measurements
- Vision test results
- Prescription details
- Assessment notes

#### ECG Results
- Heart rhythm analysis
- Professional interpretation
- Results documentation
- Follow-up recommendations

#### PAP Smear (where applicable)
- Assessment findings
- Recommendations
- Follow-up requirements
- Medical professional notes

#### Immunizations
- Vaccine records
- Lot numbers and expiration dates
- Administration details
- Site of injection

#### Prescriptions
- Medication details
- Dosage and frequency
- Duration and instructions
- Prescribing physician

#### Prognosis and Complaints
- Patient complaints and symptoms
- Medical diagnosis
- Treatment plans
- Follow-up requirements

### Patient History
**Comprehensive View**:
- All past events attended
- Complete service history
- Medical record timeline
- Contact and address changes

---

## Reports and Analytics

### Registration Report
**Purpose**: Track patient registration statistics

**Data Included**:
- Total registrations by event
- Patient demographics
- Service selections
- Registration trends

### Service Statistics
**Purpose**: Analyze service utilization and performance

**Metrics Available**:
- Service completion rates
- Average service duration
- Patient satisfaction indicators
- Staff utilization

### Import/Export Features
**Patient Data Import**:
- CSV file upload support
- Automatic patient number assignment
- Data validation and error reporting
- Bulk patient registration

**Export Options**:
- Patient data export (CSV format)
- Service reports
- Event summaries
- Custom date range selections

**Supported Import Format**:
```csv
first_name,last_name,date_of_birth,gender,phone,email,parish,medical_conditions,allergies,medications
John,Doe,1990-01-15,Male,555-1234,john.doe@email.com,Kingston,Diabetes,None,Metformin
```

---

## Medical Services

### Service Types Supported
1. **Know Your Numbers**: Basic health screening with automatic queue management
2. **Basic Screening**: Comprehensive vital signs and measurements
3. **Dental**: Oral health assessment and screening
4. **Vision/Optician**: Eye examination and vision testing
5. **ECG**: Heart rhythm analysis
6. **PAP Smear**: Cervical cancer screening
7. **Immunizations**: Vaccination records and administration
8. **Back to School**: Student health clearance

### Service Workflow
1. **Patient Registration**: Add to event and select services
2. **Queue Assignment**: Patient enters service queues
3. **Service Delivery**: Medical professional provides service
4. **Documentation**: Record findings and recommendations
5. **Completion**: Mark service as complete, patient moves to next service

### Data Recording
Each service maintains detailed records including:
- Service provider information
- Timestamps for all status changes
- Clinical findings and measurements
- Recommendations and follow-up needs
- Patient-specific notes

---

## User Permissions

### Permission Levels

#### Administrator
- Full system access
- Foundation management
- User management
- All reports and analytics
- System configuration

#### Medical Professional
- Patient registration and management
- Service queue management
- Medical record documentation
- Relevant reports access

#### Service Staff
- Assigned service management
- Patient interaction within scope
- Basic reporting access
- Limited patient data access

### Service-Specific Permissions
**Services Tab Access**: View and manage service records
**Prognosis Tab Access**: Add diagnoses and treatment plans
**Prescriptions Tab Access**: Prescribe and manage medications

### Permission Assignment
1. Navigate to Foundation Setup → Staff Manager
2. Select staff member
3. Configure permission checkboxes
4. Assign specific service permissions
5. Save changes

---

## Import/Export Features

### Patient Data Import
**Supported Formats**: CSV files with specific column structure

**Required Columns**:
- first_name, last_name (required)
- date_of_birth, gender, phone (recommended)
- parish, medical_conditions, allergies, medications (optional)

**Import Process**:
1. Navigate to Reports → Import/Export tab
2. Download sample CSV template
3. Prepare your data file
4. Upload CSV file
5. Review validation results
6. Confirm import

**Automatic Features**:
- Patient numbers assigned automatically (P000001, P000002, etc.)
- Duplicate detection and prevention
- Data validation and error reporting

### Data Export Options
**Available Exports**:
- Complete patient database
- Event-specific patient lists
- Service completion reports
- Medical summary reports

**Export Process**:
1. Select report type
2. Choose date range and filters
3. Click "Export Data"
4. Download generated CSV file

---

## Troubleshooting

### Common Issues

#### Cannot Access Queue System
**Problem**: "No Open Events Available" message
**Solution**: 
1. Navigate to Events management
2. Create a new event or reopen an existing one
3. Ensure event status is set to "Open"

#### Patient Not Found in Search
**Problem**: Cannot locate registered patient
**Solution**:
1. Try searching by patient number instead of name
2. Check if patient was registered for the correct event
3. Verify spelling of search terms

#### Permission Denied Errors
**Problem**: Cannot access certain features
**Solution**:
1. Contact your administrator
2. Verify your user permissions in Staff Manager
3. Ensure you're assigned to relevant services

#### Import Errors
**Problem**: CSV import fails with validation errors
**Solution**:
1. Check CSV format matches template exactly
2. Ensure required fields (first_name, last_name) are present
3. Verify date formats (YYYY-MM-DD)
4. Remove special characters from data

#### Service Queue Not Updating
**Problem**: Queue status changes not reflecting
**Solution**:
1. Refresh the page
2. Check internet connection
3. Verify you have permission to modify that service
4. Contact technical support if issue persists

### Getting Help

#### System Support
- Check this manual for common solutions
- Contact your system administrator
- Report bugs to technical support

#### Training Resources
- New user onboarding available
- Service-specific training materials
- Best practices documentation

#### Data Backup
- Regular automated backups maintained
- Export data regularly for local backup
- Contact administrator for data recovery needs

---

## Best Practices

### Event Planning
1. **Setup Foundation First**: Configure all locations, services, and staff before creating events
2. **Test Run**: Conduct a small test event before major health fairs
3. **Staff Training**: Ensure all users understand their permissions and responsibilities
4. **Service Planning**: Estimate patient volume to determine staffing needs

### Patient Flow Management
1. **Registration First**: Complete patient registration before adding to service queues
2. **Priority Services**: Start with "Know Your Numbers" for automatic queue population
3. **Status Updates**: Keep service statuses current for accurate tracking
4. **Documentation**: Complete all service records before marking as complete

### Data Management
1. **Regular Exports**: Backup patient data regularly
2. **Data Validation**: Review imported data for accuracy
3. **Privacy Compliance**: Follow healthcare data protection guidelines
4. **Record Keeping**: Maintain complete service documentation

### Quality Assurance
1. **Double-Check Data**: Verify patient information accuracy
2. **Complete Records**: Ensure all services are properly documented
3. **Follow-up**: Track patients requiring additional care
4. **Reporting**: Use analytics to improve future events

---

*For additional support or questions not covered in this manual, please contact your system administrator or technical support team.*

**Document Version**: 1.0  
**Last Updated**: January 2025  
**System Version**: HealthFair Pro v1.0