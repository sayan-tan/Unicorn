'use client';

import LoginCard from '../../components/LoginCard';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '../../services/auth';

export default function LoginPage() {
  const router = useRouter();
  useEffect(() => {
    if (authService.isAuthenticated()) {
      router.replace('/homepage');
    }
  }, [router]);
  return <LoginCard />;
} 