# NP.Connect - HR Management System

A full-stack HR tool built with **React**, **TypeScript**, **TailwindCSS**, and **Supabase** (PostgreSQL + Auth).

## 🚀 Tech Stack

- **Frontend:** React 19, TypeScript, TailwindCSS
- **Backend:** Supabase (Database, Auth)
- **Tooling:** Vite, esm.sh

---

## 🛠 Prerequisites

1.  **Node.js** (v18+) and npm/yarn/pnpm.
2.  A **Supabase** account.

---

## ⚡ Supabase Setup

This is critical for the app to function.

1.  **Create Project:** Go to [Supabase](https://supabase.com/) and create a new project.
2.  **SQL Setup:**
    *   Go to the **SQL Editor** in your Supabase dashboard.
    *   Copy the content of `supabase/schema-invite-system.sql` from this repository.
    *   Paste it into the editor and run it. This creates all necessary tables (`employees`, `attendance`, `payroll`, `profiles`, etc.) and Row Level Security policies.
3.  **Auth Configuration:**
    *   Go to **Authentication** > **Providers**.
    *   Ensure **Email/Password** is enabled.
    *   (Optional) Disable "Confirm email" in Auth settings for easier testing.

---

## 🔑 Environment Variables

Create a `.env` file in the root directory (copy from `.env.example`):

```bash
cp .env.example .env
```

Then edit `.env` and add your Supabase credentials:

```env
# Get these from Supabase Dashboard > Project Settings > API
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**⚠️ IMPORTANT:** Never commit the `.env` file to version control. It's already in `.gitignore`.

---

## 🏃 Running Locally

1.  **Install dependencies:**
    ```bash
    npm install
    ```
2.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The app will be available at `http://localhost:3000`

3.  **Build for production:**
    ```bash
    npm run build
    ```

---

## 🐛 Troubleshooting

*   **Login Fails?** Ensure you have created a user in Supabase Authentication. The SQL trigger will automatically create a Profile for them.
*   **Permissions Error?** Check the RLS policies in `supabase/schema-invite-system.sql`.
*   **White Screen?** Check the console. Ensure `.env` variables are correct and match your Supabase project.
*   **Environment Variables Not Loading?** Make sure the `.env` file is in the root directory and variables start with `VITE_`.

---

## 📦 Production Deployment

For production deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).
