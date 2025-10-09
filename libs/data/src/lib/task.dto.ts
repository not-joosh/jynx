// ============================================================================
// TASK DTOs
// ============================================================================

export enum TaskStatus {
  DRAFT = 'draft',
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  DONE = 'done',
  ARCHIVED = 'archived'
}

export enum TaskPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export enum TaskType {
  BUG = 'bug',
  FEATURE = 'feature',
  IMPROVEMENT = 'improvement',
  EPIC = 'epic',
  STORY = 'story'
}

export interface TaskDto {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  organizationId: string;
  assigneeId?: string;
  creatorId: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  priority: TaskPriority;
  status?: TaskStatus;
  assigneeId?: string;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  completedAt?: Date;
}

// Simple task filter for prototype
export interface TaskFilterDto {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  assigneeId?: string;
  search?: string;
}