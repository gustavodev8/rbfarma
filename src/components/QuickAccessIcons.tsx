import { TrendingUp, FlaskConical, Syringe, Tag, Percent, Sparkles, Star, Ticket, Pill } from "lucide-react";

const icons = [
  { label: "Mais Buscados", Icon: TrendingUp },
  { label: "Manipulacao", Icon: FlaskConical },
  { label: "Servicos e Vacinas", Icon: Syringe },
  { label: "Suas ofertas", Icon: Tag },
  { label: "Ofertas do dia", Icon: Percent },
  { label: "Perfumes", Icon: Sparkles },
  { label: "Seus Pontos", Icon: Star },
  { label: "Cupons", Icon: Ticket },
  { label: "Dose Certa", Icon: Pill },
];

const QuickAccessIcons = () => {
  return (
    <section className="container mx-auto py-6 px-4">
      <div className="flex justify-center gap-2 md:gap-6 overflow-x-auto scrollbar-hide pb-2">
        {icons.map(({ label, Icon }) => (
          <button
            key={label}
            className="flex flex-col items-center gap-2 min-w-[80px] md:min-w-[96px] group"
          >
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-quick-icon flex items-center justify-center group-hover:scale-105 group-hover:bg-red-50 transition-all shadow-sm">
              <Icon className="h-7 w-7 md:h-9 md:w-9 text-foreground group-hover:text-[#e8001c] transition-colors" strokeWidth={1.5} />
            </div>
            <span className="text-xs md:text-sm text-muted-foreground text-center leading-tight group-hover:text-[#e8001c] transition-colors font-medium">
              {label}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
};

export default QuickAccessIcons;
