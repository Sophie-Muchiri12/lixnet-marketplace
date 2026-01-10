<!-- File: resources/views/emails/subscription-created.blade.php -->
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
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            padding: 40px 20px; 
            text-align: center; 
            border-radius: 6px 6px 0 0; 
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        .content { 
            padding: 40px; 
            line-height: 1.6;
        }
        .greeting {
            font-size: 16px;
            margin-bottom: 20px;
        }
        .main-text {
            font-size: 15px;
            margin-bottom: 30px;
            color: #333333;
        }
        .details-section {
            margin: 30px 0;
            padding: 20px;
            background-color: #f9fafb;
            border-left: 4px solid #667eea;
            border-radius: 4px;
        }
        .detail-row { 
            display: flex; 
            justify-content: space-between; 
            padding: 12px 0; 
            font-size: 14px;
            border-bottom: 1px solid #e5e7eb;
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .detail-label { 
            font-weight: 600; 
            color: #555555; 
            width: 40%;
        }
        .detail-value { 
            color: #333333; 
            text-align: right;
            word-break: break-word;
        }
        .section-title {
            font-size: 15px;
            font-weight: 600;
            color: #333333;
            margin-top: 25px;
            margin-bottom: 12px;
        }
        .feature-list {
            margin-bottom: 30px;
        }
        .feature-list li {
            font-size: 14px;
            margin-bottom: 10px;
            color: #555555;
            line-height: 1.5;
        }
        .cta-button {
            display: inline-block;
            padding: 12px 32px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 4px;
            font-weight: 600;
            font-size: 14px;
            margin: 20px 0 30px 0;
        }
        .cta-button:hover {
            opacity: 0.9;
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
        .divider {
            height: 1px;
            background-color: #e5e7eb;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="email-wrapper">
            <div class="header">
                <h1>Subscription Confirmed</h1>
            </div>
            <div class="content">
                <p class="greeting">Hi {{ $user->name }},</p>
                
                <p class="main-text">
                    Thank you for subscribing! Your subscription to <strong>{{ $product->title }}</strong> is now active and ready to use.
                </p>

                <div class="details-section">
                    <div class="detail-row">
                        <span class="detail-label">Product</span>
                        <span class="detail-value">{{ $product->title }}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Plan</span>
                        <span class="detail-value">{{ ucfirst($subscription->tier) }}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Monthly Rate</span>
                        <span class="detail-value">{{ $tierPrice }}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Reference Number</span>
                        <span class="detail-value">{{ $subscription->subscription_reference }}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Activation Date</span>
                        <span class="detail-value">{{ $subscription->started_at->format('M d, Y') }}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Next Billing Date</span>
                        <span class="detail-value">{{ $nextBillingDate }}</span>
                    </div>
                </div>

                <p class="section-title">What Happens Next</p>
                <ul class="feature-list">
                    <li>Your {{ ucfirst($subscription->tier) }} plan is now active and you have full access to all features</li>
                    <li>You'll receive renewal reminders 7 and 3 days before your next billing date</li>
                    <li>You can manage or cancel your subscription anytime from your account dashboard</li>
                </ul>

                <p class="section-title">Need Help?</p>
                <p class="main-text">
                    If you have any questions about your subscription or need assistance, please don't hesitate to reach out to our support team. We're here to help!
                </p>

                <p style="margin-top: 30px; color: #555555;">
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