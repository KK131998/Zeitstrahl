// app/index.tsx
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Animated,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useEffect, useCallback, useRef, useState } from "react";

type Question = {
  id: string;
  question: string;
  answer: string;
  status?: CardStatus;
  due_at?: string | null;
  event_id?: string | null;
  event_title?: string | null; // aus expand.event_id.title
  person_id?: string | null;
  person_name?: string | null;
};

type CardStatus = "new" | "one" | "two" | "three" | "four" | "five" | "six";

const POCKETBASE_URL = "https://zeitstrahl-backend.fly.dev"; // <-- HIER ändern
const COLLECTION = "cards";
const TOAST_DURATION_MS = 1400;

function randomFrom<T>(list: T[]): T | null {
  if (!list.length) return null;
  return list[Math.floor(Math.random() * list.length)];
}

/** Liefert das Datum ohne Uhrzeit (YYYY-MM-DD) für den lokalen Tag */
function toDateOnly(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Fügt Tage hinzu und setzt die Uhrzeit auf Mitternacht (00:00:00) */
function addDaysAtMidnight(date: Date, days: number): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + days,
    0,
    0,
    0,
    0,
  );
}

function nextStatusAfterCorrect(current?: CardStatus): CardStatus {
  const s: CardStatus = current ?? "new";
  const idx = STATUS_ORDER.indexOf(s);
  if (idx < 0) return "new";
  return STATUS_ORDER[Math.min(idx + 1, STATUS_ORDER.length - 1)];
}

const STATUS_ORDER: CardStatus[] = [
  "new",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
];

const DAYS_BY_STATUS: Record<CardStatus, number> = {
  new: 0, // heute – bleibt im Deck, wird neu gemischt
  one: 3,
  two: 7,
  three: 14,
  four: 30,
  five: 100,
  six: 365,
};

async function deleteCard(id: string) {
  const url = `${POCKETBASE_URL}/api/collections/${COLLECTION}/records/${id}`;
  const res = await fetch(url, { method: "DELETE" });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Löschen fehlgeschlagen (${res.status}): ${txt}`);
  }
}

async function patchCard(
  id: string,
  data: Partial<Pick<Question, "status" | "due_at" | "question" | "answer">>,
) {
  const url = `${POCKETBASE_URL}/api/collections/${COLLECTION}/records/${id}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Speichern fehlgeschlagen (${res.status}): ${txt}`);
  }
}

export default function Index() {
  const rotation = useRef(new Animated.Value(0)).current;
  const [flipped, setFlipped] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editQ, setEditQ] = useState("");
  const [editA, setEditA] = useState("");
  const [busy, setBusy] = useState<null | "delete" | "save">(null);
  const [toast, setToast] = useState<string | null>(null);

  // später dynamisch (z.B. aus Fragenliste)
  const remainingCards = questions.length;
  const status = (current?.status ?? "new") as CardStatus;

  const hasEventLink = !!(current?.event_title || current?.event_id);
  const hasPersonLink = !!(current?.person_name || current?.person_id);

  const flipCard = () => {
    Animated.timing(rotation, {
      toValue: flipped ? 0 : 180,
      duration: 400,
      useNativeDriver: true,
    }).start();

    setFlipped((v) => !v);
  };

  function resetFlip() {
    rotation.setValue(0);
    setFlipped(false);
  }

  const frontStyle = {
    transform: [
      {
        rotateY: rotation.interpolate({
          inputRange: [0, 180],
          outputRange: ["0deg", "180deg"],
        }),
      },
    ],
  };

  const backStyle = {
    transform: [
      {
        rotateY: rotation.interpolate({
          inputRange: [0, 180],
          outputRange: ["180deg", "360deg"],
        }),
      },
    ],
  };

  const loadQuestions = useCallback(async () => {
    const now = new Date();
    try {
      setLoading(true);
      setError(null);

      // mehr Karten laden, um genug Spielraum zu haben
      const url = `${POCKETBASE_URL}/api/collections/${COLLECTION}/records?perPage=1000&expand=event_id,person_id`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`PocketBase Fehler (${res.status}) – prüfe URL/Rules`);
      }
      const data = await res.json();
      const items = Array.isArray(data?.items) ? data.items : [];
      const mapped: Question[] = items.map((it: Record<string, unknown>) => {
        const expand = it.expand as Record<string, unknown> | undefined;
        const eventRecord = expand?.event_id as { title?: string } | undefined;
        const eventTitle = eventRecord?.title
          ? String(eventRecord.title)
          : null;
        const personRecord = expand?.person_id as { name?: string } | undefined;
        const personName = personRecord?.name
          ? String(personRecord.name)
          : null;
        return {
          id: String(it.id),
          question: String(it.question ?? ""),
          answer: String(it.answer ?? ""),
          status: it.status ? String(it.status) : undefined,
          due_at: (it.due_at as string | null) ?? null,
          event_id: (it.event_id as string | null) ?? null,
          event_title: eventTitle,
          person_id: (it.person_id as string | null) ?? null,
          person_name: personName,
        };
      });
      const today = toDateOnly(now);

      const due = mapped.filter((q) => {
        // alle Karten, deren due_at-Datum heute oder davor liegt
        if (!q.due_at) return false;
        const dueDate = new Date(q.due_at);
        if (Number.isNaN(dueDate.getTime())) return false;
        const dueDay = toDateOnly(dueDate);
        return dueDay <= today;
      });

      setQuestions(due);
      setCurrent(randomFrom(due));
      resetFlip();
    } catch (e: unknown) {
      setError(
        e instanceof Error ? e.message : "Unbekannter Fehler beim Laden.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  async function handleDelete() {
    if (!current) return;

    const doDelete = async () => {
      try {
        setBusy("delete");
        await deleteCard(current.id);
        const remaining = questions.filter((q) => q.id !== current.id);
        setQuestions(remaining);
        const next = randomFrom(remaining);
        setCurrent(next);
        resetFlip();
        showToast("🗑️ Gelöscht");
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Fehler beim Löschen.");
      } finally {
        setBusy(null);
      }
    };

    if (Platform.OS === "web") {
      // Auf Web ist Alert mit Buttons oft eingeschränkt – direkt löschen
      void doDelete();
      return;
    }

    Alert.alert(
      "Wirklich löschen?",
      "Diese Karte wird dauerhaft gelöscht.",
      [
        { text: "Abbrechen", style: "cancel" },
        {
          text: "Löschen",
          style: "destructive",
          onPress: () => {
            void doDelete();
          },
        },
      ],
      { cancelable: true },
    );
  }

  async function handleAnswer(isCorrect: boolean) {
    if (!current) return;
    if (!flipped) return; // nur bewerten, wenn man die Antwort gesehen hat

    const now = new Date();

    // falsch -> status new, bleibt heute fällig, wird wieder ins Deck gemischt
    // richtig -> nächster Status, Karte aus der Session
    const nextStatus: CardStatus = isCorrect
      ? nextStatusAfterCorrect(current.status)
      : "new";

    const days = DAYS_BY_STATUS[nextStatus];
    const nextDue = addDaysAtMidnight(now, days);

    try {
      await patchCard(current.id, {
        status: nextStatus,
        due_at: nextDue.toISOString(),
      });

      const remaining = isCorrect
        ? questions.filter((q) => q.id !== current.id) // richtig: rausnehmen
        : questions; // falsch: im Deck lassen, neu mischen

      setQuestions(remaining);
      setCurrent(randomFrom(remaining));
      resetFlip();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Fehler beim Speichern.");
    }
  }

  function openEdit() {
    if (!current) return;
    setEditQ(current.question ?? "");
    setEditA(current.answer ?? "");
    setEditOpen(true);
  }

  async function saveEdit() {
    if (!current) return;

    try {
      setBusy("save");
      await patchCard(current.id, {
        question: editQ,
        answer: editA,
      });

      const updated = { ...current, question: editQ, answer: editA };
      setCurrent(updated);
      setQuestions((prev) =>
        prev.map((q) => (q.id === current.id ? updated : q)),
      );

      setEditOpen(false);
      showToast("✅ Gespeichert");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Fehler beim Speichern.");
    } finally {
      setBusy(null);
    }
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), TOAST_DURATION_MS);
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.header}>Lade Karten…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable
          style={[styles.button, styles.retry]}
          onPress={loadQuestions}
        >
          <Text style={styles.buttonText}>Erneut versuchen</Text>
        </Pressable>
      </View>
    );
  }

  if (remainingCards === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.header}>🎉 Keine Karten mehr offen!</Text>
        <Text style={styles.footer}>
          Alle fälligen Karten wurden bearbeitet.
        </Text>
        <Pressable
          style={[styles.button, styles.retry]}
          onPress={loadQuestions}
        >
          <Text style={styles.buttonText}>Aktualisieren</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        {remainingCards} Karten noch zur Abfrage bereit
      </Text>
      <Pressable onPress={flipCard}>
        <View style={styles.cardContainer}>
          {/* Vorderseite */}
          <Animated.View style={[styles.card, styles.front, frontStyle]}>
            {(hasEventLink || hasPersonLink) && (
              <Text style={styles.eventId}>
                {hasEventLink
                  ? `Event: ${current?.event_title || current?.event_id}`
                  : `Person: ${current?.person_name || current?.person_id}`}
              </Text>
            )}
            <Text style={styles.question}>{current?.question || "—"}</Text>
          </Animated.View>

          {/* Rückseite */}
          <Animated.View style={[styles.card, styles.back, backStyle]}>
            {(hasEventLink || hasPersonLink) && (
              <Text style={styles.eventId}>
                {hasEventLink
                  ? `Event: ${current?.event_title || current?.event_id}`
                  : `Person: ${current?.person_name || current?.person_id}`}
              </Text>
            )}
            <Text style={styles.answer}>{current?.answer || "—"}</Text>
          </Animated.View>
        </View>
      </Pressable>

      {/* Buttons */}
      <View style={styles.actions}>
        <Pressable
          style={[
            styles.button,
            styles.correct,
            !flipped && styles.buttonDisabled,
          ]}
          onPress={() => handleAnswer(true)}
          disabled={!flipped}
        >
          <Text style={styles.buttonText}>✅ Richtig</Text>
        </Pressable>

        <Pressable
          style={[
            styles.button,
            styles.wrong,
            !flipped && styles.buttonDisabled,
          ]}
          onPress={() => handleAnswer(false)}
          disabled={!flipped}
        >
          <Text style={styles.buttonText}>❌ Falsch</Text>
        </Pressable>

        <Pressable
          style={[styles.button, flipped ? styles.edit : styles.delete]}
          onPress={flipped ? openEdit : handleDelete}
          disabled={!current || busy !== null}
        >
          <Text style={styles.buttonText}>
            {busy === "delete"
              ? "Lösche…"
              : flipped
                ? "✏️ Bearbeiten"
                : "🗑️ Löschen"}
          </Text>
        </Pressable>
      </View>

      {/* FOOTER */}
      <Text style={styles.footer}>Status: {status}</Text>

      <Modal
        visible={editOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setEditOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Bearbeiten</Text>

              <Text style={styles.modalLabel}>Frage</Text>
              <TextInput
                value={editQ}
                onChangeText={setEditQ}
                style={styles.input}
                multiline
              />

              <Text style={styles.modalLabel}>Antwort</Text>
              <TextInput
                value={editA}
                onChangeText={setEditA}
                style={[styles.input, { minHeight: 80 }]}
                multiline
              />

              <View style={styles.modalActions}>
                <Pressable
                  style={[styles.button, styles.buttonGhost, styles.buttonWide]}
                  disabled={busy === "save"}
                  onPress={() => setEditOpen(false)}
                >
                  <Text style={styles.buttonText}>Abbrechen</Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.button,
                    styles.correct,
                    styles.buttonWide,
                    busy === "save" && styles.buttonDisabled,
                  ]}
                  onPress={saveEdit}
                  disabled={busy === "save"}
                >
                  {busy === "save" ? (
                    <ActivityIndicator />
                  ) : (
                    <Text style={styles.buttonText}>OK</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
      {toast && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "#1980afff",
  },
  centered: {
    alignItems: "center",
  },
  errorText: {
    color: "#fee2e2",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  retry: {
    backgroundColor: "#6b7280",
    paddingHorizontal: 24,
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 16,
  },
  header: {
    textAlign: "center",
    fontSize: 14,
    color: "white",
    marginTop: 8,
    marginBottom: 12,
  },

  cardContainer: {
    height: 400,
    marginBottom: 28,
  },

  card: {
    position: "absolute",
    width: "100%",
    height: "100%",
    padding: 24,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
    backfaceVisibility: "hidden",
  },

  eventId: {
    position: "absolute",
    top: 12,
    left: 16,
    right: 16,
    fontSize: 12,
    color: "#6b7280",
  },
  front: {
    backgroundColor: "#fff",
  },

  back: {
    backgroundColor: "#f3f3f3",
  },

  question: {
    textAlign: "center",
    fontSize: 26,
    lineHeight: 34,
    color: "#111",
    fontWeight: "600",
  },

  answer: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: "600",
    color: "#111",
    textAlign: "left",
  },

  actions: {
    gap: 14,
  },

  button: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
  },

  correct: {
    backgroundColor: "#6fd49cff",
  },

  wrong: {
    backgroundColor: "#e07979ff",
  },

  buttonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111",
  },
  footer: {
    textAlign: "center",
    fontSize: 13,
    color: "white",
    marginBottom: 6,
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.5,
  },

  edit: {
    backgroundColor: "#4b5563",
    marginTop: 12,
  },

  delete: {
    backgroundColor: "#b91c1c",
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  modalLabel: { fontSize: 12, opacity: 0.7, marginTop: 10, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 10,
    minHeight: 44,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 14,
  },
  buttonGhost: { backgroundColor: "#9ca3af" },
  buttonWide: {
    flex: 1,
  },
  toast: {
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.85)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  toastText: {
    color: "white",
    fontWeight: "600",
  },
});
