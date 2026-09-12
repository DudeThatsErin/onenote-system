import { GraphError, graph } from '@/lib/graph';

// Microsoft To Do, through the same Microsoft connection OneNote uses.
//
// This needs the Tasks.ReadWrite scope. Adding it to SCOPES does not upgrade a
// token that was already issued, so connections made before it was added keep
// working for OneNote and fail here until Microsoft is reconnected.

export const MAX_TASK_TITLE_LENGTH = 255;
export const MAX_TASK_NOTE_LENGTH = 10_000;

export class TodoError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'TodoError';
  }
}

export type TodoList = { id: string; name: string; isDefault: boolean };
export type TodoTask = {
  id: string;
  title: string;
  status: string;
  completed: boolean;
  dueDateTime: string | null;
  note: string | null;
};

const RECONNECT =
  'This Microsoft connection has not approved To Do access yet. Add the Tasks.ReadWrite '
  + 'delegated permission to your Microsoft app registration, then reconnect Microsoft in setup. '
  + 'OneNote keeps working in the meantime.';

/**
 * Graph rejects To Do on a token issued before Tasks.ReadWrite with 401, not
 * 403. Reporting that as "credentials rejected" sends people to reconnect
 * without first adding the permission, which fails again identically -- so both
 * statuses are reported as the missing scope.
 */
function wrap(error: unknown, what: string) {
  if (error instanceof TodoError) return error;
  if (error instanceof GraphError) {
    if (error.status === 401 || error.status === 403 || /Tasks\.ReadWrite/i.test(error.message)) {
      return new TodoError(RECONNECT, 403);
    }
    if (error.status === 429) return new TodoError('Microsoft is rate limiting To Do requests. Try again shortly.', 429);
    return new TodoError(`${what} failed: ${error.message}`, error.status >= 400 && error.status < 600 ? error.status : 502);
  }
  return new TodoError(error instanceof Error ? error.message : `${what} failed.`, 502);
}

/** Every To Do list on the account, default list first. */
export async function listTodoLists(userId: string): Promise<TodoList[]> {
  let data: { value?: { id: string; displayName: string; wellknownListName?: string }[] };
  try {
    const response = await graph(userId, '/me/todo/lists?$select=id,displayName,wellknownListName&$top=100', {
      headers: { accept: 'application/json' },
    });
    data = await response.json();
  } catch (error) {
    throw wrap(error, 'Listing To Do lists');
  }

  return (data.value ?? [])
    .map((list) => ({ id: list.id, name: list.displayName, isDefault: list.wellknownListName === 'defaultList' }))
    .sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
}

/**
 * Resolves a list name to its ID. With no name, uses the account's default
 * list. Matching is case-insensitive.
 */
export async function resolveList(userId: string, name?: string): Promise<TodoList> {
  const lists = await listTodoLists(userId);
  if (!lists.length) throw new TodoError('This Microsoft account has no To Do lists.', 404);

  const wanted = (name ?? '').trim();
  if (!wanted) return lists.find((list) => list.isDefault) ?? lists[0];

  const matches = lists.filter((list) => list.name.toLowerCase() === wanted.toLowerCase());
  if (matches.length === 1) return matches[0];
  if (matches.length > 1) throw new TodoError(`More than one To Do list is called "${wanted}".`, 409);
  throw new TodoError(
    `No To Do list called "${wanted}". Available: ${lists.map((list) => list.name).join(', ')}.`,
    404,
  );
}

// Graph wants a date-time plus a zone. A bare YYYY-MM-DD means "that day" in
// the caller's zone, so send midnight rather than letting Graph assume UTC and
// shift the task a day for anyone west of London.
function graphDateTime(value: string, timeZone: string, field: string) {
  const text = value.trim();
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(text);
  const parsed = new Date(dateOnly ? `${text}T00:00:00` : text);
  if (Number.isNaN(parsed.getTime())) throw new TodoError(`${field} "${value}" is not a date.`, 400);
  return { dateTime: dateOnly ? `${text}T00:00:00` : text.replace(/Z$/, ''), timeZone: timeZone || 'UTC' };
}

export async function createTask(
  userId: string,
  {
    title,
    note = '',
    listName = '',
    dueDate = null,
    reminder = null,
    timeZone = 'UTC',
  }: {
    title: string;
    note?: string;
    listName?: string;
    dueDate?: string | null;
    reminder?: string | null;
    timeZone?: string;
  },
) {
  const cleanTitle = title.trim();
  if (!cleanTitle) throw new TodoError('title is required.', 400);
  if (cleanTitle.length > MAX_TASK_TITLE_LENGTH) {
    throw new TodoError(`title cannot exceed ${MAX_TASK_TITLE_LENGTH} characters.`, 400);
  }
  if (note.length > MAX_TASK_NOTE_LENGTH) {
    throw new TodoError(`note cannot exceed ${MAX_TASK_NOTE_LENGTH.toLocaleString('en-US')} characters.`, 400);
  }

  const list = await resolveList(userId, listName);
  const body: Record<string, unknown> = { title: cleanTitle };
  if (note) body.body = { content: note, contentType: 'text' };
  if (dueDate) body.dueDateTime = graphDateTime(dueDate, timeZone, 'dueDate');
  if (reminder) {
    body.reminderDateTime = graphDateTime(reminder, timeZone, 'reminder');
    body.isReminderOn = true;
  }

  try {
    const response = await graph(userId, `/me/todo/lists/${encodeURIComponent(list.id)}/tasks`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const task = await response.json();
    return {
      id: task.id as string,
      title: task.title as string,
      list: list.name,
      listId: list.id,
      status: task.status as string,
      dueDateTime: task.dueDateTime?.dateTime ?? null,
    };
  } catch (error) {
    throw wrap(error, 'Creating the task');
  }
}

export async function listTasks(
  userId: string,
  { listName = '', includeCompleted = false, top = 25 }: { listName?: string; includeCompleted?: boolean; top?: number } = {},
) {
  const list = await resolveList(userId, listName);
  const limit = Math.min(Math.max(Number(top) || 25, 1), 100);
  const query = new URLSearchParams({ $select: 'id,title,status,dueDateTime,body', $top: String(limit) });
  if (!includeCompleted) query.set('$filter', "status ne 'completed'");

  try {
    const response = await graph(
      userId,
      `/me/todo/lists/${encodeURIComponent(list.id)}/tasks?${query.toString()}`,
      { headers: { accept: 'application/json' } },
    );
    const data = await response.json() as {
      value?: { id: string; title: string; status: string; dueDateTime?: { dateTime?: string }; body?: { content?: string } }[];
    };
    const tasks: TodoTask[] = (data.value ?? []).map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      completed: task.status === 'completed',
      dueDateTime: task.dueDateTime?.dateTime ?? null,
      note: task.body?.content?.trim() || null,
    }));
    return { list: list.name, listId: list.id, tasks };
  } catch (error) {
    throw wrap(error, 'Listing tasks');
  }
}

export async function completeTask(userId: string, { id, listName = '' }: { id: string; listName?: string }) {
  const taskId = id.trim();
  if (!taskId) throw new TodoError('id is required.', 400);
  const list = await resolveList(userId, listName);

  try {
    const response = await graph(
      userId,
      `/me/todo/lists/${encodeURIComponent(list.id)}/tasks/${encodeURIComponent(taskId)}`,
      { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status: 'completed' }) },
    );
    const task = await response.json();
    return { id: task.id as string, title: task.title as string, list: list.name, status: task.status as string };
  } catch (error) {
    if (error instanceof GraphError && error.status === 404) {
      throw new TodoError(`No task with that id in "${list.name}".`, 404);
    }
    throw wrap(error, 'Completing the task');
  }
}
