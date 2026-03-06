# Event Signup App – Project Plan

## Overview

A static web application using:

- Firebase Authentication (Passkeys)
- Firestore Database
- Firebase Security Rules
- Static hosting (GitHub Pages / Netlify / Firebase Hosting)

No backend server.

The app allows:
1. Admin to create events
2. Users to sign up to events (choose category)
3. All users to see event participants

---

# Architecture

## Tech Stack

Frontend:
- Plain HTML
- Vanilla JavaScript (ES Modules)
- Firebase JS SDK v10+

Backend (Serverless):
- Firebase Authentication (Passkeys)
- Firestore
- Firebase Security Rules

Optional:
- Firebase App Check
- Firebase Hosting

---

# Authentication Design

## Authentication Method
- Email-based login
- Passkey-enabled authentication
- No passwords

## Roles

Roles are determined by Firestore:

Collection:
admins/{adminUid}

If user's UID exists in `admins` collection → user is admin.

No custom role logic on frontend (enforced by Firestore rules).

---

# Firestore Data Model

## Collections Structure

events/
  {eventId}
    name: string
    date: string (ISO)
    categories: array<string>
    createdAt: timestamp
    createdBy: uid

registrations/
  {eventId}/
    {userId}
      uid: string
      category: string
      displayName: string
      registeredAt: timestamp

admins/
  {adminUid}
    createdAt: timestamp

---

# Security Rules

Goals:
- Only authenticated users can read events
- Only admin can create/update/delete events
- Users can register only themselves
- Users can read registrations
- No one can self-promote to admin

High-level rule logic:

function isAdmin():
  check if request.auth.uid exists in admins collection

events:
  read → authenticated users
  write → admin only

registrations:
  read → authenticated users
  write → only if request.auth.uid == userId

admins:
  read → admin only
  write → disabled

---

# Core Features

## 1. Admin – Create Event

Inputs:
- Event name
- Event date
- Categories (comma separated → array)

Behavior:
- Save to events collection
- Only visible if isAdmin()

Future Improvements:
- Category limits
- Edit/delete events
- Close registration

---

## 2. User – View Events

- Fetch all events ordered by date
- Display:
  - Event name
  - Date
  - Categories as selectable buttons

Future Improvements:
- Sort by upcoming first
- Filter by date
- Show participant count per category

---

## 3. User – Register to Event

When user selects category:
- Write to:
  registrations/{eventId}/{uid}

Prevent:
- Duplicate registration (doc ID = uid solves this)
- Changing category? (overwrite allowed or block — decide later)

Future Improvements:
- Limit one category per user
- Allow changing category
- Limit category capacity

---

## 4. Show Participants

For each event:
- Read registrations/{eventId}
- Display:
  - Display name
  - Category

Future Improvements:
- Group by category
- Show counts
- Hide full list if privacy required

---

# UI Structure (Minimal Version)

index.html

Sections:
- Login button
- Admin panel (hidden unless admin)
- Event creation form (admin only)
- Event list
- Participant list per event

No frameworks for now.

---

# Deployment Plan

## Option A: GitHub Pages
- Static hosting
- Connect Firebase project

## Option B: Firebase Hosting
- Single command deploy
- Tight integration

## Option C: Netlify
- Drag & drop deploy

---

# Free Tier Validation

Expected usage:
- < 1000 users
- < 100 events
- Low daily writes

Free limits sufficient:
- 50k reads/day
- 20k writes/day
- 1GB storage

No billing required initially.

---

# Security Hardening Plan

Phase 1:
- Firestore rules
- UID-based registration
- Admin collection enforcement

Phase 2:
- Enable Firebase App Check
- reCAPTCHA v3 integration
- Basic validation in rules

Phase 3 (Optional):
- Rate limiting logic
- Category capacity enforcement
- Closed events

---

# Future Feature Roadmap

Possible expansions:

- Category participant limits
- Waiting list
- Admin dashboard
- Export registrations (CSV)
- Email notifications
- Event capacity counter
- Event editing
- Event deletion
- User profile page
- Audit log
- Role-based access (multiple admins)
- Private events
- QR code check-in
- Mobile-first UI redesign

---

# Implementation Phases

Phase 1 – Foundation
- Setup Firebase
- Setup Auth (Passkeys)
- Setup Firestore
- Write security rules
- Basic event creation
- Basic registration

Phase 2 – UX
- Improve UI
- Display participants
- Improve layout

Phase 3 – Security & Hardening
- App Check
- Input validation
- Error handling

Phase 4 – Enhancements
- Category limits
- Admin tools
- Data export

---

# Open Questions (To Decide Later)

1. Should users be able to change category?
2. Should users be able to unregister?
3. Should events have capacity limits?
4. Should participants be publicly visible or restricted?
5. Should admin UI be on separate page?
6. Should we support multiple admins?

---

# Notes for Future ChatGPT Sessions

When continuing this project, assume:

- Static frontend only
- Firebase Auth with passkeys
- Firestore database
- No backend server
- Admin role stored in Firestore
- UID-based document structure

Ask me to:
- Write rules
- Refactor structure
- Optimize queries
- Add new features
- Improve security
- Improve UI
- Reduce read/write costs

---

End of Plan
