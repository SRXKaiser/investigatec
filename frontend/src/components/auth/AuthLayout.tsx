import type { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
  imagen?: string;
  imagenAlt?: string;
}

const AuthLayout = ({
  children,
  imagen = '/src/assets/biblioteca_digital.png',
  imagenAlt = 'Biblioteca digital',
}: AuthLayoutProps) => {
  return (
    <div className="flex h-screen w-full items-center justify-center p-6">
         <section
      className="flex flex-col lg:flex-row
                lg:p-8 m-6 lg:m-20 rounded-3xl
                bg-[radial-gradient(circle_at_bottom_left,_var(--cafe)_0%,_var(--rojo-oscuro)_50%,_var(--rojo)_10%)]
                 text-[var(--bg)]
                 w-fit mx-auto
                 border-3 border-[var(--negro)]
                 border-r-8 border-b-8
                 gap-6 lg:gap-0"
    >
      {children}

      <div className="lg:ml-[50px] flex items-center">
        <img
          src={imagen}
          alt={imagenAlt}
          className="rounded-3xl w-full max-w-[500px] border-2 border-[var(--negro)]"
        />
      </div>
    </section>
    </div>
   
  );
};

export default AuthLayout;