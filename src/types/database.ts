// src/types/database.ts

export type UserRole = 'super_admin' | 'admin' | 'team_manager' | 'employee' | 'viewer';

export type TaskStatus =
  | 'draft'
  | 'pending'
  | 'assigned'
  | 'in_progress'
  | 'blocked'
  | 'waiting_review'
  | 'completed'
  | 'rejected'
  | 'closed'
  | 'archived';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical' | 'emergency';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export type NotificationType =
  | 'task_assigned'
  | 'task_updated'
  | 'task_completed'
  | 'comment_added'
  | 'mention'
  | 'approval_requested'
  | 'approval_approved'
  | 'approval_rejected'
  | 'due_date_approaching'
  | 'sla_breached'
  | 'team_added'
  | 'file_uploaded';

export type EmailStatus = 'queued' | 'processing' | 'sent' | 'failed' | 'bounced';

// ============================================
// DATABASE TYPES
// ============================================

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  department_id: string | null;
  job_title: string | null;
  phone: string | null;
  timezone: string;
  is_active: boolean;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  name: string;
  description: string | null;
  head_id: string | null;
  parent_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  department_id: string | null;
  manager_id: string | null;
  avatar_url: string | null;
  color: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  created_at: string;
}

export interface Task {
  id: string;
  task_number: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: string | null;
  team_id: string | null;
  reporter_id: string | null;
  due_date: string | null;
  start_date: string | null;
  completed_at: string | null;
  progress: number;
  estimated_hours: number | null;
  actual_hours: number | null;
  sla_deadline: string | null;
  sla_breached: boolean;
  parent_task_id: string | null;
  department_id: string | null;
  is_archived: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskLabel {
  id: string;
  name: string;
  color: string;
  description: string | null;
  organization_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskLabelMapping {
  id: string;
  task_id: string;
  label_id: string;
  created_at: string;
}

export interface TaskDependency {
  id: string;
  task_id: string;
  depends_on_task_id: string;
  dependency_type: string;
  created_at: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  is_edited: boolean;
  edited_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskAttachment {
  id: string;
  task_id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  mime_type: string | null;
  created_at: string;
}

export interface TaskChecklist {
  id: string;
  task_id: string;
  title: string;
  is_completed: boolean;
  completed_by: string | null;
  completed_at: string | null;
  position: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskWatcher {
  id: string;
  task_id: string;
  user_id: string;
  created_at: string;
}

export interface Approval {
  id: string;
  task_id: string;
  requested_by: string;
  approver_id: string | null;
  status: ApprovalStatus;
  comments: string | null;
  requested_at: string;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string | null;
  data: Record<string, unknown>;
  is_read: boolean;
  read_at: string | null;
  task_id: string | null;
  actor_id: string | null;
  created_at: string;
}

export interface TaskActivityLog {
  id: string;
  task_id: string;
  user_id: string | null;
  action: string;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  theme: string;
  language: string;
  date_format: string;
  time_format: string;
  default_task_view: string;
  sidebar_collapsed: boolean;
  settings_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  email_task_assigned: boolean;
  email_task_updated: boolean;
  email_comments: boolean;
  email_mentions: boolean;
  email_approvals: boolean;
  email_due_reminders: boolean;
  email_daily_digest: boolean;
  email_weekly_summary: boolean;
  push_enabled: boolean;
  push_task_assigned: boolean;
  push_comments: boolean;
  push_mentions: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  text_content: string | null;
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailQueue {
  id: string;
  to_email: string;
  to_name: string | null;
  subject: string;
  html_content: string;
  text_content: string | null;
  template_id: string | null;
  status: EmailStatus;
  retry_count: number;
  max_retries: number;
  error_message: string | null;
  provider_response: Record<string, unknown> | null;
  scheduled_at: string;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmailLog {
  id: string;
  email_queue_id: string | null;
  user_id: string | null;
  to_email: string;
  subject: string;
  status: EmailStatus;
  provider: string | null;
  provider_message_id: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  bounced_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface SavedFilter {
  id: string;
  user_id: string;
  name: string;
  entity_type: string;
  filters: Record<string, unknown>;
  is_default: boolean;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// EXTENDED TYPES WITH RELATIONS
// ============================================

export interface TaskWithRelations extends Task {
  assignee?: Profile | null;
  team?: Team | null;
  reporter?: Profile | null;
  creator?: Profile | null;
  labels?: TaskLabel[];
  comments?: TaskCommentWithUser[];
  attachments?: TaskAttachment[];
  checklists?: TaskChecklist[];
  watchers?: Profile[];
  dependencies?: Task[];
  dependents?: Task[];
  subtasks?: Task[];
  approval?: Approval | null;
}

export interface TaskCommentWithUser extends TaskComment {
  user: Profile;
  replies?: TaskCommentWithUser[];
}

export interface TeamWithRelations extends Team {
  manager?: Profile | null;
  department?: Department | null;
  members?: TeamMemberWithProfile[];
}

export interface TeamMemberWithProfile extends TeamMember {
  user: Profile;
}

export interface NotificationWithRelations extends Notification {
  task?: Task | null;
  actor?: Profile | null;
}

// ============================================
// API TYPES
// ============================================

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee_id?: string;
  team_id?: string;
  due_date?: string;
  start_date?: string;
  estimated_hours?: number;
  sla_deadline?: string;
  parent_task_id?: string;
  department_id?: string;
  labels?: string[];
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
  progress?: number;
  actual_hours?: number;
  completed_at?: string;
  is_archived?: boolean;
}

export interface CreateTeamInput {
  name: string;
  description?: string;
  department_id?: string;
  manager_id?: string;
  color?: string;
}

export interface UpdateTeamInput extends Partial<CreateTeamInput> {
  is_active?: boolean;
}

export interface TaskFilters {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  assignee_id?: string;
  team_id?: string;
  reporter_id?: string;
  labels?: string[];
  due_date_from?: string;
  due_date_to?: string;
  created_from?: string;
  created_to?: string;
  search?: string;
  is_archived?: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// ============================================
// DASHBOARD ANALYTICS TYPES
// ============================================

export interface DashboardStats {
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  pending_approvals: number;
  tasks_by_status: Record<TaskStatus, number>;
  tasks_by_priority: Record<TaskPriority, number>;
  completion_rate: number;
  sla_compliance: number;
}

export interface TeamProductivity {
  team_id: string;
  team_name: string;
  total_tasks: number;
  completed_tasks: number;
  avg_completion_time: number;
  completion_rate: number;
}

export interface UserWorkload {
  user_id: string;
  user_name: string;
  assigned_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  in_progress_tasks: number;
}
