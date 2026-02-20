import React from 'react';
import { FormControl, FormLabel, Textarea, Input, VStack, SimpleGrid, Heading } from '@chakra-ui/react';

export default function InfectologiaFields({ formData, handleChange, bgInput, borderColor, textColor }) {
  return (
    <VStack spacing={6} align="stretch">
      <Heading size="xs" textTransform="uppercase" letterSpacing="widest" color="yellow.500">
        Investigação Infecciosa e Epidemiológica
      </Heading>

      <SimpleGrid columns={[1, 2]} spacing={4}>
        <FormControl>
          <FormLabel color={textColor} fontWeight="bold">Data de Início da Febre</FormLabel>
          <Input 
            type="date" 
            name="inicio_febre" 
            value={formData.inicio_febre || ''} 
            onChange={handleChange} 
            bg={bgInput} 
            color={textColor}
            borderColor={borderColor} 
            _focus={{ borderColor: "yellow.400" }}
          />
        </FormControl>

        <FormControl>
          <FormLabel color={textColor} fontWeight="bold">Uso Recente de Antibióticos</FormLabel>
          <Input 
            name="uso_antibioticos" 
            value={formData.uso_antibioticos || ''} 
            onChange={handleChange} 
            bg={bgInput} 
            color={textColor}
            borderColor={borderColor} 
            placeholder="Qual e por quantos dias?" 
            _focus={{ borderColor: "yellow.400" }}
          />
        </FormControl>

        <FormControl gridColumn="span 2">
          <FormLabel color={textColor} fontWeight="bold">Foco Infeccioso e Sintomas Específicos</FormLabel>
          <Textarea 
            name="foco_infeccioso" 
            value={formData.foco_infeccioso || ''} 
            onChange={handleChange} 
            bg={bgInput} 
            color={textColor}
            borderColor={borderColor} 
            placeholder="Descreva detalhadamente: lesões cutâneas, padrão de tosse, queixas urinárias, histórico de viagens recentes e exposição a riscos..." 
            resize="none"
            minH="180px"
            _focus={{ borderColor: "yellow.400" }}
          />
        </FormControl>
      </SimpleGrid>
    </VStack>
  );
}