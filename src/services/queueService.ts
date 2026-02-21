import { db } from './db';
import { transcribeEntryAI } from './geminiService';

let isProcessingQueue = false;

// Vi använder den gamla 'meetingId'-kolumnen för 'entryId' temporärt
// om vi inte vill bygga om processingJobs-tabellen i db.ts just nu.
export const addToQueue = async (entryId: string, type: 'audio' | 'text' = 'audio') => {
  await db.processingJobs.add({
    id: crypto.randomUUID(),
    meetingId: entryId, // Här sparar vi entryId!
    status: 'pending',
    progress: 0,
    message: 'I kö...',
    type,
    createdAt: new Date().toISOString()
  });

  processQueue();
};

export const processQueue = async () => {
  if (isProcessingQueue) return;
  isProcessingQueue = true;

  try {
    const pendingJobs = await db.processingJobs.where('status').equals('pending').toArray();
    if (pendingJobs.length === 0) {
      isProcessingQueue = false;
      return;
    }

    const job = pendingJobs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];
    const entryId = job.meetingId;

    await db.processingJobs.update(job.id, { status: 'processing', message: 'Startar transkribering...', progress: 5 });

    try {
      // Anropa vår nya transkriberings-AI
      await transcribeEntryAI(entryId, (progress, msg) => {
        db.processingJobs.update(job.id, { progress, message: msg });
      });

      // Rensa jobbet när det är klart
      await db.processingJobs.delete(job.id);
    } catch (error: any) {
      console.error("Fel vid bearbetning av kö:", error);
      await db.processingJobs.update(job.id, { status: 'error', message: error.message || 'Ett fel uppstod' });
    }
  } catch (error) {
    console.error("Generellt kö-fel:", error);
  } finally {
    isProcessingQueue = false;
    // Kolla om det finns fler i kön
    setTimeout(processQueue, 1000);
  }
};
