import { useState, useEffect } from 'react';
import {
  Box, Flex, Heading, Button, Table, Thead, Tbody, Tr, Th, Td,
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
    data_vencimento: '', status: 'pendente', status_nfe: 'pendente', link_nfe: '',
    forma_pagamento: '', parcelas: 1
  });

  // Controle do Modal de NF-e
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
    const tempoEspera = setTimeout(() => {
      fetchTransactions();
    }, 600);
    
    return () => clearTimeout(tempoEspera);
  }, [filters]); 

  // --- TRAVA DE ANO MÁXIMO (Hoje + 4 anos) ---
  const maxYear = new Date().getFullYear() + 4;
  const maxDateLimit = `${maxYear}-12-31`;

  const enforceDateLimit = (dateString) => {
      if (!dateString) return dateString;
      const partes = dateString.split('-');
      // Corta para não passar de 4 dígitos no ano
      if (partes[0].length > 4) {
          partes[0] = partes[0].slice(0, 4);
      }
      // Se o ano for maior que a data atual + 4, ele trava no ano máximo
      if (parseInt(partes[0]) > maxYear) {
          partes[0] = maxYear.toString();
      }
      return partes.join('-');
  };

  // --- BLINDAGEM DE TITÂNIO ATUALIZADA (Lê português e inglês) ---
  const filteredTransactions = (transactions || []).filter((t) => {
    if (!searchTerm) return true; 
    const termo = searchTerm.toLowerCase();
    
    // Fallbacks para propriedades que podem vir do back-end em inglês
    const dataVenc = t.data_vencimento || t.due_date;
    const desc = (t.descricao || t.description || '').toLowerCase();
    const cat = (t.categoria || t.category || '').toLowerCase();
    
    const dataFormatada = dataVenc ? new Date(dataVenc + 'T00:00:00').toLocaleDateString('pt-BR') : '';
    const valor = t.valor?.toString() || '';

    return (
      desc.includes(termo) || cat.includes(termo) ||
      valor.includes(termo) || dataFormatada.includes(termo)
    );
  });

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
      // Injetamos as variáveis em inglês no payload também para garantir que o back-end capture
      await api.post('/financial/full', {
        ...newTx,
        description: newTx.descricao,
        category: newTx.categoria,
        due_date: newTx.data_vencimento,
        valor: parseFloat(newTx.valor),
        link_nfe: newTx.status_nfe === 'emitida' ? newTx.link_nfe : null,
        parcelas: newTx.forma_pagamento === 'Cartão de Crédito' ? parseInt(newTx.parcelas) : 1
      });
      
      toast({ title: 'Lançamento registrado!', status: 'success' });
      onClose();
      setNewTx({ 
          descricao: '', valor: '', tipo: 'entrada', categoria: '', data_vencimento: '', 
          status: 'pendente', status_nfe: 'pendente', link_nfe: '', forma_pagamento: '', parcelas: 1 
      });
      fetchTransactions();
    } catch (error) {
      toast({ title: 'Erro ao salvar', status: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openNfeModal = (tx) => {
    setSelectedTx(tx);
    setNfeStatusToUpdate(tx.status_nfe || 'pendente');
    setNfeLinkToUpdate(tx.link_nfe || '');
    onNfeOpen();
  };

  const handleSaveNfe = async () => {
    if (!selectedTx) return;
    try {
      await api.patch(`/financial/${selectedTx.id}/nota`, { 
          status_nota: nfeStatusToUpdate,
          numero_nota: nfeStatusToUpdate === 'emitida' ? nfeLinkToUpdate : null
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
                    <Input 
                        type="number" 
                        bg={inputBg} 
                        borderColor={borderColor} 
                        value={filters.ano} 
                        onChange={(e) => {
                            // Trava de 4 dígitos!
                            const anoLimitado = e.target.value.slice(0, 4);
                            setFilters({...filters, ano: anoLimitado});
                        }} 
                    />
                </FormControl>
                <FormControl>
                    <FormLabel fontSize="xs" color="gray.500">Tipo</FormLabel>
                    <Select bg={inputBg} borderColor={borderColor} value={filters.tipo} onChange={(e) => setFilters({...filters, tipo: e.target.value})}>
                        <option value="">Todos</option>
                        <option value="entrada">Receitas (Entradas)</option>
                        <option value="saida">Despesas (Saídas)</option>
                    </Select>
                </FormControl>
                <FormControl>
                    <FormLabel fontSize="xs" color="gray.500">Status Financeiro</FormLabel>
                    <Select bg={inputBg} borderColor={borderColor} value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})}>
                        <option value="">Todos</option>
                        <option value="pendente">Em Aberto</option>
                        <option value="pago">Finalizados</option>
                    </Select>
                </FormControl>
            </SimpleGrid>

            <InputGroup>
                <InputLeftElement pointerEvents="none"><FaSearch color="gray.400" /></InputLeftElement>
                <Input type="text" placeholder="Buscar por data, descrição, categoria ou valor exato..." bg={inputBg} borderColor={borderColor} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
            </InputGroup>
        </VStack>
      </Box>

      {/* TABELA DE LANÇAMENTOS */}
      <Box bg={bgCard} shadow="sm" borderRadius="md" overflow="auto" border="1px" borderColor={borderColor}>
        <Table variant="simple" size="sm">
          <Thead bg={useColorModeValue('gray.50', 'gray.700')}>
            <Tr>
              <Th color={textColor} py={3}>Vencimento</Th>
              <Th color={textColor} py={3}>Descrição</Th>
              <Th color={textColor} py={3}>Categoria</Th>
              <Th color={textColor} py={3}>Tipo</Th>
              <Th color={textColor} py={3} isNumeric>Valor</Th>
              <Th color={textColor} py={3} textAlign="center">Forma</Th>
              <Th color={textColor} py={3} textAlign="center">Status</Th>
              <Th color={textColor} py={3} textAlign="center">Nota (NF-e)</Th>
              <Th color={textColor} py={3} textAlign="center">Ações</Th>
            </Tr>
          </Thead>
          <Tbody>
            {loading ? (
              <Tr><Td colSpan={9} textAlign="center" py={6}><Spinner color="blue.500" /></Td></Tr>
            ) : filteredTransactions?.length === 0 ? (
              <Tr><Td colSpan={9} textAlign="center" py={6} color="gray.500">Nenhum lançamento encontrado.</Td></Tr>
            ) : (
              filteredTransactions?.map((t) => {
                // Preparando as variáveis de forma resiliente
                const dataVencimentoReal = t.data_vencimento || t.due_date;
                const descricaoReal = t.descricao || t.description;
                const categoriaReal = t.categoria || t.category;

                return (
                  <Tr key={t.id} _hover={{ bg: hoverTr }}>
                    <Td py={3} fontSize="sm" color={textColor}>
                      {dataVencimentoReal ? new Date(dataVencimentoReal + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}
                    </Td>
                    <Td py={3} fontSize="sm" color={textColor}>{descricaoReal || '-'}</Td>
                    <Td py={3} fontSize="sm" color={textColor}>{categoriaReal || '-'}</Td>
                    <Td py={3} fontSize="sm" color={textColor}>{t.tipo === 'entrada' ? 'Receita' : 'Despesa'}</Td>
                    
                    <Td py={3} isNumeric fontWeight="bold" color={t.tipo === 'entrada' ? 'green.500' : 'red.500'}>
                      R$ {Number(t.valor).toFixed(2)}
                    </Td>
                    
                    <Td py={3} textAlign="center" fontSize="sm" color={textColor}>
                      {t.forma_pagamento ? `${t.forma_pagamento}${t.forma_pagamento === 'Cartão de Crédito' && t.parcelas > 1 ? ` (${t.parcelas}x)` : ''}` : '-'}
                    </Td>

                    <Td py={3} textAlign="center" fontSize="sm" color={textColor}>
                      {t.status === 'pago' ? (t.tipo === 'entrada' ? 'Recebido' : 'Pago') : (t.tipo === 'entrada' ? 'A Receber' : 'A Pagar')}
                    </Td>

                    <Td py={3} textAlign="center">
                      {t.tipo === 'entrada' ? (
                          <Tooltip label="Clique para Gerenciar Nota Fiscal">
                              <Text 
                                  as="span"
                                  onClick={() => openNfeModal(t)}
                                  cursor="pointer"
                                  fontSize="sm"
                                  color={t.status_nfe === 'emitida' ? 'blue.500' : textColor}
                                  _hover={{ textDecoration: 'underline', color: 'blue.400' }}
                              >
                                  {t.status_nfe === 'emitida' ? 'Emitida' : t.status_nfe === 'dispensada' ? 'Dispensada' : 'Aguardando'}
                              </Text>
                          </Tooltip>
                      ) : (
                          <Text fontSize="sm" color="gray.400">-</Text>
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
                );
              })
            )}
          </Tbody>
        </Table>
      </Box>

      {/* MODAL DE NOVO LANÇAMENTO */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
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
                <FormLabel color={textColor}>Valor Total (R$)</FormLabel>
                <Input type="number" step="0.01" bg={inputBg} borderColor={borderColor} value={newTx.valor} onChange={(e) => setNewTx({...newTx, valor: e.target.value})} />
              </FormControl>
              <FormControl isRequired>
                <FormLabel color={textColor}>Vencimento Inicial</FormLabel>
                <Input 
                    type="date" 
                    max={maxDateLimit} // Nova trava nativa do navegador
                    bg={inputBg} 
                    borderColor={borderColor} 
                    value={newTx.data_vencimento} 
                    onChange={(e) => setNewTx({...newTx, data_vencimento: enforceDateLimit(e.target.value)})} 
                />
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
                <Input bg={inputBg} borderColor={borderColor} value={newTx.categoria} onChange={(e) => setNewTx({...newTx, categoria: e.target.value})} placeholder="Ex: Aluguel, Consultas..." />
              </FormControl>
              
              <FormControl>
                <FormLabel color={textColor}>Forma de Pagamento</FormLabel>
                <Select bg={inputBg} borderColor={borderColor} value={newTx.forma_pagamento} onChange={(e) => setNewTx({...newTx, forma_pagamento: e.target.value, parcelas: 1})}>
                  <option value="">Não Informada</option>
                  <option value="PIX">PIX</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Cartão de Débito">Cartão de Débito</option>
                  <option value="Dinheiro">Dinheiro (Espécie)</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Transferência">Transferência Bancária</option>
                </Select>
              </FormControl>

              {newTx.forma_pagamento === 'Cartão de Crédito' && (
                  <FormControl>
                    <FormLabel color={textColor}>Parcelamento</FormLabel>
                    <Select bg={inputBg} borderColor={borderColor} value={newTx.parcelas} onChange={(e) => setNewTx({...newTx, parcelas: e.target.value})}>
                        {[...Array(12)].map((_, i) => (
                            <option key={i+1} value={i+1}>{i+1}x</option>
                        ))}
                    </Select>
                  </FormControl>
              )}
              {newTx.forma_pagamento !== 'Cartão de Crédito' && (
                  <Box></Box> 
              )}

              <FormControl>
                <FormLabel color={textColor}>Status Pagamento</FormLabel>
                <Select bg={inputBg} borderColor={borderColor} value={newTx.status} onChange={(e) => setNewTx({...newTx, status: e.target.value})}>
                  <option value="pendente">{newTx.tipo === 'entrada' ? 'A Receber' : 'A Pagar'}</option>
                  <option value="pago">{newTx.tipo === 'entrada' ? 'Já Recebido' : 'Já Pago'}</option>
                </Select>
              </FormControl>
              
              <FormControl>
                <FormLabel color={textColor}>Status NF-e</FormLabel>
                <Select bg={inputBg} borderColor={borderColor} value={newTx.status_nfe} onChange={(e) => setNewTx({...newTx, status_nfe: e.target.value, link_nfe: ''})}>
                  <option value="pendente">Aguardando Emissão</option>
                  <option value="emitida">Já Emitida</option>
                  <option value="dispensada">Dispensada</option>
                </Select>
              </FormControl>

              {newTx.status_nfe === 'emitida' && (
                <FormControl colSpan={2} gridColumn="span 2">
                  <FormLabel color={textColor} fontSize="sm">Anotações / Link ou Número da Nota (Opcional)</FormLabel>
                  <Input bg={inputBg} borderColor={borderColor} placeholder="Ex: https://nfs... ou nº 1234" value={newTx.link_nfe} onChange={(e) => setNewTx({...newTx, link_nfe: e.target.value})} />
                </FormControl>
              )}
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
              Atualize o status da nota fiscal para o lançamento: <b>{selectedTx?.descricao || selectedTx?.description}</b> (R$ {selectedTx?.valor})
            </Text>
            <FormControl>
              <FormLabel color={textColor}>Status da NF-e</FormLabel>
              <Select bg={inputBg} borderColor={borderColor} value={nfeStatusToUpdate} onChange={(e) => setNfeStatusToUpdate(e.target.value)}>
                <option value="pendente">Aguardando Emissão</option>
                <option value="emitida">Emitida com Sucesso</option>
                <option value="dispensada">Dispensada (Sem Nota)</option>
              </Select>
            </FormControl>
            {nfeStatusToUpdate === 'emitida' && (
                <FormControl mt={4}>
                    <FormLabel color={textColor} fontSize="sm">Anotações / Link da Nota (Opcional)</FormLabel>
                    <Input bg={inputBg} borderColor={borderColor} placeholder="Ex: https://nfs... ou nº 1234" value={nfeLinkToUpdate} onChange={(e) => setNfeLinkToUpdate(e.target.value)} />
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