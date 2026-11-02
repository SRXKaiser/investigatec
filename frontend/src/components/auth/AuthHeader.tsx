interface AuthHeaderProps {
  titulo: string;
  subtitulo?: string;
  ancho?: string;   // por defecto "w-72"
}

const AuthHeader = ({
  titulo,
  subtitulo,
  ancho = 'w-72',
}: AuthHeaderProps) => {
  return (
    <>
      <div className={`text-center ${ancho}`}>
        <h2 className="font-pixel font-semibold text-4xl">{titulo}</h2>
        {subtitulo && (
          <p className="text-[var(--rosita)] text-sm mt-1">{subtitulo}</p>
        )}
      </div>

      <hr className={`border-t border-[var(--rosita)]/40 ${ancho}`} />
    </>
  );
};

export default AuthHeader;