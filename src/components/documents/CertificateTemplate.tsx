"use client";
import { Box, Printer } from 'lucide-react';

export default function CertificateTemplate({ profile }: { profile: unknown }) {
  const currentDate = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
  const salaryFormatted = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(profile.base_salary || 0);
  const contractTypeRaw = String((profile as { contract_type?: string }).contract_type || '');
  const normalizedContract = contractTypeRaw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  let contractLabel = 'Indefinido';
  if (normalizedContract.includes('obra') || normalizedContract.includes('labor')) contractLabel = 'Obra o Labor';
  else if (normalizedContract.includes('fijo')) contractLabel = 'T?rmino Fijo';
  else if (normalizedContract.includes('indef')) contractLabel = 'Indefinido';
  else if (contractTypeRaw) contractLabel = contractTypeRaw;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-10 text-gray-900 print:p-0">
      {/* BOTÓN NO IMPRIMIBLE */}
      <div className="mb-8 text-center print:hidden">
        <button 
            onClick={handlePrint} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-bold shadow-lg flex items-center gap-2 mx-auto"
        >
            <Printer className="w-5 h-5" /> Imprimir / Guardar como PDF
        </button>
        <p className="text-xs text-gray-400 mt-2">Usa la opción &quot;Guardar como PDF&quot; de tu navegador.</p>
      </div>

      {/* DOCUMENTO OFICIAL */}
      <div className="max-w-[21cm] mx-auto bg-white print:shadow-none p-12 border border-gray-200 print:border-0 print:w-full">
        
        {/* ENCABEZADO */}
        <div className="flex justify-between items-start mb-12 border-b-2 border-orange-500 pb-4">
            <div className="flex items-center gap-3">
                <div className="bg-orange-500 p-2 rounded-lg print:bg-orange-500">
                    <Box className="w-8 h-8 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-gray-900 leading-none">SMART FOX</h1>
                    <p className="text-xs tracking-[0.3em] font-bold text-orange-600">SOLUTIONS S.A.S</p>
                </div>
            </div>
            <div className="text-right text-xs text-gray-500">
                <p>NIT: 900.123.456-1</p>
                <p>Calle 10 # 40-50, Medellín</p>
                <p>recursos.humanos@smartfox.com</p>
            </div>
        </div>

        {/* TÍTULO */}
        <div className="text-center mb-12">
            <h2 className="text-xl font-bold uppercase tracking-widest underline decoration-2 decoration-gray-300">
                A QUIEN INTERESE
            </h2>
        </div>

        {/* CUERPO */}
        <div className="text-justify leading-loose text-lg mb-16 space-y-6">
            <p>
                La empresa <strong>SMART FOX SOLUTIONS S.A.S</strong> certifica que el señor(a) 
                <strong> {profile.full_name?.toUpperCase()}</strong>, identificado(a) con cédula de ciudadanía número 
                <strong> {profile.document_id || '___________'}</strong>, labora en nuestra compañía desde el día 
                <strong> {profile.hiring_date || '___________'}</strong>.
            </p>
            <p>
                Actualmente desempeña el cargo de <strong>{profile.role?.toUpperCase()}</strong> mediante un contrato a 
                término <strong>{contractLabel}</strong>, devengando un salario mensual básico de:
            </p>
            <p className="text-center font-bold text-xl my-8">
                {salaryFormatted} M/L
            </p>
            <p>
                La presente certificación se expide a solicitud del interesado(a) en la ciudad de Medellín, a los 
                {currentDate}.
            </p>
        </div>

        {/* FIRMA */}
        <div className="mt-24">
            <div className="border-t border-black w-64 pt-2"></div>
            <p className="font-bold">GERENCIA DE TALENTO HUMANO</p>
            <p className="text-sm text-gray-500">Smart Fox Solutions S.A.S</p>
            <p className="text-sm text-gray-500">Tel: (604) 444-5555</p>
        </div>

        {/* FOOTER */}
        <div className="mt-20 pt-4 border-t border-gray-100 text-center text-[10px] text-gray-400">
            <p>Este certificado fue generado electrónicamente a través de la plataforma Smart Fox ERP.</p>
            <p>Verifique la autenticidad contactando a RRHH.</p>
        </div>

      </div>
    </div>
  );
}