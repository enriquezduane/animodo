import { STORAGE_KEYS } from '../types';

/**
 * Abstract storage interface following Dependency Inversion Principle
 * This allows for easy testing and swapping storage implementations
 */
export interface IStorageService {
  getItem<T>(key: string): T | null;
  setItem<T>(key: string, value: T): void;
  removeItem(key: string): void;
  clear(): void;
}

/**
 * LocalStorage implementation of the storage service
 * Handles JSON serialization/deserialization automatically
 */
export class LocalStorageService implements IStorageService {
  getItem<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.warn(`Failed to parse localStorage item for key: ${key}`, error);
      return null;
    }
  }

  setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to set localStorage item for key: ${key}`, error);
    }
  }

  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove localStorage item for key: ${key}`, error);
    }
  }

  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Failed to clear localStorage', error);
    }
  }
}

/**
 * Strongly-typed storage service with predefined keys
 * Provides type safety for application-specific storage operations
 */
export class AppStorageService {
  constructor(private storage: IStorageService) {}

  // Canvas authentication
  getCanvasToken(): string | null {
    return this.storage.getItem<string>(STORAGE_KEYS.CANVAS_TOKEN);
  }

  setCanvasToken(token: string): void {
    this.storage.setItem(STORAGE_KEYS.CANVAS_TOKEN, token);
  }

  removeCanvasToken(): void {
    this.storage.removeItem(STORAGE_KEYS.CANVAS_TOKEN);
  }

  // Ignored assignments
  getIgnoredAssignments(): Set<number> {
    const ignored = this.storage.getItem<number[]>(STORAGE_KEYS.IGNORED_ASSIGNMENTS);
    return new Set(ignored || []);
  }

  setIgnoredAssignments(assignmentIds: Set<number>): void {
    this.storage.setItem(STORAGE_KEYS.IGNORED_ASSIGNMENTS, Array.from(assignmentIds));
  }

  // Assignment filters
  getAssignmentStatusFilters(): Set<string> {
    const filters = this.storage.getItem<string[]>(STORAGE_KEYS.ASSIGNMENT_STATUS_FILTERS);
    return new Set(filters || []);
  }

  setAssignmentStatusFilters(statuses: Set<string>): void {
    this.storage.setItem(STORAGE_KEYS.ASSIGNMENT_STATUS_FILTERS, Array.from(statuses));
  }

  // Course selection for assignments
  getSelectedCourses(): Set<number> {
    const courses = this.storage.getItem<number[]>(STORAGE_KEYS.SELECTED_COURSES);
    return new Set(courses || []);
  }

  setSelectedCourses(courseIds: Set<number>): void {
    this.storage.setItem(STORAGE_KEYS.SELECTED_COURSES, Array.from(courseIds));
  }

  getSelectAllCourses(): boolean {
    return this.storage.getItem<boolean>(STORAGE_KEYS.SELECT_ALL_COURSES) ?? true;
  }

  setSelectAllCourses(selectAll: boolean): void {
    this.storage.setItem(STORAGE_KEYS.SELECT_ALL_COURSES, selectAll);
  }

  // Course selection for announcements
  getAnnouncementSelectedCourses(): Set<number> {
    const courses = this.storage.getItem<number[]>(STORAGE_KEYS.ANNOUNCEMENT_SELECTED_COURSES);
    return new Set(courses || []);
  }

  setAnnouncementSelectedCourses(courseIds: Set<number>): void {
    this.storage.setItem(STORAGE_KEYS.ANNOUNCEMENT_SELECTED_COURSES, Array.from(courseIds));
  }

  getAnnouncementSelectAllCourses(): boolean {
    return this.storage.getItem<boolean>(STORAGE_KEYS.ANNOUNCEMENT_SELECT_ALL_COURSES) ?? true;
  }

  setAnnouncementSelectAllCourses(selectAll: boolean): void {
    this.storage.setItem(STORAGE_KEYS.ANNOUNCEMENT_SELECT_ALL_COURSES, selectAll);
  }
}

// Singleton instance for dependency injection
export const storageService = new AppStorageService(new LocalStorageService()); 