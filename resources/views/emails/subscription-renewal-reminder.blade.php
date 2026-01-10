<!-- File: resources/views/emails/subscription-renewal-reminder.blade.php -->
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
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
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
            margin-bottom: 20px;
            color: #333333;
        }
        .countdown-box {
            text-align: center;
            padding: 30px 20px;
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border-radius: 6px;
            margin: 25px 0;
        }
        .countdown-number {
            font-size: 48px;
            font-weight: 700;
            color: #d97706;
            margin: 0;
            line-height: 1;
        }
        .countdown-text {
            font-size: 14px;
            color: #92400e;
            margin-top: 8px;
            font-weight: 500;
        }
        .details-section {
            margin: 25px 0;
            padding: 20px;
            background-color: #f9fafb;
            border-left: 4px solid #f59e0b;
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
        }
        .detail-value { 
            color: #333333;
            text-align: right;
        }
        .section-title {
            font-size: 15px;
            font-weight: 600;
            color: #333333;
            margin-top: 25px;
            margin-bottom: 12px;
        }
        .feature-list {
            margin-bottom: 20px;
        }
        .feature-list li {
            font-size: 14px;
            margin-bottom: 10px;
            color: #555555;
            line-height: 1.5;
        }
        .action-box {
            background-color: #f0fdf4;
            border-left: 4px solid #22c55e;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
        }
        .action-box p {
            margin: 0;
            font-size: 14px;
            color: #166534;
        }
        .action-box strong {
            display: block;
            margin-bottom: 8px;
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
                <h1>Subscription Renewal Reminder</h1>
            </div>
            <div class="content">
                <p class="greeting">Hi {{ $user->name }},</p>
                
                <p class="main-text">
                    Your subscription to <strong>{{ $product->title }}</strong> will be renewed in <strong>{{ $daysUntilRenewal }} day{{ $daysUntilRenewal > 1 ? 's' : '' }}</strong>.
                </p>

                <div class="countdown-box">
                    <p class="countdown-number">{{ $daysUntilRenewal }}</p>
                    <p class="countdown-text">Days until renewal</p>
                </div>

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
                        <span class="detail-label">Renewal Amount</span>
                        <span class="detail-value">{{ $tierPrice }}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Renewal Date</span>
                        <span class="detail-value">{{ $nextBillingDate }}</span>
                    </div>
                </div>

                <p class="section-title">What to Expect</p>
                <ul class="feature-list">
                    <li>Your subscription will automatically renew on {{ $nextBillingDate }}</li>
                    <li>You will be charged {{ $tierPrice }} for the next billing period</li>
                    <li>Your access will continue uninterrupted after renewal</li>
                </ul>

                <div class="action-box">
                    <p><strong>Want to make changes?</strong>
                    You can upgrade, downgrade, or cancel your subscription anytime from your account dashboard. If you cancel before the renewal date, you won't be charged.</p>
                </div>

                <p style="margin-top: 25px; color: #555555;">
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