# 💬— Full-Stack Real-Time Chat Application

<p align="center">
  A modern, secure and responsive real-time chat application built with React, Node.js, Express, MongoDB and Socket.IO.
</p>

<p align="center">
  <a href="https://chat-application-real-time766.vercel.app/">🌐 Live Demo</a>
</p>

---

## 🚀 About the Project

**Chatify** is a full-stack real-time messaging application designed to provide a smooth and modern chat experience similar to popular messaging platforms.

The application includes secure authentication, real-time messaging, online/offline presence, message reactions, message deletion, image and PDF sharing, message delivery/read status, responsive mobile UI and more.

The project was built to gain practical experience with **full-stack development, REST APIs, WebSockets, authentication, databases, cloud services and deployment.**

---

## 🌐 Live Demo

🔗 **Live Application:**
https://chat-application-real-time766.vercel.app/

---

## ✨ Key Features

### 🔐 Authentication & Security

* Custom JWT-based authentication
* Secure signup and login
* Protected API routes
* Logout functionality
* Password hashing
* Authentication state management
* Arcjet API protection and rate limiting

### 💬 Real-Time Messaging

* Real-time one-to-one messaging
* Socket.IO powered communication
* Instant message delivery
* Online/offline user presence
* Real-time connection handling
* Automatic message updates

### ✓ Message Status

Messages support WhatsApp-style status indicators:

* ✓ Sent
* ✓✓ Delivered
* 🔵✓✓ Read / Seen

This provides users with real-time feedback about their messages.

### 😊 Message Reactions

Users can react to messages with emojis such as:

* ❤️ Love
* 👍 Like
* 😂 Laugh
* 😮 Surprise
* 😢 Sad
* 🔥 Fire

Reactions are handled through the real-time messaging system.

### 🗑️ Message Deletion

The application supports:

* Delete message for yourself
* Delete message for everyone
* Delete multiple selected messages
* Custom delete confirmation modal
* Mobile-friendly message actions
* Real-time deletion updates

### 📎 File & Media Sharing

Users can share:

* 🖼️ Images
* 📄 PDF documents

Uploaded media is stored using **Cloudinary**.

### 🔊 Sound Notifications

The application includes:

* 🔔 Notification sounds
* 🖱️ UI interaction sounds
* 🔇 Sound enable/disable option
* 🔊 Separate notification and UI sound controls

### 📱 Responsive Design

Chatify is designed for:

* 💻 Desktop
* 💻 Laptop
* 📱 Mobile
* 📲 Tablet

The mobile interface includes optimized chat navigation and message actions.

### 🎨 Modern UI

Built with:

* React
* Tailwind CSS
* DaisyUI
* Lucide Icons

The interface includes a modern dark theme with glassmorphism-style elements, animated borders, responsive layouts and smooth interactions.

### ⚡ State Management

Application state is managed using **Zustand**, including:

* Authentication state
* Selected chat
* Contacts
* Conversations
* Messages
* Online users
* Message status
* Reactions
* Loading states

---

# 🛠️ Tech Stack

## Frontend

* React.js
* Vite
* Tailwind CSS
* DaisyUI
* Zustand
* Axios
* Socket.IO Client
* Lucide React
* React Hot Toast

## Backend

* Node.js
* Express.js
* Socket.IO
* JWT Authentication
* REST API
* Resend
* Arcjet

## Database & Cloud Services

* MongoDB
* MongoDB Atlas
* Cloudinary
* Resend
* Arcjet

## Deployment

* Vercel — Frontend
* Railway / Sevalla — Backend
* MongoDB Atlas — Database
* Cloudinary — Media Storage

---

# 🏗️ Project Architecture

```text
Chatify
│
├── frontend
│   ├── src
│   │   ├── components
│   │   ├── pages
│   │   ├── store
│   │   ├── lib
│   │   └── main.jsx
│   │
│   ├── public
│   └── package.json
│
├── backend
│   ├── src
│   │   ├── controllers
│   │   ├── models
│   │   ├── routes
│   │   ├── middleware
│   │   ├── lib
│   │   └── server.js
│   │
│   └── package.json
│
└── README.md
```

---

# 🔄 How It Works

```text
User
  │
  ▼
React Frontend
  │
  ├── Zustand
  │
  ├── Axios ───────────────► Express REST API
  │                              │
  │                              ▼
  │                           MongoDB
  │
  └── Socket.IO ◄──────────► Node.js Server
                                  │
                                  ▼
                              Real-Time Events
```

---

# 🔌 REST API

The backend provides REST APIs for:

### Authentication

```text
POST   /api/auth/signup
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/check
PUT    /api/auth/update-profile
```

### Messages

```text
GET    /api/messages/contacts
GET    /api/messages/chats
GET    /api/messages/:id
POST   /api/messages/send/:id
```

Additional message functionality handles reactions and message deletion.

---

# ⚡ Real-Time Communication

Chatify uses **Socket.IO** for real-time communication.

Socket functionality includes:

* User connection tracking
* Online/offline presence
* Real-time message delivery
* Message deletion events
* Message reaction updates
* Message read/delivery status
* User-specific socket connections

---

# 🗃️ Database

MongoDB is used as the primary database.

Main data models include:

### User

Stores:

* Full name
* Email
* Password
* Profile picture
* Online status
* User information

### Message

Stores:

* Sender
* Receiver
* Text
* Image
* PDF
* Message status
* Reactions
* Timestamps

---

# ☁️ Cloudinary

Cloudinary is used for cloud-based media storage.

Supported uploads include:

* Profile pictures
* Chat images
* PDF files

This keeps large media files outside the main application server.

---

# 📧 Email Integration

The application uses **Resend** for transactional emails.

Currently used for:

* Welcome email after signup

---

# 🛡️ API Protection

**Arcjet** is integrated into the backend for API protection and rate limiting.

This helps protect the application from excessive or abusive API requests.

---

# 🔑 Environment Variables

Create a `.env` file inside the `backend` folder.

```env
PORT=3000

MONGO_URI=your_mongo_uri_here

NODE_ENV=development

JWT_SECRET=your_jwt_secret

RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=your_email_from_address
EMAIL_FROM_NAME=your_email_from_name

CLIENT_URL=http://localhost:5173

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

ARCJET_KEY=your_arcjet_key
ARCJET_ENV=development
```

For the frontend, configure the API URL according to your environment:

```env
VITE_API_URL=http://localhost:3000/api
```

> ⚠️ Never commit real API keys, JWT secrets, database credentials or Cloudinary credentials to GitHub.

---

# 💻 Run the Project Locally

## 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd chatify
```

---

## 2. Setup Backend

```bash
cd backend
npm install
```

Create your `.env` file and add the required environment variables.

Then start the backend:

```bash
npm run dev
```

Backend will run on:

```text
http://localhost:3000
```

---

## 3. Setup Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend will normally run on:

```text
http://localhost:5173
```

---

# 📱 Responsive Experience

Chatify provides a responsive experience across different screen sizes.

### Desktop

* Sidebar + chat area
* Full chat controls
* Message actions
* Reactions
* Attachments

### Mobile

* Dedicated chat screen
* Responsive sidebar
* Mobile message action sheet
* Touch-friendly controls
* Responsive message bubbles
* Optimized chat header and input area

---

# 🧠 Important Learning Outcomes

This project helped me gain practical experience in:

* Full-stack application development
* React component architecture
* State management with Zustand
* REST API development
* JWT authentication
* Socket.IO and WebSockets
* Real-time event handling
* MongoDB data modeling
* Cloudinary media uploads
* Email API integration
* API security and rate limiting
* Responsive UI development
* Git and GitHub workflow
* Deployment and production debugging
* CORS configuration
* Environment variable management

---

# 🔧 Git & GitHub Workflow

The project follows a practical Git workflow involving:

```text
Feature Branch
      ↓
Development
      ↓
Testing
      ↓
Commit
      ↓
Pull Request
      ↓
Merge
      ↓
Deployment
```

---

# 🚀 Future Improvements

Possible future improvements include:

* 👥 Group chats
* 🔍 Message search
* 🎤 Voice messages
* 📞 Voice calling
* 📹 Video calling
* 🟢 Last seen functionality
* ✍️ Typing indicators
* 📌 Pinned messages
* ⭐ Favorite messages
* 🌙 Theme customization
* 🔔 Push notifications
* 🔒 End-to-end encryption

---

# 📸 Screenshots

Add screenshots of the application here:

```text
screenshots/
├── login.png
├── signup.png
├── chat.png
├── contacts.png
├── mobile-chat.png
└── profile.png
```

Example:

```md
![Login Screen](./screenshots/login.png)

![Chat Screen](./screenshots/chat.png)

![Mobile Chat](./screenshots/mobile-chat.png)
```

---

# 👨‍💻 Developer

**Pradeep Kumar**

MCA Graduate | Full-Stack Developer

Interested in building scalable web applications using modern technologies.

### Tech Interests

* React.js
* JavaScript
* Java
* Node.js
* Express.js
* MongoDB
* REST APIs
* Socket.IO
* Full-Stack Development

---

# ⭐ Show Your Support

If you find this project useful, consider giving it a ⭐ on GitHub.

---

## 📄 License

This project is created for learning, portfolio and educational purposes.

