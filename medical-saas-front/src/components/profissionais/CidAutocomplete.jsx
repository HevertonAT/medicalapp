import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Input, List, ListItem, Text, Spinner, InputGroup, 
  InputRightElement, useColorModeValue, Flex
} from '@chakra-ui/react';
import { FaSearch } from 'react-icons/fa';
import api from '../../services/api';

export default function CidAutocomplete({ value, onChange, specialty }) {
  const [inputValue, setInputValue] = useState(value || '');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);

  // Cores dinâmicas para o Modo Claro/Noturno
  const bgCard = useColorModeValue('white', 'gray.800');
  const hoverBg = useColorModeValue('blue.50', 'gray.600');
  const borderColor = useColorModeValue('gray.300', 'gray.600');
  const inputBg = useColorModeValue('white', 'gray.900');

  // Fecha a lista suspensa se clicar fora dela
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sincroniza o valor externo
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Função que busca no Backend
  useEffect(() => {
    const fetchCids = async () => {
      if (inputValue.length < 2) {
        // Se estiver vazio, traz as sugestões da especialidade
        try {
          setLoading(true);
          const res = await api.get(`/cids/sugestoes?especialidade=${specialty || ''}`);
          setResults(res.data);
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
        return;
      }

      // Se digitou algo, busca pelo termo (ex: "J00" ou "Tosse")
      try {
        setLoading(true);
        const res = await api.get(`/cids/busca?q=${inputValue}`);
        setResults(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    // Espera 300ms depois que o usuário parar de digitar para chamar a API
    const timerId = setTimeout(() => {
      if (isOpen) fetchCids();
    }, 300);

    return () => clearTimeout(timerId);
  }, [inputValue, specialty, isOpen]);

  // Quando clica em uma doença da lista
  const handleSelect = (cid) => {
    const cidString = `${cid.codigo} - ${cid.descricao}`;
    setInputValue(cidString);
    onChange(cidString); // Manda pro Agenda.jsx salvar no banco
    setIsOpen(false);
  };

  return (
    <Box ref={wrapperRef} position="relative" w="full">
      <InputGroup size="sm">
        <Input
          placeholder="Digite o código (ex: J00) ou a doença (ex: dor)..."
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
            onChange(e.target.value); 
          }}
          onFocus={() => setIsOpen(true)}
          bg={inputBg}
          borderColor={borderColor}
          _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px blue.400" }}
        />
        <InputRightElement>
          {loading ? <Spinner size="xs" color="blue.500" /> : <FaSearch color="gray.400" />}
        </InputRightElement>
      </InputGroup>

      {/* LISTA SUSPENSA DE RESULTADOS */}
      {isOpen && results.length > 0 && (
        <List
          position="absolute"
          top="100%"
          left={0}
          right={0}
          mt={1}
          bg={bgCard}
          border="1px solid"
          borderColor={borderColor}
          borderRadius="md"
          boxShadow="xl"
          zIndex={1000}
          maxH="220px"
          overflowY="auto"
        >
          {results.map((cid, idx) => (
            <ListItem
              key={idx}
              p={3}
              cursor="pointer"
              _hover={{ bg: hoverBg }}
              onClick={() => handleSelect(cid)}
              borderBottom={idx !== results.length - 1 ? '1px solid' : 'none'}
              borderColor={borderColor}
            >
              <Flex justify="space-between" align="center">
                <Box>
                    <Text fontWeight="bold" fontSize="sm" color="blue.500">{cid.codigo}</Text>
                    <Text fontSize="sm">{cid.descricao}</Text>
                </Box>
                {cid.especialidade && (
                    <Text fontSize="2xs" color="gray.500" bg={useColorModeValue('gray.100', 'gray.700')} px={2} py={1} borderRadius="full">
                        {cid.especialidade}
                    </Text>
                )}
              </Flex>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}