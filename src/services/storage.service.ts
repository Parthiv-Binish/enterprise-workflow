// src/services/storage.service.ts

import { supabase } from '@/integrations/supabase/client';
import { debugError, throwIfSupabaseError } from '@/lib/debug';
import type { TaskAttachment } from '@/types/database';

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'video/mp4',
  'video/webm',
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const storageService = {
  validateFile(file: File): { valid: boolean; error?: string } {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed`,
      };
    }

    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      };
    }

    return { valid: true };
  },

  async uploadTaskAttachment(
    taskId: string,
    file: File
  ): Promise<TaskAttachment> {
    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Generate unique file path
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `${user?.id}/${taskId}/${fileName}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('attachments')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    throwIfSupabaseError('storage.service', 'uploadTaskAttachment:storage', uploadError, {
      taskId,
      filePath,
    });

    // Create attachment record
    const { data, error } = await supabase
      .from('task_attachments')
      .insert({
        task_id: taskId,
        user_id: user?.id,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: fileExt || 'unknown',
        mime_type: file.type,
      })
      .select()
      .single();

    if (error) {
      const { error: rmErr } = await supabase.storage
        .from('attachments')
        .remove([filePath]);
      if (rmErr) {
        debugError(
          'storage.service',
          'uploadTaskAttachment:cleanup_storage_failed',
          rmErr,
          { filePath }
        );
      }
      throwIfSupabaseError('storage.service', 'uploadTaskAttachment:record', error, {
        taskId,
        filePath,
      });
    }

    return data;
  },

  async deleteAttachment(attachment: TaskAttachment): Promise<void> {
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('attachments')
      .remove([attachment.file_path]);

    throwIfSupabaseError('storage.service', 'deleteAttachment:storage', storageError, {
      attachmentId: attachment.id,
      file_path: attachment.file_path,
    });

    // Delete record
    const { error } = await supabase
      .from('task_attachments')
      .delete()
      .eq('id', attachment.id);

    throwIfSupabaseError('storage.service', 'deleteAttachment:record', error, {
      attachmentId: attachment.id,
    });
  },

  async getAttachmentUrl(filePath: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from('attachments')
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    throwIfSupabaseError('storage.service', 'getAttachmentUrl', error, { filePath });

    if (!data?.signedUrl) {
      const err = new Error('Failed to generate download URL');
      debugError('storage.service', 'getAttachmentUrl:empty', err, { filePath });
      throw err;
    }

    return data.signedUrl;
  },

  async downloadAttachment(attachment: TaskAttachment): Promise<void> {
    const url = await this.getAttachmentUrl(attachment.file_path);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = attachment.file_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};
