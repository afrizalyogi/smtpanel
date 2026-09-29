# ⚡ SMTPanel

> **Your SMTP. One clean interface. Zero data stored.**

SMTPanel is a privacy-first, lightweight web client that allows you to connect to your own SMTP server and manage email sending from a beautiful, modern dashboard. 

No databases. No telemetry. Your credentials never leave your browser unencrypted.

---

## ✨ Why SMTPanel?

When you just need to send a quick email, test an SMTP server, or manage a lightweight campaign, setting up a full email marketing platform is overkill. SMTPanel gives you a **Cloudflare-inspired, dark-mode-first dashboard** that connects directly to your existing SMTP provider (Gmail, AWS SES, Mailgun, Postmark, etc.).

### 🔒 Privacy-First & Stateless (No Database)
We take your security seriously. **SMTPanel has no database.** 
* Your SMTP credentials are AES-256 encrypted on the server and stored locally on your device as a secure `HttpOnly` cookie.
* Email history and statistics are kept purely in your browser's `localStorage`.
* If you log out or clear your cache, your data is completely gone. 

### 🚀 Key Features
* **Bring Your Own SMTP:** Connect any SMTP server instantly.
* **Beautiful Composer:** Write emails in Plain Text or HTML.
* **Instant Feedback:** Test connections, send emails, and see live success/failure rates.
* **Lightning Fast:** Built with Next.js, React, and TanStack Query for a snappy, app-like experience.

---

## 🛠️ Tech Stack

- **Frontend:** React, Next.js (App Router), Tailwind CSS
- **State Management:** TanStack Query, Zustand (LocalStorage sync)
- **SMTP Engine:** Nodemailer
- **Security:** Node.js native `crypto` (AES-256-GCM)

---

## 📦 Getting Started & Self-Hosting

SMTPanel is incredibly easy to self-host because it requires **no database connection**. All you need is an encryption key.

### Quick Start (Local / Vercel)

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/smtpanel.git
   cd smtpanel
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Copy the example `.env` file:
   ```bash
   cp .env.example .env.local
   ```
   **Important:** Open `.env.local` and set a secure 32-character encryption key.
   ```env
   ENCRYPTION_KEY="your-32-character-ultra-secure-secret"
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser.

### Deploy with Docker (Recommended for Self-Host)

A pre-configured Dockerfile is included.

1. Build the image:
   ```bash
   docker build -t smtpanel .
   ```

2. Run the container:
   ```bash
   docker run -d -p 3000:3000 -e ENCRYPTION_KEY="your-32-character-ultra-secure-secret" smtpanel
   ```

### Deploy to Serverless (Vercel/Cloudflare)
Simply connect your repository to Vercel or Cloudflare Pages and set the `ENCRYPTION_KEY` environment variable. No other configuration is needed!

---

## 🛡️ Security Note
This application acts as a proxy. The server encrypts your credentials using the `ENCRYPTION_KEY` before sending them back to your browser as an HTTP-Only cookie. **Never share or expose your `ENCRYPTION_KEY`**, as changing it will invalidate all currently logged-in sessions.