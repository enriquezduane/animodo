'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardClient from '@/components/Dashboard';
import { storageService } from '@/components/services/storage.service';

export default function DashboardPage() {
    const router = useRouter();

    useEffect(() => {
        const token = storageService.getCanvasToken();
        if (!token) {
            router.push('/');
        }
    }, [router]);

    return <DashboardClient />;
}
