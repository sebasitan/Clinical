# Klinik Pergigian Setapak (Sri Rampai) - User Manual

## Table of Contents

1. [Introduction](#introduction)
2. [System Overview](#system-overview)
3. [Getting Started](#getting-started)
4. [Patient Guide](#patient-guide)
5. [Admin Guide](#admin-guide)
6. [Role-Based Access](#role-based-access)
7. [Troubleshooting](#troubleshooting)
8. [Contact & Support](#contact--support)

---

## Introduction

Welcome to the **Klinik Pergigian Setapak (Sri Rampai)** dental clinic management system. This comprehensive platform streamlines appointment booking, patient management, and clinical operations for both patients and clinic staff.

### Key Features

- **Online Appointment Booking** - 24/7 self-service booking
- **Patient Management** - Complete patient registry with medical alerts
- **Doctor Scheduling** - Advanced schedule and availability management
- **Care Plans** - Follow-up treatment tracking and reminders
- **Automated Reminders** - SMS, WhatsApp, and Email notifications
- **Staff Management** - Receptionist credential and shift management
- **Audit Logging** - Complete activity tracking for compliance

---

## System Overview

### User Types

1. **Patients** - Book and manage appointments online
2. **Receptionists** - Manage arrivals, check-ins, and basic operations
3. **Admins** - Full system access and configuration
4. **Super Admins** - Complete control including staff management

### Technology Stack

- **Frontend**: Next.js with React
- **Database**: MongoDB with Mongoose
- **Notifications**: Email (Resend), SMS/WhatsApp (MoceanAPI)
- **Deployment**: Vercel

---

## Getting Started

### Accessing the System

**Public Website**: [https://your-clinic-url.com](https://your-clinic-url.com)

**Admin Portal**: [https://your-clinic-url.com/admin/login](https://your-clinic-url.com/admin/login)

### Default Admin Credentials

> **⚠️ IMPORTANT**: Change default credentials immediately after first login

- **Username**: `admin`
- **Password**: `admin123`

---

## Patient Guide

### 1. Booking an Appointment

#### Step-by-Step Process

1. **Visit the Website**
   - Navigate to the homepage
   - Click "Book Appointment" button

2. **Select Patient Type**
   - Choose "New Patient" or "Existing Patient"
   - New patients will need to provide complete details
   - Existing patients can verify with IC number

3. **Choose a Doctor**
   - Browse available doctors with photos and specializations
   - View doctor availability
   - Select preferred doctor

4. **Select Date and Time**
   - View calendar with available dates
   - Only dates with available slots are selectable
   - Choose from available time slots

5. **Enter Patient Details**
   - **Required Fields**:
     - Full Name
     - IC Number (Identity Card)
     - Mobile Number
     - Email Address (optional)
   - Medical alerts or special notes (optional)

6. **Confirm Booking**
   - Review all details
   - Submit appointment request
   - Receive confirmation via SMS/Email

#### Booking Confirmation

After successful booking, you will receive:

- **Immediate Confirmation** on screen with Appointment ID
- **SMS Confirmation** to mobile number
- **WhatsApp Message** with appointment details
- **Email** with calendar invite (.ics file)

### 2. Managing Your Appointment

#### Accessing Appointment Management

1. Visit the website
2. Click "Manage Booking"
3. Enter your **Mobile Number**
4. Enter the **OTP (One-Time Password)** sent to your phone
5. View your appointment details

#### Available Actions

**View Appointment Details**
- Appointment ID
- Patient Name and IC
- Date and Time
- Doctor assigned
- Clinic location

**Reschedule Appointment**
1. Click "Reschedule"
2. Select new date and time slot
3. Confirm changes
4. Receive updated confirmation

**Cancel Appointment**
1. Click "Cancel Appointment"
2. Confirm cancellation
3. Receive cancellation confirmation
4. Time slot released for other patients

### 3. Appointment Day

#### Before Your Visit

- Arrive **10 minutes early** for registration
- Bring your **IC/Passport**
- Bring **previous medical records** (if applicable)
- Add appointment to your calendar using the email invite

#### At the Clinic

1. **Check-in** at reception
2. Receptionist will mark you as "Arrived"
3. Wait for your name to be called
4. Proceed to consultation room

---

## Admin Guide

### 1. Logging In

1. Navigate to `/admin/login`
2. Enter your **username**
3. Enter your **password**
4. Click "Login to Dashboard"

> **Security**: Sessions expire after inactivity. Always log out when finished.

### 2. Dashboard Overview

The admin dashboard provides a comprehensive overview:

#### Key Metrics Cards

- **Today's Arrivals** - Patients who checked in today
- **Pending Appointments** - Awaiting confirmation
- **Total Patients** - Complete patient registry count
- **Active Doctors** - Currently available doctors

#### Quick Actions

- **View Arrivals** - See today's patient check-ins
- **Patient Registry** - Access complete patient database
- **Schedule Management** - Manage doctor availability
- **Generate Reports** - Export data for analysis

#### Recent Activity Feed

- Latest appointments
- Recent check-ins
- System notifications
- Pending actions

### 3. Patient Management

#### Accessing Patient Registry

**Navigation**: Dashboard → Patients

#### Features

**Patient List View**
- Searchable table with all registered patients
- Sort by Name, IC, Date, Doctor
- Pagination (25 patients per page)
- Filter and search capabilities

**Patient Information Displayed**
- Full Name
- IC Number
- Phone Number
- Last Visit Date
- Medical Alerts (if any)
- Last Updated By (staff member)
- Last Update Timestamp

**Adding a New Patient**

1. Click "Add Patient" button
2. Fill in required details:
   - **Name** (required)
   - **IC Number** (required, unique)
   - **Phone** (required)
   - **Email** (optional)
   - **Medical Alerts** (optional)
   - **Patient Type**: New/Existing
3. Click "Save Patient"
4. System tracks who created the record

**Editing Patient Information**

1. Click on patient row or "Edit" button
2. Modify necessary fields
3. Save changes
4. System records:
   - Who made the update
   - When it was updated
   - Previous values in audit log

**Patient Record Includes**

- Personal details
- Contact information  
- Medical history/alerts
- Appointment history
- Follow-up treatment plans
- Audit trail of all changes

### 4. Appointment & Arrivals Management

#### Arrivals Page

**Navigation**: Dashboard → Arrivals

**Purpose**: Manage today's patient check-ins

**Features**

**Patient Check-In Process**

1. View list of today's appointments
2. Patient arrives at clinic
3. Click "Check In" next to patient name
4. Status changes to "Arrived"
5. System records:
   - Who checked in the patient
   - Exact check-in time

**Appointment Statuses**

- **Pending** - Appointment created, awaiting confirmation
- **Confirmed** - Appointment verified by clinic
- **Arrived** - Patient checked in at clinic
- **Completed** - Consultation finished
- **Cancelled** - Appointment cancelled
- **No-Show** - Patient did not arrive

**Updating Status**

1. Select patient from arrivals list
2. Click status dropdown
3. Choose new status
4. Confirm update
5. System tracks who made the change

**Information Displayed**

For each appointment:
- Patient Name
- IC Number
- Appointment Time
- Doctor assigned
- Current Status
- Check-in timestamp
- "Checked in by [Receptionist Name]"

### 5. Doctor Management

#### Accessing Doctor Directory

**Navigation**: Dashboard → Doctors

#### Features

**Doctor List View**

- Doctor photos and profiles
- Name and specialization
- Active/Inactive status
- Booking count
- Contact information
- Sort and filter options

**Adding a New Doctor**

1. Click "Add Doctor"
2. Upload doctor photo (recommended 400x400px)
3. Enter details:
   - **Name** (required)
   - **Specialization** (required)
   - **Phone** (required)
   - **Email** (required)
   - **Slot Duration**: 10, 15, 20, or 30 minutes
   - **Active Status**: On/Off
4. Click "Register"

**Doctor Photo Upload**

- Accepts: PNG, JPG, JPEG
- Recommended: Square image, 400x400px minimum
- Uploads to Cloudinary
- Optional but highly recommended

**Editing Doctor Profile**

1. Click "Edit" on doctor card
2. Modify information
3. Update photo if needed
4. Toggle active status
5. Save changes

**Doctor Status Management**

- **Active** - Available for bookings
- **Inactive** - Hidden from public booking
- Toggle via switch button
- Instant effect on booking availability

**Individual Doctor Management**

Click "Manage" to access:
- Schedule configuration
- Leave management
- Consultation records
- Performance data
- Contact details

### 6. Schedule & Availability Management

#### Weekly Schedule Configuration

**Navigation**: Dashboard → Schedule or Doctor → Manage → Schedule

**Setting Up Doctor Schedules**

1. Select doctor from dropdown
2. For each day of the week:
   - Toggle the day On/Off
   - Add time ranges (e.g., 09:00 - 13:00)
   - Add multiple sessions per day (e.g., Morning + Afternoon)
   - Click "Add Session" for additional time ranges
3. Click "Save Schedule"

**Schedule Format**

Example weekly schedule:
```
Monday:    09:00 - 13:00, 14:00 - 17:00
Tuesday:   09:00 - 13:00, 14:00 - 17:00
Wednesday: 09:00 - 13:00, 14:00 - 17:00
Thursday:  09:00 - 13:00, 14:00 - 17:00
Friday:    09:00 - 13:00
Saturday:  OFF
Sunday:    OFF
```

**Time Slot Generation**

- Slots auto-generated based on doctor's slot duration setting
- 30-minute slots: 09:00, 09:30, 10:00, etc.
- 20-minute slots: 09:00, 09:20, 09:40, etc.
- Available 30 days in advance

#### Managing Leaves & Unavailability

**Navigation**: Dashboard → Availability

**Adding Doctor Leave**

1. Select doctor
2. Choose leave type:
   - **Full Day** - Entire day unavailable
   - **Partial** - Specific hours unavailable
   - **Emergency** - Urgent leave
3. Select date(s)
4. For partial: specify start and end time
5. Add reason (optional)
6. Save

**Leave Management**

- View all scheduled leaves
- Delete/modify future leaves
- Blocks all slots for that period
- Patients cannot book during leave
- Automatic notification system

**Block Specific Time Slots**

1. Navigate to Availability
2. Select date range
3. Choose specific slots to block
4. Add reason for blocking
5. Confirm

### 7. Care Plans & Follow-Ups

#### Accessing Care Plans

**Navigation**: Dashboard → Care

**Purpose**: Track patients requiring continued treatment and follow-ups

#### Creating a Follow-Up Plan

1. Find patient in Patient Registry
2. Edit patient record
3. Enable "Continued Treatment"
4. Fill in details:
   - **Next Follow-Up Date**
   - **Treatment Notes**
   - **Status**: In Progress / Completed
   - **Reminder Days Before**: Select when to send reminders (e.g., 2, 1 days)
   - **Channels**: SMS, WhatsApp, Email
5. Save plan

#### Managing Active Care Plans

**Care Plans View Shows**:
- Patient name and contact
- Next scheduled follow-up
- Days until follow-up
- Treatment status
- Last update information

**Updating Follow-Up**

1. Select patient from Care Plans list
2. Click "Update Follow-Up"
3. Modify:
   - Next appointment date
   - Notes
   - Status
   - Reminder preferences
4. Save changes
5. System records who updated

**Completing Treatment**

1. Open patient's care plan
2. Change status to "Completed"
3. Add final notes
4. Save
5. Patient removed from active care plans

### 8. Reminders & Automation

#### Accessing Reminders

**Navigation**: Dashboard → Reminders

#### Reminder Types

**1. Appointment Reminders**
- Automatically sent based on global settings
- Default: 1-2 days before appointment
- Sent via enabled channels (SMS/WhatsApp/Email)

**2. Care Plan Reminders**
- Based on individual patient preferences
- Custom reminder schedule per patient
- Tracks follow-up treatments

**3. Behavioral Reminders**
- Target inactive patients (3 months, 6 months)
- Re-engagement campaigns
- Custom messaging

**4. Broadcast Messages**
- Send to all patients or specific groups
- Announcements and updates
- Schedule for future delivery

#### Global Reminder Settings

**Configuration Options**:

1. **Enable/Disable System**
   - Master toggle for all reminders
   - Does not affect individual patient preferences

2. **Default Days Before**
   - When to send appointment reminders
   - Options: 0 (day of), 1, 2, 3, 7 days

3. **Channels**
   - **SMS**: Text message reminders
   - **WhatsApp**: WhatsApp business messages
   - **Email**: Email with calendar invite

4. **Save Settings**
   - Updates apply to future reminders
   - Existing scheduled not affected

#### Running Global Check

**Purpose**: Manually trigger the reminder automation engine

**What It Does**:
- Scans all upcoming appointments
- Checks care plan follow-ups
- Sends due reminders
- Logs all activities

**How to Run**:
1. Navigate to Reminders page
2. Click "Run Global Check"
3. System processes:
   - Today's appointments
   - Appointments in next 7 days
   - Due care plan follow-ups
4. View execution log

**Execution Log Shows**:
- Timestamp
- Appointments processed
- Reminders sent breakdown (SMS/WhatsApp/Email)
- Any errors encountered

#### Creating Custom Reminders

1. Click "Create Reminder"
2. Select reminder type
3. Choose target group
4. Compose message template
5. Set delivery schedule
6. Select channels
7. Save and activate

### 9. Receptionist Management

#### Accessing Receptionist Management

**Navigation**: Dashboard → Receptionists

> **⚠️ Access**: Only available to Admin and Super Admin roles

#### Features

**Receptionist List View**
- Name and photo
- Username
- Contact information
- Shift assignment
- Active/Inactive status

**Adding a New Receptionist**

1. Click "Add Receptionist"
2. Fill in details:
   - **Name** (required)
   - **Username** (required, unique)
   - **Password** (required)
   - **Phone** (required)
   - **Email** (required)
   - **Shift**: Morning, Afternoon, or Full Day
   - **Photo**: Upload profile picture
3. Click "Add Receptionist"

**Managing Receptionist Status**

- **Active**: Can log in and perform duties
- **Inactive**: Cannot access system
- Toggle via "Status" button
- Useful for temporary staff or suspensions

**Resetting Receptionist Password**

1. Click "Reset Password" on receptionist card
2. Enter new password
3. Confirm password
4. Save
5. Inform receptionist of new credentials

**Receptionist Credentials**

- Each receptionist has unique username
- Password can be reset by admins
- Login at `/admin/login`
- Limited access based on receptionist role

#### Receptionist Permissions

Receptionists can:
- ✅ View Dashboard
- ✅ Manage Arrivals (check-in patients)
- ✅ View Patient Registry
- ✅ View Appointments
- ✅ View Doctor Schedules

Receptionists cannot:
- ❌ Add/Edit Doctors
- ❌ Manage other Receptionists
- ❌ Access Settings
- ❌ View Audit Logs
- ❌ Manage Facilities
- ❌ Generate Reports

### 10. Reports & Analytics

#### Accessing Reports

**Navigation**: Dashboard → Reports

#### Available Reports

**1. Appointment Report**
- Date range selection
- Filter by doctor
- Filter by status
- Export as Excel/PDF

**Data Included**:
- Appointment ID
- Patient details
- Doctor assigned
- Date and time
- Status
- Check-in information

**2. Patient Report**
- Complete patient registry
- Filter options
- Export capabilities

**3. Doctor Performance**
- Appointments per doctor
- Completion rates
- Patient volume trends

**4. Revenue Summary** (if enabled)
- Consultation fees
- Payment tracking
- Financial overview

#### Generating Reports

1. Select report type
2. Set date range
3. Apply filters
4. Click "Generate Report"
5. Choose export format:
   - **Excel** (.xlsx) - For data analysis
   - **PDF** - For printing/records
6. Download file

#### Report Download

- Files generated and uploaded to Cloudinary
- Download link provided
- Files include timestamp
- Naming format: `report_type_YYYYMMDD_HHMMSS`

### 11. Audit Logs

#### Accessing Audit Trail

**Navigation**: Dashboard → Audit

> **⚠️ Access**: Admin and Super Admin only

#### What is Logged

**User Actions**:
- Login events
- Patient record changes
- Appointment status updates
- Schedule modifications
- Settings changes
- User management actions

**Information Captured**:
- **Timestamp** - Exact date and time
- **User** - Who performed the action
- **Action** - What was done
- **Details** - Specific changes made
- **IP Address** (if applicable)

#### Viewing Audit Logs

**Table View Shows**:
- Date/Time
- User (Admin/Receptionist name)
- Action type
- Description
- Details button

**Filtering Options**:
- Date range
- User/Admin
- Action type
- Search by keywords

**Use Cases**:
- Compliance and regulatory requirements
- Investigating issues
- Tracking changes
- Security monitoring
- Staff accountability

### 12. System Settings

#### Accessing Settings

**Navigation**: Dashboard → Settings

> **⚠️ Access**: Super Admin only

#### Clinic Information

**Editable Fields**:
- Clinic Name
- Address
- Phone Number
- Email Address
- Operating Hours

**How to Update**:
1. Navigate to Settings
2. Modify desired fields
3. Click "Save Settings"
4. Changes reflect immediately on website

#### Notification Settings

**Configuration**:
- Enable/Disable SMS
- Enable/Disable WhatsApp
- Enable/Disable Email
- Set default message templates
- Configure API keys

#### Booking Settings

- Default slot duration
- Booking window (how far in advance)
- Cancellation policy
- Auto-confirmation settings

#### API Integrations

**MoceanAPI (SMS/WhatsApp)**:
- API Key configuration
- Sender ID setup
- Message templates

**Resend (Email)**:
- API Key
- From email address
- Email templates

**Cloudinary (Image Upload)**:
- Cloud name
- API key
- API secret
- Upload presets

---

## Role-Based Access

### Access Control Matrix

| Feature | Super Admin | Admin | Receptionist |
|---------|------------|-------|--------------|
| **Dashboard** | ✅ Full | ✅ Full | ✅ View Only |
| **Arrivals** | ✅ Full | ✅ Full | ✅ Full |
| **Patients** | ✅ Full | ✅ Full | ✅ View Only |
| **Appointments** | ✅ Full | ✅ Full | ✅ View Only |
| **Doctors** | ✅ Full | ✅ Full | ❌ |
| **Receptionists** | ✅ Full | ✅ Full | ❌ |
| **Schedule** | ✅ Full | ✅ Full | ✅ View Only |
| **Availability** | ✅ Full | ✅ Full | ❌ |
| **Care Plans** | ✅ Full | ✅ Full | ✅ View Only |
| **Reminders** | ✅ Full | ✅ Full | ❌ |
| **Reports** | ✅ Full | ✅ Full | ❌ |
| **Audit Logs** | ✅ Full | ✅ Full | ❌ |
| **Settings** | ✅ Full | ❌ | ❌ |
| **Facilities** | ✅ Full | ✅ Full | ❌ |

### Understanding Roles

#### Super Admin
- **Full System Access**
- Manage all users including admins
- Configure system settings
- Access all features and data
- Cannot be deleted or demoted

#### Admin
- **Operational Management**
- Manage patients, doctors, appointments
- Generate reports
- Manage receptionists
- Cannot change system settings

#### Receptionist
- **Front Desk Operations**
- Check-in patients
- View schedules and appointments
- View patient information
- Limited to operational tasks

### Doctor Role
- **Note**: Doctor role exists in the system but login is disabled
- Doctors do not access the admin panel
- All doctor data managed by admins/receptionists

---

## Troubleshooting

### Common Issues & Solutions

#### 1. Cannot Log In

**Problem**: Invalid credentials error

**Solutions**:
- Verify username and password (case-sensitive)
- Check for extra spaces
- Ensure Caps Lock is off
- Contact Super Admin for password reset
- Verify account is active

#### 2. Appointment Not Showing

**Problem**: Patient says they booked but appointment not in system

**Solutions**:
- Ask for Appointment ID
- Search by patient IC number
- Check spam folder for confirmation email
- Verify booking was completed (payment page closed prematurely)
- Check correct date selected
- Look in "Pending" or "Cancelled" status

#### 3. No Available Slots

**Problem**: Patient cannot book - no time slots available

**Solutions**:
- Verify doctor schedule is configured
- Check if doctor is on leave for that date
- Ensure doctor status is "Active"
- Check slot generation ran (Admin: run slot generation)
- Verify booking window settings

#### 4. SMS/Email Not Received

**Problem**: Patient not receiving notifications

**Solutions**:
- Verify phone number/email format is correct
- Check notification settings are enabled
- Verify API keys are correctly configured
- Check spam/junk folders for emails
- Verify patient's preferred channels in profile
- Check MoceanAPI/Resend dashboard for delivery status

#### 5. Reminder Not Sent

**Problem**: Automated reminders not working

**Solutions**:
- Check global reminder settings are enabled
- Verify "Days Before" settings
- Ensure channels (SMS/WhatsApp/Email) are enabled
- Run "Global Check" manually
- Check reminder execution logs for errors
- Verify patient has contact information

#### 6. Photo Upload Failed

**Problem**: Cannot upload doctor/receptionist photo

**Solutions**:
- Check image format (PNG, JPG, JPEG only)
- Reduce file size (recommended: under 2MB)
- Verify Cloudinary credentials in settings
- Check internet connection
- Try different browser

#### 7. Report Download Not Working

**Problem**: Generate report button not working

**Solutions**:
- Check date range is valid
- Ensure there is data for selected period
- Verify Cloudinary configuration
- Check browser pop-up blocker
- Try different export format

#### 8. Schedule Not Saving

**Problem**: Doctor schedule changes not saving

**Solutions**:
- Verify time format is correct (HH:MM)
- End time must be after start time
- No overlapping time ranges
- Clear browser cache
- Try different browser

### Browser Compatibility

**Recommended Browsers**:
- ✅ Google Chrome (latest)
- ✅ Mozilla Firefox (latest)
- ✅ Microsoft Edge (latest)
- ✅ Safari (latest)

**Not Supported**:
- ❌ Internet Explorer

### Clearing Browser Cache

If experiencing issues:

1. **Chrome**: Settings → Privacy → Clear browsing data
2. **Firefox**: Options → Privacy → Clear Data
3. **Safari**: Safari → Clear History
4. Hard refresh: `Ctrl + F5` (Windows) or `Cmd + Shift + R` (Mac)

---

## Best Practices

### For Administrators

**Daily Tasks**:
1. Check Dashboard for overview
2. Review today's arrivals
3. Monitor pending appointments
4. Check reminder execution logs
5. Review any error notifications

**Weekly Tasks**:
1. Review doctor schedules for upcoming week
2. Check leave requests
3. Generate and review appointment reports
4. Monitor no-show rates
5. Review care plan follow-ups

**Monthly Tasks**:
1. Generate comprehensive reports
2. Review patient growth
3. Analyze doctor performance
4. Backup data
5. Review and update policies

### For Receptionists

**Patient Check-In Workflow**:
1. Greet patient warmly
2. Verify identity (IC/Passport)
3. Search patient in arrivals list
4. Click "Check In"
5. Inform doctor of patient arrival
6. Update status to "Completed" after consultation

**Phone Inquiries**:
1. Have patient provide IC number
2. Search in patient registry
3. Provide appointment details
4. Assist with rescheduling if needed
5. Confirm updated details

### Data Security

**Password Management**:
- Use strong, unique passwords
- Change default passwords immediately
- Never share credentials
- Log out when leaving workstation
- Update passwords regularly (every 90 days)

**Patient Privacy**:
- Only access patient data when necessary
- Do not discuss patient information publicly
- Ensure screen privacy in public areas
- Follow HIPAA/PDPA guidelines
- Log out of system when not in use

---

## Contact & Support

### Clinic Information

**Klinik Pergigian Setapak (Sri Rampai)**

📍 **Address**:
16-2, Jalan 46/26, Taman Sri Rampai,
53300 Kuala Lumpur,
Wilayah Persekutuan Kuala Lumpur, Malaysia

📞 **Phone**: +60 17-510 1003

📧 **Email**: Kpsetapaksr@gmail.com

🌐 **Website**: [Your Website URL]

### Operating Hours

| Day | Hours |
|-----|-------|
| Monday - Friday | 09:00 - 18:00 |
| Saturday | 09:00 - 13:00 |
| Sunday | Closed |

### Technical Support

For system issues, bugs, or technical assistance:

1. **Document the Issue**:
   - What you were trying to do
   - What happened instead
   - Error messages (if any)
   - Screenshots (if applicable)

2. **Contact Support**:
   - Email technical details to support team
   - Include your username and role
   - Describe steps to reproduce issue

3. **Emergency Issues**:
   - System completely down
   - Cannot access critical patient data
   - Security concerns
   - Call clinic immediately

### Feature Requests

To suggest new features or improvements:

1. Email detailed description
2. Explain use case and benefits
3. Provide examples if possible
4. Suggestions reviewed quarterly

---

## Appendix

### Glossary

- **IC Number**: Identity Card number, unique patient identifier
- **OTP**: One-Time Password, used for secure patient verification
- **Slot**: A bookable time period for appointments
- **Care Plan**: Follow-up treatment schedule for ongoing care
- **Audit Log**: Record of all system actions and changes
- **Check-In**: Patient arrival confirmation at clinic

### Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Search anywhere | `Ctrl + K` |
| Refresh page | `F5` or `Ctrl + R` |
| Logout | `Alt + L` |
| Go to Dashboard | `Alt + H` |

### System Requirements

**Minimum Requirements**:
- Modern web browser (Chrome, Firefox, Edge, Safari)
- Internet connection (minimum 1 Mbps)
- Screen resolution: 1024x768 or higher
- JavaScript enabled

**Recommended**:
- Broadband internet (5+ Mbps)
- Screen resolution: 1920x1080
- Latest browser version

### Compliance & Regulations

This system is designed to support compliance with:

- **PDPA** (Personal Data Protection Act)
- **HIPAA** (Health Insurance Portability and Accountability Act)
- **Medical Records Regulations**
- **Data Retention Policies**

> **Note**: Clinic administrators are responsible for ensuring compliance with all applicable local and international regulations.

### Version Information

**User Manual Version**: 1.0
**Last Updated**: December 2024
**Application Version**: See footer of admin panel

---

## Quick Reference Cards

### Patient Booking Quick Guide

```
1. Go to website
2. Click "Book Appointment"
3. Select New/Existing Patient
4. Choose Doctor
5. Pick Date & Time
6. Enter Details
7. Confirm Booking
8. Save Appointment ID
```

### Receptionist Check-In Quick Guide

```
1. Login to admin panel
2. Go to "Arrivals"
3. Find patient in today's list
4. Verify patient identity
5. Click "Check In"
6. Inform doctor
7. Update to "Completed" after consultation
```

### Admin Morning Routine

```
1. Login to dashboard
2. Review daily metrics
3. Check today's arrivals
4. Monitor pending appointments
5. Review reminders sent
6. Check for system notifications
```

---

**End of User Manual**

*For additional assistance, please contact clinic administration or technical support.*
