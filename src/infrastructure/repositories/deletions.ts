import type { DeletableKind, DeletionLogEntry } from "@/domain/entities";
import type { SupabaseServerClient } from "@/infrastructure/supabase/server";
import { raise } from "./errors";
import { removeStorageObjects } from "./photos";

/**
 * Deletes a species, dive site or photo into the recycle bin: the item and
 * everything removed with it are kept for 14 days so an admin can restore them.
 */
export async function deleteWithLog(
  db: SupabaseServerClient,
  kind: DeletableKind,
  id: string,
  reason: string,
): Promise<void> {
  const { error } = await db.rpc("delete_with_log", { p_kind: kind, p_id: id, p_reason: reason });
  if (error) raise(error, "delete this item");
}

export async function restoreDeletion(db: SupabaseServerClient, logId: string): Promise<void> {
  const { error } = await db.rpc("restore_deleted", { p_log_id: logId });
  if (error) raise(error, "restore this item");
}

/** Purges items past their recovery period and removes their uploaded files. */
export async function purgeExpiredDeletions(db: SupabaseServerClient): Promise<void> {
  const { data, error } = await db.rpc("purge_expired_deletions");
  if (error) raise(error, "purge expired deletions");
  await removeStorageObjects(db, data ?? []);
}

export async function listDeletions(db: SupabaseServerClient, limit = 100): Promise<DeletionLogEntry[]> {
  const { data, error } = await db
    .from("deletion_log")
    .select(
      "*, deleter:profiles!deletion_log_deleted_by_fkey(username, display_name), restorer:profiles!deletion_log_restored_by_fkey(username, display_name)",
    )
    .order("deleted_at", { ascending: false })
    .limit(limit);
  if (error) raise(error, "load deleted items");
  const name = (p: { username: string; display_name: string | null } | null) => (p ? (p.display_name ?? p.username) : null);
  return data.map((row) => {
    const snapshot = (row.snapshot ?? {}) as Record<string, unknown>;
    const removed: Record<string, number> = {};
    for (const [table, rows] of Object.entries(snapshot)) {
      if (table !== "covers" && Array.isArray(rows) && rows.length) removed[table] = rows.length;
    }
    return {
      id: row.id,
      kind: row.kind,
      recordId: row.record_id,
      label: row.label,
      reason: row.reason,
      deletedBy: name(row.deleter),
      deletedAt: row.deleted_at,
      restoreUntil: row.restore_until,
      restoredBy: name(row.restorer),
      restoredAt: row.restored_at,
      purgedAt: row.purged_at,
      removed,
    };
  });
}
