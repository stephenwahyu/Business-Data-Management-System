import { router, usePage } from "@inertiajs/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";

import HeadingSmall from "@/components/heading-small";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SettingsLayout from "@/layouts/settings/layout";

const profileSchema = z.object({
    name: z
        .string()
        .min(1, "Name is required")
        .max(255, "Name must not exceed 255 characters")
        .regex(/^[a-zA-Z\s]+$/, "Name may only contain letters and spaces")
        .trim(),
    email: z
        .string()
        .email("Please enter a valid email address")
        .max(255, "Email must not exceed 255 characters")
        .toLowerCase(),
});

const statusMessages = {
    'profile-updated': {
        title: 'Profile updated successfully!',
        description: 'Your changes have been saved.',
        type: 'success'
    },
    'profile-updated-email-changed': {
        title: 'Profile updated successfully!',
        description: 'Please verify your new email address.',
        type: 'success'
    },
    'no-changes': {
        title: 'No changes detected',
        description: 'Make some changes before saving.',
        type: 'info'
    },
    'update-failed': {
        title: 'Update failed',
        description: 'Something went wrong. Please try again.',
        type: 'error'
    },
    'validation-failed': {
        title: 'Validation failed',
        description: 'Please correct the errors below.',
        type: 'error'
    }
};

export default function Profile() {
    const { auth, flash } = usePage().props;
    const [processing, setProcessing] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isDirty },
        setError,
        reset,
        clearErrors,
    } = useForm({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: auth.user?.name || "",
            email: auth.user?.email || "",
        },
        mode: "onBlur",
    });

    // Handle flash messages with toast
    useEffect(() => {
        if (flash?.status && statusMessages[flash.status]) {
            const { title, description, type } = statusMessages[flash.status];
            
            switch (type) {
                case 'success':
                    toast.success(title, { description });
                    break;
                case 'info':
                    toast.info(title, { description });
                    break;
                case 'error':
                    toast.error(title, { description });
                    break;
                default:
                    toast(title, { description });
            }
            
            // Reset form to current user data on successful update
            if (flash.status === 'profile-updated' || flash.status === 'profile-updated-email-changed') {
                reset({
                    name: auth.user?.name || "",
                    email: auth.user?.email || "",
                });
                clearErrors();
            }
        }
    }, [flash?.status, flash?.message, auth.user, reset, clearErrors]);

    const onSubmit = useCallback((data) => {
        if (!isDirty) {
            toast.info("No changes detected", {
                description: "Make some changes before saving.",
            });
            return;
        }

        setProcessing(true);
        
        // Show loading toast
        const loadingToast = toast.loading("Updating profile...", {
            description: "Please wait while we save your changes.",
        });

        router.patch("/settings/profile", data, {
            preserveScroll: true,
            onSuccess: () => {
                toast.dismiss(loadingToast);
                // Success will be handled by the flash message effect
            },
            onError: (errors) => {
                toast.dismiss(loadingToast);
                
                // Show specific error toast
                toast.error("Failed to update profile", {
                    description: "Please check the errors below and try again.",
                });
                
                // Set server validation errors
                Object.entries(errors).forEach(([key, message]) => {
                    setError(key, {
                        type: "server",
                        message: Array.isArray(message) ? message[0] : message,
                    });
                });
            },
            onFinish: () => {
                setProcessing(false);
            },
        });
    }, [isDirty, setError]);

    return (
        <SettingsLayout>
            <div className="space-y-6">
                <HeadingSmall
                    title="Profile information"
                    description="Update your name and email address"
                />

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            {...register("name")}
                            autoComplete="name"
                            placeholder="Enter your full name"
                            disabled={processing}
                            className={errors.name ? "border-red-500" : ""}
                        />
                        {errors.name && (
                            <p className="text-sm text-red-600">
                                {errors.name.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email address</Label>
                        <Input
                            id="email"
                            type="email"
                            {...register("email")}
                            autoComplete="username"
                            placeholder="Enter your email address"
                            disabled={processing}
                            className={errors.email ? "border-red-500" : ""}
                        />
                        {errors.email && (
                            <p className="text-sm text-red-600">
                                {errors.email.message}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        <Button
                            disabled={processing || !isDirty}
                            type="submit"
                            className="min-w-24"
                        >
                            {processing ? "Saving..." : "Save"}
                        </Button>
                        
                        {isDirty && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    reset({
                                        name: auth.user?.name || "",
                                        email: auth.user?.email || "",
                                    });
                                    clearErrors();
                                    toast.info("Changes discarded", {
                                        description: "Form has been reset to original values.",
                                    });
                                }}
                                disabled={processing}
                            >
                                Cancel
                            </Button>
                        )}
                    </div>
                </form>
            </div>
        </SettingsLayout>
    );
}