<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class VerificationCodeMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public string $code,
        public string $purpose = 'email_verification'
    ) {}

    public function envelope(): Envelope
    {
        $subject = $this->purpose === 'password_reset'
            ? 'Your Password Reset Code'
            : 'Verify Your Email Address';

        return new Envelope(
            to: $this->user->email,
            subject: $subject,
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.verification-code',
            with: [
                'user' => $this->user,
                'code' => $this->code,
                'purpose' => $this->purpose,
                'expiresInMinutes' => 15,
            ],
        );
    }
}