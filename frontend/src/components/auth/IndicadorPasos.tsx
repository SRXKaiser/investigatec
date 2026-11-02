interface IndicadorPasosProps {
  pasos: number;
  pasoActual: number;
}

const IndicadorPasos = ({ pasos, pasoActual }: IndicadorPasosProps) => {
  return (
    <div className="flex items-center gap-2 w-72 justify-center">
      {Array.from({ length: pasos }, (_, i) => i + 1).map((n) => (
        <div
          key={n}
          className={`h-2 rounded-full transition-all duration-300 ${
            pasoActual === n
              ? 'w-8 bg-[var(--rosita)]'
              : pasoActual > n
              ? 'w-2 bg-[var(--rosita)]/60'
              : 'w-2 bg-[var(--rosita)]/20'
          }`}
        />
      ))}
    </div>
  );
};

export default IndicadorPasos;