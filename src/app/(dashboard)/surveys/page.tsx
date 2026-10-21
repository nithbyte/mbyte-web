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
import { surveyService, campaignService } from "@/services/growthServices";
import type { Survey, SurveyAnalytics, Campaign } from "@/types";
import {
  ClipboardList,
  CheckCircle,
  Plus,
  Search,
  BarChart,
  Layers,
  Star,
  ShieldCheck,
} from "lucide-react";

export default function SurveysPage() {
  const isMounted = useIsMounted();
  const { data: user } = useCurrentUser();

  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<SurveyAnalytics | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [questions, setQuestions] = useState<
    Array<{
      questionText: string;
      questionType: "RATING" | "SINGLE_CHOICE" | "TEXT";
      options: string[];
      isRequired: boolean;
    }>
  >([
    {
      questionText: "Doctor overall satisfaction with drug efficacy (1-5)",
      questionType: "RATING",
      options: [],
      isRequired: true,
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [surveyList, campList] = await Promise.all([
        surveyService.getSurveys(),
        campaignService.getCampaigns(),
      ]);
      setSurveys(surveyList);
      setCampaigns(campList);
    } catch (err) {
      console.error("Failed to load surveys:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isMounted) {
      loadData();
    }
  }, [isMounted]);

  const filteredSurveys = useMemo(() => {
    return surveys.filter((s) => {
      const q = search.toLowerCase();
      return (
        !search.trim() ||
        s.title.toLowerCase().includes(q) ||
        s.campaign?.title.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q)
      );
    });
  }, [surveys, search]);

  const handleCreateSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    setIsSubmitting(true);
    try {
      await surveyService.createSurvey({
        title,
        description,
        campaignId: campaignId || undefined,
        isActive: true,
        questions: questions.map((q, idx) => ({
          ...q,
          orderIndex: idx,
        })),
      });
      setCreateModalOpen(false);
      setTitle("");
      setDescription("");
      setCampaignId("");
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to create survey");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenAnalytics = async (survey: Survey) => {
    setSelectedSurvey(survey);
    try {
      const analytics = await surveyService.getAnalytics(survey.id);
      setAnalyticsData(analytics);
      setAnalyticsModalOpen(true);
    } catch (err: any) {
      alert(err.message || "Failed to load analytics");
    }
  };

  if (!isMounted) return null;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <PageHeader
          title="Surveys & Questionnaires"
          description="Design customer and physician questionnaires, link with campaigns, and analyze feedback metrics."
        />
        <Button onClick={() => setCreateModalOpen(true)} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>New Questionnaire</span>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Active Questionnaires</p>
              <h3 className="text-2xl font-bold mt-1">{surveys.length}</h3>
            </div>
            <ClipboardList className="w-8 h-8 text-blue-500 opacity-80" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Campaign Associations</p>
              <h3 className="text-2xl font-bold mt-1 text-emerald-600">
                {surveys.filter((s) => s.campaignId).length}
              </h3>
            </div>
            <Layers className="w-8 h-8 text-emerald-500 opacity-80" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Responses Recorded</p>
              <h3 className="text-2xl font-bold mt-1 text-purple-600">
                {surveys.reduce((sum, s) => sum + (s._count?.responses || 0), 0)}
              </h3>
            </div>
            <BarChart className="w-8 h-8 text-purple-500 opacity-80" />
          </CardContent>
        </Card>
      </div>

      {/* Privacy Notice */}
      <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 flex items-center space-x-3 text-xs text-emerald-800 dark:text-emerald-300">
        <ShieldCheck className="w-5 h-5 flex-shrink-0 text-emerald-600" />
        <span>
          <strong>Privacy Rule Enforced:</strong> Questionnaires record physician perception and feedback strictly without collecting patient health information (PHI) or personal identifiers.
        </span>
      </div>

      {/* Search */}
      <div className="relative w-72">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search questionnaires..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Surveys Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configured Questionnaires</CardTitle>
          <CardDescription>
            Company-scoped questionnaires with automatic response aggregation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : filteredSurveys.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No questionnaires found"
              description="Create a questionnaire to gather structured feedback from doctor and chemist visits."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Questionnaire</TableHead>
                  <TableHead>Associated Campaign</TableHead>
                  <TableHead>Questions</TableHead>
                  <TableHead>Responses</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSurveys.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="font-semibold">{s.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">{s.description}</div>
                    </TableCell>
                    <TableCell>
                      {s.campaign ? (
                        <Badge variant="outline" className="text-xs font-mono">
                          {s.campaign.title} ({s.campaign.code})
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">General / Standalone</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">{s._count?.questions || 0} items</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-sm text-foreground">{s._count?.responses || 0}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.isActive ? "default" : "secondary"}>
                        {s.isActive ? "ACTIVE" : "INACTIVE"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenAnalytics(s)}
                      >
                        Analytics
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Survey Modal */}
      {createModalOpen && (
        <Modal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          title="Create Survey Questionnaire"
        >
          <form onSubmit={handleCreateSurvey} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Questionnaire Title *
              </label>
              <Input
                placeholder="e.g. Q4 Beta-Blocker Bioavailability Feedback"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Link to Campaign (Optional)
              </label>
              <select
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                className="w-full text-sm bg-background border border-input rounded-md px-3 py-2"
              >
                <option value="">-- Standalone (No Campaign) --</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Description</label>
              <Input
                placeholder="Target objective and physician survey context"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-2">
                Survey Questions ({questions.length})
              </label>
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {questions.map((q, idx) => (
                  <div key={idx} className="p-3 border rounded text-xs space-y-2 bg-muted/20">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Question {idx + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-rose-500 h-6 px-1 text-[11px]"
                        onClick={() => setQuestions(questions.filter((_, i) => i !== idx))}
                      >
                        Remove
                      </Button>
                    </div>
                    <Input
                      placeholder="e.g. Doctor satisfaction with package safety..."
                      value={q.questionText}
                      onChange={(e) => {
                        const updated = [...questions];
                        updated[idx].questionText = e.target.value;
                        setQuestions(updated);
                      }}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={q.questionType}
                        onChange={(e) => {
                          const updated = [...questions];
                          updated[idx].questionType = e.target.value as any;
                          if (e.target.value === "SINGLE_CHOICE" && updated[idx].options.length === 0) {
                            updated[idx].options = ["High", "Medium", "Low"];
                          }
                          setQuestions(updated);
                        }}
                        className="text-xs bg-background border border-input rounded px-2 py-1"
                      >
                        <option value="RATING">Rating (1 to 5 Stars)</option>
                        <option value="SINGLE_CHOICE">Single Choice</option>
                        <option value="TEXT">Short Text / Notes</option>
                      </select>
                      <label className="flex items-center space-x-1 text-xs">
                        <input
                          type="checkbox"
                          checked={q.isRequired}
                          onChange={(e) => {
                            const updated = [...questions];
                            updated[idx].isRequired = e.target.checked;
                            setQuestions(updated);
                          }}
                        />
                        <span>Required Answer</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-2 text-xs"
                onClick={() =>
                  setQuestions([
                    ...questions,
                    {
                      questionText: "",
                      questionType: "RATING",
                      options: [],
                      isRequired: true,
                    },
                  ])
                }
              >
                + Add Another Question
              </Button>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Save Questionnaire"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Analytics Modal */}
      {analyticsModalOpen && selectedSurvey && (
        <Modal
          isOpen={analyticsModalOpen}
          onClose={() => setAnalyticsModalOpen(false)}
          title={`Analytics: ${selectedSurvey.title}`}
        >
          <div className="space-y-4">
            <div className="p-3 bg-muted/20 rounded flex items-center justify-between text-sm">
              <span>Total Submissions Recorded:</span>
              <span className="font-bold text-base">{analyticsData?.totalResponses ?? 0}</span>
            </div>

            {(!analyticsData?.questions || analyticsData.questions.length === 0) ? (
              <p className="text-xs text-muted-foreground italic">No feedback responses recorded yet.</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {analyticsData.questions.map((q, idx) => (
                  <div key={q.questionId || idx} className="p-3 border rounded text-xs space-y-1">
                    <div className="font-semibold text-foreground">
                      {idx + 1}. {q.questionText}
                    </div>
                    <div className="text-muted-foreground text-[11px]">
                      Answered: {q.totalAnswered} times
                    </div>
                    {q.averageRating !== undefined && (
                      <div className="flex items-center space-x-1 font-bold text-amber-500 text-sm pt-1">
                        <Star className="w-4 h-4 fill-amber-500" />
                        <span>Average Rating: {q.averageRating} / 5</span>
                      </div>
                    )}
                    {q.distribution && (
                      <div className="mt-2 space-y-1">
                        {Object.entries(q.distribution).map(([choice, count]) => (
                          <div key={choice} className="flex items-center justify-between bg-muted/30 px-2 py-1 rounded">
                            <span>{choice}</span>
                            <span className="font-bold">{count}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button onClick={() => setAnalyticsModalOpen(false)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
