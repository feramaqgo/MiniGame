// Efeitos sonoros gerados na hora via Web Audio API — sem arquivos de áudio.
// O AudioContext só é criado/retomado num gesto do usuário (clique/toque),
// respeitando a política de autoplay dos navegadores.

let ctx: AudioContext | null = null;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AC();
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tom(
  freq: number,
  dur: number,
  tipo: OscillatorType = "triangle",
  ganho = 0.14,
  atraso = 0
) {
  const c = ac();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = tipo;
  o.frequency.value = freq;
  o.connect(g);
  g.connect(c.destination);
  const t = c.currentTime + atraso;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(ganho, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.start(t);
  o.stop(t + dur + 0.03);
}

export const sfx = {
  click() {
    tom(430, 0.07, "triangle", 0.1);
  },
  flip() {
    tom(600, 0.06, "square", 0.06);
    tom(760, 0.05, "square", 0.05, 0.04);
  },
  match() {
    tom(660, 0.09, "sine", 0.13);
    tom(880, 0.12, "sine", 0.11, 0.08);
  },
  comer() {
    tom(520, 0.06, "square", 0.09);
    tom(720, 0.06, "square", 0.07, 0.05);
  },
  erro() {
    tom(200, 0.2, "sawtooth", 0.09);
    tom(150, 0.24, "sawtooth", 0.07, 0.05);
  },
  vitoria() {
    [523, 659, 784, 1047].forEach((f, i) => tom(f, 0.2, "triangle", 0.15, i * 0.11));
  },
  tick() {
    tom(920, 0.03, "square", 0.05);
  },
};
