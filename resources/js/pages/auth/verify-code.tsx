import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { Form, Head, usePage } from '@inertiajs/react';
import { LoaderCircle, Mail, MessageCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Props {
    user?: {
        id: number;
        name: string;
        email: string;
        phone?: string;
        email_verified?: boolean;
        phone_verified?: boolean;
    };
}

export default function VerifyCode({ user }: Props) {
    const page = usePage();
    const [code, setCode] = useState('');
    const [isResending, setIsResending] = useState(false);
    const [canResend, setCanResend] = useState(true);
    const [resendCountdown, setResendCountdown] = useState(0);
    const [emailVerified, setEmailVerified] = useState(user?.email_verified || false);
    const [phoneVerified, setPhoneVerified] = useState(user?.phone_verified || false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Update verification status when page props change
    useEffect(() => {
        if (page.props.user) {
            const updatedUser = page.props.user as any;
            setEmailVerified(updatedUser.email_verified || false);
            setPhoneVerified(updatedUser.phone_verified || false);
        }
    }, [page.props.user]);

    // Show flash status message if available
    useEffect(() => {
        const flash = page.props.flash as any;
        if (flash?.status) {
            setMessage({ type: 'success', text: flash.status });
        }
    }, [page.props.flash]);

    // Auto redirect when both verified
    useEffect(() => {
        if (emailVerified && phoneVerified) {
            const timer = setTimeout(() => {
                window.location.href = '/';
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [emailVerified, phoneVerified]);

    // Handle undefined user
    if (!user) {
        return (
            <>
                <Head title="Verify Email" />
                <AuthLayout title="Error" description="Unable to verify your email address.">
                    <div className="text-center">
                        <p className="text-red-600 font-semibold">Error: User data not found. Please try again.</p>
                    </div>
                </AuthLayout>
            </>
        );
    }

    const maskPhoneNumber = (phone: string) => {
        if (!phone || phone.length < 4) return phone;
        return '***' + phone.slice(-4);
    };

    const handleResendAll = async () => {
        setIsResending(true);
        setMessage(null);
        try {
            const response = await fetch('/verification/resend', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ type: 'both' }),
            });

            const data = await response.json();

            if (data.success) {
                setMessage({ type: 'success', text: data.message });

                // Start cooldown timer (60 seconds)
                setCanResend(false);
                let countdown = 60;
                setResendCountdown(countdown);
                const timer = setInterval(() => {
                    countdown--;
                    setResendCountdown(countdown);
                    if (countdown <= 0) {
                        clearInterval(timer);
                        setCanResend(true);
                        setResendCountdown(0);
                    }
                }, 1000);
            } else {
                setMessage({ type: 'error', text: data.message });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to resend codes. Please try again.' });
            console.error(error);
        } finally {
            setIsResending(false);
        }
    };

    const handleVerify = (e: React.FormEvent) => {
        e.preventDefault();
        if (code.length !== 6) {
            setMessage({ type: 'error', text: 'Please enter a 6-digit code' });
            return;
        }
        // Allow form to submit naturally - don't prevent default
    };

    const isFullyVerified = emailVerified && phoneVerified;
    const verificationProgress = [emailVerified, phoneVerified].filter(Boolean).length;

    return (
        <>
            <Head title="Verify Account" />
            <AuthLayout
                title="Verify your account"
                description="Enter the verification code sent to your email and phone"
            >
                <div className="space-y-6">
                    {/* Progress Indicator */}
                    <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-blue-900">
                                Verification Progress
                            </span>
                            <span className="text-sm font-semibold text-blue-600">
                                {verificationProgress}/2 verified
                            </span>
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-2">
                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(verificationProgress / 2) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Message Alert */}
                    {message && (
                        <div className={`rounded-lg p-4 flex gap-2 ${message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                            {message.type === 'success' ? (
                                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            ) : (
                                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                            )}
                            <p className={message.type === 'success' ? 'text-green-700' : 'text-red-700'}>
                                {message.text}
                            </p>
                        </div>
                    )}

                    {/* Verification Info Cards */}
                    <div className="space-y-3">
                        {/* Email Card */}
                        <div className={`border rounded-lg p-4 ${emailVerified ? 'bg-green-50 border-green-200' : 'border-gray-200'}`}>
                            <div className="flex items-center gap-3">
                                {emailVerified ? (
                                    <>
                                        <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
                                        <div>
                                            <h3 className="font-semibold text-green-900">Email Verified</h3>
                                            <p className="text-sm text-green-700">{user.email}</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <Mail className="h-6 w-6 text-indigo-600 flex-shrink-0" />
                                        <div>
                                            <h3 className="font-semibold">Email</h3>
                                            <p className="text-sm text-muted-foreground">{user.email}</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Phone Card */}
                        <div className={`border rounded-lg p-4 ${phoneVerified ? 'bg-green-50 border-green-200' : 'border-gray-200'}`}>
                            <div className="flex items-center gap-3">
                                {phoneVerified ? (
                                    <>
                                        <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
                                        <div>
                                            <h3 className="font-semibold text-green-900">Phone Verified</h3>
                                            <p className="text-sm text-green-700">{maskPhoneNumber(user.phone || '')}</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <MessageCircle className="h-6 w-6 text-blue-600 flex-shrink-0" />
                                        <div>
                                            <h3 className="font-semibold">Phone</h3>
                                            <p className="text-sm text-muted-foreground">{maskPhoneNumber(user.phone || '')}</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Verification Code Input */}
                    {!isFullyVerified && (
                        <div className="space-y-4 border-t pt-6">
                            <div className="text-center">
                                <p className="text-sm text-muted-foreground mb-2">
                                    Enter the 6-digit code sent to both your email and phone
                                </p>
                            </div>

                            <Form method="post" action="/verify-email" resetOnSuccess={['code']}>
                                {({ processing, errors }) => (
                                    <div className="space-y-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="code">Verification Code</Label>
                                            <Input
                                                id="code"
                                                type="text"
                                                name="code"
                                                placeholder="000000"
                                                maxLength={6}
                                                inputMode="numeric"
                                                value={code}
                                                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                                                className="text-center text-2xl tracking-widest"
                                                autoFocus
                                            />
                                            <InputError message={errors.code} />
                                        </div>

                                        <Button
                                            type="submit"
                                            className="w-full"
                                            disabled={processing || code.length !== 6}
                                        >
                                            {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                            Verify Code
                                        </Button>
                                    </div>
                                )}
                            </Form>

                            {/* Resend Section */}
                            <div className="space-y-3 border-t pt-6">
                                <p className="text-sm text-center text-muted-foreground">
                                    Didn't receive the code?
                                </p>
                                <Button
                                    onClick={handleResendAll}
                                    variant="outline"
                                    className="w-full"
                                    disabled={isResending || !canResend}
                                >
                                    {isResending && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                    {!canResend ? `Resend in ${resendCountdown}s` : 'Resend Code'}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Success Message */}
                    {isFullyVerified && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                            <div className="flex justify-center mb-2">
                                <CheckCircle2 className="h-8 w-8 text-green-600" />
                            </div>
                            <h3 className="font-semibold text-green-900 mb-1">Account Verified!</h3>
                            <p className="text-sm text-green-700">
                                Both your email and phone have been verified. Redirecting to marketplace...
                            </p>
                        </div>
                    )}

                    <p className="text-xs text-center text-muted-foreground">
                        The code expires in 15 minutes and can be used for both email and phone verification.
                    </p>
                </div>
            </AuthLayout>
        </>
    );
}