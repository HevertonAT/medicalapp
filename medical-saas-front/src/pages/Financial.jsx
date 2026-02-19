import { useState, useEffect } from 'react';
import {
  Box, Heading, SimpleGrid, Stat, StatLabel, StatNumber,
  StatArrow, Flex, Icon, Select, FormControl, FormLabel, Input, Button,
  useToast, Spinner, useColorModeValue, Text
} from '@chakra-ui/react';
import { FaMoneyBillWave, FaWallet, FaFileInvoiceDollar, FaFilePdf } from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';

// 1. IMPORTANDO API CENTRALIZADA
import api from '../services/api';

export default function Financial() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ 
    income: 0, expense: 0, balance: 0, transactions: [], chart_data: [] 
  });
  
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  const toast = useToast();
  const navigate = useNavigate();

  const bgCard = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.200');
  const inputBg = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const chartTooltipBg = useColorModeValue('#fff', '#2D3748');

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      
      let query = '?';
      if (dateRange.start) query += `start_date=${dateRange.start}&`;
      if (dateRange.end) query += `end_date=${dateRange.end}`;

      // 2. USANDO A INSTÂNCIA API (Sem URL fixa, sem header manual)
      const response = await api.get(`/financial/stats${query}`);
      
      setStats(response.data);
    } catch (error) {
      console.error(error);
      if (error.response && error.response.status === 403) {
          toast({ title: 'Acesso Negado', description: 'Você não tem permissão para ver isso.', status: 'error' });
          navigate('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialData();
  }, [dateRange]);

  const handleQuickFilter = (type) => {
    const today = new Date();
    let start = '';
    let end = today.toISOString().split('T')[0];

    if (type === 'today') {
        start = end;
    } else if (type === 'week') {
        const lastWeek = new Date(today.setDate(today.getDate() - 7));
        start = lastWeek.toISOString().split('T')[0];
    } else if (type === 'month') {
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        start = firstDay.toISOString().split('T')[0];
    }
    setDateRange({ start, end });
  };

  return (
    <Box p={8}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg" color={useColorModeValue("gray.700", "white")}>Gestão Financeira</Heading>
        <Flex gap={2}>
            <Button leftIcon={<FaFileInvoiceDollar />} colorScheme="green">Lançar Faturamento</Button>
            <Button leftIcon={<FaFilePdf />} colorScheme="blue" variant="outline">Relatório PDF</Button>
        </Flex>
      </Flex>

      <Box bg={bgCard} p={5} shadow="sm" borderRadius="lg" mb={6} border="1px" borderColor={borderColor}>
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
            <FormControl>
                <FormLabel>Período Rápido</FormLabel>
                <Select 
                    bg={inputBg} 
                    borderColor={borderColor}
                    onChange={(e) => handleQuickFilter(e.target.value)}
                    sx={{ '& > option': { background: bgCard, color: textColor } }}
                >
                    <option value="">Selecione...</option>
                    <option value="today">Hoje</option>
                    <option value="week">Esta Semana</option>
                    <option value="month">Este Mês</option>
                </Select>
            </FormControl>
            <FormControl>
                <FormLabel>Data Inicial</FormLabel>
                <Input 
                    type="date" 
                    bg={inputBg} 
                    borderColor={borderColor}
                    value={dateRange.start} 
                    onChange={(e) => setDateRange({...dateRange, start: e.target.value})} 
                />
            </FormControl>
            <FormControl>
                <FormLabel>Data Final</FormLabel>
                <Input 
                    type="date" 
                    bg={inputBg} 
                    borderColor={borderColor}
                    value={dateRange.end} 
                    onChange={(e) => setDateRange({...dateRange, end: e.target.value})} 
                />
            </FormControl>
        </SimpleGrid>
      </Box>

      {loading ? <Spinner size="xl" /> : (
        <>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
            <Stat bg={bgCard} p={5} shadow="sm" borderRadius="lg" borderLeft="4px solid" borderColor="green.400">
              <Flex justify="space-between">
                <Box>
                    <StatLabel color="gray.500">Faturamento no Período</StatLabel>
                    <StatNumber fontSize="2xl" color="green.500">
                        R$ {stats.period_revenue ? stats.period_revenue.toFixed(2) : "0.00"}
                    </StatNumber>
                </Box>
                <Icon as={FaMoneyBillWave} w={8} h={8} color="green.200" />
              </Flex>
            </Stat>

            <Stat bg={bgCard} p={5} shadow="sm" borderRadius="lg" borderLeft="4px solid" borderColor="blue.400">
              <Flex justify="space-between">
                <Box>
                    <StatLabel color="gray.500">Total Acumulado (Geral)</StatLabel>
                    <StatNumber fontSize="2xl" color="blue.500">
                        R$ {stats.total_accumulated ? stats.total_accumulated.toFixed(2) : "0.00"}
                    </StatNumber>
                </Box>
                <Icon as={FaWallet} w={8} h={8} color="blue.200" />
              </Flex>
            </Stat>
          </SimpleGrid>

          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
            <Box bg={bgCard} p={5} shadow="sm" borderRadius="lg" h="400px">
                <Heading size="md" mb={4} color={textColor}>Evolução Diária (Período)</Heading>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.chart_data}>
                        <CartesianGrid strokeDasharray="3 3" stroke={useColorModeValue("#eee", "#444")} />
                        <XAxis dataKey="name" stroke={textColor} />
                        <YAxis stroke={textColor} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: chartTooltipBg, borderColor: borderColor }} 
                            itemStyle={{ color: useColorModeValue('#000', '#fff') }}
                        />
                        <Legend />
                        <Bar dataKey="valor" fill="#48BB78" name="Faturamento (R$)" />
                    </BarChart>
                </ResponsiveContainer>
            </Box>

            <Box bg={bgCard} p={5} shadow="sm" borderRadius="lg">
                <Heading size="md" mb={4} color={textColor}>Últimos Lançamentos</Heading>
                <Flex direction="column" gap={3}>
                    <Flex justify="space-between" color="gray.500" fontSize="xs" fontWeight="bold" px={2}>
                        <Text flex="1">DATA</Text>
                        <Text flex="1">VALOR</Text>
                        <Text flex="1">MÉTODO</Text>
                    </Flex>
                    {stats.transactions && stats.transactions.map((t) => (
                        <Flex key={t.id} justify="space-between" p={3} bg={inputBg} borderRadius="md" align="center">
                             <Text fontSize="sm" flex="1">{new Date(t.created_at).toLocaleDateString()}</Text>
                             <Text fontSize="sm" flex="1" fontWeight="bold" color="green.500">R$ {t.valor_total.toFixed(2)}</Text>
                             <Text fontSize="xs" flex="1" fontWeight="bold" bg="gray.200" color="black" px={2} py={1} borderRadius="md" w="fit-content" textAlign="center">
                                {t.metodo_pagamento.toUpperCase()}
                             </Text>
                        </Flex>
                    ))}
                    {(!stats.transactions || stats.transactions.length === 0) && (
                        <Text color="gray.500" textAlign="center" mt={4}>Nenhum lançamento no período.</Text>
                    )}
                </Flex>
            </Box>
          </SimpleGrid>
        </>
      )}
    </Box>
  );
}