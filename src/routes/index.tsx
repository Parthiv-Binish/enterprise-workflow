// src/routes/index.tsx

import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { AuthLayout } from '@/components/layout/auth-layout';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { LoadingSpinner } from '@/components/common/loading-spinner';

const Dashboard = lazy(() => import('@/pages/dashboard'));
const Tasks = lazy(() => import('@/pages/tasks'));
const TaskDetail = lazy(() => import('@/pages/tasks/[id]'));
const TaskNew = lazy(() => import('@/pages/tasks/new'));
const Teams = lazy(() => import('@/pages/teams'));
const TeamDetail = lazy(() => import('@/pages/teams/[id]'));
const Calendar = lazy(() => import('@/pages/calendar'));
const Reports = lazy(() => import('@/pages/reports'));
const Activity = lazy(() => import('@/pages/activity'));
const Notifications = lazy(() => import('@/pages/notifications'));
const Settings = lazy(() => import('@/pages/settings'));
const Profile = lazy(() => import('@/pages/profile'));
const Users = lazy(() => import('@/pages/users'));
const AuditLogs = lazy(() => import('@/pages/audit-logs'));

const Login = lazy(() => import('@/pages/auth/login'));
const Register = lazy(() => import('@/pages/auth/register'));
const ForgotPassword = lazy(() => import('@/pages/auth/forgot-password'));
const ResetPassword = lazy(() => import('@/pages/auth/reset-password'));

const Landing = lazy(() => import('@/pages/landing'));
const Pricing = lazy(() => import('@/pages/pricing'));
const Features = lazy(() => import('@/pages/features'));

const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>
);

export const router = createBrowserRouter([
  {
    path: '/',
    children: [
      {
        index: true,
        element: (
          <PageWrapper>
            <Landing />
          </PageWrapper>
        ),
      },
      {
        path: 'pricing',
        element: (
          <PageWrapper>
            <Pricing />
          </PageWrapper>
        ),
      },
      {
        path: 'features',
        element: (
          <PageWrapper>
            <Features />
          </PageWrapper>
        ),
      },

      {
        path: 'auth',
        element: <AuthLayout />,
        children: [
          {
            path: 'login',
            element: (
              <PageWrapper>
                <Login />
              </PageWrapper>
            ),
          },
          {
            path: 'register',
            element: (
              <PageWrapper>
                <Register />
              </PageWrapper>
            ),
          },
          {
            path: 'forgot-password',
            element: (
              <PageWrapper>
                <ForgotPassword />
              </PageWrapper>
            ),
          },
          {
            path: 'reset-password',
            element: (
              <PageWrapper>
                <ResetPassword />
              </PageWrapper>
            ),
          },
        ],
      },

      {
        element: (
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        ),
        children: [
          {
            path: 'dashboard',
            element: (
              <PageWrapper>
                <Dashboard />
              </PageWrapper>
            ),
          },
          {
            path: 'tasks',
            element: (
              <PageWrapper>
                <Tasks />
              </PageWrapper>
            ),
          },
          {
            path: 'tasks/new',
            element: (
              <PageWrapper>
                <TaskNew />
              </PageWrapper>
            ),
          },
          {
            path: 'tasks/:id',
            element: (
              <PageWrapper>
                <TaskDetail />
              </PageWrapper>
            ),
          },
          {
            path: 'teams',
            element: (
              <PageWrapper>
                <Teams />
              </PageWrapper>
            ),
          },
          {
            path: 'teams/:id',
            element: (
              <PageWrapper>
                <TeamDetail />
              </PageWrapper>
            ),
          },
          {
            path: 'calendar',
            element: (
              <PageWrapper>
                <Calendar />
              </PageWrapper>
            ),
          },
          {
            path: 'reports',
            element: (
              <PageWrapper>
                <Reports />
              </PageWrapper>
            ),
          },
          {
            path: 'activity',
            element: (
              <PageWrapper>
                <Activity />
              </PageWrapper>
            ),
          },
          {
            path: 'notifications',
            element: (
              <PageWrapper>
                <Notifications />
              </PageWrapper>
            ),
          },
          {
            path: 'settings',
            element: (
              <PageWrapper>
                <Settings />
              </PageWrapper>
            ),
          },
          {
            path: 'profile',
            element: (
              <PageWrapper>
                <Profile />
              </PageWrapper>
            ),
          },
          {
            path: 'users',
            element: (
              <PageWrapper>
                <Users />
              </PageWrapper>
            ),
          },
          {
            path: 'audit-logs',
            element: (
              <PageWrapper>
                <AuditLogs />
              </PageWrapper>
            ),
          },
          {
            path: '*',
            element: <Navigate to="/dashboard" replace />,
          },
        ],
      },

      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);
