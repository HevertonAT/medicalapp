import React, { useState, useEffect } from 'react';
import { Box, Heading, Text, VStack, Card, CardBody, Badge, useColorModeValue, Spinner, Flex } from '@chakra-ui/react';
import api from '../services/api';

export default function MeusExames() {
  const bgPage = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');

  const [exames, setExames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchExames() {
        try {
            // Tenta buscar do backend
            const response = await api.get('/exams/my-exams'); // Ajuste a rota conforme seu backend
            setExames(response.data);
        } catch (error) {
            // Se der erro (ex: rota não existe ainda), usa os dados fictícios para não quebrar a tela
            console.log("Usando dados fictícios de exames");
            setExames(dummyExames);
        } finally {
            setLoading(false);
        }
    }
    fetchExames();
  }, []);

  return (
    <Box p={8} minH="100vh" bg={bgPage}>
      <Heading mb={6} size="lg">Meus Exames</Heading>
      
      {loading ? (
          <Flex justify="center"><Spinner /></Flex>
      ) : (
          <VStack align="stretch" spacing={4}>
            {exames.length === 0 ? (
                <Text>Nenhum exame encontrado.</Text>
            ) : (
                exames.map(exame => (
                <Card key={exame.id} bg={cardBg} variant="outline">
                    <CardBody display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                        <Heading size="sm">{exame.nome}</Heading>
                        <Text fontSize="sm" color="gray.500">{exame.data}</Text>
                    </Box>
                    <Badge colorScheme={exame.status === 'Disponível' ? 'green' : 'gray'}>{exame.status}</Badge>
                    </CardBody>
                </Card>
                ))
            )}
          </VStack>
      )}
    </Box>
  );
}