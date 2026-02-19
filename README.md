# ◈ Finova — Personal Finance Tracker

A modern, full-stack personal finance dashboard built with **React** and **Firebase**. Track your income and expenses, visualize spending patterns, and manage your finances — all in one place.

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=flat&logo=firebase)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?style=flat&logo=vercel)

---

## 🌐 Live Demo

🔗 [https://finance-tracker.vercel.app](https://finance-tracker.vercel.app)

---

## 📸 Features

- 🔐 **Authentication** — Sign up and login with Email & Password using Firebase Auth
- 💰 **Dashboard** — View total balance, income, and expenses at a glance
- ➕ **Add Transactions** — Add income or expense entries with title, amount, category and date
- ✏️ **Edit & Delete** — Update or remove any transaction instantly
- 🔍 **Search & Filter** — Filter transactions by type and category
- 📊 **Analytics Page** — Monthly bar chart, category breakdown, savings rate and more
- ⚙️ **Settings Page** — Change password, toggle dark/light mode, view profile info
- 🌙 **Dark / Light Mode** — Toggle between themes
- 📱 **Fully Responsive** — Works on mobile, tablet and desktop
- ☁️ **Real-time Database** — All data saved to Firebase Firestore instantly

---

## 🛠️ Built With

| Technology | Purpose |
|---|---|
| React 18 | Frontend UI |
| Firebase Auth | User authentication |
| Firebase Firestore | Real-time database |
| CSS3 | Styling and animations |
| SVG | Donut chart |
| Vercel | Deployment |

---

## 📁 Project Structure

```
my-finance-tracker/
├── public/
│   └── index.html
├── src/
│   ├── App.js                          ← Auth routing
│   └── PersonalFinanceTracker/
│       ├── firebase.js                 ← Firebase config
│       ├── AuthPage.jsx                ← Login & Signup page
│       ├── AuthPage.css
│       ├── PersonalFinanceTracker.jsx  ← Main dashboard
│       └── PersonalFinanceTracker.css
├── .env                                ← Firebase keys (not uploaded to GitHub)
├── .gitignore
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org) installed
- A [Firebase](https://firebase.google.com) account

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/finance-tracker.git
cd finance-tracker
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Firebase

1. Go to [firebase.google.com](https://firebase.google.com) and create a project
2. Enable **Email/Password** Authentication
3. Create a **Firestore Database** in test mode
4. Add a Firestore composite index:
   - Collection: `transactions`
   - Field 1: `uid` → Ascending
   - Field 2: `createdAt` → Descending

### 4. Configure environment variables

Create a `.env` file in the root of the project:

```env
REACT_APP_API_KEY=your_api_key
REACT_APP_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_PROJECT_ID=your_project_id
REACT_APP_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_APP_ID=your_app_id
```

### 5. Run the app

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ Deployment on Vercel

### Step 1 — Push to GitHub
```bash
git add .
git commit -m "your message"
git push origin main
```

### Step 2 — Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New Project"** and import your repository
3. Add all 6 environment variables from your `.env` file
4. Click **Deploy**

### Step 3 — Add Vercel domain to Firebase
1. Firebase Console → Authentication → Settings → Authorized Domains
2. Add your Vercel URL e.g. `finance-tracker.vercel.app`

---

## 📊 How the Charts Work

All charts are built from scratch using **pure CSS and SVG** — no chart libraries used.

### Category Bar Chart
```jsx
<div style={{ width: `${(amount / maxAmount) * 100}%` }} />
```
Each bar width is calculated as a percentage of the highest value.

### Donut Chart (SVG)
```jsx
<circle
  strokeDasharray={`${(income / total) * 283} 283`}
  transform="rotate(-90 60 60)"
/>
```
A full circle circumference = `2 × π × 45 = 283px`. The stroke dash draws the exact percentage of the circle.

### Monthly Bar Chart
```jsx
<div style={{ height: `${(amount / maxAmount) * 140}px` }} />
```
Bar heights are calculated proportionally against the maximum monthly value.

---

## 📱 Responsive Design

| Screen Size | Layout |
|---|---|
| Desktop (1024px+) | Side by side — transactions + analytics sidebar |
| Tablet (768px–1024px) | Analytics moves below transactions |
| Mobile (under 768px) | Single column + bottom navigation bar |
| Small phone (under 480px) | Compact cards, simplified layout |

---

## 🔐 Security

- Firebase API keys are stored in `.env` and never pushed to GitHub
- `.env` is listed in `.gitignore`
- Each user can only read and write their own transactions (filtered by `uid`)
- Passwords are managed securely by Firebase Authentication

---

## 📝 Assignment Coverage

| Criteria | Marks | Implementation |
|---|---|---|
| UI Design | 20 | Dark/light theme, responsive layout, animations |
| Features & Functionality | 25 | Add, Edit, Delete, Dashboard, filters, search |
| React Code Structure | 15 | useState, useEffect, clean components |
| Firebase Usage | 15 | Auth + Firestore real-time integration |
| User Experience | 10 | Mobile nav, toast notifications, smooth modals |
| Creativity | 10 | Custom charts, luxury fintech theme, dark mode |
| Deployment | 5 | Deployed on Vercel |
| **Total** | **100** | |

---

## 👨‍💻 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)

---

## 📄 License

This project is for educational purposes.
