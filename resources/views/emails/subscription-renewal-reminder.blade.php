<!-- subscription-renewal-reminder.blade.php -->
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
            background-color: #ffffff;
        }
        .container { 
            max-width: 600px; 
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
        .details-section {
            margin: 30px 0;
            border: 1px solid #e5e7eb;
            border-radius: 4px;
            overflow: hidden;
        }
        .detail-row { 
            display: flex; 
            justify-content: space-between; 
            padding: 12px 15px; 
            font-size: 14px;
            border-bottom: 1px solid #e5e7eb;
            background-color: #fafafa;
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .detail-label { 
            font-weight: 600; 
            color: #666666;
        }
        .detail-value { 
            color: #333333;
            text-align: right;
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
        .feature-list {
            margin: 15px 0 20px 0;
            padding-left: 20px;
        }
        .feature-list li {
            font-size: 14px;
            margin-bottom: 8px;
            color: #555555;
            line-height: 1.5;
        }
        .info-box {
            background-color: #fafafa;
            border: 1px solid #e5e7eb;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
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
            <p class="greeting">Hi {{ $user->name }},</p>
            
            <p class="main-text">
                Your subscription to <strong>{{ $product->title }}</strong> will be renewed in <strong>{{ $daysUntilRenewal }} day{{ $daysUntilRenewal > 1 ? 's' : '' }}</strong>.
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

            <div class="info-box">
                <strong>Want to make changes?</strong><br><br>
                You can upgrade, downgrade, or cancel your subscription anytime from your account dashboard. If you cancel before the renewal date, you won't be charged.
            </div>

            <div class="signature">
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