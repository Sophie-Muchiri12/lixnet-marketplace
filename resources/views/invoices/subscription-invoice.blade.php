<!-- File: resources/views/invoices/subscription-invoice.blade.php -->

<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            color: #333;
            line-height: 1.6;
            padding: 40px;
            background-color: #fff;
        }

        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
        }

        /* Header */
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            border-bottom: 2px solid #f0f0f0;
            padding-bottom: 20px;
        }

        .company-info {
            display: flex;
            align-items: center;
            gap: 20px;
        }

        .logo {
            width: 120px;
            height: 80px;
            object-fit: contain;
        }

        .company-details h1 {
            font-size: 24px;
            margin-bottom: 5px;
            color: #0052a3;
        }

        .company-details p {
            font-size: 13px;
            color: #666;
            margin: 3px 0;
        }

        .invoice-details {
            text-align: right;
        }

        .invoice-details h2 {
            font-size: 32px;
            color: #0052a3;
            margin-bottom: 10px;
        }

        .invoice-details p {
            font-size: 13px;
            color: #666;
            margin: 3px 0;
        }

        .invoice-meta {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 40px;
        }

        .meta-block h3 {
            font-size: 11px;
            text-transform: uppercase;
            color: #999;
            margin-bottom: 8px;
            font-weight: 600;
            letter-spacing: 0.5px;
        }

        .meta-block p {
            font-size: 14px;
            color: #333;
            margin: 4px 0;
        }

        .meta-block .label {
            color: #666;
            font-size: 12px;
        }

        /* Items Table */
        table {
            width: 100%;
            margin-bottom: 40px;
            border-collapse: collapse;
        }

        table thead {
            background-color: #f8f8f8;
            border-bottom: 2px solid #ddd;
        }

        table th {
            padding: 12px;
            text-align: left;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            color: #666;
            letter-spacing: 0.5px;
        }

        table td {
            padding: 15px 12px;
            border-bottom: 1px solid #eee;
            font-size: 14px;
        }

        table tr:last-child td {
            border-bottom: none;
        }

        .item-description {
            color: #666;
            font-size: 13px;
            margin-top: 3px;
        }

        /* Total Section */
        .totals {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 40px;
        }

        .totals-table {
            width: 300px;
        }

        .totals-table table {
            margin: 0;
            border: none;
        }

        .totals-table th,
        .totals-table td {
            border: none;
            padding: 10px;
            text-align: right;
        }

        .totals-table th {
            background: none;
            text-align: left;
            font-weight: 600;
            color: #333;
            text-transform: none;
            font-size: 13px;
        }

        .total-row {
            background-color: #f8f8f8;
            border-top: 2px solid #ddd;
            border-bottom: 2px solid #ddd;
        }

        .total-row th {
            font-size: 16px;
            color: #0052a3;
        }

        .total-row td {
            font-size: 16px;
            font-weight: 700;
            color: #0052a3;
        }

        /* Status Badge */
        .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .status-paid {
            background-color: #d4edda;
            color: #155724;
        }

        .status-pending {
            background-color: #fff3cd;
            color: #856404;
        }

        .status-processing {
            background-color: #d1ecf1;
            color: #0c5460;
        }

        .status-failed {
            background-color: #f8d7da;
            color: #721c24;
        }

        /* Footer */
        .footer {
            border-top: 1px solid #eee;
            padding-top: 20px;
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #999;
        }

        .footer p {
            margin: 5px 0;
        }

        .thank-you {
            background-color: #f8f8f8;
            padding: 20px;
            border-radius: 4px;
            margin-bottom: 30px;
            text-align: center;
            color: #666;
        }

        .thank-you strong {
            color: #333;
        }

        /* Amount formatting */
        .amount {
            text-align: right;
            font-weight: 600;
            color: #0052a3;
        }

        /* Contact Info */
        .contact-info {
            font-size: 12px;
            color: #666;
            line-height: 1.4;
        }

        .contact-info strong {
            display: block;
            color: #333;
            margin-bottom: 3px;
        }

        @media print {
            body {
                background: white;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="company-info">
                <img src="{{ public_path('logo.jpg') }}" alt="LIXNET Logo" class="logo">
                <div class="company-details">
                    <h1>LIXNET</h1>
                    <p>Software Solutions & Services</p>
                    <p>Nairobi, Kenya</p>
                </div>
            </div>
            <div class="invoice-details">
                <h2>INVOICE</h2>
                <p><strong>{{ $invoice_number }}</strong></p>
                <p style="margin-top: 15px; font-size: 11px; color: #999;">
                    <span class="status-badge status-{{ strtolower($status) }}">{{ $status }}</span>
                </p>
            </div>
        </div>

        <!-- Invoice Meta Information -->
        <div class="invoice-meta">
            <div>
                <div class="meta-block">
                    <h3>Bill To</h3>
                    <div class="contact-info">
                        <strong>{{ $user_name }}</strong>
                        {{ $user_email }}<br>
                        {{ $user_phone }}<br>
                        @if($user_company !== 'N/A')
                            {{ $user_company }}<br>
                        @endif
                    </div>
                </div>
            </div>
            <div>
                <div class="meta-block">
                    <h3>Invoice Details</h3>
                    <p>
                        <span class="label">Invoice Date:</span><br>
                        {{ $invoice_date }}
                    </p>
                    <p style="margin-top: 10px;">
                        <span class="label">Due Date:</span><br>
                        {{ $due_date }}
                    </p>
                    <p style="margin-top: 10px;">
                        <span class="label">Billing Period:</span><br>
                        {{ $billing_period }}
                    </p>
                </div>
            </div>
        </div>

        <!-- Items Table -->
        <table>
            <thead>
                <tr>
                    <th>Description</th>
                    <th style="text-align: center;">Quantity</th>
                    <th style="text-align: right;">Unit Price</th>
                    <th style="text-align: right;">Amount</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>
                        <strong>{{ $product_name }}</strong>
                        <div class="item-description">
                            Subscription Tier: <strong>{{ $tier }}</strong><br>
                            Reference: {{ $subscription_reference }}
                        </div>
                    </td>
                    <td style="text-align: center;">1</td>
                    <td class="amount">{{ $currency_symbol }}{{ number_format($amount, 2) }}</td>
                    <td class="amount">{{ $currency_symbol }}{{ number_format($amount, 2) }}</td>
                </tr>
            </tbody>
        </table>

        <!-- Totals -->
        <div class="totals">
            <div class="totals-table">
                <table>
                    <tr>
                        <th>Subtotal:</th>
                        <td>{{ $currency_symbol }}{{ number_format($amount, 2) }}</td>
                    </tr>
                    <tr>
                        <th>Tax (0%):</th>
                        <td>{{ $currency_symbol }}0.00</td>
                    </tr>
                    <tr class="total-row">
                        <th>Total Due:</th>
                        <td>{{ $currency_symbol }}{{ number_format($amount, 2) }}</td>
                    </tr>
                </table>
            </div>
        </div>

        <!-- Thank You Message -->
        @if($status === 'Paid')
            <div class="thank-you">
                <p><strong>Thank you for your payment!</strong></p>
                <p>Your subscription is active and you can now access all features of {{ $product_name }}.</p>
            </div>
        @endif

        <!-- Footer -->
        <div class="footer">
            <p><strong>LIXNET</strong></p>
            <p>Software Solutions & Services Marketplace</p>
            <p>Nairobi, Kenya</p>
            <p style="margin-top: 15px; color: #ccc;">
                This is an automatically generated invoice. Please keep this for your records.
            </p>
        </div>
    </div>
</body>
</html>