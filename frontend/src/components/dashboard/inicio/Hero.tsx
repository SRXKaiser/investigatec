interface Heroprops {
  titulo: string;
  descripcion: string;
  rol: string;
}

const Hero = ({titulo, descripcion, rol}: Heroprops) => {
  return (
    <section className="flex flex-col gap-6 rounded-2xl  border-3 border-[var(--cafe)]
                 border-r-7 border-b-7 
                 bg-gradient-to-r from-[var(--cafe)] to-[var(--rojo-oscuro)]
                 p-4 pl-10  text-left text-[var(--bg)] md:flex-row md:items-center md:justify-between">
      <div>
        <h2 className="text-3xl font-bold font-pixel text-[var(--bg)]">{titulo}</h2>
        <p className=" text-cuerpo text-[var(--bg)]/80 ">{descripcion}</p>
      </div>
      <span className="w-fit rounded-full  border-2 border-[var(--cafe)] border-b-6 bg-[var(--rojo)]/90 px-4 py-[3px] mr-6 font-semibold font-pixel">
        {rol}
      </span>
    </section>
  );
};

export default Hero;