# Resend Email Provider Setup for AdHub

## Step 1: Create Resend Account

1. Go to [resend.com](https://resend.com)
2. Sign up with your email
3. Verify your account

## Step 2: Domain Verification

1. **Add your domain** in Resend dashboard
2. **Verify DNS records** (SPF, DKIM, DMARC)
3. **Test domain** before proceeding

## Step 3: Environment Setup (Staging vs Production)

### Why Separate Environments?

✅ **Prevent accidental emails**: Staging tests won't send emails to real users  
✅ **Separate analytics**: Clean production metrics without test data  
✅ **Different domains**: Use subdomains for staging  
✅ **Rate limiting**: Separate quotas for each environment  
✅ **Security**: Different API keys reduce risk  

### Recommended Setup:

#### **Production Environment**
- **Domain**: `adhub.com`
- **Sender email**: `noreply@adhub.com`
- **API Key**: Separate production key
- **Supabase Project**: Production project

#### **Staging Environment**
- **Domain**: `staging.adhub.com` (or use production domain)
- **Sender email**: `noreply@staging.adhub.com` (or `staging@adhub.com`)
- **API Key**: Separate staging key
- **Supabase Project**: Staging project

### Option 1: Separate Resend Accounts (Recommended)

**Benefits**: Complete isolation, separate billing, cleaner analytics

1. **Create two Resend accounts**:
   - `production@adhub.com` → Production Resend account
   - `staging@adhub.com` → Staging Resend account

2. **Verify domains in both accounts**:
   - Production: `adhub.com`
   - Staging: `staging.adhub.com` (or reuse `adhub.com`)

3. **Generate separate API keys**:
   - Production: `re_prod_xxxxx`
   - Staging: `re_staging_xxxxx`

### Option 2: Single Resend Account with Different API Keys (Recommended for AdHub)

**Benefits**: Simpler management, single billing, no need for paid team features

1. **Create one Resend account**
2. **Generate multiple API keys**:
   - Name them clearly: "Production API Key", "Staging API Key"
   - Use different permissions if needed

3. **Use different sender emails**:
   - Production: `noreply@adhub.com`
   - Staging: `staging@adhub.com`

### Recommended Approach: Option 2 (Single Account)

For AdHub, **single Resend account** is perfect because:
- Multiple teams is a paid feature on Resend
- You can still separate environments with different API keys
- Simpler management and single billing
- Free tier gives you 3,000 emails/month total

## Step 4: Environment Variables Configuration

### Production Environment Variables

```bash
# Production .env.local
RESEND_API_KEY=re_prod_your_production_key_here
RESEND_FROM_EMAIL=noreply@adhub.com
RESEND_FROM_NAME=AdHub

# Supabase Production
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key
```

### Staging Environment Variables

```bash
# Staging .env.local
RESEND_API_KEY=re_staging_your_staging_key_here
RESEND_FROM_EMAIL=noreply@staging.adhub.com
RESEND_FROM_NAME=AdHub Staging

# Supabase Staging
NEXT_PUBLIC_SUPABASE_URL=https://your-staging-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-staging-anon-key
```

## Step 5: Supabase SMTP Configuration

Configure SMTP settings in **both** Supabase projects:

### Production Supabase SMTP
```
SMTP Host: smtp.resend.com
SMTP Port: 587
SMTP User: resend
SMTP Password: re_prod_your_production_key_here
Sender email: noreply@adhub.com
Sender name: AdHub
```

### Staging Supabase SMTP
```
SMTP Host: smtp.resend.com
SMTP Port: 587
SMTP User: resend
SMTP Password: re_staging_your_staging_key_here
Sender email: noreply@staging.adhub.com
Sender name: AdHub Staging
```

## Step 6: Configure Supabase Auth Email Templates

Instead of creating custom templates in Resend, we'll use Supabase Auth's built-in email templates with Resend as the SMTP provider.

### 1. Configure SMTP in Supabase Dashboard

1. Go to your **Supabase Dashboard** → **Settings** → **Auth**
2. Scroll down to **SMTP Settings**
3. Enable **Enable custom SMTP**
4. Configure:
   ```
   SMTP Host: smtp.resend.com
   SMTP Port: 587
   SMTP User: resend
   SMTP Password: re_your_api_key_here
   Sender email: noreply@adhub.com
   Sender name: AdHub
   ```

### 2. Customize Email Templates in Supabase

1. Go to **Supabase Dashboard** → **Authentication** → **Email Templates**
2. You'll see templates for:
   - **Confirm signup** (email verification)
   - **Invite user** (team invitations)
   - **Magic link** (passwordless login)
   - **Change email address** (email change confirmation)
   - **Reset password** (password reset)

### 3. Customize the Email Verification Template

Click on **Confirm signup** and replace the default template with:

```html
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 40px;">
    <h1 style="margin: 0; font-size: 24px; color: #1a1a1a;">
      <span style="color: #1a1a1a;">Ad</span><span style="background: linear-gradient(135deg, #b4a0ff 0%, #ffb4a0 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Hub</span>
    </h1>
  </div>

  <h2 style="color: #1a1a1a; font-size: 20px; margin-bottom: 16px;">Welcome to AdHub!</h2>

  <p style="color: #4a4a4a; line-height: 1.6; margin-bottom: 24px;">
    Thanks for signing up for AdHub. Please verify your email address by clicking the button below:
  </p>

  <div style="text-align: center; margin: 32px 0;">
    <a href="{{ .ConfirmationURL }}" 
       style="background: linear-gradient(135deg, #b4a0ff 0%, #ffb4a0 100%); 
              color: #1a1a1a; 
              padding: 16px 32px; 
              text-decoration: none; 
              border-radius: 8px; 
              display: inline-block;
              font-weight: 600;
              font-size: 16px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      Verify Email Address
    </a>
  </div>

  <p style="color: #666; font-size: 14px; margin-bottom: 8px;">
    If the button doesn't work, copy and paste this link into your browser:
  </p>
  <p style="word-break: break-all; color: #666; font-size: 14px; background: #f8f9fa; padding: 12px; border-radius: 4px; margin-bottom: 24px;">
    {{ .ConfirmationURL }}
  </p>

  <p style="color: #666; font-size: 14px; margin-bottom: 32px;">
    This link will expire in 24 hours.
  </p>

  <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e5e5;">

  <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
    If you didn't sign up for AdHub, you can safely ignore this email.
  </p>
</div>
```

### 4. Customize the Password Reset Template

Click on **Reset password** and replace with:

```html
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 40px;">
    <h1 style="margin: 0; font-size: 24px; color: #1a1a1a;">
      <span style="color: #1a1a1a;">Ad</span><span style="background: linear-gradient(135deg, #b4a0ff 0%, #ffb4a0 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Hub</span>
    </h1>
  </div>

  <h2 style="color: #1a1a1a; font-size: 20px; margin-bottom: 16px;">Reset Your AdHub Password</h2>

  <p style="color: #4a4a4a; line-height: 1.6; margin-bottom: 24px;">
    We received a request to reset your password for your AdHub account.
  </p>

  <div style="text-align: center; margin: 32px 0;">
    <a href="{{ .ConfirmationURL }}" 
       style="background: linear-gradient(135deg, #b4a0ff 0%, #ffb4a0 100%); 
              color: #1a1a1a; 
              padding: 16px 32px; 
              text-decoration: none; 
              border-radius: 8px; 
              display: inline-block;
              font-weight: 600;
              font-size: 16px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      Reset Password
    </a>
  </div>

  <p style="color: #666; font-size: 14px; margin-bottom: 8px;">
    If the button doesn't work, copy and paste this link into your browser:
  </p>
  <p style="word-break: break-all; color: #666; font-size: 14px; background: #f8f9fa; padding: 12px; border-radius: 4px; margin-bottom: 24px;">
    {{ .ConfirmationURL }}
  </p>

  <p style="color: #666; font-size: 14px; margin-bottom: 32px;">
    This link will expire in 1 hour.
  </p>

  <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e5e5;">

  <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
    If you didn't request a password reset, you can safely ignore this email.
  </p>
</div>
```

### 5. Customize the Magic Link Template

Click on **Magic link** and replace with:

```html
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 40px;">
    <h1 style="margin: 0; font-size: 24px; color: #1a1a1a;">
      <span style="color: #1a1a1a;">Ad</span><span style="background: linear-gradient(135deg, #b4a0ff 0%, #ffb4a0 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Hub</span>
    </h1>
  </div>

  <h2 style="color: #1a1a1a; font-size: 20px; margin-bottom: 16px;">Your AdHub Magic Link</h2>

  <p style="color: #4a4a4a; line-height: 1.6; margin-bottom: 24px;">
    Click the button below to sign in to your AdHub account. No password required!
  </p>

  <div style="text-align: center; margin: 32px 0;">
    <a href="{{ .ConfirmationURL }}" 
       style="background: linear-gradient(135deg, #b4a0ff 0%, #ffb4a0 100%); 
              color: #1a1a1a; 
              padding: 16px 32px; 
              text-decoration: none; 
              border-radius: 8px; 
              display: inline-block;
              font-weight: 600;
              font-size: 16px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      Sign In to AdHub
    </a>
  </div>

  <p style="color: #666; font-size: 14px; margin-bottom: 8px;">
    If the button doesn't work, copy and paste this link into your browser:
  </p>
  <p style="word-break: break-all; color: #666; font-size: 14px; background: #f8f9fa; padding: 12px; border-radius: 4px; margin-bottom: 24px;">
    {{ .ConfirmationURL }}
  </p>

  <p style="color: #666; font-size: 14px; margin-bottom: 32px;">
    This link will expire in 1 hour.
  </p>

  <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e5e5;">

  <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
    If you didn't request this sign-in link, you can safely ignore this email.
  </p>
</div>
```

### 6. Customize the Invite User Template

Click on **Invite user** and replace with:

```html
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 40px;">
    <h1 style="margin: 0; font-size: 24px; color: #1a1a1a;">
      <span style="color: #1a1a1a;">Ad</span><span style="background: linear-gradient(135deg, #b4a0ff 0%, #ffb4a0 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Hub</span>
    </h1>
  </div>

  <h2 style="color: #1a1a1a; font-size: 20px; margin-bottom: 16px;">You're Invited to Join AdHub!</h2>

  <p style="color: #4a4a4a; line-height: 1.6; margin-bottom: 16px;">
    {{ .InvitedByEmail }} has invited you to join their AdHub organization: <strong>{{ .OrganizationName }}</strong>
  </p>

  <p style="color: #4a4a4a; line-height: 1.6; margin-bottom: 24px;">
    AdHub is a powerful platform for managing Facebook ad accounts and business managers. Join your team to start collaborating on ad campaigns and account management.
  </p>

  <div style="text-align: center; margin: 32px 0;">
    <a href="{{ .ConfirmationURL }}" 
       style="background: linear-gradient(135deg, #b4a0ff 0%, #ffb4a0 100%); 
              color: #1a1a1a; 
              padding: 16px 32px; 
              text-decoration: none; 
              border-radius: 8px; 
              display: inline-block;
              font-weight: 600;
              font-size: 16px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      Accept Invitation
    </a>
  </div>

  <p style="color: #666; font-size: 14px; margin-bottom: 8px;">
    If the button doesn't work, copy and paste this link into your browser:
  </p>
  <p style="word-break: break-all; color: #666; font-size: 14px; background: #f8f9fa; padding: 12px; border-radius: 4px; margin-bottom: 24px;">
    {{ .ConfirmationURL }}
  </p>

  <p style="color: #666; font-size: 14px; margin-bottom: 32px;">
    This invitation will expire in 24 hours.
  </p>

  <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e5e5;">

  <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
    If you don't want to join this organization, you can safely ignore this email.
  </p>
</div>
```

### 7. Customize the Change Email Address Template

Click on **Change email address** and replace with:

```html
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 40px;">
    <h1 style="margin: 0; font-size: 24px; color: #1a1a1a;">
      <span style="color: #1a1a1a;">Ad</span><span style="background: linear-gradient(135deg, #b4a0ff 0%, #ffb4a0 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Hub</span>
    </h1>
  </div>

  <h2 style="color: #1a1a1a; font-size: 20px; margin-bottom: 16px;">Confirm Your New Email Address</h2>

  <p style="color: #4a4a4a; line-height: 1.6; margin-bottom: 24px;">
    We received a request to change your AdHub account email address to this email.
  </p>

  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #b4a0ff;">
    <p style="margin: 0; color: #4a4a4a; font-size: 14px;">
      <strong>Current email:</strong> {{ .OldEmail }}<br>
      <strong>New email:</strong> {{ .NewEmail }}
    </p>
  </div>

  <p style="color: #4a4a4a; line-height: 1.6; margin-bottom: 24px;">
    To confirm this change, click the button below:
  </p>

  <div style="text-align: center; margin: 32px 0;">
    <a href="{{ .ConfirmationURL }}" 
       style="background: linear-gradient(135deg, #b4a0ff 0%, #ffb4a0 100%); 
              color: #1a1a1a; 
              padding: 16px 32px; 
              text-decoration: none; 
              border-radius: 8px; 
              display: inline-block;
              font-weight: 600;
              font-size: 16px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      Confirm Email Change
    </a>
  </div>

  <p style="color: #666; font-size: 14px; margin-bottom: 8px;">
    If the button doesn't work, copy and paste this link into your browser:
  </p>
  <p style="word-break: break-all; color: #666; font-size: 14px; background: #f8f9fa; padding: 12px; border-radius: 4px; margin-bottom: 24px;">
    {{ .ConfirmationURL }}
  </p>

  <p style="color: #666; font-size: 14px; margin-bottom: 32px;">
    This link will expire in 24 hours.
  </p>

  <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e5e5;">

  <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
    If you didn't request this email change, please contact support immediately.
  </p>
</div>
```

### 8. Environment Variables

Update your `.env.local`:

```bash
# Resend Configuration (for SMTP only)
RESEND_API_KEY=re_your_api_key_here

# Supabase will handle email templates
# No additional email configuration needed
```

## Step 9: Test Email Configuration

### 1. Test Email Verification

Create a test user to verify email sending works:

```bash
# Test signup flow
curl -X POST 'https://your-project.supabase.co/auth/v1/signup' \
  -H 'Content-Type: application/json' \
  -H 'apikey: your-anon-key' \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123"
  }'
```

### 2. Test Password Reset

```bash
# Test password reset
curl -X POST 'https://your-project.supabase.co/auth/v1/recover' \
  -H 'Content-Type: application/json' \
  -H 'apikey: your-anon-key' \
  -d '{
    "email": "test@example.com"
  }'
```

## Step 10: Monitor Email Delivery

### 1. Resend Dashboard

- Go to **Resend Dashboard** → **Emails** → **Logs**
- Monitor email delivery status
- Check bounce rates and delivery metrics

### 2. Supabase Auth Logs

- Go to **Supabase Dashboard** → **Authentication** → **Users**
- Check user confirmation status
- Monitor auth events in logs

## Benefits of This Approach

✅ **Seamless Integration**: Works with existing Supabase Auth flow  
✅ **Automatic Handling**: Supabase manages email triggers  
✅ **Reliable Delivery**: Resend provides high deliverability  
✅ **Easy Customization**: Simple HTML templates  
✅ **Built-in Security**: Supabase handles token generation and validation  

## Troubleshooting

### Common Issues:

1. **Emails not sending**: Check SMTP credentials in Supabase
2. **Template not updating**: Clear browser cache and test again
3. **Delivery issues**: Check Resend logs for bounce/spam reports
4. **Styling issues**: Test email rendering in different clients

### Testing Checklist:

- [ ] SMTP configuration saved in Supabase
- [ ] Email verification template updated
- [ ] Password reset template updated
- [ ] Test signup sends verification email
- [ ] Test password reset sends reset email
- [ ] Email links work correctly
- [ ] Emails display properly in different clients

## Cost Estimation

**Resend Pricing** (as SMTP provider):
- Free tier: 3,000 emails/month
- Pro plan: $20/month for 50,000 emails
- Perfect for AdHub's authentication emails

**Supabase Auth**: Included in your existing Supabase plan

This setup gives you professional, branded authentication emails with minimal configuration! 