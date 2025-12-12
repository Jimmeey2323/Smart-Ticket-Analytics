import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  ArrowLeft,
  Clock,
  User,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  History,
  Paperclip,
  Loader2,
  Edit,
  Trash2,
  Send,
  AlertCircle,
} from "lucide-react";
import type { TicketWithRelations, TicketComment, TicketHistory } from "@shared/schema";

type ApiCategory = {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  color_code?: string | null;
};

type ApiLocation = {
  id: string;
  name: string;
};

const statusOptions = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "pending", label: "Pending" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
  { value: "escalated", label: "Escalated" },
];

const priorityOptions = [
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

function StatusBadge({ status }: { status: string }) {
  const statusStyles: Record<string, string> = {
    open: "status-open",
    in_progress: "status-in-progress",
    pending: "status-pending",
    resolved: "status-resolved",
    closed: "status-closed",
    escalated: "status-escalated",
  };

  return (
    <Badge variant="secondary" className={statusStyles[status]}>
      {status.replace("_", " ")}
    </Badge>
  );
}

function PriorityIndicator({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    critical: "priority-critical",
    high: "priority-high",
    medium: "priority-medium",
    low: "priority-low",
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${colors[priority]}`} />
      <span className="capitalize">{priority}</span>
    </div>
  );
}

function CommentItem({ comment }: { comment: TicketComment }) {
  return (
    <div className="flex gap-3">
      <Avatar className="h-8 w-8">
        <AvatarFallback className="text-xs">U</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">User</span>
          <span className="text-xs text-muted-foreground">
            {new Date(comment.createdAt!).toLocaleString()}
          </span>
          {comment.isInternal && (
            <Badge variant="outline" className="text-xs">Internal</Badge>
          )}
        </div>
        <div className="p-3 rounded-md bg-muted/50 text-sm">
          {comment.content}
        </div>
      </div>
    </div>
  );
}

function HistoryItem({ history }: { history: TicketHistory }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <div className="w-2 h-2 rounded-full bg-primary mt-2" />
      <div className="flex-1">
        <p>
          <span className="font-medium capitalize">{history.action.replace("_", " ")}</span>
          {history.previousValue && history.newValue && (
            <span className="text-muted-foreground">
              {" "}from "{history.previousValue}" to "{history.newValue}"
            </span>
          )}
        </p>
        {history.description && (
          <p className="text-muted-foreground">{history.description}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {new Date(history.createdAt!).toLocaleString()}
        </p>
      </div>
    </div>
  );
}

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [newComment, setNewComment] = useState("");
  const [isInternal, setIsInternal] = useState(false);

  const { data: ticket, isLoading, error } = useQuery<TicketWithRelations>({
    queryKey: ["/api/tickets", id],
  });

  const { data: categories = [] } = useQuery<ApiCategory[]>({
    queryKey: ["/api/categories"],
  });

  const { data: locations = [] } = useQuery<ApiLocation[]>({
    queryKey: ["/api/locations"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const response = await apiRequest("PATCH", `/api/tickets/${id}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      toast({ title: "Status Updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updatePriorityMutation = useMutation({
    mutationFn: async (priority: string) => {
      const response = await apiRequest("PATCH", `/api/tickets/${id}/priority`, { priority });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      toast({ title: "Priority Updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async (data: { content: string; isInternal: boolean }) => {
      const response = await apiRequest("POST", `/api/tickets/${id}/comments`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", id] });
      setNewComment("");
      toast({ title: "Comment Added" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteTicketMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/tickets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      toast({ title: "Ticket Deleted" });
      setLocation("/tickets");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-medium text-lg mb-2">Ticket Not Found</h3>
          <p className="text-muted-foreground mb-4">
            The ticket you're looking for doesn't exist or you don't have access.
          </p>
          <Button onClick={() => setLocation("/tickets")}>
            Back to Tickets
          </Button>
        </CardContent>
      </Card>
    );
  }

  const category = categories.find((c) => c.id === ticket.categoryId);
  const location = locations.find((l) => l.id === ticket.locationId);
  const department = ticket.department;

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    addCommentMutation.mutate({ content: newComment.trim(), isInternal });
  };

  return (
    <div className="space-y-6 app-container">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/tickets")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <span className="text-sm font-mono text-muted-foreground">
                {ticket.ticketNumber}
              </span>
              <StatusBadge status={ticket.status} />
              {ticket.isEscalated && (
                <Badge variant="destructive">Escalated</Badge>
              )}
            </div>
            <h1 className="page-title">{ticket.title}</h1>
            <p className="page-subtitle mt-1">
              Created {new Date(ticket.createdAt!).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:self-start">
          <Button variant="outline" size="sm" data-testid="button-edit">
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" data-testid="button-delete">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Ticket?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the ticket
                  and all associated comments and history.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteTicketMutation.mutate()}
                  className="bg-destructive text-destructive-foreground"
                >
                  {deleteTicketMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{ticket.description}</p>
              {ticket.actionTakenImmediately && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <h4 className="font-medium text-sm mb-2">Action Taken Immediately</h4>
                    <p className="text-muted-foreground">{ticket.actionTakenImmediately}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {ticket.aiTags && ticket.aiTags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">AI Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {ticket.aiSentiment && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Sentiment:</span>
                      <Badge variant="secondary">{ticket.aiSentiment}</Badge>
                      {ticket.aiSentimentScore && (
                        <span className="text-sm">({ticket.aiSentimentScore}%)</span>
                      )}
                    </div>
                  )}
                  <div>
                    <span className="text-sm text-muted-foreground">Tags:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {ticket.aiTags.map((tag, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {ticket.aiKeywords && ticket.aiKeywords.length > 0 && (
                    <div>
                      <span className="text-sm text-muted-foreground">Keywords:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {ticket.aiKeywords.map((keyword, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="comments">
                <TabsList>
                  <TabsTrigger value="comments" className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    Comments
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {ticket.comments?.length || 0}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="history" className="flex items-center gap-1">
                    <History className="h-4 w-4" />
                    History
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {ticket.history?.length || 0}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="attachments" className="flex items-center gap-1">
                    <Paperclip className="h-4 w-4" />
                    Attachments
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {ticket.attachments?.length || ticket.attachmentsCount || 0}
                    </Badge>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="comments" className="space-y-4 mt-4">
                  {ticket.comments && ticket.comments.length > 0 ? (
                    ticket.comments.map((comment) => (
                      <CommentItem key={comment.id} comment={comment} />
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No comments yet
                    </p>
                  )}

                  <Separator />

                  <div className="space-y-3">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      rows={3}
                      data-testid="textarea-comment"
                    />
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={isInternal}
                          onChange={(e) => setIsInternal(e.target.checked)}
                          className="rounded border-input"
                        />
                        Internal note (not visible to client)
                      </label>
                      <Button
                        onClick={handleSubmitComment}
                        disabled={!newComment.trim() || addCommentMutation.isPending}
                        size="sm"
                        data-testid="button-add-comment"
                      >
                        {addCommentMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="mr-2 h-4 w-4" />
                        )}
                        Add Comment
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="history" className="space-y-4 mt-4">
                  {ticket.history && ticket.history.length > 0 ? (
                    ticket.history.map((history) => (
                      <HistoryItem key={history.id} history={history} />
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No history yet
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="attachments" className="mt-4">
                  {ticket.attachments && ticket.attachments.length > 0 ? (
                    <div className="space-y-2">
                      {ticket.attachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="flex items-center gap-3 p-3 rounded-md bg-muted/50"
                        >
                          <Paperclip className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm flex-1 truncate">
                            {attachment.fileName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {(attachment.fileSize / 1024).toFixed(1)} KB
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No attachments
                    </p>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Status</label>
                <Select
                  value={ticket.status}
                  onValueChange={(v) => updateStatusMutation.mutate(v)}
                  disabled={updateStatusMutation.isPending}
                >
                  <SelectTrigger className="mt-1" data-testid="select-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Priority</label>
                <Select
                  value={ticket.priority}
                  onValueChange={(v) => updatePriorityMutation.mutate(v)}
                  disabled={updatePriorityMutation.isPending}
                >
                  <SelectTrigger className="mt-1" data-testid="select-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Client:</span>
                  <span className="font-medium">{ticket.clientName}</span>
                </div>
                {ticket.clientEmail && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground ml-6">{ticket.clientEmail}</span>
                  </div>
                )}
                {ticket.clientPhone && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground ml-6">{ticket.clientPhone}</span>
                  </div>
                )}
                {ticket.clientStatus && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground ml-6">Status: {ticket.clientStatus}</span>
                  </div>
                )}
                {ticket.clientMood && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground ml-6">Mood: {ticket.clientMood}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Location:</span>
                  <span>{location?.name || ticket.locationId}</span>
                </div>
                {category && (
                  <div className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Category:</span>
                    <span>{category.name}</span>
                  </div>
                )}
                {department && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Department:</span>
                    <span>{department}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">SLA & Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ticket.slaDeadline && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">SLA Deadline:</span>
                  <span className={new Date(ticket.slaDeadline) < new Date() ? "text-destructive font-medium" : ""}>
                    {new Date(ticket.slaDeadline).toLocaleString()}
                  </span>
                </div>
              )}
              {ticket.incidentDateTime && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Incident:</span>
                  <span>{new Date(ticket.incidentDateTime).toLocaleString()}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Reported:</span>
                <span>{new Date(ticket.reportedDateTime).toLocaleString()}</span>
              </div>
              {ticket.firstResponseAt && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-muted-foreground">First Response:</span>
                  <span>{new Date(ticket.firstResponseAt).toLocaleString()}</span>
                </div>
              )}
              {ticket.resolvedAt && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-muted-foreground">Resolved:</span>
                  <span>{new Date(ticket.resolvedAt).toLocaleString()}</span>
                </div>
              )}
              {ticket.followUpRequired && (
                <div className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium">Follow-up Required</span>
                </div>
              )}
            </CardContent>
          </Card>

          {ticket.assignee && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Assigned To</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={ticket.assignee.profileImageUrl || undefined} />
                    <AvatarFallback>
                      {ticket.assignee.firstName?.charAt(0)}
                      {ticket.assignee.lastName?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {ticket.assignee.firstName} {ticket.assignee.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {ticket.assignee.role?.replace("_", " ")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
