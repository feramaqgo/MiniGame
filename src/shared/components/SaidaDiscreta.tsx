/**
 * Porta de saída — o atalho pra quando o caminho principal trava.
 *
 * É discreto de propósito. Quem está jogando não deve ser convidado a
 * desistir, então isso nunca compete com o botão principal: texto pequeno,
 * cor apagada, sublinhado pontilhado, encostado no canto. Mas quem precisa
 * sair (não venceu, o Google não abriu, o aparelho ficou preso na sessão de
 * outra pessoa) tem que conseguir sozinho, sem chamar o atendente.
 *
 * A área de toque continua generosa (py-3 px-4) mesmo o texto sendo pequeno —
 * discrição é visual, não física: no tablet o dedo precisa acertar.
 */
interface SaidaDiscretaProps {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
}

export default function SaidaDiscreta({
  children,
  onClick,
  href,
  className = "",
}: SaidaDiscretaProps) {
  const estilo =
    "inline-block font-sans text-xs text-[#8A8375] hover:text-[#FF6801] " +
    "underline decoration-dotted underline-offset-4 decoration-[#8A8375]/50 " +
    "hover:decoration-[#FF6801] transition-colors cursor-pointer py-3 px-4 " +
    className;

  if (href) {
    return (
      <a href={href} onClick={onClick} className={estilo}>
        {children}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={estilo}>
      {children}
    </button>
  );
}
