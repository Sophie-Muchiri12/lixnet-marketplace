import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { Form, Head } from '@inertiajs/react';
import { LoaderCircle, Mail } from 'lucide-react';

interface Props {
    user?: {
        id: number;
        name: string;
        email: string;
    };
}

export default function VerifyCode({ user }: Props) {
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

    return (
        <>
            <Head title="Verify Email" />
            <AuthLayout
                title="Verify your email"
                description={`We sent a 6-digit code to ${user.email}`}
            >
                <div className="space-y-6">
                    <div className="flex justify-center">
                        <div className="rounded-full bg-indigo-100 p-4">
                            <Mail className="h-8 w-8 text-indigo-600" />
                        </div>
                    </div>

                    <Form method="post" action="/verify-email" resetOnSuccess={['code']}>
                        {({ processing, errors }) => (
                            <div className="space-y-6">
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
                                        autoFocus
                                    />
                                    <InputError message={errors.code} />
                                </div>

                                <Button className="w-full" disabled={processing}>
                                    {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                    Verify Email
                                </Button>
                            </div>
                        )}
                    </Form>

                    <div className="space-y-3 border-t pt-6">
                        <p className="text-sm text-center text-muted-foreground">
                            Didn't receive the code?
                        </p>
                        <Form method="post" action="/verify-email/resend">
                            {({ processing }) => (
                                <Button 
                                    type="submit" 
                                    variant="outline" 
                                    className="w-full" 
                                    disabled={processing}
                                >
                                    {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                    Resend Code
                                </Button>
                            )}
                        </Form>
                    </div>

                    <p className="text-xs text-center text-muted-foreground">
                        The code will expire in 15 minutes
                    </p>
                </div>
            </AuthLayout>
        </>
    );
}