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

  const [currentPatient, setCurrentPatient] = useState({ id: '', nome_completo: '', telefone: '', cpf: '', data_nascimento: '' });
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
  
  // Cores Status Vivas (Sem Fundo)
  const activeColor = useColorModeValue('green.600', 'green.300'); // Verde Vivo
  const inactiveColor = useColorModeValue('red.600', 'red.300');   // Vermelho Vivo
  
  // Cores específicas do prontuário
  const recordListBg = useColorModeValue('gray.50', 'gray.900');
  const recordDetailBg = useColorModeValue('white', 'gray.800');
  const anamneseBg = useColorModeValue('gray.50', 'gray.700');
  const prescricaoBg = useColorModeValue('orange.50', 'orange.900');
  const prescricaoText = useColorModeValue('orange.800', 'orange.100');

  // --- FUNÇÕES DE MÁSCARA (FORMATAÇÃO) ---
  
  // Valida se o CPF é válido
  const isValidCPF = (cpf) => {
    const numbers = cpf.replace(/\D/g, '');
    
    // Verifica se tem 11 dígitos
    if (numbers.length !== 11) return false;
    
    // Verifica CPFs conhecidamente inválidos (todos iguais)
    if (/^(\d)\1{10}$/.test(numbers)) return false;
    
    // Calcula primeiro dígito verificador
    let sum = 0;
    let remainder;
    for (let i = 1; i <= 9; i++) {
      sum += parseInt(numbers.substring(i - 1, i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(numbers.substring(9, 10))) return false;
    
    // Calcula segundo dígito verificador
    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum += parseInt(numbers.substring(i - 1, i)) * (12 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(numbers.substring(10, 11))) return false;
    
    return true;
  };
  
  const formatCPF = (value) => {
    return value
      .replace(/\D/g, '') // Remove tudo o que não é dígito
      .replace(/(\d{3})(\d)/, '$1.$2') // Coloca um ponto entre o terceiro e o quarto dígitos
      .replace(/(\d{3})(\d)/, '$1.$2') // Coloca um ponto entre o terceiro e o quarto dígitos de novo (para o segundo bloco de números)
      .replace(/(\d{3})(\d{1,2})/, '$1-$2') // Coloca um hífen entre o terceiro e o quarto dígitos
      .replace(/(-\d{2})\d+?$/, '$1'); // Impede de digitar mais de 11 dígitos
  };

  const formatPhone = (value) => {
    return value
      .replace(/\D/g, '') // Remove tudo o que não é dígito
      .replace(/^(\d{2})(\d)/g, '($1) $2') // Coloca parênteses em volta dos dois primeiros dígitos
      .replace(/(\d)(\d{4})$/, '$1-$2') // Coloca hífen entre o quarto e o quinto dígitos
      .substring(0, 15); // Limita o tamanho
  };

  const fetchPatients = async () => {
    try {
      // 2. Simplificado: api.get já usa a URL base e insere o token sozinho
      const response = await api.get('/patients/');
      setPatients(response.data);
    } catch (error) { 
        console.error(error); 
        // Se der erro de autenticação, redireciona (opcional, pois api.js pode tratar isso)
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
    // Valida CPF antes de salvar
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
            data_nascimento: currentPatient.data_nascimento || null
        };

        if (isEditing && currentPatient.id) {
            // 3. URLs limpas
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
        toast({ title: 'Erro ao salvar.', description: 'Verifique se o CPF já existe.', status: 'error' });
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
          setCurrentPatient(patient);
          setIsEditing(true);
      } else {
          setCurrentPatient({ id: '', nome_completo: '', telefone: '', cpf: '', data_nascimento: '' });
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
        // Para arquivos binários (PDF), ainda precisamos avisar o axios/api sobre o responseType
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

      {/* BARRA DE FILTROS */}
      <HStack mb={4} spacing={4}>
        <Button size="sm" variant={filter === 'todos' ? 'solid' : 'outline'} colorScheme="blue" onClick={() => setFilter('todos')}>Todos</Button>
        <Button size="sm" variant={filter === 'ativos' ? 'solid' : 'outline'} colorScheme="green" onClick={() => setFilter('ativos')}>Ativos</Button>
        <Button size="sm" variant={filter === 'inativos' ? 'solid' : 'outline'} colorScheme="red" onClick={() => setFilter('inativos')}>Inativos</Button>
      </HStack>

      <Box bg={bgCard} shadow="sm" borderRadius="lg" overflow="hidden">
        <Table variant="simple">
          <Thead bg={bgHeader}>
              <Tr>
                  <Th color={textColor}>Nome</Th>
                  <Th color={textColor}>CPF</Th> 
                  <Th color={textColor}>Telefone</Th>
                  <Th color={textColor}>Status</Th>
                  <Th color={textColor}>Ações</Th>
              </Tr>
          </Thead>
          <Tbody>
            {filteredPatients.map((p) => (
              <Tr key={p.id} opacity={p.ativo ? 1 : 0.6} _hover={{ bg: hoverTr }}>
                <Td fontWeight="bold">{p.nome_completo}</Td>
                <Td>{p.cpf}</Td> 
                <Td>{p.telefone}</Td>
                
                {/* STATUS SEM CAIXA E COM CORES VIVAS */}
                <Td>
                    <Text 
                        fontWeight="extrabold" 
                        fontSize="xs" 
                        letterSpacing="wide"
                        color={p.ativo ? activeColor : inactiveColor}
                    >
                        {p.ativo ? 'ATIVO' : 'INATIVO'}
                    </Text>
                </Td>

                <Td>
                  <Button size="sm" leftIcon={<FaFileMedical />} colorScheme="teal" mr={2} onClick={() => handleOpenRecord(p)}>Prontuário</Button>
                  <IconButton icon={<FaEdit />} size="sm" colorScheme="yellow" mr={2} onClick={() => openModal(p)} isDisabled={!p.ativo} />
                  
                  {p.ativo ? (
                      <Tooltip label="Inativar">
                        <IconButton icon={<FaBan />} size="sm" colorScheme="red" onClick={() => handleInactivate(p.id)} />
                      </Tooltip>
                  ) : (
                      <Tooltip label="Reativar">
                        <IconButton icon={<FaCheck />} size="sm" colorScheme="green" onClick={() => handleReactivate(p.id)} />
                      </Tooltip>
                  )}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      {/* MODAL CADASTRO */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent bg={modalBg}>
          <ModalHeader>{isEditing ? 'Editar Paciente' : 'Novo Paciente'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb={4}>
                <FormLabel>Nome Completo</FormLabel>
                <Input 
                    bg={inputBg} 
                    borderColor={borderColor} 
                    value={currentPatient.nome_completo} 
                    onChange={(e) => setCurrentPatient({...currentPatient, nome_completo: e.target.value})} 
                    placeholder="Digite o nome do Paciente"
                />
            </FormControl>
            
            <FormControl mb={4} isInvalid={cpfError !== ''}>
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
                {cpfError && <Text fontSize="sm" color="red.500" mt={1}>{cpfError}</Text>}
            </FormControl>

            <FormControl mb={4}>
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
                                <Text fontSize="sm" fontWeight="bold" mt={1}>Prof: {rec.doctor_nome}</Text>
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
                            <Text fontWeight="bold" color={textColor} mb={2}>Anamnese / Evolução:</Text>
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