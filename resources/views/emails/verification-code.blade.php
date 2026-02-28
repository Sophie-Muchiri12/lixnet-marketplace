<!-- verification-code.blade.php -->
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            
            margin: 0;
            padding: 0;
            
        }
        .container { 
            
            margin: 0 auto; 
            padding: 0; 
        }
        .content { 
            padding: 40px 30px; 
            line-height: 1.6;
        }
        .greeting {
            font-size: 16px;
            margin-bottom: 15px;
            font-weight: 500;
        }
        .main-text {
            font-size: 15px;
            margin-bottom: 20px;
            color: #555555;
        }
        .code-box {
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 4px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
        }
        .code-label {
            font-size: 12px;
            font-weight: 600;
            color: #666666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 12px;
        }
        .code-display {
            font-size: 32px;
            font-weight: 700;
            letter-spacing: 2px;
            color: #333333;
            font-family: 'Courier New', monospace;
            margin: 0;
        }
        .expiry-notice {
            font-size: 13px;
            color: #666666;
            margin-top: 12px;
            font-weight: 500;
        }
        .info-box {
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
            font-size: 14px;
            color: #555555;
        }
        .warning-box {
            background-color: #fafafa;
            border: 1px solid #e5e7eb;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
            font-size: 14px;
            color: #555555;
        }
        .section-title {
            font-size: 14px;
            font-weight: 600;
            color: #333333;
            margin-top: 25px;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #666666;
        }
        .security-tips {
            margin: 15px 0 0 0;
            padding-left: 20px;
        }
        .security-tips li {
            margin-bottom: 8px;
            line-height: 1.5;
            font-size: 14px;
            color: #555555;
        }
        .footer { 
            text-align: center; 
            padding: 25px 30px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px; 
            color: #999999;
            background-color: #fafafa;
        }
        .footer-text {
            margin: 4px 0;
        }
        .signature {
            margin-top: 25px;
            color: #555555;
            font-size: 15px;
        }
    </style>
</head>
<body>
    <div class="container">
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

                <div class="info-box">
                    <strong>Next Steps:</strong><br><br>
                    Enter this code on the password reset page to verify your identity and create a new password.
                </div>

                <div class="warning-box">
                    <strong>Didn't request a password reset?</strong><br><br>
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

                <div class="info-box">
                    <strong>Next Steps:</strong><br><br>
                    Enter this code on the verification page to confirm your email address and complete your registration.
                </div>

                <div class="warning-box">
                    <strong>Didn't create this account?</strong><br><br>
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

            <div class="signature">
                If you need any assistance, please don't hesitate to contact our support team.<br><br>
                Best regards,<br>
                <strong>The Lixnet Marketplace Team</strong>
            </div>
        </div>
        <div class="footer">
            <p class="footer-text">This is an automated email. Please do not reply directly to this email.</p>
            <p class="footer-text">&copy; {{ date('Y') }} Lixnet Marketplace. All rights reserved.</p>
        </div>
    </div>
</body>
</html>