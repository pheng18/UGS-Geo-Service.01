import { db } from './index.ts';
import { users } from './schema.ts';

export async function getOrCreateUser(uid: string, email: string) {
  try {
    const result = await db
      .insert(users)
      .values({
        uid,
        email: email || 'user@uniqtek.la'
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: email || 'user@uniqtek.la'
        }
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database user upsert failed:', error);
    throw new Error('Failed to synchronize user record.', { cause: error });
  }
}
