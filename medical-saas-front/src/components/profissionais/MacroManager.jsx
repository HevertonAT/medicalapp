import React, { useState, useEffect } from 'react';
import { 
  Box, VStack, HStack, Input, Textarea, Button, Heading, Text, 
  IconButton, useToast, Spinner, Divider, useColorModeValue, Flex
} from '@chakra-ui/react';
import { FaPlus, FaTrash } from 'react-icons/fa';
import api from '../../services/api';

export default function MacroManager() {
  const [macros, setMacros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novoTexto, setNovoTexto] = useState('');

  const toast = useToast();
  
  const bgCard = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.700', 'gray.200');

  useEffect(() => {
    fetchMacros();
  }, []);

  const fetchMacros = async () => {
    try {
      const response = await api.get('/macros/');
      setMacros(response.data);
    } catch (error) {
      console.error("Erro ao buscar macros", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMacro = async () => {
    if (!novoTitulo.trim() || !novoTexto.trim()) {
      toast({ title: 'Preencha o título e o texto.', status: 'warning' });
      return;
    }
    setSaving(true);
    try {
      const response = await api.post('/macros/', {
        titulo: novoTitulo,
        texto_padrao: novoTexto
      });
      setMacros([...macros, response.data]);
      setNovoTitulo('');
      setNovoTexto('');
      toast({ title: 'Atalho salvo com sucesso!', status: 'success' });
    } catch (error) {
      toast({ title: 'Erro ao salvar atalho.', status: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMacro = async (id) => {
    if (!window.confirm("Deseja realmente excluir este atalho?")) return;
    try {
      await api.delete(`/macros/${id}`);
      setMacros(macros.filter(m => m.id !== id));
      toast({ title: 'Atalho excluído.', status: 'info' });
    } catch (error) {
      toast({ title: 'Erro ao excluir.', status: 'error' });
    }
  };

  if (loading) return <Spinner color="blue.500" />;

  return (
    <Box>
      <Heading size="sm" mb={4} color="blue.500">Meus Atalhos de Texto (Macros)</Heading>
      <Text fontSize="sm" color={textColor} mb={4}>
        Crie textos padronizados para preencher suas evoluções e anamneses com apenas um clique.
      </Text>

      {/* Formulário para criar novo macro */}
      <VStack align="stretch" spacing={3} bg={bgCard} p={4} borderRadius="md" border="1px solid" borderColor={borderColor} mb={6}>
        <Input 
          placeholder="Título do Atalho (Ex: Avaliação Inicial Padrão)" 
          value={novoTitulo} 
          onChange={(e) => setNovoTitulo(e.target.value)}
          bg={useColorModeValue('white', 'gray.800')}
        />
        <Textarea 
          placeholder="Digite o texto completo que será inserido..." 
          value={novoTexto} 
          onChange={(e) => setNovoTexto(e.target.value)}
          bg={useColorModeValue('white', 'gray.800')}
          rows={4}
        />
        <Button leftIcon={<FaPlus />} colorScheme="green" onClick={handleAddMacro} isLoading={saving} alignSelf="flex-end">
          Salvar Atalho
        </Button>
      </VStack>

      {/* Lista de Macros Existentes */}
      <VStack align="stretch" spacing={3}>
        {macros.length === 0 ? (
          <Text fontSize="sm" color="gray.500" fontStyle="italic">Nenhum atalho criado ainda.</Text>
        ) : (
          macros.map(macro => (
            <Flex key={macro.id} p={3} borderWidth="1px" borderColor={borderColor} borderRadius="md" justify="space-between" align="center">
              <Box>
                <Text fontWeight="bold" color={textColor}>{macro.titulo}</Text>
                <Text fontSize="xs" color="gray.500" noOfLines={1}>{macro.texto_padrao}</Text>
              </Box>
              <IconButton 
                icon={<FaTrash />} 
                colorScheme="red" 
                variant="ghost" 
                size="sm" 
                onClick={() => handleDeleteMacro(macro.id)}
                aria-label="Excluir macro"
              />
            </Flex>
          ))
        )}
      </VStack>
    </Box>
  );
}