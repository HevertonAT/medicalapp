import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import { BrowserRouter } from 'react-router-dom'; // <--- IMPORTANTE: Importar o Router
import theme from './theme';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* O Script para evitar o 'pisca' do tema escuro */}
    <ColorModeScript initialColorMode={theme.config.initialColorMode} />
    
    <ChakraProvider theme={theme}>
      {/* O Router precisa envolver o App para as páginas funcionarem */}
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ChakraProvider>
  </React.StrictMode>,
);