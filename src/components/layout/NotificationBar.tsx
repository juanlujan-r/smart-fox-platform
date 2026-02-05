import React, { useState, useEffect } from 'react';
import { AlertCircle, Calendar, X } from 'lucide-react';

interface DisciplinaryAction {
  id: string;
  has_hearing: boolean;
  status: string;
}

interface Meeting {
  id: string;
  title: string;
  start_time: string;
  is_mandatory: boolean;
}

interface NotificationBarProps {
  userId: string;
  disciplinaryActions?: DisciplinaryAction[];
  meetings?: Meeting[];
}

export const NotificationBar: React.FC<NotificationBarProps> = ({
  userId,
  disciplinaryActions = [],
  meetings = [],
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [notification, setNotification] = useState<{
    type: 'danger' | 'warning';
    message: string;
    icon: React.ReactNode;
  } | null>(null);

  useEffect(() => {
    // Check for active disciplinary action with hearing
    const activeHearing = disciplinaryActions.find(
      (action) => action.has_hearing && action.status === 'active'
    );

    if (activeHearing) {
      setNotification({
        type: 'danger',
        message: '¡Atención! Tienes una citación a descargos programada',
        icon: <AlertCircle className="w-5 h-5" />,
      });
      return;
    }

    // Check for mandatory meeting in next 1 hour
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    const upcomingMeeting = meetings.find((meeting) => {
      const meetingTime = new Date(meeting.start_time);
      return (
        meeting.is_mandatory &&
        meetingTime >= now &&
        meetingTime <= oneHourLater
      );
    });

    if (upcomingMeeting) {
      setNotification({
        type: 'warning',
        message: `Reunión obligatoria en breve: ${upcomingMeeting.title}`,
        icon: <Calendar className="w-5 h-5" />,
      });
      return;
    }

    setNotification(null);
  }, [disciplinaryActions, meetings]);

  if (!isVisible || !notification) {
    return null;
  }

  const bgColor =
    notification.type === 'danger'
      ? 'bg-red-50 border-red-200'
      : 'bg-orange-50 border-orange-200';

  const textColor =
    notification.type === 'danger'
      ? 'text-red-800'
      : 'text-orange-800';

  const iconColor =
    notification.type === 'danger'
      ? 'text-red-600'
      : 'text-orange-600';

  const brandColor =
    notification.type === 'danger'
      ? 'hover:bg-red-100'
      : 'hover:bg-orange-100';

  return (
    <div
      className={`sticky top-0 z-40 w-full border-b ${bgColor} px-4 py-3 shadow-sm`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className={iconColor}>{notification.icon}</div>
          <p className={`text-sm font-medium ${textColor}`}>
            {notification.message}
          </p>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className={`p-1 rounded-md transition-colors ${brandColor}`}
          aria-label="Cerrar notificación"
        >
          <X className={`w-5 h-5 ${iconColor}`} />
        </button>
      </div>
    </div>
  );
};

export default NotificationBar;