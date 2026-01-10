import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

interface CoachProfilePageProps {
  params: Promise<{ coachId: string }>;
}

export default async function CoachProfilePage({ params }: CoachProfilePageProps) {
  const session = await getSession();
  const { coachId } = await params;

  // Get coach with products
  const coach = await prisma.coach.findUnique({
    where: { id: coachId },
    include: {
      user: {
        select: {
          name: true,
        },
      },
      products: {
        where: { isActive: true },
        include: {
          prices: {
            where: { isActive: true },
            orderBy: { amountCents: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      availability: {
        where: { isActive: true },
      },
    },
  });

  if (!coach) {
    notFound();
  }

  // Get next 3 available slots for the next 7 days
  const availableSlots: Array<{ startTime: Date; endTime: Date }> = [];
  const today = new Date();
  
  for (let i = 0; i < 7 && availableSlots.length < 3; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() + i);
    checkDate.setHours(0, 0, 0, 0);

    // Get day of week (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeek = checkDate.getDay();
    
    // Check if coach has availability for this day
    const hasAvailability = coach.availability.some(
      (avail) => avail.dayOfWeek === dayOfWeek && avail.isActive
    );

    if (hasAvailability) {
      try {
        // Get existing appointments for this day
        const startOfDay = new Date(checkDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(checkDate);
        endOfDay.setHours(23, 59, 59, 999);

        const existingAppointments = await prisma.appointment.findMany({
          where: {
            coachId,
            startsAt: { gte: startOfDay, lte: endOfDay },
            status: "scheduled",
          },
          select: { startsAt: true, endsAt: true },
        });

        // Generate slots for this day
        const dayAvailability = coach.availability.filter(
          (avail) => avail.dayOfWeek === dayOfWeek && avail.isActive
        );

        for (const avail of dayAvailability) {
          if (availableSlots.length >= 3) break;

          const [startHour, startMin] = avail.startTime.split(":").map(Number);
          const [endHour, endMin] = avail.endTime.split(":").map(Number);

          let currentSlotStart = new Date(checkDate);
          currentSlotStart.setHours(startHour, startMin, 0, 0);

          const availEnd = new Date(checkDate);
          availEnd.setHours(endHour, endMin, 0, 0);

          // Generate hourly slots
          while (currentSlotStart < availEnd && availableSlots.length < 3) {
            const slotEnd = new Date(currentSlotStart.getTime() + 60 * 60 * 1000);

            // Skip past slots
            if (currentSlotStart < new Date()) {
              currentSlotStart = slotEnd;
              continue;
            }

            // Check if slot conflicts with existing appointment
            const hasConflict = existingAppointments.some(
              (appt) => appt.startsAt < slotEnd && appt.endsAt > currentSlotStart
            );

            if (!hasConflict && slotEnd <= availEnd) {
              availableSlots.push({
                startTime: new Date(currentSlotStart),
                endTime: slotEnd,
              });
            }

            currentSlotStart = slotEnd;
          }
        }
      } catch (error) {
        console.error("Error fetching slots for date:", checkDate, error);
      }
    }
  }

  // If logged in as client, check for eligible orders (completed orders for 1:1 products)
  let eligibleOrders: Array<{ id: string; productId: string; hasAppointment: boolean }> = [];
  if (session?.user) {
    const orders = await prisma.order.findMany({
      where: {
        clientId: session.user.id,
        coachId: coach.id,
        status: "completed",
        product: {
          type: "one_on_one",
        },
      },
      include: {
        appointments: {
          where: { status: { not: "canceled" } },
        },
      },
    });

    eligibleOrders = orders.map((order) => ({
      id: order.id,
      productId: order.productId,
      hasAppointment: order.appointments.length > 0,
    }));
  }

  const formatPrice = (amountCents: number, currency: string) => {
    const amount = (amountCents / 100).toFixed(2);
    const symbol = currency === "usd" ? "$" : currency.toUpperCase();
    return `${symbol}${amount}`;
  };

  const formatInterval = (interval: string | null, intervalCount: number | null) => {
    if (!interval) return "";
    const count = intervalCount || 1;
    return count === 1 ? `/${interval}` : ` every ${count} ${interval}s`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-foreground">
                SOZOFITNESS
              </Link>
              <span className="mx-3 text-muted-foreground">/</span>
              <Link href="/discover" className="text-sm text-muted-foreground hover:text-foreground">
                Discover
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              {session ? (
                <>
                  <Link href="/app" className="text-sm text-muted-foreground hover:text-foreground">
                    Dashboard
                  </Link>
                  <Link
                    href="/api/auth/signout"
                    className="text-sm text-primary hover:text-primary/90"
                  >
                    Sign out
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
                    Sign in
                  </Link>
                  <Link
                    href="/signup"
                    className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Coach Header */}
        <div className="bg-card rounded-lg shadow-lg overflow-hidden mb-8 border border-border">
          <div className="p-8">
            <div className="flex items-start gap-6 mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-4xl font-bold flex-shrink-0">
                {(coach.user.name || "C")[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {coach.user.name || "Coach"}
                </h1>
                {coach.bio && <p className="text-muted-foreground leading-relaxed">{coach.bio}</p>}
              </div>
            </div>

            <div className="flex gap-4 text-sm text-muted-foreground border-t border-border pt-6">
              <div>
                <span className="font-semibold text-foreground">{coach.products.length}</span>{" "}
                Product{coach.products.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
        </div>

        {/* Availability Preview */}
        {coach.products.some((p) => p.type === "one_on_one") && (
          <div className="bg-card rounded-lg shadow-lg overflow-hidden mb-8 border border-border">
            <div className="p-8">
              <h2 className="text-xl font-bold text-foreground mb-4">Next Available Sessions</h2>
              
              {availableSlots.length === 0 ? (
                <div className="text-center py-6 bg-muted rounded-lg">
                  <p className="text-muted-foreground mb-2">No available slots in the next 7 days</p>
                  <p className="text-sm text-muted-foreground">
                    Check back later or purchase a session to receive booking notifications
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableSlots.map((slot, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-primary transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-foreground">
                          {slot.startTime.toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {slot.startTime.toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}{" "}
                          -{" "}
                          {slot.endTime.toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <svg
                        className="w-5 h-5 text-accent-foreground"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  ))}
                </div>
              )}
              
              {availableSlots.length > 0 && (
                <div className="mt-4 p-3 bg-primary/10 border border-primary rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    💡 Purchase a 1:1 session to book any of these available time slots
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Products Section */}
        <div className="bg-card rounded-lg shadow-lg overflow-hidden border border-border">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">Available Products</h2>

            {coach.products.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">This coach doesn't have any active products yet.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {coach.products.map((product) => {
                  const eligibleOrder = eligibleOrders.find((o) => o.productId === product.id);
                  const hasActiveAppointment = eligibleOrder?.hasAppointment || false;

                  return (
                    <div
                      key={product.id}
                      className="border border-border rounded-lg p-6 hover:border-primary transition-colors"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={`text-xs px-3 py-1 rounded-full font-medium ${
                                product.type === "subscription"
                                  ? "bg-secondary text-secondary-foreground"
                                  : "bg-accent text-accent-foreground"
                              }`}
                            >
                              {product.type === "subscription" ? "Subscription" : "1:1 Session"}
                            </span>
                          </div>
                          <h3 className="text-xl font-bold text-foreground mb-2">{product.name}</h3>
                          {product.description && (
                            <p className="text-muted-foreground mb-4">{product.description}</p>
                          )}
                        </div>
                      </div>

                      {/* Pricing */}
                      {product.prices.length > 0 ? (
                        <div className="space-y-3 mb-4">
                          {product.prices.map((price) => (
                            <div
                              key={price.id}
                              className="flex items-center justify-between py-2"
                            >
                              <div>
                                <p className="text-lg font-semibold text-foreground">
                                  {formatPrice(price.amountCents, price.currency)}
                                  {formatInterval(price.interval, price.intervalCount)}
                                </p>
                                {price.interval && (
                                  <p className="text-sm text-muted-foreground">
                                    {product.type === "subscription"
                                      ? "Billed automatically"
                                      : "One-time payment"}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-accent-foreground bg-accent border border-accent rounded p-3 text-sm mb-4">
                          Pricing not yet configured
                        </p>
                      )}

                      {/* CTA Buttons */}
                      <div className="flex gap-3">
                        {product.type === "one_on_one" && eligibleOrder ? (
                          hasActiveAppointment ? (
                            <Link
                              href="/client/appointments"
                              className="bg-muted text-muted-foreground px-6 py-3 rounded-md font-medium"
                            >
                              View Your Appointment
                            </Link>
                          ) : (
                            <Link
                              href={`/client/book/${eligibleOrder.id}`}
                              className="bg-accent text-accent-foreground px-6 py-3 rounded-md hover:bg-accent/80 font-medium transition-colors"
                            >
                              Book Your Session →
                            </Link>
                          )
                        ) : (
                          <Link
                            href={`/p/${product.id}`}
                            className="bg-primary text-primary-foreground px-6 py-3 rounded-md hover:bg-primary/90 font-medium transition-colors"
                          >
                            {product.type === "subscription" ? "Subscribe" : "Purchase Session"} →
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Back to Discover */}
        <div className="mt-8 text-center">
          <Link
            href="/discover"
            className="inline-flex items-center text-primary hover:text-primary/90 font-medium"
          >
            ← Back to all coaches
          </Link>
        </div>
      </main>
    </div>
  );
}

