import type { ReactNode } from 'react';

interface AnimacionParteProps {
  paso: number;
  direccion: 'adelante' | 'atras';
  children: ReactNode;
}

const AnimacionParte = ({ paso, direccion, children }: AnimacionParteProps) => {
  const animacion = direccion === 'adelante' ? 'animate-slide-left' : 'animate-slide-right';

  return (
    <div className="overflow-hidden w-72">
      <div className={`flex flex-col gap-3 ${animacion}`} key={paso}>
        {children}
      </div>
    </div>
  );
};

export default AnimacionParte;