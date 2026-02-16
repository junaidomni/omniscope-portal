# Research Notes: HR/CRM Hub Design

## CRM Contact Management (HubSpot, Salesforce, Pipedrive patterns)
- Contact record: name, email, phone, company, title, address, DOB, social links, photo
- Activity timeline: all meetings, emails, calls, notes in chronological order
- Deal/pipeline association: link contacts to deals/opportunities
- Tags/labels for segmentation (client, prospect, partner, vendor)
- Starred/favorite contacts for quick access
- AI suggestions: follow-up reminders, best time to reach out, relationship health score
- Duplicate detection: merge duplicates based on name/email similarity
- Custom fields for industry-specific data
- Contact scoring/rating system

## HR Employee Database (BambooHR, Gusto, Rippling patterns)
- Employee profile: name, photo, email, phone, address, DOB, emergency contact
- Employment details: hire date, department, job title, employment type, salary
- Documents section: contracts, ID copies, tax forms, certifications, onboarding docs
- Onboarding checklist: tasks to complete, document uploads, training
- Time off tracking: vacation, sick days, personal days
- Performance notes
- Meeting history (which meetings they attended)

## Payroll Tracking (Gusto, QuickBooks, ADP patterns)
- Employee pay rate (hourly/salary), pay frequency
- Payment records: date paid, amount, method (bank transfer, check, crypto)
- Pay period tracking
- Document uploads: invoices, receipts, pay stubs
- Payment status: pending, paid, overdue
- Running totals and summaries
- Export/reporting capabilities

## AI Intelligence Layer
- Duplicate contact detection (fuzzy name matching + email matching)
- Follow-up reminders in daily briefing ("Haven't spoken to X in 30 days")
- Birthday reminders
- Task completion reminders ("Action item from meeting still open")
- Relationship health scoring
- Smart suggestions in daily/weekly reports

## Data Model Design
### employees table
- id, name, email, phone, address, dateOfBirth, photo, emergencyContact, emergencyPhone
- hireDate, department, jobTitle, employmentType (full-time/part-time/contractor)
- salary, payFrequency (weekly/biweekly/monthly)
- status (active/inactive/terminated)
- notes, createdAt, updatedAt

### payroll_records table
- id, employeeId, payPeriodStart, payPeriodEnd, amount, currency
- paymentMethod (bank_transfer/check/crypto/cash)
- paymentDate, status (pending/paid/overdue)
- notes, documentUrl (receipt/invoice upload)
- createdAt

### hr_documents table
- id, employeeId, title, category (contract/id/tax/certification/onboarding/other)
- fileUrl, fileKey, fileName, mimeType, fileSize
- uploadedAt, uploadedBy

### Enhanced contacts table (already exists, needs expansion)
- Add: company, title, category (client/prospect/partner/vendor)
- Add: starred (boolean), rating (1-5)
- Add: notes (text), tags
- Add: lastContactedAt (auto-updated from meetings)

### contact_notes table
- id, contactId, content, createdAt, createdBy
