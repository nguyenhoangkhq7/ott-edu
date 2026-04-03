# Auth Module

Complete forgot password flow implementation with Microsoft Teams-inspired design.

## Pages

### 1. ForgotPasswordPage
**Route:** `/forgot-password`

Email input form to initiate password reset.

**Features:**
- Email input with @ icon
- Form validation (required field)
- "Send reset link" button with loading spinner
- "Back to sign in" navigation link
- Footer with Privacy, Terms, and Contact links
- Teams Connect branding

**User Flow:**
1. User enters email address
2. Click "Send reset link"
3. Navigates to Check Email page

---

### 2. CheckEmailPage
**Route:** `/forgot-password/check-email`

Confirmation that password reset email has been sent.

**Features:**
- Large email icon (128px circle with blue background)
- "Check your email" heading
- Informational message about reset link
- "Open Email App" button (opens default email client via mailto:)
- "Resend link" action
- "Back to login" navigation
- Microsoft Identity Service footer

**User Flow:**
1. User sees confirmation message
2. Can open email app or resend link
3. Clicks verification link in email (leads to Verify page)

---

### 3. VerifyIdentityPage
**Route:** `/forgot-password/verify`

OTP verification screen with 6-digit code input.

**Features:**
- 6 separate input boxes for OTP digits
- Auto-focus to next box on digit entry
- Backspace navigation to previous box
- Paste support (automatically distributes digits)
- Countdown timer (MM:SS format)
- "I didn't receive a code" link (visible when timer reaches 0)
- Resend code functionality
- "Verify and Sign in" button (disabled until all digits entered)
- Microsoft Identity Service security footer

**Technical Details:**
- Input type: numeric (mobile-optimized keyboard)
- Timer: 48 seconds countdown
- Validation: All 6 digits required
- State Management: Array of 6 strings for OTP

**User Flow:**
1. User receives 6-digit code via email
2. Enters code (auto-advances between boxes)
3. Timer counts down
4. If code expires, can request new code
5. Submit valid code → Navigate to Reset Password

---

### 4. ResetPasswordPage
**Route:** `/forgot-password/reset`

New password creation form with strength indicator.

**Features:**
- New password input with show/hide toggle
- Confirm password input with show/hide toggle
- Real-time password strength meter (visual bar)
- Strength levels: Weak (red), Medium (yellow), Strong (green)
- Password requirements indicator:
  - Minimum 8 characters
  - Must include numbers
  - Must include symbols
- Password match validation
- "Reset Password" button (disabled until valid)
- "Back to sign in" navigation
- Footer with Privacy & Cookies, Terms of Use

**Password Strength Algorithm:**
- Length ≥ 8: +25%
- Contains lowercase: +25%
- Contains uppercase: +25%
- Contains numbers: +12.5%
- Contains symbols: +12.5%

**User Flow:**
1. User enters new password
2. Sees real-time strength feedback
3. Confirms password (must match)
4. Meets all requirements → Enable submit button
5. Submit → Navigate to Success page

---

### 5. PasswordUpdatedPage
**Route:** `/forgot-password/success`

Success confirmation with sign-in option.

**Features:**
- Large green checkmark icon (success indicator)
- "Password updated!" heading
- Success message
- Primary "Sign In" button → `/login`
- Secondary "Go to Security Settings" link → `/account`
- Footer with Privacy, Terms, Copyright
- Microsoft Identity Service security footer

**User Flow:**
1. User sees success confirmation
2. Click "Sign In" to go to login page
3. Or click "Go to Security Settings" to manage account

---

## Component Architecture

```
src/modules/auth/
├── ForgotPasswordPage.tsx          # Email input form
├── CheckEmailPage.tsx              # Email sent confirmation
├── VerifyIdentityPage.tsx          # 6-digit OTP verification
├── ResetPasswordPage.tsx           # New password form
├── PasswordUpdatedPage.tsx         # Success screen
└── index.ts                        # Barrel exports
```

## Routing Structure

```
app/(auth)/
└── forgot-password/
    ├── page.tsx                    # ForgotPasswordPage
    ├── check-email/
    │   └── page.tsx                # CheckEmailPage
    ├── verify/
    │   └── page.tsx                # VerifyIdentityPage
    ├── reset/
    │   └── page.tsx                # ResetPasswordPage
    └── success/
        └── page.tsx                # PasswordUpdatedPage
```

## Design System

**Colors:**
- Primary: `blue-600` (#2563EB)
- Success: `green-600` (#16A34A)
- Warning: `yellow-500` (#EAB308)
- Error: `red-500` (#EF4444)
- Background: `slate-50` (#F8FAFC)
- Text Primary: `slate-900` (#0F172A)
- Text Secondary: `slate-600` (#475569)

**Layout:**
- Container: `max-w-md` (448px)
- Card: `rounded-xl bg-white p-8 shadow-sm`
- Centered: `flex min-h-screen items-center justify-center`

**Typography:**
- Heading: `text-2xl font-bold text-slate-900`
- Body: `text-sm text-slate-600`
- Button: `text-sm font-medium`

**Interactive Elements:**
- Button Primary: `bg-blue-600 hover:bg-blue-700`
- Button Disabled: `opacity-50`
- Input Focus: `focus:border-blue-500 focus:ring-1 focus:ring-blue-500`

## Accessibility

**Keyboard Navigation:**
- Tab order follows visual flow
- Enter submits forms
- Escape closes modals (if any)
- Arrow keys navigate between OTP inputs

**Screen Reader Support:**
- Semantic HTML (form, button, label)
- ARIA labels for icon buttons
- Error messages announced
- Status updates for loading states

**Visual Indicators:**
- Focus rings on all interactive elements
- Loading spinners for async actions
- Error states with clear messaging
- Password strength visual + text label

## State Management

**Local State (useState):**
- Form input values
- Loading states
- Password visibility toggles
- OTP digit array
- Countdown timer
- Error messages

**No Global State Required:**
- Each page is independent
- Navigation via Next.js router
- No shared form data between pages
- Email/OTP could be passed via URL params if needed

## Security Considerations

**Client-Side:**
- Input validation (email format, password strength)
- Password masking with show/hide toggle
- OTP auto-clear on resend
- Timer-based code expiration
- No sensitive data in localStorage

**Backend Integration Points:**
- `POST /api/auth/forgot-password` - Send reset email
- `POST /api/auth/verify-otp` - Validate OTP code
- `POST /api/auth/reset-password` - Update password
- All endpoints should implement rate limiting
- OTP should expire after fixed duration
- Single-use OTP codes

## Testing Checklist

- [ ] Email validation accepts valid formats
- [ ] Email validation rejects invalid formats
- [ ] Send reset link shows loading state
- [ ] Navigation flows work correctly
- [ ] OTP inputs auto-advance on digit entry
- [ ] OTP inputs backspace to previous box
- [ ] OTP paste distributes digits correctly
- [ ] Countdown timer decrements every second
- [ ] Resend code resets timer
- [ ] Password strength updates in real-time
- [ ] Password toggle shows/hides characters
- [ ] Password match validation works
- [ ] Reset button disabled until valid
- [ ] Success page navigates to login
- [ ] All "Back" links work correctly
- [ ] Responsive on mobile devices
- [ ] Keyboard navigation works
- [ ] Screen reader announces changes

## Future Enhancements

1. **Email Masking:** Show `m***@example.com` instead of full email
2. **Biometric Authentication:** Face ID / Touch ID option
3. **Multi-Factor Setup:** Add backup codes during reset
4. **Password History:** Prevent reusing recent passwords
5. **Account Recovery:** Alternative verification methods
6. **Session Management:** Auto-logout after password reset
7. **Analytics:** Track completion rates at each step
8. **A/B Testing:** Test different UI variations
9. **Internationalization:** Multi-language support
10. **Dark Mode:** Support system preference

## API Integration Example

```typescript
// ForgotPasswordPage.tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  
  try {
    const response = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    
    if (response.ok) {
      router.push('/forgot-password/check-email');
    } else {
      setError('Failed to send reset email');
    }
  } catch (error) {
    setError('Something went wrong');
  } finally {
    setIsLoading(false);
  }
};
```

## Dependencies

- **Next.js:** App Router, useRouter, navigation
- **React:** useState, useEffect, useRef
- **TypeScript:** Type safety for all components
- **Tailwind CSS:** Utility-first styling
- **No additional libraries required**

## Performance

**Optimizations:**
- Client components only where needed
- Minimal JavaScript bundle size
- CSS purged unused classes
- No third-party form libraries
- Native HTML5 validation
- Debounced password strength calculation

**Metrics:**
- First Contentful Paint: < 1s
- Time to Interactive: < 2s
- Total Bundle Size: < 50KB (per page)

---

**Last Updated:** January 2025  
**Version:** 1.0.0  
**Status:** ✅ Complete
