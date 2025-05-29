import SettingsLayout from '@/layouts/settings/layout';
import { router, usePage } from '@inertiajs/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { toast } from 'sonner';

import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const passwordSchema = z
    .object({
        current_password: z.string().min(1, 'Current password is required'),
        password: z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .regex(
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/,
                'Password must contain lowercase, uppercase, number, and special character'
            ),
        password_confirmation: z.string().min(1, 'Password confirmation is required'),
    })
    .refine((data) => data.password === data.password_confirmation, {
        message: "Passwords don't match",
        path: ['password_confirmation'],
    });

const defaultValues = {
    current_password: '',
    password: '',
    password_confirmation: '',
};

const statusMessages = {
    'password-updated': {
        title: 'Password updated successfully!',
        description: 'Your password has been changed and saved securely.',
        type: 'success'
    },
    'password-update-failed': {
        title: 'Password update failed',
        description: 'Something went wrong. Please try again.',
        type: 'error'
    },
    'validation-failed': {
        title: 'Validation failed',
        description: 'Please correct the errors below.',
        type: 'error'
    }
};

export default function Password() {
    const { flash } = usePage().props;
    const [processing, setProcessing] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setError,
        watch,
        clearErrors,
    } = useForm({
        resolver: zodResolver(passwordSchema),
        defaultValues,
        mode: 'onChange',
    });

    const password = watch('password');
    const passwordConfirmation = watch('password_confirmation');

    // Handle flash messages with toast
    useEffect(() => {
        if (flash?.status && statusMessages[flash.status]) {
            const { title, description, type } = statusMessages[flash.status];
            
            switch (type) {
                case 'success':
                    toast.success(title, { description });
                    break;
                case 'error':
                    toast.error(title, { description });
                    break;
                default:
                    toast(title, { description });
            }
            
            // Reset form on successful password update
            if (flash.status === 'password-updated') {
                reset(defaultValues);
                clearErrors();
            }
        }
    }, [flash?.status, flash?.message, reset, clearErrors]);

    const onSubmit = useCallback(async (data) => {
        setProcessing(true);

        // Show loading toast
        const loadingToast = toast.loading("Updating password...", {
            description: "Please wait while we save your new password.",
        });

        router.put("/settings/password", data, {
            preserveScroll: true,
            onSuccess: () => {
                toast.dismiss(loadingToast);
                // Success will be handled by the flash message effect
            },
            onError: (errors) => {
                toast.dismiss(loadingToast);
                
                // Show error toast
                toast.error("Failed to update password", {
                    description: "Please check the errors below and try again.",
                });
                
                // Reset sensitive fields on error
                const sensitiveFields = ['current_password'];
                if (errors.password || errors.password_confirmation) {
                    sensitiveFields.push('password', 'password_confirmation');
                }
                
                const fieldsToReset = Object.fromEntries(
                    sensitiveFields.map(field => [field, ''])
                );
                
                reset(prev => ({ ...prev, ...fieldsToReset }));

                // Set server errors
                Object.entries(errors).forEach(([key, message]) => {
                    setError(key, {
                        type: 'server',
                        message: Array.isArray(message) ? message[0] : message,
                    });
                });
            },
            onFinish: () => setProcessing(false),
        });
        reset(defaultValues);
    }, [reset, setError]);

    const passwordStrength = useMemo(() => {
        if (!password) return { strength: 0, label: '', color: '' };
        
        const checks = [
            password.length >= 8,
            /[a-z]/.test(password),
            /[A-Z]/.test(password),
            /\d/.test(password),
            /[!@#$%^&*(),.?":{}|<>]/.test(password),
            password.length >= 12,
        ];
        
        const strength = checks.filter(Boolean).length;
        
        if (strength <= 2) return { strength, label: 'Weak', color: 'bg-red-500' };
        if (strength <= 4) return { strength, label: 'Fair', color: 'bg-yellow-500' };
        if (strength <= 5) return { strength, label: 'Good', color: 'bg-blue-500' };
        return { strength, label: 'Strong', color: 'bg-green-500' };
    }, [password]);

    const showPasswordMismatch = password && passwordConfirmation && 
        password !== passwordConfirmation && !errors.password_confirmation;

    const handleCancelChanges = () => {
        reset(defaultValues);
        clearErrors();
        toast.info("Form cleared", {
            description: "All password fields have been reset.",
        });
    };

    const hasFormData = password || passwordConfirmation || watch('current_password');

    return (
        <SettingsLayout>
            <div className="space-y-6">
                <HeadingSmall
                    title="Update password"
                    description="Ensure your account is using a long, random password to stay secure"
                />

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="current_password">Current password</Label>
                        <Input
                            id="current_password"
                            {...register('current_password')}
                            type="password"
                            autoComplete="current-password"
                            placeholder="Enter current password"
                            disabled={processing}
                            className={errors.current_password ? "border-red-500" : ""}
                        />
                        {errors.current_password && (
                            <p className="text-sm text-red-600">
                                {errors.current_password.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">New password</Label>
                        <Input
                            id="password"
                            {...register('password')}
                            type="password"
                            autoComplete="new-password"
                            placeholder="Enter new password"
                            disabled={processing}
                            className={errors.password ? "border-red-500" : ""}
                        />
                        
                        {password && (
                            <div className="mt-2">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                                            style={{ width: `${(passwordStrength.strength / 6) * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-xs font-medium text-gray-600">
                                        {passwordStrength.label}
                                    </span>
                                </div>
                            </div>
                        )}
                        
                        {errors.password && (
                            <p className="text-sm text-red-600">
                                {errors.password.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password_confirmation">Confirm password</Label>
                        <Input
                            id="password_confirmation"
                            {...register('password_confirmation')}
                            type="password"
                            autoComplete="new-password"
                            placeholder="Confirm new password"
                            disabled={processing}
                            className={errors.password_confirmation || showPasswordMismatch ? "border-red-500" : ""}
                        />
                        
                        {showPasswordMismatch && (
                            <p className="text-sm text-orange-600">
                                Passwords don't match
                            </p>
                        )}
                        
                        {errors.password_confirmation && (
                            <p className="text-sm text-red-600">
                                {errors.password_confirmation.message}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        <Button 
                            disabled={processing} 
                            type="submit"
                            className="min-w-32"
                        >
                            {processing ? 'Updating...' : 'Update password'}
                        </Button>
                        
                        {hasFormData && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCancelChanges}
                                disabled={processing}
                            >
                                Clear form
                            </Button>
                        )}
                    </div>
                </form>
            </div>
        </SettingsLayout>
    );
}