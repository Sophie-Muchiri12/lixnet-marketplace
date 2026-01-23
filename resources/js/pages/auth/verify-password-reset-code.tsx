import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { login } from '@/routes';
import { Form, Head } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';

export default function VerifyPasswordResetCode() {
    return (
        <AuthLayout
            title="Verify reset code"
            description="Enter your email and the 6-digit code we sent to verify your identity."
        >
            <Head title="Reset password - Verify code" />

            <div className="space-y-6">
                <Form method="post" action="/password-reset/verify-code" resetOnSuccess={['email', 'code']}>
                    {({ processing, errors }) => (
                        <div className="space-y-6">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    autoComplete="email"
                                    placeholder="email@example.com"
                                    autoFocus
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="code">Verification Code</Label>
                                <Input
                                    id="code"
                                    type="text"
                                    name="code"
                                    placeholder="000000"
                                    maxLength={6}
                                    inputMode="numeric"
                                    className="text-center text-2xl tracking-widest"
                                />
                                <InputError message={errors.code} />
                            </div>

                            <Button className="w-full" disabled={processing}>
                                {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                Verify Code
                            </Button>
                        </div>
                    )}
                </Form>

                <div className="space-y-3 text-center text-sm text-muted-foreground">
                    <p>Remember your password?</p>
                    <TextLink href={login}>
                        Back to login
                    </TextLink>
                </div>
            </div>
        </AuthLayout>
    );
}