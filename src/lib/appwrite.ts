import { Client, Account, Databases, Storage } from 'appwrite';

export const client = new Client();

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '';
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';

/** True only when both env vars are present — used to guard API calls */
export const isAppwriteConfigured = !!(endpoint && projectId);

if (isAppwriteConfigured) {
    client
        .setEndpoint(endpoint)
        .setProject(projectId);
}

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// Ping Appwrite on startup to verify connectivity.
// Result is logged to the browser console — not user-facing.
if (isAppwriteConfigured) {
  client.ping().then(() => {
    console.log("[Appwrite] ✅ Connected to", endpoint);
  }).catch((err: unknown) => {
    console.warn("[Appwrite] ⚠️ Ping failed:", err);
  });
}


export const appwriteConfig = {
    databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '',
    usersCollectionId: process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID || '',
    semestersCollectionId: process.env.NEXT_PUBLIC_APPWRITE_SEMESTERS_COLLECTION_ID || '',
    coursesCollectionId: process.env.NEXT_PUBLIC_APPWRITE_COURSES_COLLECTION_ID || '',
    schedulesCollectionId: process.env.NEXT_PUBLIC_APPWRITE_SCHEDULES_COLLECTION_ID || '',
    studyTopicsCollectionId: process.env.NEXT_PUBLIC_APPWRITE_STUDY_TOPICS_COLLECTION_ID || '',
    assignmentsCollectionId: process.env.NEXT_PUBLIC_APPWRITE_ASSIGNMENTS_COLLECTION_ID || '',
    examsCollectionId: process.env.NEXT_PUBLIC_APPWRITE_EXAMS_COLLECTION_ID || '',
    studySessionsCollectionId: process.env.NEXT_PUBLIC_APPWRITE_STUDY_SESSIONS_COLLECTION_ID || '',
};
