# Life OS Dashboard UI Fix Plan

## Overview

Transform the 3 feature pages from Swagger API doc links into fully functional, visually appealing dashboard pages.

## Design Principles (Combined from ChatGPT + Gemini)

1. **Dark Theme** - Match existing dashboard aesthetic (slate-900/950 backgrounds)
2. **Command Center Feel** - Tactical, sci-fi inspired UI with clean typography
3. **Glanceability** - Key metrics visible at a glance, status badges with color coding
4. **Actionability** - Every view has clear CTAs (Create, Edit, Delete, Run)
5. **Real-time** - WebSocket integration for live updates

## Technology Stack

- **React 18** + TypeScript
- **Tailwind CSS** - Utility-first styling matching dark theme
- **React Query (TanStack)** - Data fetching with caching and optimistic updates
- **lucide-react** - Icon library
- **React Router v6** - Page navigation

## API Endpoints (Backend Ready)

| Endpoint | Methods | Purpose |
|----------|---------|---------|
| `/api/v1/tasks` | GET, POST, PUT, DELETE | Scheduled task CRUD |
| `/api/v1/agents` | GET, POST, PUT, DELETE | Agent registry |
| `/api/v1/projects` | GET, POST, PUT, DELETE | Project management |

---

## Page 1: TasksPage

### Purpose
Display and manage scheduled tasks with cron expressions, status tracking, and execution controls.

### Layout
```
+--------------------------------------------------+
| [+ Create Task]              [Search] [Filters]  |
+--------------------------------------------------+
| Task Name     | Skill     | Schedule  | Status   |
|---------------|-----------|-----------|----------|
| Morning Brief | cascade   | 0 6 * * * | Running  |
| DB Backup     | backup    | 0 0 * * * | Pending  |
| Health Sync   | health    | */30 * *  | Failed   |
+--------------------------------------------------+
```

### Components
1. **TaskTable** - Main data table with sortable columns
2. **TaskStatusBadge** - Color-coded status (pending=yellow, running=blue, completed=green, failed=red)
3. **CreateTaskModal** - Form with skill selection, cron builder
4. **TaskActions** - Edit, Delete, Run Now buttons

### Data Model
```typescript
interface Task {
  id: string;
  name: string;
  skill_name: string;
  cron_expression: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  next_run_at: string;
  last_run_at: string | null;
  created_at: string;
}
```

---

## Page 2: AgentsPage

### Purpose
Monitor AI agent registry with activity metrics, execution history, and performance stats.

### Layout
```
+--------------------------------------------------+
| [Filter by Type v] [Filter by Status v] [Search] |
+--------------------------------------------------+
| +-------------+  +-------------+  +-------------+ |
| | Agent Name  |  | Agent Name  |  | Agent Name  | |
| | Type: X     |  | Type: Y     |  | Type: Z     | |
| | Runs: 142   |  | Runs: 89    |  | Runs: 234   | |
| | Success: 98%|  | Success: 85%|  | Success: 99%| |
| | Last: 2h ago|  | Last: 5m ago|  | Last: 1d ago| |
| +-------------+  +-------------+  +-------------+ |
+--------------------------------------------------+
| Activity Timeline                                |
| [====] code-reviewer ran successfully (2m ago)   |
| [====] bug-fixer completed with errors (5m ago)  |
+--------------------------------------------------+
```

### Components
1. **AgentGrid** - Card grid layout for agents
2. **AgentCard** - Individual agent with metrics (runs, success rate, avg duration)
3. **AgentFilter** - Filter by type and status dropdowns
4. **ActivityTimeline** - Recent agent activity log

### Data Model
```typescript
interface Agent {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'inactive' | 'error';
  total_runs: number;
  success_rate: number;
  avg_duration_ms: number;
  last_active_at: string | null;
}
```

---

## Page 3: ProjectsPage

### Purpose
Organize tasks into projects with progress tracking and hierarchical task management.

### Layout
```
+--------------------------------------------------+
| [+ New Project]                        [Search]  |
+--------------------------------------------------+
| +---------------------------------------------+  |
| | Project Alpha                    [75%] === |  |
| | Tasks: 12/16 completed                     |  |
| | +-- Task 1 [Done]                          |  |
| | +-- Task 2 [In Progress]                   |  |
| | +-- Task 3 [Pending]                       |  |
| +---------------------------------------------+  |
| +---------------------------------------------+  |
| | Project Beta                     [30%] ==  |  |
| | Tasks: 3/10 completed                      |  |
| +---------------------------------------------+  |
+--------------------------------------------------+
```

### Components
1. **ProjectList** - Expandable project cards
2. **ProjectCard** - Project with progress radial/bar
3. **ProjectTaskTree** - Nested task hierarchy
4. **CreateProjectModal** - Project creation form
5. **ProjectStats** - Task count, completion percentage

### Data Model
```typescript
interface Project {
  id: string;
  name: string;
  description: string;
  task_count: number;
  completed_count: number;
  tasks: Task[];
  created_at: string;
}
```

---

## Implementation Order

1. **Phase 1: Setup**
   - Install dependencies: `npm install @tanstack/react-query lucide-react react-router-dom`
   - Create API service layer
   - Add React Router to App.tsx

2. **Phase 2: TasksPage** (Priority - most used)
   - Create TasksPage.tsx
   - Implement data table with status badges
   - Add create/edit modal
   - Connect to /api/v1/tasks

3. **Phase 3: AgentsPage**
   - Create AgentsPage.tsx
   - Implement card grid with metrics
   - Add activity timeline
   - Connect to /api/v1/agents

4. **Phase 4: ProjectsPage**
   - Create ProjectsPage.tsx
   - Implement expandable project cards
   - Add nested task display
   - Connect to /api/v1/projects

5. **Phase 5: Navigation**
   - Update App.tsx with routes
   - Add sidebar/nav menu
   - Link from homepage cards

---

## Styling Guidelines

### Color Palette (Dark Theme)
- Background: `bg-slate-950` (#020617)
- Card: `bg-slate-900` (#0f172a)
- Border: `border-slate-800` (#1e293b)
- Text Primary: `text-slate-200` (#e2e8f0)
- Text Secondary: `text-slate-400` (#94a3b8)
- Accent: `text-cyan-500` (#06b6d4)

### Status Colors
- Pending: `bg-yellow-500/20 text-yellow-400`
- Running: `bg-blue-500/20 text-blue-400`
- Completed: `bg-green-500/20 text-green-400`
- Failed: `bg-red-500/20 text-red-400`

### Component Patterns
- Cards: `rounded-lg border border-slate-800 bg-slate-900/50 p-4`
- Buttons: `px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white`
- Tables: `divide-y divide-slate-800`

---

## File Structure

```
src/
  components/
    tasks/
      TasksPage.tsx
      TaskTable.tsx
      TaskStatusBadge.tsx
      CreateTaskModal.tsx
    agents/
      AgentsPage.tsx
      AgentGrid.tsx
      AgentCard.tsx
      ActivityTimeline.tsx
    projects/
      ProjectsPage.tsx
      ProjectCard.tsx
      ProjectTaskTree.tsx
  services/
    api.ts           # API client with React Query hooks
  types/
    index.ts         # TypeScript interfaces
  App.tsx            # Router setup
```

---

## Success Criteria

- [ ] All 3 pages render with data from backend API
- [ ] CRUD operations work for tasks, agents, projects
- [ ] Status badges display correct colors
- [ ] Filters and search functional
- [ ] Dark theme consistent with homepage
- [ ] Mobile responsive (basic)
- [ ] No console errors
- [ ] Deployed to Railway
