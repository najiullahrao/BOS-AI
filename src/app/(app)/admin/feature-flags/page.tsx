"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Modal } from "@/components/shared/modal";
import { StatusBadge } from "@/components/shared/status-badge";
import { toast } from "@/components/shared/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  addFeatureFlag,
  mockAdminOrgs,
  toggleFeatureFlagGlobalEnabled,
  type FeatureFlag,
} from "@/lib/mock-admin";
import { useFeatureFlags } from "@/lib/use-mock-admin";

const ROLLOUT_OPTIONS = [0, 10, 25, 50, 75, 100];

const KEY_PATTERN = /^[a-z0-9_]+$/;

function FlagCard({ flag }: { flag: FeatureFlag }) {
  const enabledOrgNames = flag.enabledOrgIds
    .map((id) => mockAdminOrgs.find((org) => org.id === id)?.name)
    .filter(Boolean) as string[];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center justify-between gap-3">
          <span className="flex items-center gap-2">
            <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-sm text-neutral-950">{flag.key}</code>
          </span>
          <span className="flex items-center gap-2">
            <StatusBadge variant={flag.isGlobalEnabled ? "success" : "neutral"}>
              {flag.isGlobalEnabled ? "Enabled" : "Disabled"}
            </StatusBadge>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm text-neutral-600">{flag.description}</p>

        <div className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-neutral-950">Global rollout</span>
            <span className="text-xs text-neutral-600">
              {flag.rolloutPercentage}% of orgs receive this flag.
            </span>
          </div>
          <Switch
            checked={flag.isGlobalEnabled}
            onCheckedChange={() => {
              toggleFeatureFlagGlobalEnabled(flag.id);
              toast.success(`${flag.key} ${flag.isGlobalEnabled ? "disabled" : "enabled"}`);
            }}
            aria-label={`Toggle ${flag.key}`}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-neutral-950">
            Explicitly enabled orgs ({enabledOrgNames.length})
          </span>
          {enabledOrgNames.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {enabledOrgNames.map((name) => (
                <Badge key={name} variant="outline">
                  {name}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-xs text-neutral-600">No organizations explicitly enabled.</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function NewFlagModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [isGlobalEnabled, setIsGlobalEnabled] = useState(false);
  const [rolloutPercentage, setRolloutPercentage] = useState(0);
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setKey("");
    setDescription("");
    setIsGlobalEnabled(false);
    setRolloutPercentage(0);
    setError(undefined);
    setSubmitting(false);
  }

  async function handleSubmit() {
    setSubmitting(true);
    if (!key.trim()) {
      setError("Key is required");
      setSubmitting(false);
      return;
    }
    if (!KEY_PATTERN.test(key)) {
      setError("Key must contain only lowercase letters, numbers, and underscores");
      setSubmitting(false);
      return;
    }
    addFeatureFlag({ key, description: description.trim() || "No description provided", isGlobalEnabled, rolloutPercentage });
    toast.success(`Feature flag "${key}" created`);
    reset();
    onOpenChange(false);
  }

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
      title="Create feature flag"
      description="Feature flags gate new functionality across organizations."
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Creating…" : "Create flag"}
          </Button>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="flag-key">Flag key</Label>
          <Input
            id="flag-key"
            value={key}
            onChange={(e) => {
              setKey(e.target.value);
              setError(undefined);
            }}
            placeholder="e.g. workflow_branching_beta"
            className="font-mono"
            aria-invalid={Boolean(error)}
          />
          {error ? (
            <p className="text-xs text-danger">{error}</p>
          ) : (
            <p className="text-xs text-neutral-600">Lowercase letters, numbers, and underscores only.</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="flag-description">Description</Label>
          <Textarea
            id="flag-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this flag control?"
            rows={3}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Rollout percentage</Label>
          <Select value={String(rolloutPercentage)} onValueChange={(value) => setRolloutPercentage(Number(value))}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLLOUT_OPTIONS.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}%
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-neutral-950">Enabled globally</span>
            <span className="text-xs text-neutral-600">Activate the flag immediately for the rollout percentage.</span>
          </div>
          <Switch checked={isGlobalEnabled} onCheckedChange={setIsGlobalEnabled} aria-label="Enable globally" />
        </div>
      </form>
    </Modal>
  );
}

export default function AdminFeatureFlagsPage() {
  const { flags } = useFeatureFlags();
  const [newFlagOpen, setNewFlagOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Feature Flags"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Admin Portal", href: "/admin" },
          { label: "Feature Flags" },
        ]}
        primaryAction={{ label: "New flag", icon: Plus, onClick: () => setNewFlagOpen(true) }}
      />

      <div className="flex flex-col gap-3">
        {flags.map((flag) => (
          <FlagCard key={flag.id} flag={flag} />
        ))}
      </div>

      <NewFlagModal open={newFlagOpen} onOpenChange={setNewFlagOpen} />
    </div>
  );
}