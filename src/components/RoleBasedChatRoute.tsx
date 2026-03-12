import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AdminChatPage } from '../pages/Chat/AdminChatPage';
import { ClientChatPage } from '../pages/Chat/ClientChatPage';

export const RoleBasedChatRoute: React.FC = () => {
  const { user } = useAuth();
  
  if (user?.role === 'admin') {
    return <AdminChatPage />;
  }
  
  return <ClientChatPage />;
};
