import { useState, useEffect } from 'react';
import {
  Box, Button, Flex, Heading, Table, Thead, Tbody, Tr, Th, Td,
  IconButton, useDisclosure, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalBody, ModalCloseButton, useToast, Spinner, VStack, Text, 
  HStack, Badge, FormControl, FormLabel, Input, ModalFooter, Select, useColorModeValue,
  Tooltip
} from '@chakra-ui/react';
import { FaPlus, FaTrash, FaUserTie, FaUserCog, FaUserMd, FaConciergeBell } from 'react-icons/fa';
import api from '../services/api';
import { jwtDecode } from "jwt-decode";

export default function Team() {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { isOpen, onOpen, onClose } = useDisclosure(); 
  
  const [newUser, setNewUser] = useState({ full_name: '', email: '', password: '', role: '' });

  const toast = useToast();
  
  const bgCard = useColorModeValue('white', 'gray.800');
  const bgHeader = useColorModeValue('gray.50', 'gray.700');
  const inputBg = useColorModeValue('gray.50', 'gray.700');
  const modalBg = useColorModeValue('white', 'gray.800');
  const hoverTr = useColorModeValue('gray.50', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.200');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const getLoggedUser = () => {
    const token = localStorage.getItem('medical_token') || localStorage.getItem('token');
    if (token) {
        try { return jwtDecode(token); } catch (e) { return null; }
    }
    return null;
  };

  const loggedUser = getLoggedUser();

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/');
      
      const usersList = Array.isArray(response.data) ? response.data : [];
      
      let staff = usersList.filter(u => u.role !== 'patient' && u.role !== 'paciente');
      
      // A MURALHA DE ISOLAMENTO
      if (loggedUser) {
        if (loggedUser.role === 'superuser') {
            // O Dono do SaaS só vê a sua própria equipe interna
            staff = staff.filter(u => u.role === 'superuser');
        } else {
            // Admin/Recepção só vê quem é da mesma clínica e não vê o Dono do SaaS
            staff = staff.filter(u => 
                u.clinic_id === loggedUser.clinic_id && 
                u.role !== 'superuser'
            );
        }
      }

      setTeam(staff);
    } catch (error) { 
        toast({ title: 'Erro ao carregar equipe.', status: 'error' });
    } finally { 
        setLoading(false); 
    }
  };

  useEffect(() => { fetchTeam(); }, []);

  const handleOpenModal = () => {
      // Define o cargo padrão com base em quem está a criar
      const defaultRole = loggedUser?.role === 'superuser' ? 'superuser' : 'recepcionista';
      setNewUser({ full_name: '', email: '', password: '', role: defaultRole });
      onOpen();
  };

  const handleSave = async () => {
    if (!newUser.full_name || !newUser.email || !newUser.password) {
        toast({ title: 'Preencha todos os campos.', status: 'warning' });
        return;
    }
    
    try {
        setIsSubmitting(true);
        
        const payload = {
            ...newUser,
            clinic_id: loggedUser?.role !== 'superuser' ? loggedUser?.clinic_id : null
        };

        await api.post('/users/', payload);
        toast({ title: 'Membro adicionado com sucesso!', status: 'success' });
        onClose();
        fetchTeam();
    } catch (error) {
        const msg = error.response?.data?.detail || 'Erro ao criar usuário.';
        toast({ title: msg, status: 'error' });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, role) => {
    if (role === 'doctor') {
        toast({ title: 'Atenção', description: 'Médicos devem ser excluídos/inativados pela tela de Profissionais.', status: 'info', duration: 5000 });
        return;
    }

    if (window.confirm('Deseja realmente remover o acesso deste membro da equipe?')) {
        try {
            await api.delete(`/users/${id}`);
            toast({ title: 'Membro removido.', status: 'success' });
            fetchTeam();
        } catch (error) { 
            const msg = error.response?.data?.detail || 'Erro ao remover.';
            toast({ title: msg, status: 'error' }); 
        }
    }
  };

  const getRoleBadge = (role) => {
      switch(role) {
          case 'admin': return <Badge colorScheme="blue"><HStack spacing={1}><FaUserTie/><Text>Admin</Text></HStack></Badge>;
          case 'superuser': return <Badge colorScheme="purple"><HStack spacing={1}><FaUserCog/><Text>Dev SaaS</Text></HStack></Badge>;
          case 'doctor': return <Badge colorScheme="green"><HStack spacing={1}><FaUserMd/><Text>Profissional</Text></HStack></Badge>;
          case 'recepcionista': return <Badge colorScheme="pink"><HStack spacing={1}><FaConciergeBell/><Text>Recepção</Text></HStack></Badge>;
          default: return <Badge colorScheme="gray">{role}</Badge>;
      }
  };

  return (
    <Box p={8}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg" color={useColorModeValue("gray.700", "white")}>
            {loggedUser?.role === 'superuser' ? 'Equipe SaaS (Interna)' : 'Minha Equipe'}
        </Heading>
        <Button leftIcon={<FaPlus />} colorScheme="blue" onClick={handleOpenModal}>Novo Membro</Button>
      </Flex>

      <Box bg={bgCard} shadow="sm" borderRadius="md" overflow="hidden" border="1px solid" borderColor={borderColor}>
        <Table variant="simple"> 
            <Thead bg={bgHeader}>
            <Tr>
                <Th color={textColor} py={4}>Nome</Th>
                <Th color={textColor} py={4}>E-mail (Login)</Th>
                <Th color={textColor} py={4}>Cargo</Th>
                <Th color={textColor} py={4} textAlign="center">Ações</Th>
            </Tr>
            </Thead>
            <Tbody>
            {loading ? (
                <Tr><Td colSpan={4} textAlign="center" py={6}><Spinner color="blue.500" /></Td></Tr>
            ) : (team || []).map((member) => (
                <Tr key={member.id} _hover={{ bg: hoverTr }}>
                    <Td fontWeight="bold" color={textColor}>{member.full_name}</Td>
                    <Td color={textColor}>{member.email}</Td>
                    <Td>{getRoleBadge(member.role)}</Td>
                    <Td textAlign="center">
                        {member.role !== 'doctor' ? (
                            <Tooltip label="Remover Acesso">
                                <IconButton icon={<FaTrash />} size="sm" colorScheme="red" variant="ghost" onClick={() => handleDelete(member.id, member.role)} />
                            </Tooltip>
                        ) : (
                            <Text fontSize="xs" color="gray.400" fontStyle="italic">Gerir em Profissionais</Text>
                        )}
                    </Td>
                </Tr>
            ))}
            {(!team || team.length === 0) && !loading && (
                <Tr><Td colSpan={4} textAlign="center" py={6} color="gray.500">Nenhum membro encontrado.</Td></Tr>
            )}
            </Tbody>
        </Table>
      </Box>

      {/* MODAL NOVO MEMBRO */}
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay />
        <ModalContent bg={modalBg}>
          <ModalHeader color={textColor}>
              {loggedUser?.role === 'superuser' ? 'Cadastrar Membro SaaS' : 'Cadastrar Membro da Equipe'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={4}>
            <VStack spacing={4} align="stretch">
              
              <FormControl isRequired>
                  <FormLabel fontSize="sm" color={textColor}>Nome Completo</FormLabel>
                  <Input bg={inputBg} borderColor={borderColor} value={newUser.full_name} onChange={(e) => setNewUser({...newUser, full_name: e.target.value})} placeholder="Ex: Maria" />
              </FormControl>

              <FormControl isRequired>
                  <FormLabel fontSize="sm" color={textColor}>E-mail de Login</FormLabel>
                  <Input type="email" bg={inputBg} borderColor={borderColor} value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} placeholder="email@dominio.com" />
              </FormControl>

              <FormControl isRequired>
                  <FormLabel fontSize="sm" color={textColor}>Senha de Acesso</FormLabel>
                  <Input type="password" bg={inputBg} borderColor={borderColor} value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} placeholder="******" />
              </FormControl>

              <FormControl isRequired>
                  <FormLabel fontSize="sm" color={textColor}>Cargo</FormLabel>
                  <Select 
                      bg={inputBg} 
                      borderColor={borderColor} 
                      value={newUser.role} 
                      onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  >
                      {loggedUser?.role === 'superuser' ? (
                          <option value="superuser">Superuser</option>
                      ) : (
                          <>
                              <option value="recepcionista">Recepcionista</option>
                              <option value="admin">Administrador da Clínica</option>
                          </>
                      )}
                  </Select>
                  
                  {loggedUser?.role !== 'superuser' && (
                      <Text fontSize="xs" color="gray.500" mt={2}>
                          Nota: Profissionais de saúde devem ser criados no menu "Profissionais" para gerar agenda corretamente.
                      </Text>
                  )}
              </FormControl>

            </VStack>
          </ModalBody>
          <ModalFooter borderTop="1px solid" borderColor={borderColor}>
            <Button variant="ghost" onClick={onClose} mr={3}>Cancelar</Button>
            <Button colorScheme="blue" onClick={handleSave} isLoading={isSubmitting}>Salvar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}