import { useState, useEffect } from 'react';
import {
  Box, Heading, SimpleGrid, Stat, StatLabel, StatNumber,
  Flex, Icon, Select, FormControl, FormLabel, Input, Button,
  useToast, Spinner, useColorModeValue, Text, useDisclosure,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton,
  ModalBody, ModalFooter, VStack
} from '@chakra-ui/react';
import { FaMoneyBillWave, FaWallet, FaFileInvoiceDollar, FaFilePdf } from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';

import api from '../services/api';

export default function Financial() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ 
    period_revenue: 0, period_expense: 0, total_accumulated: 0, transactions: [], chart_data: [] 
  });
  
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  // --- CONTROLE DO MODAL DE LANÇAMENTO ---
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTx, setNewTx] = useState({
    valor_total: '',
    metodo_pagamento: 'pix',
    descricao: 'Receita Avulsa',
    status_nfe: 'pendente'
  });

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

      // 1. FURA-CACHE DA VERCEL: Obriga a buscar do banco e não do histórico
      const response = await api.get(`/financial/stats${query}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      setStats(response.data);
    } catch (error) {
      console.error(error);
      if (error.response && error.response.status === 403) {
          toast({ title: 'Acesso Negado', description: 'Você não tem permissão.', status: 'error' });
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

  const handleCreateTransaction = async () => {
    if (!newTx.valor_total || !newTx.metodo_pagamento || !newTx.descricao) {
        toast({ title: 'Preencha os campos obrigatórios!', status: 'warning' });
        return;
    }
    setIsSubmitting(true);
    try {
        const payload = {
            valor_total: parseFloat(newTx.valor_total),
            metodo_pagamento: newTx.metodo_pagamento,
            descricao: newTx.descricao,
            status_nfe: newTx.status_nfe,
            tipo: "entrada" // Força o tipo para garantir a leitura do banco
        };
        
        // 2. CORREÇÃO DA ROTA (Barra no final evita erros 307 de redirecionamento)
        await api.post('/financial/', payload);
        
        toast({ title: 'Faturamento lançado com sucesso!', status: 'success' });
        onClose();
        setNewTx({ valor_total: '', metodo_pagamento: 'pix', descricao: 'Receita Avulsa', status_nfe: 'pendente' });
        
        // Atualiza a tela imediatamente após salvar
        fetchFinancialData(); 
    } catch (error) {
        toast({ title: 'Erro ao lançar.', description: error.response?.data?.detail, status: 'error' });
    } finally {
        setIsSubmitting(false);
    }
  };

  // =========================================================================
  // --- 3. GERADOR DE RELATÓRIO PDF (O MODO INVISÍVEL E BONITO) ---
  // =========================================================================
  const handlePrintPDF = () => {
    const dataInicio = dateRange.start ? new Date(dateRange.start + 'T00:00:00').toLocaleDateString('pt-BR') : 'Início do Mês';
    const dataFim = dateRange.end ? new Date(dateRange.end + 'T00:00:00').toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Relatório Financeiro</title>
            <style>
                body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #333; line-height: 1.6; background: white; }
                .header { text-align: center; border-bottom: 2px solid #48BB78; padding-bottom: 20px; margin-bottom: 30px; }
                .header h1 { margin: 0; color: #2D3748; font-size: 28px; text-transform: uppercase; }
                .header p { margin: 5px 0 0 0; color: #718096; font-size: 14px; }
                .summary { display: flex; justify-content: space-between; margin-bottom: 40px; }
                .summary-box { background: #F7FAFC; border: 1px solid #E2E8F0; padding: 20px; border-radius: 8px; width: 45%; text-align: center; }
                .summary-box h3 { margin: 0 0 10px 0; color: #4A5568; font-size: 14px; text-transform: uppercase; }
                .summary-box p { margin: 0; font-size: 28px; font-weight: bold; }
                .val-green { color: #48BB78; }
                .val-blue { color: #3182CE; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
                th, td { border-bottom: 1px solid #E2E8F0; padding: 12px 15px; text-align: left; }
                th { background-color: #EDF2F7; color: #4A5568; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
                .method-badge { background: #E2E8F0; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; color: #4A5568; }
                .amount { color: #48BB78; font-weight: bold; }
                .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #A0AEC0; border-top: 1px solid #E2E8F0; padding-top: 20px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Relatório Financeiro da Clínica</h1>
                <p>Período de apuração: <strong>${dataInicio}</strong> até <strong>${dataFim}</strong></p>
            </div>

            <div class="summary">
                <div class="summary-box">
                    <h3>Faturamento no Período</h3>
                    <p class="val-green">R$ ${stats.period_revenue ? stats.period_revenue.toFixed(2) : "0.00"}</p>
                </div>
                <div class="summary-box">
                    <h3>Total Acumulado (Geral)</h3>
                    <p class="val-blue">R$ ${stats.total_accumulated ? stats.total_accumulated.toFixed(2) : "0.00"}</p>
                </div>
            </div>

            <h2 style="color: #2D3748; font-size: 18px; border-left: 4px solid #48BB78; padding-left: 10px;">Lançamentos do Período</h2>
            <table>
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Descrição</th>
                        <th>Método</th>
                        <th style="text-align: right;">Valor (R$)</th>
                    </tr>
                </thead>
                <tbody>
                    ${stats.transactions && stats.transactions.length > 0 ? stats.transactions.map(t => `
                        <tr>
                            <td>${t.criado_em ? new Date(t.criado_em).toLocaleDateString('pt-BR') : '-'}</td>
                            <td>${t.descricao || 'Receita Avulsa'}</td>
                            <td><span class="method-badge">${t.forma_pagamento ? t.forma_pagamento.toUpperCase() : '-'}</span></td>
                            <td class="amount" style="text-align: right;">R$ ${Number(t.valor).toFixed(2)}</td>
                        </tr>
                    `).join('') : '<tr><td colspan="4" style="text-align: center; padding: 30px; color: #A0AEC0;">Nenhum lançamento encontrado neste período.</td></tr>'}
                </tbody>
            </table>

            <div class="footer">
                Documento gerado automaticamente pelo sistema em ${new Date().toLocaleString('pt-BR')}
            </div>
        </body>
        </html>
    `;

    // Cria um iframe invisível para imprimir o HTML perfeitamente sem abrir janelas chatas
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();

    // Quando o HTML terminar de carregar invisivelmente, dispara a impressão
    iframe.onload = function() {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        
        // Remove o iframe para não pesar o navegador depois de 2 segundos
        setTimeout(() => {
            document.body.removeChild(iframe);
        }, 2000);
    };
  };

  return (
    <Box p={8}>
      <Flex justify="space-between" align="center" mb={6} direction={{ base: 'column', md: 'row' }} gap={4}>
        <Heading size="lg" color={useColorModeValue("gray.700", "white")}>Gestão Financeira</Heading>
        <Flex gap={2}>
            <Button leftIcon={<FaFileInvoiceDollar />} colorScheme="green" onClick={onOpen}>Lançar Faturamento</Button>
            <Button leftIcon={<FaFilePdf />} colorScheme="blue" variant="outline" onClick={handlePrintPDF}>Relatório PDF</Button>
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
                    type="date" bg={inputBg} borderColor={borderColor}
                    value={dateRange.start} onChange={(e) => setDateRange({...dateRange, start: e.target.value})} 
                />
            </FormControl>
            <FormControl>
                <FormLabel>Data Final</FormLabel>
                <Input 
                    type="date" bg={inputBg} borderColor={borderColor}
                    value={dateRange.end} onChange={(e) => setDateRange({...dateRange, end: e.target.value})} 
                />
            </FormControl>
        </SimpleGrid>
      </Box>

      {loading ? <Flex justify="center" my={10}><Spinner size="xl" color="blue.500" /></Flex> : (
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
            <Flex direction="column" bg={bgCard} p={5} shadow="sm" borderRadius="lg" h="400px" border="1px" borderColor={borderColor}>
                <Heading size="md" mb={4} color={textColor}>Evolução Diária (Período)</Heading>
                <Box flex="1" minH="0" w="100%">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.chart_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={useColorModeValue("#eee", "#444")} />
                            <XAxis dataKey="name" stroke={textColor} fontSize={12} />
                            <YAxis stroke={textColor} fontSize={12} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: chartTooltipBg, borderColor: borderColor, borderRadius: '8px' }} 
                                itemStyle={{ color: useColorModeValue('#000', '#fff') }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '10px' }} />
                            <Bar dataKey="valor" fill="#48BB78" name="Faturamento (R$)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </Box>
            </Flex>

            <Box bg={bgCard} p={5} shadow="sm" borderRadius="lg" border="1px" borderColor={borderColor} overflowY="auto" maxH="400px">
                <Heading size="md" mb={4} color={textColor}>Últimos Lançamentos</Heading>
                <Flex direction="column" gap={3}>
                    <Flex justify="space-between" color="gray.500" fontSize="xs" fontWeight="bold" px={2}>
                        <Text flex="1">DATA</Text>
                        <Text flex="1">VALOR</Text>
                        <Text flex="1" textAlign="right">MÉTODO</Text>
                    </Flex>
                    
                    {stats.transactions && stats.transactions.map((t) => (
                        <Flex key={t.id} justify="space-between" p={3} bg={inputBg} borderRadius="md" align="center" border="1px" borderColor={borderColor}>
                             <Text fontSize="sm" flex="1">
                                {t.criado_em ? new Date(t.criado_em).toLocaleDateString('pt-BR') : '-'}
                             </Text>
                             <Text fontSize="sm" flex="1" fontWeight="bold" color="green.500">
                                R$ {Number(t.valor).toFixed(2)}
                             </Text>
                             <Box flex="1" display="flex" justifyContent="flex-end">
                                <Text fontSize="xs" fontWeight="bold" bg="gray.200" color="black" px={2} py={1} borderRadius="md" w="fit-content">
                                    {t.forma_pagamento ? t.forma_pagamento.toUpperCase() : 'N/A'}
                                </Text>
                             </Box>
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

      {/* --- MODAL PARA LANÇAR NOVO FATURAMENTO --- */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent bg={bgCard} border="1px solid" borderColor={borderColor}>
          <ModalHeader color={textColor}>Lançar Receita Avulsa</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
                <FormControl isRequired>
                    <FormLabel color={textColor}>Valor (R$)</FormLabel>
                    <Input 
                        type="number" step="0.01" bg={inputBg} borderColor={borderColor}
                        placeholder="Ex: 150.00"
                        value={newTx.valor_total}
                        onChange={(e) => setNewTx({...newTx, valor_total: e.target.value})}
                    />
                </FormControl>
                <FormControl isRequired>
                    <FormLabel color={textColor}>Descrição</FormLabel>
                    <Input 
                        type="text" bg={inputBg} borderColor={borderColor}
                        placeholder="Ex: Consulta Particular"
                        value={newTx.descricao}
                        onChange={(e) => setNewTx({...newTx, descricao: e.target.value})}
                    />
                </FormControl>
                <FormControl isRequired>
                    <FormLabel color={textColor}>Método de Pagamento</FormLabel>
                    <Select 
                        bg={inputBg} borderColor={borderColor}
                        value={newTx.metodo_pagamento}
                        onChange={(e) => setNewTx({...newTx, metodo_pagamento: e.target.value})}
                    >
                        <option value="pix">PIX</option>
                        <option value="cartao_credito">Cartão de Crédito</option>
                        <option value="cartao_debito">Cartão de Débito</option>
                        <option value="dinheiro">Dinheiro Físico</option>
                        <option value="convenio">Convênio</option>
                    </Select>
                </FormControl>
                <FormControl>
                    <FormLabel color={textColor}>Status da NF-e / Recibo</FormLabel>
                    <Select 
                        bg={inputBg} borderColor={borderColor}
                        value={newTx.status_nfe}
                        onChange={(e) => setNewTx({...newTx, status_nfe: e.target.value})}
                    >
                        <option value="pendente">Pendente de Emissão</option>
                        <option value="emitida">Já Emitida</option>
                        <option value="dispensada">Dispensada</option>
                    </Select>
                </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>Cancelar</Button>
            <Button colorScheme="green" onClick={handleCreateTransaction} isLoading={isSubmitting}>
              Salvar Receita
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}