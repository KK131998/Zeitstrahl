// src/lib/pocketbase.ts
import PocketBase from "pocketbase";

const pb = new PocketBase(process.env.NEXT_PUBLIC_PB_URL);

// Auto-Cancellation im Client deaktivieren, damit parallele Requests
// (z.B. bei Formularen/Navigation) nicht automatisch abgebrochen werden.
pb.autoCancellation(false);

export default pb;
