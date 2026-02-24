import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { ChakraProvider, ColorModeScript, extendTheme } from '@chakra-ui/react';
import { BrowserRouter } from 'react-router-dom';

// 1. Importamos o seu tema atual dando um nome provisório
import baseTheme from './theme'; 

// 2. Misturamos o seu tema com as larguras de tela (breakpoints) forçadas
const theme = extendTheme({
  breakpoints: {
    base: '0em',    // Telas a partir de 0px (Celulares)
    sm: '30em',     // Telas a partir de 480px (Celulares maiores)
    md: '48em',     // Telas a partir de 768px (Tablets e Laptops - Onde a barra lateral aparece)
    lg: '62em',     // Telas a partir de 992px (Desktops)
    xl: '80em',     // Telas a partir de 1280px (Monitores grandes)
    '2xl': '96em',  // Telas a partir de 1536px (Ultra-wide)
  }
}, baseTheme);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* O Script para evitar o 'pisca' do tema escuro */}
    <ColorModeScript initialColorMode={theme.config?.initialColorMode || 'light'} />
    
    <ChakraProvider theme={theme}>
      {/* O Router precisa envolver o App para as páginas funcionarem */}
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ChakraProvider>
  </React.StrictMode>
);