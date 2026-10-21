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
import { trainingService } from "@/services/growthServices";
import type { TrainingModule, QuizAttempt, TrainingMetrics } from "@/types";
import {
  GraduationCap,
  CheckCircle,
  XCircle,
  Plus,
  Search,
  BookOpen,
  Award,
  Layers,
  HelpCircle,
} from "lucide-react";

export default function TrainingPage() {
  const isMounted = useIsMounted();
  const { data: user } = useCurrentUser();

  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [metrics, setMetrics] = useState<TrainingMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<TrainingModule | null>(null);
  const [attemptsModalOpen, setAttemptsModalOpen] = useState(false);
  const [moduleAttempts, setModuleAttempts] = useState<QuizAttempt[]>([]);
  const [addQuestionModalOpen, setAddQuestionModalOpen] = useState(false);

  // Form: Create Module
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("PRODUCT_KNOWLEDGE");
  const [description, setDescription] = useState("");
  const [contentUrl, setContentUrl] = useState("");
  const [passingScore, setPassingScore] = useState(70);
  const [maxAttempts, setMaxAttempts] = useState(3);
  const [estimatedMinutes, setEstimatedMinutes] = useState(15);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form: Add Question
  const [qText, setQText] = useState("");
  const [qType, setQType] = useState<"SINGLE_CHOICE" | "MULTIPLE_CHOICE">("SINGLE_CHOICE");
  const [qPoints, setQPoints] = useState(1);
  const [qExplanation, setQExplanation] = useState("");
  const [qOptions, setQOptions] = useState([
    { optionText: "", isCorrect: true },
    { optionText: "", isCorrect: false },
  ]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [list, met] = await Promise.all([
        trainingService.getModules(),
        trainingService.getMetrics(),
      ]);
      setModules(list);
      setMetrics(met);
    } catch (err) {
      console.error("Failed to load training modules:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isMounted) {
      loadData();
    }
  }, [isMounted]);

  const filteredModules = useMemo(() => {
    return modules.filter((m) => {
      const matchesCat = categoryFilter === "ALL" || m.category === categoryFilter;
      const q = search.toLowerCase();
      const matchesSearch =
        !search.trim() ||
        m.title.toLowerCase().includes(q) ||
        m.description?.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [modules, categoryFilter, search]);

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    setIsSubmitting(true);
    try {
      await trainingService.createModule({
        title,
        category,
        description,
        contentUrl,
        passingScore: Number(passingScore),
        maxAttempts: Number(maxAttempts),
        estimatedMinutes: Number(estimatedMinutes),
      });
      setCreateModalOpen(false);
      setTitle("");
      setDescription("");
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to create module");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenAttempts = async (mod: TrainingModule) => {
    setSelectedModule(mod);
    try {
      const attempts = await trainingService.getAttempts(mod.id);
      setModuleAttempts(attempts);
      setAttemptsModalOpen(true);
    } catch (err: any) {
      alert(err.message || "Failed to load attempts");
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModule || !qText) return;
    try {
      await trainingService.addQuestion(selectedModule.id, {
        questionText: qText,
        questionType: qType,
        points: Number(qPoints),
        explanation: qExplanation,
        options: qOptions.filter((o) => o.optionText.trim().length > 0),
      });
      setAddQuestionModalOpen(false);
      setQText("");
      setQExplanation("");
      setQOptions([
        { optionText: "", isCorrect: true },
        { optionText: "", isCorrect: false },
      ]);
      const updated = await trainingService.getModuleById(selectedModule.id);
      setSelectedModule(updated);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to add question");
    }
  };

  if (!isMounted) return null;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <PageHeader
          title="Training & Quizzes"
          description="Manage clinical and product training modules, configure answer keys, and monitor field MR certifications."
        />
        <Button onClick={() => setCreateModalOpen(true)} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>New Training Module</span>
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Active Modules</p>
              <h3 className="text-2xl font-bold mt-1">{metrics?.totalModules ?? 0}</h3>
            </div>
            <BookOpen className="w-8 h-8 text-blue-500 opacity-80" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-500 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Completed Attempts</p>
              <h3 className="text-2xl font-bold mt-1 text-indigo-600">{metrics?.totalAttempts ?? 0}</h3>
            </div>
            <GraduationCap className="w-8 h-8 text-indigo-500 opacity-80" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Company Pass Rate</p>
              <h3 className="text-2xl font-bold mt-1 text-emerald-600">{metrics?.passRate ?? 0}%</h3>
            </div>
            <CheckCircle className="w-8 h-8 text-emerald-500 opacity-80" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Certified Field MRs</p>
              <h3 className="text-2xl font-bold mt-1 text-purple-600">{metrics?.certifiedTraineesCount ?? 0}</h3>
            </div>
            <Award className="w-8 h-8 text-purple-500 opacity-80" />
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search training modules..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-sm bg-background border border-input rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">All Categories</option>
            <option value="PRODUCT_KNOWLEDGE">Product Knowledge</option>
            <option value="CLINICAL_PROTOCOL">Clinical Protocol</option>
            <option value="COMPLIANCE">Compliance & Safety</option>
            <option value="SALES_EXCELLENCE">Sales Excellence</option>
          </select>
        </div>
      </div>

      {/* Modules Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Company Training Curriculum</CardTitle>
          <CardDescription>
            Secure assessment modules. Candidates never receive answer keys prior to evaluation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : filteredModules.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="No training modules found"
              description="Create a curriculum module with quiz questions to assess your team."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Training Module</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Assessment Criteria</TableHead>
                  <TableHead>Questions</TableHead>
                  <TableHead>Attempts Taken</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredModules.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div className="font-semibold">{m.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">{m.description}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {m.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="font-medium text-emerald-600">Pass: {m.passingScore}%</div>
                      <div className="text-xs text-muted-foreground">Max {m.maxAttempts} attempts • {m.estimatedMinutes}m</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1 font-medium">
                        <HelpCircle className="w-4 h-4 text-muted-foreground" />
                        <span>{m._count?.questions || 0} questions</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{m._count?.attempts || 0}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenAttempts(m)}
                        >
                          Results
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            const detailed = await trainingService.getModuleById(m.id);
                            setSelectedModule(detailed);
                          }}
                        >
                          Manage
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Module Modal */}
      {createModalOpen && (
        <Modal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          title="Create New Training Module"
        >
          <form onSubmit={handleCreateModule} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Module Title *</label>
              <Input
                placeholder="e.g. Q4 Cardiology Masterclass"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-sm bg-background border border-input rounded-md px-3 py-2"
              >
                <option value="PRODUCT_KNOWLEDGE">Product Knowledge</option>
                <option value="CLINICAL_PROTOCOL">Clinical Protocol</option>
                <option value="COMPLIANCE">Compliance & Safety</option>
                <option value="SALES_EXCELLENCE">Sales Excellence</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Passing Score (%)</label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={passingScore}
                  onChange={(e) => setPassingScore(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Max Attempts</label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={maxAttempts}
                  onChange={(e) => setMaxAttempts(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Duration (Mins)</label>
                <Input
                  type="number"
                  min="5"
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Content / Document URL</label>
              <Input
                placeholder="e.g. https://cdn.mbyte.app/training/cardio-deck.pdf"
                value={contentUrl}
                onChange={(e) => setContentUrl(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Description</label>
              <Input
                placeholder="Curriculum objectives and summary"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Save Module"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Module Management & Questions Modal */}
      {selectedModule && !attemptsModalOpen && (
        <Modal
          isOpen={!!selectedModule}
          onClose={() => setSelectedModule(null)}
          title={`Manage Module: ${selectedModule.title}`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Quiz Questions ({selectedModule.questions?.length || 0})</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAddQuestionModalOpen(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Question
              </Button>
            </div>

            {(!selectedModule.questions || selectedModule.questions.length === 0) ? (
              <p className="text-xs text-muted-foreground italic">No questions added yet. Click &quot;Add Question&quot; to configure answer choices.</p>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {selectedModule.questions.map((q, qIdx) => (
                  <div key={q.id} className="p-3 border rounded text-xs space-y-2 bg-muted/20">
                    <div className="flex items-center justify-between font-semibold">
                      <span>Q{qIdx + 1}: {q.questionText}</span>
                      <span className="text-muted-foreground">({q.points} pts)</span>
                    </div>
                    <div className="space-y-1 pl-2">
                      {q.options?.map((opt, oIdx) => (
                        <div key={opt.id || oIdx} className="flex items-center space-x-2">
                          <span className={opt.isCorrect ? "font-bold text-emerald-600" : "text-muted-foreground"}>
                            {opt.isCorrect ? "✓" : "○"} {opt.optionText}
                          </span>
                        </div>
                      ))}
                    </div>
                    {q.explanation && (
                      <div className="text-[11px] text-muted-foreground italic border-t pt-1">
                        Rationale: {q.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button onClick={() => setSelectedModule(null)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Question Modal */}
      {addQuestionModalOpen && (
        <Modal
          isOpen={addQuestionModalOpen}
          onClose={() => setAddQuestionModalOpen(false)}
          title="Add Quiz Question & Answer Key"
        >
          <form onSubmit={handleAddQuestion} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Question Text *</label>
              <Input
                placeholder="e.g. Which beta blocker is contraindicated in asthma?"
                value={qText}
                onChange={(e) => setQText(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Question Type</label>
                <select
                  value={qType}
                  onChange={(e) => setQType(e.target.value as any)}
                  className="w-full text-sm bg-background border border-input rounded-md px-3 py-2"
                >
                  <option value="SINGLE_CHOICE">Single Choice</option>
                  <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Points</label>
                <Input
                  type="number"
                  min="1"
                  value={qPoints}
                  onChange={(e) => setQPoints(Number(e.target.value))}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-2">Answer Choices (Check correct answer)</label>
              <div className="space-y-2">
                {qOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={opt.isCorrect}
                      onChange={(e) => {
                        const updated = [...qOptions];
                        if (qType === "SINGLE_CHOICE") {
                          updated.forEach((o, i) => (o.isCorrect = i === idx));
                        } else {
                          updated[idx].isCorrect = e.target.checked;
                        }
                        setQOptions(updated);
                      }}
                      className="rounded"
                    />
                    <Input
                      placeholder={`Option ${idx + 1}`}
                      value={opt.optionText}
                      onChange={(e) => {
                        const updated = [...qOptions];
                        updated[idx].optionText = e.target.value;
                        setQOptions(updated);
                      }}
                      className="text-sm"
                    />
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-2 text-xs"
                onClick={() => setQOptions([...qOptions, { optionText: "", isCorrect: false }])}
              >
                + Add Option
              </Button>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Answer Rationale / Explanation</label>
              <Input
                placeholder="Explained to trainee after attempt submission"
                value={qExplanation}
                onChange={(e) => setQExplanation(e.target.value)}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setAddQuestionModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Question</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Trainee Attempts Modal */}
      {attemptsModalOpen && selectedModule && (
        <Modal
          isOpen={attemptsModalOpen}
          onClose={() => setAttemptsModalOpen(false)}
          title={`Results: ${selectedModule.title}`}
        >
          <div className="space-y-4">
            {moduleAttempts.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No candidate submissions recorded yet for this module.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Field Trainee</TableHead>
                    <TableHead>Attempt #</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {moduleAttempts.map((att) => (
                    <TableRow key={att.id}>
                      <TableCell>
                        <div className="font-medium">{att.user?.firstName} {att.user?.lastName}</div>
                        <div className="text-xs text-muted-foreground">{att.user?.email}</div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">#{att.attemptNumber}</TableCell>
                      <TableCell className="font-bold text-sm">{att.percentage ?? att.score}%</TableCell>
                      <TableCell>
                        <Badge variant={att.passed ? "default" : "destructive"}>
                          {att.passed ? "PASSED" : "FAILED"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {new Date(att.completedAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            <div className="flex justify-end pt-2">
              <Button onClick={() => setAttemptsModalOpen(false)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
