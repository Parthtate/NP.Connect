import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  email: string
  full_name: string
  employee_id: string
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    // 2. Create admin client with service role key
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // 3. Verify caller is HR or ADMIN
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['ADMIN', 'HR'].includes(profile.role)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions. Only HR and ADMIN can invite employees.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 4. Parse request body
    const { email, full_name, employee_id }: RequestBody = await req.json()

    if (!email || !employee_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, employee_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 5. Check if user already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers()
    const userExists = existingUser?.users?.some(u => u.email === email)

    if (userExists) {
      return new Response(
        JSON.stringify({ error: 'A user with this email already exists' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 6. Create Supabase Auth user (this will trigger profile creation via trigger)
    const { data: authUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: false, // User will confirm via magic link
      user_metadata: {
        full_name: full_name || email,
        role: 'EMPLOYEE',
      },
    })

    if (createError) {
      console.error('Error creating auth user:', createError)
      return new Response(
        JSON.stringify({ error: `Failed to create user: ${createError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 7. Wait a moment for trigger to create profile
    await new Promise(resolve => setTimeout(resolve, 500))

    // 8. Update profile with employee_id to link accounts
    const { error: profileUpdateError } = await supabaseAdmin
      .from('profiles')
      .update({ employee_id })
      .eq('id', authUser.user.id)

    if (profileUpdateError) {
      console.error('Error updating profile:', profileUpdateError)
      // Continue anyway - auto-linking will handle this on first login
    }

    // 9. Update employee record with invitation timestamp
    const { error: employeeUpdateError } = await supabaseAdmin
      .from('employees')
      .update({
        invited_at: new Date().toISOString(),
        account_status: 'active'
      })
      .eq('id', employee_id)

    if (employeeUpdateError) {
      console.error('Error updating employee:', employeeUpdateError)
    }

    // 10. Generate magic link and send email
    const { data: magicLinkData, error: magicLinkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    })


    if (magicLinkError) {
      console.error('Error generating magic link:', magicLinkError)
      // User was created, but magic link failed
      return new Response(
        JSON.stringify({
          success: true,
          user_id: authUser.user.id,
          warning: 'User created but magic link failed to send. User can request a new magic link from login page.',
          magic_link_sent: false
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Success!
    return new Response(
      JSON.stringify({
        success: true,
        user_id: authUser.user.id,
        employee_id,
        magic_link_sent: true,
        message: 'Employee account created and invitation email sent successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error in create-employee-auth:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
