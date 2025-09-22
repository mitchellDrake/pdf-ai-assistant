# PDF AI Assistant

Overview:
A web app that allows users to upload PDFs and interact with them via AI-powered chat. The app extracts text from PDFs, generates embeddings, and uses vector search to provide context-aware answers. Page locations of relevant content are highlighted in the PDF viewer.

## How it Works:

- User signs up and logs in.

- PDFs are uploaded to the backend, saved to Supabase, and embeddings are generated.

- Chat queries are sent to the backend; vector search retrieves relevant context, which is sent to the AI chat as prompt context.

- Fuse.js is used for precise text matching to highlight exact locations in PDFs.

## Features:

- Multi-PDF upload and selection

- Per-PDF chat persistence

- Chat and file deletion

- Speech recognition support (with browser fallback alerts)

## Challenges Solved:

- PDF highlight registration (solved using Fuse.js for efficient text matching)

- Backend AI integration with vector search

- Multi-PDF management with chat context persistence

## demo link: https://pdf-ai-assistant-ten.vercel.app/

---

## 📦 Installation

Clone the repo and install dependencies:

git clone <your-repo-url>
cd <your-repo-url>
npm install

---

## ⚙️ Environment Setup

copy .example.env to .env and update values:

cp .example.env .env

---

## ▶️ Running the Server

# Development

npm run dev

# Production

npm start

## 🛠 Tech Stack

Next.js
dotenv for environment variables
Prettier for formatting
Prisma for database management
Vercel AI SDK for OpenAI integration
Tailwind for CSS
