"use client";

import { formatCurrency as formatCurrencyUtil } from './utils';

let currentCurrency: string = '';

export function setGlobalCurrency(currency: string) {
    currentCurrency = currency;
}

export function getGlobalCurrency(): string {
    return currentCurrency;
}

export function formatCurrency(amount: number, currency?: string): string {
    return formatCurrencyUtil(amount, currency || currentCurrency || 'USD');
}
