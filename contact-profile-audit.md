# ContactProfile.tsx Feature Audit

## Current Features to Preserve:
1. **Header**: Avatar with initials, name, category badge, employee badge, risk/compliance badges
2. **Contact details**: title, org, email (mailto), phone (tel), DOB, address, website, linkedin
3. **Health indicator**: days since last meeting with color coding
4. **Intelligence fields**: influence weight, introducer source, referral chain
5. **Edit mode**: Full inline editing of all fields including intelligence/compliance fields
6. **Stats grid**: 5 stat cards (meetings, tasks, open tasks, documents, days since)
7. **AI Intelligence panel**: Collapsible, AI summary, persistent memory, generate/regenerate button
8. **AI Enrich button**: Enriches contact fields with AI
9. **Star/favorite toggle**
10. **Delete with confirmation dialog**
11. **Tabs**: Overview, Meetings, Documents, Notes
12. **Overview tab**: Recent meetings (5), assigned tasks, recent documents (4), recent notes (4), private notes, linked employee
13. **Meetings tab**: Full meeting list with links to meeting detail
14. **Documents tab**: Upload form (title, category, notes, file) + full document list with download/delete
15. **Notes tab**: Add note textarea + full notes list with delete

## Queries Used:
- trpc.contacts.getProfile
- trpc.contacts.getNotes
- trpc.contacts.getDocuments
- trpc.contacts.getLinkedEmployee

## Mutations Used:
- trpc.contacts.update
- trpc.contacts.delete
- trpc.contacts.generateAiSummary
- trpc.contacts.enrichWithAI
- trpc.contacts.toggleStar
- trpc.contacts.addNote
- trpc.contacts.deleteNote
- trpc.contacts.uploadDocument
- trpc.contacts.deleteDocument

## Also Need:
- Aliases display (from the Contacts page redesign)
- Merge button
- Wider layout
