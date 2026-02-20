import React from 'react';
import { FormControl, FormLabel, Textarea, VStack } from '@chakra-ui/react';

export default function NutrologiaFields({ formData, handleChange, bgInput, borderColor, textColor }) {
  return (
    <VStack spacing={4} align="stretch">
      <FormControl>
        <FormLabel color={textColor}>Recordatório Alimentar (24h) / Hábitos</FormLabel>
        <Textarea name="recordatorio_alimentar" value={formData.recordatorio_alimentar || ''} onChange={handleChange} bg={bgInput} borderColor={borderColor} placeholder="Café da manhã, almoço, jantar, lanches, ingestão hídrica..." rows={3} />
      </FormControl>
      <FormControl>
        <FormLabel color={textColor}>Suplementação e Vitaminas em Uso</FormLabel>
        <Textarea name="suplementacao" value={formData.suplementacao || ''} onChange={handleChange} bg={bgInput} borderColor={borderColor} rows={2} />
      </FormControl>
    </VStack>
  );
}