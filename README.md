# OmniFlow AI 🚀
OmniFlow AI is an AI-powered multi-channel customer communication and automation platform built during the **Compete & Win: SummerShip Challenge 2026** organized by **GradSkills × CodeQuesters**.
The project focuses on solving one of the most common real-world business problems — handling customer conversations across multiple platforms efficiently.
Businesses today receive messages from WhatsApp, Instagram, Facebook, websites, and voice calls simultaneously. Managing all these conversations manually often leads to:

* Delayed responses
* Missed customer leads
* Poor customer engagement
* Reduced conversion rates

OmniFlow AI centralizes all communication into a single intelligent dashboard powered by AI-driven workflows and automation.

---

# 🌍 Live Demo

https://omniflow-ai-indol.vercel.app

---

# 📌 Problem Statement

Modern businesses communicate with customers through multiple channels such as:

* WhatsApp
* Instagram
* Facebook
* Web Chat
* Voice Calls

Managing all these platforms separately becomes inefficient and difficult at scale.

Key challenges include:

* Slow response times
* Missed sales opportunities
* Poor customer experience
* Difficulty tracking conversations
* Lack of centralized analytics
* Manual support overhead

OmniFlow AI solves this by creating a unified AI-powered communication workspace where all customer interactions can be monitored, automated, and analyzed in real time.

---

# ✨ Key Features Implemented

## 🔹 Unified Multi-Channel Inbox

A centralized inbox where conversations from multiple platforms are displayed in a single interface.

Supported channels include:

* WhatsApp
* Instagram
* Facebook
* Web Chat

---

## 🔹 AI Smart Replies & Budget Tracking

The platform generates intelligent AI-based responses that help businesses reply faster and reduce manual workload, powered by **Gemini AI**.

Features:

* Suggested replies
* Instant AI response simulation
* Faster communication workflow
* **CascadeFlow Integration**: Real-time tracking of AI API costs, latency, and budget limits with rich toast notifications.

---

## 🔹 AI Voice Assistant Simulation

Integrated voice AI interface that demonstrates future-ready voice automation workflows.

Features:

* Voice assistant trigger
* AI call simulation
* Voice automation concept UI

---

## 🔹 Analytics Dashboard

Interactive analytics dashboard displaying:

* Total conversations
* AI replies sent
* Lead conversion metrics
* Channel performance
* Message activity trends

Built using modern chart visualizations.

---

## 🔹 Lead Management System

Businesses can track:

* Active leads
* Customer engagement
* Lead priorities
* Automated follow-up workflows

---

## 🔹 Smart Notifications

Real-time style notifications simulate:

* Incoming leads
* AI alerts
* Customer activity updates

---

## 🔹 Automation Workflow UI

Automation dashboard for showcasing:

* Rule-based workflows
* AI automation concepts
* Multi-channel process handling

---

## 🔹 Modern Responsive UI

Designed with a premium SaaS-inspired UI/UX approach:

* Glassmorphism design
* Responsive layout
* Smooth animations
* Gradient styling
* Interactive components

---

## 🔹 Real-Time Chat Experience

Interactive chat interface powered by WebSockets includes:

* AI-generated responses
* Chat bubbles
* Suggested quick replies
* User/AI conversation flow
* Typing simulation

---

# 🛠 Tech Stack Used

## Frontend

* React
* TypeScript
* Vite
* Tailwind CSS

## UI & Animation

* Framer Motion
* Lucide React Icons
* Glassmorphism UI
* Recharts

## Backend & Integrations

* Express.js & Node.js
* Socket.io (Real-time WebSockets)
* Google Gemini AI API
* Twilio API
* CascadeFlow (Budget Tracking)
* Firebase Admin SDK & Supabase

## Deployment

* Vercel

---

# 🧠 Technical Approach

The application follows a component-based architecture using React and TypeScript for maintainability and scalability.

Key implementation approaches:

* Modular routing structure
* Reusable UI components
* State-based chat management
* Dynamic AI reply simulation
* Responsive dashboard layouts
* Real-time interaction simulation
* Express backend acting as an API gateway for AI services
* **Native Conversation Memory**: Leveraged the AI model's native context window to recall past conversations directly, bypassing the need for external memory tools like Hindsight AI.

The project was designed with product-thinking and scalability in mind.

---

# ⚙️ Setup Instructions

## 1️⃣ Frontend Setup

```bash
npm install
# Set up your .env file
npm run dev
```
The frontend will start at `http://localhost:5173`.

---

## 2️⃣ Backend Setup

Open a new terminal window and navigate to the server directory:
```bash
cd server
npm install
# Configure your server/.env file with necessary API keys (Gemini, Twilio, etc.)
npm run dev

```
The backend will start at `http://localhost:3001`.

---

# 🚀 Deployment

The project is successfully deployed using **Vercel**.

Deployment URL:
https://omniflow-ai-indol.vercel.app

---

# 📚 Learnings & Experience

This project provided hands-on experience in:

* AI-focused product building
* Frontend architecture & Backend API design
* Real-time WebSockets implementation
* AI API budget and cost monitoring
* UI/UX design
* Deployment workflows
* Debugging TypeScript issues
* Managing real-world project structure
* Rapid development under time constraints

---

# 🔮 Future Improvements

Planned future enhancements:

* Real-time database sync
* AI-powered CRM workflows
* Multi-user authentication
* Voice-to-text AI support
* Advanced automation engine
