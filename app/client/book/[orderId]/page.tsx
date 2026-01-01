import { requireRole } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";
import { ClientNav } from "@/components/navigation/ClientNav";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { BookingCalendar } from "@/components/client/BookingCalendar";

interface BookingPageProps {
  params: Promise<{ orderId: string }>;
}

export default async function BookingPage({ params }: BookingPageProps) {
  const session = await requireRole(UserRole.client);
  const { orderId } = await params;

  // Verify order exists and belongs to client
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      clientId: session.user.id,
      status: "completed",
    },
    include: {
      product: true,
      coach: {
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      },
      appointments: {
        where: { status: { not: "canceled" } },
        take: 1,
      },
    },
  });

  if (!order) {
    redirect("/client/appointments");
  }

  if (order.product.type !== "one_on_one") {
    redirect("/client/appointments");
  }

  // Only redirect if order has active appointment
  if (order.appointments.length > 0) {
    redirect("/client/appointments");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientNav userName={session.user.name} userEmail={session.user.email} />

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Schedule Your Session
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Book your {order.product.name} with {order.coach.user.name || "your coach"}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
            <BookingCalendar orderId={order.id} coachId={order.coachId} />
          </div>

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm sm:text-base font-semibold text-blue-900 mb-2">
              📅 Booking Information
            </h3>
            <ul className="text-sm sm:text-base text-blue-800 space-y-1">
              <li>• Sessions are 60 minutes long</li>
              <li>• You'll receive a Zoom meeting link after booking</li>
              <li>• Reminders sent 5 days and 24 hours before your session</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
