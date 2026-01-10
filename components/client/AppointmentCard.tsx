"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Appointment {
  id: string;
  startsAt: Date;
  timezone: string;
  status: string;
  isRescheduled: boolean;
  zoomJoinUrl: string | null;
  zoomPassword: string | null;
  orderId: string;
  coach: {
    user: {
      name: string | null;
      email: string;
    };
  };
  order: {
    product: {
      name: string;
    };
  };
}

interface AppointmentCardProps {
  appointment: Appointment;
}

export function AppointmentCard({ appointment }: AppointmentCardProps) {
  const router = useRouter();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [canceling, setCanceling] = useState(false);

  const formatDateTime = (date: Date, timezone: string) => {
    return new Date(date).toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: timezone,
    });
  };

  const getStatusBadge = () => {
    if (appointment.status === "scheduled") {
      if (appointment.isRescheduled) {
        return <Badge variant="warning">Rescheduled</Badge>;
      }
      return <Badge variant="success">Scheduled</Badge>;
    }
    if (appointment.status === "canceled") {
      return <Badge variant="destructive">Canceled</Badge>;
    }
    if (appointment.status === "completed") {
      return <Badge variant="secondary">Completed</Badge>;
    }
    return <Badge variant="outline">{appointment.status}</Badge>;
  };

  const handleCancel = async () => {
    setCanceling(true);
    try {
      const response = await fetch(`/api/appointments/cancel/${appointment.id}`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to cancel appointment");
      }

      toast.success("Appointment canceled successfully");
      setShowCancelDialog(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel appointment");
      setCanceling(false);
    }
  };

  const isPast = new Date(appointment.startsAt) < new Date();
  const isScheduled = appointment.status === "scheduled";
  const isCanceled = appointment.status === "canceled";

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            {/* Header: Title + Status Badge */}
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-foreground mb-3">
                  {appointment.order.product.name}
                </h3>

                <div className="space-y-2 text-sm">
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="font-medium text-foreground">Coach:</span>{" "}
                    {appointment.coach.user.name || appointment.coach.user.email}
                  </p>
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium text-foreground">Time:</span>{" "}
                    {formatDateTime(appointment.startsAt, appointment.timezone)}
                  </p>
                </div>
              </div>

              <div className="flex-shrink-0">
                {getStatusBadge()}
              </div>
            </div>

            {/* Zoom Join Section */}
            {appointment.zoomJoinUrl && isScheduled && (
              <div className="pt-4 border-t border-border">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button asChild variant="info" size="lg" className="flex-1 sm:flex-initial shadow-md">
                    <a
                      href={appointment.zoomJoinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Join Zoom Meeting
                    </a>
                  </Button>
                  {!isPast && (
                    <Button
                      variant="destructive"
                      size="lg"
                      onClick={() => setShowCancelDialog(true)}
                      className="flex-1 sm:flex-initial"
                    >
                      Cancel Session
                    </Button>
                  )}
                </div>
                {appointment.zoomPassword && (
                  <p className="text-sm text-muted-foreground mt-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Password: <code className="bg-muted px-2 py-0.5 rounded text-foreground font-mono text-xs">{appointment.zoomPassword}</code>
                  </p>
                )}
              </div>
            )}

            {/* No Zoom Link Yet */}
            {!appointment.zoomJoinUrl && isScheduled && !isPast && (
              <div className="pt-4 border-t border-border">
                <div className="bg-warning/10 border-l-4 border-l-warning rounded-md p-4 mb-3">
                  <p className="text-sm text-foreground flex items-center gap-2">
                    <svg className="w-5 h-5 text-warning flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>Zoom link will appear before the session</span>
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="lg"
                  onClick={() => setShowCancelDialog(true)}
                  className="w-full sm:w-auto"
                >
                  Cancel Session
                </Button>
              </div>
            )}

            {/* Canceled - Rebook Option */}
            {isCanceled && (
              <div className="pt-4 border-t border-border">
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link href={`/client/book/${appointment.orderId}`}>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Reschedule Appointment
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Appointment?</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your session for{" "}
              <strong>{formatDateTime(appointment.startsAt, appointment.timezone)}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="bg-warning/10 border border-warning/20 rounded-md p-4">
            <p className="text-sm text-foreground">
              You can reschedule after canceling, but the coach will be notified.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowCancelDialog(false)} disabled={canceling}>
              Keep Appointment
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={canceling}>
              {canceling ? "Canceling..." : "Yes, Cancel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

