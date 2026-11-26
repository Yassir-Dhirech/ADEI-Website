import { Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { Layout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { HomePage } from '@/pages/HomePage';
import { NewsPage } from '@/pages/NewsPage';
import { ClubsPage } from '@/pages/ClubsPage';
import { EnsaPage } from '@/pages/EnsaPage';
import { AdeiPage } from '@/pages/AdeiPage';
import { FeedbacksPage } from '@/pages/FeedbacksPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { AdminLayout } from '@/pages/admin/AdminLayout';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { ResourceAdminPage } from '@/pages/admin/ResourceAdminPage';
import { FeedbacksAdminPage } from '@/pages/admin/FeedbacksAdminPage';
import { UsersAdminPage } from './pages/admin/UsersAdminPage';
import { ClubPresidentPage } from './pages/ClubPresidentPage';
import { EventsAdminPage } from './pages/admin/EventsAdminPage';
import { ClubsAdminPage } from './pages/admin/ClubsAdminPage';
import { FilieresAdminPage } from './pages/admin/FilieresAdminPage';
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage';

export default function App() {
  return (
    <>
      <Toaster richColors position="top-right" />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/events" element={<Navigate to="/news?tab=events" replace />} />
          <Route path="/event" element={<Navigate to="/news?tab=events" replace />} />
          <Route path="/clubs" element={<ClubsPage />} />
          <Route path="/ensa" element={<EnsaPage />} />
          <Route path="/adei" element={<AdeiPage />} />
          <Route path="/feedbacks" element={<FeedbacksPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}/>
          <Route path="/president/dashboard" element={<ProtectedRoute><ClubPresidentPage /></ProtectedRoute>} />
          <Route path="/club-president" element={<Navigate to="/president/dashboard" replace />} />
          <Route path="/admin" element={
              <ProtectedRoute requireAdmin>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="president/dashboard" element={<Navigate to="/president/dashboard" replace />} />
            <Route index element={<AdminDashboardPage />} />
            <Route
              path="news"
              element={
                <ResourceAdminPage
                  title="Actualités"
                  endpoint="/news"
                  queryKey="news"
                  titleField="title"
                  subtitleField="date"
                  canReorder
                  multipart
                  fields={[
                    { name: 'title', label: 'Titre', required: true },
                    { name: 'date', label: 'Date', type: 'date', required: true },
                    { name: 'category', label: 'Catégorie' },
                    { name: 'organizer', label: 'Organisateur (ex: ADEI)' },
                    { name: 'link', label: 'Lien externe (https://...)' },
                    { name: 'image', label: 'Image (JPG/PNG/WebP)', type: 'file', accept: 'image/*' },
                    { name: 'document', label: 'Document joint (PDF/DOCX)', type: 'file', accept: '.pdf,.doc,.docx,.txt' },
                    { name: 'content', label: 'Contenu', type: 'textarea', required: true }
                  ]}
                />
              }
            />
            <Route path="events" element={<EventsAdminPage />} />
            <Route path="clubs" element={<ClubsAdminPage />} />
            <Route path="filieres" element={<FilieresAdminPage />} />
            <Route
              path="partners"
              element={
                <ResourceAdminPage
                  title="Partenaires"
                  endpoint="/partners"
                  queryKey="partners"
                  titleField="name"
                  subtitleField="website"
                  canReorder
                  multipart
                  fields={[
                    { name: 'name', label: 'Nom', required: true },
                    { name: 'website', label: 'Site web' },
                    { name: 'logo', label: 'Logo (JPG/PNG/WebP)', type: 'file', accept: 'image/*' },
                    { name: 'description', label: 'Description', type: 'textarea' }
                  ]}
                />
              }
            />
            <Route
              path="adei-members"
              element={
                <ResourceAdminPage
                  title="Membres & Bureaux ADEI"
                  endpoint="/adei-members"
                  queryKey="adei-members"
                  titleField="name"
                  subtitleField="role"
                  badgeField="mandate"
                  multipart
                  fields={[
                    { name: 'name', label: 'Nom complet', required: true },
                    {
                      name: 'role',
                      label: 'Rôle dans le Bureau',
                      type: 'select',
                      required: true,
                      defaultValue: 'President',
                      options: [
                        'President',
                        'Vice President',
                        'Secrétaire Générale',
                        'Trésorier',
                        'Conseillers',
                        'IT Manager',
                        'IT Team',
                        'Représentant des étudiants étrangers',
                        'Représentant des Lauréats',
                        'Affaires Administratives',
                        'Responsable Media',
                        'Responsable Interne',
                        'Responsables Sponsoring',
                        'Responsables Création & Design'
                      ]
                    },
                    {
                      name: 'mandate',
                      label: 'Mandat / Année (ex: 2025/2026)',
                      defaultValue: '2025/2026',
                      required: true
                    },
                    { name: 'email', label: 'Email', type: 'email', required: true },
                    { name: 'photo', label: 'Photo (JPG/PNG/WebP)', type: 'file', accept: 'image/*' }
                  ]}
                />
              }
            />
            <Route
              path="adei-roles"
              element={
                <ResourceAdminPage
                  title="Rôles ADEI"
                  endpoint="/adei-roles"
                  queryKey="adei-roles"
                  titleField="name"
                  subtitleField="tier"
                  fields={[
                    { name: 'name', label: 'Nom du rôle', required: true },
                    { name: 'tier', label: 'Niveau (1-3)', type: 'number' },
                    { name: 'position', label: 'Position', type: 'number' }
                  ]}
                />
              }
            />
            <Route path="users" element={<UsersAdminPage />} />
            <Route path="audit-logs" element={<AdminAuditLogsPage />} />
            <Route path="feedbacks" element={<FeedbacksAdminPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}
