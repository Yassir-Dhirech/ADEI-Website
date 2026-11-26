import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  History,
  Search,
  Download,
  CheckCircle2,
  XCircle,
  UserCheck,
  Calendar,
  Layers,
  FileText,
  Clock,
  Eye
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { Modal } from '@/components/ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AuditLogItem {
  id: number;
  userId: number | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user?: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}

interface AuditLogsResponse {
  logs: AuditLogItem[];
  total: number;
  page: number;
  totalPages: number;
}

export function AdminAuditLogsPage() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const { data, isLoading } = useQuery<AuditLogsResponse>({
    queryKey: ['admin-audit-logs', page, actionFilter, resourceFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '25');
      if (actionFilter) params.set('action', actionFilter);
      if (resourceFilter) params.set('resourceType', resourceFilter);

      const res = await apiRequest<AuditLogsResponse>(`/audit/logs?${params.toString()}`);
      return res.data || { logs: [], total: 0, page: 1, totalPages: 1 };
    }
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'USER_APPROVE':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 gap-1">
            <CheckCircle2 className="h-3 w-3" /> Approbation Compte
          </Badge>
        );
      case 'USER_REJECT':
        return (
          <Badge className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20 gap-1">
            <XCircle className="h-3 w-3" /> Rejet Inscription
          </Badge>
        );
      case 'USER_STATUS_UPDATE':
        return (
          <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 gap-1">
            <UserCheck className="h-3 w-3" /> Rôle / Statut
          </Badge>
        );
      case 'EVENT_APPROVE':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 gap-1">
            <Calendar className="h-3 w-3" /> Événement Publié
          </Badge>
        );
      case 'EVENT_REJECT':
        return (
          <Badge className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20 gap-1">
            <XCircle className="h-3 w-3" /> Événement Rejeté
          </Badge>
        );
      case 'CLUB_PROPOSAL_APPROVE':
        return (
          <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 gap-1">
            <Layers className="h-3 w-3" /> Fiche Club Validée
          </Badge>
        );
      case 'CLUB_PROPOSAL_REJECT':
        return (
          <Badge className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20 gap-1">
            <XCircle className="h-3 w-3" /> Fiche Club Rejetée
          </Badge>
        );
      case 'ROSTER_EXPORT':
        return (
          <Badge className="bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20 gap-1">
            <Download className="h-3 w-3" /> Export Roster (09-08)
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1">
            <FileText className="h-3 w-3" /> {action}
          </Badge>
        );
    }
  };

  const filteredLogs = (data?.logs || []).filter((log) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    const actor = log.user?.username?.toLowerCase() || '';
    const email = log.user?.email?.toLowerCase() || '';
    const action = log.action.toLowerCase();
    const details = JSON.stringify(log.details || {}).toLowerCase();
    return actor.includes(term) || email.includes(term) || action.includes(term) || details.includes(term);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400">
            <History className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Journal d'Audit &amp; Traçabilité
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Historique immuable des approbations de comptes, décisions de modération et exports de données personnelles (Loi 09-08).
            </p>
          </div>
        </div>
      </div>

      {/* Barre de filtres et recherche */}
      <div className="grid gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 md:grid-cols-4">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par acteur, email ou détail..."
            className="pl-9 text-xs rounded-xl"
          />
        </div>

        <div>
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="w-full h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs dark:border-zinc-800 dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-red-500"
          >
            <option value="">Toutes les actions</option>
            <option value="USER_APPROVE">Approbation Utilisateur</option>
            <option value="USER_REJECT">Rejet Utilisateur</option>
            <option value="USER_STATUS_UPDATE">Modification Rôle / Statut</option>
            <option value="EVENT_APPROVE">Publication Événement</option>
            <option value="EVENT_REJECT">Rejet Événement</option>
            <option value="CLUB_PROPOSAL_APPROVE">Validation Fiche Club</option>
            <option value="CLUB_PROPOSAL_REJECT">Rejet Fiche Club</option>
            <option value="ROSTER_EXPORT">Export Données Personnelles (Loi 09-08)</option>
          </select>
        </div>

        <div>
          <select
            value={resourceFilter}
            onChange={(e) => {
              setResourceFilter(e.target.value);
              setPage(1);
            }}
            className="w-full h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs dark:border-zinc-800 dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-red-500"
          >
            <option value="">Toutes les ressources</option>
            <option value="user">Utilisateurs</option>
            <option value="event">Événements</option>
            <option value="club">Clubs</option>
            <option value="event_roster">Émargements / Rosters</option>
          </select>
        </div>
      </div>

      {/* Tableau des logs */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-200 bg-zinc-50/75 dark:border-zinc-800 dark:bg-zinc-900/50">
              <tr>
                <th className="py-3 px-4 font-semibold text-zinc-700 dark:text-zinc-300">Horodatage</th>
                <th className="py-3 px-4 font-semibold text-zinc-700 dark:text-zinc-300">Acteur</th>
                <th className="py-3 px-4 font-semibold text-zinc-700 dark:text-zinc-300">Action</th>
                <th className="py-3 px-4 font-semibold text-zinc-700 dark:text-zinc-300">Ressource</th>
                <th className="py-3 px-4 font-semibold text-zinc-700 dark:text-zinc-300">Détails de l'opération</th>
                <th className="py-3 px-4 font-semibold text-zinc-700 dark:text-zinc-300">Adresse IP</th>
                <th className="py-3 px-4 font-semibold text-zinc-700 dark:text-zinc-300 text-right">Détails</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
                    Chargement du journal d'audit...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
                    Aucun enregistrement d'audit trouvé.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-zinc-600 dark:text-zinc-400 font-mono text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-zinc-400" />
                        {new Date(log.createdAt).toLocaleString('fr-FR')}
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap font-medium text-zinc-900 dark:text-zinc-100">
                      {log.actorEmail ? (
                        <div>
                          <span>{log.user?.username || log.actorEmail.split('@')[0]}</span>
                          <span className="block text-[10px] text-zinc-400 font-normal">
                            {log.actorEmail} {log.actorRole ? `(${log.actorRole})` : ''}
                          </span>
                        </div>
                      ) : log.user ? (
                        <div>
                          <span>{log.user.username}</span>
                          <span className="block text-[10px] text-zinc-400 font-normal">{log.user.email}</span>
                        </div>
                      ) : (
                        <span className="text-zinc-400 italic">Système / Anonyme</span>
                      )}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">{getActionBadge(log.action)}</td>

                    <td className="py-3 px-4 whitespace-nowrap text-zinc-600 dark:text-zinc-400 font-medium">
                      <span className="uppercase text-[10px] tracking-wider text-zinc-400 block font-bold">
                        {log.resourceType}
                      </span>
                      {log.resourceId ? `#${log.resourceId}` : '—'}
                    </td>

                    <td className="py-3 px-4 max-w-xs truncate text-zinc-600 dark:text-zinc-400">
                      {log.details ? (
                        <span>
                          {log.details.eventTitle ? String(log.details.eventTitle) : ''}
                          {log.details.targetUsername ? `Utilisateur: ${String(log.details.targetUsername)}` : ''}
                          {log.details.clubName ? `Club: ${String(log.details.clubName)}` : ''}
                          {log.details.exportedCount !== undefined ? ` (${log.details.exportedCount} inscrits exportés)` : ''}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-zinc-500">
                      {log.ipAddress || '—'}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        onClick={() => setSelectedLog(log)}
                        title="Examiner l'enregistrement complet"
                      >
                        <Eye className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-400" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <span className="text-xs text-zinc-500">
              Page {data.page} sur {data.totalPages} ({data.total} actions enregistrées)
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-8 text-xs rounded-xl"
              >
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="h-8 text-xs rounded-xl"
              >
                Suivant
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal d'inspection détaillée */}
      <Modal
        open={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        title="Détails de l'Enregistrement d'Audit"
      >
        {selectedLog && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Horodatage</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 font-mono">
                  {new Date(selectedLog.createdAt).toLocaleString('fr-FR')}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Action</span>
                <div>{getActionBadge(selectedLog.action)}</div>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Acteur</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  {selectedLog.user ? `${selectedLog.user.username} (${selectedLog.user.email})` : 'Système'}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Adresse IP</span>
                <span className="font-mono text-zinc-800 dark:text-zinc-200">{selectedLog.ipAddress || '—'}</span>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                Métadonnées &amp; Contexte de l'Opération (JSON)
              </span>
              <pre className="p-3 rounded-xl border border-zinc-200 bg-zinc-900 text-zinc-100 font-mono text-[11px] overflow-x-auto leading-relaxed max-h-60">
                {JSON.stringify(selectedLog.details, null, 2)}
              </pre>
            </div>

            {selectedLog.userAgent && (
              <div>
                <span className="text-[10px] font-bold text-zinc-400 block">Agent Utilisateur (Navigateur)</span>
                <span className="text-zinc-600 dark:text-zinc-400 text-[11px] break-all">{selectedLog.userAgent}</span>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
