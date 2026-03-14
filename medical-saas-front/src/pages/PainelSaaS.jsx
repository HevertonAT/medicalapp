import { useState, useEffect } from 'react';
import {
  Box, Flex, Heading, SimpleGrid, Stat, StatLabel, StatNumber, StatHelpText,
  Table, Thead, Tbody, Tr, Th, Td, Badge, Button, useToast, Spinner, 
  useColorModeValue, Icon, Text, Menu, MenuButton, MenuList, MenuItem,
  useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, 
  ModalFooter, ModalCloseButton, FormControl, FormLabel, Input, Select, HStack
} from '@chakra-ui/react';
import { FaBuilding, FaDollarSign, FaExclamationTriangle, FaCog, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import api from '../services/api';

export default function PainelSaaS() {
  const [data, setData] = useState({ metrics: {}, clinics: [] });
  const [planos, setPlanos] = useState([]); // <-- NOVO: Estado para os planos dinâmicos
  const [loading, setLoading] = useState(true);
  
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isSaving, setIsSaving] = useState(false);
  const [editingClinic, setEditingClinic] = useState(null);

  const toast = useToast();
  
  const bgCard = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.200');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const inputBg = useColorModeValue('gray.50', 'gray.700');
  const trHoverBg = useColorModeValue('gray.50', 'gray.700'); 
  const theadBg = useColorModeValue('gray.50', 'gray.800');
  const headingColor = useColorModeValue("gray.700", "white");

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      // Busca os dados do painel e a lista de planos ao mesmo tempo
      const [dashRes, planosRes] = await Promise.all([
          api.get('/saas/dashboard'),
          api.get('/planos/')
      ]);
      setData(dashRes.data);
      setPlanos(Array.isArray(planosRes.data) ? planosRes.data : []);
    } catch (error) {
      toast({ title: "Erro ao carregar dados do SaaS", status: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // --- Função para pegar o Nome Bonito do Plano ---
  const getPlanoNome = (plano_id, plano_text) => {
      if (plano_id) {
          const plano = planos.find(p => p.id === plano_id);
          if (plano) return plano.nome;
      }
      return plano_text || 'Plano Básico';
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const sortedClinics = [...data.clinics].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const getSortIcon = (columnName) => {
    if (sortConfig.key !== columnName) return <FaSort color="gray" />;
    return sortConfig.direction === 'asc' ? <FaSortUp color="blue" /> : <FaSortDown color="blue" />;
  };

  const openEditModal = (clinic) => {
    setEditingClinic({
      id: clinic.id,
      nome: clinic.nome,
      plano_id: clinic.plano_id || '', // Usamos o ID agora
      plano: clinic.plano || '',
      valor_mensalidade: clinic.valor_mensalidade || 0,
      dia_vencimento: clinic.dia_vencimento || 10,
      status_assinatura: clinic.status_assinatura || 'ativa'
    });
    onOpen();
  };

  const handlePlanChange = (e) => {
    const selectedId = parseInt(e.target.value);
    const selectedPlan = planos.find(p => p.id === selectedId);
    
    setEditingClinic({
        ...editingClinic,
        plano_id: selectedId,
        plano: selectedPlan ? selectedPlan.nome : editingClinic.plano, // Atualiza o nome texto também
        valor_mensalidade: selectedPlan ? selectedPlan.preco_mensal : editingClinic.valor_mensalidade
    });
  };

  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      // Usamos a rota de atualizar clínica principal para aceitar todos os campos, incluindo plano_id
      await api.put(`/clinics/${editingClinic.id}`, {
        plano: editingClinic.plano,
        plano_id: editingClinic.plano_id,
        valor_mensalidade: parseFloat(editingClinic.valor_mensalidade),
        dia_vencimento: parseInt(editingClinic.dia_vencimento),
        status_assinatura: editingClinic.status_assinatura
      });
      toast({ title: 'Assinatura atualizada com sucesso!', status: 'success' });
      fetchDashboard();
      onClose();
    } catch (error) {
      toast({ title: "Erro ao atualizar", status: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box p={8}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg" color={headingColor}>Matriz SaaS (Administração)</Heading>
      </Flex>

      {loading ? <Flex justify="center" py={10}><Spinner size="xl" color="purple.500" /></Flex> : (
        <>
          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6} mb={8}>
            <Stat bg={bgCard} p={5} shadow="sm" borderRadius="lg" borderLeft="4px solid" borderColor="purple.500">
              <Flex justify="space-between" align="center">
                <Box>
                    <StatLabel color="gray.500" fontWeight="bold">MRR (Receita Recorrente)</StatLabel>
                    <StatNumber fontSize="3xl" color="purple.600">R$ {data.metrics.mrr ? data.metrics.mrr.toFixed(2) : '0.00'}</StatNumber>
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

          <Box bg={bgCard} shadow="sm" borderRadius="md" overflow="auto" border="1px" borderColor={borderColor}>
            <Box p={4} borderBottom="1px" borderColor={borderColor} bg={theadBg}>
                <Text fontWeight="bold" color={textColor}>Gestão de Assinaturas</Text>
            </Box>
            <Table variant="simple" style={{ userSelect: 'none' }}>
              <Thead>
                <Tr>
                  <Th cursor="pointer" onClick={() => handleSort('id')}><HStack><Text>ID</Text> {getSortIcon('id')}</HStack></Th>
                  <Th cursor="pointer" onClick={() => handleSort('nome')}><HStack><Text>CLÍNICA</Text> {getSortIcon('nome')}</HStack></Th>
                  <Th cursor="pointer" onClick={() => handleSort('plano')}><HStack><Text>PLANO</Text> {getSortIcon('plano')}</HStack></Th>
                  <Th isNumeric cursor="pointer" onClick={() => handleSort('valor_mensalidade')}><HStack justify="flex-end"><Text>MENSALIDADE</Text> {getSortIcon('valor_mensalidade')}</HStack></Th>
                  <Th textAlign="center" cursor="pointer" onClick={() => handleSort('dia_vencimento')}><HStack justify="center"><Text>VENCIMENTO</Text> {getSortIcon('dia_vencimento')}</HStack></Th>
                  <Th textAlign="center" cursor="pointer" onClick={() => handleSort('status_assinatura')}><HStack justify="center"><Text>STATUS</Text> {getSortIcon('status_assinatura')}</HStack></Th>
                  <Th textAlign="center">AÇÕES</Th>
                </Tr>
              </Thead>
              <Tbody>
                {sortedClinics.map((clinic) => (
                  <Tr key={clinic.id} _hover={{ bg: trHoverBg }}> 
                    <Td fontWeight="bold" color="gray.500">#{clinic.id}</Td>
                    <Td fontWeight="bold">{clinic.nome}</Td>
                    <Td>
                        {/* A MÁGICA VISUAL ACONTECE AQUI */}
                        <Badge colorScheme="purple" variant="outline" px={2} py={1}>
                            {getPlanoNome(clinic.plano_id, clinic.plano).toUpperCase()}
                        </Badge>
                    </Td>
                    <Td isNumeric fontWeight="bold" color="green.500">
                        R$ {clinic.valor_mensalidade ? clinic.valor_mensalidade.toFixed(2) : '99.00'}
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
                        <HStack justify="center">
                            <Button size="xs" leftIcon={<FaCog />} colorScheme="blue" variant="outline" onClick={() => openEditModal(clinic)}>
                                Editar
                            </Button>
                        </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </>
      )}

      {/* MODAL DE EDIÇÃO DE ASSINATURA */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent bg={bgCard} border="1px" borderColor={borderColor}>
          <ModalHeader color={textColor}>Editar Assinatura: {editingClinic?.nome}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <SimpleGrid columns={2} spacing={4}>
                <FormControl isRequired colSpan={2}>
                    <FormLabel color={textColor}>Plano Contratado</FormLabel>
                    <Select bg={inputBg} borderColor={borderColor} value={editingClinic?.plano_id || ''} onChange={handlePlanChange}>
                        <option value="">Selecione o plano...</option>
                        {planos.map(plano => (
                            <option key={plano.id} value={plano.id}>{plano.nome}</option>
                        ))}
                    </Select>
                </FormControl>
                <FormControl isRequired>
                    <FormLabel color={textColor}>Mensalidade (R$)</FormLabel>
                    <Input type="number" step="0.01" bg={inputBg} borderColor={borderColor} value={editingClinic?.valor_mensalidade || ''} onChange={(e) => setEditingClinic({...editingClinic, valor_mensalidade: e.target.value})} />
                </FormControl>
                <FormControl isRequired>
                    <FormLabel color={textColor}>Dia de Vencimento</FormLabel>
                    <Input type="number" min="1" max="31" bg={inputBg} borderColor={borderColor} value={editingClinic?.dia_vencimento || ''} onChange={(e) => setEditingClinic({...editingClinic, dia_vencimento: e.target.value})} />
                </FormControl>
                <FormControl colSpan={2} gridColumn="span 2">
                    <FormLabel color={textColor}>Status da Assinatura</FormLabel>
                    <Select bg={inputBg} borderColor={borderColor} value={editingClinic?.status_assinatura || ''} onChange={(e) => setEditingClinic({...editingClinic, status_assinatura: e.target.value})}>
                        <option value="ativa">Pagamento em Dia (Ativa)</option>
                        <option value="inadimplente">Pagamento Atrasado (Inadimplente)</option>
                        <option value="bloqueada">Sistema Bloqueado</option>
                    </Select>
                </FormControl>
            </SimpleGrid>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>Cancelar</Button>
            <Button colorScheme="blue" onClick={handleSaveEdit} isLoading={isSaving}>Salvar Alterações</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

    </Box>
  );
}