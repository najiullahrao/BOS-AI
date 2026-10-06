"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { toast } from "@/components/shared/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getUserInitials } from "@/lib/mock-data";
import { ROLE_LABELS } from "@/lib/mock-team";
import { useImpersonation } from "@/lib/impersonation-context";
import { searchUsers, type UserSearchResult } from "@/lib/mock-admin";

export default function AdminUsersPage() {
  const [query, setQuery] = useState("");
  const { startImpersonation } = useImpersonation();
  const trimmed = query.trim();
  const results = trimmed ? searchUsers(query) : [];

  function handleImpersonate(user: UserSearchResult, orgName: string) {
    startImpersonation({ userId: user.id, userName: user.name, userEmail: user.email, orgName });
    toast.success(`Now viewing as ${user.name} at ${orgName}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="User Search"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Admin Portal", href: "/admin" },
          { label: "User Search" },
        ]}
      />

      <div className="flex flex-col gap-1.5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-600" aria-hidden="true" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, or organization"
            className="pl-9"
            aria-label="Search users"
          />
        </div>
        <p className="text-xs text-neutral-600">{`Demo data only. Try searching "Amara", "northlight", or "owner".`}</p>
      </div>

      {!trimmed && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-neutral-200 px-6 py-12 text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Search className="size-5" aria-hidden="true" />
          </div>
          <p className="max-w-sm text-sm text-neutral-950">Search for a user to view their organizations.</p>
        </div>
      )}

      {trimmed && results.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-neutral-200 px-6 py-12 text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-neutral-50 text-neutral-600">
            <Search className="size-5" aria-hidden="true" />
          </div>
          <p className="max-w-sm text-sm text-neutral-600">{`No users found for "${trimmed}".`}</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="flex flex-col gap-3">
          {results.map((user) => (
            <Card key={user.email}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Avatar size="sm">
                    <AvatarFallback>{getUserInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span>{user.name}</span>
                    <span className="text-xs font-normal text-neutral-600">{user.email}</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {user.orgs.map((org) => (
                  <div
                    key={org.name}
                    className="flex items-center justify-between gap-3 rounded-md border border-border p-3"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-neutral-950">{org.name}</span>
                      <span className="text-xs text-neutral-600">
                        {ROLE_LABELS[org.role as keyof typeof ROLE_LABELS] ?? org.role}
                      </span>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleImpersonate(user, org.name)}>
                      Impersonate
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}