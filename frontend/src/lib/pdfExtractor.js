// Importación dinámica para evitar problemas de SSR
let pdfjsLib = null;

async function loadPDFJS() {
  if (!pdfjsLib) {
    // Importación dinámica solo en el cliente
    if (typeof window !== 'undefined') {
      const pdfjs = await import('pdfjs-dist');
      pdfjsLib = pdfjs;
      
      // Configurar el worker de PDF.js usando el archivo local en static
      // Esto evita problemas con CDNs
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
      console.log('PDF.js worker configured to use local file');
    }
  }
  return pdfjsLib;
}

/**
 * Extrae texto completo de un archivo PDF
 */
export async function extractTextFromPDF(file) {
  console.log('Loading PDF.js library...');
  const pdfjs = await loadPDFJS();
  if (!pdfjs) {
    throw new Error('PDF.js not available');
  }
  
  console.log('Reading file as array buffer...');
  const arrayBuffer = await file.arrayBuffer();
  console.log('Array buffer size:', arrayBuffer.length);
  
  console.log('Loading PDF document...');
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  console.log('PDF loaded successfully, pages:', pdf.numPages);
  
  let fullText = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    console.log(`Processing page ${i} of ${pdf.numPages}...`);
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    fullText += pageText + '\n';
    console.log(`Page ${i} text length:`, pageText.length);
  }
  
  console.log('Total extracted text length:', fullText.length);
  return fullText;
}

/**
 * Extrae datos personales del texto del PDF usando regex
 */
export function extractPersonalData(text) {
  const data = {
    nombre_completo: null,
    rfc: null,
    curp: null,
    lugar_nacimiento: null,
    edad: null
  };
  
  // RFC: 4 letras + 6 números + 3 caracteres (homoclave)
  const rfcPattern = /[A-Z]{4}[0-9]{6}[A-Z0-9]{3}/gi;
  const rfcMatch = text.match(rfcPattern);
  if (rfcMatch) {
    data.rfc = rfcMatch[0].toUpperCase();
  }
  
  // CURP: 4 letras + 6 números + 6 letras + 2 caracteres
  const curpPattern = /[A-Z]{4}[0-9]{6}[A-Z]{6}[0-9A-Z]{2}/gi;
  const curpMatch = text.match(curpPattern);
  if (curpMatch) {
    data.curp = curpMatch[0].toUpperCase();
  }
  
  // Edad: buscar patrones como "edad: 30", "30 años", "30 años de edad"
  const edadPattern = /edad\s*[:=]?\s*(\d{1,3})|(\d{1,3})\s*(años|año|anos)/gi;
  const edadMatch = text.match(edadPattern);
  if (edadMatch) {
    const edadNumber = edadMatch[0].match(/\d{1,3}/);
    if (edadNumber) {
      data.edad = parseInt(edadNumber[0]);
    }
  }
  
  // Lugar de nacimiento: buscar patrones comunes
  const lugarPatterns = [
    /lugar\s*(de\s*)?nacimiento\s*[:=]?\s*([^\n,]+)/gi,
    /nacido\s*(en|a)\s+([^\n,]+)/gi,
    /nacimiento\s*[:=]?\s*([^\n,]+)/gi,
    /lugar\s+de\s+origen\s*[:=]?\s*([^\n,]+)/gi
  ];
  
  for (const pattern of lugarPatterns) {
    const match = text.match(pattern);
    if (match) {
      data.lugar_nacimiento = match[2] || match[1];
      break;
    }
  }
  
  // Nombre completo: buscar patrones como "nombre:", "apellidos", etc.
  const nombrePatterns = [
    /nombre\s*[:=]?\s*([^\n,]+(?:\s+[^\n,]+){1,3})/gi,
    /nombre\s+completo\s*[:=]?\s*([^\n,]+(?:\s+[^\n,]+){1,3})/gi,
    /apellidos?\s+y\s+nombre\s*[:=]?\s*([^\n,]+(?:\s+[^\n,]+){1,4})/gi
  ];
  
  for (const pattern of nombrePatterns) {
    const match = text.match(pattern);
    if (match) {
      data.nombre_completo = match[1].trim();
      break;
    }
  }
  
  return data;
}

/**
 * Simula el procesamiento de una credencial electoral mexicana (INE)
 * Esta función es para demostración cuando no se puede procesar el PDF real
 */
export function simulateCredentialProcessing() {
  return {
    success: true,
    data: {
      nombre_completo: "JUAN PÉREZ GARCÍA",
      rfc: "PEGJ800101H35",
      curp: "PEGJ800101HDFRRN08",
      lugar_nacimiento: "CIUDAD DE MÉXICO",
      edad: 44
    },
    textPreview: "INSTITUTO NACIONAL ELECTORAL CREDENCIAL PARA VOTAR JUAN PÉREZ GARCÍA DOMICILIO: CALLE PRINCIPAL #123 COLONIA CENTRO",
    filename: "Credencial Elector.pdf",
    simulated: true
  };
}

/**
 * Procesa un archivo PDF y extrae los datos personales
 */
export async function processPDFFile(file) {
  // Verificar que estamos en el navegador
  if (typeof window === 'undefined') {
    return {
      success: false,
      error: 'PDF processing is only available in the browser',
      filename: file.name
    };
  }
  
  try {
    console.log('Starting PDF processing for:', file.name);
    const text = await extractTextFromPDF(file);
    console.log('Extracted text length:', text.length);
    console.log('Extracted text preview:', text.substring(0, 200));
    
    const personalData = extractPersonalData(text);
    console.log('Extracted personal data:', personalData);
    
    return {
      success: true,
      data: personalData,
      textPreview: text.substring(0, 500) + '...',
      filename: file.name
    };
  } catch (error) {
    console.error('PDF processing error:', error);
    return {
      success: false,
      error: error.message,
      filename: file.name
    };
  }
}
