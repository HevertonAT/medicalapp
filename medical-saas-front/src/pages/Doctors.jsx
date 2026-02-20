import { useState, useEffect } from 'react';
import {
  Box, Button, Flex, Heading, Table, Thead, Tbody, Tr, Th, Td,
  IconButton, useDisclosure, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalBody, ModalCloseButton, FormControl, FormLabel,
  Input, ModalFooter, useToast, Spinner, Text, HStack, VStack,
  useColorModeValue, Tooltip, Badge, Select, Divider, SimpleGrid
} from '@chakra-ui/react';
import { FaPlus, FaEdit, FaBan, FaCheck } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { MASTER_SPECIALTIES } from '../services/specialtyService';

// IMPORTAÇÃO JÁ PRESENTE NO SEU ARQUIVO
import AgendaConfigFields from '../components/profissionais/AgendaConfigFields';

export default function Doctors() {
  // --- ESTADOS EXISTENTES ---
  const [doctors, setDoctors] = useState([]);
  const [rules, setRules] = useState([]); 
  const [loading, setLoading] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [currentDoctor, setCurrentDoctor] = useState({ 
    id: '', nome: '', especialidade: '', crm: '', email: '', senha: '' 
  });
  const [isEditing, setIsEditing] = useState(false);
  const [filter, setFilter] = useState('ativos');

  // --- 1. NOVO ESTADO: CONFIGURAÇÃO DE AGENDA ---
  const initialAgendaConfig = {
    seg: { ativo: true, inicio: "08:00", fim: "18:00" },
    ter: { ativo: true, inicio: "08:00", fim: "18:00" },
    qua: { ativo: true, inicio: "08:00", fim: "18:00" },
    qui: { ativo: true, inicio: "08:00", fim: "18:00" },
    sex: { ativo: true, inicio: "08:00", fim: "18:00" },
    sab: { ativo: false, inicio: "08:00", fim: "12:00" },
    dom: { ativo: false, inicio: "08:00", fim: "12:00" },
    intervalo: 30 
  };
  const [agendaConfig, setAgendaConfig] = useState(initialAgendaConfig);

  const toast = useToast();

  // CORES DO TEMA
  const bgCard = useColorModeValue('white', 'gray.800');
  const bgHeader = useColorModeValue('gray.50', 'gray.700');
  const inputBg = useColorModeValue('gray.50', 'gray.700');
  const modalBg = useColorModeValue('white', 'gray.800');
  const hoverTr = useColorModeValue('gray.50', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.200');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headingColor = useColorModeValue('gray.700', 'white');
  const activeColor = useColorModeValue('green.600', 'green.300');
  const inactiveColor = useColorModeValue('red.600', 'red.300');
  const jsonBg = useColorModeValue('gray.100', 'gray.900'); 

  // --- FUNÇÕES DE BUSCA ---
  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const response = await api.get('/doctors/');
      setDoctors(response.data);
    } catch (error) {
      toast({ title: 'Erro ao carregar profissionais.', status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchRules = async () => {
    try {
      const response = await api.get('/specialties/rules/');
      setRules(response.data || []);
    } catch (e) { console.log('Regras não carregadas'); }
  };

  useEffect(() => { 
    fetchDoctors(); 
    fetchRules();
  }, []);

  // --- 2. AJUSTE: SALVAR COM CONFIGURAÇÃO DE AGENDA ---
  const handleSave = async () => {
    try {
      const payload = {
        nome: currentDoctor.nome,
        especialidade: currentDoctor.especialidade,
        crm: currentDoctor.crm,
        // Envia a configuração da agenda no payload
        agenda_config: agendaConfig 
      };

      if (isEditing && currentDoctor.id) {
        await api.put(`/doctors/${currentDoctor.id}`, payload);
        toast({ title: 'Profissional e Agenda atualizados!', status: 'success' });
      } else {
        if (!currentDoctor.email || !currentDoctor.senha) {
          toast({ title: 'Preencha o e-mail e a senha de acesso.', status: 'warning' });
          return;
        }
        
        const postPayload = {
          ...payload,
          email: currentDoctor.email,
          senha: currentDoctor.senha
        };
        
        await api.post('/doctors/', postPayload);
        toast({ title: 'Profissional criado com agenda configurada!', status: 'success' });
      }
      onClose();
      fetchDoctors();
    } catch (error) {
      const msg = error.response?.data?.detail || 'Erro ao salvar.';
      toast({ title: msg, status: 'error' });
    }
  };

  // --- 3. AJUSTE: ABRIR MODAL CARREGANDO A AGENDA ---
  const openModal = (doctor = null) => {
    fetchRules();
    if (doctor) {
      setCurrentDoctor({ ...doctor, email: '', senha: '' });
      // Se o médico já tiver agenda salva, carrega ela; senão, usa a padrão
      setAgendaConfig(doctor.agenda_config || initialAgendaConfig);
      setIsEditing(true);
    } else {
      setCurrentDoctor({ id: '', nome: '', especialidade: '', crm: '', email: '', senha: '' });
      setAgendaConfig(initialAgendaConfig);
      setIsEditing(false);
    }
    onOpen();
  };

  const filteredDoctors = doctors.filter(doc => {
    if (filter === 'ativos') return doc.ativo === true;
    if (filter === 'inativos') return doc.ativo === false;
    return true;
  });

  const handleInactivate = async (id) => {
    if (!confirm('Inativar este profissional?')) return;
    try {
      await api.delete(`/doctors/${id}`);
      toast({ title: 'Inativado.', status: 'warning' });
      fetchDoctors();
    } catch (error) { toast({ title: 'Erro ao inativar.', status: 'error' }); }
  };

  const handleReactivate = async (id) => {
    if (!confirm('Reativar este profissional?')) return;
    try {
      await api.patch(`/doctors/${id}/reactivate`);
      toast({ title: 'Profissional reativado!', status: 'success' });
      fetchDoctors();
    } catch (error) { toast({ title: 'Erro ao reativar.', status: 'error' }); }
  };

  const linkedRule = (rules || []).find(r => r.specialty === currentDoctor.especialidade);

  return (
    <Box p={8}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg" color={headingColor}>Profissionais</Heading>
        <Button leftIcon={<FaPlus />} colorScheme="blue" onClick={() => openModal()}>Novo</Button>
      </Flex>

      <HStack mb={4} spacing={4}>
        <Button size="sm" variant={filter === 'todos' ? 'solid' : 'outline'} colorScheme="blue" onClick={() => setFilter('todos')}>Todos</Button>
        <Button size="sm" variant={filter === 'ativos' ? 'solid' : 'outline'} colorScheme="green" onClick={() => setFilter('ativos')}>Ativos</Button>
        <Button size="sm" variant={filter === 'inativos' ? 'solid' : 'outline'} colorScheme="red" onClick={() => setFilter('inativos')}>Inativos</Button>
      </HStack>

      {loading ? <Spinner /> : (
        <Box bg={bgCard} shadow="sm" borderRadius="lg" overflow="hidden">
          <Table variant="simple">
            <Thead bg={bgHeader}>
              <Tr>
                <Th color={textColor}>Nome</Th>
                <Th color={textColor}>Especialidade</Th>
                <Th color={textColor}>CR - Conselho Regional</Th>
                <Th color={textColor}>Status</Th>
                <Th color={textColor}>Ações</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredDoctors.map((doc) => (
                <Tr key={doc.id} opacity={doc.ativo ? 1 : 0.6} _hover={{ bg: hoverTr }}>
                  <Td fontWeight="bold" color={textColor}>{doc.nome}</Td>
                  <Td color={textColor}>{doc.especialidade}</Td>
                  <Td color={textColor}>{doc.crm}</Td>
                  <Td>
                    <Text fontWeight="extrabold" fontSize="xs" letterSpacing="wide" color={doc.ativo ? activeColor : inactiveColor}>
                      {doc.ativo ? 'ATIVO' : 'INATIVO'}
                    </Text>
                  </Td>
                  <Td>
                    <IconButton icon={<FaEdit />} size="sm" colorScheme="yellow" mr={2} onClick={() => openModal(doc)} isDisabled={!doc.ativo} aria-label="Editar" />
                    {doc.ativo ? (
                      <Tooltip label="Inativar">
                        <IconButton icon={<FaBan />} size="sm" colorScheme="red" onClick={() => handleInactivate(doc.id)} aria-label="Inativar" />
                      </Tooltip>
                    ) : (
                      <Tooltip label="Reativar">
                        <IconButton icon={<FaCheck />} size="sm" colorScheme="green" onClick={() => handleReactivate(doc.id)} aria-label="Reativar" />
                      </Tooltip>
                    )}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}

      {/* --- MODAL DE CADASTRO/EDIÇÃO --- */}
      {/* Aumentamos o tamanho para "xl" para acomodar a agenda confortavelmente */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent bg={modalBg}>
          <ModalHeader color={headingColor}>
            {isEditing ? "Editar Profissional" : "Novo Profissional"}
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody>
            <VStack spacing={6} align="stretch">
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel color={textColor}>Nome Completo</FormLabel>
                  <Input 
                    bg={inputBg} 
                    borderColor={borderColor} 
                    value={currentDoctor.nome} 
                    onChange={(e) => setCurrentDoctor({...currentDoctor, nome: e.target.value})} 
                    placeholder="Ex: Dr. Silva" 
                  />
                </FormControl>

                {!isEditing && (
                  <SimpleGrid columns={2} spacing={4} w="full">
                    <FormControl isRequired>
                      <FormLabel color={textColor}>E-mail de Acesso</FormLabel>
                      <Input 
                        type="email"
                        bg={inputBg} 
                        borderColor={borderColor} 
                        value={currentDoctor.email} 
                        onChange={(e) => setCurrentDoctor({...currentDoctor, email: e.target.value})} 
                        placeholder="Ex: medico@clinica.com" 
                      />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel color={textColor}>Senha Provisória</FormLabel>
                      <Input 
                        type="password"
                        bg={inputBg} 
                        borderColor={borderColor} 
                        value={currentDoctor.senha} 
                        onChange={(e) => setCurrentDoctor({...currentDoctor, senha: e.target.value})} 
                        placeholder="Senha de acesso" 
                      />
                    </FormControl>
                  </SimpleGrid>
                )}

                <SimpleGrid columns={2} spacing={4} w="full">
                  <FormControl isRequired>
                    <FormLabel color={textColor}>Especialidade</FormLabel>
                    <Select 
                      bg={inputBg} 
                      borderColor={borderColor} 
                      value={currentDoctor.especialidade} 
                      onChange={(e) => setCurrentDoctor({...currentDoctor, especialidade: e.target.value})} 
                      placeholder="Selecione"
                    >
                      {MASTER_SPECIALTIES.map(spec => (
                        <option key={spec} value={spec}>{spec}</option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel color={textColor}>Registro Profissional</FormLabel>
                    <Input 
                      bg={inputBg} 
                      borderColor={borderColor} 
                      value={currentDoctor.crm} 
                      onChange={(e) => setCurrentDoctor({...currentDoctor, crm: e.target.value})} 
                    />
                  </FormControl>
                </SimpleGrid>
              </VStack>

              <Divider />

              {/* --- 4. INJEÇÃO DO COMPONENTE DE AGENDA --- */}
              <AgendaConfigFields 
                config={agendaConfig} 
                setConfig={setAgendaConfig} 
                textColor={textColor}
                bgInput={inputBg}
                borderColor={borderColor}
              />
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleSave}>Salvar Profissional</Button>
            <Button onClick={onClose} variant="ghost" color={textColor}>Cancelar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}