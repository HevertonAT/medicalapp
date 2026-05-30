import { 
  Box, Heading, Text, Button, VStack, HStack, Code, useToast, 
  useColorModeValue, SimpleGrid, Icon // <--- ADICIONEI O 'Icon' AQUI QUE FALTAVA
} from '@chakra-ui/react';
import { FaUserMd, FaUserInjured, FaUserShield, FaBug } from 'react-icons/fa';

export default function DevTools() {
  const toast = useToast();
  
  // Cores Dark Mode
  const bgCard = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.200');

  const currentRole = localStorage.getItem('user_role') || 'Não definido';
  const token = localStorage.getItem('medical_token') || 'Sem token';

  // Função para trocar de role forçadamente (apenas para testes locais)
  const switchRole = (newRole) => {
    localStorage.setItem('user_role', newRole);
    toast({
      title: `Modo trocado para: ${newRole.toUpperCase()}`,
      description: "Recarregando a página para aplicar permissões...",
      status: "info",
      duration: 1500,
    });
    
    setTimeout(() => {
      window.location.reload(); // Recarrega para o menu atualizar
    }, 1500);
  };

  return (
    <Box p={8}>
      <Heading mb={6} color="purple.400">🛠️ Área do Desenvolvedor</Heading>
      <Text mb={6} color={textColor}>
        Use esta tela para testar as permissões e visualizar dados brutos do sistema.
        (Visível apenas para Superusuários).
      </Text>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        
        {/* CARD 1: TROCA RÁPIDA DE PAPEL */}
        <Box bg={bgCard} p={6} borderRadius="lg" shadow="md">
            <Heading size="md" mb={4}>🎭 Troca Rápida de Papel (Role)</Heading>
            <Text fontSize="sm" mb={4} color="gray.500">
                Clique abaixo para simular outro tipo de usuário e testar os menus/acessos.
            </Text>
            
            <VStack align="stretch" spacing={3}>
                <Button leftIcon={<FaUserShield />} colorScheme="purple" onClick={() => switchRole('superuser')}>
                    Virar Desenvolvedor
                </Button>
                <Button leftIcon={<FaUserShield />} colorScheme="blue" onClick={() => switchRole('admin')}>
                    Virar Administrador
                </Button>
                <Button leftIcon={<FaUserMd />} colorScheme="green" onClick={() => switchRole('doctor')}>
                    Virar Médico
                </Button>
                <Button leftIcon={<FaUserInjured />} colorScheme="orange" onClick={() => switchRole('patient')}>
                    Virar Paciente
                </Button>
                <Button leftIcon={<FaUserShield />} colorScheme="teal" onClick={() => switchRole('recepcionista')}>
                    Virar Recepcionista
                </Button>
            </VStack>
        </Box>

        {/* CARD 2: DADOS TÉCNICOS */}
        <Box bg={bgCard} p={6} borderRadius="lg" shadow="md">
            <Heading size="md" mb={4}><Icon as={FaBug} mr={2}/>Debug Info</Heading>
            
            <Text fontWeight="bold">Role Atual:</Text>
            <Code p={2} borderRadius="md" colorScheme="yellow" mb={4} display="block">
                {currentRole}
            </Code>

            <Text fontWeight="bold">Token JWT (Truncado):</Text>
            <Code p={2} borderRadius="md" fontSize="xs" wordBreak="break-all" display="block">
                {token.substring(0, 50)}...
            </Code>
        </Box>

      </SimpleGrid>
    </Box>
  );
}
