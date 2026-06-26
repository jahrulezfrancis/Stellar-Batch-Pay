/**
 * IndexedDB persistence layer for batch transaction recovery (#255).
 *
 * Stores per-transaction state (hash, status, batchIndex) in the browser so
 * that on page reload the user can see which transactions already confirmed
 * and resume only the ones that are still pending or failed.
 */

export type TxStatus = 'pending' | 'confirmed' | 'failed';

export interface PersistedTx {
  hash: string;
  batchIndex: number;
  recipientCount: number;
  status: TxStatus;
  submittedAt: string;
  confirmedAt?: string;
}

export interface PersistedBatch {
  jobId: string;
  createdAt: string;
  network: 'testnet' | 'mainnet';
  totalPayments: number;
  transactions: PersistedTx[];
}

const DB_NAME = 'stellar-batch-pay';
const DB_VERSION = 1;
const STORE = 'batches';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: 'jobId' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Persist or overwrite a batch record. */
export async function saveBatch(batch: PersistedBatch): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(batch);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Load a batch record by jobId. Returns null if not found. */
export async function loadBatch(jobId: string): Promise<PersistedBatch | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(jobId);
    req.onsuccess = () => resolve((req.result as PersistedBatch) ?? null);
    req.onerror = () => reject(req.error);
  });
}

/** Return all persisted batches, newest first. */
export async function listBatches(): Promise<PersistedBatch[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => {
      const all = (req.result as PersistedBatch[]) ?? [];
      resolve(all.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    };
    req.onerror = () => reject(req.error);
  });
}

// Serialize concurrent updateTxStatus calls per jobId so no two callers
// run their read-modify-write at the same time for the same batch.
const _updateQueues = new Map<string, Promise<void>>();

/** Update the status of a single transaction within a batch.
 *
 * Performs the read-modify-write inside a single IndexedDB `readwrite`
 * transaction so the snapshot and the write are atomic. A per-jobId promise
 * queue ensures concurrent callers are serialized and no update is lost.
 */
export async function updateTxStatus(
  jobId: string,
  hash: string,
  status: TxStatus,
  confirmedAt?: string,
): Promise<void> {
  const prev = _updateQueues.get(jobId) ?? Promise.resolve();
  const next = prev.then(() => _updateTxStatusAtomic(jobId, hash, status, confirmedAt));
  _updateQueues.set(jobId, next.catch(() => {}));
  return next;
}

async function _updateTxStatusAtomic(
  jobId: string,
  hash: string,
  status: TxStatus,
  confirmedAt?: string,
): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const getReq = store.get(jobId);
    getReq.onsuccess = () => {
      const batch = getReq.result as PersistedBatch | undefined;
      if (!batch) { resolve(); return; }
      const txEntry = batch.transactions.find((t) => t.hash === hash);
      if (txEntry) {
        txEntry.status = status;
        if (confirmedAt) txEntry.confirmedAt = confirmedAt;
        store.put(batch);
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Delete a batch record (e.g. after successful full completion). */
export async function deleteBatch(jobId: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(jobId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Return only the transactions from a batch that are not yet confirmed.
 * These are the ones that need to be retried on a "Resume Batch" action.
 */
export function getPendingTransactions(batch: PersistedBatch): PersistedTx[] {
  return batch.transactions.filter((t) => t.status !== 'confirmed');
}
