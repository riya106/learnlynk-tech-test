import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
    }

    const body = await req.json();
    const { application_id, task_type, due_at } = body;

    // Allowed task types
    const allowed = ["call", "email", "review"];

    // Validate input
    if (!application_id || !task_type || !due_at) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }

    if (!allowed.includes(task_type)) {
      return new Response(JSON.stringify({ error: "Invalid task type" }), { status: 400 });
    }

    const parsedDue = new Date(due_at);

    if (parsedDue <= new Date()) {
      return new Response(JSON.stringify({ error: "due_at must be in the future" }), { status: 400 });
    }

    // Insert into tasks
    const { data, error } = await supabase
      .from("tasks")
      .insert({
        related_id: application_id,
        type: task_type,
        due_at: parsedDue.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select("id")
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    const taskId = data.id;

    // Broadcast event via Realtime (optional)
    await supabase.rpc("send_task_created", {
      payload: { task_id: taskId }
    });

    return new Response(
      JSON.stringify({ success: true, task_id: taskId }),
      { status: 200 }
    );

  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
});
