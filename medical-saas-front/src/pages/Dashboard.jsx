import { useState, useEffect, useCallback } from 'react';
import { 
  Box, Flex, Heading, Text, Icon, Table, Thead, Tbody, Tr, Th, Td, 
  SimpleGrid, useColorModeValue, Spinner, Select, Input, FormControl, FormLabel
} from '@chakra-ui/react';
import { FaUserInjured, FaCalendarAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

// 1. IMPORTANDO API
import api from '../services/api';

export default function Dashboard() {
  const bgCard = useColorModeValue('white', 'gray.800');
  const inputBg = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.200');
  const headingColor = useColorModeValue('gray.700', 'white');
  const headerBg = useColorModeValue('gray.50', 'gray.700');

  const [period, setPeriod] = useState('today'); 
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [stats, setStats] = useState({
    total_patients: 0,
    appointments_count: 0,
    appointments_list: [] 
  });
  
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const getStatusColor = (status) => {
    switch (status) {
        case 'concluido': return useColorModeValue('green.600', 'green.300'); 
        case 'cancelado': return useColorModeValue('red.600', 'red.300');     
        case 'em_andamento': return useColorModeValue('orange.500', 'orange.300'); 
        case 'reagendado': return useColorModeValue('cyan.600', 'cyan.300');   
        default: return useColorModeValue('purple.600', 'purple.300');         
    }
  };

  const updateDatesByPeriod = useCallback((selectedPeriod) => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    if (selectedPeriod === 'today') {
       // Hoje
    } else if (selectedPeriod === 'weekly') {
       const day = today.getDay();
       const diff = today.getDate() - day + (day === 0 ? -6 : 1);
       start.setDate(diff);
    } else if (selectedPeriod === 'monthly') {
       start = new Date(today.getFullYear(), today.getMonth(), 1);
    }
    
    if (selectedPeriod !== 'custom') {
        setStartDate(start.toISOString().split('T')[0]);
        setEndDate(end.toISOString().split('T')[0]);
    }
  }, []);

  useEffect(() => {
    updateDatesByPeriod(period);
  }, [period, updateDatesByPeriod]);

  // 2. USO DA API
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      // Rota limpa, sem http://127...
      const response = await api.get(`/dashboard/?period=${period}&start_date=${startDate}&end_date=${endDate}`);
      setStats(response.data);
    } catch (error) {
      console.error("Erro dashboard:", error);
    } finally {
      setLoading(false);
    }
  }, [navigate, period, startDate, endDate]);

  useEffect(() => {
    if (startDate && endDate) {
        fetchDashboardData();
    }
  }, [fetchDashboardData, startDate, endDate]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  };

  const getPeriodLabel = () => {
    if (period === 'today') return 'Hoje';
    if (period === 'weekly') return 'Esta Semana';
    if (period === 'monthly') return 'Este Mês';
    if (period === 'custom') return 'Período';
    return '';
  };

  if (loading && !stats.total_patients) {
    return (
      <Flex justify="center" align="center" h="40vh">
        <Spinner size="xl" color="blue.500" thickness='4px' />
      </Flex>
    );
  }

  return (
    <Box p={8}>
      <Heading size="lg" color={headingColor} mb={6}>Visão Geral</Heading>
      
      <Box bg={bgCard} p={4} borderRadius="lg" shadow="sm" mb={8} border="1px" borderColor={borderColor}>
        <Flex gap={4} align="flex-end" wrap="wrap">
            <FormControl w="200px">
                <FormLabel fontSize="sm" color={textColor}>Período Rápido</FormLabel>
                <Select 
                    bg={inputBg} 
                    borderColor={borderColor}
                    color={textColor}
                    value={period} 
                    onChange={(e) => setPeriod(e.target.value)}
                    sx={{ '& > option': { background: bgCard, color: textColor } }}
                >
                    <option value="today">Hoje</option>
                    <option value="weekly">Esta Semana</option>
                    <option value="monthly">Este Mês</option>
                    <option value="custom">Personalizado</option>
                </Select>
            </FormControl>
            
            <FormControl w="180px">
                <FormLabel fontSize="sm" color={textColor}>Data Inicial</FormLabel>
                <Input 
                    type="date" 
                    bg={inputBg} 
                    borderColor={borderColor}
                    color={textColor}
                    value={startDate} 
                    onChange={(e) => { setPeriod('custom'); setStartDate(e.target.value); }} 
                />
            </FormControl>
            <FormControl w="180px">
                <FormLabel fontSize="sm" color={textColor}>Data Final</FormLabel>
                <Input 
                    type="date" 
                    bg={inputBg} 
                    borderColor={borderColor}
                    color={textColor}
                    value={endDate} 
                    onChange={(e) => { setPeriod('custom'); setEndDate(e.target.value); }} 
                />
            </FormControl>
        </Flex>
      </Box>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={8}>
        <Box bg={bgCard} p={6} borderRadius="lg" shadow="sm" borderLeft="4px solid" borderColor="blue.400">
          <Text color="gray.500" fontSize="sm">Total de Pacientes</Text>
          <Flex justify="space-between" align="center" mt={2}>
            <Heading size="lg" color={headingColor}>{stats.total_patients}</Heading>
            <Icon as={FaUserInjured} w={8} h={8} color="blue.200" />
          </Flex>
        </Box>

        <Box bg={bgCard} p={6} borderRadius="lg" shadow="sm" borderLeft="4px solid" borderColor="purple.400">
          <Text color="gray.500" fontSize="sm">Consultas ({getPeriodLabel()})</Text>
          <Flex justify="space-between" align="center" mt={2}>
            <Heading size="lg" color={headingColor}>{stats.appointments_count}</Heading>
            <Icon as={FaCalendarAlt} w={8} h={8} color="purple.200" />
          </Flex>
        </Box>
      </SimpleGrid>

      <Box bg={bgCard} p={6} borderRadius="lg" shadow="sm">
        <Heading size="md" mb={4} color={headingColor}>Atendimentos do Período</Heading>
        
        <Box maxH="400px" overflowY="auto">
            <Table variant="simple">
            <Thead position="sticky" top={0} bg={headerBg} zIndex={1}>
                <Tr>
                <Th color={textColor}>Paciente</Th>
                <Th color={textColor}>Profissional</Th>
                <Th color={textColor}>Data/Hora</Th>
                <Th color={textColor}>Status</Th>
                </Tr>
            </Thead>
            <Tbody>
                {stats.appointments_list.length === 0 ? (
                <Tr>
                    <Td colSpan={4} textAlign="center" color="gray.500" py={6}>
                    Nenhum atendimento encontrado.
                    </Td>
                </Tr>
                ) : (
                stats.appointments_list.map((app) => (
                    <Tr key={app.id} _hover={{ bg: inputBg }}>
                    <Td fontWeight="bold" color={headingColor}>{app.patient_name}</Td>
                    <Td fontSize="sm" color={textColor}>{app.doctor_name}</Td>
                    <Td color={textColor}>{formatDate(app.data_horario)}</Td>
                    
                    <Td>
                        <Text 
                            fontWeight="extrabold" 
                            fontSize="xs" 
                            letterSpacing="wide"
                            textTransform="uppercase"
                            color={getStatusColor(app.status)}
                        >
                            {app.status === 'em_andamento' ? 'EM ANDAMENTO' : app.status}
                        </Text>
                    </Td>
                    </Tr>
                ))
                )}
            </Tbody>
            </Table>
        </Box>
      </Box>
    </Box>
  );
}