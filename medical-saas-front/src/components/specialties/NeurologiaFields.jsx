import React from 'react';
import { FormControl, FormLabel, Textarea, VStack, Heading } from '@chakra-ui/react';

export default function NeurologiaFields({ formData, handleChange, bgInput, borderColor, textColor }) {
  return (
    <VStack spacing={6} align="stretch">
      {/* Título da Seção */}
      <Heading size="xs" textTransform="uppercase" letterSpacing="widest" color="purple.500">
        Avaliação Neurológica Detalhada
      </Heading>

      <FormControl>
        <FormLabel color={textColor} fontWeight="bold">Nível de Consciência e Cognição</FormLabel>
        <Textarea 
          name="nivel_consciencia" 
          value={formData.nivel_consciencia || ''} 
          onChange={handleChange} 
          bg={bgInput} 
          color={textColor}
          borderColor={borderColor} 
          placeholder="Escala de Glasgow, orientação tempo/espaço, memória e atenção..." 
          resize="none"
          minH="100px"
          _focus={{ borderColor: "purple.400" }}
        />
      </FormControl>

      <FormControl>
        <FormLabel color={textColor} fontWeight="bold">Exame Neurológico Motor e Sensitivo</FormLabel>
        <Textarea 
          name="exame_neuro" 
          value={formData.exame_neuro || ''} 
          onChange={handleChange} 
          bg={bgInput} 
          color={textColor}
          borderColor={borderColor} 
          placeholder="Descreva: força motora (graus 0-5), reflexos profundos, sensibilidade superficial/profunda, coordenação e pares cranianos..." 
          resize="none"
          minH="220px"  // <-- TAMANHO AMPLIADO PARA EXAME FÍSICO COMPLETO
          _focus={{ borderColor: "purple.400" }}
        />
      </FormControl>
    </VStack>
  );
}