// supabase/functions/task-notifications/index.ts

import { serve } from '[deno.land](https://deno.land/std@0.168.0/http/server.ts)';
import { createClient } from '[esm.sh](https://esm.sh/@supabase/supabase-js@2)';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: any;
  old_record?: any;
}

serve(async (req) => {
  try {
    const payload: WebhookPayload = await req.json();
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    if (payload.table === 'tasks') {
      const task = payload.record;

      // Task assigned notification
      if (
        payload.type === 'UPDATE' &&
        task.assignee_id !== payload.old_record?.assignee_id &&
        task.assignee_id
      ) {
        // Get assignee details
        const { data: assignee } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', task.assignee_id)
          .single();

        // Get creator details
        const { data: creator } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', task.created_by)
          .single();

        // Create notification
        await supabase.from('notifications').insert({
          user_id: task.assignee_id,
          type: 'task_assigned',
          title: 'New Task Assigned',
          message: `${creator?.full_name || 'Someone'} assigned you to "${task.title}"`,
          task_id: task.id,
          actor_id: task.created_by,
        });

        // Check notification preferences and send email
        const { data: prefs } = await supabase
          .from('notification_preferences')
          .select('*')
          .eq('user_id', task.assignee_id)
          .single();

        if (prefs?.email_task_assigned && assignee?.email) {
          await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({
              to: assignee.email,
              toName: assignee.full_name,
              subject: `New Task Assigned: ${task.title}`,
              html: generateTaskAssignedEmail(task, creator, assignee),
              userId: task.assignee_id,
            }),
          });
        }
      }

      // Status changed notifications
      if (
        payload.type === 'UPDATE' &&
        task.status !== payload.old_record?.status
      ) {
        // Notify watchers
        const { data: watchers } = await supabase
          .from('task_watchers')
          .select('user_id')
          .eq('task_id', task.id);

        for (const watcher of watchers || []) {
          await supabase.from('notifications').insert({
            user_id: watcher.user_id,
            type: 'task_updated',
            title: 'Task Status Updated',
            message: `Task "${task.title}" status changed to ${task.status.replace('_', ' ')}`,
            task_id: task.id,
          });
        }

        // Approval requested
        if (task.status === 'waiting_review') {
          // Notify team manager and admins
          if (task.team_id) {
            const { data: team } = await supabase
              .from('teams')
              .select('manager_id')
              .eq('id', task.team_id)
              .single();

            if (team?.manager_id) {
              await supabase.from('notifications').insert({
                user_id: team.manager_id,
                type: 'approval_requested',
                title: 'Approval Requested',
                message: `Task "${task.title}" is waiting for your review`,
                task_id: task.id,
              });
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing notification:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

function generateTaskAssignedEmail(task: any, creator: any, assignee: any) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>New Task Assigned</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background: #6366f1; border-radius: 12px; padding: 12px;">
              <span style="color: white; font-size: 24px;">✓</span>
            </div>
          </div>
          
          <h1 style="font-size: 24px; font-weight: 600; text-align: center; margin: 0 0 8px;">
            New Task Assigned
          </h1>
          <p style="color: #71717a; text-align: center; margin: 0 0 32px;">
            ${creator?.full_name || 'Someone'} has assigned you a new task
          </p>

          <div style="background: #fafafa; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <h2 style="font-size: 18px; font-weight: 600; margin: 0 0 12px;">
              ${task.title}
            </h2>
            ${task.description ? `<p style="color: #52525b; margin: 0 0 16px; line-height: 1.5;">${task.description.slice(0, 200)}${task.description.length > 200 ? '...' : ''}</p>` : ''}
            
            <div style="display: flex; gap: 16px; flex-wrap: wrap;">
              <div>
                <span style="color: #71717a; font-size: 12px;">Priority</span>
                <p style="margin: 4px 0 0; font-weight: 500; text-transform: capitalize;">${task.priority}</p>
              </div>
              ${task.due_date ? `
              <div>
                <span style="color: #71717a; font-size: 12px;">Due Date</span>
                <p style="margin: 4px 0 0; font-weight: 500;">${new Date(task.due_date).toLocaleDateString()}</p>
              </div>
              ` : ''}
            </div>
          </div>

          <div style="text-align: center;">
            <a href="${Deno.env.get('APP_URL')}/tasks/${task.id}" 
               style="display: inline-block; background: #6366f1; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 500;">
              View Task
            </a>
          </div>
        </div>
        
        <p style="color: #a1a1aa; font-size: 12px; text-align: center; margin-top: 24px;">
          You received this email because you were assigned a task in WorkFlow.
          <a href="${Deno.env.get('APP_URL')}/settings/notifications" style="color: #6366f1;">Manage preferences</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
