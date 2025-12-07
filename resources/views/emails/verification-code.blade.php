<x-mail::message>
{{-- Header with Lixnet branding --}}
<div style="text-align: center; margin-bottom: 32px;">
    <h1 style="color: #1e40af; font-size: 28px; font-weight: bold; margin: 0;">
        Lixnet Marketplace
    </h1>
</div>

# Hello, {{ $user->name }}!

@if($purpose === 'password_reset')

We received a request to reset your password. Use the verification code below to proceed:

<x-mail::panel>
**Verification Code: {{ $code }}**
</x-mail::panel>

This code will expire in 15 minutes. If you didn't request a password reset, please ignore this email and your account will remain secure.

<x-mail::button :url="route('password.code-verify')">
Reset Your Password
</x-mail::button>

@else

Thank you for registering with Lixnet Marketplace! Please verify your email address to complete your registration using the code below:

<x-mail::panel>
**Verification Code: {{ $code }}**
</x-mail::panel>

This code will expire in 15 minutes. If you didn't create this account, please ignore this email.

<x-mail::button :url="route('verification.notice')">
Verify Your Email
</x-mail::button>

@endif

---

**Need help?** If you have any questions, please don't hesitate to contact our support team.

Thanks,<br>
The Lixnet Marketplace Team

<x-slot:footer>
© {{ date('Y') }} Lixnet Marketplace. All rights reserved.
</x-slot:footer>
</x-mail::message>