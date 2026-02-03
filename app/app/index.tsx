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
} from "react-native";
import { useEffect, useMemo, useRef, useState } from "react";

type Question = {
  id: string;
  question: string;
  answer: string; // Textantwort (empfohlen)
  status?: CardStatus; // optional
  due_at?: string | null; // optional
};

type CardStatus = "new" | "one" | "two" | "three" | "four" | "five" | "six";

const POCKETBASE_URL = "https://zeitstrahl-backend.fly.dev"; // <-- HIER ändern
const COLLECTION = "cards";

function randomFrom<T>(list: T[]): T | null {
  if (!list.length) return null;
  return list[Math.floor(Math.random() * list.length)];
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
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
  new: 1, // morgen (für "heute": 0)
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

  async function loadQuestions() {
    const now = new Date();
    try {
      setLoading(true);
      setError(null);

      const url = `${POCKETBASE_URL}/api/collections/${COLLECTION}/records?perPage=200`;
      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(`PocketBase Fehler (${res.status}) – prüfe URL/Rules`);
      }

      const data = await res.json();
      console.log("Daten von PocketBase:", data);
      const items = Array.isArray(data?.items) ? data.items : [];
      // PocketBase -> unser Question Typ
      const mapped: Question[] = items.map((it: any) => ({
        id: String(it.id),
        question: String(it.question ?? ""),
        answer: String(it.answer ?? ""),
        status: it.status ? String(it.status) : undefined,
        due_at: it.due_at ?? null,
      }));

      const due = mapped.filter((q) => {
        if (!q.due_at) return true; // kein Datum => sofort fällig
        const dueDate = new Date(q.due_at);
        if (Number.isNaN(dueDate.getTime())) return true; // kaputtes Datum => lieber anzeigen
        return dueDate <= now;
      });

      console.log("NOW:", now.toISOString());
      console.log("mapped:", mapped.length);
      console.log("due:", due.length);

      setQuestions(due);
      setCurrent(randomFrom(due));
      resetFlip();
    } catch (e: any) {
      setError(e?.message ?? "Unbekannter Fehler beim Laden.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function updateCard(
    id: string,
    data: Partial<Pick<Question, "status" | "due_at">>
  ) {
    const url = `${POCKETBASE_URL}/api/collections/${COLLECTION}/records/${id}`;

    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`Update fehlgeschlagen (${res.status}): ${txt}`);
    }
  }

  async function handleDelete() {
    if (!current) return;

    Alert.alert(
      "Wirklich löschen?",
      "Diese Karte wird dauerhaft gelöscht.",
      [
        { text: "Abbrechen", style: "cancel" },
        {
          text: "Löschen",
          style: "destructive",
          onPress: async () => {
            try {
              setBusy("delete");
              await deleteCard(current.id);

              const remaining = questions.filter((q) => q.id !== current.id);
              setQuestions(remaining);

              const next = randomFrom(remaining);
              setCurrent(next);
              resetFlip();

              showToast("🗑️ Gelöscht");
            } catch (e: any) {
              console.log("handleDelete error:", e?.message ?? e);
              setError(e?.message ?? "Fehler beim Löschen.");
            } finally {
              setBusy(null);
            }
          },
        },
      ],
      { cancelable: true }
    );
  }

  async function handleAnswer(isCorrect: boolean) {
    if (!current) return;
    if (!flipped) return; // nur bewerten, wenn man die Antwort gesehen hat

    const now = new Date();

    // falsch -> immer new, morgen fällig
    const nextStatus: CardStatus = isCorrect
      ? nextStatusAfterCorrect(current.status)
      : "new";

    const days = DAYS_BY_STATUS[nextStatus];
    const nextDue = addDays(now, days);

    try {
      await updateCard(current.id, {
        status: nextStatus,
        due_at: nextDue.toISOString(),
      });

      // aus der Session raus (weil nicht mehr "due")
      const remaining = questions.filter((q) => q.id !== current.id);
      setQuestions(remaining);

      const next = randomFrom(remaining);
      setCurrent(next);
      resetFlip();
    } catch (e: any) {
      console.log("handleAnswer error:", e?.message ?? e);
      setError(e?.message ?? "Fehler beim Speichern.");
    }
  }

  function openEdit() {
    if (!current) return;
    setEditQ(current.question ?? "");
    setEditA(current.answer ?? "");
    setEditOpen(true);
  }

  async function updateCardContent(
    id: string,
    data: Partial<Pick<Question, "question" | "answer">>
  ) {
    const url = `${POCKETBASE_URL}/api/collections/${COLLECTION}/records/${id}`;

    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`Bearbeiten fehlgeschlagen (${res.status}): ${txt}`);
    }
  }

  async function saveEdit() {
    if (!current) return;

    try {
      setBusy("save");
      await updateCardContent(current.id, {
        question: editQ,
        answer: editA,
      });

      const updated = { ...current, question: editQ, answer: editA };
      setCurrent(updated);
      setQuestions((prev) =>
        prev.map((q) => (q.id === current.id ? updated : q))
      );

      setEditOpen(false);
      showToast("✅ Gespeichert");
    } catch (e: any) {
      console.log("saveEdit error:", e?.message ?? e);
      setError(e?.message ?? "Fehler beim Speichern.");
    } finally {
      setBusy(null);
    }
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 1400);
  }

  return (
    <View style={styles.container}>
      {/* FLIP CARD */}
      <Text style={styles.header}>
        {remainingCards} Karten noch zur Abfrage bereit
      </Text>
      <Pressable onPress={flipCard}>
        <View style={styles.cardContainer}>
          {/* Vorderseite */}
          <Animated.View style={[styles.card, styles.front, frontStyle]}>
            <Text style={styles.question}>{current?.question || "—"}</Text>
          </Animated.View>

          {/* Rückseite */}
          <Animated.View style={[styles.card, styles.back, backStyle]}>
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
            <Text style={styles.buttonText}>
              {busy === "delete"
                ? "Lösche…"
                : flipped
                ? "✏️ Bearbeiten"
                : "🗑️ Löschen"}
            </Text>
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
        <View style={styles.modalOverlay}>
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

              {/* Speichern bauen wir als nächstes */}
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
        </View>
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
    fontSize: 26,
    fontWeight: "800",
    color: "#111",
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
    justifyContent: "center",
    padding: 16,
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
