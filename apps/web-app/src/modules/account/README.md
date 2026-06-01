# Account Module

Quản lý tài khoản người dùng với các tính năng profile, privacy và settings.

## Pages

### 1. Account Page (`/account`)
Trang chính quản lý tài khoản với 3 tabs:
- **Manage account**: Profile details, Contact info, Security & Privacy
- **Subscriptions**: Quản lý đăng ký
- **Plan details**: Chi tiết gói dịch vụ

### 2. Edit Personal Information (`/account/edit`)
Chỉnh sửa thông tin cá nhân:
- Upload/Remove profile picture
- Full name, Job title, Department
- About section với textarea
- Links đến Privacy Settings và Edit History

### 3. Privacy Settings (`/account/privacy`)
Cài đặt quyền riêng tư:
- **Who can contact you**: Priority access, Contact requests toggle
- **Blocked contacts**: Manage danh sách chặn
- **Privacy levels**: Public, Internal Only, Private

### 4. Profile Overview (`/profile`)
Xem tổng quan profile người dùng:
- Tabs: Overview, Activity, Organization, Files
- Contact Information
- Recent Updates
- Current Team, Mutual Contacts, Next Meeting

## Components

### Core Components

#### ProfileDetailsSection
```tsx
<ProfileDetailsSection
  avatarUrl="/path/to/avatar.png"
  fullName="John Doe"
  onEdit={() => router.push('/account/edit')}
/>
```

#### ContactInformationSection
```tsx
<ContactInformationSection
  email="user@example.com"
  phoneNumber="+1 (555) 123-4567"
  onChangeEmail={handleChange}
  onEditPhone={handleEdit}
/>
```

#### SecurityPrivacySection
```tsx
<SecurityPrivacySection
  twoFactorEnabled={true}
  onToggleTwoFactor={setEnabled}
  passwordLastChanged="3 months ago"
  onUpdatePassword={handleUpdate}
/>
```

### Modals

#### ProfilePictureModal
```tsx
<ProfilePictureModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  currentAvatarUrl="/avatar.png"
  userName="John Doe"
  userEmail="john@example.com"
/>
```

#### ProfileCardModal
```tsx
<ProfileCardModal
  isOpen={showCard}
  onClose={() => setShowCard(false)}
  userName="Jane Doe"
  userEmail="jane@example.com"
  userStatus="available"
  avatarUrl="/avatar.png"
  linkedinUrl="https://linkedin.com/in/janedoe"
/>
```

## UI Components

### Toggle
```tsx
<Toggle
  enabled={isEnabled}
  onChange={setIsEnabled}
  ariaLabel="Enable feature"
/>
```

### Modal
```tsx
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Modal Title"
  maxWidth="md"
>
  <p>Modal content here</p>
</Modal>
```

## Routes

```
/account              → AccountPage
/account/edit         → EditPersonalInformationPage
/account/privacy      → PrivacySettingsPage
/profile              → ProfileOverviewPage
```

## File Structure

```
src/modules/account/
├── index.ts                              # Barrel exports
├── AccountPage.tsx                       # Main account page
├── EditPersonalInformationPage.tsx       # Edit profile page
├── PrivacySettingsPage.tsx               # Privacy settings
├── ProfileOverviewPage.tsx               # Profile view
└── components/
    ├── ProfileDetailsSection.tsx         # Avatar + name section
    ├── ContactInformationSection.tsx     # Email/phone display
    ├── SecurityPrivacySection.tsx        # 2FA + password
    ├── ProfilePictureModal.tsx           # Change avatar modal
    └── ProfileCardModal.tsx              # Quick profile card
```

## Design Patterns

✅ **Component Composition** - Tách nhỏ sections có thể tái sử dụng  
✅ **TypeScript Strict** - Full type safety với interfaces  
✅ **Tailwind CSS** - Utility-first, no inline styles  
✅ **Accessibility** - ARIA labels, keyboard navigation  
✅ **Next.js Optimized** - Image optimization, client components  
✅ **Responsive Design** - Mobile-first approach  

## Color Palette

- Primary: `#3B82F6` (blue-600)
- Success: `#10B981` (green-500)
- Warning: `#F59E0B` (yellow-500)
- Error: `#EF4444` (red-500)
- Neutral: slate-* scale

## Notes

- Tất cả interactive components đều có `"use client"` directive
- Images sử dụng Next.js `<Image>` component để optimize
- Modals có escape key handler và click outside để đóng
- Forms sử dụng controlled components pattern
