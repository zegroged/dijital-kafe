"use client";

import { ArrowLeft, Mic, Send, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// 2 kişilik özel sohbet ekranı. Metin + sesli mesaj.
// Gerçek zamanlılık: SSE (/api/chat/stream) → mesaj ANINDA düşer, yenileme yok.
// Yoklama yalnızca güvenlik ağı: 10 sn'de bir "kaçan var mı" mutabakatı yapar
// (bağlantı koptuysa/uyandıysa). Sekme arka plandayken ikisi de durur.

export interface ChatMsg {
  id: string;
  mine: boolean;
  kind: "text" | "voice";
  body: string | null;
  audioMime: string | null;
  durationMs: number | null;
  readAt: string | null;
  deleted: boolean;
  createdAt: string;
}

const RECONCILE_MS = 10_000;

// Sohbet teması (pembe).
const PINK = "#EC4899";
const PINK_DARK = "#DB2777";

// Tarayıcıya göre desteklenen ilk biçim (iOS Safari → audio/mp4).
const MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
];

function pickMime(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return MIME_CANDIDATES.find((m) => {
    try {
      return MediaRecorder.isTypeSupported(m);
    } catch {
      return false;
    }
  });
}

function clock(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

const TIME_FMT = new Intl.DateTimeFormat("tr-TR", {
  hour: "2-digit",
  minute: "2-digit",
});
const DAY_FMT = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

export function ChatRoom({
  partnerName,
  meName,
  meId,
  backHref,
}: {
  partnerName: string;
  meName: string;
  meId: string;
  backHref: string;
}) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recMs, setRecMs] = useState(0);
  const [live, setLive] = useState(false);
  // Karşı tarafın durumu (kendi bağlantım değil — başlıkta gösterilen bu).
  const [partnerOnline, setPartnerOnline] = useState(false);
  const [partnerLastSeen, setPartnerLastSeen] = useState<number | null>(null);

  const sinceRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const nearBottomRef = useRef(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const recRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const cancelRef = useRef(false);
  const startedAtRef = useRef(0);

  // --- mesaj birleştirme (id'ye göre tekilleştir, tarihe göre sırala) ---
  const merge = useCallback((incoming: ChatMsg[]) => {
    if (!incoming.length) return;
    setMessages((prev) => {
      const map = new Map(prev.map((m) => [m.id, m]));
      for (const m of incoming) {
        const old = map.get(m.id);
        // Silme geri alınamaz: yolda olan bayat bir yanıt silinmiş mesajı
        // tekrar içerikli hale getirmemeli.
        if (old?.deleted && !m.deleted) continue;
        map.set(m.id, m);
      }
      return [...map.values()].sort((a, b) =>
        a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0,
      );
    });
  }, []);

  // --- okundu bildir (ekran açıkken) ---
  const readBusyRef = useRef(false);
  const markRead = useCallback(async () => {
    if (readBusyRef.current || document.hidden) return;
    readBusyRef.current = true;
    try {
      await fetch("/api/chat/read", { method: "POST" });
    } catch {
      /* önemsiz — mutabakat turunda yine denenir */
    } finally {
      readBusyRef.current = false;
    }
  }, []);

  // --- ANLIK iletim (SSE) ---
  useEffect(() => {
    let stopped = false;
    // EventSource kopan bağlantıyı kendisi yeniden kurar (retry: 3000).
    const es = new EventSource("/api/chat/stream");

    es.onopen = () => {
      if (!stopped) setLive(true);
    };
    es.onerror = () => {
      if (!stopped) setLive(false);
    };
    es.onmessage = (e) => {
      if (stopped) return;
      let ev: {
        kind: string;
        message?: ChatMsg;
        at?: string;
        id?: string;
        online?: boolean;
        lastSeen?: number | null;
      };
      try {
        ev = JSON.parse(e.data);
      } catch {
        return;
      }
      if (ev.kind === "message" && ev.message) {
        merge([ev.message]);
        if (!ev.message.mine) void markRead();
      } else if (ev.kind === "read" && ev.at) {
        const at = ev.at;
        setMessages((ms) =>
          ms.map((m) => (m.mine && !m.readAt ? { ...m, readAt: at } : m)),
        );
      } else if (ev.kind === "presence") {
        setPartnerOnline(Boolean(ev.online));
        if (typeof ev.lastSeen === "number") setPartnerLastSeen(ev.lastSeen);
      } else if (ev.kind === "delete" && ev.id) {
        const id = ev.id;
        setMessages((ms) =>
          ms.map((m) =>
            m.id === id ? { ...m, deleted: true, body: null } : m,
          ),
        );
      }
    };

    return () => {
      stopped = true;
      es.close();
    };
  }, [merge, markRead]);

  // --- mutabakat (güvenlik ağı: SSE koptuysa/uyandıysa kaçanı yakalar) ---
  useEffect(() => {
    let alive = true;

    async function reconcile() {
      if (document.hidden) return;
      try {
        const since = sinceRef.current;
        const url = since
          ? `/api/chat/messages?since=${encodeURIComponent(since)}`
          : "/api/chat/messages";
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok || !alive) return;
        const data = await res.json();
        if (!data.ok || !alive) return;
        // Aynı tarayıcıda diğer hesapla giriş yapıldıysa oturum değişmiştir;
        // sayfa eski kimlikle render edildiği için mesajlar yanlış tarafta
        // görünür → tek doğru davranış yeniden yüklemek.
        if (data.meId && data.meId !== meId) {
          window.location.reload();
          return;
        }
        sinceRef.current = data.now;
        merge(data.messages as ChatMsg[]);
      } catch {
        // ağ hatası → sessizce sonraki turda tekrar dener
      } finally {
        if (alive) setLoaded(true);
      }
    }

    reconcile();
    const iv = setInterval(reconcile, RECONCILE_MS);
    const onVis = () => {
      if (!document.hidden) {
        reconcile();
        void markRead();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      alive = false;
      clearInterval(iv);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [merge, markRead, meId]);

  // Sohbet açılınca imleç doğrudan yazma kutusunda olsun (tek tık yeter).
  // Yalnızca hassas işaretçili cihazlarda (masaüstü) — mobilde klavyeyi
  // kendiliğinden açmak rahatsız edici olurdu.
  useEffect(() => {
    if (window.matchMedia?.("(pointer: fine)").matches) {
      inputRef.current?.focus();
    }
  }, []);

  // --- otomatik aşağı kaydırma (kullanıcı yukarı kaydırmadıysa) ---
  useEffect(() => {
    const el = scrollRef.current;
    if (el && nearBottomRef.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    nearBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  }

  // --- metin gönder ---
  async function sendText(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setText("");
    nearBottomRef.current = true;
    // Fare ile "gönder"e tıklandıysa odak butondaydı; buton da (metin boşalınca)
    // mikrofonla değişiyor → odağı hemen kutuya geri al.
    inputRef.current?.focus();
    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Gönderilemedi");
        setText(body); // kaybolmasın
        return;
      }
      merge([data.message as ChatMsg]);
    } catch {
      toast.error("Bağlantı hatası");
      setText(body);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  // --- ses kaydı ---
  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const uploadVoice = useCallback(
    async (blob: Blob, durationMs: number) => {
      setSending(true);
      nearBottomRef.current = true;
      try {
        const fd = new FormData();
        fd.append("file", blob, "ses");
        fd.append("durationMs", String(durationMs));
        const res = await fetch("/api/chat/voice", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          toast.error(data.error ?? "Ses gönderilemedi");
          return;
        }
        merge([data.message as ChatMsg]);
      } catch {
        toast.error("Ses gönderilemedi");
      } finally {
        setSending(false);
      }
    },
    [merge],
  );

  async function startRecording() {
    if (recording || sending) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("Bu tarayıcı ses kaydını desteklemiyor");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Yarış koruması: `recording` state'i ancak burada set edildiği için
      // await sırasında gelen ikinci dokunuş da guard'ı geçebiliyor. Geç kalan
      // çağrı kendi stream'ini bırakmazsa mikrofon açık kalırdı.
      if (streamRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;
      const mimeType = pickMime();
      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      cancelRef.current = false;

      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const ms = Date.now() - startedAtRef.current;
        stopTracks();
        setRecording(false);
        const parts = chunksRef.current;
        chunksRef.current = [];
        if (cancelRef.current || parts.length === 0 || ms < 400) return;
        const blob = new Blob(parts, { type: rec.mimeType || "audio/webm" });
        if (blob.size === 0) return;
        void uploadVoice(blob, ms);
      };

      recRef.current = rec;
      startedAtRef.current = Date.now();
      setRecMs(0);
      setRecording(true);
      rec.start();
    } catch {
      stopTracks();
      toast.error("Mikrofon izni verilmedi");
    }
  }

  function finishRecording(cancel: boolean) {
    const rec = recRef.current;
    if (!rec) return;
    cancelRef.current = cancel;
    if (rec.state !== "inactive") rec.stop();
    else {
      stopTracks();
      setRecording(false);
    }
  }

  // kayıt sayacı
  useEffect(() => {
    if (!recording) return;
    const iv = setInterval(() => setRecMs(Date.now() - startedAtRef.current), 200);
    return () => clearInterval(iv);
  }, [recording]);

  // Ekrandan ayrılınca kaydı İPTAL et ve mikrofonu bırak.
  // Sıra önemli: track'ler durunca tarayıcı kaydı kendiliğinden sonlandırıp
  // onstop'u tetikliyor — cancelRef önce işaretlenmezse "geri"ye basan kişi
  // iptal ettiğini sanırken yarım ses mesajı karşı tarafa gidiyordu.
  useEffect(() => {
    return () => {
      cancelRef.current = true;
      const rec = recRef.current;
      if (rec && rec.state !== "inactive") rec.stop();
      recRef.current = null;
      stopTracks();
    };
  }, [stopTracks]);

  async function remove(id: string) {
    // Sadece bu mesajın eski hâlini sakla. Tüm listeyi geri yüklemek, istek
    // sürerken gelen mesajları kalıcı olarak silerdi (imleç ilerlemiş olur).
    const original = messages.find((m) => m.id === id);
    if (!original) return;

    setMessages((ms) =>
      ms.map((m) => (m.id === id ? { ...m, deleted: true, body: null } : m)),
    );
    try {
      const res = await fetch(`/api/chat/messages/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("silinemedi");
    } catch {
      setMessages((ms) => ms.map((m) => (m.id === id ? original : m)));
      toast.error("Silinemedi");
    }
  }

  let lastDay = "";
  // "Görüldü/İletildi" yalnızca EN SON kendi mesajının altında (iMessage gibi).
  const lastMineId = [...messages]
    .reverse()
    .find((m) => m.mine && !m.deleted)?.id;

  return (
    <div className="flex h-dvh flex-col bg-muted/30">
      {/* Başlık */}
      <header className="flex shrink-0 items-center gap-3 border-b bg-background px-3 py-2.5">
        <Link
          href={backHref}
          aria-label="Geri"
          className="inline-flex size-9 items-center justify-center rounded-full hover:bg-accent"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold leading-tight">{partnerName}</p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className={`size-1.5 rounded-full ${
                live ? "bg-emerald-500" : "bg-amber-500"
              }`}
              aria-hidden
            />
            {recording ? "kaydediliyor…" : live ? "anlık bağlı" : "bağlanıyor…"}
          </p>
        </div>
        {/* Hangi hesapla bağlı olduğun — aynı tarayıcıda iki hesapla girilirse
            karışıklığı anında belli eder. */}
        <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
          {meName}
        </span>
      </header>

      {/* Mesajlar */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex-1 space-y-1.5 overflow-y-auto px-3 py-4"
      >
        {loaded && messages.length === 0 && (
          <p className="mt-10 text-center text-sm text-muted-foreground">
            Henüz mesaj yok. İlk mesajı sen yaz 💬
          </p>
        )}

        {messages.map((m) => {
          const dk = dayKey(m.createdAt);
          const showDay = dk !== lastDay;
          lastDay = dk;
          const showReceipt = m.mine && !m.deleted && m.id === lastMineId;
          return (
            <div key={m.id}>
              {showDay && (
                <div className="my-3 text-center">
                  <span className="rounded-full bg-background px-3 py-1 text-[11px] text-muted-foreground shadow-sm">
                    {DAY_FMT.format(new Date(m.createdAt))}
                  </span>
                </div>
              )}
              <div
                className={`group flex items-end gap-1.5 ${
                  m.mine ? "justify-end" : "justify-start"
                }`}
              >
                {m.mine && !m.deleted && (
                  <button
                    type="button"
                    onClick={() => remove(m.id)}
                    aria-label="Mesajı sil"
                    className="mb-1 hidden size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-destructive group-hover:flex"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
                <div
                  style={m.mine ? { background: PINK } : undefined}
                  className={`max-w-[78%] rounded-2xl px-3 py-2 shadow-sm ${
                    m.mine
                      ? "rounded-br-sm text-white"
                      : "rounded-bl-sm border bg-white"
                  }`}
                >
                  {m.deleted ? (
                    <p
                      className={`text-sm italic ${
                        m.mine ? "text-white/70" : "text-muted-foreground"
                      }`}
                    >
                      Bu mesaj silindi
                    </p>
                  ) : m.kind === "voice" ? (
                    <div className="flex items-center gap-2">
                      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                      <audio
                        controls
                        preload="none"
                        src={`/api/chat/voice/${m.id}`}
                        className="h-9 w-56 max-w-full"
                      />
                      {m.durationMs ? (
                        <span
                          className={`shrink-0 text-[11px] tabular-nums ${
                            m.mine ? "text-white/80" : "text-muted-foreground"
                          }`}
                        >
                          {clock(m.durationMs)}
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                      {m.body}
                    </p>
                  )}
                  <div
                    className={`mt-0.5 flex items-center justify-end gap-1 text-[10px] ${
                      m.mine ? "text-white/70" : "text-muted-foreground"
                    }`}
                  >
                    <span className="tabular-nums">
                      {TIME_FMT.format(new Date(m.createdAt))}
                    </span>
                    {m.mine && !m.deleted && (
                      <span title={m.readAt ? "Görüldü" : "İletildi"}>
                        {m.readAt ? "✓✓" : "✓"}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {showReceipt && (
                <p className="mt-0.5 pr-1 text-right text-[11px] text-muted-foreground">
                  {m.readAt ? (
                    <span style={{ color: PINK_DARK }}>
                      Görüldü · {TIME_FMT.format(new Date(m.readAt))}
                    </span>
                  ) : (
                    "İletildi"
                  )}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Yazma alanı */}
      <div className="shrink-0 border-t bg-background px-3 py-2.5">
        {recording ? (
          <div className="flex items-center gap-3">
            <span className="flex size-2.5 shrink-0 animate-pulse rounded-full bg-red-500" />
            <span className="flex-1 text-sm tabular-nums">
              Kaydediliyor… {clock(recMs)}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => finishRecording(true)}
            >
              <X className="size-4" />
              İptal
            </Button>
            <Button
              type="button"
              size="sm"
              className="bg-[#EC4899] hover:bg-[#DB2777]"
              onClick={() => finishRecording(false)}
            >
              <Send className="size-4" />
              Gönder
            </Button>
          </div>
        ) : (
          <form onSubmit={sendText} className="flex items-center gap-2">
            {/* WhatsApp gibi: gönderdikten sonra odak kutuda kalır, arka arkaya
                yazmaya devam edebilirsin. `disabled` KULLANILMAZ — devre dışı
                kalan alan tarayıcıda odağı düşürür ve geri gelince geri almaz. */}
            <Input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Mesaj yaz…"
              autoComplete="off"
              className="h-11 flex-1 rounded-full"
            />
            {text.trim() ? (
              <Button
                type="submit"
                aria-label="Gönder"
                disabled={sending}
                className="size-11 shrink-0 rounded-full bg-[#EC4899] p-0 hover:bg-[#DB2777]"
              >
                <Send className="size-5" />
              </Button>
            ) : (
              <Button
                type="button"
                aria-label="Sesli mesaj kaydet"
                onClick={startRecording}
                disabled={sending}
                className="size-11 shrink-0 rounded-full bg-[#EC4899] p-0 hover:bg-[#DB2777]"
              >
                <Mic className="size-5" />
              </Button>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
