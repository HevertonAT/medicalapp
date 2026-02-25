import { useState, useEffect } from 'react';
import {
  Box, Button, Flex, Heading, Table, Thead, Tbody, Tr, Th, Td,
  IconButton, useDisclosure, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalBody, ModalCloseButton, useToast, Spinner, VStack, Text, 
  HStack, Icon, Badge, FormControl, FormLabel, Input, ModalFooter, Tooltip,
  useColorModeValue
} from '@chakra-ui/react';
import { FaPlus, FaFileMedical, FaHistory, FaPrescriptionBottleAlt, FaEdit, FaBan, FaCheck } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

// 1. IMPORTANDO A INSTÂNCIA CONFIGURADA
import api from '../services/api';

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modais
  const { isOpen, onOpen, onClose } = useDisclosure(); 
  const { isOpen: isRecordOpen, onOpen: onRecordOpen, onClose: onRecordClose } = useDisclosure(); 

  // Adicionado 'email' ao estado inicial
  const [currentPatient, setCurrentPatient] = useState({ 
    id: '', nome_completo: '', telefone: '', cpf: '', data_nascimento: '', email: '' 
  });
  const [isEditing, setIsEditing] = useState(false);
  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [cpfError, setCpfError] = useState('');
  
  const [filter, setFilter] = useState('ativos'); 

  const toast = useToast();
  const navigate = useNavigate();

  // --- CORES DINÂMICAS PARA DARK MODE ---
  const bgCard = useColorModeValue('white', 'gray.800');
  const bgHeader = useColorModeValue('gray.50', 'gray.700');
  const inputBg = useColorModeValue('gray.50', 'gray.700');
  const modalBg = useColorModeValue('white', 'gray.800');
  const hoverTr = useColorModeValue('gray.50', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.200');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  const activeColor = useColorModeValue('green.600', 'green.300'); 
  const inactiveColor = useColorModeValue('red.600', 'red.300');   
  
  const recordListBg = useColorModeValue('gray.50', 'gray.900');
  const recordDetailBg = useColorModeValue('white', 'gray.800');
  const anamneseBg = useColorModeValue('gray.50', 'gray.700');
  const prescricaoBg = useColorModeValue('orange.50', 'orange.900');
  const prescricaoText = useColorModeValue('orange.800', 'orange.100');

  // --- FUNÇÃO PARA CALCULAR IDADE ---
  const calculateAge = (dataNascimento) => {
    if (!dataNascimento) return '-';
    const today = new Date();
    const birthDate = new Date(dataNascimento);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age + ' anos';
  };

  // --- FUNÇÕES DE MÁSCARA E VALIDAÇÃO ---
  const isValidCPF = (cpf) => {
    const numbers = cpf.replace(/\D/g, '');
    if (numbers.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(numbers)) return false;
    let sum = 0;
    let remainder;
    for (let i = 1; i <= 9; i++) sum += parseInt(numbers.substring(i - 1, i)) * (11 - i);
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(numbers.substring(9, 10))) return false;
    sum = 0;
    for (let i = 1; i <= 10; i++) sum += parseInt(numbers.substring(i - 1, i)) * (12 - i);
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(numbers.substring(10, 11))) return false;
    return true;
  };
  
  const formatCPF = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const formatPhone = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/g, '($1) $2')
      .replace(/(\d)(\d{4})$/, '$1-$2')
      .substring(0, 15);
  };

  const fetchPatients = async () => {
    try {
      const response = await api.get('/patients/');
      setPatients(response.data);
    } catch (error) { 
        console.error(error); 
        if(error.response?.status === 401) navigate('/');
    } finally { 
        setLoading(false); 
    }
  };

  useEffect(() => { fetchPatients(); }, []);

  const filteredPatients = patients.filter(p => {
    if (filter === 'ativos') return p.ativo === true;
    if (filter === 'inativos') return p.ativo === false;
    return true; 
  });

  const handleSave = async () => {
    if (!currentPatient.cpf) {
        setCpfError('CPF é obrigatório.');
        return;
    }
    
    if (!isValidCPF(currentPatient.cpf)) {
        setCpfError('CPF inválido. Insira um CPF válido.');
        return;
    }
    
    try {
        const payload = {
            nome_completo: currentPatient.nome_completo,
            cpf: currentPatient.cpf, 
            telefone: currentPatient.telefone,
            email: currentPatient.email, // Incluído no payload
            data_nascimento: currentPatient.data_nascimento || null
        };

        if (isEditing && currentPatient.id) {
            await api.put(`/patients/${currentPatient.id}`, payload);
            toast({ title: 'Atualizado!', status: 'success' });
        } else {
            await api.post('/patients/', payload);
            toast({ title: 'Criado!', status: 'success' });
        }
        onClose();
        setCpfError('');
        fetchPatients();
    } catch (error) {
        toast({ title: 'Erro ao salvar.', description: 'Verifique se o CPF ou E-mail já existe.', status: 'error' });
    }
  };

  const handleInactivate = async (id) => {
    if (confirm('Inativar este paciente?')) {
        try {
            await api.delete(`/patients/${id}`);
            toast({ title: 'Inativado.', status: 'warning' });
            fetchPatients();
        } catch (error) { toast({ title: 'Erro.', status: 'error' }); }
    }
  };

  const handleReactivate = async (id) => {
    if (confirm('Reativar este paciente?')) {
        try {
            await api.patch(`/patients/${id}/reactivate`, {});
            toast({ title: 'Paciente reativado!', status: 'success' });
            fetchPatients();
        } catch (error) { toast({ title: 'Erro.', status: 'error' }); }
    }
  };

  const openModal = (patient = null) => {
      if (patient) {
          setCurrentPatient({
            ...patient,
            email: patient.email || '',
            data_nascimento: patient.data_nascimento || ''
          });
          setIsEditing(true);
      } else {
          setCurrentPatient({ id: '', nome_completo: '', telefone: '', cpf: '', data_nascimento: '', email: '' });
          setIsEditing(false);
      }
      onOpen();
  };

  const handleOpenRecord = async (patient) => {
    setCurrentPatient(patient);
    setSelectedRecord(null);
    onRecordOpen();
    try {
        const res = await api.get(`/medical-records/patient/${patient.id}`);
        setRecords(res.data);
    } catch (error) { console.error("Erro prontuário"); }
  };

  const handleDownloadPDF = async (recordId) => {
    try {
        const response = await api.get(`/medical-records/${recordId}/pdf`, {
            responseType: 'blob' 
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `receita_${recordId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (error) {
        toast({ title: 'Erro ao gerar receita.', status: 'error' });
    }
  };

  return (
    <Box p={8}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg" color={useColorModeValue("gray.700", "white")}>Pacientes</Heading>
        <Button leftIcon={<FaPlus />} colorScheme="blue" onClick={() => openModal()}>Novo Paciente</Button>
      </Flex>

      <HStack mb={4} spacing={4}>
        <Button size="sm" variant={filter === 'todos' ? 'solid' : 'outline'} colorScheme="blue" onClick={() => setFilter('todos')}>Todos</Button>
        <Button size="sm" variant={filter === 'ativos' ? 'solid' : 'outline'} colorScheme="green" onClick={() => setFilter('ativos')}>Ativos</Button>
        <Button size="sm" variant={filter === 'inativos' ? 'solid' : 'outline'} colorScheme="red" onClick={() => setFilter('inativos')}>Inativos</Button>
      </HStack>

      <Box bg={bgCard} shadow="sm" borderRadius="md" overflow="hidden" border="1px solid" borderColor={borderColor}>
        <Table variant="simple" size="sm"> {/* Adicionado size="sm" para compactar */}
            <Thead bg={bgHeader}>
            <Tr>
                <Th color={textColor} py={3}>Nome</Th>
                <Th color={textColor} py={3}>Idade</Th>
                <Th color={textColor} py={3}>CPF</Th>
                <Th color={textColor} py={3}>E-mail</Th>
                <Th color={textColor} py={3}>Telefone</Th>
                <Th color={textColor} py={3}>Status</Th>
                <Th color={textColor} py={3} textAlign="center">Ações</Th>
            </Tr>
            </Thead>
            <Tbody>
            {filteredPatients.map((p) => (
                <Tr 
                key={p.id} 
                opacity={p.ativo ? 1 : 0.6} 
                _hover={{ bg: hoverTr }}
                transition="background 0.2s"
                >
                <Td py={2} fontWeight="bold" fontSize="xs">{p.nome_completo}</Td>
                <Td py={2} fontSize="xs">{calculateAge(p.data_nascimento)}</Td>
                <Td py={2} fontSize="xs">{p.cpf}</Td>
                <Td py={2} fontSize="xs">{p.email || '-'}</Td>
                <Td py={2} fontSize="xs">{p.telefone}</Td>
                
                <Td py={2}>
                    <Text 
                    fontWeight="extrabold" 
                    fontSize="2xs" 
                    letterSpacing="wider"
                    color={p.ativo ? activeColor : inactiveColor}
                    >
                    {p.ativo ? 'ATIVO' : 'INATIVO'}
                    </Text>
                </Td>

                <Td py={2}>
                    <HStack justify="center" spacing={1}>
                    <Button 
                        size="xs" // Reduzido para XS
                        leftIcon={<FaFileMedical />} 
                        colorScheme="teal" 
                        onClick={() => handleOpenRecord(p)}
                    >
                        Prontuário
                    </Button>
                    
                    <IconButton 
                        icon={<FaEdit />} 
                        size="xs" // Reduzido para XS
                        colorScheme="yellow" 
                        variant="ghost"
                        onClick={() => openModal(p)} 
                        isDisabled={!p.ativo} 
                    />
                    
                    {p.ativo ? (
                        <Tooltip label="Inativar">
                        <IconButton 
                            icon={<FaBan />} 
                            size="xs" 
                            colorScheme="red" 
                            variant="ghost"
                            onClick={() => handleInactivate(p.id)} 
                        />
                        </Tooltip>
                    ) : (
                        <Tooltip label="Reativar">
                        <IconButton 
                            icon={<FaCheck />} 
                            size="xs" 
                            colorScheme="green" 
                            variant="ghost"
                            onClick={() => handleReactivate(p.id)} 
                        />
                        </Tooltip>
                    )}
                    </HStack>
                </Td>
                </Tr>
            ))}
            </Tbody>
        </Table>
    </Box>

      {/* MODAL CADASTRO / EDIÇÃO */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent bg={modalBg}>
          <ModalHeader>{isEditing ? 'Editar Paciente' : 'Novo Paciente'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                  <FormLabel>Nome Completo</FormLabel>
                  <Input 
                      bg={inputBg} 
                      borderColor={borderColor} 
                      value={currentPatient.nome_completo} 
                      onChange={(e) => setCurrentPatient({...currentPatient, nome_completo: e.target.value})} 
                      placeholder="Digite o nome do Paciente"
                  />
              </FormControl>

              <HStack w="full" spacing={4}>
                <FormControl isRequired isInvalid={cpfError !== ''}>
                    <FormLabel>CPF</FormLabel>
                    <Input 
                        bg={inputBg} 
                        borderColor={cpfError ? 'red.500' : borderColor}
                        value={currentPatient.cpf} 
                        onChange={(e) => {
                            const newCpf = formatCPF(e.target.value);
                            setCurrentPatient({...currentPatient, cpf: newCpf});
                            if (!newCpf || isValidCPF(newCpf)) setCpfError('');
                        }} 
                        placeholder="000.000.000-00"
                        maxLength={14}
                    />
                    {cpfError && <Text fontSize="xs" color="red.500" mt={1}>{cpfError}</Text>}
                </FormControl>

                <FormControl>
                    <FormLabel>Data de Nascimento</FormLabel>
                    <Input 
                        type="date"
                        bg={inputBg} 
                        borderColor={borderColor} 
                        value={currentPatient.data_nascimento} 
                        onChange={(e) => setCurrentPatient({...currentPatient, data_nascimento: e.target.value})} 
                    />
                </FormControl>
              </HStack>

              <HStack w="full" spacing={4}>
                <FormControl>
                    <FormLabel>E-mail</FormLabel>
                    <Input 
                        type="email"
                        bg={inputBg} 
                        borderColor={borderColor} 
                        value={currentPatient.email} 
                        onChange={(e) => setCurrentPatient({...currentPatient, email: e.target.value})} 
                        placeholder="email@paciente.com"
                    />
                </FormControl>

                <FormControl>
                    <FormLabel>Telefone</FormLabel>
                    <Input 
                        bg={inputBg} 
                        borderColor={borderColor} 
                        value={currentPatient.telefone} 
                        onChange={(e) => setCurrentPatient({...currentPatient, telefone: formatPhone(e.target.value)})} 
                        placeholder="(00) 00000-0000"
                        maxLength={15}
                    />
                </FormControl>
              </HStack>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleSave}>Salvar</Button>
            <Button onClick={onClose} variant="ghost">Cancelar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* MODAL PRONTUÁRIO */}
      <Modal isOpen={isRecordOpen} onClose={onRecordClose} size="6xl">
        <ModalOverlay />
        <ModalContent h="80vh" bg={modalBg}>
          <ModalHeader borderBottom="1px solid" borderColor={borderColor}>
            <Flex align="center" gap={2}>
                <FaFileMedical color="teal" />
                <Text>Histórico Clínico: {currentPatient.nome_completo}</Text>
            </Flex>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody display="flex" p={0}>
            {/* LADO ESQUERDO: LISTA */}
            <Box w="35%" borderRight="1px solid" borderColor={borderColor} bg={recordListBg} p={4} overflowY="auto">
                <Heading size="sm" mb={4} color={textColor}><Icon as={FaHistory} mr={2}/>Atendimentos</Heading>
                {records.length === 0 ? <Text fontSize="sm" color="gray.500">Nenhum registro.</Text> : (
                    <VStack spacing={3} align="stretch">
                        {records.map(rec => (
                            <Box 
                                key={rec.id} 
                                bg={selectedRecord?.id === rec.id ? "teal.500" : bgCard} 
                                color={selectedRecord?.id === rec.id ? "white" : textColor}
                                p={4} 
                                borderRadius="md" 
                                shadow="sm" 
                                borderLeft="4px solid" 
                                borderColor={selectedRecord?.id === rec.id ? "teal.200" : "gray.300"}
                                cursor="pointer"
                                onClick={() => setSelectedRecord(rec)}
                                _hover={{ opacity: 0.8 }}
                            >
                                <Text fontSize="xs" fontWeight="bold">{rec.created_at}</Text>
                                <Text fontSize="sm" fontWeight="bold" mt={1}>Dr(a) {rec.doctor_nome}</Text>
                            </Box>
                        ))}
                    </VStack>
                )}
            </Box>
            
            {/* LADO DIREITO: DETALHES */}
            <Box w="65%" p={8} overflowY="auto" bg={recordDetailBg}>
                {selectedRecord ? (
                    <Box>
                        <Flex justify="space-between" align="center" mb={6}>
                            <Badge colorScheme="teal" fontSize="0.9em" p={1}>REALIZADO EM {selectedRecord.created_at}</Badge>
                            
                            <Button 
                                size="sm" 
                                leftIcon={<FaPrescriptionBottleAlt />} 
                                variant="outline" 
                                onClick={() => handleDownloadPDF(selectedRecord.id)}
                            >
                                Ver Receita
                            </Button>
                        </Flex>
                        
                        <Box mb={6}>
                            <Text fontWeight="bold" color={textColor} mb={2}>Evolução:</Text>
                            <Box p={4} bg={anamneseBg} borderRadius="md" border="1px solid" borderColor={borderColor} minH="100px">
                                <Text whiteSpace="pre-wrap" color={textColor}>{selectedRecord.anamnese}</Text>
                            </Box>
                        </Box>
                        
                        <Box>
                            <Text fontWeight="bold" color={textColor} mb={2}>Prescrição / Receita:</Text>
                            <Box p={4} bg={prescricaoBg} borderRadius="md" border="1px solid" borderColor="orange.200" minH="80px">
                                <Text whiteSpace="pre-wrap" color={prescricaoText}>{selectedRecord.prescricao || "Nenhuma prescrição."}</Text>
                            </Box>
                        </Box>
                    </Box>
                ) : (
                    <Flex direction="column" align="center" justify="center" h="100%" color="gray.400">
                        <Icon as={FaFileMedical} w={12} h={12} mb={4} opacity={0.3} />
                        <Text>Selecione um atendimento.</Text>
                    </Flex>
                )}
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}