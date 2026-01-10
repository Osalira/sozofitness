import Link from "next/link";
import { getSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface SearchParams {
  q?: string;
}

interface DiscoverPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function DiscoverPage({ searchParams }: DiscoverPageProps) {
  const session = await getSession();
  const params = await searchParams;
  const query = params.q || "";

  // Build where clause for search
  const whereClause = query
    ? {
        OR: [
          { user: { name: { contains: query, mode: "insensitive" as const } } },
          {
            products: {
              some: {
                isActive: true,
                name: { contains: query, mode: "insensitive" as const },
              },
            },
          },
        ],
      }
    : {};

  // Get coaches with active products
  const coaches = await prisma.coach.findMany({
    where: {
      ...whereClause,
      products: {
        some: { isActive: true },
      },
    },
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
            take: 1,
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-primary to-info bg-clip-text text-transparent">
                SOZOFITNESS
              </Link>
            </div>
            <div className="flex items-center gap-4">
              {session ? (
                <>
                  <Link href="/app" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Dashboard
                  </Link>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/api/auth/signout">
                      Sign out
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Sign in
                  </Link>
                  <Button asChild size="sm">
                    <Link href="/signup">
                      Sign up
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Discover Coaches</h1>
          <p className="text-lg text-muted-foreground">
            Browse our community of certified fitness coaches and find the perfect fit for your goals.
          </p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <form action="/discover" method="get" className="max-w-xl">
            <div className="relative">
              <input
                type="text"
                name="q"
                defaultValue={query}
                placeholder="Search coaches or products..."
                className="w-full px-4 py-3 pr-28 border border-input bg-background text-foreground placeholder:text-muted-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring shadow-sm"
              />
              <Button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                size="sm"
              >
                Search
              </Button>
            </div>
          </form>
        </div>

        {/* Coaches Grid */}
        {coaches.length === 0 ? (
          <div className="bg-card rounded-lg shadow-md p-12 text-center border border-border">
            <div className="mb-4">
              <svg
                className="mx-auto h-16 w-16 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">No coaches found</h3>
            <p className="text-muted-foreground mb-6">
              {query
                ? `No coaches match "${query}". Try a different search term.`
                : "No coaches available at the moment. Check back soon!"}
            </p>
            {query && (
              <Button asChild>
                <Link href="/discover">
                  Clear Search
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center gap-3">
              <h2 className="text-lg font-semibold text-foreground">
                {coaches.length} {coaches.length === 1 ? "Coach" : "Coaches"} Available
              </h2>
              {query && (
                <Badge variant="info">Filtered by "{query}"</Badge>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coaches.map((coach) => {
                const subscriptions = coach.products.filter((p) => p.type === "subscription");
                const oneOnOnes = coach.products.filter((p) => p.type === "one_on_one");
                const lowestPrice = coach.products
                  .flatMap((p) => p.prices)
                  .sort((a, b) => a.amountCents - b.amountCents)[0];

                return (
                  <Link
                    key={coach.id}
                    href={`/discover/coaches/${coach.id}`}
                    className="group bg-card rounded-lg shadow-md overflow-hidden hover:shadow-xl hover:border-primary transition-all border border-border"
                  >
                    <div className="p-6">
                      {/* Coach Header */}
                      <div className="mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary to-info rounded-full flex items-center justify-center text-primary-foreground text-2xl font-bold mb-3 shadow-md group-hover:shadow-lg transition-shadow">
                          {(coach.user.name || "C")[0].toUpperCase()}
                        </div>
                        <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                          {coach.user.name || "Coach"}
                        </h3>
                      </div>

                      {/* Bio */}
                      {coach.bio && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{coach.bio}</p>
                      )}

                      {/* Product Summary */}
                      <div className="border-t border-border pt-4 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <div>
                            <span className="text-muted-foreground">Products:</span>
                            <span className="font-bold text-foreground ml-1">
                              {coach.products.length}
                            </span>
                          </div>
                          {lowestPrice && (
                            <div className="text-right">
                              <span className="text-muted-foreground">From:</span>
                              <span className="font-bold text-primary ml-1">
                                ${(lowestPrice.amountCents / 100).toFixed(0)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Product Types */}
                      <div className="flex gap-2 flex-wrap mb-4">
                        {subscriptions.length > 0 && (
                          <Badge variant="default">
                            {subscriptions.length} Subscription{subscriptions.length > 1 ? "s" : ""}
                          </Badge>
                        )}
                        {oneOnOnes.length > 0 && (
                          <Badge variant="info">
                            {oneOnOnes.length} 1:1 Session{oneOnOnes.length > 1 ? "s" : ""}
                          </Badge>
                        )}
                      </div>

                      {/* View Profile CTA */}
                      <div className="pt-4 border-t border-border">
                        <span className="text-primary font-semibold text-sm group-hover:underline flex items-center gap-1">
                          View Profile
                          <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}

        {/* Info Banner */}
        {coaches.length > 0 && (
          <div className="mt-12 bg-gradient-to-r from-primary/10 to-info/10 border-l-4 border-l-primary rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Ready to start your fitness journey?
            </h3>
            <p className="text-sm text-muted-foreground">
              Click on any coach to view their offerings and book a session or subscribe to their content.
              {!session && " Sign up to get started!"}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
