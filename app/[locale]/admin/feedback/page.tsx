import { requireRole } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";
import { AdminNav } from "@/components/navigation/AdminNav";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminFeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await requireRole(UserRole.admin);
  const { q } = await searchParams;
  const searchQuery = q || "";

  // Get feedback with optional search
  const feedback = await prisma.feedback.findMany({
    where: searchQuery
      ? {
          OR: [
            { message: { contains: searchQuery, mode: "insensitive" } },
            { user: { email: { contains: searchQuery, mode: "insensitive" } } },
            { user: { name: { contains: searchQuery, mode: "insensitive" } } },
          ],
        }
      : {},
    include: {
      user: {
        select: {
          email: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const getCategoryBadge = (category: string | null) => {
    if (category === "bug") return <Badge variant="destructive">🐛 Bug</Badge>;
    if (category === "feature") return <Badge variant="info">💡 Feature</Badge>;
    return <Badge variant="outline">💬 Other</Badge>;
  };

  const getRoleBadge = (role: string) => {
    if (role === "coach") return <Badge variant="default">Coach</Badge>;
    if (role === "admin") return <Badge variant="warning">Admin</Badge>;
    return <Badge variant="secondary">Client</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminNav userName={session.user.name} userEmail={session.user.email} />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">User Feedback</h1>
            <p className="mt-2 text-base text-muted-foreground">
              View and analyze feedback from users
            </p>
          </div>

          {/* Search */}
          <Card className="mb-6 shadow-md">
            <CardContent className="p-6">
              <form action="/admin/feedback" method="get" className="flex gap-3">
                <input
                  type="text"
                  name="q"
                  defaultValue={searchQuery}
                  placeholder="Search feedback by message, user name, or email..."
                  className="flex-1 px-4 py-2 border border-input bg-background text-foreground placeholder:text-muted-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-medium"
                >
                  Search
                </button>
              </form>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <Card className="border-l-4 border-l-info">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Total Feedback</p>
                <p className="text-3xl font-bold text-info">{feedback.length}</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-destructive">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Bug Reports</p>
                <p className="text-3xl font-bold text-destructive">
                  {feedback.filter((f) => f.category === "bug").length}
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-info">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Feature Requests</p>
                <p className="text-3xl font-bold text-info">
                  {feedback.filter((f) => f.category === "feature").length}
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-warning">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Avg Rating</p>
                <p className="text-3xl font-bold text-warning">
                  {feedback.filter((f) => f.rating).length > 0
                    ? (
                        feedback.reduce((sum, f) => sum + (f.rating || 0), 0) /
                        feedback.filter((f) => f.rating).length
                      ).toFixed(1)
                    : "N/A"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Feedback List */}
          <Card className="shadow-md">
            <CardHeader className="bg-muted/50 border-b border-border">
              <CardTitle className="text-lg">Recent Feedback</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {feedback.length === 0 ? (
                <div className="p-12 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-muted-foreground mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <p className="text-muted-foreground">
                    {searchQuery ? `No feedback matches "${searchQuery}"` : "No feedback yet"}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {feedback.map((item) => (
                    <div key={item.id} className="p-6 hover:bg-accent/30 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-3">
                        <div className="flex items-start gap-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-foreground">
                                {item.user.name || "User"}
                              </span>
                              {getRoleBadge(item.role)}
                              {getCategoryBadge(item.category)}
                            </div>
                            <p className="text-sm text-muted-foreground">{item.user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {item.rating && (
                            <div className="flex items-center gap-1">
                              {[...Array(item.rating)].map((_, i) => (
                                <span key={i} className="text-warning">
                                  ⭐
                                </span>
                              ))}
                            </div>
                          )}
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(item.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-foreground mb-2 whitespace-pre-wrap">{item.message}</p>

                      <p className="text-xs text-muted-foreground">
                        Page: <code className="bg-muted px-1 py-0.5 rounded">{item.pagePath}</code>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

