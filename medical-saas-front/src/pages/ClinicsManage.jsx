import { useState, useEffect } from 'react';
import {
  Box, Button, Flex, Heading, Table, Thead, Tbody, Tr, Th, Td,
  IconButton, useDisclosure, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalBody, ModalCloseButton, useToast, VStack, Text, 
  HStack, FormControl, FormLabel, Input, ModalFooter, Divider, useColorModeValue, Select, Tooltip,
  InputGroup, InputRightElement, Badge, InputLeftElement
} from '@chakra-ui/react';
import { FaPlus, FaBuilding, FaUserTie, FaEdit, FaBan, FaCheck, FaEye, FaEyeSlash, FaSearch } from 'react-icons/fa';
import api from '../services/api';

export default function ClinicsManage() {
  const [clinics, setClinics] = useState([]);
  const [planos, setPlanos] = useState([]); 
  const { isOpen, onOpen, onClose } = useDisclosure(); 
  
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // --- NOVO: Estado para a barra de pesquisa ---
  const [searchTerm, setSearchTerm] = useState('');

  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });

  const [formData, setFormData] = useState({
      nome: '', cnpj: '', email_clinica: '', telefone: '', endereco: '', plano_id: '',
      nome_admin: '', email_admin: '', senha_admin: ''
  });

  const toast = useToast();

  const bgCard = useColorModeValue('white', 'gray.800');
  const bgHeader = useColorModeValue('gray.50', 'gray.700');
  const inputBg = useColorModeValue('gray.50', 'gray.700');
  const modalBg = useColorModeValue('white', 'gray.800');
  const hoverTr = useColorModeValue('gray.50', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.200');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const activeColor = useColorModeValue('green.600', 'green.300'); 
  const inactiveColor = useColorModeValue('red.600', 'red.300');

  const formatCNPJ = (value) => {
    return value.replace(/\D/g, '').replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2').substring(0, 18);
  };

  const formatPhone = (value) => {
    return value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4,5})(\d{4})/, '$1-$2').substring(0, 15);
  };

  const fetchClinics = async () => {
    try {
      const response = await api.get('/clinics/');
      setClinics(Array.isArray(response.data) ? response.data : []);
    } catch (error) { console.error("Erro ao buscar clínicas", error); }
  };

  const fetchPlanos = async () => {
    try {
      const response = await api.get('/planos/'); 
      setPlanos(Array.isArray(response.data) ? response.data : []);
    } catch (error) { console.error("Erro ao buscar planos", error); }
  };

  useEffect(() => { 
    fetchClinics(); 
    fetchPlanos(); 
  }, []);

  const getPlanoNome = (plano_id) => {
    const plano = planos.find(p => p.id === plano_id);
    return plano ? plano.nome : 'Nenhum';
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
        direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // --- LÓGICA DE ORDENAÇÃO E BUSCA COMBINADAS ---
  const filteredAndSortedClinics = [...clinics]
    .filter(clinic => {
        // Filtro de Busca (procura no Nome, CNPJ ou E-mail)
        const searchLower = searchTerm.toLowerCase();
        const nome = (clinic.nome || '').toLowerCase();
        const cnpj = (clinic.cnpj || '').toLowerCase();
        const email = (clinic.email_clinica || clinic.email || '').toLowerCase();
        
        return nome.includes(searchLower) || cnpj.includes(searchLower) || email.includes(searchLower);
    })
    .sort((a, b) => {
        // Lógica de Ordenação Original
        let aValue = sortConfig.key === 'pagamento' ? a.is_active : a[sortConfig.key];
        let bValue = sortConfig.key === 'pagamento' ? b.is_active : b[sortConfig.key];

        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();
        
        if (aValue === null || aValue === undefined) aValue = '';
        if (bValue === null || bValue === undefined) bValue = '';

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

  const getSortIcon = (columnName) => {
    if (sortConfig.key === columnName) {
        return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
    }
    return '';
  };

  const handleOpenModal = (clinic = null) => {
      setShowPassword(false);
      if (clinic) {
          setIsEditing(true);
          setEditId(clinic.id);
          setFormData({
              nome: clinic.nome || '', cnpj: clinic.cnpj || '', email_clinica: clinic.email || '', 
              telefone: clinic.telefone || '', endereco: clinic.endereco || '', plano_id: clinic.plano_id || '',
              nome_admin: '', email_admin: '', senha_admin: '' 
          });
      } else {
          setIsEditing(false);
          setEditId(null);
          setFormData({
              nome: '', cnpj: '', email_clinica: '', telefone: '', endereco: '', plano_id: '',
              nome_admin: '', email_admin: '', senha_admin: ''
          });
      }
      onOpen();
  };

  const handleToggleStatus = async (clinic) => {
      const actionText = clinic.is_active ? 'inativar' : 'reativar';
      if (confirm(`Deseja realmente ${actionText} a clínica ${clinic.nome}?`)) {
          try {
              await api.put(`/clinics/${clinic.id}`, { is_active: !clinic.is_active });
              toast({ title: `Clínica ${clinic.is_active ? 'inativada' : 'reativada'}!`, status: 'success' });
              fetchClinics();
          } catch (error) { toast({ title: `Erro ao ${actionText} clínica.`, status: 'error' }); }
      }
  };

  const handleSave = async () => {
    try {
        if (isEditing) {
            const updatePayload = {
                nome: formData.nome, cnpj: formData.cnpj, email_clinica: formData.email_clinica, 
                telefone: formData.telefone, endereco: formData.endereco, plano_id: formData.plano_id || null
            };
            await api.put(`/clinics/${editId}`, updatePayload);
            toast({ title: 'Clínica atualizada com sucesso!', status: 'success' });
        } else {
            if (!formData.nome || !formData.nome_admin || !formData.email_admin || !formData.senha_admin || !formData.plano_id) {
                toast({ title: 'Preencha os campos obrigatórios e selecione o Plano!', status: 'warning' });
                return;
            }
            const payload = { ...formData, plano_id: formData.plano_id || null };
            await api.post('/clinics/', payload);
            toast({ title: 'Clínica e Admin criados com sucesso!', status: 'success' });
        }
        onClose();
        fetchClinics();
    } catch (error) {
        toast({ title: isEditing ? 'Erro ao atualizar.' : 'Erro ao cadastrar.', description: error.response?.data?.detail, status: 'error' });
    }
  };

  return (
    <Box p={8}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg" color={useColorModeValue("gray.700", "white")}>Gerenciar Clínicas</Heading>
        <Button leftIcon={<FaPlus />} colorScheme="blue" onClick={() => handleOpenModal()}>Nova Clínica</Button>
      </Flex>

      {/* --- NOVA BARRA DE BUSCA --- */}
      <Flex mb={6}>
        <InputGroup maxW={{ base: '100%', md: '400px' }}>
            <InputLeftElement pointerEvents="none" children={<FaSearch color="gray.300" />} />
            <Input 
              bg={bgCard} 
              border="1px solid" 
              borderColor={borderColor} 
              placeholder="Buscar clínica por nome, CNPJ..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
        </InputGroup>
      </Flex>

      <Box bg={bgCard} shadow="sm" borderRadius="md" overflow="hidden" border="1px solid" borderColor={borderColor}>
        <Table variant="simple" size="sm">
            <Thead bg={bgHeader}>
            <Tr>
                <Th cursor="pointer" onClick={() => handleSort('id')} color={textColor} py={3} _hover={{ bg: borderColor }}>
                    ID{getSortIcon('id')}
                </Th>
                <Th cursor="pointer" onClick={() => handleSort('nome')} color={textColor} py={3} _hover={{ bg: borderColor }}>
                    Nome da Clínica{getSortIcon('nome')}
                </Th>
                <Th cursor="pointer" onClick={() => handleSort('cnpj')} color={textColor} py={3} _hover={{ bg: borderColor }}>
                    CNPJ{getSortIcon('cnpj')}
                </Th>
                <Th color={textColor} py={3}>Telefone</Th>
                <Th cursor="pointer" onClick={() => handleSort('plano_id')} color={textColor} py={3} _hover={{ bg: borderColor }}>
                    Plano{getSortIcon('plano_id')}
                </Th>
                <Th cursor="pointer" onClick={() => handleSort('pagamento')} color={textColor} py={3} _hover={{ bg: borderColor }}>
                    Pagamento{getSortIcon('pagamento')}
                </Th>
                <Th cursor="pointer" onClick={() => handleSort('is_active')} color={textColor} py={3} _hover={{ bg: borderColor }}>
                    Status{getSortIcon('is_active')}
                </Th>
                <Th color={textColor} py={3} textAlign="center">Ações</Th>
            </Tr>
            </Thead>
            <Tbody>
            {filteredAndSortedClinics.map((c) => (
                <Tr key={c.id} opacity={c.is_active ? 1 : 0.6} _hover={{ bg: hoverTr }} transition="background 0.2s">
                    <Td py={3} fontWeight="bold" fontSize="xs">#{c.id}</Td>
                    <Td py={3} fontWeight="bold" fontSize="xs" color="blue.500">{c.nome}</Td>
                    <Td py={3} fontSize="xs">{c.cnpj || '-'}</Td>
                    <Td py={3} fontSize="xs">{c.telefone || '-'}</Td>
                    <Td py={3} fontSize="xs">
                        <Text px={2} py={1} bg="purple.50" color="purple.700" borderRadius="md" display="inline-block" fontWeight="bold">
                            {getPlanoNome(c.plano_id)}
                        </Text>
                    </Td>
                    <Td py={3}>
                        <Badge colorScheme={c.is_active ? "green" : "red"}>
                            {c.is_active ? 'EM DIA' : 'ATRASADO'}
                        </Badge>
                    </Td>
                    <Td py={3}>
                        <Text fontWeight="extrabold" fontSize="2xs" letterSpacing="wider" color={c.is_active ? activeColor : inactiveColor}>
                            {c.is_active ? 'ATIVA' : 'INATIVA'}
                        </Text>
                    </Td>
                    <Td py={3} textAlign="center">
                        <HStack justify="center" spacing={2}>
                            <Tooltip label="Editar">
                                <IconButton icon={<FaEdit />} size="sm" colorScheme="yellow" variant="ghost" onClick={() => handleOpenModal(c)} />
                            </Tooltip>
                            {c.is_active ? (
                                <Tooltip label="Inativar Clínica (Bloqueia o acesso)">
                                    <IconButton icon={<FaBan />} size="sm" colorScheme="red" variant="ghost" onClick={() => handleToggleStatus(c)} />
                                </Tooltip>
                            ) : (
                                <Tooltip label="Reativar Clínica">
                                    <IconButton icon={<FaCheck />} size="sm" colorScheme="green" variant="ghost" onClick={() => handleToggleStatus(c)} />
                                </Tooltip>
                            )}
                        </HStack>
                    </Td>
                </Tr>
            ))}
            {filteredAndSortedClinics.length === 0 && (
                <Tr><Td colSpan={8} textAlign="center" py={4}>Nenhuma clínica encontrada.</Td></Tr>
            )}
            </Tbody>
        </Table>
      </Box>

      {/* MODAL MÁGICO DE CADASTRO DUPLO / EDIÇÃO */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalOverlay />
        <ModalContent bg={modalBg}>
          <ModalHeader>{isEditing ? 'Editar Clínica' : 'Cadastrar Novo Cliente'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={6} align="stretch">
                
              {/* SESSÃO 1: DADOS DA CLÍNICA */}
              <Box>
                  <Flex align="center" mb={3} color="blue.500">
                      <FaBuilding /> <Text ml={2} fontWeight="bold">1. Dados da Clínica</Text>
                  </Flex>
                  <VStack spacing={3}>
                      <HStack w="full" spacing={4}>
                        <FormControl isRequired>
                            <FormLabel fontSize="sm">Nome da Clínica (Fantasia)</FormLabel>
                            <Input bg={inputBg} borderColor={borderColor} value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} />
                        </FormControl>
                        <FormControl>
                            <FormLabel fontSize="sm">CNPJ</FormLabel>
                            <Input bg={inputBg} borderColor={borderColor} value={formData.cnpj} onChange={(e) => setFormData({...formData, cnpj: formatCNPJ(e.target.value)})} maxLength={18} />
                        </FormControl>
                      </HStack>
                      <HStack w="full" spacing={4}>
                        <FormControl>
                            <FormLabel fontSize="sm">E-mail Comercial</FormLabel>
                            <Input type="email" bg={inputBg} borderColor={borderColor} value={formData.email_clinica} onChange={(e) => setFormData({...formData, email_clinica: e.target.value})} />
                        </FormControl>
                        <FormControl>
                            <FormLabel fontSize="sm">Telefone</FormLabel>
                            <Input bg={inputBg} borderColor={borderColor} value={formData.telefone} onChange={(e) => setFormData({...formData, telefone: formatPhone(e.target.value)})} maxLength={15} placeholder="(00) 00000-0000" />
                        </FormControl>
                      </HStack>

                      <FormControl isRequired>
                          <FormLabel fontSize="sm">Plano de Assinatura</FormLabel>
                          <Select bg={inputBg} borderColor={borderColor} value={formData.plano_id} onChange={(e) => setFormData({...formData, plano_id: parseInt(e.target.value) || ''})}>
                              <option value="">Selecione o plano contratado</option>
                              {planos.map(plano => (
                                  <option key={plano.id} value={plano.id}>
                                      {plano.nome} (R$ {plano.preco_mensal?.toFixed(2)}) - Até {plano.max_usuarios} Usuários
                                  </option>
                              ))}
                          </Select>
                      </FormControl>
                  </VStack>
              </Box>

              {/* SESSÃO 2: ADMIN */}
              {!isEditing && (
                <>
                  <Divider borderColor={borderColor} />
                  <Box>
                      <Flex align="center" mb={3} color="teal.500">
                          <FaUserTie /> <Text ml={2} fontWeight="bold">2. Acesso do Proprietário (Admin)</Text>
                      </Flex>
                      <Text fontSize="xs" color="gray.500" mb={3}>
                          Este será o login principal entregue ao seu cliente. Ele poderá criar outros usuários depois.
                      </Text>
                      <VStack spacing={3}>
                          <FormControl isRequired>
                              <FormLabel fontSize="sm">Nome do Proprietário</FormLabel>
                              <Input bg={inputBg} borderColor={borderColor} value={formData.nome_admin} onChange={(e) => setFormData({...formData, nome_admin: e.target.value})} placeholder="Ex: Dr. Carlos Silva" />
                          </FormControl>
                          <HStack w="full" spacing={4}>
                            <FormControl isRequired>
                                <FormLabel fontSize="sm">E-mail de Login</FormLabel>
                                <Input type="email" bg={inputBg} borderColor={borderColor} value={formData.email_admin} onChange={(e) => setFormData({...formData, email_admin: e.target.value})} placeholder="carlos@clinica.com" />
                            </FormControl>
                            <FormControl isRequired>
                                <FormLabel fontSize="sm">Senha Inicial</FormLabel>
                                <InputGroup>
                                    <Input 
                                        type={showPassword ? 'text' : 'password'} 
                                        bg={inputBg} borderColor={borderColor} 
                                        value={formData.senha_admin} 
                                        onChange={(e) => setFormData({...formData, senha_admin: e.target.value})} 
                                        placeholder="Senha" 
                                    />
                                    <InputRightElement>
                                        <IconButton
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setShowPassword(!showPassword)}
                                            icon={showPassword ? <FaEyeSlash /> : <FaEye />}
                                            aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                                        />
                                    </InputRightElement>
                                </InputGroup>
                            </FormControl>
                          </HStack>
                      </VStack>
                  </Box>
                </>
              )}

            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleSave}>{isEditing ? 'Salvar Alterações' : 'Finalizar Cadastro'}</Button>
            <Button onClick={onClose} variant="ghost">Cancelar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}