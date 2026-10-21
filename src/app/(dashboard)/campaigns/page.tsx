"use client";

import React, { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useCurrentUser, useIsMounted } from "@/hooks";
import { campaignService } from "@/services/growthServices";
import type { Campaign, CampaignMetrics, CampaignStatus } from "@/types";
import {
  Flag,
  CheckCircle,
  Clock,
  Plus,
  Search,
  Users,
  TrendingUp,
  Calendar,
  Layers,
  ArrowRight,
} from "lucide-react";

export default function CampaignsPage() {
  const isMounted = useIsMounted();
  const { data: user } = useCurrentUser();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [metrics, setMetrics] = useState<CampaignMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  // Create form state
  const [newTitle, setNewTitle] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newStatus, setNewStatus] = useState<CampaignStatus>("ACTIVE");
  const [newStartDate, setNewStartDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");

  useEffect(() => {
    setNewStartDate(new Date().toISOString().slice(0, 10));
    setNewEndDate(new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10));
  }, []);
  const [newTargetAudience, setNewTargetAudience] = useState("");
  const [newContentUrl, setNewContentUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [list, met] = await Promise.all([
        campaignService.getCampaigns(),
        campaignService.getMetrics(),
      ]);
      setCampaigns(list);
      setMetrics(met);
    } catch (err) {
      console.error("Failed to load campaigns:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isMounted) {
      loadData();
    }
  }, [isMounted]);

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
      const q = search.toLowerCase();
      const matchesSearch =
        !search.trim() ||
        c.title.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.targetAudience?.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [campaigns, statusFilter, search]);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newCode) return;
    setIsSubmitting(true);
    try {
      await campaignService.createCampaign({
        title: newTitle,
        code: newCode,
        description: newDescription,
        status: newStatus,
        startDate: newStartDate,
        endDate: newEndDate,
        targetAudience: newTargetAudience,
        contentUrl: newContentUrl,
      });
      setCreateModalOpen(false);
      setNewTitle("");
      setNewCode("");
      setNewDescription("");
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to create campaign");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <PageHeader
          title="Company Campaigns"
          description="Create and schedule company-wide detailing campaigns, enroll field force, and monitor completion progress."
        />
        <Button onClick={() => setCreateModalOpen(true)} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>New Campaign</span>
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Campaigns</p>
              <h3 className="text-2xl font-bold mt-1">{metrics?.totalCampaigns ?? 0}</h3>
            </div>
            <Flag className="w-8 h-8 text-blue-500 opacity-80" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Active In-Market</p>
              <h3 className="text-2xl font-bold mt-1 text-emerald-600">{metrics?.activeCampaigns ?? 0}</h3>
            </div>
            <Layers className="w-8 h-8 text-emerald-500 opacity-80" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-500 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Enrolled Field MRs</p>
              <h3 className="text-2xl font-bold mt-1">{metrics?.totalParticipants ?? 0}</h3>
            </div>
            <Users className="w-8 h-8 text-indigo-500 opacity-80" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Completion Rate</p>
              <h3 className="text-2xl font-bold mt-1 text-purple-600">{metrics?.completionRate ?? 0}%</h3>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500 opacity-80" />
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search campaigns by title, code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm bg-background border border-input rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="DRAFT">Draft</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scheduled & Active Campaigns</CardTitle>
          <CardDescription>
            Targeted product and therapy initiatives scoped strictly to your organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <EmptyState
              icon={Flag}
              title="No campaigns found"
              description="Create a new promotional or detailing campaign to assign to your field force."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Timeline</TableHead>
                  <TableHead>Target Audience</TableHead>
                  <TableHead>Enrolled MRs</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCampaigns.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="font-semibold text-foreground">{c.title}</div>
                      <div className="font-mono text-xs text-muted-foreground">{c.code}</div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center space-x-1 font-mono text-xs">
                        <span>{new Date(c.startDate).toISOString().slice(0, 10)}</span>
                        <span>→</span>
                        <span>{new Date(c.endDate).toISOString().slice(0, 10)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {c.targetAudience || "General Physicians & Specialists"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1 font-medium">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>{c._count?.participants || 0} participants</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          c.status === "ACTIVE"
                            ? "default"
                            : c.status === "SCHEDULED"
                            ? "outline"
                            : "secondary"
                        }
                      >
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          const detailed = await campaignService.getCampaignById(c.id);
                          setSelectedCampaign(detailed);
                        }}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Campaign Modal */}
      {createModalOpen && (
        <Modal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          title="Create Company Campaign"
        >
          <form onSubmit={handleCreateCampaign} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Campaign Title *
              </label>
              <Input
                placeholder="e.g. Q4 Cardiology Adoption Initiative"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Unique Campaign Code *
              </label>
              <Input
                placeholder="e.g. CMP-CARD-2026-Q4"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Start Date *</label>
                <Input
                  type="date"
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">End Date *</label>
                <Input
                  type="date"
                  value={newEndDate}
                  onChange={(e) => setNewEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as CampaignStatus)}
                className="w-full text-sm bg-background border border-input rounded-md px-3 py-2"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="SCHEDULED">SCHEDULED</option>
                <option value="DRAFT">DRAFT</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Target Audience</label>
              <Input
                placeholder="e.g. Cardiologists & Internal Medicine"
                value={newTargetAudience}
                onChange={(e) => setNewTargetAudience(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Content / Brief URL</label>
              <Input
                placeholder="e.g. https://cdn.mbyte.app/campaigns/cardio.pdf"
                value={newContentUrl}
                onChange={(e) => setNewContentUrl(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Description</label>
              <Input
                placeholder="Brief campaign objectives and detailing focal points"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Save Campaign"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Campaign Details Modal */}
      {selectedCampaign && (
        <Modal
          isOpen={!!selectedCampaign}
          onClose={() => setSelectedCampaign(null)}
          title={`Campaign Details: ${selectedCampaign.title}`}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground text-xs block">Campaign Code</span>
                <span className="font-mono font-semibold">{selectedCampaign.code}</span>
              </div>
              <div>
                <span className="text-muted-foreground text-xs block">Status</span>
                <Badge variant="outline">{selectedCampaign.status}</Badge>
              </div>
              <div>
                <span className="text-muted-foreground text-xs block">Start Date</span>
                <span className="font-mono">{new Date(selectedCampaign.startDate).toISOString().slice(0, 10)}</span>
              </div>
              <div>
                <span className="text-muted-foreground text-xs block">End Date</span>
                <span className="font-mono">{new Date(selectedCampaign.endDate).toISOString().slice(0, 10)}</span>
              </div>
            </div>

            {selectedCampaign.description && (
              <div className="text-sm bg-muted/20 p-3 rounded">
                <span className="text-xs font-semibold text-muted-foreground block">Description</span>
                {selectedCampaign.description}
              </div>
            )}

            <div>
              <h4 className="text-sm font-semibold mb-2">
                Enrolled Participants ({selectedCampaign.participants?.length || 0})
              </h4>
              {(!selectedCampaign.participants || selectedCampaign.participants.length === 0) ? (
                <p className="text-xs text-muted-foreground italic">No participants enrolled yet.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedCampaign.participants.map((p) => (
                    <div key={p.id} className="p-2 border rounded text-xs flex items-center justify-between">
                      <div>
                        <div className="font-medium">{p.user?.firstName} {p.user?.lastName}</div>
                        <div className="text-muted-foreground">{p.user?.email}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{p.progressPercent}% Completed</div>
                        <Badge variant="outline" className="text-[10px]">{p.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => setSelectedCampaign(null)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
