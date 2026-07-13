import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Lock } from "lucide-react";
import { buscarEstoqueAdmin, PrizeAdmin } from "../lib/buscarEstoqueAdmin";

const STORAGE_KEY = "roleta_admin_key";
const POLL_INTERVAL_MS = 8000;

export default function Admin() {
  const [chave, setChave] = useState<string | null>(() => sessionStorage.getItem(STORAGE_KEY));
  const [chaveInput, setChaveInput] = useState("");
  const [unauthorized, setUnauthorized] = useState(false);
  const [prizes, setPrizes] = useState<PrizeAdmin[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const carregar = useCallback(async (chaveAtual: string) => {
    setLoading(true);
    const resultado = await buscarEstoqueAdmin(chaveAtual);
    setLoading(false);

    if (resultado.unauthorized) {
      setUnauthorized(true);
      sessionStorage.removeItem(STORAGE_KEY);
      setChave(null);
      return;
    }

    if (resultado.ok) {
      setPrizes(resultado.prizes);
      setLastUpdated(new Date());
    }
  }, []);

  useEffect(() => {
    if (!chave) return;
    carregar(chave);
    const interval = setInterval(() => carregar(chave), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [chave, carregar]);

  const handleEntrar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chaveInput.trim()) return;
    sessionStorage.setItem(STORAGE_KEY, chaveInput.trim());
    setUnauthorized(false);
    setChave(chaveInput.trim());
  };

  if (!chave) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#14100A] px-4">
        <form
          onSubmit={handleEntrar}
          className="w-full max-w-sm bg-[#1A1410] border border-[#F5C518]/20 rounded-2xl p-6 space-y-4"
        >
          <div className="flex items-center gap-2 text-[#F5C518]">
            <Lock className="w-5 h-5" />
            <h1 className="font-bold uppercase tracking-widest text-sm">Painel Roleta Concreteshow</h1>
          </div>
          {unauthorized && (
            <p className="text-rose-400 text-xs">Senha incorreta. Tente novamente.</p>
          )}
          <input
            type="password"
            autoFocus
            value={chaveInput}
            onChange={(e) => setChaveInput(e.target.value)}
            placeholder="Senha do painel"
            className="w-full bg-[#0D0D0D] border-2 border-white/10 focus:border-[#FF6801] text-[#FFF6E6] px-4 py-3 rounded-lg outline-none text-sm"
          />
          <button
            type="submit"
            className="w-full bg-[#FF6801] hover:bg-[#e05c01] text-white font-bold uppercase tracking-widest py-3 rounded-lg transition-colors"
          >
            Entrar
          </button>
        </form>
      </div>
    );
  }

  const totalRestante = prizes.reduce((sum, p) => sum + p.remaining_stock, 0);

  return (
    <div className="min-h-screen bg-[#14100A] text-[#FFF6E6] px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-bold uppercase tracking-widest text-lg text-[#F5C518]">
            Estoque · Roleta Concreteshow
          </h1>
          <button
            onClick={() => carregar(chave)}
            disabled={loading}
            className="flex items-center gap-2 text-xs uppercase tracking-widest border border-white/20 rounded-lg px-3 py-2 hover:border-[#FF6801] transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </button>
        </div>

        <p className="text-xs text-[#B8A98A]">
          {lastUpdated ? `Atualizado às ${lastUpdated.toLocaleTimeString("pt-BR")}` : "Carregando..."}
          {" · "}Atualiza automaticamente a cada {POLL_INTERVAL_MS / 1000}s
        </p>

        <div className="bg-[#1A1410] border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[#B8A98A] uppercase text-xs tracking-widest border-b border-white/10">
                <th className="p-3">Prêmio</th>
                <th className="p-3">Restante</th>
                <th className="p-3">Inicial</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {prizes.map((p) => {
                const esgotado = p.remaining_stock === 0;
                const pct = p.initial_stock > 0 ? (p.remaining_stock / p.initial_stock) * 100 : 0;
                return (
                  <tr key={p.id} className="border-b border-white/5 last:border-0">
                    <td className="p-3 font-medium">{p.name}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span>{p.remaining_stock}</span>
                        <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#FF6801]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-[#B8A98A]">{p.initial_stock}</td>
                    <td className="p-3">
                      {!p.active ? (
                        <span className="text-xs uppercase text-[#B8A98A]">Inativo</span>
                      ) : esgotado ? (
                        <span className="text-xs uppercase font-bold text-rose-400">Esgotado</span>
                      ) : (
                        <span className="text-xs uppercase font-bold text-emerald-400">Disponível</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {prizes.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-[#B8A98A]">
                    Nenhum prêmio cadastrado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-[#B8A98A]">Total restante em todos os prêmios: {totalRestante}</p>
      </div>
    </div>
  );
}
