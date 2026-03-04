import { useState, useEffect } from 'react';
import {
  Box, Flex, Heading, SimpleGrid, Stat, StatLabel, StatNumber, StatHelpText,
  Table, Thead, Tbody, Tr, Th, Td, Badge, Button, useToast, Spinner, 
  useColorModeValue, Icon, Text, Menu, MenuButton, MenuList, MenuItem
} from '@chakra-ui/react';
import { FaBuilding, FaDollarSign, FaExclamationTriangle, FaChevronDown, FaCheck, FaLock } from 'react-icons/fa';
import api from '../services/api';

export default function PainelSaaS() {
  const [data, setData] = useState({ metrics: {}, clinics: [] });
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const bgCard = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.200');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await api.get('/saas/dashboard');
      setData(response.data);
    } catch (error) {
      toast({ title: "Erro ao carregar dados do SaaS", status: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const changeStatus = async (clinicId, newStatus) => {
    try {
      await api.put(`/saas/clinica/${clinicId}/status?status=${newStatus}`);
      toast({ title: `Status alterado para ${newStatus.toUpperCase()}`, status: 'success' });
      fetchDashboard();
    } catch (error) {
      toast({ title: "Erro ao alterar status", status: "error" });
    }
  };

  return (
    <Box p={8}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg" color={useColorModeValue("gray.700", "white")}>Matriz SaaS (Administração)</Heading>
      </Flex>

      {loading ? <Flex justify="center" py={10}><Spinner size="xl" color="purple.500" /></Flex> : (
        <>
          {/* CARDS DE MÉTRICAS */}
          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6} mb={8}>
            <Stat bg={bgCard} p={5} shadow="sm" borderRadius="lg" borderLeft="4px solid" borderColor="purple.500">
              <Flex justify="space-between" align="center">
                <Box>
                    <StatLabel color="gray.500" fontWeight="bold">MRR (Receita Recorrente)</StatLabel>
                    <StatNumber fontSize="3xl" color="purple.600">
                        R$ {data.metrics.mrr ? data.metrics.mrr.toFixed(2) : '0.00'}
                    </StatNumber>
                    <StatHelpText mb={0}>Mês atual</StatHelpText>
                </Box>
                <Icon as={FaDollarSign} w={8} h={8} color="purple.200" />
              </Flex>
            </Stat>

            <Stat bg={bgCard} p={5} shadow="sm" borderRadius="lg" borderLeft="4px solid" borderColor="blue.400">
              <Flex justify="space-between" align="center">
                <Box>
                    <StatLabel color="gray.500" fontWeight="bold">Clínicas Ativas</StatLabel>
                    <StatNumber fontSize="3xl" color="blue.500">{data.metrics.active_clinics || 0}</StatNumber>
                    <StatHelpText mb={0}>Pagamento em dia</StatHelpText>
                </Box>
                <Icon as={FaBuilding} w={8} h={8} color="blue.200" />
              </Flex>
            </Stat>

            <Stat bg={bgCard} p={5} shadow="sm" borderRadius="lg" borderLeft="4px solid" borderColor="red.400">
              <Flex justify="space-between" align="center">
                <Box>
                    <StatLabel color="gray.500" fontWeight="bold">Inadimplentes</StatLabel>
                    <StatNumber fontSize="3xl" color="red.500">{data.metrics.defaulting_clinics || 0}</StatNumber>
                    <StatHelpText mb={0}>Pagamento atrasado</StatHelpText>
                </Box>
                <Icon as={FaExclamationTriangle} w={8} h={8} color="red.200" />
              </Flex>
            </Stat>

            <Stat bg={bgCard} p={5} shadow="sm" borderRadius="lg" borderLeft="4px solid" borderColor="gray.400">
              <Flex justify="space-between" align="center">
                <Box>
                    <StatLabel color="gray.500" fontWeight="bold">Total de Franquias</StatLabel>
                    <StatNumber fontSize="3xl" color="gray.600">{data.metrics.total_clinics || 0}</StatNumber>
                    <StatHelpText mb={0}>Cadastradas na base</StatHelpText>
                </Box>
                <Icon as={FaBuilding} w={8} h={8} color="gray.200" />
              </Flex>
            </Stat>
          </SimpleGrid>

          {/* TABELA DE ASSINATURAS */}
          <Box bg={bgCard} shadow="sm" borderRadius="md" overflow="auto" border="1px" borderColor={borderColor}>
            <Box p={4} borderBottom="1px" borderColor={borderColor} bg={useColorModeValue('gray.50', 'gray.800')}>
                <Text fontWeight="bold" color={textColor}>Gestão de Assinaturas</Text>
            </Box>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>ID</Th>
                  <Th>Clínica</Th>
                  <Th>Plano</Th>
                  <Th isNumeric>Mensalidade</Th>
                  <Th textAlign="center">Vencimento</Th>
                  <Th textAlign="center">Status</Th>
                  <Th textAlign="center">Ações</Th>
                </Tr>
              </Thead>
              <Tbody>
                {data.clinics && data.clinics.map((clinic) => (
                  <Tr key={clinic.id}>
                    <Td fontWeight="bold" color="gray.500">#{clinic.id}</Td>
                    <Td fontWeight="bold">{clinic.nome}</Td>
                    <Td><Badge colorScheme="purple" variant="outline">{clinic.plano || 'Starter'}</Badge></Td>
                    <Td isNumeric fontWeight="bold" color="green.500">
                        R$ {clinic.valor_mensalidade ? clinic.valor_mensalidade.toFixed(2) : '199.90'}
                    </Td>
                    <Td textAlign="center">Dia {clinic.dia_vencimento || 10}</Td>
                    <Td textAlign="center">
                        <Badge 
                            colorScheme={clinic.status_assinatura === 'ativa' ? 'green' : clinic.status_assinatura === 'inadimplente' ? 'red' : 'gray'}
                            px={2} py={1} borderRadius="md"
                        >
                            {clinic.status_assinatura?.toUpperCase() || 'ATIVA'}
                        </Badge>
                    </Td>
                    <Td textAlign="center">
                        <Menu>
                            <MenuButton as={Button} size="xs" rightIcon={<FaChevronDown />} colorScheme="gray" variant="outline">
                                Gerenciar
                            </MenuButton>
                            <MenuList zIndex={3}>
                                <MenuItem icon={<FaCheck color="green" />} onClick={() => changeStatus(clinic.id, 'ativa')}>
                                    Marcar como Pagante (Ativa)
                                </MenuItem>
                                <MenuItem icon={<FaExclamationTriangle color="orange" />} onClick={() => changeStatus(clinic.id, 'inadimplente')}>
                                    Avisar Atraso (Inadimplente)
                                </MenuItem>
                                <MenuItem icon={<FaLock color="red" />} onClick={() => changeStatus(clinic.id, 'bloqueada')}>
                                    Bloquear Acesso
                                </MenuItem>
                            </MenuList>
                        </Menu>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </>
      )}
    </Box>
  );
}