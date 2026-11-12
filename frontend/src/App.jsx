// frontend/src/App.jsx
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  Search, Car, ExternalLink, CheckCircle2, ShieldCheck,
  Tag, ArrowUpDown, Sparkles, X, AlertCircle, Disc,
  Filter as FilterIcon, Zap, Layers, HelpCircle, TrendingDown,
  Copy, Check, Info, Wrench, ChevronRight, Award, Activity, Flame
} from 'lucide-react';

// Fotografías automotrices en alta definición
const obtenerImagenRepuesto = (codigoOem, categoria) => {
  const mapaOem = {
    '04465-0D150': 'https://images.unsplash.com/photo-1615906655593-ad0386982a0f?auto=format&fit=crop&w=800&q=85',
    '90915-YZZF2': 'https://images.unsplash.com/photo-1635784063388-1ff609e12d7c?auto=format&fit=crop&w=800&q=85',
    '90919-01253': 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=85',
    '55810-57L00': 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=800&q=85',
    '16510-81420': 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=85',
    '58101-1RA00': 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=85'
  };
  if (mapaOem[codigoOem]) return mapaOem[codigoOem];
  if (categoria === 'Frenos') return 'https://images.unsplash.com/photo-1615906655593-ad0386982a0f?auto=format&fit=crop&w=800&q=85';
  if (categoria === 'Filtros') return 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=85';
  return 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=800&q=85';
};

const imagenesVehiculos = {
  Toyota: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=600&q=80',
  Suzuki: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80',
  Hyundai: 'https://images.unsplash.com/photo-1629897048514-3dd7414fe72a?auto=format&fit=crop&w=600&q=80'
};

const badgeTienda = (nombre) => {
  if (nombre.includes('Autoplanet')) return 'bg-orange-500/10 text-orange-700 border-orange-500/20';
  if (nombre.includes('Salfa')) return 'bg-blue-600/10 text-blue-800 border-blue-600/20';
  if (nombre.includes('Derco')) return 'bg-rose-600/10 text-rose-700 border-rose-600/20';
  return 'bg-slate-100 text-slate-800 border-slate-200';
};

export default function App() {
  const [marca, setMarca] = useState('Toyota');
  const [modelo, setModelo] = useState('Yaris');
  const [anio, setAnio] = useState('2018');
  const [busquedaTexto, setBusquedaTexto] = useState('');

  const [categoriaActiva, setCategoriaActiva] = useState('Todas');
  const [fabricanteActivo, setFabricanteActivo] = useState('Todos');
  const [soloStock, setSoloStock] = useState(false);
  const [ordenPrecio, setOrdenPrecio] = useState('asc');

  const [repuestos, setRepuestos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [latencia, setLatencia] = useState(null);
  const [repuestoSeleccionado, setRepuestoSeleccionado] = useState(null);
  const [oemCopiado, setOemCopiado] = useState(null);
  const [mostrarAyuda, setMostrarAyuda] = useState(false);

  const modelosPorMarca = {
    Toyota: ['Yaris'],
    Suzuki: ['Swift'],
    Hyundai: ['Accent']
  };

  const consultarCatalogo = async (e) => {
    if (e) e.preventDefault();
    setCargando(true);
    const inicio = performance.now();

    try {
      const res = await axios.get('http://localhost:3000/api/repuestos/buscar', {
        params: {
          marca: marca || undefined,
          modelo: modelo || undefined,
          anio: anio || undefined,
          codigo_oem: busquedaTexto || undefined,
          solo_stock: soloStock ? 'true' : undefined,
          orden: ordenPrecio
        }
      });
      setRepuestos(res.data.resultados || []);
      const fin = performance.now();
      setLatencia(((fin - inicio) / 1000).toFixed(2));
    } catch (err) {
      console.error('Error al buscar repuestos:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    consultarCatalogo();
  }, [marca, modelo, soloStock, ordenPrecio]);

  const copiarCodigo = (codigo) => {
    navigator.clipboard.writeText(codigo);
    setOemCopiado(codigo);
    setTimeout(() => setOemCopiado(null), 2000);
  };

  const seleccionarMarca = (nuevaMarca) => {
    setMarca(nuevaMarca);
    if (nuevaMarca && modelosPorMarca[nuevaMarca]) {
      setModelo(modelosPorMarca[nuevaMarca][0]);
    } else {
      setModelo('');
    }
  };

  const fabricantesDisponibles = useMemo(() => {
    const fabs = new Set(repuestos.map(r => r.fabricante).filter(Boolean));
    return ['Todos', ...Array.from(fabs)];
  }, [repuestos]);

  const repuestosFiltrados = useMemo(() => {
    return repuestos.filter(rep => {
      const cumpleCat = categoriaActiva === 'Todas' || rep.categoria === categoriaActiva;
      const cumpleFab = fabricanteActivo === 'Todos' || rep.fabricante === fabricanteActivo;
      return cumpleCat && cumpleFab;
    });
  }, [repuestos, categoriaActiva, fabricanteActivo]);

  const categoriasVisuales = [
    { id: 'Todas', nombre: 'Todo el Catálogo', desc: 'Vista general', icono: Layers },
    { id: 'Frenos', nombre: 'Frenos', desc: 'Pastillas cerámicas', icono: Disc },
    { id: 'Filtros', nombre: 'Filtros', desc: 'Aceite y motor', icono: FilterIcon },
    { id: 'Encendido', nombre: 'Encendido', desc: 'Bujías Iridium', icono: Zap }
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#0B1528] flex flex-col selection:bg-[#FF5A1F] selection:text-white">
      
      {/* 1. NAVBAR FLOTANTE GLASSMORPHISM (Estilo 2026) */}
      <div className="sticky top-0 z-40 px-3 sm:px-6 pt-3 pb-2 bg-[#FAF8F5]/80 backdrop-blur-xl border-b border-stone-200/70">
        <header className="max-w-7xl mx-auto bg-[#0B1528] text-[#FAF8F5] rounded-2xl px-4 sm:px-6 py-3 shadow-lg shadow-[#0B1528]/10 flex items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-[#FF5A1F] to-[#FF8A4C] text-white p-2.5 rounded-xl shadow-md shadow-[#FF5A1F]/30 flex items-center justify-center">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                  Auto<span className="text-[#FF5A1F]">Cotiza</span>
                </span>
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-white/10 text-orange-300 border border-white/10">
                  2026
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Inteligencia de precios y compatibilidad OEM en tiempo real
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {latencia && (
              <div className="hidden md:flex items-center gap-2 text-xs bg-white/5 px-3.5 py-2 rounded-xl border border-white/10">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-300">
                  Motor OEM: <b className="text-white">{latencia}s</b>
                </span>
              </div>
            )}

            <button
              onClick={() => setMostrarAyuda(!mostrarAyuda)}
              className="min-h-[40px] flex items-center gap-1.5 text-xs sm:text-sm font-bold bg-white/10 hover:bg-white/15 text-white px-4 py-2 rounded-xl border border-white/10 transition cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-[#FF5A1F]" />
              <span>Guía rápida</span>
            </button>
          </div>
        </header>

        {/* Bento de Ayuda Desplegable */}
        {mostrarAyuda && (
          <div className="max-w-7xl mx-auto mt-2 bg-[#0B1528] text-white p-4 rounded-2xl shadow-xl border border-white/10 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
              <span className="text-[#FF5A1F] font-extrabold uppercase tracking-wider block mb-1">01 • Configura tu Auto</span>
              <p className="text-slate-300 leading-relaxed">
                Selecciona marca, modelo y año. Filtramos automáticamente solo los repuestos que calzan exacto en tu motor.
              </p>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
              <span className="text-[#FF5A1F] font-extrabold uppercase tracking-wider block mb-1">02 • Precisión OEM</span>
              <p className="text-slate-300 leading-relaxed">
                Cada tarjeta valida el número de serie original de fábrica (OEM) para asegurar una comparación 100% justa.
              </p>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
              <span className="text-emerald-400 font-extrabold uppercase tracking-wider block mb-1">03 • Compra Directa</span>
              <p className="text-slate-300 leading-relaxed">
                Detecta de inmediato la tienda más barata entre Autoplanet, Salfa y Derco Parts y ve directo a su web oficial.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 2. HERO BENTO ASIMÉTRICO (Estilo SaaS 2026) */}
      <section className="max-w-7xl mx-auto w-full px-3 sm:px-6 pt-4 pb-6">
        <div className="relative rounded-3xl bg-[#0B1528] text-[#FAF8F5] p-5 sm:p-8 lg:p-10 shadow-2xl shadow-[#0B1528]/15 overflow-hidden border border-white/10">
          
          {/* Luces de ambiente (Mesh Gradient 2026) */}
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#FF5A1F]/25 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            
            {/* Columna Izquierda: Propuesta de Valor */}
            <div className="lg:col-span-7 space-y-3">
              <div className="inline-flex items-center gap-2 bg-[#FF5A1F]/15 border border-[#FF5A1F]/40 text-[#FF8A4C] px-3.5 py-1.5 rounded-full text-xs font-extrabold tracking-wide">
                <Sparkles className="w-3.5 h-3.5" />
                <span>COMPARADOR AUTOMOTRIZ INTELIGENTE</span>
              </div>
              <h1 className="text-2xl sm:text-4xl lg:text-[40px] font-extrabold tracking-tight text-white leading-[1.15]">
                El repuesto exacto para tu vehículo, <span className="text-[#FF5A1F]">al mejor precio del mercado.</span>
              </h1>
              <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
                Olvídate de recorrer tienda por tienda. Cruzamos códigos originales OEM en tiempo real para que ahorres con total seguridad.
              </p>
            </div>

            {/* Columna Derecha: Tarjeta Bento "Mi Garaje" */}
            <div className="lg:col-span-5">
              <div className="bg-white/10 backdrop-blur-md border border-white/15 p-4 rounded-2xl flex items-center gap-4">
                <img
                  src={imagenesVehiculos[marca] || imagenesVehiculos.Toyota}
                  alt={marca || 'Vehículo'}
                  className="w-20 h-16 sm:w-24 sm:h-18 object-cover rounded-xl border border-white/20 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-emerald-400">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>Garaje Activo</span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-white truncate mt-0.5">
                    {marca ? `${marca} ${modelo} ${anio}` : 'Catálogo Multimarca'}
                  </h2>
                  <p className="text-xs text-slate-300">
                    {marca ? 'Filtrando piezas 100% compatibles' : 'Mostrando todos los modelos'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* DOCK DE BÚSQUEDA INTERACTIVO EN OFF-WHITE */}
          <div className="relative z-10 mt-6 sm:mt-8 bg-[#FAF8F5] text-[#0B1528] p-3.5 sm:p-5 rounded-2xl shadow-xl border border-stone-200/80">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
              
              <div className="lg:col-span-3">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">
                  1. Marca
                </label>
                <select
                  value={marca}
                  onChange={(e) => seleccionarMarca(e.target.value)}
                  className="w-full h-12 px-3.5 rounded-xl bg-white border border-stone-300 font-bold text-base text-[#0B1528] focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]"
                >
                  <option value="">Todas las marcas</option>
                  <option value="Toyota">Toyota</option>
                  <option value="Suzuki">Suzuki</option>
                  <option value="Hyundai">Hyundai</option>
                </select>
              </div>

              <div className="lg:col-span-2">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">
                  2. Modelo
                </label>
                <select
                  value={modelo}
                  onChange={(e) => setModelo(e.target.value)}
                  disabled={!marca}
                  className="w-full h-12 px-3.5 rounded-xl bg-white border border-stone-300 font-bold text-base text-[#0B1528] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]"
                >
                  <option value="">Todos</option>
                  {marca && modelosPorMarca[marca]?.map(mod => (
                    <option key={mod} value={mod}>{mod}</option>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-2">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">
                  3. Año
                </label>
                <select
                  value={anio}
                  onChange={(e) => setAnio(e.target.value)}
                  className="w-full h-12 px-3.5 rounded-xl bg-white border border-stone-300 font-bold text-base text-[#0B1528] focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]"
                >
                  <option value="">Cualquier año</option>
                  {[2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014].map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2 lg:col-span-5">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#FF5A1F] mb-1">
                  4. Nombre de pieza o Código OEM
                </label>
                <form onSubmit={consultarCatalogo} className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={busquedaTexto}
                      onChange={(e) => setBusquedaTexto(e.target.value)}
                      placeholder="Ej: Pastillas, W68/3, 04465-0D150..."
                      className="w-full h-12 pl-10 pr-3 rounded-xl bg-white border border-stone-300 text-base font-medium text-[#0B1528] placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]"
                    />
                    <Search className="w-5 h-5 text-stone-400 absolute left-3.5 top-3.5" />
                  </div>
                  <button
                    type="submit"
                    className="h-12 bg-[#FF5A1F] hover:bg-[#E04812] text-white font-extrabold text-base px-6 rounded-xl shadow-md shadow-[#FF5A1F]/25 transition cursor-pointer shrink-0"
                  >
                    Cotizar Ahora
                  </button>
                </form>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* 3. EXPLORADOR Y CONTROLES DE FILTRADO */}
      <main className="max-w-7xl mx-auto w-full px-3 sm:px-6 pb-12 flex-1 space-y-6">
        
        {/* Píldoras Interactivas de Sistemas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {categoriasVisuales.map((cat) => {
            const Icono = cat.icono;
            const activa = categoriaActiva === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCategoriaActiva(cat.id)}
                className={`p-4 rounded-2xl border text-left transition-all duration-200 flex items-center gap-3.5 cursor-pointer ${
                  activa
                    ? 'bg-[#0B1528] text-white border-[#0B1528] shadow-lg shadow-[#0B1528]/15 -translate-y-0.5'
                    : 'bg-white text-[#0B1528] border-stone-200/90 hover:border-[#FF5A1F]/50 hover:shadow-sm'
                }`}
              >
                <div className={`p-3 rounded-xl shrink-0 ${activa ? 'bg-[#FF5A1F] text-white' : 'bg-[#FAF8F5] text-[#FF5A1F]'}`}>
                  <Icono className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="font-extrabold text-sm sm:text-base block truncate">{cat.nombre}</span>
                  <span className={`text-xs block truncate ${activa ? 'text-slate-300' : 'text-stone-500'}`}>
                    {cat.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Barra de Refinamiento Flotante */}
        <div className="bg-white px-4 py-3.5 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-[#FF5A1F]" />
              <span className="text-xs sm:text-sm font-bold text-stone-600">Marca Repuesto:</span>
              <select
                value={fabricanteActivo}
                onChange={(e) => setFabricanteActivo(e.target.value)}
                className="h-10 text-xs sm:text-sm font-bold bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 text-[#0B1528]"
              >
                {fabricantesDisponibles.map(fab => (
                  <option key={fab} value={fab}>
                    {fab === 'Todos' ? 'Todas (Bosch, Mann, Denso...)' : fab}
                  </option>
                ))}
              </select>
            </div>

            <label className="h-10 flex items-center gap-2 cursor-pointer text-xs sm:text-sm font-bold text-[#0B1528] bg-[#FAF8F5] border border-stone-300 px-3.5 rounded-xl">
              <input
                type="checkbox"
                checked={soloStock}
                onChange={(e) => setSoloStock(e.target.checked)}
                className="rounded text-[#FF5A1F] focus:ring-[#FF5A1F] w-4 h-4"
              />
              <span>Solo con stock</span>
            </label>

            {(marca || busquedaTexto || categoriaActiva !== 'Todas' || fabricanteActivo !== 'Todos') && (
              <button
                onClick={() => {
                  setMarca('');
                  setModelo('');
                  setAnio('');
                  setBusquedaTexto('');
                  setCategoriaActiva('Todas');
                  setFabricanteActivo('Todos');
                }}
                className="text-xs font-extrabold text-[#FF5A1F] hover:underline px-2 cursor-pointer"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 border-t sm:border-t-0 pt-2.5 sm:pt-0 border-stone-200">
            <ArrowUpDown className="w-4 h-4 text-[#FF5A1F]" />
            <span className="text-xs sm:text-sm font-bold text-stone-600">Ordenar:</span>
            <select
              value={ordenPrecio}
              onChange={(e) => setOrdenPrecio(e.target.value)}
              className="h-10 text-xs sm:text-sm font-bold bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 text-[#0B1528]"
            >
              <option value="asc">Menor precio primero</option>
              <option value="desc">Mayor precio primero</option>
            </select>
          </div>
        </div>

        {/* Estado Vacío */}
        {repuestosFiltrados.length === 0 && !cargando && (
          <div className="bg-white p-10 rounded-3xl border border-stone-200 text-center space-y-3">
            <AlertCircle className="w-12 h-12 text-[#FF5A1F] mx-auto" />
            <h3 className="text-lg font-extrabold text-[#0B1528]">
              Sin resultados para este filtro específico
            </h3>
            <p className="text-sm text-stone-500 max-w-md mx-auto">
              Selecciona "Todo el Catálogo" arriba o presiona "Limpiar filtros" para ver todas las piezas disponibles.
            </p>
          </div>
        )}

        {/* 4. TARJETAS BENTO DE PRODUCTOS (Diseño 2026) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {repuestosFiltrados.map((rep) => {
            const ofertasDisponibles = rep.ofertas.filter(o => o.disponible);
            const baseCalculo = ofertasDisponibles.length > 0 ? ofertasDisponibles : rep.ofertas;
            const precioMin = Math.min(...baseCalculo.map(o => o.precio_clp));
            const precioMax = Math.max(...baseCalculo.map(o => o.precio_clp));
            const ahorro = precioMax - precioMin;
            const porcentajeAhorro = precioMax > 0 ? Math.round((ahorro / precioMax) * 100) : 0;
            const imagenProducto = obtenerImagenRepuesto(rep.codigo_oem, rep.categoria);

            return (
              <article
                key={rep.id_repuesto}
                className="group bg-white rounded-3xl border border-stone-200/90 shadow-sm hover:shadow-xl hover:border-stone-300 transition-all duration-300 flex flex-col justify-between overflow-hidden"
              >
                <div>
                  {/* Cabecera Bento: Foto + Especificación */}
                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:gap-5 border-b border-stone-100">
                    
                    {/* Miniatura cuadrada moderna */}
                    <div className="relative w-full sm:w-36 h-44 sm:h-36 rounded-2xl bg-[#0B1528] overflow-hidden shrink-0">
                      <img
                        src={imagenProducto}
                        alt={rep.nombre}
                        className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition duration-500"
                      />
                      <span className="absolute top-2.5 left-2.5 bg-[#0B1528]/85 backdrop-blur-md text-white text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg">
                        {rep.categoria}
                      </span>
                    </div>

                    {/* Datos Técnicos y Precio Destacado */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-extrabold uppercase tracking-wider text-[#FF5A1F]">
                            {rep.fabricante}
                          </span>
                          <span className="text-[11px] bg-emerald-500/10 text-emerald-800 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Calce Exacto
                          </span>
                        </div>

                        <h3 className="text-lg sm:text-xl font-extrabold text-[#0B1528] leading-snug mt-1">
                          {rep.nombre}
                        </h3>

                        {/* Píldora interactiva OEM */}
                        <div className="mt-2.5 inline-flex items-center gap-2 bg-[#FAF8F5] px-3 py-1 rounded-lg border border-stone-200/90">
                          <Tag className="w-3.5 h-3.5 text-[#FF5A1F]" />
                          <span className="text-xs text-stone-500 font-semibold">OEM:</span>
                          <span className="font-mono text-xs font-bold text-[#0B1528]">{rep.codigo_oem}</span>
                          <button
                            onClick={() => copiarCodigo(rep.codigo_oem)}
                            className="text-stone-400 hover:text-[#FF5A1F] cursor-pointer"
                            title="Copiar código OEM"
                          >
                            {oemCopiado === rep.codigo_oem ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Bloque de Mejor Precio y Barra de Ahorro */}
                      <div className="mt-4 pt-3 border-t border-stone-100 flex items-end justify-between gap-2">
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">
                            Mejor oferta desde
                          </span>
                          <span className="text-2xl sm:text-3xl font-extrabold text-[#0B1528] tracking-tight">
                            ${precioMin.toLocaleString('es-CL')}
                          </span>
                        </div>

                        {ahorro > 0 && (
                          <div className="bg-[#FF5A1F]/10 border border-[#FF5A1F]/20 px-3 py-1.5 rounded-xl text-right">
                            <span className="text-xs font-extrabold text-[#FF5A1F] flex items-center gap-1">
                              <TrendingDown className="w-3.5 h-3.5" />
                              Ahorras ${ahorro.toLocaleString('es-CL')} (-{porcentajeAhorro}%)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Lista Comparativa de Tiendas con Indicador de Precio Relativo */}
                  <div className="p-4 sm:p-5 space-y-2.5 bg-[#FAF8F5]/50">
                    {rep.ofertas.map((of) => {
                      const esMejor = of.disponible && of.precio_clp === precioMin;
                      return (
                        <div
                          key={of.id_oferta}
                          className={`p-3.5 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            esMejor
                              ? 'bg-white border-[#FF5A1F] shadow-sm'
                              : 'bg-white border-stone-200/80 hover:border-stone-300'
                          }`}
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-lg border ${badgeTienda(of.tienda)}`}>
                                {of.tienda}
                              </span>
                              {esMejor && (
                                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-[#FF5A1F] text-white px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                  <Flame className="w-3 h-3" /> Mejor Precio
                                </span>
                              )}
                              {!of.disponible && (
                                <span className="text-[10px] font-bold uppercase bg-stone-200 text-stone-600 px-2 py-0.5 rounded-md">
                                  Agotado
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-stone-500 font-medium truncate">
                              {of.nombre_tienda_original || rep.nombre}
                            </p>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100 shrink-0">
                            <span className={`text-lg sm:text-xl font-extrabold ${esMejor ? 'text-[#FF5A1F]' : 'text-[#0B1528]'}`}>
                              ${of.precio_clp.toLocaleString('es-CL')}
                            </span>

                            <a
                              href={`http://localhost:3000/api/redireccion/${of.id_oferta}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`min-h-[40px] text-xs font-extrabold px-4 py-2 rounded-xl flex items-center gap-1.5 transition ${
                                esMejor
                                  ? 'bg-[#FF5A1F] hover:bg-[#E04812] text-white shadow-sm shadow-[#FF5A1F]/20'
                                  : 'bg-[#0B1528] hover:bg-[#182B49] text-white'
                              }`}
                            >
                              <span>Ir a tienda</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Pie de Tarjeta */}
                <div className="px-5 py-3 bg-white border-t border-stone-100 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-stone-400">
                    Precios auditados en línea
                  </span>
                  <button
                    onClick={() => setRepuestoSeleccionado(rep)}
                    className="text-xs font-extrabold text-[#0B1528] hover:text-[#FF5A1F] flex items-center gap-1 transition cursor-pointer"
                  >
                    <span>Ficha técnica completa</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </main>

      {/* 5. MODAL DE FICHA TÉCNICA (Bottom-Sheet en móvil) */}
      {repuestoSeleccionado && (
        <div className="fixed inset-0 bg-[#0B1528]/70 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-[#FAF8F5] rounded-t-3xl sm:rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200">
            
            <div className="relative h-48 bg-[#0B1528]">
              <img
                src={obtenerImagenRepuesto(repuestoSeleccionado.codigo_oem, repuestoSeleccionado.categoria)}
                alt={repuestoSeleccionado.nombre}
                className="w-full h-full object-cover opacity-55"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B1528] via-[#0B1528]/50 to-transparent" />
              
              <button
                onClick={() => setRepuestoSeleccionado(null)}
                className="absolute top-4 right-4 bg-white/15 hover:bg-[#FF5A1F] text-white p-2.5 rounded-full backdrop-blur-md transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute bottom-4 left-6 right-6 text-white">
                <span className="text-[11px] font-extrabold uppercase bg-[#FF5A1F] px-2.5 py-1 rounded-md">
                  {repuestoSeleccionado.categoria} • {repuestoSeleccionado.fabricante}
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold mt-1.5">
                  {repuestoSeleccionado.nombre}
                </h2>
                <p className="text-xs text-slate-300 font-mono mt-0.5">
                  Código OEM Estándar: {repuestoSeleccionado.codigo_oem}
                </p>
              </div>
            </div>

            <div className="p-5 sm:p-6 space-y-4">
              <div className="bg-white border-l-4 border-[#FF5A1F] rounded-xl p-4 text-xs sm:text-sm text-[#0B1528] flex items-start gap-3 shadow-xs">
                <Info className="w-5 h-5 text-[#FF5A1F] shrink-0 mt-0.5" />
                <div>
                  <b>Compatibilidad Verificada:</b> Todas las tiendas listadas ofrecen el componente correspondiente al estándar OEM <b>{repuestoSeleccionado.codigo_oem}</b>.
                </div>
              </div>

              <div className="space-y-2.5">
                {repuestoSeleccionado.ofertas.map((of, idx) => (
                  <div
                    key={of.id_oferta}
                    className="bg-white p-4 rounded-2xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-lg border ${badgeTienda(of.tienda)}`}>
                          {of.tienda}
                        </span>
                        {idx === 0 && of.disponible && (
                          <span className="text-[11px] bg-orange-500/10 text-[#FF5A1F] font-extrabold px-2.5 py-0.5 rounded-full">
                            Recomendado
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-[#0B1528] mt-1">
                        {of.nombre_tienda_original || repuestoSeleccionado.nombre}
                      </p>
                      <p className="text-xs text-stone-400">
                        SKU: {of.sku} • Actualizado: {new Date(of.actualizado).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                      <div>
                        <span className="text-xl font-extrabold text-[#0B1528] block">
                          ${of.precio_clp.toLocaleString('es-CL')}
                        </span>
                        <span className={`text-xs font-bold ${of.disponible ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {of.disponible ? 'En Stock' : 'Sin Stock'}
                        </span>
                      </div>

                      <a
                        href={`http://localhost:3000/api/redireccion/${of.id_oferta}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#FF5A1F] hover:bg-[#E04812] text-white font-extrabold text-xs sm:text-sm px-5 py-2.5 rounded-xl flex items-center gap-1.5 transition"
                      >
                        <span>Comprar</span>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. FOOTER */}
      <footer className="bg-[#0B1528] text-slate-400 border-t-4 border-[#FF5A1F] mt-auto py-8 px-4 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-base font-extrabold text-white">
              Auto<span className="text-[#FF5A1F]">Cotiza</span> Chile
            </span>
            <p className="text-xs text-slate-400 mt-0.5">
              Plataforma neutral de comparación de repuestos automotrices.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="bg-white/5 border border-white/10 text-slate-300 px-3 py-1 rounded-lg font-semibold">Autoplanet</span>
            <span className="bg-white/5 border border-white/10 text-slate-300 px-3 py-1 rounded-lg font-semibold">Salfa Repuestos</span>
            <span className="bg-white/5 border border-white/10 text-slate-300 px-3 py-1 rounded-lg font-semibold">Derco Parts</span>
          </div>
        </div>
      </footer>
    </div>
  );
}