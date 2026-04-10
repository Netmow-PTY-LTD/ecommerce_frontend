"use client";

let currentCurrency: string = '';

export function setGlobalCurrency(currency: string) {
    currentCurrency = currency;
}

export function getGlobalCurrency(): string {
    return currentCurrency;
}

export function formatCurrency(amount: number, currency?: string): string {
    const cur = currency || currentCurrency || 'USD';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: cur,
    }).format(amount);
}
