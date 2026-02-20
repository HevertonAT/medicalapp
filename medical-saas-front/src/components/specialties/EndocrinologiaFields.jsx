import React from 'react';
import { FormControl, FormLabel, Textarea, Input, SimpleGrid, VStack } from '@chakra-ui/react';

export default function EndocrinologiaFields({ formData, handleChange, bgInput, borderColor, textColor }) {
  return (
    <VStack spacing={4} align="stretch">
      <SimpleGrid columns={2} spacing={4}>
        <FormControl>
          <FormLabel color={textColor}>Glicemia Capilar (mg/dL)</FormLabel>
          <Input name="glicemia_capilar" value={formData.glicemia_capilar || ''} onChange={handleChange} bg={bgInput} borderColor={borderColor} />
        </FormControl>
        <FormControl>
          <FormLabel color={textColor}>Alteração de Peso (kg)</FormLabel>
          <Input name="alteracao_peso" value={formData.alteracao_peso || ''} onChange={handleChange} bg={bgInput} borderColor={borderColor} placeholder="Ex: Perdeu 5kg em 2 meses" />
        </FormControl>
      </SimpleGrid>
      <FormControl>
        <FormLabel color={textColor}>Sintomas Metabólicos / Tireoidianos</FormLabel>
        <Textarea name="sintomas_metabolicos" value={formData.sintomas_metabolicos || ''} onChange={handleChange} bg={bgInput} borderColor={borderColor} placeholder="Polidipsia, poliúria, intolerância ao frio/calor..." rows={2} />
      </FormControl>
    </VStack>
  );
}