"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function TodayTasks() {
  const queryClient = useQueryClient();

  // Helper to get today's date range
  const getToday = () => {
    const now = new Date();
    const start = new Date(now.setHours(0, 0, 0, 0)).toISOString();
    const end = new Date(now.setHours(23, 59, 59, 999)).toISOString();
    return { start, end };
  };

  const { start, end } = getToday();

  // Fetch tasks due today
  const { data, isLoading, error } = useQuery(["tasks_today"], async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("id, title, related_id, due_at, status")
      .gte("due_at", start)
      .lte("due_at", end)
      .order("due_at", { ascending: true });

    if (error) throw error;
    return data;
  });

  // Mutation: Mark task as completed
  const markComplete = useMutation(
    async (taskId: string) => {
      const { error } = await supabase
        .from("tasks")
        .update({ status: "completed" })
        .eq("id", taskId);

      if (error) throw error;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["tasks_today"]);
      }
    }
  );

  // UI
  if (isLoading) return <p>Loading tasks...</p>;
  if (error) return <p>Error loading tasks</p>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Tasks Due Today</h1>

      <table border={1} cellPadding={8} style={{ marginTop: 20 }}>
        <thead>
          <tr>
            <th>Title</th>
            <th>Application ID</th>
            <th>Due At</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {data?.length === 0 ? (
            <tr>
              <td colSpan={5}>No tasks due today.</td>
            </tr>
          ) : (
            data?.map((task: any) => (
              <tr key={task.id}>
                <td>{task.title ?? "Untitled"}</td>
                <td>{task.related_id}</td>
                <td>{new Date(task.due_at).toLocaleString()}</td>
                <td>{task.status}</td>
                <td>
                  {task.status !== "completed" && (
                    <button onClick={() => markComplete.mutate(task.id)}>
                      Mark Complete
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
