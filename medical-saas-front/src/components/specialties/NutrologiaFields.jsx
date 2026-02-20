import React from 'react';
import { FormControl, FormLabel, Textarea, VStack, Heading } from '@chakra-ui/react';

export default function NutrologiaFields({ formData, handleChange, bgInput, borderColor, textColor }) {
  return (
    <VStack spacing={6} align="stretch">
      {/* Título da Seção para organização visual */}
      <Heading size="xs" textTransform="uppercase" letterSpacing="widest" color="green.500">
        Avaliação Nutrológica e Hábitos
      </Heading>

      <FormControl>
        <FormLabel color={textColor} fontWeight="bold">Recordatório Alimentar (24h) / Hábitos</FormLabel>
        <Textarea 
          name="recordatorio_alimentar" 
          value={formData.recordatorio_alimentar || ''} 
          onChange={handleChange} 
          bg={bgInput} 
          color={textColor}
          borderColor={borderColor} 
          placeholder="Descreva detalhadamente o consumo: café da manhã, almoço, jantar, lanches, ingestão hídrica, consumo de álcool e industrializados..." 
          resize="none"
          minH="200px"  // <-- ESPAÇO AMPLO PARA O RECORDATÓRIO DETALHADO
          _focus={{ borderColor: "green.400" }}
        />
      </FormControl>

      <FormControl>
        <FormLabel color={textColor} fontWeight="bold">Suplementação e Vitaminas em Uso</FormLabel>
        <Textarea 
          name="suplementacao" 
          value={formData.suplementacao || ''} 
          onChange={handleChange} 
          bg={bgInput} 
          color={textColor}
          borderColor={borderColor} 
          placeholder="Liste suplementos, fitoterápicos, vitaminas, dosagens e horários de uso..."
          resize="none"
          minH="120px"
          _focus={{ borderColor: "green.400" }}
        />
      </FormControl>
    </VStack>
  );
}