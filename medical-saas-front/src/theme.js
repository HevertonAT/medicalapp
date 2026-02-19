import { extendTheme } from '@chakra-ui/react';

const config = {
  initialColorMode: 'light', // Começa claro
  useSystemColorMode: true,  // Respeita a config do sistema
};

const theme = extendTheme({ config });

export default theme;