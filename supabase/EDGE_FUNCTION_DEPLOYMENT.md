# Edge Function Deployment Guide

## Deploying the Employee Auto-Invite System

### Prerequisites

1. **Supabase CLI** installed:
   ```bash
   npm install -g supabase
   ```

2. **Supabase Project** ready with:
   - Project Reference ID
   - Service Role Key

### Step 1: Install Supabase CLI (if not done)

```bash
npm install -g supabase
```

### Step 2: Login to Supabase

```bash
supabase login
```

This will open a browser window for authentication.

### Step 3: Link Your Project

```bash
cd d:/nppmt/nppmt_hrms
supabase link --project-ref YOUR_PROJECT_REF
```

**Find your Project Reference:**
1. Go to Supabase Dashboard
2. Click on your project
3. Go to Settings → General
4. Copy "Reference ID"

### Step 4: Set Environment Secrets

The Edge Function needs the `SUPABASE_SERVICE_ROLE_KEY`:

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Find your Service Role Key:**
1. Supabase Dashboard → Settings → API
2. Copy "service_role" key (starts with `eyJ...`)

### Step 5: Deploy the Edge Function

```bash
supabase functions deploy create-employee-auth
```

You should see output like:
```
Deploying Function create-employee-auth (project ref: xxxxx)
✓ Function created successfully
Function URL: https://xxxxx.supabase.co/functions/v1/create-employee-auth
```

### Step 6: Verify Deployment

Test the function is deployed:

```bash
supabase functions list
```

You should see `create-employee-auth` in the list.

### Step 7: Configure Supabase Email Templates (Optional)

Customize the magic link email:

1. Go to **Supabase Dashboard** → **Authentication** → **Email Templates**
2. Select **Magic Link** template
3. Update the template:

**Subject:**
```
Welcome to {{ .SiteURL }} HRMS
```

**Body:**
```html
<h2>Welcome to NP.Connect HRMS!</h2>
<p>Click the link below to access your account:</p>
<p><a href="{{ .ConfirmationURL }}">Access Your Account</a></p>
<p>This link expires in 1 hour.</p>
```

### Alternative: Use Supabase Default Template

The system will work fine with Supabase's default magic link template if you don't want to customize.

## Testing the Deployment

### Test 1: Check Function is Live

```bash
# Test with curl (will fail auth, but confirms function is running)
curl https://YOUR_PROJECT_REF.supabase.co/functions/v1/create-employee-auth
```

Expected response: `{"error":"Missing authorization header"}`

### Test 2: Create Employee via App

1. Login as HR/Admin
2. Go to Employees → Add Employee
3. Fill in employee details with a **test email you can access**
4. Click Save
5. Check browser console - should see: `✅ Employee created and invitation sent`
6. Check email inbox for magic link

### Test 3: Employee Login

1. Open email with magic link
2. Click the link
3. Should be redirected to app and logged in
4. Check Dashboard - employee should see their data
5. No "account not linked" error

## Troubleshooting

### Error: "Failed to create user: User already registered"

**Cause:** Employee email already exists in Supabase Auth

**Fix:**
1. Go to Supabase Dashboard → Authentication → Users
2. Delete the existing user with that email
3. Try creating employee again

### Error: "Missing authorization header"

**Cause:** Frontend not sending auth token

**Fix:** Ensure `supabase.auth.getSession()` returns valid session

### Error: "Insufficient permissions"

**Cause:** User creating employee is not HR/ADMIN

**Fix:** Update user's role in profiles table:
```sql
UPDATE profiles SET role = 'HR' WHERE email = 'user@example.com';
```

### Error: Edge Function not deploying

**Cause:** Project not linked or CLI not authenticated

**Fix:**
```bash
supabase logout
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

### Magic Link Not Received

**Possible causes:**
1. **Email in spam folder** - Check spam/junk
2. **Supabase email rate limit** - Wait a few minutes
3. **Invalid email address** - Check for typos

**Workaround:**
Employee can request magic link from login page:
1. Go to app login
2. Enter email
3. Click "Send Magic Link"
4. Check email

## Monitoring

### View Function Logs

```bash
supabase functions logs create-employee-auth
```

Or in Dashboard:
1. Edge Functions → create-employee-auth
2. Click "Logs" tab
3. See real-time execution logs

### Check Invocations

1. Supabase Dashboard → Edge Functions
2. Click on `create-employee-auth`
3. See invocation count and errors

## Alternative Deployment Methods

### Method 1: VS Code Extension

1. Install "Supabase" extension
2. Right-click `supabase/functions/create-employee-auth`
3. Click "Deploy Function"

### Method 2: GitHub Actions

Add to `.github/workflows/deploy.yml`:
```yaml
- name: Deploy Edge Functions
  run: |
    supabase login
    supabase link --project-ref ${{ secrets.SUPABASE_REF }}
    supabase functions deploy create-employee-auth
```

## Cost Considerations

**Edge Function Pricing:**
- Free tier: 500,000 invocations/month
- Each employee creation = 1 invocation
- For most companies, this is free

**Email Pricing:**
- Supabase Auth emails: Free
- Rate limit: 3 emails/hour per email address (anti-spam)

## Security Notes

1. **Service Role Key** is sensitive - keep it secret
2. Edge Function validates user role before creating accounts
3. RLS policies prevent unauthorized access
4. Magic links expire in 1 hour by default

## Summary

✅ **Deployed:** `create-employee-auth` Edge Function  
✅ **Configured:** Email templates (optional)  
✅ **Tested:** Employee creation flow  
✅ **Monitored:** Function logs and invocations  

Your automated employee invite system is now live!
