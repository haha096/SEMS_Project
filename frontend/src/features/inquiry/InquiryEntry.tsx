import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import InquiryUserPage from './InquiryUserPage';
import InquiryAdminPage from './InquiryAdminPage';

export default function InquiryEntry() {
    const { user } = useAuth();
    if (!user) return <Navigate to="/monitoring" replace />; // 안전망
    return user.isAdmin ? <InquiryAdminPage/> : <InquiryUserPage/>;
}
