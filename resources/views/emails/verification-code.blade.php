<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            color: #333333; 
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
        }
        .email-wrapper {
            background-color: #ffffff;
            border-radius: 6px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .header { 
            background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
            color: white; 
            padding: 40px 20px; 
            text-align: center; 
            border-radius: 6px 6px 0 0; 
        }
        .logo {
            font-size: 28px;
            font-weight: 700;
            margin: 0 0 10px 0;
            letter-spacing: -0.5px;
        }
        .content { 
            padding: 40px; 
            line-height: 1.6;
        }
        .greeting {
            font-size: 16px;
            margin-bottom: 15px;
            color: #333333;
        }
        .main-text {
            font-size: 15px;
            margin-bottom: 25px;
            color: #555555;
            line-height: 1.6;
        }
        .code-box {
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            border: 2px solid #0284c7;
            border-radius: 8px;
            padding: 25px;
            text-align: center;
            margin: 30px 0;
        }
        .code-label {
            font-size: 12px;
            font-weight: 600;
            color: #0c4a6e;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 12px;
        }
        .code-display {
            font-size: 36px;
            font-weight: 700;
            letter-spacing: 4px;
            color: #0284c7;
            font-family: 'Courier New', monospace;
            margin: 0;
        }
        .expiry-notice {
            font-size: 13px;
            color: #0c4a6e;
            margin-top: 12px;
            font-weight: 500;
        }
        .info-section {
            background-color: #f9fafb;
            border-left: 4px solid #0284c7;
            padding: 15px;
            border-radius: 4px;
            margin: 25px 0;
            font-size: 14px;
            color: #555555;
        }
        .warning-section {
            background-color: #fef2f2;
            border-left: 4px solid #ef4444;
            padding: 15px;
            border-radius: 4px;
            margin: 25px 0;
            font-size: 14px;
            color: #7f1d1d;
        }
        .section-title {
            font-size: 15px;
            font-weight: 600;
            color: #333333;
            margin-top: 25px;
            margin-bottom: 12px;
        }
        .security-tips {
            margin: 15px 0 0 0;
            padding-left: 20px;
        }
        .security-tips li {
            margin-bottom: 8px;
            line-height: 1.5;
        }
        .footer { 
            text-align: center; 
            padding: 30px 40px 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px; 
            color: #888888;
            background-color: #fafafa;
            border-radius: 0 0 6px 6px;
        }
        .footer-text {
            margin: 5px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="email-wrapper">
            <div class="header">
                <div class="logo">Lixnet Marketplace</div>
            </div>
            <div class="content">
                <p class="greeting">Hello {{ $user->name }},</p>
                
                @if($purpose === 'password_reset')
                    <p class="main-text">
                        We received a request to reset your password. Use the verification code below to proceed with securing your account.
                    </p>
                    
                    <div class="code-box">
                        <div class="code-label">Your Verification Code</div>
                        <p class="code-display">{{ $code }}</p>
                        <div class="expiry-notice">This code expires in 15 minutes</div>
                    </div>

                    <div class="info-section">
                        <strong>Next Steps:</strong><br>
                        Enter this code on the password reset page to verify your identity and create a new password.
                    </div>

                    <div class="warning-section">
                        <strong>Didn't request a password reset?</strong><br>
                        If you didn't initiate this request, please ignore this email. Your account remains secure. If you believe someone has accessed your account without permission, please contact us immediately.
                    </div>

                @else
                    <p class="main-text">
                        Thank you for registering with Lixnet Marketplace! To complete your registration and activate your account, please verify your email address using the code below.
                    </p>
                    
                    <div class="code-box">
                        <div class="code-label">Your Verification Code</div>
                        <p class="code-display">{{ $code }}</p>
                        <div class="expiry-notice">This code expires in 15 minutes</div>
                    </div>

                    <div class="info-section">
                        <strong>Next Steps:</strong><br>
                        Enter this code on the verification page to confirm your email address and complete your registration.
                    </div>

                    <div class="warning-section">
                        <strong>Didn't create this account?</strong><br>
                        If you didn't sign up for Lixnet Marketplace, please ignore this email. No action is required, and your email will not be registered.
                    </div>
                @endif

                <p class="section-title">Security Tips</p>
                <ul class="security-tips">
                    <li>Never share your verification code with anyone</li>
                    <li>Lixnet Marketplace team will never ask for your code via email or phone</li>
                    <li>This code is for one-time use only</li>
                    <li>Keep your account password secure and unique</li>
                </ul>

                <p style="margin-top: 30px; color: #555555;">
                    If you need any assistance, please don't hesitate to contact our support team.<br><br>
                    Best regards,<br>
                    <strong>The Lixnet Marketplace Team</strong>
                </p>
            </div>
            <div class="footer">
                <p class="footer-text">This is an automated email. Please do not reply directly to this email.</p>
                <p class="footer-text">&copy; {{ date('Y') }} Lixnet Marketplace. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>