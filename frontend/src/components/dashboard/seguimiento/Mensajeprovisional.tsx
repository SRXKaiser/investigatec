interface Mensajeprops{
    titulo: string;
    mensaje: string;
}

const Mensajeprovisional = ({titulo, mensaje}: Mensajeprops) =>{
    return(
         <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--rojo-oscuro)]">{titulo}</h1>
      <div className="bg-white p-6 rounded-2xl border border-[var(--cafe)]/20 shadow-sm">
        <p>{mensaje}</p>
      </div>
    </div>
    );
}
export default Mensajeprovisional;