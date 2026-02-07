# Automated Employee Invite System - Quick Reference

## How It Works

When HR/Admin creates a new employee:

1. ✅ **Employee Record Created** in `employees` table
2. ✅ **Edge Function Called** (`create-employee-auth`)
3. ✅ **Auth User Created** in Supabase Auth
4. ✅ **Profile Linked** to employee record
5. ✅ **Magic Link Sent** to employee email
6. ✅ **Employee Clicks Link** → Logged in → Auto-linked

## Deployment Required

**Before this works, you must deploy the Edge Function:**

```bash
# 1. Install Supabase CLI
npm install -g supabase

# 2. Login
supabase login

# 3. Link project
supabase link --project-ref YOUR_PROJECT_REF

# 4. Set secrets
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 5. Deploy function
supabase functions deploy create-employee-auth
```

**See `EDGE_FUNCTION_DEPLOYMENT.md` for detailed instructions.**

## Files Changed

### Backend
- ✅ `supabase/functions/create-employee-auth/index.ts` - Edge Function (NEW)

### Frontend
- ✅ `lib/supabaseClient.ts` - Exported `supabaseUrl`
- ✅ `App.tsx` - Updated `addEmployee()` to call Edge Function

### Documentation
- ✅ `supabase/EDGE_FUNCTION_DEPLOYMENT.md` - Deployment guide

## Database Changes

❌ **No database changes needed!**

Your schema already has:
- `employees.invited_at`
- `employees.account_status`
- `profiles.employee_id`

## Testing Checklist

After deploying the Edge Function:

- [ ] Login as HR
- [ ] Create test employee
- [ ] Check console: "✅ Employee created and invitation sent"
- [ ] Check test email inbox for magic link
- [ ] Click magic link
- [ ] Employee logs in successfully
- [ ] Employee dashboard shows correct data
- [ ] No "account not linked" error

## Troubleshooting

### "Employee created but invitation failed"

**Cause:** Edge Function not deployed or misconfigured

**Fix:** Follow deployment guide in `EDGE_FUNCTION_DEPLOYMENT.md`

### "Magic link not received"

**Causes:**
1. Email in spam folder
2. Supabase email rate limit
3. Invalid email address

**Fix:** Employee can request magic link from login page

### "User already exists"

**Cause:** Email already registered

**Fix:** Delete user from Supabase Auth → Users, then retry

## Console Messages

**Success:**
```
✅ Employee created and invitation sent: Employee account created and invitation email sent successfully
```

**Warning:**
```
⚠️ Employee created but invitation failed: <error message>
Employee can still login using magic link from the login page.
```

## Next Steps

1. **Deploy Edge Function** (see deployment guide)
2. **Test with real employee**
3. **Customize email template** (optional)
4. **Monitor function logs**

## Support

- Deployment issues → See `EDGE_FUNCTION_DEPLOYMENT.md`
- Function logs → `supabase functions logs create-employee-auth`
- Database issues → Check Supabase Dashboard → Table Editor
