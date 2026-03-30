/**
 * Input Validation and Sanitization Utilities
 * 
 * Provides secure input handling to prevent XSS, injection attacks, and data corruption.
 * Follows React Native security best practices 2026.
 */

/**
 * Sanitizes text input to prevent XSS attacks
 */
export function sanitizeTextInput(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .slice(0, 1000); // Limit length
}

/**
 * Validates task title with business rules
 */
export function validateTaskTitle(title: string): { isValid: boolean; error?: string } {
  if (!title || title.trim().length === 0) {
    return { isValid: false, error: 'Task title is required' };
  }
  
  if (title.trim().length > 200) {
    return { isValid: false, error: 'Task title must be 200 characters or less' };
  }
  
  if (title.trim().length < 1) {
    return { isValid: false, error: 'Task title cannot be empty' };
  }
  
  return { isValid: true };
}

/**
 * Validates task description with business rules
 */
export function validateTaskDescription(description: string): { isValid: boolean; error?: string } {
  if (description && description.length > 2000) {
    return { isValid: false, error: 'Description must be 2000 characters or less' };
  }
  
  return { isValid: true };
}

/**
 * Validates project name with business rules
 */
export function validateProjectName(name: string): { isValid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'Project name is required' };
  }
  
  if (name.trim().length > 50) {
    return { isValid: false, error: 'Project name must be 50 characters or less' };
  }
  
  if (name.trim().length < 1) {
    return { isValid: false, error: 'Project name cannot be empty' };
  }
  
  return { isValid: true };
}

/**
 * Validates and sanitizes task input data
 */
export function validateTaskInput(task: {
  title: string;
  description?: string;
  priority: 'high' | 'medium' | 'low';
  status: 'todo' | 'in_progress' | 'done';
  projectId?: string;
}): { isValid: boolean; errors: string[]; sanitizedTask?: any } {
  const errors: string[] = [];
  
  const titleValidation = validateTaskTitle(task.title);
  if (!titleValidation.isValid) {
    errors.push(titleValidation.error!);
  }
  
  if (task.description) {
    const descValidation = validateTaskDescription(task.description);
    if (!descValidation.isValid) {
      errors.push(descValidation.error!);
    }
  }
  
  const sanitizedTask = {
    title: sanitizeTextInput(task.title),
    description: task.description ? sanitizeTextInput(task.description) : '',
    priority: task.priority,
    status: task.status,
    projectId: task.projectId || ''
  };
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedTask
  };
}

/**
 * Validates and sanitizes project input data
 */
export function validateProjectInput(project: {
  name: string;
  emoji: string;
  color: string;
  description?: string;
}): { isValid: boolean; errors: string[]; sanitizedProject?: any } {
  const errors: string[] = [];
  
  const nameValidation = validateProjectName(project.name);
  if (!nameValidation.isValid) {
    errors.push(nameValidation.error!);
  }
  
  if (!project.emoji || project.emoji.length === 0) {
    errors.push('Project emoji is required');
  }
  
  if (!project.color || !/^#[0-9A-Fa-f]{6}$/.test(project.color)) {
    errors.push('Valid color code is required');
  }
  
  const sanitizedProject = {
    name: sanitizeTextInput(project.name),
    emoji: project.emoji.slice(0, 2), // Limit emoji length
    color: project.color,
    description: project.description ? sanitizeTextInput(project.description) : ''
  };
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedProject
  };
}
