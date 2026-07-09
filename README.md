# Interview Booking Dashboard

A modern, fully-featured interview slot booking and management system built with Next.js, React, and Tailwind CSS.

## Features

- 📋 **Book Interview Tab** - Candidates can browse and book available interview slots
- 👀 **View All Slots Tab** - Dashboard with statistics and overview of all slots
- ⚙️ **Admin Panel** - Manage slots, add new interviews, cancel bookings, export data
- 🎨 **Modern UI** - Beautiful gradient design with dark mode support
- 📱 **Responsive** - Works seamlessly on desktop, tablet, and mobile
- 💾 **Local Storage** - Data persists in browser (no backend required initially)
- 📥 **Export** - Export data as JSON or CSV

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
├── app/
│   ├── page.tsx              # Main page
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles
├── components/
│   ├── Dashboard.tsx         # Main dashboard component
│   ├── Header.tsx            # Header section
│   ├── TabNavigation.tsx     # Tab switcher
│   ├── SlotCard.tsx          # Interview slot card
│   ├── Alert.tsx             # Alert messages
│   └── tabs/
│       ├── BookTab.tsx       # Booking interface
│       ├── ViewTab.tsx       # View all slots
│       └── AdminTab.tsx      # Admin management
├── lib/
│   ├── types.ts              # TypeScript types
│   └── storage.ts            # LocalStorage utilities
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

## Usage

### For Candidates

1. Go to **Book Interview** tab
2. Browse available slots
3. Click "Book This Slot"
4. Fill in your details (name, email, phone)
5. Confirm booking

### For Administrators

1. Go to **Admin Panel** tab
2. Use "Add New Interview Slot" form to create slots
3. Set date, time, company name, and duration
4. View all slots and their booking status
5. Cancel bookings or delete slots as needed
6. Export data as JSON or CSV

### Data Management

- Data is stored in browser's localStorage
- Comes with demo data for testing
- Export functionality for backup/analysis

## Technologies Used

- **Framework**: Next.js 15
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Storage**: Browser localStorage

## Customization

### Add Your Company Info

Edit `components/Header.tsx` to customize the header

### Change Color Scheme

Edit `tailwind.config.ts` to modify colors

### Add Backend Integration

The app is designed to work with any backend. Update `lib/storage.ts` to connect to your API instead of localStorage.

## Future Enhancements

- Email notifications for bookings
- Calendar integrations (Google Calendar, Outlook)
- Multiple company accounts
- Interview feedback forms
- Video call integration
- Payment processing
- Database backend (MongoDB, PostgreSQL)

## License

MIT
