# Smart Bookmarks App

A real-time bookmark manager built with Next.js, Supabase, and Google OAuth.

## 🔗 Live Demo

Live URL: https://smart-bookmark-app-hazel-beta.vercel.app


## ✨ Features

- ✅ Google OAuth authentication (no email/password required)
- ✅ Add bookmarks with URL and title
- ✅ Real-time updates across multiple tabs
- ✅ Private bookmarks (user-specific data isolation)
- ✅ Delete bookmarks
- ✅ Responsive design with Tailwind CSS

## 🛠️ Tech Stack

- Frontend: Next.js 16 (App Router)
- Backend: Supabase (Auth, Database, Realtime)
- Styling: Tailwind CSS
- Deployment: Vercel

## 📋 Problems Encountered and Solutions

### Problem 1: Google OAuth Redirect Loop / 404 Error

Issue: After signing in with Google, the app showed a 404 error. The callback route was not found.

Solution: 
- The `/auth/callback/route.ts` file was completely missing from the project.
- Created the proper route handler at `app/auth/callback/route.ts` to exchange the authorization code for a session.
- Added middleware.ts to refresh the session on every request.
- Verified the redirect URI in Google Cloud Console matched the Supabase callback URL.

Code added:
```typescript
// app/auth/callback/route.ts
export async function GET(request: NextRequest) {
  const code = requestUrl.searchParams.get('code')
  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }
  return NextResponse.redirect(`${origin}/`)
}
```

### Problem 2: Realtime Updates Not Working

Issue: Adding a bookmark in one browser tab didn't show up in another tab without manually refreshing.

Solution:
- Enabled Supabase Realtime on the `bookmarks` table using SQL command:
```sql
  ALTER PUBLICATION supabase_realtime ADD TABLE bookmarks;
```
- Created a subscription channel in the React component that filters by `user_id`.
- Implemented proper cleanup in `useEffect` to prevent memory leaks.

Key learning: Realtime must be explicitly enabled at the database level, not just in the code.

### Problem 3: Environment Variables Not Loading

**Issue**: Received error: "Your project's URL and API key are required to create a Supabase client!"

**Solution**:
- Created `.env.local` file in the project root (not in subdirectories).
- Used proper variable names with `NEXT_PUBLIC_` prefix for client-side access.
- Ensured no spaces around the `=` sign and no quotes around values.
- **Critical step**: Restarted the development server after adding environment variables (environment variables only load at server startup).

**Correct format:**
```env
NEXT_PUBLIC_SUPABASE_URL= https://mzvzuuqekaekjzhdfgyp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY= eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16dnp1dXFla2Fla2p6aGRmZ3lwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNDE5ODAsImV4cCI6MjA4NjgxNzk4MH0.kY7gESZI-lnybCSWraOHjxrOJa6gHQmddyuyW7MyLKQ

```

### Problem 4: File Structure Confusion - Missing lib/supabase Files

**Issue**: Got error "Module not found: Can't resolve '@/lib/supabase/client'"

**Solution**:
- The `lib/supabase/` folder and files were completely missing.
- Created proper folder structure: `lib/supabase/client.ts` and `lib/supabase/server.ts`.
- Added proper Supabase client initialization with `@supabase/ssr` package.

**Key learning**: Next.js App Router requires careful organization - client code uses `createBrowserClient`, server code uses `createServerClient`.

### Problem 5: Row Level Security (RLS) Not Working Initially

**Issue**: Needed to ensure users could only see their own bookmarks, not other users' data.

**Solution**:
- Enabled Row Level Security on the `bookmarks` table.
- Created three policies using SQL:
```sql
  -- View own bookmarks
  CREATE POLICY "Users can view their own bookmarks"
    ON bookmarks FOR SELECT
    USING (auth.uid() = user_id);
  
  -- Insert own bookmarks
  CREATE POLICY "Users can insert their own bookmarks"
    ON bookmarks FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  
  -- Delete own bookmarks
  CREATE POLICY "Users can delete their own bookmarks"
    ON bookmarks FOR DELETE
    USING (auth.uid() = user_id);
```

**Key learning**: RLS provides database-level security, ensuring data privacy even if client code has bugs.

### Problem 6: PowerShell Execution Policy Error on Windows

**Issue**: Couldn't run `npm run dev` due to: "running scripts is disabled on this system"

**Solution**:
- Switched from PowerShell to Command Prompt in VS Code terminal.
- Alternative: Set execution policy in PowerShell as administrator:
```powershell
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Key learning**: Windows security policies can block npm scripts in PowerShell. Command Prompt is a simpler alternative.

### Problem 7: Port Already in Use / Lock File Error

**Issue**: Error message "Port 3000 is in use" or "Unable to acquire lock"

**Solution**:
- Killed all `node.exe` processes using Task Manager or command:
```bash
  taskkill /F /IM node.exe
```
- Deleted the `.next` folder to clear build cache.
- Restarted the development server.

**Key learning**: Always fully stop the dev server before starting a new one.

## 🚀 Setup Instructions

### Prerequisites

- Node.js 18+
- Git
- Supabase account
- Google Cloud Console account
- Vercel account
- VS Code (recommended)

### Local Development Setup

1. Clone the repository:
```bash
   git clone https://github.com/Akshaya2303/smart-bookmarks.git
   cd smart-bookmarks
```

2. Install dependencies:
```bash
   npm install
```

3. Create `.env.local` file in the root directory


4. Set up Supabase database:
   - Create a Supabase project
   - Run the SQL commands to create the `bookmarks` table (see below)
   - Enable Google OAuth provider

5. Set up Google OAuth:
   - Create OAuth credentials in Google Cloud Console
   - Add redirect URI: `https://your-project.supabase.co/auth/v1/callback`

6. Run the development server:
```bash
   npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000)

### Database Schema
```sql
-- Create bookmarks table
CREATE TABLE bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own bookmarks"
  ON bookmarks FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bookmarks"
  ON bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks"
  ON bookmarks FOR DELETE USING (auth.uid() = user_id);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE bookmarks;
```

## 📦 Deployment

Deployed on Vercel with automatic deployments from the main branch.

### Steps:

1. Push code to GitHub
2. Import project to Vercel
3. Add environment variables in Vercel project settings
4. Deploy
5. Update Google OAuth redirect URIs to include: `https://your-app.vercel.app/auth/callback`

## 🧪 Testing

### Local Testing:
1. Sign in with Google OAuth
2. Add multiple bookmarks
3. Open two browser tabs to http://localhost:3000
4. Add a bookmark in one tab - it appears instantly in the other (real-time!)
5. Delete bookmarks - disappears from all tabs
6. Sign out and sign in with different Google account - sees different bookmarks

### Production Testing:
- Same tests on live Vercel URL
- Verify Google OAuth works in production
- Test on different devices/browsers

## 🎓 Key Learnings

1. **Next.js App Router** requires different patterns than Pages Router
2. **Supabase Realtime** must be explicitly enabled at database level
3. **Environment variables** need server restart to take effect
4. **Row Level Security** provides critical database-level security
5. **OAuth callbacks** require proper route handlers in Next.js
6. **Middleware** is essential for maintaining auth sessions across pages



**Akshaya Nayakidi**
- GitHub: [@Akshaya2303](https://github.com/Akshaya2303)
- Email: akshayanayakidi@gmail.com