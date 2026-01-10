<!-- File: resources/views/emails/subscription-cancelled.blade.php -->
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
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
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
        .details-section {
            margin: 25px 0;
            padding: 20px;
            background-color: #f9fafb;
            border-left: 4px solid #ef4444;
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
        .feedback-box {
            background-color: #fef2f2;
            border-left: 4px solid #ef4444;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
        }
        .feedback-box p {
            margin: 0;
            font-size: 14px;
            color: #7f1d1d;
        }
        .feedback-box strong {
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
                <h1>Subscription Cancelled</h1>
            </div>
            <div class="content">
                <p class="greeting">Hi {{ $user->name }},</p>
                
                <p class="main-text">
                    Your subscription to <strong>{{ $product->title }}</strong> has been successfully cancelled. Your access to this service has ended.
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
                        <span class="detail-label">Cancellation Date</span>
                        <span class="detail-value">{{ $cancelledDate }}</span>
                    </div>
                    @if($reason)
                    <div class="detail-row">
                        <span class="detail-label">Reason Provided</span>
                        <span class="detail-value">{{ $reason }}</span>
                    </div>
                    @endif
                </div>

                <p class="section-title">Important Information</p>
                <ul class="feature-list">
                    <li>Your access to all {{ ucfirst($subscription->tier) }} tier features has been terminated</li>
                    <li>No further charges will be applied to your account</li>
                    <li>You can resubscribe at any time to regain access</li>
                </ul>

                <div class="feedback-box">
                    <p><strong>We'd Love Your Feedback</strong>
                    Your feedback helps us improve our services. If there's anything we could have done better or if you have suggestions for improvement, please let us know. We value your input!</p>
                </div>

                <p class="section-title">What Next?</p>
                <p class="main-text">
                    If you decide to come back, you can easily resubscribe from your account dashboard. If you have any questions or need further assistance, our support team is ready to help.
                </p>

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