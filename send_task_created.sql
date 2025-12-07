create or replace function send_task_created(payload jsonb)
returns void
language plpgsql
as $$
begin
  perform pg_notify('task.created', payload::text);
end;
$$;
