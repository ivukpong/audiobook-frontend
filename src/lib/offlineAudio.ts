const DB_NAME = "audora-offline";
const STORE_NAME = "audio";
const DB_VERSION = 1;

type OfflineAudioRecord = {
  bookId: string;
  blob: Blob;
  updatedAt: number;
};

export type OfflineAudioMeta = {
  bookId: string;
  sizeBytes: number;
  updatedAt: number;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "bookId" });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error("Failed to open offline database"));
  });
}

function withStore<T>(
  mode: IDBTransactionMode,
  handler: (store: IDBObjectStore) => IDBRequest,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, mode);
        const store = tx.objectStore(STORE_NAME);
        const req = handler(store);

        req.onsuccess = () => resolve(req.result as T);
        req.onerror = () => reject(req.error || new Error("IndexedDB request failed"));
        tx.oncomplete = () => db.close();
        tx.onerror = () => reject(tx.error || new Error("IndexedDB transaction failed"));
      }),
  );
}

export async function saveOfflineAudio(bookId: string, blob: Blob): Promise<void> {
  await withStore<void>("readwrite", (store) =>
    store.put({ bookId, blob, updatedAt: Date.now() } satisfies OfflineAudioRecord),
  );
}

export async function getOfflineAudio(bookId: string): Promise<Blob | null> {
  const record = await withStore<OfflineAudioRecord | undefined>("readonly", (store) =>
    store.get(bookId),
  );
  return record?.blob || null;
}

export async function hasOfflineAudio(bookId: string): Promise<boolean> {
  const record = await withStore<OfflineAudioRecord | undefined>("readonly", (store) =>
    store.get(bookId),
  );
  return Boolean(record?.blob);
}

export async function removeOfflineAudio(bookId: string): Promise<void> {
  await withStore<void>("readwrite", (store) => store.delete(bookId));
}

export async function listOfflineAudioMeta(): Promise<OfflineAudioMeta[]> {
  const records = await withStore<OfflineAudioRecord[]>("readonly", (store) =>
    store.getAll(),
  );

  return records.map((record) => ({
    bookId: record.bookId,
    sizeBytes: record.blob.size,
    updatedAt: record.updatedAt,
  }));
}
