"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export function Newsletter() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim()) {
            setStatus("error");
            setMessage("Please enter your email address.");
            return;
        }

        if (!validateEmail(email)) {
            setStatus("error");
            setMessage("Please enter a valid email address.");
            return;
        }

        setStatus("loading");
        setMessage("");

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/newsletter/subscribe`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setStatus("success");
                setMessage("Thank you for subscribing!");
                setEmail("");
            } else {
                setStatus("error");
                setMessage(data.message || "Something went wrong. Please try again.");
            }
        } catch (error) {
            setStatus("error");
            setMessage("Network error. Please check your connection and try again.");
        }
    };

    const resetStatus = () => {
        if (status === "success") {
            setStatus("idle");
            setMessage("");
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                <h4 className="font-semibold">Newsletter</h4>
            </div>
            <p className="text-sm text-muted-foreground">
                Subscribe to receive updates, access to exclusive deals, and more.
            </p>
            <form onSubmit={handleSubmit} className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            resetStatus();
                        }}
                        disabled={status === "loading" || status === "success"}
                        className="flex-1"
                        aria-label="Email address for newsletter"
                    />
                    <Button
                        type="submit"
                        disabled={status === "loading" || status === "success"}
                        size="default"
                        className="shrink-0"
                    >
                        {status === "loading" ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Subscribing...
                            </>
                        ) : status === "success" ? (
                            <>
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Subscribed
                            </>
                        ) : (
                            "Subscribe"
                        )}
                    </Button>
                </div>

                {status === "error" && (
                    <div className="flex items-center gap-2 text-sm text-destructive">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{message}</span>
                    </div>
                )}

                {status === "success" && (
                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-500">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{message}</span>
                    </div>
                )}
            </form>
        </div>
    );
}
