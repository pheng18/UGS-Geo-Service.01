import React from 'react';
import {
  Wrench,
  FolderKanban,
  X,
  ArrowRight,
  UserCheck,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AppNotification } from '../types';

export const NotificationToastStack: React.FC = () => {
  const {
    activeToastNotifications,
    dismissToastNotification,
    markNotificationAsRead,
    repairs,
    projects,
    selectRepair,
    selectProject,
    navigateTo
  } = useApp();

  if (activeToastNotifications.length === 0) return null;

  const handleOpenTarget = (notif: AppNotification) => {
    markNotificationAsRead(notif.id);
    dismissToastNotification(notif.id);

    if (
      (notif.category === 'repair_assigned' || notif.category === 'repair_status') &&
      notif.targetId
    ) {
      const foundRepair = repairs.find((r) => r.id === notif.targetId);
      if (foundRepair) {
        selectRepair(foundRepair);
        return;
      }
      navigateTo('repairs');
      return;
    }

    if (notif.category === 'project_status' && notif.targetId) {
      const foundProject = projects.find((p) => p.id === notif.targetId);
      if (foundProject) {
        selectProject(foundProject);
        return;
      }
      navigateTo('projects');
    }
  };

  return (
    <div
      data-testid="notification_toast_stack"
      className="fixed top-16 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-[calc(100vw-2rem)] pointer-events-none"
    >
      {activeToastNotifications.map((notif) => {
        const isRepair =
          notif.category === 'repair_assigned' || notif.category === 'repair_status';

        return (
          <div
            key={notif.id}
            className={`pointer-events-auto rounded-2xl p-4 shadow-xl border backdrop-blur-md transition-all animate-in slide-in-from-right-5 fade-in duration-200 ${
              isRepair
                ? 'bg-slate-900/95 text-white border-blue-500/50'
                : 'bg-slate-900/95 text-white border-amber-500/50'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isRepair
                    ? 'bg-blue-600/30 text-blue-300 border border-blue-400/40'
                    : 'bg-amber-500/30 text-amber-300 border border-amber-400/40'
                }`}
              >
                {isRepair ? (
                  <Wrench className="w-5 h-5" />
                ) : (
                  <FolderKanban className="w-5 h-5" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-white truncate">
                    {notif.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => dismissToastNotification(notif.id)}
                    className="text-slate-400 hover:text-white p-0.5 rounded-lg cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-300 mt-1 leading-relaxed line-clamp-2">
                  {notif.message}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 mt-2.5 pt-2 border-t border-white/10">
                  <div className="flex items-center gap-1.5">
                    {notif.isAssignedToMe && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/30 text-blue-200 border border-blue-400/30">
                        <UserCheck className="w-3 h-3" />
                        ວຽກຂອງທ່ານ
                      </span>
                    )}
                    {notif.newStatus && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/20 text-emerald-300">
                        {notif.previousStatus ? (
                          <>
                            <span>{notif.previousStatus}</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                            <span>{notif.newStatus}</span>
                          </>
                        ) : (
                          <span>{notif.newStatus}</span>
                        )}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenTarget(notif)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 hover:text-amber-200 cursor-pointer"
                  >
                    <span>ເບິ່ງລາຍລະອຽດ</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
