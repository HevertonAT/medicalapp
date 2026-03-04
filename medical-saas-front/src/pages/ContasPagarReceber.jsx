import { useState, useEffect } from 'react';
import {
  Box, Flex, Heading, Button, Table, Thead, Tbody, Tr, Th, Td, Badge,
  Select, IconButton, useToast, Spinner, useColorModeValue, Text, Tooltip,
  HStack, Input, SimpleGrid, useDisclosure, Modal, ModalOverlay,
  ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton,
  FormControl, FormLabel, InputGroup, InputLeftElement, VStack
} from '@chakra-ui/react';
import { FaPlus, FaCheckCircle, FaTrash, FaSearch, FaFileInvoice } from 'react-icons/fa';
import api from '../services/api';

export default function ContasPagarReceber() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros da API (Backend)
  const dataAtual = new Date();
  const [filters, setFilters] = useState({
    mes: dataAtual.getMonth() + 1, 
    ano: dataAtual.getFullYear(),
    tipo: '',
    status: ''
  });

  const [searchTerm, setSearchTerm] = useState('');

  // Modal Principal (Nova Transação)
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTx, setNewTx] = useState({
    descricao: '', valor: '', tipo: 'entrada', categoria: '', 
    data_vencimento: '', status: 'pendente', status_nfe: 'pendente'
  });

  // --- NOVO: Controle do Modal de NF-e ---
  const { isOpen: isNfeOpen, onOpen: onNfeOpen, onClose: onNfeClose } = useDisclosure();
  const [selectedTx, setSelectedTx] = useState(null);
  const [nfeStatusToUpdate, setNfeStatusToUpdate] = useState('');
  const [nfeLinkToUpdate, setNfeLinkToUpdate] = useState('');

  const toast = useToast();

  const bgCard = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.200');
  const inputBg = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverTr = useColorModeValue('gray.50', 'gray.700');

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      let queryParams = new URLSearchParams();
      if (filters.mes) queryParams.append('mes', filters.mes);
      if (filters.ano) queryParams.append('ano', filters.ano);
      if (filters.tipo) queryParams.append('tipo', filters.tipo);
      if (filters.status) queryParams.append('status', filters.status);

      const response = await api.get(`/financial/all?${queryParams.toString()}`);
      
      if (Array.isArray(response.data)) {
        setTransactions(response.data);
      } else {
        setTransactions([]);
      }
    } catch (error) {
      toast({ title: "Erro ao buscar transações", status: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [filters]); 

  const filteredTransactions = transactions.filter((t) => {
    if (!searchTerm) return true; 
    const termo = searchTerm.toLowerCase();
    const dataFormatada = t.data_vencimento ? new Date(t.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR') : '';
    const descricao = t.descricao?.toLowerCase() || '';
    const categoria = t.categoria?.toLowerCase() || '';
    const valor = t.valor?.toString() || '';

    return (
      descricao.includes(termo) || categoria.includes(termo) ||
      valor.includes(termo) || dataFormatada.includes(termo)
    );
  });

  // --- AÇÕES DA TABELA ---
  const handleDarBaixa = async (id, tipo) => {
    const confirmMsg = tipo === 'entrada' ? 'Confirmar recebimento?' : 'Confirmar pagamento desta despesa?';
    if (!window.confirm(confirmMsg)) return;

    try {
      await api.put(`/financial/${id}`, { status: 'pago' });
      toast({ title: 'Baixa realizada com sucesso!', status: 'success' });
      fetchTransactions();
    } catch (error) {
      toast({ title: 'Erro ao dar baixa', status: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este lançamento?')) return;
    try {
      await api.delete(`/financial/${id}`);
      toast({ title: 'Excluído com sucesso!', status: 'success' });
      fetchTransactions();
    } catch (error) {
      toast({ title: 'Erro ao excluir', status: 'error' });
    }
  };

  const handleCreateCompleteTx = async () => {
    if (!newTx.descricao || !newTx.valor || !newTx.data_vencimento) {
      toast({ title: "Preencha a descrição, valor e vencimento.", status: "warning" });
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post('/financial/full', {
        ...newTx,
        valor: parseFloat(newTx.valor)
      });
      toast({ title: 'Lançamento registrado!', status: 'success' });
      onClose();
      setNewTx({ descricao: '', valor: '', tipo: 'entrada', categoria: '', data_vencimento: '', status: 'pendente', status_nfe: 'pendente' });
      fetchTransactions();
    } catch (error) {
      toast({ title: 'Erro ao salvar', status: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- NOVO: FUNÇÕES DE NF-E ---
  const openNfeModal = (tx) => {
    setSelectedTx(tx);
    setNfeStatusToUpdate(tx.status_nfe || 'pendente');
    setNfeLinkToUpdate(tx.link_nfe || '');
    onNfeOpen();
  };

  const handleSaveNfe = async () => {
    if (!selectedTx) return;
    try {
      await api.put(`/financial/${selectedTx.id}`, { 
          status_nfe: nfeStatusToUpdate,
          link_nfe: nfeStatusToUpdate === 'emitida' ? nfeLinkToUpdate : null
      });
      toast({ title: 'Status da Nota Fiscal atualizado!', status: 'success' });
      onNfeClose();
      fetchTransactions();
    } catch (error) {
      toast({ title: 'Erro ao atualizar NF-e', status: 'error' });
    }
  };

  return (
    <Box p={8}>
      <Flex justify="space-between" align="center" mb={6} direction={{ base: 'column', md: 'row' }} gap={4}>
        <Heading size="lg" color={useColorModeValue("gray.700", "white")}>Contas a Pagar e Receber</Heading>
        <Button leftIcon={<FaPlus />} colorScheme="blue" onClick={onOpen}>Novo Lançamento</Button>
      </Flex>

      <Box bg={bgCard} p={4} borderRadius="lg" shadow="sm" mb={6} border="1px" borderColor={borderColor}>
        <VStack spacing={4}>
            <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4} w="full">
                <FormControl>
                    <FormLabel fontSize="xs" color="gray.500">Mês</FormLabel>
                    <Select bg={inputBg} borderColor={borderColor} value={filters.mes} onChange={(e) => setFilters({...filters, mes: e.target.value})}>
                        <option value="">Todos</option>
                        <option value="1">Janeiro</option><option value="2">Fevereiro</option>
                        <option value="3">Março</option><option value="4">Abril</option>
                        <option value="5">Maio</option><option value="6">Junho</option>
                        <option value="7">Julho</option><option value="8">Agosto</option>
                        <option value="9">Setembro</option><option value="10">Outubro</option>
                        <option value="11">Novembro</option><option value="12">Dezembro</option>
                    </Select>
                </FormControl>
                <FormControl>
                    <FormLabel fontSize="xs" color="gray.500">Ano</FormLabel>
                    <Input type="number" bg={inputBg} borderColor={borderColor} value={filters.ano} onChange={(e) => setFilters({...filters, ano: e.target.value})} />
                </FormControl>
                <FormControl>
                    <FormLabel fontSize="xs" color="gray.500">Tipo</FormLabel>
                    <Select bg={inputBg} borderColor={borderColor} value={filters.tipo} onChange={(e) => setFilters({...filters, tipo: e.target.value})}>
                        <option value="">Entradas e Saídas</option>
                        <option value="entrada">Receitas (Entradas)</option>
                        <option value="saida">Despesas (Saídas)</option>
                    </Select>
                </FormControl>
                <FormControl>
                    <FormLabel fontSize="xs" color="gray.500">Status Financeiro</FormLabel>
                    <Select bg={inputBg} borderColor={borderColor} value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})}>
                        <option value="">Todos</option>
                        <option value="pendente">Pendentes</option>
                        <option value="pago">Pagos/Recebidos</option>
                    </Select>
                </FormControl>
            </SimpleGrid>

            <InputGroup>
                <InputLeftElement pointerEvents="none"><FaSearch color="gray.400" /></InputLeftElement>
                <Input type="text" placeholder="Buscar por data, descrição, categoria ou valor exato..." bg={inputBg} borderColor={borderColor} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
            </InputGroup>
        </VStack>
      </Box>

      {/* TABELA COM A NOVA COLUNA DE NF-E */}
      <Box bg={bgCard} shadow="sm" borderRadius="md" overflow="auto" border="1px" borderColor={borderColor}>
        <Table variant="simple" size="sm">
          <Thead bg={useColorModeValue('gray.50', 'gray.700')}>
            <Tr>
              <Th color={textColor} py={3}>Vencimento</Th>
              <Th color={textColor} py={3}>Descrição</Th>
              <Th color={textColor} py={3}>Categoria</Th>
              <Th color={textColor} py={3}>Tipo</Th>
              <Th color={textColor} py={3} isNumeric>Valor</Th>
              <Th color={textColor} py={3} textAlign="center">Status</Th>
              <Th color={textColor} py={3} textAlign="center">Nota (NF-e)</Th>
              <Th color={textColor} py={3} textAlign="center">Ações</Th>
            </Tr>
          </Thead>
          <Tbody>
            {loading ? (
              <Tr><Td colSpan={8} textAlign="center" py={6}><Spinner color="blue.500" /></Td></Tr>
            ) : filteredTransactions.length === 0 ? (
              <Tr><Td colSpan={8} textAlign="center" py={6} color="gray.500">Nenhum lançamento encontrado.</Td></Tr>
            ) : (
              filteredTransactions.map((t) => (
                <Tr key={t.id} _hover={{ bg: hoverTr }}>
                  <Td py={3} fontWeight="bold" fontSize="sm">
                    {t.data_vencimento ? new Date(t.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}
                  </Td>
                  <Td py={3} fontSize="sm">{t.descricao}</Td>
                  <Td py={3} fontSize="xs">{t.categoria ? <Badge colorScheme="purple" variant="outline">{t.categoria}</Badge> : '-'}</Td>
                  <Td py={3}>
                    <Badge colorScheme={t.tipo === 'entrada' ? 'green' : 'red'} variant="subtle">
                      {t.tipo === 'entrada' ? 'RECEITA' : 'DESPESA'}
                    </Badge>
                  </Td>
                  <Td py={3} isNumeric fontWeight="bold" color={t.tipo === 'entrada' ? 'green.500' : 'red.500'}>
                    R$ {Number(t.valor).toFixed(2)}
                  </Td>
                  <Td py={3} textAlign="center">
                    <Badge colorScheme={t.status === 'pago' ? 'blue' : 'yellow'}>
                      {t.status === 'pago' ? (t.tipo === 'entrada' ? 'RECEBIDO' : 'PAGO') : 'PENDENTE'}
                    </Badge>
                  </Td>

                  {/* NOVO: BOTÃO/SELO DA NF-E */}
                  <Td py={3} textAlign="center">
                    {t.tipo === 'entrada' ? (
                        <Tooltip label="Gerenciar Nota Fiscal">
                            <Badge 
                                as="button"
                                onClick={() => openNfeModal(t)}
                                colorScheme={t.status_nfe === 'emitida' ? 'green' : t.status_nfe === 'dispensada' ? 'gray' : 'red'}
                                cursor="pointer"
                                px={2} py={1} borderRadius="md"
                            >
                                {t.status_nfe === 'emitida' ? 'EMITIDA' : t.status_nfe === 'dispensada' ? 'DISPENSADA' : 'PENDENTE'}
                            </Badge>
                        </Tooltip>
                    ) : (
                        <Text fontSize="xs" color="gray.400">-</Text>
                    )}
                  </Td>

                  <Td py={3} textAlign="center">
                    <HStack justify="center" spacing={2}>
                      {t.status === 'pendente' && (
                        <Tooltip label={t.tipo === 'entrada' ? 'Confirmar Recebimento' : 'Confirmar Pagamento'}>
                          <IconButton icon={<FaCheckCircle />} size="sm" colorScheme="green" variant="ghost" onClick={() => handleDarBaixa(t.id, t.tipo)} />
                        </Tooltip>
                      )}
                      <Tooltip label="Excluir Lançamento">
                        <IconButton icon={<FaTrash />} size="sm" colorScheme="red" variant="ghost" onClick={() => handleDelete(t.id)} />
                      </Tooltip>
                    </HStack>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Box>

      {/* MODAL DE NOVO LANÇAMENTO */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent bg={bgCard} border="1px" borderColor={borderColor}>
          <ModalHeader color={textColor}>Novo Lançamento</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <SimpleGrid columns={2} spacing={4}>
              <FormControl isRequired colSpan={2} gridColumn="span 2">
                <FormLabel color={textColor}>Descrição</FormLabel>
                <Input bg={inputBg} borderColor={borderColor} value={newTx.descricao} onChange={(e) => setNewTx({...newTx, descricao: e.target.value})} placeholder="Ex: Consulta João, Aluguel..." />
              </FormControl>
              <FormControl isRequired>
                <FormLabel color={textColor}>Valor (R$)</FormLabel>
                <Input type="number" step="0.01" bg={inputBg} borderColor={borderColor} value={newTx.valor} onChange={(e) => setNewTx({...newTx, valor: e.target.value})} />
              </FormControl>
              <FormControl isRequired>
                <FormLabel color={textColor}>Vencimento</FormLabel>
                <Input type="date" bg={inputBg} borderColor={borderColor} value={newTx.data_vencimento} onChange={(e) => setNewTx({...newTx, data_vencimento: e.target.value})} />
              </FormControl>
              <FormControl isRequired>
                <FormLabel color={textColor}>Tipo</FormLabel>
                <Select bg={inputBg} borderColor={borderColor} value={newTx.tipo} onChange={(e) => setNewTx({...newTx, tipo: e.target.value})}>
                  <option value="entrada">Receita (Entrada)</option>
                  <option value="saida">Despesa (Saída)</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel color={textColor}>Categoria</FormLabel>
                <Input bg={inputBg} borderColor={borderColor} value={newTx.categoria} onChange={(e) => setNewTx({...newTx, categoria: e.target.value})} placeholder="Ex: Aluguel, Equipamentos..." />
              </FormControl>
              <FormControl>
                <FormLabel color={textColor}>Status Pgto</FormLabel>
                <Select bg={inputBg} borderColor={borderColor} value={newTx.status} onChange={(e) => setNewTx({...newTx, status: e.target.value})}>
                  <option value="pendente">A Pagar/Receber (Pendente)</option>
                  <option value="pago">Já Pago / Recebido</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel color={textColor}>Status NF-e</FormLabel>
                <Select bg={inputBg} borderColor={borderColor} value={newTx.status_nfe} onChange={(e) => setNewTx({...newTx, status_nfe: e.target.value})}>
                  <option value="pendente">Pendente de Emissão</option>
                  <option value="emitida">Já Emitida</option>
                  <option value="dispensada">Dispensada</option>
                </Select>
              </FormControl>
            </SimpleGrid>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>Cancelar</Button>
            <Button colorScheme="blue" onClick={handleCreateCompleteTx} isLoading={isSubmitting}>Salvar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* MODAL DE CONTROLE DE NF-E */}
      <Modal isOpen={isNfeOpen} onClose={onNfeClose} isCentered>
        <ModalOverlay />
        <ModalContent bg={bgCard} border="1px" borderColor={borderColor}>
          <ModalHeader color={textColor}>
            <Flex align="center"><FaFileInvoice style={{ marginRight: '10px' }} /> Controle de Nota Fiscal</Flex>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Text mb={4} fontSize="sm" color="gray.500">
              Atualize o status da nota fiscal para o lançamento: <b>{selectedTx?.descricao}</b> (R$ {selectedTx?.valor})
            </Text>
            <FormControl>
              <FormLabel color={textColor}>Status da NF-e</FormLabel>
              <Select 
                bg={inputBg} borderColor={borderColor} 
                value={nfeStatusToUpdate} 
                onChange={(e) => setNfeStatusToUpdate(e.target.value)}
              >
                <option value="pendente">Pendente de Emissão</option>
                <option value="emitida">Emitida com Sucesso</option>
                <option value="dispensada">Dispensada / Sem Nota</option>
              </Select>
            </FormControl>
            {nfeStatusToUpdate === 'emitida' && (
                <FormControl mt={4}>
                    <FormLabel color={textColor} fontSize="sm">Anotações / Link da Nota (Opcional)</FormLabel>
                    <Input 
                        bg={inputBg} 
                        borderColor={borderColor} 
                        placeholder="Ex: https://nfs... ou nº 1234" 
                        value={nfeLinkToUpdate} // <-- CONECTA O VALOR
                        onChange={(e) => setNfeLinkToUpdate(e.target.value)} // <-- ATUALIZA AO DIGITAR
                    />
                    <Text fontSize="xs" color="gray.400" mt={1}>Apenas para seu controle interno.</Text>
                </FormControl>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onNfeClose}>Cancelar</Button>
            <Button colorScheme="green" onClick={handleSaveNfe}>Salvar Status</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

    </Box>
  );
}