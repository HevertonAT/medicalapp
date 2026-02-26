import { useState, useEffect } from 'react';
import {
  Box, Button, Flex, Heading, Table, Thead, Tbody, Tr, Th, Td,
  IconButton, useDisclosure, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalBody, ModalCloseButton, useToast, VStack, Text, 
  HStack, FormControl, FormLabel, Input, ModalFooter, Divider, useColorModeValue
} from '@chakra-ui/react';
import { FaPlus, FaBuilding, FaUserTie } from 'react-icons/fa';
import api from '../services/api';

export default function ClinicsManage() {
  const [clinics, setClinics] = useState([]);
  const { isOpen, onOpen, onClose } = useDisclosure(); 
  
  // O Estado ÚNICO que guarda os dados da Clínica e do Admin
  const [formData, setFormData] = useState({
      nome: '', cnpj: '', email_clinica: '', telefone: '', endereco: '',
      nome_admin: '', email_admin: '', senha_admin: ''
  });

  const toast = useToast();

  // Cores Dinâmicas
  const bgCard = useColorModeValue('white', 'gray.800');
  const bgHeader = useColorModeValue('gray.50', 'gray.700');
  const inputBg = useColorModeValue('gray.50', 'gray.700');
  const modalBg = useColorModeValue('white', 'gray.800');
  const hoverTr = useColorModeValue('gray.50', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.200');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const activeColor = useColorModeValue('green.600', 'green.300'); 
  const inactiveColor = useColorModeValue('red.600', 'red.300');

  // Máscara Simples de CNPJ
  const formatCNPJ = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .substring(0, 18);
  };

  const fetchClinics = async () => {
    try {
      const response = await api.get('/clinicas/');
      setClinics(response.data);
    } catch (error) { 
        console.error("Erro ao buscar clínicas", error); 
    }
  };

  useEffect(() => { fetchClinics(); }, []);

  const handleSave = async () => {
    if (!formData.nome || !formData.nome_admin || !formData.email_admin || !formData.senha_admin) {
        toast({ title: 'Preencha os campos obrigatórios!', status: 'warning' });
        return;
    }
    
    try {
        await api.post('/clinicas/', formData);
        
        toast({ title: 'Clínica e Admin criados com sucesso!', status: 'success' });
        onClose();
        fetchClinics();
        
        // Limpa o formulário
        setFormData({
            nome: '', cnpj: '', email_clinica: '', telefone: '', endereco: '',
            nome_admin: '', email_admin: '', senha_admin: ''
        });
    } catch (error) {
        toast({ 
            title: 'Erro ao cadastrar.', 
            description: error.response?.data?.detail || 'Verifique se o CNPJ ou E-mail já existem.', 
            status: 'error' 
        });
    }
  };

  return (
    <Box p={8}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg" color={useColorModeValue("gray.700", "white")}>Gerenciar Clínicas (SaaS)</Heading>
        <Button leftIcon={<FaPlus />} colorScheme="blue" onClick={onOpen}>Nova Clínica</Button>
      </Flex>

      <Box bg={bgCard} shadow="sm" borderRadius="md" overflow="hidden" border="1px solid" borderColor={borderColor}>
        <Table variant="simple" size="sm">
            <Thead bg={bgHeader}>
            <Tr>
                <Th color={textColor} py={3}>ID</Th>
                <Th color={textColor} py={3}>Nome da Clínica</Th>
                <Th color={textColor} py={3}>CNPJ</Th>
                <Th color={textColor} py={3}>E-mail</Th>
                <Th color={textColor} py={3}>Status</Th>
            </Tr>
            </Thead>
            <Tbody>
            {clinics.map((c) => (
                <Tr key={c.id} _hover={{ bg: hoverTr }}>
                    <Td py={3} fontWeight="bold" fontSize="xs">#{c.id}</Td>
                    <Td py={3} fontWeight="bold" fontSize="xs" color="blue.500">{c.nome}</Td>
                    <Td py={3} fontSize="xs">{c.cnpj || '-'}</Td>
                    <Td py={3} fontSize="xs">{c.email || '-'}</Td>
                    <Td py={3}>
                        <Text fontWeight="extrabold" fontSize="2xs" letterSpacing="wider" color={c.is_active ? activeColor : inactiveColor}>
                            {c.is_active ? 'ATIVA' : 'INATIVA'}
                        </Text>
                    </Td>
                </Tr>
            ))}
            {clinics.length === 0 && (
                <Tr><Td colSpan={5} textAlign="center" py={4}>Nenhuma clínica cadastrada.</Td></Tr>
            )}
            </Tbody>
        </Table>
      </Box>

      {/* MODAL MÁGICO DE CADASTRO DUPLO */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalOverlay />
        <ModalContent bg={modalBg}>
          <ModalHeader>Cadastrar Novo Cliente (Clínica)</ModalHeader>
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
                            <Input bg={inputBg} borderColor={borderColor} value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} placeholder="Ex: Clínica Saúde & Cia" />
                        </FormControl>
                        <FormControl>
                            <FormLabel fontSize="sm">CNPJ</FormLabel>
                            <Input bg={inputBg} borderColor={borderColor} value={formData.cnpj} onChange={(e) => setFormData({...formData, cnpj: formatCNPJ(e.target.value)})} placeholder="00.000.000/0001-00" maxLength={18} />
                        </FormControl>
                      </HStack>
                      <HStack w="full" spacing={4}>
                        <FormControl>
                            <FormLabel fontSize="sm">E-mail Comercial</FormLabel>
                            <Input type="email" bg={inputBg} borderColor={borderColor} value={formData.email_clinica} onChange={(e) => setFormData({...formData, email_clinica: e.target.value})} placeholder="contato@clinica.com" />
                        </FormControl>
                        <FormControl>
                            <FormLabel fontSize="sm">Telefone</FormLabel>
                            <Input bg={inputBg} borderColor={borderColor} value={formData.telefone} onChange={(e) => setFormData({...formData, telefone: e.target.value})} placeholder="(00) 0000-0000" />
                        </FormControl>
                      </HStack>
                  </VStack>
              </Box>

              <Divider borderColor={borderColor} />

              {/* SESSÃO 2: ADMIN */}
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
                            <Input bg={inputBg} borderColor={borderColor} value={formData.senha_admin} onChange={(e) => setFormData({...formData, senha_admin: e.target.value})} placeholder="Senha forte" />
                        </FormControl>
                      </HStack>
                  </VStack>
              </Box>

            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleSave}>Finalizar Cadastro</Button>
            <Button onClick={onClose} variant="ghost">Cancelar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}