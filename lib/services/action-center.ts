/**
 * Unified Action Center Service
 *
 * This service automatically routes to either mock or Supabase
 * based on the current data mode (demo/live).
 */

import type {
  ActionItem,
  ActionNote,
  ActionCenterSummary,
  ListParams,
  ListResponse,
  Queue,
} from '@/types/action-center';

// Import both services
import * as mockService from '@/lib/mocks/action-center/service';
import * as supabaseService from '@/lib/services/action-center-supabase';

// Get current mode from localStorage (with SSR safety)
function getCurrentMode(): 'demo' | 'live' {
  if (typeof window === 'undefined') return 'demo';
  return (localStorage.getItem('ezra-admin-data-mode') as 'demo' | 'live') || 'demo';
}

// Route to the appropriate service
function getService() {
  const mode = getCurrentMode();
  return mode === 'demo' ? mockService : supabaseService;
}

export async function getSummary(): Promise<ActionCenterSummary> {
  return getService().getSummary();
}

export async function list(queue: Queue, params: ListParams = {}): Promise<ListResponse> {
  return getService().list(queue, params);
}

export async function assign(id: string, assigneeId?: string): Promise<ActionItem> {
  return getService().assign(id, assigneeId);
}

export async function resolve(
  id: string,
  resolution: string,
  note?: string
): Promise<ActionItem> {
  return getService().resolve(id, resolution, note);
}

export async function snooze(id: string, untilISO: string): Promise<ActionItem> {
  return getService().snooze(id, untilISO);
}

export async function addNote(id: string, body: string): Promise<ActionNote> {
  return getService().addNote(id, body);
}

export async function getNotes(id: string): Promise<ActionNote[]> {
  return getService().getNotes(id);
}

export async function retryWebhook(id: string): Promise<{ ok: boolean; message?: string }> {
  return getService().retryWebhook(id);
}

export async function performAction(
  id: string,
  action: string,
  data?: any
): Promise<ActionItem> {
  return getService().performAction(id, action, data);
}

export async function getItem(id: string): Promise<ActionItem | null> {
  return getService().getItem(id);
}

// Export mode check for debugging
export function isUsingDemo(): boolean {
  return getCurrentMode() === 'demo';
}

export function isUsingLive(): boolean {
  return getCurrentMode() === 'live';
}
