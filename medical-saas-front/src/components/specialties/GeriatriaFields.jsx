import React from 'react';
import { FormControl, FormLabel, Textarea, SimpleGrid, Input, VStack } from '@chakra-ui/react';

export default function GeriatriaFields({ formData, handleChange, bgInput, borderColor, textColor }) {
  return (
    <VStack spacing={4} align="stretch">
      <SimpleGrid columns={2} spacing={4}>
        <FormControl>
          <FormLabel color={textColor}>Risco de Quedas</FormLabel>
          <Input name="risco_quedas" value={formData.risco_quedas || ''} onChange={handleChange} bg={bgInput} borderColor={borderColor} placeholder="Histórico no último ano..." />
        </FormControl>
        <FormControl>
          <FormLabel color={textColor}>Cognição (Mini-Mental/Relógio)</FormLabel>
          <Input name="cognicao_escore" value={formData.cognicao_escore || ''} onChange={handleChange} bg={bgInput} borderColor={borderColor} placeholder="Pontuação ou observação..." />
        </FormControl>
      </SimpleGrid>
      <FormControl>
        <FormLabel color={textColor}>Avaliação Geriátrica Ampla (AGA) / Funcionalidade</FormLabel>
        <Textarea name="aga_funcionalidade" value={formData.aga_funcionalidade || ''} onChange={handleChange} bg={bgInput} borderColor={borderColor} placeholder="AVDs e AIVDs, continência, humor..." rows={3} />
      </FormControl>
      <FormControl>
        <FormLabel color={textColor}>Polifarmácia (Medicamentos em uso)</FormLabel>
        <Textarea name="polifarmacia" value={formData.polifarmacia || ''} onChange={handleChange} bg={bgInput} borderColor={borderColor} rows={2} />
      </FormControl>
    </VStack>
  );
}