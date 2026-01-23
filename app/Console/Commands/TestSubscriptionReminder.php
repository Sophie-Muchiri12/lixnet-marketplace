<?php
// File: app/Console/Commands/TestSubscriptionReminder.php

namespace App\Console\Commands;

use App\Services\SubscriptionService;
use App\Models\Subscription;
use Illuminate\Console\Command;

class TestSubscriptionReminder extends Command
{
    protected $signature = 'subscriptions:test-reminder {subscription_id : The ID of the subscription} {--days=3 : Days until renewal for testing}';
    
    protected $description = 'Test subscription renewal reminder email for a specific subscription';

    public function __construct(private SubscriptionService $subscriptionService)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $subscriptionId = $this->argument('subscription_id');
        $daysUntilRenewal = $this->option('days');

        try {
            $subscription = Subscription::findOrFail($subscriptionId);

            $this->info('📧 Testing subscription renewal reminder...');
            $this->line("Subscription ID: {$subscription->id}");
            $this->line("Product: {$subscription->product->title}");
            $this->line("User: {$subscription->user->email}");
            $this->line("Tier: {$subscription->tier}");
            $this->line("Days Until Renewal (for test): {$daysUntilRenewal}");

            // Send the test reminder
            $this->subscriptionService->sendRenewalReminder($subscription, $daysUntilRenewal);

            $this->info('✓ Test renewal reminder email sent successfully!');
            $this->line("Email sent to: {$subscription->user->email}");

            return 0;
        } catch (\Exception $e) {
            $this->error('✗ Error: ' . $e->getMessage());
            return 1;
        }
    }
}