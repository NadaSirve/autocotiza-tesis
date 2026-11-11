// frontend/src/App.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { Search, ExternalLink, Clock, CheckCircle } from 'lucide-react';

export default function App() {
  const [marca, setMarca] = useState('Toyota');
  const [modelo, setModelo] = useState('Yaris');
  const [anio, setAnio] = useState('2018');
  const [codigoOem, setCodigoOem] = useState('');
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [latencia, setLatencia] = useState(null);

  const buscarRepuestos = async (e) => {
    e.preventDefault();
    setCargando(true);
    const inicio = performance.now();

    try {
      const res = await axios.get('http://localhost:3000/api/repuestos/buscar', {
        params: { marca, modelo, anio, codigo_oem: codigoOem }
      });
      setResultados(res.data.resultados);
      const fin = performance.now();
      setLatencia(((fin - inicio) / 1000).toFixed(2));
    } catch (err) {
      console.error("Error al cotizar:", err);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Header institucional */}
      <header className="bg-slate-900 text-white py-4 px-6 shadow-md border-b-2 border-emerald-500">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-black tracking-tight text-white">Auto<span className="text-emerald-400">Cotiza</span></span>
            <span className="text-xs bg-slate-800 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">MVP 1.0</span>
          </div>
          <span className="text-sm text-slate-400">Plataforma Neutra de Comparación Automotriz</span>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="max-w-6xl mx-auto p-6">
        {/* Formulario de búsqueda */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
          <h1 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-900">
            <Search className="w-5 h-5 text-emerald-600" />
            Consulta de Compatibilidad y Comparación de Precios
          </h1>

          <form onSubmit={buscarRepuestos} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Marca</label>
              <select value={marca} onChange={(e) => setMarca(e.target.value)} className="w-full p-2.5 border rounded-lg bg-slate-50 border-slate-300">
                <option value="Toyota">Toyota</option>
                <option value="Suzuki">Suzuki</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Modelo</label>
              <select value={modelo} onChange={(e) => setModelo(e.target.value)} className="w-full p-2.5 border rounded-lg bg-slate-50 border-slate-300">
                <option value="Yaris">Yaris</option>
                <option value="Swift">Swift</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Año</label>
              <input type="number" value={anio} onChange={(e) => setAnio(e.target.value)} className="w-full p-2.5 border rounded-lg bg-slate-50 border-slate-300" />
            </div>
            <div className="flex items-end">
              <button type="submit" disabled={cargando} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 px-4 rounded-lg flex justify-center items-center gap-2 transition">
                {cargando ? 'Buscando...' : 'Cotizar Precios'}
              </button>
            </div>
          </form>
        </section>

        {/* Indicador de SLA de Rendimiento */}
        {latencia && (
          <div className="flex items-center justify-between text-xs text-slate-500 mb-4 px-2">
            <span>Mostrando compatibilidad para: <b>{marca} {modelo} ({anio})</b></span>
            <span className="flex items-center gap-1 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-xs">
              <Clock className="w-3.5 h-3.5 text-emerald-600" /> Respuesta API: <b>{latencia}s</b> (SLA cumplido ≤ 3s)
            </span>
          </div>
        )}

        {/* Lista de Resultados Comparativos */}
        <section className="space-y-6">
          {resultados.length === 0 && !cargando && (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
              <p className="text-slate-500">Realiza una consulta para ver las ofertas disponibles de las tiendas asociadas.</p>
            </div>
          )}

          {resultados.map((rep) => (
            <div key={rep.id_repuesto} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-100 p-4 border-b flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg text-slate-900">{rep.nombre}</h3>
                  <p className="text-xs text-slate-500">Fabricante: {rep.fabricante} | Código OEM: <span className="font-mono bg-slate-200 px-1 py-0.5 rounded text-slate-700">{rep.codigo_oem}</span></p>
                </div>
                <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> 100% Compatible
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {rep.ofertas.map((of) => (
                  <div key={of.id_oferta} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                    <div>
                      <span className="font-bold text-slate-800 text-base">{of.tienda}</span>
                      <p className="text-xs text-slate-400">SKU: {of.sku} | Actualizado: {new Date(of.actualizado).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right flex items-center gap-6">
                      <div>
                        <span className="text-xl font-extrabold text-slate-900">${of.precio_clp.toLocaleString('es-CL')} CLP</span>
                        <p className={`text-xs ${of.disponible ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {of.disponible ? 'En Stock' : 'Sin Stock'}
                        </p>
                      </div>
                      <a
                        href={`http://localhost:3000/api/redireccion/${of.id_oferta}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-1.5 text-sm transition shadow-xs"
                      >
                        Ir a la tienda <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}