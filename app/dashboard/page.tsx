'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardClient from '@/components/Dashboard';

export default function DashboardPage() {
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('canvas_token');
        if (!token) {
            router.push('/');
        }
    }, [router]);

    return <DashboardClient />;
}
