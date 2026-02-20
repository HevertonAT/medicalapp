import React from 'react';
import { FormControl, FormLabel, Textarea, VStack, Heading } from '@chakra-ui/react';

export default function ClinicoGeralFields({ formData, handleChange, bgInput, borderColor, textColor }) {
  return (
    <VStack spacing={6} align="stretch">
      <Heading size="xs" textTransform="uppercase" letterSpacing="widest" color="green.500">
        Avaliação Clínico Geral
      </Heading>

      <FormControl>
        <FormLabel color={textColor} fontWeight="bold">História da Doença Atual (HDA)</FormLabel>
        <Textarea 
          name="hda" 
          value={formData.hda || ''} 
          onChange={handleChange} 
          placeholder="Descreva detalhadamente a queixa principal, início dos sintomas, fatores de melhora ou piora..."
          bg={bgInput} 
          color={textColor}
          borderColor={borderColor} 
          resize="none"
          minH="180px"
          _focus={{ borderColor: "green.400" }}
        />
      </FormControl>

      <FormControl>
        <FormLabel color={textColor} fontWeight="bold">Exame Físico Geral</FormLabel>
        <Textarea 
          name="exame_fisico_geral" 
          value={formData.exame_fisico_geral || ''} 
          onChange={handleChange} 
          placeholder="Estado geral, hidratação, mucosas, ausculta básica, palpação abdominal..."
          bg={bgInput} 
          color={textColor}
          borderColor={borderColor} 
          resize="none"
          minH="120px"
          _focus={{ borderColor: "green.400" }}
        />
      </FormControl>
    </VStack>
  );
}