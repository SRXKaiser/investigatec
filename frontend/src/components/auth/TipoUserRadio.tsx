type TipoUsuario = 'ADMINISTRADOR' | 'INVESTIGADOR' | 'REVISOR' | '';

interface Opcion {
  value: TipoUsuario;
  label: string;
}

interface TipoUsuarioRadioProps {
  value: TipoUsuario;
  onChange: (value: TipoUsuario) => void;
  opciones?: Opcion[];
  pregunta?: string;
}

const OPCIONES_DEFAULT: Opcion[] = [
  { value: 'ADMINISTRADOR', label: 'ADMINISTRADOR' },
  { value: 'INVESTIGADOR', label: 'INVESTIGADOR' },
  { value: 'REVISOR', label: 'REVISOR' },
];

const TipoUsuarioRadio = ({
  value,
  onChange,
  opciones = OPCIONES_DEFAULT,
  pregunta = '¿Cómo te identificas en el ITCJ?',
}: TipoUsuarioRadioProps) => {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-[var(--bg)]/80 text-center">{pregunta}</p>

      {opciones.map((opcion) => (
        <label
          key={opcion.value}
          htmlFor={`tipo-${opcion.value}`}
          className={`flex items-center justify-center gap-2
                      px-4 py-1.5 rounded-xl cursor-pointer
                      border-2 border-[var(--negro)] border-b-7 border-r-7
                      font-sub-pixel text-sm text-center
                      transition-all duration-150
                      ${value === opcion.value
                        ? 'bg-[var(--rosita)] text-[var(--rojo-oscuro)] font-bold'
                        : 'bg-[var(--bg)] text-[var(--rojo)] hover:bg-[var(--rosita)]/20'
                      }`}
        >
          <input
            type="radio"
            id={`tipo-${opcion.value}`}
            name="tipoUsuario"
            value={opcion.value}
            checked={value === opcion.value}
            onChange={(e) => onChange(e.target.value as TipoUsuario)}
            className="sr-only"
          />
          {opcion.label}
        </label>
      ))}
    </div>
  );
};

export default TipoUsuarioRadio;